// Concerto Base Libraries.
// Taehoon Moon <panarch@kaist.ac.kr>
//
// NoteManager
//
// Copyright Taehoon Moon 2014

/**
 * @constructor
 * @template Concerto.Parser.NoteManager
 */
Concerto.Parser.NoteManager = function(attributesManager) {
    this.duration = 0;
    this.attributesManager = attributesManager;
    this.notes = [];
    this.notesList = [this.notes];
    this.staffList = [];
    this.staffUndecided = true;
}

/**
 * @this {Concerto.Parser.NoteManager}
 * @param {Object} staveNote
 * @param {Object} note
 */
Concerto.Parser.NoteManager.prototype.addStaveNote = function(staveNote, note) {
    var duration = note['duration'];
    var voice = note['voice'];
    var staff = note['staff'];
    
    if(staff == undefined) {
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
 * @this {Concerto.Parser.NoteManager}
 * @param {number}
 */
Concerto.Parser.NoteManager.prototype.addBackup = function(duration) {
    var divisions = this.attributesManager.getDivisions();
    this.staffUndecided = true;
    this.duration -= duration;
    this.notes = [];
    if(this.duration > 0) {
        // if back appears, it means change of voice.
        var noteType = Concerto.Parser.getStaveNoteTypeFromDuration(this.duration, divisions);
        var ghostNote = new Vex.Flow.GhostNote({ duration: noteType });
        this.notes.push(ghostNote);
    }
    
    this.notesList.push(this.notes);
};

/**
 * @this {Concerto.Parser.NoteManager}
 * @param {number}
 */
Concerto.Parser.NoteManager.prototype.addForward = function(duration) {
    var divisions = this.attributesManager.getDivisions();
    this.duration += duration;
    var noteType = Concerto.Parser.getStaveNoteTypeFromDuration(duration, divisions);
    var ghostNote = new Vex.Flow.GhostNote({ duration: noteType });
    this.notes.push(ghostNote);
};

/**
 * @this {Array.<Object>}
 * @return {Array}
 */
Concerto.Parser.NoteManager.prototype.getVoices = function(staves) {
    var voices = [];
    var preStaff = this.staffList[0];
    var staffVoices = [];
    var stave = undefined;
    var time = this.attributesManager.getTimeSignature();
    for(var i = 0; i < this.notesList.length; i++) {
        var staff = this.staffList[i];
        stave = staves[staff - 1];

        var notes = this.notesList[i];
        var voice = new Vex.Flow.Voice({ num_beats: time['beats'],
                                        beat_value: time['beat-type'],
                                        resolution: Vex.Flow.RESOLUTION});
        voice.setMode(Vex.Flow.Voice.Mode.SOFT);
        voice = voice.addTickables(notes);
        voices.push([voice, stave]);
        if(preStaff != staff) {
            var formatter = new Vex.Flow.Formatter();
            formatter.joinVoices(staffVoices);
            formatter.formatToStave(staffVoices, stave);
            staffVoices = [voice];
        }
        else {
            staffVoices.push(voice);
        }
    }

    var formatter = new Vex.Flow.Formatter();
    formatter.joinVoices(staffVoices);
    formatter.formatToStave(staffVoices, stave);

    return voices;
}