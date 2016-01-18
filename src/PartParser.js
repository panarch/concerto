// Copyright (c) Taehoon Moon 2015.
// @author Taehoon Moon

import { parseSystemLayout, parseStaffLayout } from './LayoutParser';
import Part from './Part';
import Measure from './Measure';

const parsePrint = (data, printNode) => {
  const print = {};
  const measureNumberingNode = printNode.querySelector('measure-numbering');
  const systemLayoutNode = printNode.querySelector('system-layout');
  const staffLayoutNodes = [...printNode.querySelectorAll('staff-layout')];

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

const parseAttributes = (data, attrNode, noteBegin) => {
  [...attrNode.children].forEach(node => {
    switch (node.tagName) {
      case 'divisions':
        data.divisions = Number(node.textContent);
        break;
      case 'time':
        data.time = {
          beats: Number(node.querySelector('beats').textContent),
          beatType: Number(node.querySelector('beat-type').textContent),
        };

        if (node.hasAttribute('symbol'))
          data.time.symbol = node.getAttribute('symbol');

        break;
      case 'key':
        data.key = {
          fifths: Number(node.querySelector('fifths').textContent),
          mode: node.querySelector('mode').textContent,
        };
        break;
      case 'clef':
        const lineNode = node.querySelector('line');
        const clefOctaveChangeNode = node.querySelector('clef-octave-change');
        const clef = {
          sign: node.querySelector('sign').textContent,
        };

        if (lineNode)
          clef.line = Number(lineNode.textContent);

        if (clefOctaveChangeNode)
          clef.clefOctaveChange = Number(clefOctaveChangeNode.textContent);

        if (!noteBegin)
          data.clef = clef;
        else {
          clef.tag = 'clef';
          data.notesMap.get(data.voices[0]).push(clef);
        }

        break;
      case 'staff-details':
        const staffSizeNode = node.querySelector('staff-size');
        const staffDetails = {};

        if (node.hasAttribute('print-object'))
          staffDetails.printObject = node.getAttribute('print-object') === 'yes';

        staffDetails.number = node.hasAttribute('number') ?
          Number(node.getAttribute('number')) : 1;

        if (staffSizeNode)
          staffDetails.staffSize = Number(staffSizeNode.textContent);

        data.staffDetailsMap.set(staffDetails.number, staffDetails);
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

const parseNote = (data, noteNode, noteState) => {
  const staffNode = noteNode.querySelector('staff');
  const voiceNode = noteNode.querySelector('voice');
  //const graceNode = noteNode.querySelector('grace');
  const pitchNode = noteNode.querySelector('pitch');
  const typeNode = noteNode.querySelector('type');
  const stemNode = noteNode.querySelector('stem');
  const durationNode = noteNode.querySelector('duration');
  const accidentalNode = noteNode.querySelector('accidental');
  const beamNodes = [...noteNode.querySelectorAll('beam')];
  const numDots = noteNode.querySelectorAll('dot').length;
  const staff = staffNode ? Number(staffNode.textContent) : 1;
  const voice = voiceNode ? Number(voiceNode.textContent) : 1;
  //const { onGrace, onChord } = noteState;
  const isNewVoice = data.voices.indexOf(voice) === -1;
  const isNewStaff = data.staffs.indexOf(staff) === -1;
  const isRest = noteNode.querySelector('rest') ? true : false;
  const isChord = noteNode.querySelector('chord') ? true : false;
  const isGrace = noteNode.querySelector('grace') ? true : false;

  noteState.onGrace = isGrace;
  noteState.onChord = isChord;

  if (isNewVoice) {
    data.voices.push(voice);
    data.notesMap.set(voice, []);
  }

  if (isNewStaff)
    data.staffs.push(staff);

  const notes = data.notesMap.get(voice);
  const notesDuration = sumNotesDuration(notes);

  if (noteState.duration > notesDuration) {
    notes.push({
      tag: 'note',
      duration: noteState.duration - notesDuration,
      hidden: true,
    });
  } else if (noteState.duration < notesDuration) {
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
      step: pitchNode.querySelector('step').textContent,
      octave: Number(pitchNode.querySelector('octave').textContent),
    };

    const alterNode = pitchNode.querySelector('alter');
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
    noteState.duration += duration;
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
  let noteBegin = false;
  const noteState = {
    onGrace: false,
    onChord: false,
    duration: 0,
  };

  noteNodes.forEach(node => {
    switch (node.tagName) {
      case 'print':
        parsePrint(data, node);
        break;
      case 'barline':
        parseBarline(data, node, noteBegin);
        break;
      case 'attributes':
        parseAttributes(data, node, noteBegin);
        break;
      case 'note':
        noteBegin = true;
        parseNote(data, node, noteState);
        break;
      case 'forward':
        noteState.duration += Number(node.querySelector('duration').textContent);
        break;
      case 'backup':
        noteState.duration -= Number(node.querySelector('duration').textContent);
        break;
      case 'direction':
        // TODO
        break;
    }
  });
};

export const parsePart = partNode => {
  const id = partNode.getAttribute('id');
  const measures = [...partNode.querySelectorAll('measure')].map(node => {
    const data = {
      number: Number(node.getAttribute('number')),
      width: node.hasAttribute('width') ? Number(node.getAttribute('width')) : 100,
      notesMap: new Map(), // key is voice number
      voices: [],
      staffs: [],
      staffDetailsMap: new Map(), // key is staff number
    };

    if (node.hasAttribute('width'))
      data.width = Number(node.getAttribute('width'));

    parseNotes(data, [...node.children]);
    return new Measure(data);
  });

  return new Part({
    id: id,
    measures: measures,
  });
};
