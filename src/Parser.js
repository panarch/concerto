// Copyright (c) Taehoon Moon 2015.
// @author Taehoon Moon

import { parsePart } from './PartParser';
import { parseSystemLayout, parseStaffLayout, parsePageLayout } from './LayoutParser';
import Score from './Score';
import Movement from './Movement';
import Identification from './Identification';
import Defaults from './Defaults';
import Credit from './Credit';
import PartList from './PartList';

const parseMovement = scorePartwise => {
  const titleNode = scorePartwise.getElementsByTagName('movement-title')[0];
  const numberNode = scorePartwise.getElementsByTagName('movement-number')[0];

  const title = titleNode ? titleNode.textContent : null;
  const number = numberNode ? numberNode.textContent : null;

  return new Movement({
    title: title,
    number: number,
  })
};

const parseIdentification = idNode => {
  const encodingNode = idNode.getElementsByTagName('encoding')[0];
  const rightsNode = idNode.getElementsByTagName('rights')[0];
  const encodingDateNode = encodingNode.getElementsByTagName('encoding-date')[0];

  const rights = rightsNode ? rightsNode.textContent : null;
  const encodingDate = encodingDateNode ? encodingDateNode.textContent : null;
  const softwareList = [...encodingNode.getElementsByTagName('software')].map(node => node.textContent);
  const creatorList = [...idNode.getElementsByTagName('creator')].map(node => {
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
  const scalingNode = defaultsNode.getElementsByTagName('scaling')[0];
  const pageLayoutNode = defaultsNode.getElementsByTagName('page-layout')[0];
  const systemLayoutNode = defaultsNode.getElementsByTagName('system-layout')[0];
  const staffLayoutNodes = [...defaultsNode.getElementsByTagName('staff-layout')];

  const data = {
    scaling: {
      millimeters: Number(scalingNode.getElementsByTagName('millimeters')[0].textContent),
      tenths: Number(scalingNode.getElementsByTagName('tenths')[0].textContent),
    },
  };

  if (pageLayoutNode)
    data.pageLayout = parsePageLayout(pageLayoutNode);

  if (staffLayoutNodes)
    data.staffLayoutMap = parseStaffLayout(staffLayoutNodes);

  if (systemLayoutNode)
    data.systemLayout = parseSystemLayout(systemLayoutNode);

  return new Defaults(data);
};

const parseCredit = creditNode => {
  const typeNode = creditNode.getElementsByTagName('credit-type')[0];
  const data = {
    page: creditNode.hasAttribute('page') ? Number(creditNode.getAttribute('page')) : 1,
  };

  if (typeNode) data.type = typeNode.textContent;

  data.wordsList = [...creditNode.getElementsByTagName('credit-words')].map(node => {
    const words = { content: node.textContent };
    if (node.hasAttribute('justify')) words.justify = node.getAttribute('justify');
    if (node.hasAttribute('default-x')) words.defaultX = Number(node.getAttribute('default-x'));
    if (node.hasAttribute('default-y')) words.defaultY = Number(node.getAttribute('default-y'));
    if (node.hasAttribute('halign')) words.halign = node.getAttribute('halign');
    if (node.hasAttribute('valign')) words.valign = node.getAttribute('valign');
    if (node.hasAttribute('font-size')) words.fontSize = node.getAttribute('font-size');

    return words;
  });

  return new Credit(data);
};

const parsePartList = partListNode => {
  const scoreParts = [...partListNode.getElementsByTagName('score-part')].map(node => {
    const scoreInstNode = node.getElementsByTagName('score-instrument')[0];
    const partNameNode = node.getElementsByTagName('part-name')[0];
    const partAbbreviationNode = node.getElementsByTagName('part-abbreviation')[0];
    const midiInstNode = node.getElementsByTagName('midi-instrument')[0];
    const volumeNode = midiInstNode.getElementsByTagName('volume')[0];
    const panNode = midiInstNode.getElementsByTagName('pan')[0];
    const scorePart = {
      midiInstrument: {
        id: midiInstNode.getAttribute('id'),
        midiChannel: Number(midiInstNode.getElementsByTagName('midi-channel')[0].textContent),
        midiProgram: Number(midiInstNode.getElementsByTagName('midi-program')[0].textContent),
      },
      scoreInstrument: {
        id: scoreInstNode.getAttribute('id'),
        instrumentName: scoreInstNode.getElementsByTagName('instrument-name')[0].textContent,
      },
    }

    if (volumeNode) scorePart.midiInstrument.volume = Number(volumeNode.textContent);
    if (panNode) scorePart.midiInstrument.pan = Number(panNode.textContent);
    if (partNameNode) scorePart.partName = partNameNode.textContent;
    if (partAbbreviationNode) scorePart.partAbbreviation = partAbbreviationNode.textContent;

    return scorePart;
  });

  const partGroups = [];
  const partGroupMap = new Map();
  let pi = 0;

  [...partListNode.childNodes].forEach(node => {
    if (node.tagName === 'part-group') {
      const type = node.getAttribute('type');
      const number = Number(node.getAttribute('number'));
      if (type === 'stop') {
        const partGroup = partGroupMap.get(number);
        partGroup.stopPartIndex = pi - 1;
        partGroups.push(partGroup);
        return;
      }

      const groupSymbolNode = node.getElementsByTagName('group-symbol')[0];
      const groupNameNode = node.getElementsByTagName('group-name')[0];
      const groupAbbreviationNode = node.getElementsByTagName('group-abbreviation')[0];
      const groupBarlineNode = node.getElementsByTagName('group-barline')[0];
      const partGroup = {
        number: number,
        startPartIndex: pi,
      };

      if (groupSymbolNode)
        partGroup.groupSymbol = groupSymbolNode.textContent;

      if (groupNameNode)
        partGroup.groupName = groupNameNode.textContent;

      if (groupAbbreviationNode)
        partGroup.groupAbbreviation = groupAbbreviationNode.textContent;

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

const parseCredits = creditNodes => {
  return creditNodes.map(node => parseCredit(node));
};

const parseParts = partNodes => {
  return partNodes.map(node => parsePart(node));
};

export const parse = (doc) => {
  const scorePartwise = doc.getElementsByTagName('score-partwise')[0];
  const version = scorePartwise.getAttribute('version');
  const movement = parseMovement(scorePartwise);
  const identification = parseIdentification(
    scorePartwise.getElementsByTagName('identification')[0]
  );
  const defaults = parseDefaults(scorePartwise.getElementsByTagName('defaults')[0]);
  const credits = parseCredits([...scorePartwise.getElementsByTagName('credit')]);
  const partList = parsePartList(scorePartwise.getElementsByTagName('part-list')[0]);
  const parts = parseParts([...scorePartwise.getElementsByTagName('part')]);

  return new Score({
    version,
    movement,
    identification,
    defaults,
    credits,
    partList,
    parts,
  });
};
