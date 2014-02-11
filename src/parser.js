// Concerto Base Libraries.
// Taehoon Moon <panarch@kaist.ac.kr>
//
// Parser
//
// Copyright Taehoon Moon 2014

Concerto.Parser = {};

/*
 musicjson --> vexflow
 Current verison only supports single staff, single voice.
*/

Concerto.Parser.getPageMargins = function(pageIndex, defaults) {
    var pageLayout = defaults['page-layout'];
    if(Array.isArray(pageLayout['page-margins']) == false) {
        return pageLayout['page-margins'];
    }
    else if(pageLayout['page-margins'].length == 1) {
        // both
        return pageLayout['page-margins'][0];
    }

    var pageType = (pageIndex % 2 == 0) ? 'odd' : 'even';
    for(var i = 0; i < pageLayout['page-margins'].length; i++) {
        if(pageLayout['page-margins'][i]['@type'] == pageType) {
            return pageLayout['page-margins'][i];
        }
    }

    Concerto.logError('page-margins required');
    
    // return default page margin
    return {}
}

Concerto.Parser.getStave = function(measure, leftMeasure, aboveMeasure, pageMargins) {
    if(leftMeasure) {
        measure['y'] = leftMeasure['y'];
        measure['x'] = leftMeasure['x'] + leftMeasure['width'];
    }
    else {
        var print = measure['print'];
        measure['x'] = pageMargins['left-margin'];
        if(print['system-layout']) {
            var systemLayout = print['system-layout'];
            if(systemLayout['system-margins'] && 
                systemLayout['system-margins']['left-margin']) {
                measure['x'] += systemLayout['system-margins']['left-margin'];
            }

            if(systemLayout['top-system-distance'] != undefined) {
                // new page
                var topMargin = pageMargins['top-margin'];
                measure['y'] = topMargin + systemLayout['top-system-distance'];
            }
            else if(systemLayout['system-distance'] != undefined) {
                // new system
                measure['y'] = aboveMeasure['bottom-line-y'] + systemLayout['system-distance'];
            }
            else {

            }
        }
        else if(print['staff-layout']) {
            // new system, staff
            measure['y'] = aboveMeasure['bottom-line-y'] + print['staff-layout']['staff-distance'];
        }
        else {
            Concerto.logError('lack of print tag');
        }
    }

    var options = {
        'space_above_staff_ln': 0
    };
    var stave = new Vex.Flow.Stave(measure['x'], measure['y'], measure['width'], options);
    return stave;
}

Concerto.Parser.getAdditionalStave = function(measure, firstMeasure) {
    var print = firstMeasure['print'];

    if(print['staff-layout'] && print['staff-layout']['@number'] == 2) {
        var y = measure['y'] + 40 + print['staff-layout']['staff-distance'];
        var options = {
            'space_above_staff_ln': 0
        };
        var stave = new Vex.Flow.Stave(measure['x'], y, measure['width'], options);
        
        return stave;
    }
    return undefined;
}

Concerto.Parser.getLeftMeasure = function(partIndex, measureIndex, measure, musicjson) {
    if(measure['print'] && 
        (measure['print']['@new-page'] || measure['print']['@new-system'])) {
        return undefined;
    }
    return musicjson['part'][partIndex]['measure'][measureIndex - 1];
}

Concerto.Parser.getAboveMeasure = function(partIndex, measureIndex, firstMeasure, musicjson) {
    if(partIndex == 0) {
        var i = measureIndex - 1;
        if(firstMeasure['print']['system-layout']['top-system-distance'] != undefined) { // firstMeasure['print']['@new-page'] 
            return undefined;
        }
        // @new-system
        var parts = musicjson['part'];
        return parts[parts.length - 1]['measure'][measureIndex - 1];
    }

    return musicjson['part'][partIndex - 1]['measure'][measureIndex];
}

Concerto.Parser.addKeySignatureInfo = function(stave, keyDict) {
    if(keyDict['fifths'] == undefined) {
        Concerto.logError('key fifths does not exists');
        return;
    }

    var fifths = keyDict['fifths']
    var keySpec;

    if(fifths == 0) {
        keySpec = 'C';
    }
    else if(fifths > 0) {
        keySpec = Concerto.Table.SHARP_MAJOR_KEY_SIGNATURES[fifths - 1];
    }
    else {
        keySpec = Concerto.Table.FLAT_MAJOR_KEY_SIGNATURES[-fifths - 1];
    }
    stave.addKeySignature(keySpec);
}

Concerto.Parser.addTimeSignatureInfo = function(stave, timeDict) {
    var timeSpec;
    if(timeDict['@symbol']) {
        if(timeDict['@symbol'] == 'common') {
            timeSpec = 'C';
        }
        else if(timeDict['@symbol'] == 'cut') {
            timeSpec = 'C|';
        }
        else {
            Concerto.logWarn('Unsupported time symbol');
            timeSpec = 'C';
        }
    }
    else {
        timeSpec = timeDict['beats'] + '/' + timeDict['beat-type'];
    }
    stave.addTimeSignature(timeSpec);
}

