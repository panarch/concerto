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
        this.onPlaying = false;
    }

    // private

    function NoteQueue(musicjson) {
        var parts = musicjson['part'];
        // merged notes
        this.notes = [];
        this.pageCounts = [];
        this.measureCounts = [];
        this.count = 0;
        var measures = parts[0]['measure'];

        for (var i = 0; i < measures.length; i++) {
            var _measure = measures[i];
            if (_measure['print'] && _measure['print']['@new-page'])
                this.pageCounts.push(this.notes.length);

            merge.call(this, i);
            this.measureCounts.push(this.notes.length);
        }

        function merge(measureIndex) {
            var voices = [];
            var durations = [];
            // split voices first...
            for (var p = 0; p < parts.length; p++) {
                var measure = parts[p]['measure'][measureIndex];
                var notes = measure['note'];
                var _voices = _splitVoices(notes);
                for (var _i = 0; _i < _voices.length; _i++) {
                    voices.push(_voices[_i].slice());
                    durations.push(0);
                }
            }

            // get min duration index and get voice
            // and then... pop note and push to this.notes and add duration
            var index = getMinimumIndex(durations);
            while (index !== undefined) {
                var voice = voices[index];
                // pop note until chord end
                var note = voice[0];
                while (note['tag'] !== 'note') {
                    voice.splice(0, 1);
                    note = voice[0];

                    if (!note)
                        break;
                }

                if (!note) {
                    durations[index] = Infinity;
                    index = getMinimumIndex(durations);
                    continue;
                }

                this.notes.push(note);
                voice.splice(0, 1);
                durations[index] += note['duration'];

                // handle chord notes
                note = voice[0];
                while (note && note['chord']) {
                    this.notes.push(note);
                    voice.splice(0, 1);
                    note = voice[0];
                }

                // check voice.length
                if (voice.length === 0)
                    durations[index] = Infinity;

                index = getMinimumIndex(durations);
            }
        }

        function getMinimumIndex(durations) {
            var minIndex;
            var min = Infinity;
            for (var _i = 0; _i < durations.length; _i++) {
                var d = durations[_i];
                if (d < min) {
                    minIndex = _i;
                    min = d;
                }
            }

            return minIndex;
        }
    }

    NoteQueue.prototype.pop = function() {
        var note = this.notes[0];
        this.notes.splice(0, 1);
        this.count++;
        var result = {
            note: note
        };

        if (this.count > this.pageCounts[0]) {
            this.pageCounts.splice(0, 1);
            result.newPage = true;
        }

        if (this.count > this.measureCounts[0]) {
            this.measureCounts.splice(0, 1);
            if (this.measureCounts.length > 0)
                result.newMeasure = true;
        }

        return result;
    };

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
     * @param {Array.<Object>} notes
     * @return {Array.<Array.<Object>>}
     */
    function _splitVoices(notes) {
        var voices = [];
        var lastIndex = 0;
        for (var i = 0; i < notes.length; i++) {
            if (notes[i]['tag'] === 'backup') {
                voices.push(notes.slice(lastIndex, i));
                lastIndex = i + 1;
            }
        }

        if (lastIndex < notes.length)
            voices.push(notes.slice(lastIndex));

        return voices;
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
                    // use channel 15 for ghost duration
                    track.addNoteOn(15, 'c5', 1, 1);
                    track.addNoteOff(15, 'c5', d - 1, 1);
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

        var sumMaxDuration = 0;
        for (i = 0; i < measuresLength; i++) {
            var maxDuration = _getMaxDuration.call(this, i);
            maxDuration /= quarterDuration;

            for (p = 0; p < parts.length; p++) {
                var measure = parts[p]['measure'][i];
                var voices = _splitVoices(measure['note']);
                for (var j = 0; j < voices.length; j++) {
                    var trackIndex = p * 4 + j;
                    var track;
                    if (tracks[trackIndex] === undefined) {
                        track = new Midi.Track();
                        if (sumMaxDuration > 0) {
                            track.addNoteOn(15, 'c5', 1, 1);
                            track.addNoteOff(15, 'c5', sumMaxDuration - 1, 1);
                        }
                        this.file.addTrack(track);
                        tracks[trackIndex] = track;
                    }
                    else
                        track = tracks[trackIndex];

                    var notes = voices[j];
                    run(p, track, 0, notes, 0, maxDuration);
                }
            }

            sumMaxDuration += maxDuration;
        }

        MIDI.Player.timeWarp = 1; // speed the song is played back
        MIDI.Player.currentData = this.file.toBytes();
        MIDI.Player.loadMidiFile();
        L.debug('Finished generating midi file');
    }

    /**
     * @this {Player}
     */
    function _playCallback(data, callback) {
        if (data.now >= data.end)
            this.stop();

        // send position & size info of player bar to callback
        // note on & channel !== 15
        if (data.channel === 15 || data.message !== 144) {
            return;
        }

        var item = this.queue.pop();
        if (item.newPage) {
            // next page
            this.page++;
            this.ctx = this.renderer.getContext(this.page).paper;
            this.bar.remove();
            this.bar = _createBar.call(this);
        }

        if (item.newMeasure) {
            this.measureCount++;
            this.barY = this.topMeasures[this.measureCount]['top-line-y'] - 20;
        }

        var note = item.note;
        if (!note) {
            L.warn('Broken sync between midi playing and visualizer ' + JSON.stringify(data));
            return;
        }

        if (!note['staveNote'] || !note['staveNote'].note_heads)
            return;

        var x = note['staveNote'].note_heads[0].getAbsoluteX();

        this.bar.attr({
            x: x - 2,
            y: this.barY
        });
    }

    function _createBar() {
        var x = -100;
        var b = this.barSize;
        var bar = this.ctx.rect(x, this.barY, b.w, b.h);
        bar.attr({
            fill: '#3333cc',
            opacity: 0.4,
            stroke: '#3333cc'
        });
        return bar;
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
     * @param {callback} callback
     * @return {boolean}
     */
    Player.prototype.play = function play(callback) {
        if (!this.loaded)
            return false;

        _generateMidiFile.call(this);

        MIDI.Player.stop();
        MIDI.Player.addListener(listener.bind(this));
        MIDI.Player.start();
        var musicjson = this.renderer.getMusicjson();
        this.topMeasures = musicjson['part'][0]['measure'];
        this.queue = new NoteQueue(musicjson);
        this.page = 0;
        this.ctx = this.renderer.getContext(this.page).paper;
        this.barSize = getBarSize.call(this, musicjson);
        this.bar = _createBar.call(this);
        this.measureCount = 0;
        this.barY = this.topMeasures[this.measureCount]['top-line-y'] - 20;

        function listener(data) {
            _playCallback.call(this, data, callback);
        }

        function getBarSize(musicjson) {
            var parts = musicjson['part'];
            var w = 14;

            var topMeasure = parts[0]['measure'][0];
            var bottomMeasure = parts[parts.length - 1]['measure'][0];
            var h = bottomMeasure['bottom-line-y'] - topMeasure['top-line-y'] + 40;
            return {
                w: w,
                h: h
            };
        }

        this.onPlaying = true;
        return true;
    };

    Player.prototype.stop = function stop() {
        if (!this.onPlaying)
            return;

        this.queue = undefined;
        this.onPlaying = false;

        if (this.bar)
            this.bar.remove();

        MIDI.Player.stop();
    };

    module.exports = Player;
});
