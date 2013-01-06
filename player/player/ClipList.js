define(['backbone', 'underscore', 'player', 'text!clipTemplate.html', 'text!resultsTemplate.html'],
function(Backbone,   _,            player,   clipTemplate,             resultsTemplate){
    var ListView = Backbone.View.extend({
        orderVar: 1,
        render: function() {
            console.log('render');
            var that = this;
            this.$el.html(resultsTemplate);
            var resultsList = this.$('#result-list');
            this.collection.each(function(logItem){
                var $logItemDom = $(_.template(clipTemplate)({
                    logItem : logItem.toJSON(),
                    duration : 10 //Set this in the log stage?
                }));
                resultsList.append($logItemDom);
                $logItemDom.find('.play-btn').click(function(e){
                    if(window.chrome) console.log(e);
                    console.log('playClip');
                    console.log(logItem);
                    var $clipPlayArea = $(e.target).closest('.play-area');
                    //TODO: Not sure if this will work
                    //$mediaContainer.css("display", "none");
                    var $playerContainer = $('<div id="player-container">');
                    $clipPlayArea.empty();
                    $clipPlayArea.append($playerContainer);
                    //Get recordings directory.
                    //TODO: Get interview name from Sessions collection
                    //var myAudio = new Media(logItem.sessionId +".amr");
                    //Getting the session will also make it easier to get rid
                    //of the _recordingStart param.
                    function getMediaCordova(callback){
                        callback(new Media("http://audio.ibeat.org/content/p1rj1s/p1rj1s_-_rockGuitar.mp3",
                        function(){},
                        function(err){
                            alert("error");
                            console.log(err);
                        }));
                    }
                    function getMediaPopcorn(callback) {
                        var $mediaContainer = $('<div id="media-container">');
                        $clipPlayArea.append($mediaContainer);
                        var myAudio = Popcorn.youtube($mediaContainer.get(0), 'http://www.youtube.com/watch?v=HgzGwKwLmgM&width=0&height=0');
                        console.log('loading popcorn content...');
                        myAudio.on("loadedmetadata", function(evt) {
                            console.log('loadedmetadata');
                            myAudio.off("loadedmetadata");
                            //We need to load metadata first so duration related computations work.
                            callback({
                                play: function(){
                                    myAudio.play();
                                },
                                pause: function(){
                                    myAudio.pause();
                                },
                                stop: function(){
                                    myAudio.stop();
                                },
                                getCurrentPosition: function(mediaSuccess, mediaError){
                                    //mediaSuccess(myAudio.currentTime);
                                    mediaSuccess(myAudio.currentTime());
                                },
                                getDuration: function(){
                                    //return myAudio.duration;
                                    return myAudio.duration();
                                },
                                seekTo: function(timeSeconds){
                                    //myAudio.currentTime = timeSeconds;
                                    myAudio.currentTime(timeSeconds);
                                }
                            });
                        });
                    }
                    function getMedia(callback) {
                        var myAudio = new Audio();
                        myAudio.src = 'http://www.html5rocks.com/en/tutorials/audio/quick/test.ogg';
                        myAudio.addEventListener("loadedmetadata", function(evt) {
                            callback({
                                play: function(){
                                    myAudio.play();
                                },
                                pause: function(){
                                    myAudio.pause();
                                },
                                stop: function(){
                                    myAudio.stop();
                                },
                                getCurrentPosition: function(mediaSuccess, mediaError){
                                    //mediaSuccess(myAudio.currentTime);
                                    mediaSuccess(myAudio.currentTime);
                                },
                                getDuration: function(){
                                    //return myAudio.duration;
                                    return myAudio.duration;
                                },
                                seekTo: function(timeSeconds){
                                    //myAudio.currentTime = timeSeconds;
                                    myAudio.currentTime = timeSeconds;
                                }
                            });
                        });
                    }
                    getMedia(function(media){
                        player.create({
                            containerEl: $playerContainer.get(0),
                            media: media,
                            //TODO: Do a fetch here?
                            //This is just for playing the clip though.
                            //Maybe not needed.
                            logItems: new Backbone.Collection(),
                            //Where to store the recording's start time?
                            start: (logItem.get('_timestamp') - logItem.get('_recordingStart')) / 1000
                        });
                    });
                });
            });
        },
        events: {
            'click .sort' : 'sort'
        },
        genComparator : function(cfunc, incr) {
            if(!incr) {
                incr = 1;
            }
            return function(Ain, Bin) {
                var A = cfunc(Ain);
                var B = cfunc(Bin);
                if(A < B) return -incr;
                if(A > B) return incr;
                if(A == B) return 0;
            };
        },
        sort: function(e) {
            console.log('sort');
            console.log(e);
            var sortParam = this.$('#sortParam');
            this.orderVar = -this.orderVar;
            this.collection.comparator = this.genComparator(function(entry) {
                return entry.get(sortParam);
            }, this.orderVar);
            this.collection.sort();
            this.render();
            return this;
        }
    });
	return ListView;
});
