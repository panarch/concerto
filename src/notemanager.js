// Concerto Base Libraries.
// Taehoon Moon <panarch@kaist.ac.kr>
//
// NoteManager
//
// Copyright Taehoon Moon 2014

/**
 * @constructor
 * @template Concerto.Parser.NoteManager
 * @param {number} timeBeats
 * @param {number} timeBeatType
 * @param {number} divisions
 */
Concerto.Parser.NoteManager = function(timeBeats, timeBeatType, divisions) {
    // voice, staff 기준으로 dictionary 생성?
    this.duration = 0; // duration counter
    this.timeBeats = timeBeats;
    this.timeBeatType = timeBeatType;
    this.divisions = divisions;
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
    this.staffUndecided = true;
    this.duration -= duration;
    this.notes = [];
    if(this.duration > 0) {
        // if back appears, it means change of voice.
        var noteType = Concerto.Parser.getStaveNoteTypeFromDuration(this.duration, this.divisions);
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
    this.duration += duration;
    var noteType = Concerto.Parser.getStaveNoteTypeFromDuration(duration, this.divisions);
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
    for(var i = 0; i < this.notesList.length; i++) {
        var staff = this.staffList[i];
        stave = staves[staff - 1];

        var notes = this.notesList[i];
        var voice = new Vex.Flow.Voice({ num_beats: this.timeBeats, 
                                        beat_value: this.timeBeatType,
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