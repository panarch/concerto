// Copyright (c) Taehoon Moon 2015.
// @author Taehoon Moon

export default class Score {
  constructor({ version, movement, identification, defaults, credits, partList, parts }) {
    this.formatted = false;
    this.version = version;
    this.movement = movement;
    this.identification = identification;
    this.defaults = defaults;
    this.credits = credits;
    this.partList = partList;
    this.parts = parts;
  }

  getFormatted() { return this.formatted; }
  getMovement() { return this.movement; }
  getIdentification() { return this.identification; }
  getDefaults() { return this.defaults; }
  getCredits() { return this.credits; }
  getPartList() { return this.partList; }
  getParts() { return this.parts; }

  getNumPages() {
    let num = 1;
    this.parts[0].getMeasures().forEach(measure => {
      if (measure.hasNewPage()) num++;
    });

    return num;
  }
}
