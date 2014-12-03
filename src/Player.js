// Concerto Base Libraries.
// Taehoon Moon <panarch@kaist.ac.kr>
//
// Player
//
// Copyright Taehoon Moon 2014

define(function(require, exports, module) {
    /**
     * @callback callback
     */

    var Midi = require('jsmidgen');
    var MIDI = require('midi');
    var L = require('js-logger').get('Player');

    var QUARTER_DURATION = 128;

    /**
     * @constructor
     * @template Player
     */
    function Player(renderer) {
        this.renderer = renderer;
        this.loaded = false;
    }

    /**
     * @param {Array.<Object>} notes
     * @return {number}
     */
    function _getMaxNotesDuration(notes) {
        var max = -Infinity;
        var sum = 0;

        // backup --> voice change
        for (var i = 0; i < notes.length; i++) {
            var note = notes[i];
            if (note['tag'] === 'backup') {
                if (sum > max)
                    max = sum;
                sum = 0;
                continue;
            }
            else if (note['tag'] === 'note' && !note['chord'] && note['duration']) {
                sum += note['duration'];
                continue;
            }
        }

        if (sum > max)
            max = sum;

        return max;
    }

    // private

    /**
     * @this {Player}
     * @param {number} measureIndex
     * @return {number}
     */
    function _getMaxDuration(measureIndex) {
        var parts = this.renderer.getMusicjson()['part'];
        var maxDuration = -Infinity;
        for (var p = 0; p < parts.length; p++) {
            var measure = parts[p]['measure'][measureIndex];
            var duration = _getMaxNotesDuration(measure['note']);
            if (duration > maxDuration)
                maxDuration = duration;
        }
        return maxDuration * QUARTER_DURATION;
    }

    /**
     * @param {Object} note
     * @return {number}
     */
    function _convertPitch(note) {
        // C4 is 60, CDEFGAB, octave
        // A0 is 21
        var pitch = note['pitch'];
        var step = pitch['step'];
        var octave = pitch['octave'];

        var divStep = 'CDEFGAB'.indexOf(step) * 2;
        // 0 2 4 5 7 9 11
        if (divStep > 5)
            divStep--;

        var divOctave = octave - 4; // basis on 60, C4
        var mpitch = 60 + divOctave * 12 + divStep;

        if (pitch['alter'])
            mpitch += pitch['alter'];

        return mpitch;
    }

    /**
     * @this {Player}
     */
    function _generateMidiFile() {
        var musicjson = this.renderer.getMusicjson();

        this.file = new Midi.File();
        var parts = musicjson['part'];
        var i;
        var p;
        var durations = [];
        var tracks = new Array(parts.length * 4);
        for (i = 0; i < tracks.length; i++)
            tracks[i] = undefined;

        // first part --> first measure --> first note(attributes) --> divisions
        var quarterDuration = parts[0]['measure'][0]['note'][0]['divisions'];
        var measuresLength = parts[0]['measure'].length;

        /**
         * @param {Array.<Object>} notes
         * @return {Array.<Array.<Object>>}
         */
        function splitVoices(notes) {
            var _voices = [];
            var lastIndex = 0;
            for (var _i = 0; _i < notes.length; _i++) {
                if (notes[_i]['tag'] === 'backup') {
                    _voices.push(notes.slice(lastIndex, _i));
                    lastIndex = _i + 1;
                }
            }

            if (lastIndex < notes.length)
                _voices.push(notes.slice(lastIndex));

            return _voices;
        }

        /**
         * @param {number} channel
         * @param {number} track
         * @param {number} duration
         * @param {Array.<Object>} notes
         * @param {number} i
         * @param {number} maxDuration
         * @param {Array.<Object>} chords
         */
        function run(channel, track, duration, notes, i, maxDuration, chords) {
            var d;

            function _flushChords() {
                if (!chords || chords.length === 0)
                    return;

                var _note = chords[0];
                pitch = _convertPitch(_note);
                track.addNoteOn(channel, pitch, 1);
                d = QUARTER_DURATION * _note['duration'] / quarterDuration;
                duration += d;

                var pitches = [];
                var _j;
                for (_j = 1; _j < chords.length; _j++)
                    pitches.push(_convertPitch(chords[_j]));

                for (_j = 0; _j < pitches.length; _j++)
                    track.addNoteOn(channel, pitches[_j]);

                track.addNoteOff(channel, pitch, d - 1);
                for (_j = 0; _j < pitches.length; _j++)
                    track.addNoteOff(channel, pitches[_j]);
            }

            if (i === notes.length) {
                _flushChords();
                chords = [];
                if (duration < maxDuration) {
                    d = maxDuration - duration;
                    track.addNoteOn(channel, 'c5', 1, 1);
                    track.addNoteOff(channel, 'c5', d - 1, 1);
                }
                return;
            }

            var pitch;
            var note = notes[i];

            // channel, pitch, time, velocity
            if (note['tag'] !== 'note') {
                next();
                return;
            }
            else if (note['rest']) {
                _flushChords();
                chords = [];

                d = QUARTER_DURATION * note['duration'] / quarterDuration;
                duration += d;
                track.addNoteOn(channel, 'c5', 1, 1);
                track.addNoteOff(channel, 'c5', d - 1, 1);
                durations += note['duration'];
            }
            else if (note['chord'])
                chords.push(note);
            else {
                _flushChords();
                // add to chords
                chords = [];
                chords.push(note);
            }

            next();

            function next() {
                run(channel, track, duration, notes, i + 1, maxDuration, chords);
            }
        }

        var channel = 1;
        for (i = 0; i < measuresLength; i++) {
            var maxDuration = _getMaxDuration.call(this, i);
            maxDuration /= quarterDuration;

            for (p = 0; p < parts.length; p++) {
                var measure = parts[p]['measure'][i];
                var voices = splitVoices(measure['note']);
                for (var j = 0; j < voices.length; j++) {
                    var trackIndex = p * 4 + j;
                    var track;
                    if (tracks[trackIndex] === undefined) {
                        track = new Midi.Track();
                        this.file.addTrack(track);
                        tracks[trackIndex] = track;
                    }
                    else
                        track = tracks[trackIndex];

                    var notes = voices[j];
                    run(channel, track, 0, notes, 0, maxDuration);
                }
            }
        }

        MIDI.Player.timeWarp = 1; // speed the song is played back
        MIDI.Player.currentData = this.file.toBytes();
        MIDI.Player.loadMidiFile();
        L.debug('Finished generating midi file');
    }

    /**
     * @this {Player}
     * @param {callback} callback
     */
    Player.prototype.load = function load(callback, soundfontUrl) {
        if (this.loaded) {
            callback();
            return;
        }

        // TODO: should parse musicjson and load proper instruments, currently only support piano
        MIDI.loadPlugin({
            soundfontUrl: soundfontUrl,
            instrument: 'acoustic_grand_piano',
            callback: _callback.bind(this)
        });

        function _callback() {
            this.loaded = true;
            callback();
        }
    };

    /**
     * @this {Player}
     * @return {boolean}
     */
    Player.prototype.play = function play() {
        if (!this.loaded)
            return false;

        _generateMidiFile.call(this);

        MIDI.Player.stop();
        // TODO: visualizing required
        function playCallback(data) {
            //L.debug(JSON.stringify(data));
        }

        MIDI.Player.addListener(playCallback);
        MIDI.Player.start();

        return true;
    };

    Player.prototype.stop = function stop() {
        MIDI.Player.stop();
    };

    module.exports = Player;
});
