// Copyright (c) Taehoon Moon 2015.
// @author Taehoon Moon

import { parseSystemLayout, parseStaffLayout } from './LayoutParser';
import Part from './Part';
import Measure from './Measure';

const parsePrint = (data, printNode) => {
  const print = {};
  const measureNumberingNode = printNode.getElementsByTagName('measure-numbering')[0];
  const systemLayoutNode = printNode.getElementsByTagName('system-layout')[0];
  const staffLayoutNodes = [...printNode.getElementsByTagName('staff-layout')];

  if (printNode.getAttribute('new-page') === 'yes')
    print.newPage = true;
  else if (printNode.getAttribute('new-system') === 'yes')
    print.newSystem = true;

  if (measureNumberingNode)
    print.measureNumbering = measureNumberingNode.textContent;

  if (systemLayoutNode)
    print.systemLayout = parseSystemLayout(systemLayoutNode);

  if (staffLayoutNodes.length > 0)
    print.staffLayoutMap = parseStaffLayout(staffLayoutNodes);

  data.print = print;
};

const parseBarline = (data, barlineNote, noteBegin) => {
  const barline = {};
  data[`${noteBegin ? 'right' : 'left'}Barline`] = barline;
};

const parseAttributes = (data, attrNode, state) => {
  [...attrNode.childNodes].forEach(node => {
    switch (node.tagName) {
      case 'divisions':
        data.divisions = Number(node.textContent);
        break;
      case 'time':
        data.time = {
          beats: Number(node.getElementsByTagName('beats')[0].textContent),
          beatType: Number(node.getElementsByTagName('beat-type')[0].textContent),
        };

        if (node.hasAttribute('symbol'))
          data.time.symbol = node.getAttribute('symbol');

        break;
      case 'key':
        const cancelNode = node.getElementsByTagName('cancel')[0];
        const modeNode = node.getElementsByTagName('mode')[0];
        data.key = {
          fifths: Number(node.getElementsByTagName('fifths')[0].textContent),
        };

        if (cancelNode) data.key.cancel = Number(cancelNode.textContent);
        if (modeNode) data.key.mode = modeNode.textContent;

        break;
      case 'clef':
        const staff = node.hasAttribute('number') ?
          Number(node.getAttribute('number')) : state.staff;
        const lineNode = node.getElementsByTagName('line')[0];
        const clefOctaveChangeNode = node.getElementsByTagName('clef-octave-change')[0];
        const clef = {
          sign: node.getElementsByTagName('sign')[0].textContent,
        };

        if (lineNode)
          clef.line = Number(lineNode.textContent);

        if (clefOctaveChangeNode)
          clef.clefOctaveChange = Number(clefOctaveChangeNode.textContent);

        if (!state.noteBegin) {
          data.clefMap.set(staff, clef);
        } else {
          clef.tag = 'clef';
          data.notesMap.get(state.voice).push(clef);
        }

        break;
      case 'staff-details':
        const staffSizeNode = node.getElementsByTagName('staff-size')[0];
        const staffDetails = {};

        if (node.hasAttribute('print-object'))
          staffDetails.printObject = node.getAttribute('print-object') === 'yes';

        staffDetails.number = node.hasAttribute('number') ?
          Number(node.getAttribute('number')) : 1;

        if (staffSizeNode)
          staffDetails.staffSize = Number(staffSizeNode.textContent);

        data.staffDetailsMap.set(staffDetails.number, staffDetails);
        break;
      case 'transpose':
        // TODO
        break;
    }
  });
};

const sumNotesDuration = notes => {
  return notes.reduce((prev, next) => {
    const prevDuration = prev.duration ? prev.duration : 0;
    const nextDuration = next.duration ? next.duration : 0;

    return { duration: prevDuration + nextDuration };
  }, 0);
};