Concerto.Parser.getStaveNoteTypeFromDuration = function(duration, divisions, withDots) {
    if(withDots == undefined) {
        withDots = false;
    }

    var i = Concerto.Table.NOTE_VEX_QUARTER_INDEX;
    for(var count = 0; count < 20; count++) {
        var num = Math.floor(duration / divisions);
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
        Concerto.logError('No proper StaveNote type');
    }

    var noteType = Concerto.Table.NOTE_VEX_TYPES[i];
    if(withDots) {
        for(var count = 0; count < 5; count++) {
            duration -= Math.floor(duration / divisions);
            divisions /= 2;
            var num = Math.floor(duration / divisions);
            if(num == 1) {
                noteType += 'd';
            }
            else {
                break;
            }
        }
    }

    return noteType;
}

Concerto.Parser.getStaveNote = function(notes, clef, divisions) {    
    var keys = [];
    var accidentals = [];
    var baseNote = notes[0];
    var duration;
    if(baseNote['type'] != undefined) {
        duration = Concerto.Table.NOTE_TYPE_DICT[baseNote['type']];
    }
    else {
        duration = Concerto.Parser.getStaveNoteTypeFromDuration(baseNote['duration'], divisions);
    }
    
    if(notes.length == 1 && baseNote['rest']) {
        duration += 'r';
        keys.push( Concerto.Table.DEFAULT_REST_PITCH );
        clef = undefined;
    }
    else {
        // compute keys 
        for(var i = 0; i < notes.length; i++) {
            var note = notes[i];
            var key = note['pitch']['step'].toLowerCase();
            if(note['accidental']) {
                var accidental = Concerto.Table.ACCIDENTAL_DICT[ note['accidental'] ];
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
        for(var i = 0; i < baseNote['dot']; i++) {
            duration += 'd';
        }
    }
    
    var staveNote = new Vex.Flow.StaveNote({ keys: keys, duration: duration, clef: clef });

    for(var i = 0; i < accidentals.length; i++) {
        if(accidentals[i]) {
            staveNote.addAccidental(i, new Vex.Flow.Accidental( accidentals[i] ));
        }
    }

    if(baseNote['dot']) {
        for(var i = 0; i < baseNote['dot']; i++) {
            staveNote.addDotToAll();
        }
    }

    if(baseNote['stem'] == 'up') {
        staveNote.setStemDirection(Vex.Flow.StaveNote.STEM_DOWN);
    }
                
    return staveNote;
}

Concerto.Parser.getBeams = function(notes) {
    var beams = [];
    var temps = [];
    for(var i = 0; i < notes.length; i++) {
        var note = notes[i];
        if(!note['beam']) {
            continue;
        }
        
        var beamText = note['beam'][0]['text'];
        if(beamText == 'begin' || beamText == 'continue') {
            temps.push(note['staveNote']);
        }
        else if(beamText == 'end') {
            temps.push(note['staveNote']);
            var beam = new Vex.Flow.Beam(temps);
            temps = [];
            beams.push(beam);
        }        
    }

    return beams;
}

Concerto.Parser.drawVoices = function(voices, ctx) {
    for(var i = 0; i < voices.length; i++) {
        var voice = voices[i][0];
        var stave = voices[i][1];
        var formatter = new Vex.Flow.Formatter();
        //formatter.joinVoices([voice]);
        //formatter.formatToStave([voice], stave);
        voice.draw(ctx, stave);
    }
}

Concerto.Parser.parseAndDraw = function(pages, musicjson) {
    var parts = musicjson['part'];

    var attributesManager = new Concerto.Parser.AttributesManager();
    
    var numMeasures = parts[0]['measure'].length;
    
    // first measure on same line.
    var firstMeasures = new Array(parts.length);
    
    var staves;
    var voices;
    var beams;
    var curPageIndex = 0;
    var divisions = 1;
    var ctx = pages[curPageIndex];

    for(var i = 0; i < numMeasures; i++) {
        staves = [];
        beams = [];
        voices = [];
        for(var p = 0; p < parts.length; p++) {
            var measure = parts[p]['measure'][i];
            // measure['print'] exists mean that measure is first measure on the same line.
            if(measure['print']) {
                firstMeasures[p] = measure;

                if(measure['print']['@new-page']) {
                    curPageIndex++;
                    ctx = pages[curPageIndex];
                }
            }
            
            var firstMeasure = firstMeasures[p];

            var leftMeasure = Concerto.Parser.getLeftMeasure(p, i, measure, musicjson);
            var aboveMeasure = Concerto.Parser.getAboveMeasure(p, i, firstMeasure, musicjson);
            var pageMargins = Concerto.Parser.getPageMargins(curPageIndex, musicjson['defaults']);

            var stave = Concerto.Parser.getStave(measure, leftMeasure, aboveMeasure, pageMargins);
            
            var stave2 = Concerto.Parser.getAdditionalStave(measure, firstMeasure);
            var curStaves = [stave];
            staves.push(stave);

            if(stave2 != undefined) {
                curStaves.push(stave2);
                staves.push(stave2);
            }
            measure['stave'] = stave;
            measure['stave2'] = stave2;
            var staveNotesDict = {};

            // check clef, time signature changes
            var notes = measure['note'];
            var noteManager = new Concerto.Parser.NoteManager(attributesManager);
            
            if(notes.length > 0) {
                var note = notes[0];
                var isAttributes = (note['tag'] == 'attributes');
                var clefExists = false;
                if(isAttributes && note['clef']) {
                    // set raw clefs, and get converted clef
                    attributesManager.setClefs(note['clef'], p);
                    clefExists = true;
                }
                
                if(measure['print'] || clefExists) {
                    for(var k = 0; k < curStaves.length; k++) {
                        var staff = k + 1;
                        var clef = attributesManager.getClef(p, staff);
                        if(clef != undefined) {
                            curStaves[k].addClef(clef);
                        }
                    }
                }

                if(isAttributes && note['key']) {
                    attributesManager.setKeySignature(note['key'], p, note['staff']);
                    Concerto.Parser.addKeySignatureInfo(stave, note['key']);
                    if(stave2) {
                        Concerto.Parser.addKeySignatureInfo(stave2, note['key']);
                    }
                }

                if(isAttributes && note['time']) {
                    attributesManager.setTimeSignature(note['time']);
                    Concerto.Parser.addTimeSignatureInfo(stave, note['time']);
                    if(stave2) {
                        Concerto.Parser.addTimeSignatureInfo(stave2, note['time']);
                    }
                }

                if(isAttributes && note['divisions']) {
                    attributesManager.setDivisions(note['divisions']);
                    divisions = note['divisions'];
                }    
            }

            for(var j = 0; j < notes.length; j++) {
                var note = notes[j];
                // backup, forward
                if(j > 0 && note['tag'] == 'attributes') {
                    // clef change,
                    if(note['clef']) {
                        attributesManager.setClefs(note['clef'], p);
                        Concerto.logError('Clef change in middle of notes is unimplemented.');
                    }
                }
                else if(note['tag'] == 'note') {
                    var chordNotes = [note];
                    for(var k = j + 1; k < notes.length; k++) {
                        var nextNote = notes[k];
                        if(!nextNote['chord']) {
                            break;
                        }
                        else {
                            j++;
                        }
                        chordNotes.push(nextNote);
                    }
                    
                    
                    var clef = attributesManager.getClef(p, note['staff'], Concerto.Table.DEFAULT_CLEF);
                    if(note['staff'] && note['staff'] == 2) {
                        //var staveNote = Concerto.Parser.getStaveNote(chordNotes, curClefsList[p][1], divisions);
                        var staveNote = Concerto.Parser.getStaveNote(chordNotes, clef, divisions);
                        noteManager.addStaveNote(staveNote, note);
                    }
                    else {
                        var staveNote = Concerto.Parser.getStaveNote(chordNotes, clef, divisions);
                        //var staveNote = Concerto.Parser.getStaveNote(chordNotes, curClefsList[p][0], divisions);
                        noteManager.addStaveNote(staveNote, note);
                    }
                    
                    note['staveNote'] = staveNote;

                }
                else if(note['tag'] == 'backup') {
                    noteManager.addBackup(note['duration']);
                }
                else if(note['tag'] == 'forward') {
                    noteManager.addForward(note['duration']);
                }
            }

            
            var newBeams = Concerto.Parser.getBeams(notes);
            beams = beams.concat(newBeams);

            var newVoices = noteManager.getVoices(curStaves);
            voices = voices.concat(newVoices);

            // draw stave
            if(ctx == undefined) {
                continue;
            }
            
            stave.setContext(ctx).draw();
            measure['top-line-y'] = stave.getYForLine(0);
            measure['top-y'] = stave.y;
            measure['bottom-line-y'] = stave.getYForLine(stave.options.num_lines - 1);
            measure['bottom-y'] = stave.getBottomY();
            if(stave2) {
                //stave2.y = measure['bottom-line-y'] + measure['print']['staff-layout']['staff-distance'];
                stave2.setContext(ctx).draw();
                measure['bottom-line-y'] = stave2.getYForLine(stave2.options.num_lines - 1);
                measure['bottom-y'] = stave2.getBottomY();
            }
        }

        if(ctx == undefined) {
            continue;
        }
        
        // does vexflow not support multiple part formatting?
        Concerto.Parser.drawVoices(voices, ctx);

        for(var j = 0; j < beams.length; j++) {
            beams[j].setContext(ctx).draw();
        }

        // draw stave connector
        // current version, multiple staff and connector shape are not supported.
        if(parts[0]['measure'][i]['print']) {
            var staveConnector = new Vex.Flow.StaveConnector(staves[0], staves[staves.length - 1]);
            staveConnector.setContext(ctx);
            staveConnector.setType(Vex.Flow.StaveConnector.type.BRACE);
            staveConnector.draw();
            staveConnector.setType(Vex.Flow.StaveConnector.type.SINGLE);
            staveConnector.draw();
        }
        
    }


    return musicjson;


}




