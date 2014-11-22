// Concerto Base Libraries.
// Taehoon Moon <panarch@kaist.ac.kr>
//
// NoteManager
//
// Copyright Taehoon Moon 2014

define(function(require, exports, module) {
    var Vex = require('vexflow');
    var L = require('js-logger').get('NoteManager');
    var Table = require('Table');

    /**
     * @constructor
     * @template NoteManager
     */
    function NoteManager(attributesManager) {
        this.duration = 0;
        this.attributesManager = attributesManager;
        this.notes = [];
        this.notesList = [this.notes];
        this.staffList = [];
        this.staffUndecided = true;
    }

    /**
     * @this {NoteManager}
     * @param {Object} staveNote
     * @param {Object} note
     */
    NoteManager.prototype.addStaveNote = function addStaveNote(staveNote, note) {
        var duration = note['duration'];
        var voice = note['voice'];
        var staff = note['staff'];

        if(staff === undefined) {
            staff = 1;
        }
        if(this.staffUndecided) {
            this.staffList.push(staff);
            this.staffUndecided = false;
        }
        this.duration += duration;
        this.notes.push(staveNote);

    };

    /**
     * @this {NoteManager}
     * @param {Object} clefNote
     * @param {Object} note
     */
    NoteManager.prototype.addClefNote = function addClefNote(clefNote, note) {
        this.notes.push(clefNote);
    };

    /**
     * @this {NoteManager}
     * @param {number}
     */
    NoteManager.prototype.addBackup = function addBackup(duration) {
        var divisions = this.attributesManager.getDivisions();
        this.staffUndecided = true;
        this.duration -= duration;
        this.notes = [];
        if(this.duration > 0) {
            // if back appears, it means change of voice.
            var noteType = NoteManager.getStaveNoteTypeFromDuration(this.duration, divisions);
            var ghostNote = new Vex.Flow.GhostNote({ duration: noteType });
            this.notes.push(ghostNote);
        }

        this.notesList.push(this.notes);
    };

    /**
     * @this {NoteManager}
     * @param {number}
     */
    NoteManager.prototype.addForward = function addForward(duration) {
        var divisions = this.attributesManager.getDivisions();
        this.duration += duration;
        var noteType = NoteManager.getStaveNoteTypeFromDuration(duration, divisions);
        var ghostNote = new Vex.Flow.GhostNote({ duration: noteType });
        this.notes.push(ghostNote);
    };

    /**
     * @this {NoteManager}
     * @param {Object}
     * @param {Array.<Object>}
     */
    NoteManager.prototype.fillVoice = function fillVoice(time, notes) {
        var divisions = this.attributesManager.getDivisions();
        var maxDuration = divisions * 4 / time['beat-type'] * time['beats'];

        var duration = 0;
        for(var i = 0; i < notes.length; i++) {
            var staveNote = notes[i];
            duration += NoteManager.getDurationFromStaveNote(staveNote, divisions);
        }

        duration = maxDuration - duration;
        if(duration < 0) {
            L.warn('Sum of duration exceeds time sig');
            return;
        }
        else if(duration === 0) {
            return;
        }

        var noteType = NoteManager.getStaveNoteTypeFromDuration(duration, divisions);
        var ghostNote = new Vex.Flow.GhostNote({ duration: noteType });
        notes.push(ghostNote);
    };

    /**
     * @this {Array.<Object>}
     * @return {Array}
     */
    NoteManager.prototype.getVoices = function getVoices(staves) {
        var voices = [];
        var preStaff = this.staffList[0];
        var staffVoices = [];
        var stave;
        var time = this.attributesManager.getTimeSignature();
        var formatter;
        for(var i = 0; i < this.notesList.length; i++) {
            var staff = this.staffList[i];
            stave = staves[staff - 1];

            var notes = this.notesList[i];
            if(notes.length === 0) {
                continue;
            }
            var voice = new Vex.Flow.Voice({ num_beats: time['beats'],
                                            beat_value: time['beat-type'],
                                            resolution: Vex.Flow.RESOLUTION});
            voice.setMode(Vex.Flow.Voice.Mode.SOFT);
            this.fillVoice(time, notes);
            voice = voice.addTickables(notes);
            voices.push([voice, stave]);
            if(preStaff != staff) {
                _format(staffVoices, stave);
                staffVoices = [voice];
                preStaff = staff;
            }
            else {
                staffVoices.push(voice);
            }
        }

        if(staffVoices.length > 0) {
            _format(staffVoices, stave);
        }

        function _format(staffVoices, stave) {
            var options = {};
            if(staffVoices.length > 1) {
                options.align_rests = true;
            }
            else {
                options.align_rests = false;
            }

            formatter = new Vex.Flow.Formatter();
            formatter.joinVoices(staffVoices);
            formatter.formatToStave(staffVoices, stave, options);
        }

        return voices;
    };

    // static functions

    /**
     * @param {string} noteType
     * @param {number} divisions
     * @return {number}
     */ 
    NoteManager.getDurationFromStaveNote = function getDurationFromStaveNote(staveNote, divisions) {
        var noteType = staveNote.getDuration();
        var numDots;
        if(staveNote['-concerto-num-dots']) {
            numDots = staveNote['-concerto-num-dots'];
        }
        else {
            numDots = 0;
        }

        var index = Table.NOTE_VEX_TYPES.indexOf(noteType);
        var offset = index - Table.NOTE_VEX_QUARTER_INDEX;
        var duration = Math.pow(2, offset) * divisions;
        duration = duration * 2 - duration * Math.pow(2, -numDots);

        return duration;
    };

    /**
     * @param {number} duration
     * @param {number} divisions
     * @param {boolean=} withDots
     */
    NoteManager.getStaveNoteTypeFromDuration = function getStaveNoteTypeFromDuration(duration, divisions, withDots) {
        if(withDots === undefined) {
            withDots = false;
        }

        var i = Table.NOTE_VEX_QUARTER_INDEX;
        var count, num;
        for(count = 0; count < 20; count++) {
            num = Math.floor(duration / divisions);
            if(num == 1) {
                break;
            }
            else if(num > 1) {
                divisions *= 2;
                i++;
            }
            else {
                divisions /= 2;
                i--;
            }
        }
        if(count == 20) {
            L.error('No proper StaveNote type');
        }

        var noteType = Table.NOTE_VEX_TYPES[i];
        if(withDots) {
            for(count = 0; count < 5; count++) {
                duration -= Math.floor(duration / divisions);
                divisions /= 2;
                num = Math.floor(duration / divisions);
                if(num == 1) {
                    noteType += 'd';
                }
                else {
                    break;
                }
            }
        }

        return noteType;
    };

    /**
     * @param {Object} staveNote
     * @param {Object} note
     */
    NoteManager.addTechnicalToStaveNote = function addTechnicalToStaveNote(staveNote, note) {
        var notationsDict = note['notations'];
        if(notationsDict['technical'] !== undefined) {
            for(var i = 0; i < notationsDict['technical'].length; i++) {
                var item = notationsDict['technical'][i];
                var technicalSymbol;
                if(item['tag'] == 'down-bow') {
                    technicalSymbol = 'am';
                }
                else if(item['tag'] == 'up-bow') {
                    technicalSymbol = 'a|';
                }
                else if(item['tag'] == 'snap-pizzicato') {
                    technicalSymbol = 'ao';
                }
                else {
                    L.warn('Unhandled technical symbol.');
                }

                if(technicalSymbol !== undefined) {
                    var technical = new Vex.Flow.Articulation(technicalSymbol);
                    if(note['stem'] == 'up') {
                        technical.setPosition(Vex.Flow.Modifier.Position.ABOVE);
                    }
                    else {
                        technical.setPosition(Vex.Flow.Modifier.Position.BELOW);
                    }
                    staveNote.addArticulation(0, technical);
                }
            }
        }
    };

    /**
     * @param {Object} staveNote
     * @param {Object} note
     */
    NoteManager.addArticulationToStaveNote = function addArticulationToStaveNote(staveNote, note) {
        var notationsDict = note['notations'];
        if(notationsDict['articulations'] !== undefined) {
            for(var i = 0; i < notationsDict['articulations'].length; i++) {
                var item = notationsDict['articulations'][i];
                var articulationSymbol;
                if(item['tag'] == 'accent') {
                    articulationSymbol = 'a>';
                }
                else if(item['tag'] == 'staccato') {
                    articulationSymbol = 'a.';
                }
                else if(item['tag'] == 'tenuto') {
                    articulationSymbol = 'a-';
                }
                else if(item['tag'] == 'strong-accent') {
                    // marcato, currently only supports up marcato
                    articulationSymbol = 'a^';
                }
                else {
                    L.warn('Unhandled articulations symbol.');
                }

                if(articulationSymbol !== undefined) {
                    var articulation = new Vex.Flow.Articulation(articulationSymbol);
                    if(note['stem'] == 'up') {
                        articulation.setPosition(Vex.Flow.Modifier.Position.ABOVE);
                    }
                    else {
                        articulation.setPosition(Vex.Flow.Modifier.Position.BELOW);
                    }
                    staveNote.addArticulation(0, articulation);
                }
            }
        }
    };

    /**
     * @param {Array.<Object>} notes
     * @param {string} clef
     * @param {number} divisions
     */
    NoteManager.getStaveNote = function getStaveNote(notes, clef, divisions) {    
        var keys = [];
        var accidentals = [];
        var baseNote = notes[0];
        var duration;
        var i;

        if(baseNote['type'] !== undefined) {
            duration = Table.NOTE_TYPE_DICT[baseNote['type']];
        }
        else {
            duration = NoteManager.getStaveNoteTypeFromDuration(baseNote['duration'], divisions);
        }
    
        if(notes.length == 1 && baseNote['rest']) {
            duration += 'r';
            keys.push( Table.DEFAULT_REST_PITCH );
            clef = undefined;
        }
        else {
            // compute keys 
            for(i = 0; i < notes.length; i++) {
                var note = notes[i];
                var key = note['pitch']['step'].toLowerCase();
                if(note['accidental']) {
                    var accidental = Table.ACCIDENTAL_DICT[ note['accidental'] ];
                    key += accidental;
                    accidentals.push(accidental);
                }
                else {
                    accidentals.push(false);
                }
                key += "/" + note['pitch']['octave'];
                keys.push(key);
            }
        }

        if(baseNote['dot']) {
            for(i = 0; i < baseNote['dot']; i++) {
                duration += 'd';
            }
        }

        var staveNote = new Vex.Flow.StaveNote({ keys: keys, duration: duration, clef: clef });
    
        for(i = 0; i < accidentals.length; i++) {
            if(accidentals[i]) {
                staveNote.addAccidental(i, new Vex.Flow.Accidental( accidentals[i] ));
            }
        }

        staveNote['-concerto-num-dots'] = baseNote['dot'];

        if(baseNote['dot']) {
            for(i = 0; i < baseNote['dot']; i++) {
                staveNote.addDotToAll();
            }
        }

        if(baseNote['stem'] == 'up') {
            staveNote.setStemDirection(Vex.Flow.StaveNote.STEM_DOWN);
        }

        // notations
        if(baseNote['notations'] !== undefined) {
            var notationsDict = baseNote['notations'];

            // fermata
            if(notationsDict['fermata'] !== undefined) {
                var fermataType = notationsDict['fermata']['@type'];
                if(fermataType == 'upright') {
                    staveNote.addArticulation(0, 
                        new Vex.Flow.Articulation('a@a').setPosition(Vex.Flow.Modifier.Position.ABOVE));
                }
                else if(fermataType == 'inverted') {
                    staveNote.addArticulation(0, 
                        new Vex.Flow.Articulation('a@u').setPosition(Vex.Flow.Modifier.Position.BELOW));
                }
                else {
                    L.error('Unhandled fermata type.');
                }
            }

            // technical
            NoteManager.addTechnicalToStaveNote(staveNote, baseNote);

            // articulations
            NoteManager.addArticulationToStaveNote(staveNote, baseNote);
        }
                
        return staveNote;
    };

    module.exports = NoteManager;
});
