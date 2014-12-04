// Concerto Base Libraries.
// Taehoon Moon <panarch@kaist.ac.kr>
//
// NoteManager
//
// Copyright Taehoon Moon 2014

define(function(require, exports, module) {
    var L = require('js-logger').get('NoteManager');
    var Table = require('./Table');

    function NoteTool() {}

    /**
     * @param {Object} staveNote
     * @param {number} divisions
     * @return {number}
     */
    NoteTool.getDurationFromStaveNote = function getDurationFromStaveNote(staveNote, divisions) {
        var noteType = staveNote.getDuration();
        var numDots;
        if (staveNote['-concerto-num-dots'])
            numDots = staveNote['-concerto-num-dots'];
        else
            numDots = 0;

        var index = Table.NOTE_VEX_TYPES.indexOf(noteType);
        var offset = index - Table.NOTE_VEX_QUARTER_INDEX;
        var duration = Math.pow(2, offset) * divisions;
        duration = duration * 2 - duration * Math.pow(2, -numDots);

        return duration;
    };

    function _calculateNoteType(duration, divisions) {
        var i = 0;
        var count;
        var num;
        for (count = 0; count < 20; count++) {
            num = Math.floor(duration / divisions);
            if (num === 1)
                break;
            else if (num > 1) {
                divisions *= 2;
                i++;
            }
            else {
                divisions /= 2;
                i--;
            }
        }

        if (count === 20)
            L.error('No proper StaveNote type');

        var dots = 0;
        for (count = 0; count < 5; count++) {
            duration -= Math.floor(duration / divisions);
            divisions /= 2;
            num = Math.floor(duration / divisions);
            if (num === 1)
                dots++;
            else
                break;
        }

        return {
            index: i,
            dots: 0
        };
    }

    /**
     * @param {number} duration
     * @param {number} divisions
     * @param {boolean=} withDots
     */
    NoteTool.getStaveNoteTypeFromDuration = function getStaveNoteTypeFromDuration(duration, divisions, withDots) {
        if (withDots === undefined)
            withDots = false;

        var result = _calculateNoteType(duration, divisions);
        var index = Table.NOTE_VEX_QUARTER_INDEX + result.index;
        var noteType = Table.NOTE_VEX_TYPES[index];

        if (withDots) {
            for (var i = 0; i < result.dots.length; i++)
                noteType += 'd';
        }

        return noteType;
    };

    NoteTool.getNoteTypeFromDuration = function getNoteTypeFromDuration(duration, divisions) {
        var result = _calculateNoteType(duration, divisions);
        var index = Table.NOTE_QUARTER_INDEX + result.index;

        return {
            type: Table.NOTE_TYPES[index],
            dot: result.dots
        };
    };

    module.exports = NoteTool;
});
