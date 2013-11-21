angular.module("recorder-directive", []).directive('recorder', function ($q, $timeout, recorderHelpers){
    return {
        restrict: "E",
        scope: false,
        replace: false,
        transclude: true,
        template: '<div class="recorder" ng-transclude></div>',

        link: function(scope, element, attrs, controller) {
            // console.log('linking');
            var ID_SWF = 'playcorder';
            var params = {};
            scope.recordings = [];

            var curGUID;

            var playBuffer = function(buffer) {
                var AudioContext = webkitAudioContext || mozAudioContext;

                if ( !AudioContext )
                {
                    return;
                }

                var audioContext = new AudioContext();

                console.log('audio api instantiated');

                try{
                    var audioBuffer = audioContext.createBuffer( 
                        buffer, sharedDownloadObject.channels.length == 1
                        // obj.channels.length, obj.length, obj.rate
                    );
                }
                catch(ex){
                    console.log(ex)
                }

                console.log('audio buffer created', audioBuffer);
                var source = audioContext.createBufferSource();
                console.log('source created');
                source.connect(audioContext.destination);
                console.log('destination connected');
                source.buffer = audioBuffer;
                console.log('buffer assigned')
                source.start(0);
                console.log('started')
            }

            var fetchRaw = function() {
                var downloadGuid;
                var deferred = $q.defer();
                // console.log('start raw');
                rec.recorder.result.ondownloaded = function(obj){
                    if ( downloadGuid !== obj.guid ){
                        return;
                    }

                    // try to convert it to arraybuffer
                    if ( !ArrayBuffer ){
                        return;
                    }

                    var ab = new ArrayBuffer( obj.data.length );
                    var ui8a = new Uint8Array(ab);

                    for( var i = 0; i < obj.data.length; i++ )
                    {
                        ui8a[ i ] = obj.data[i];
                    }

                    // console.log('audio data length: ' + obj.length);

                    deferred.resolve({
                        id: obj.guid,
                        arrayBuffer: ab,
                        downloadObject: obj
                    });

                };

                rec.recorder.result.ondownloadfailed = function(obj)
                {
                    if ( downloadGuid !== obj.guid ){
                        return;
                    }

                    // console.log('downloading failed: ' + obj.message);
                };

                // try to download data
                downloadGuid = rec.recorder.result.download( );
                
                return deferred.promise;
            };

            var fetchWav = function(rawAudio){
                var deferred = $q.defer();
                // get samples
                // console.log('generating wav');
                var dv = new DataView( rawAudio.arrayBuffer );
                var samples = [];
                var obj = rawAudio.downloadObject;
                // console.log(obj.length);

                var cur = 0;
                while( cur < dv.byteLength )
                {
                    samples.push(dv.getFloat32(cur));
                    cur+=4;
                }

                // console.log('sample length: ', samples.length);

                // convert to wave
                var wavView = recorderHelpers.encodeWAV({
                    rate: obj.rate === 44 ? 44100 : 0,
                    channels: obj.channels,
                    samples: samples
                });

                deferred.resolve(wavView.buffer);

                // console.log('wav done', wavView);

                // display it 
                // var ui8a = new Uint8Array( wavView.buffer );
                // var arr = [];
                
                // for(var i = 0; i < ui8a.length;i++){
                //     arr.push(ui8a[i]);
                // }

                // btnPlayBuffer.removeAttribute('disabled');
                return deferred.promise;
            };

            params.quality = "high";
            params.wmode = "transparent";
            params.allowscriptaccess = "always";
            params.allowfullscreen = "false";

            scope.status = "waiting";

            swfobject.embedSWF(
                "./vendor/Playcorder.swf",
                "flash-approval",
                "215", "140",
                "11.9.0", "playerProductInstall.swf",
                {}, params, {
                    id: ID_SWF,
                    name: ID_SWF
                }, function( result ){
                    // console.log('SWF');
                    window.rec = result.ref;

                    rec.onready = function() {
                        // console.log('rec is ready');
                        

                        rec.recorder.initialize({
                            gain:100, 
                            rate:44, 
                            silence:0, 
                            quality: 9,
                            type: 'local'
                        });

                        rec.recorder.onstarted = function(evt) {
                            if ( evt.guid !== curGUID) 
                            {
                                return;
                            }
                            scope.status = "recording";
                            // console.log("recording");
                        };

                        rec.recorder.onstopped = function(evt) {
                            if ( evt.guid !== curGUID) 
                            {
                                return;
                            }
                            // scope.status = "waiting";
                            fetchRaw().then(function(rawAudio){
                                // console.log(rawAudio);
                                scope.recordings.push(rawAudio);
                                fetchWav(rawAudio).then(function(wavAudio){
                                    playBuffer(wavAudio);
                                    scope.status = "waiting";
                                    // console.log("waiting");
                                });
                                
                            });
                        };
                    };
                }
            );

            scope.startRecording = function() {
                curGUID = rec.recorder.start();
                // console.log( curGUID );
            };

            scope.stopRecording = function() {
                rec.recorder.stop();
            };


        }
    };
});
