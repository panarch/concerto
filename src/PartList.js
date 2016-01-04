// Copyright (c) Taehoon Moon 2015.
// @author Taehoon Moon

export default class PartList {
  constructor({ id, scoreParts, partGroups }) {
    this.id = id;
    this.scoreParts = scoreParts;
    this.partGroups = partGroups;
  }

  getScoreParts() { return this.scoreParts; }
  getPartGroups() { return this.partGroups; }
}
