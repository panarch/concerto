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

Concerto.Parser.getStave = function(measure, leftMeasure, aboveMeasure, defaults) {
    if(leftMeasure) {
        measure['y'] = leftMeasure['y'];
        measure['x'] = leftMeasure['x'] + leftMeasure['width'];
    }
    else {
        var print = measure['print'];
        measure['x'] = defaults['page-layout']['page-margins']['left-margin'];
        if(print['system-layout']) {
            if(print['system-layout']['top-system-distance'] != undefined) {
                // new page
                var topMargin = defaults['page-layout']['page-margins']['top-margin'];
                measure['y'] = topMargin + print['system-layout']['top-system-distance'];
            }
            else if(print['system-layout']['system-distance'] != undefined) {
                // new system
                measure['y'] = aboveMeasure['bottom-line-y'] + print['system-layout']['system-distance'];
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

    var stave = new Vex.Flow.Stave(measure['x'], measure['y'], measure['width']);
    return stave;
}

Concerto.Parser.getLeftMeausre = function(partIndex, measureIndex, measure, musicjson) {
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

Concerto.Parser.addClefInfo = function(stave, clefSign) {
    var clef = undefined;
    if(clefSign == 'G') {
        clef = 'treble';
        stave.addClef(clef);
    }
    else if(clefSign == 'F') {
        clef = 'bass';
        stave.addClef('bass');
    }
    else {
        Concerto.logError('Unsupported clef sign: ' + clefSign);
    }
    return clef;
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
        timeSpec = currentTimeBeats + '/' + currentTimeBeatType;
    }
    stave.addTimeSignature(timeSpec);
}

Concerto.Parser.getStaveNote = function(notes, clef) {    
    var keys = [];
    var accidentals = [];
    var baseNote = notes[0];
    var duration = Concerto.Table.NOTE_TYPE_DICT[baseNote['type']];

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


Concerto.Parser.parseAndDraw = function(pages, musicjson) {
    var parts = musicjson['part'];
    
    // Currently, only supports G, F clefs.
    var curClefs = new Array(parts.length); 
    for(var p = 0; p < parts.length; p++) {
        curClefs[p] = Concerto.Table.DEFAULT_CLEF;
    }

    var curTimeBeats = Concerto.Table.DEFAULT_TIME_BEATS;
    var curTimeBeatType = Concerto.Table.DEFAULT_TIME_BEAT_TYPE;

    var numMeasures = parts[0]['measure'].length;
    
    // first measure on same line.
    var firstMeasures = new Array(parts.length);
    
    var staves;
    var voices;
    var beams;
    var curPageIndex = 0;

    for(var i = 0; i < numMeasures; i++) {
        staves = [];
        voices = [];
        beams = [];
        for(var p = 0; p < parts.length; p++) {
            var measure = parts[p]['measure'][i];
            
            if(measure['print']) {
                firstMeasures[p] = measure;
                if(measure['print']['@new-page']) {
                    curPageIndex++;
                }
            }

            var leftMeasure = Concerto.Parser.getLeftMeausre(p, i, measure, musicjson);
            var aboveMeasure = Concerto.Parser.getAboveMeasure(p, i, firstMeasures[p], musicjson);
            
            var stave = Concerto.Parser.getStave(measure, leftMeasure, aboveMeasure, musicjson['defaults']);
            staves.push(stave);
            measure['stave'] = stave;

            // check clef, time signature changes
            var notes = measure['note'];
            var staveNotes = [];

            for(var j = 0; j < notes.length; j++) {
                var note = notes[j];
                // backup, forward
                if(note['tag'] == 'attributes') {
                    if(note['clef']) {
                        curClefs[p] = Concerto.Parser.addClefInfo(stave, note['clef']['sign']);
                    }

                    if(note['key']) {
                        Concerto.Parser.addKeySignatureInfo(stave, note['key']);
                    }

                    if(note['time']) {
                        curTimeBeats = note['time']['beats'];
                        curTimeBeatType = note['time']['beat-type'];
                        Concerto.Parser.addTimeSignatureInfo(stave, note['time']);
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
                    
                    var staveNote = Concerto.Parser.getStaveNote(chordNotes, curClefs[p]);
                    staveNotes.push(staveNote);
                    note['staveNote'] = staveNote;
                }
                else if(note['tag'] == 'backup') {
                    
                }
                else if(note['tag'] == 'forward') {

                }
            }

            beams = beams.concat( Concerto.Parser.getBeams(notes) );

            var voice = new Vex.Flow.Voice({ num_beats: curTimeBeats, 
                                            beat_value: curTimeBeatType,
                                            resolution: Vex.Flow.RESOLUTION});
            voice.setMode(Vex.Flow.Voice.Mode.SOFT);
            voice = voice.addTickables(staveNotes);
            voices.push(voice);

            // draw stave
            if(!pages[curPageIndex]) {
                continue;
            }

            var ctx = pages[curPageIndex];

            // draw stave
            stave.setContext(ctx).draw();
            measure['top-line-y'] = stave.getYForLine(0);
            measure['bottom-line-y'] = stave.getYForLine(stave.options.num_lines - 1);
            measure['top-y'] = stave.y;
            measure['bottom-y'] = stave.getBottomY();

        }

        // does vexflow not support multiple part formatting?
        // var formatter = new Vex.Flow.Formatter().joinVoices(voices).formatToStave(voices, staves[0]);
        
        for(var p = 0; p < parts.length; p++) {
            if(!pages[curPageIndex]) {
                continue;
            }

            var ctx = pages[curPageIndex];

        
            var formatter = new Vex.Flow.Formatter().joinVoices([voices[p]]).formatToStave([voices[p]], staves[p]);
            // draw notes
            voices[p].draw(ctx, staves[p]);

        }

        for(var j = 0; j < beams.length; j++) {
            beams[j].setContext(ctx).draw();
        }

        // draw stave connector
        // current version, multiple staff and connector shape are not supported.
        if(parts[0]['measure'][i]['print']) {
            var staveConnector = new Vex.Flow.StaveConnector(staves[0], staves[parts.length - 1]);
            staveConnector.setContext(ctx);
            staveConnector.setType(Vex.Flow.StaveConnector.type.BRACE);
            staveConnector.draw();
            staveConnector.setType(Vex.Flow.StaveConnector.type.SINGLE);
            staveConnector.draw();
        }
        
    }


    return musicjson;


}




