angular.module("recorder-directive").factory('recorderHelpers', function ($q) {
    var floatTo16BitPCM = function (output, offset, input){
        for (var i = 0; i < input.length; i++, offset+=2){
            var s = Math.max(-1, Math.min(1, input[i]));
            output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
    };
        
    var writeString = function (view, offset, string){
        for (var i = 0; i < string.length; i++){
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    var encodeWAV = function (config){
        console.log('alalala');
        var CHUNK_ID = 'RIFF';
        var TYPE = 'WAVE';
        var FORMAT_CHUNK_ID = 'fmt ';
        var DATA_CHUNK_ID = 'data' ;
        var BIT_LEN = 16;
        var BYTE_PER_SAMPLE = ( BIT_LEN / 8 );
        var cur = 0;

        var view = new DataView(new ArrayBuffer(44 + config.samples.length * 2));

        /* RIFF identifier */
        writeString(view, cur, CHUNK_ID);
        cur+= CHUNK_ID.length;

        /* file length */
        view.setUint32(cur, 36 + config.samples.length * BYTE_PER_SAMPLE, true);
        cur += 4;

        /* RIFF type */
        writeString(view, cur, TYPE);
        cur += TYPE.length;

        /* format chunk identifier */
        writeString(view, cur, FORMAT_CHUNK_ID);
        cur += FORMAT_CHUNK_ID.length;

        /* format chunk length */
        view.setUint32(cur, 16, true);
        cur += 4;

        /* sample format (raw) */
        view.setUint16(cur, 1, true);
        cur += 2;

        /* channel count */
        view.setUint16(cur, config.channels.length, true);
        cur += 2;

        /* sample rate */
        view.setUint32(cur, config.rate, true);
        cur += 4;

        /* byte rate (sample rate * block align) */
        view.setUint32(cur, config.rate * BYTE_PER_SAMPLE * config.channels.length, true);
        cur += 4;

        /* block align (channel count * bytes per sample) */
        view.setUint16(cur, config.channels.length * BYTE_PER_SAMPLE, true);
        cur += 2;

        /* bits per sample */
        view.setUint16(cur, BIT_LEN, true);
        cur += 2;

        /* data chunk identifier */
        writeString(view, cur, DATA_CHUNK_ID);
        cur += DATA_CHUNK_ID.length;

        /* data chunk length */
        view.setUint32( cur, config.samples.length * BYTE_PER_SAMPLE, true);
        cur += 4;

        floatTo16BitPCM(view, cur, config.samples);

        return view;
    };

    return {
        floatTo16BitPCM: floatTo16BitPCM,
        writeString: writeString,
        encodeWAV: encodeWAV
    };
});