const parseNote = (data, noteNode, state) => {
  const staffNode = noteNode.getElementsByTagName('staff')[0];
  const voiceNode = noteNode.getElementsByTagName('voice')[0];
  //const graceNode = noteNode.querySelector('grace');
  const pitchNode = noteNode.getElementsByTagName('pitch')[0];
  const typeNode = noteNode.getElementsByTagName('type')[0];
  const stemNode = noteNode.getElementsByTagName('stem')[0];
  const durationNode = noteNode.getElementsByTagName('duration')[0];
  const accidentalNode = noteNode.getElementsByTagName('accidental')[0];
  const beamNodes = [...noteNode.getElementsByTagName('beam')];
  const numDots = noteNode.getElementsByTagName('dot').length;
  const staff = staffNode ? Number(staffNode.textContent) : 1;
  const voice = voiceNode ? Number(voiceNode.textContent) : 1;
  //const { onGrace, onChord } = noteState;
  const isNewVoice = data.voices.indexOf(voice) === -1;
  const isNewStaff = data.staffs.indexOf(staff) === -1;
  const isRest = noteNode.getElementsByTagName('rest')[0] ? true : false;
  const isChord = noteNode.getElementsByTagName('chord')[0] ? true : false;
  const isGrace = noteNode.getElementsByTagName('grace')[0] ? true : false;

  state.onGrace = isGrace;
  state.onChord = isChord;
  if (state.staff !== staff) state.staff = staff;
  if (state.voice !== voice) state.voice = voice;

  if (isNewVoice) {
    data.voices.push(voice);
    data.notesMap.set(voice, []);
  }

  if (isNewStaff) {
    data.staffs.push(staff);
  }

  const notes = data.notesMap.get(voice);
  const notesDuration = sumNotesDuration(notes);

  if (state.duration > notesDuration) {
    notes.push({
      tag: 'note',
      duration: state.duration - notesDuration,
      hidden: true,
    });
  } else if (state.duration < notesDuration) {
    console.error('notesState.duration > notesDuration');
  }

  const note = {
    tag: 'note',
    rest: isRest,
    grace: isGrace,
    pitches: [],
    beams: [],
    rest: isRest,
    staff: staff,
    voice: voice,
    dot: numDots,
    duration: 0,
    hidden: false, // true for GhostNote
  };

  if (pitchNode) {
    const pitch = {
      step: pitchNode.getElementsByTagName('step')[0].textContent,
      octave: Number(pitchNode.getElementsByTagName('octave')[0].textContent),
    };

    const alterNode = pitchNode.getElementsByTagName('alter')[0];
    if (alterNode)
      pitch.alter = Number(alterNode.textContent);

    if (isChord) {
      notes[notes.length - 1].pitches.push(pitch);
      return;
    }

    note.pitches.push(pitch);
  }

  if (durationNode) {
    const duration = Number(durationNode.textContent);
    note.duration = duration;
    state.duration += duration;
  }

  if (typeNode) note.type = typeNode.textContent;
  if (stemNode) note.stem = stemNode.textContent;
  if (accidentalNode) note.accidental = accidentalNode.textContent;

  if (beamNodes.length > 0 && beamNodes[0].hasAttribute('number')) {
    beamNodes.sort((prev, next) => {
      return Number(prev.getAttribute('number')) - Number(next.getAttribute('number'));
    });
  }

  beamNodes.forEach(node => {
    note.beams.push(node.textContent);
  });

  notes.push(note);
};

const parseNotes = (data, noteNodes) => {
  const state = {
    onGrace: false,
    onChord: false,
    duration: 0,
    staff: 1,
    voice: 1,
    noteBegin: false,
  };

  noteNodes.forEach(node => {
    switch (node.tagName) {
      case 'print':
        parsePrint(data, node);
        break;
      case 'barline':
        parseBarline(data, node, state.noteBegin);
        break;
      case 'attributes':
        parseAttributes(data, node, state);
        break;
      case 'note':
        state.noteBegin = true;
        parseNote(data, node, state);
        break;
      case 'forward':
        state.duration += Number(node.getElementsByTagName('duration')[0].textContent);
        break;
      case 'backup':
        state.duration -= Number(node.getElementsByTagName('duration')[0].textContent);
        break;
      case 'direction':
        // TODO
        break;
    }
  });
};

export const parsePart = partNode => {
  const id = partNode.getAttribute('id');
  const measures = [...partNode.getElementsByTagName('measure')].map(node => {
    const data = {
      number: Number(node.getAttribute('number')),
      width: node.hasAttribute('width') ? Number(node.getAttribute('width')) : 100,
      notesMap: new Map(), // key is voice number
      clefMap: new Map(), // key is staff number
      voices: [],
      staffs: [],
      staffDetailsMap: new Map(), // key is staff number
    };

    if (node.hasAttribute('width'))
      data.width = Number(node.getAttribute('width'));

    parseNotes(data, [...node.childNodes]);
    return new Measure(data);
  });

  return new Part({
    id: id,
    measures: measures,
  });
};
