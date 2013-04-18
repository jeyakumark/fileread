FreeSpeech
==========

FreeSpeech is a Cordova/Phonegap app for guiding, recording and annotating interviews.

All the question transitions are logged making it possible to tell
where in the recording a particular question is being answered.
In addition, the interviewer can use tags to mark particular timepoints during the interview.

The app also includes a playback view that shows annotations on the audio timeline,
and it has a view for searching through all interviews for responces to particular questions.


File Structure
--------------

All interivews and data are currently stored in the `interview_app` directory.

interviews -- interview definitions

interview_data -- collected data

interview_data/[interivew name]/[session id].amr

interview_data/[interivew name]/[session id].json

interview_data/[interivew name]/[session id].[tagger id].tags.json

Sycning with Desktop
--------------------

DropSync can be used to sync the `interview_app` directory with a dropbox folder.
This data can then be downloaded by FreeSpeech in a desktop browser using the File System API.
However, this path is in progress. Audio playback uses a different API in Cordova and
there is currently no codec for playing .amr files in browsers.

Media Capture Issues
--------------------

Cordova has a Media object can handle recording, however recording in the browser would require a different mechanism:

http://chromium.googlecode.com/svn/trunk/samples/audio/index.html

https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/webrtc-integration.html

Also, the cordova media object outputs different formats on different platforms.

Audio playback
--------------

For playback from the cloud we'll probably need to download audio through the dropbox api
as data. I hope datauris are supported for audio.

Encryption
----------

If encryption turns out to be necessairy we can encrypt audio in JS prior to saving with [this library](http://crypto.stanford.edu/sjcl/).

TODO:
-----

1. Make page links open a menu in explorer, with options to view the original question or filter by it?
2. Older adroid device does not seem to be seeking correctly.
3. Playback and recording in desktop browsers.


Other tools
------------

[TagPad](https://github.com/barbro66/tagpad)

 * A similar tool for the iPad

[Atlas.TI](http://www.atlasti.com/)

 * [Does everything](http://www.atlasti.com/features.html)
 * But no interview guide tool and does not appear to have cloud functionality. (This is useful because there will probably be multiple reviewers).
 * Expensive (500 euros and above, free version limits amount of data)

[Max QDA](http://www.maxqda.com)

 * [Mobile app but no apparent integration with interview guide](http://www.maxqda.com/products/maxqda11/mobile-app/maxapp-features)
 * About as expensive as Atlas

I think it would be a good idea to look into integrating with Atlas/Max for complex use cases, but to try to keep the core interviewing app simple enough for people to just pick up and use without having to spend time learning how it works.

ODK Collect with audio inputs

 * Each question must be recorded individually.
 
SmartPen

 * Pen may have some limitations in data exploration area.
 * It may also have benefits (full text search)
 * It has a greater cost if you already have a device.
 * The interaction seems very different. I think some amount of study would be necessairy for full comparison.
