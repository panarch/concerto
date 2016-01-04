// Copyright (c) Taehoon Moon 2015.
// @author Taehoon Moon

import { parsePart } from './PartParser';
import { parseSystemLayout, parseStaffLayout, parsePageLayout } from './LayoutParser';
import Score from './Score';
import Movement from './Movement';
import Identification from './Identification';
import Defaults from './Defaults';
import PartList from './PartList';
import Measure from './Measure';

const parseMovement = scorePartwise => {
  const titleNode = scorePartwise.querySelector('movement-title');
  const numberNode = scorePartwise.querySelector('movement-number');

  const title = titleNode ? titleNode.textContent : null;
  const number = numberNode ? numberNode.textContent : null;

  return new Movement({
    title: title,
    number: number,
  })
};

const parseIdentification = idNode => {
  const encodingNode = idNode.querySelector('encoding');
  const rightsNode = idNode.querySelector('rights');
  const encodingDateNode = encodingNode.querySelector('encoding-date');

  const rights = rightsNode ? rightsNode.textContent : null;
  const encodingDate = encodingDateNode ? encodingDateNode.textContent : null;
  const softwareList = [...encodingNode.querySelectorAll('software')].map(node => node.textContent);
  const creatorList = [...idNode.querySelectorAll('creator')].map(node => {
    return {
      type: node.getAttribute('type'),
      content: node.textContent,
    };
  });

  const encoding = {
    softwareList: softwareList,
    encodingDate: encodingDate,
  };

  return new Identification({
    rights: rights,
    creatorList: creatorList,
    encoding: encoding,
  });
};

const parseDefaults = defaultsNode => {
  const scalingNode = defaultsNode.querySelector('scaling');
  const pageLayoutNode = defaultsNode.querySelector('page-layout');
  const systemLayoutNode = defaultsNode.querySelector('system-layout');
  const staffLayoutNodes = [...defaultsNode.querySelectorAll('staff-layout')];

  const data = {
    scaling: {
      millimeters: Number(scalingNode.querySelector('millimeters').textContent),
      tenths: Number(scalingNode.querySelector('tenths').textContent),
    }
  };

  if (pageLayoutNode)
    data.pageLayout = parsePageLayout(pageLayoutNode);

  if (staffLayoutNodes)
    data.staffLayouts = parseStaffLayout(staffLayoutNodes);

  if (systemLayoutNode)
    data.systemLayout = parseSystemLayout(systemLayoutNode);

  return new Defaults(data);
};

const parsePartList = partListNode => {
  const scoreParts = [...partListNode.querySelectorAll('score-part')].map(node => {
    const scoreInstNode = node.querySelector('score-instrument');
    const midiInstNode = node.querySelector('midi-instrument');
    const volumeNode = midiInstNode.querySelector('volume');
    const panNode = midiInstNode.querySelector('pan');

    const midiInstrument = {
      id: midiInstNode.getAttribute('id'),
      midiChannel: Number(midiInstNode.querySelector('midi-channel').textContent),
      midiProgram: Number(midiInstNode.querySelector('midi-program').textContent),
    };

    if (volumeNode)
      midiInstrument.volume = Number(volumeNode.textContent);

    if (panNode)
      midiInstrument.pan = Number(panNode.textContent);

    return {
      partName: node.querySelector('part-name').textContent,
      scoreInstrument: {
        id: scoreInstNode.getAttribute('id'),
        instrumentName: scoreInstNode.querySelector('instrument-name').textContent,
      },
      midiInstrument: midiInstrument,
    };
  });

  const partGroups = [];
  const partGroupMap = new Map();
  let pi = 0;

  [...partListNode.children].forEach(node => {
    if (node.tagName === 'part-group') {
      const type = node.getAttribute('type');
      const number = Number(node.getAttribute('number'));
      if (type === 'stop') {
        const partGroup = partGroupMap.get(number);
        partGroup.stopPartIndex = pi - 1;
        partGroups.push(partGroup);
        return;
      }

      const groupSymbolNode = node.querySelector('group-symbol');
      const groupNameNode = node.querySelector('group-name');
      const groupBarlineNode = node.querySelector('group-barline');
      const partGroup = {
        number: number,
        startPartIndex: pi,
      };

      if (groupSymbolNode)
        partGroup.groupSymbol = groupSymbolNode.textContent;

      if (groupNameNode)
        partGroup.groupName = groupNameNode.textContent;

      if (groupBarlineNode)
        partGroup.groupBarline = groupBarlineNode.textContent === 'yes';

      partGroupMap.set(number, partGroup);
    } else if (node.tagName === 'score-part') {
      pi++;
    }
  });

  return new PartList({
    id: partListNode.getAttribute('id'),
    scoreParts,
    partGroups,
  });
};

const parseParts = partNodes => {
  return partNodes.map(node => parsePart(node));
};

export const parse = (doc) => {
  const scorePartwise = doc.querySelector('score-partwise');
  const version = scorePartwise.getAttribute('version');
  const movement = parseMovement(scorePartwise);
  const identification = parseIdentification(scorePartwise.querySelector('identification'));
  const defaults = parseDefaults(scorePartwise.querySelector('defaults'));
  const partList = parsePartList(scorePartwise.querySelector('part-list'));
  const parts = parseParts([...scorePartwise.querySelectorAll('part')]);

  return new Score({
    version: version,
    movement: movement,
    identification: identification,
    defaults: defaults,
    partList: partList,
    parts: parts,
  });
};
