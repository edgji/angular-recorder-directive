(function () {
  'use strict';
  angular.module('recorder-directive', []).directive('recorder', function () {
    return {
      restrict: 'E',
      scope: false,
      replace: false,
      transclude: true,
      template: '<div class="recorder" ng-transclude></div>',
      link: function (scope, element, attrs, controller) {
      }
    };
  });
  angular.module('recorder-directive').factory('audioHelpers', [
    '$q',
    function ($q) {
      var floatTo16BitPCM = function (output, offset, input) {
        for (var i = 0; i < input.length; i++, offset += 2) {
          var s = Math.max(-1, Math.min(1, input[i]));
          output.setInt16(offset, s < 0 ? s * 32768 : s * 32767, true);
        }
      };
      var writeString = function (view, offset, string) {
        for (var i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      var encodeWAV = function (config) {
        var CHUNK_ID = 'RIFF';
        var TYPE = 'WAVE';
        var FORMAT_CHUNK_ID = 'fmt ';
        var DATA_CHUNK_ID = 'data';
        var BIT_LEN = 16;
        var BYTE_PER_SAMPLE = BIT_LEN / 8;
        var cur = 0;
        var view = new DataView(new ArrayBuffer(44 + config.samples.length * 2));
        writeString(view, cur, CHUNK_ID);
        cur += CHUNK_ID.length;
        view.setUint32(cur, 36 + config.samples.length * BYTE_PER_SAMPLE, true);
        cur += 4;
        writeString(view, cur, TYPE);
        cur += TYPE.length;
        writeString(view, cur, FORMAT_CHUNK_ID);
        cur += FORMAT_CHUNK_ID.length;
        view.setUint32(cur, 16, true);
        cur += 4;
        view.setUint16(cur, 1, true);
        cur += 2;
        view.setUint16(cur, config.channels.length, true);
        cur += 2;
        view.setUint32(cur, config.rate, true);
        cur += 4;
        view.setUint32(cur, config.rate * BYTE_PER_SAMPLE * config.channels.length, true);
        cur += 4;
        view.setUint16(cur, config.channels.length * BYTE_PER_SAMPLE, true);
        cur += 2;
        view.setUint16(cur, BIT_LEN, true);
        cur += 2;
        writeString(view, cur, DATA_CHUNK_ID);
        cur += DATA_CHUNK_ID.length;
        view.setUint32(cur, config.samples.length * BYTE_PER_SAMPLE, true);
        cur += 4;
        floatTo16BitPCM(view, cur, config.samples);
        return view;
      };
      return {
        floatTo16BitPCM: floatTo16BitPCM,
        writeString: writeString,
        encodeWAV: encodeWAV
      };
    }
  ]);
}());