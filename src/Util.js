// Copyright (c) Taehoon Moon 2016.
// @author Taehoon Moon

import Vex from 'vexflow';
import Table from './Table';

export const getVFClef = clef => {
  if (clef === undefined) return;

  let vfClef;
  switch (clef.sign) {
    case 'G':
    case 'C':
    case 'F':
      vfClef = Table.VF_CLEF[`${clef.sign}/${clef.line}`];
      break;
    default:
      vfClef = Table.VF_CLEF[clef.sign];
  }

  return vfClef;
};

export const getVFKeySignature = keySig => {
  if (keySig === undefined) return;

  const fifths = keySig.fifths;
  const keySpecs = Vex.Flow.keySignature.keySpecs;

  let vfKey;
  Object.keys(keySpecs).forEach(key => {
    const { acc, num } = keySpecs[key];
    if (/m/.test(key) || Math.abs(fifths) !== num) return;

    if (fifths === 0 ||
        (fifths > 0 && acc === '#') ||
        (fifths < 0 && acc === 'b')) {
      vfKey = key;
    }
  });

  return vfKey;
};
