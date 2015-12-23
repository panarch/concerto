// Copyright (c) Taehoon Moon 2015.
// @author Taehoon Moon

export default class Score {
  constructor({ version, movement, identification, defaults, partList, parts }) {
    this.formatted = false;
    this.version = version;
    this.movement = movement;
    this.identification = identification;
    this.defaults = defaults;
    this.partList = partList;
    this.parts = parts;
  }

  getFormatted() { return this.formatted; }
  getMovement() { return this.movement; }
  getIdentification() { return this.identification; }
  getDefaults() { return this.defaults; }
  getPartList() { return this.partList; }
  getParts() { return this.parts; }
}
