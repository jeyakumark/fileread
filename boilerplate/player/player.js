//TODO: It would be nice to have a way to pass in media files with different offsets.
//(i.e. pass in a shortened clip from an interview)
//Also, it would be nice to have a way to use media files with pauses in them.
//Handling pauses would be really tricky, so I probably won't bother.
//The popcorn.js movie maker has an interesting way of handling skips that might
//be applicable.
define(['config', 'backbone', 'underscore', 'text!player/playerTemplate.html', 'text!player/logItemTemplate.html', 'Popcorn'],
function(config,   Backbone,   _,            playerTemplate,                    logItemTemplate){
    var compiledPlayerTemplate = _.template(playerTemplate);
    var compiledLogItemTemplate  = _.template(logItemTemplate);
    
    var getMediaPhonegap = function(path, callback) {
        var media = new Media(path,
        function(){},
        function(err){
            console.error("Media error:");
            console.error(err);
        });
        media.seekTo(0);
        var attempts = 10;
        function waitForDuration(){
            if(attempts === 0) {
                alert("Could not get media duration");
                return;
            }
            attempts--;
            if(media.getDuration() > 0) {
                callback(media);
            } else {
                window.setTimeout(waitForDuration, 100);
            }
        }
        waitForDuration();
    };
    
    var getMediaDebug = function(path, callback) {
        var $audioContainer = $('<div style="height:400px" id="dbgAudioContainer">');
        $('body').append($audioContainer);
        /*
        var myAudio = Popcorn.youtube($audioContainer.get(0), 'http://www.youtube.com/watch?v=oozJH6jSr2U&width=0&height=0' );
        */
        
        var myAudio = Popcorn.smart(
         "#dbgAudioContainer",
         'http://cuepoint.org/dartmoor.mp4');
         
        
        window.audioDbg = myAudio;
        myAudio.on("loadedmetadata", function() {
            myAudio.off("loadedmetadata");
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
                seekTo: function(millis){
                    console.log("seeking to: " + millis);
                    //myAudio.currentTime = timeSeconds;
                    myAudio.currentTime(Math.floor(millis / 1000));
                    //myAudio.currentTime = Math.floor(millis / 1000);
                }
            });
        });
    };
    
    var getMedia = function(path, callback) {
        //TODO: Download media into temporairy fs if not present? Maybe it is better to just sync everything up front for now.
        //TODO: Figure out how to play audio from chrome.
        if('Media' in window){
            getMediaPhonegap(path, callback);
        } else {
            getMediaDebug(path, callback);
        }
    };
    
    
    var PlayerModel = Backbone.Model.extend({
        validate: function(attrs) {
            if (attrs.time >= this.get("duration") || attrs.time < 0) {
                console.error("Time out of bounds");
                console.error(attrs.time);
                return "Time out of bounds";
            }
        },
        setProgress: function(progressPercentage){
            this.set({
                "progress": progressPercentage,
                "time": ((progressPercentage / 100) * this.get("duration"))
            });
            return this;
        },
        setTime: function(timeSeconds) {
            this.set({
                "progress": (timeSeconds / this.get("duration")) * 100,
                "time": timeSeconds
            });
            return this;
        }
    });
    
    var PlayerView = Backbone.View.extend({
        //updater tracks the setInterval() id.
        updater: null,
        template: compiledPlayerTemplate,
        render: function() {
            console.log('PlayerView:render');
            var context = this.model.toJSON();
            this.$el.html(this.template(context));
            return this;
        },
        events: {
            'click #seeker' : 'seek',
            'click #play' : 'play',
            'click #pause' : 'pause',
            'click #stop' : 'stop',
            'click .seek-offset' : 'goback',
            'click #nextLogItem' : 'nextLogItem'
        },
        nextLogItem: function(evt){
            this.model.setTime(this.options.logItems.getNextLogItem(this.model.get('time')));
        },
        goback: function(evt){
            var $button = $(evt.target).closest(".seek-offset");
            var offest = $button.data('offset');
            var newTime = Math.max(0, this.model.get('time') + parseInt(offest, 10));
            if(_.isNaN(newTime)) return;
            console.log("newTime", newTime, offest);
            this.model.setTime(newTime);
            console.log('seeking media to: ' + newTime * 1000);
            this.options.media.seekTo(newTime * 1000);
            return this;
        },
        seek: function(evt){
            console.log('seek');
            if(window.chrome) console.log(evt);
            var $seeker = $(evt.currentTarget);
            //Problem: firefox doesn't have offsetX
            var progressPercentage = (evt.offsetX * 100 / $seeker.width());
            this.model.setProgress(progressPercentage);
            console.log('seeking media to: ' + this.model.get('time') * 1000);
            this.options.media.seekTo(this.model.get('time') * 1000);
            return this;
        },
        play: function(evt){
            console.log('play');
            if(window.chrome) console.log(evt);
            var that = this;
            var playerModel = this.model;
            if(playerModel.get('playing')){
                return;
            }
            playerModel.set('playing', true);
            this.options.media.play();
            this.updater = setInterval(function(){
                //TODO: Add failure function that pauses and goes to start/end
                that.options.media.getCurrentPosition(function(positionSeconds){
                    console.log(positionSeconds);
                    if(playerModel.get('time') === positionSeconds){
                        that.$('#progressBar').addClass('halted');
                    } else {
                        playerModel.setTime(positionSeconds);
                    }
                });
            }, 1000);
            return this;
        },
        pause: function(evt){
            console.log('pause');
            if(window.chrome) console.log(evt);
            if(!this.model.get('playing')){
                console.log("not playing");
                return;
            }
            clearInterval(this.updater);
            this.model.set('playing', false);
            this.options.media.pause();
            return this;
        },
        stop: function(evt){
            console.log('stop');
            if(window.chrome) console.log(evt);
            if(!this.model.get('playing')){
                return;
            }
            clearInterval(this.updater);
            this.options.media.stop();
            this.model.set('playing', false);
            this.model.setTime(0);
            return this;
        }
    });
    
    var create = function(context){
        var startTime = context.startTime || 0;
        var session = context.session;
        if(!session) {
            alert("No session id. Debug mode.");
            session = new Backbone.Model({
                startTime: new Date(0),
                endTime: 60000
            });
        }
        var logItems = session.Log;
        
        getMedia(session.get('_recordingPath'), function(media){
            //Note:
            //The timeline shows the session duration rather than the recording duration.
            //This means that we need to be careful when seeking as these might have some discrepancies...
            var sessionDuration = session.get('endTime') - session.get('startTime');
            console.log("session duration:" + sessionDuration);
            
            if(!(media.getDuration() > 0)){
                alert("Could not get media duration, be sure it is loaded before passing it to player.create()");
            }
            if(media.getDuration() === Infinity) {
                alert("Media is infinately long?");
            }
            
            var player = new PlayerModel({
                //Progress as a percentage:
                progress: 0,
                //Time in seconds
                //(note that this lags behind the actual media object's time)
                time: 0,
                duration: sessionDuration / 1000,
                playing: false
            });
            
            console.log("Start time: " + startTime);
            //Setting the start time is a bit inelegant right now.
            player.setTime(startTime / 1000);
            media.seekTo(startTime);
            
            var $playerControls = $('<div class="player">');
            var $markers = $('<div id="logItemContainer">');
            var $info = $('<div id="logItemInfo">');
            
            $(context.el)
                .empty()
                .append($playerControls)
                .append($markers)
                .append($info);
            
            var selectedLogItem = null;
            var updateMarkers = function(){
                console.log("updateMarkers");
                $markers.empty();
                //Track current log item in url for navigation?
                logItems.each(function(logItem){
                    var millisOffset = logItem.get('_timestamp') - session.get('startTime');
                    var logItemProgress = (millisOffset / 1000) / player.get("duration");
                    var $marker = $('<div class="logItemMarker">');
                    $marker.css("left", logItemProgress * 100 + '%');
                    window.x = logItem.get('_timestamp'); window.y = session.get('startTime');
                    $markers.append($marker);
                    $marker.click(function(){
                        selectedLogItem = logItem;
                        updateMarkers();
                    });
                    if(selectedLogItem === logItem){
                        $marker.addClass("selected");
                        try{
                            $info.html(compiledLogItemTemplate(logItem.toJSON()));
                        } catch(e) {
                            alert("Could not render template.");
                            console.error(e);
                            return;
                        }
                        $info.find('.playhere').click(function(evt){
                            player.setTime(millisOffset / 1000);
                            media.seekTo(millisOffset);
                        });
                    }
                });
            };
            
            var playerView = new PlayerView({
                model: player,
                media: media,
                logItems: logItems
            });
            player.on("change", playerView.render, playerView);
            
            updateMarkers();
            
            player.on("error", playerView.pause, playerView);
            
            playerView.setElement($playerControls.get(0));
            playerView.render();
            
            //It might be a good idea to lazy load the tag layers.
            session.fetchTagLayers({
                dirPath: config.appDir,
                success: function() {
                    console.log("Tag Layers:", session.tagLayers);
                }
            });
        });

        return this;
	};
    
	return {
        create: create
    };
    
});
