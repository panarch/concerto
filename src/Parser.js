// Concerto Base Libraries.
// Taehoon Moon <panarch@kaist.ac.kr>
//
// Parser
//
// Copyright Taehoon Moon 2014

define(function(require, exports, module) {
    var $ = require('jquery');
    var Vex = require('vexflow');
    var L = require('js-logger').get('Parser');
    var AttributesManager = require('./AttributesManager');
    var LayoutManager = require('./LayoutManager');
    var NoteManager = require('./NoteManager');
    var MeasureManager = require('./MeasureManager');
    var BarlineManager = require('./BarlineManager');
    var Table = require('./Table');

    function Parser() {}

    /*
     musicjson --> vexflow
    */

    /**
     * @param {Object} musicjson
     * @return {integer}
     */
    Parser.getNumPages = function getNumPages(musicjson) {
        var measures = musicjson['part'][0]['measure'];
        var num = 1;
        for (var i = 0; i < measures.length; i++) {
            var measure = measures[i];
            if (measure['print'] && measure['print']['@new-page'])
                num++;
        }

        return num;
    };

    /**
     * @param {Object} musicjson
     * @return {Object.<string, number>}
     */
    Parser.getPageSize = function getPageSize(musicjson) {
        var pageLayout = musicjson['defaults']['page-layout'];
        $('#content').css('width', pageLayout['page-width'])
                     .css('height', pageLayout['page-height']);
        $('#content').find('svg').remove();
        return {
            width: pageLayout['page-width'],
            height: pageLayout['page-height']
        };
    };

    /**
     * @param {Array} notes
     * @return {Array}
     */
    Parser.getBeams = function getBeams(notes) {
        var beams = [];
        var temps = [];
        var note;
        for (var i = 0; i < notes.length; i++) {
            note = notes[i];
            if (!note['beam'])
                continue;

            var beamText = note['beam'][0]['text'];
            if (beamText === 'begin' || beamText === 'continue')
                temps.push(note['staveNote']);
            else if (beamText === 'end') {
                temps.push(note['staveNote']);
                var beam = new Vex.Flow.Beam(temps);
                temps = [];
                beams.push(beam);
            }
        }

        return beams;
    };

    /**
     * @param {Array} voices
     * @param {Object} ctx
     */
    Parser.drawVoices = function drawVoices(voices, ctx) {
        if (voices.length === 0)
            return;

        var _voices = [];
        var stave = voices[0][1];
        //var justifyWidth = stave.getNoteEndX() - stave.getNoteStartX() - 10;

        var i;

        for (i = 0; i < voices.length; i++)
            _voices.push(voices[i][0]);

        //var formatter = new Vex.Flow.Formatter();
        //formatter.joinVoices(_voices).format(_voices, justifyWidth, { align_rests: false });

        for (i = 0; i < voices.length; i++) {
            var voice = voices[i][0];
            stave = voices[i][1];
            voice.draw(ctx, stave);
        }
    };

    /**
     * @param {Array} pages
     * @param {Object} musicjson
     * @return {Object}
     */
    Parser.parseAndDraw = function parseAndDraw(pages, musicjson) {
        L.debug('Begin parsing & drawing');
        var parts = musicjson['part'];

        var attributesManager = new AttributesManager();
        var layoutManager = new LayoutManager(musicjson);
        var measureManager = new MeasureManager(musicjson);

        var numMeasures = parts[0]['measure'].length;

        var staves;
        var voices;
        var beams;
        var curPageIndex = 0;
        layoutManager.setPageIndex(curPageIndex);

        var divisions = 1;
        var ctx = pages[curPageIndex];
        var p;
        var i;
        var j;
        var k;

        for (i = 0; i < numMeasures; i++) {
            measureManager.setMeasureIndex(i);
            attributesManager.setMeasureIndex(i);
            staves = [];
            beams = [];
            voices = [];
            for (p = 0; p < parts.length; p++) {
                measureManager.setPartIndex(p);
                attributesManager.setPartIndex(p);
                var measure = parts[p]['measure'][i];
                if (measure['print'] && measure['print']['@new-page']) {
                    curPageIndex++;
                    layoutManager.setPageIndex(curPageIndex);
                    ctx = pages[curPageIndex];
                }

                var firstMeasure = measureManager.getFirstMeasure();
                var leftMeasure = measureManager.getLeftMeasure();
                var aboveMeasure = measureManager.getAboveMeasure();

                var curStaves = layoutManager.getStaves(measure, leftMeasure, aboveMeasure, firstMeasure);
                staves = staves.concat(curStaves);
                var stave = curStaves[0];
                var stave2 = curStaves[1];

                measure['stave'] = stave;
                measure['stave2'] = stave2;

                // barlines
                BarlineManager.addBarlineToStave(stave, measure['barline']);
                if (stave2)
                    BarlineManager.addBarlineToStave(stave2, measure['barline']);

                //var staveNotesDict = {};

                // check clef, time signature changes
                var notes = measure['note'];
                var noteManager = new NoteManager(attributesManager);
                var note;
                var clef;

                var clefExists = false;
                var changedStaffs;
                var isAttributes = false;
                if (notes.length > 0) {
                    note = notes[0];
                    isAttributes = (note['tag'] === 'attributes');
                    if (isAttributes && note['clef']) {
                        // set raw clefs, and get converted clef
                        changedStaffs = attributesManager.setClefs(note['clef'], p);
                        clefExists = true;
                    }
                }

                if (measure['print'] || clefExists)
                    for (k = 0; k < curStaves.length; k++) {
                        var staff = k + 1;
                        if (changedStaffs.indexOf(staff) === -1)
                            continue;

                        clef = attributesManager.getClef(p, staff);
                        if (clef !== undefined)
                            curStaves[k].addClef(clef);
                    }

                if (isAttributes > 0) {
                    if (note['key']) {
                        attributesManager.setKeySignature(note['key'], p, note['staff']);
                        var _clef = attributesManager.getClef(p, 1, 'treble');
                        AttributesManager.addKeySignatureToStave(stave, note['key'], _clef);
                        if (stave2) {
                            _clef = attributesManager.getClef(p, 2, 'treble');
                            AttributesManager.addKeySignatureToStave(stave2, note['key'], _clef);
                        }
                    }

                    if (note['time']) {
                        attributesManager.setTimeSignature(note['time']);
                        AttributesManager.addTimeSignatureToStave(stave, note['time']);
                        if (stave2)
                            AttributesManager.addTimeSignatureToStave(stave2, note['time']);
                    }

                    if (note['divisions']) {
                        attributesManager.setDivisions(note['divisions']);
                        divisions = note['divisions'];
                    }
                }

                for (j = 0; j < notes.length; j++) {
                    note = notes[j];
                    // backup, forward
                    if (j > 0 && note['tag'] === 'attributes' && note['clef']) {
                        // clef change,
                        attributesManager.setClefs(note['clef'], p);

                        if (notes[j + 1] === undefined)
                            AttributesManager.addEndClefToStave(curStaves, note['clef']);
                        else {
                            var clefNote = AttributesManager.getClefNote(note['clef']);
                            noteManager.addClefNote(clefNote, note);
                        }
                    }
                    else if (note['tag'] === 'note') {
                        var chordNotes = [note];
                        for (k = j + 1; k < notes.length; k++) {
                            var nextNote = notes[k];
                            if (!nextNote['chord'])
                                break;
                            else
                                j++;
                            chordNotes.push(nextNote);
                        }

                        clef = attributesManager.getClef(p, note['staff'], Table.DEFAULT_CLEF);
                        var staveNote;
                        if (note['staff'] && note['staff'] === 2) {
                            staveNote = NoteManager.getStaveNote(chordNotes, clef, divisions);
                            noteManager.addStaveNote(staveNote, note);
                        }
                        else {
                            staveNote = NoteManager.getStaveNote(chordNotes, clef, divisions);
                            noteManager.addStaveNote(staveNote, note);
                        }

                        note['staveNote'] = staveNote;
                    }
                    else if (note['tag'] === 'backup')
                        noteManager.addBackup(note['duration']);
                    else if (note['tag'] === 'forward')
                        noteManager.addForward(note['duration']);
                }

                var newBeams = Parser.getBeams(notes);
                beams = beams.concat(newBeams);
                var newVoices = noteManager.getVoices(curStaves);
                voices = voices.concat(newVoices);

                // draw stave
                if (ctx === undefined)
                    continue;

                stave.setContext(ctx).draw();
                measure['top-line-y'] = stave.getYForLine(0) + 1;
                measure['top-y'] = stave.y;
                measure['bottom-line-y'] = stave.getYForLine(stave.options.num_lines - 1) + 1;
                measure['bottom-y'] = stave.getBottomY();
                if (stave2) {
                    //stave2.y = measure['bottom-line-y'] + measure['print']['staff-layout']['staff-distance'];
                    stave2.setContext(ctx).draw();
                    measure['bottom-line-y'] = stave2.getYForLine(stave2.options.num_lines - 1) + 1;
                    measure['bottom-y'] = stave2.getBottomY();
                }
            }

            if (ctx === undefined)
                continue;

            // does vexflow not support multiple part formatting?
            Parser.drawVoices(voices, ctx);

            for (j = 0; j < beams.length; j++)
                beams[j].setContext(ctx).draw();

            // draw stave connector
            // current version, multiple staff and connector shape are not supported.
            if (parts[0]['measure'][i]['print']) {
                var staveConnector = new Vex.Flow.StaveConnector(staves[0], staves[staves.length - 1]);
                staveConnector.setContext(ctx);
                staveConnector.setType(Vex.Flow.StaveConnector.type.BRACE);
                staveConnector.draw();
                staveConnector.setType(Vex.Flow.StaveConnector.type.SINGLE);
                staveConnector.draw();
            }
        }

        L.debug('Finished');
        return musicjson;
    };

    module.exports = Parser;
});
