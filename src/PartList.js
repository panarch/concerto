// Copyright (c) Taehoon Moon 2015.
// @author Taehoon Moon

export default class PartList {
  constructor({ id, scoreParts, partGroups }) {
    this.id = id;
    this.scoreParts = scoreParts;
    this.partGroups = partGroups;

    // formatted
    this.connectors = [];
  }

  getScoreParts() { return this.scoreParts; }
  getPartGroups() { return this.partGroups; }

  getConnectors() { return this.connectors; }
  setConnectors(connectors) { this.connectors = connectors; }
}
