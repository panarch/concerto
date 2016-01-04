// Copyright (c) Taehoon Moon 2015.
// @author Taehoon Moon

export default class Part {
  constructor({ id, measures }) {
    this.id = id;
    this.measures = measures;
    this.numStaffs = null;
  }

  getMeasures() { return this.measures; }

  getNumStaffs() {
    if (this.numStaffs !== null) return this.numStaffs;

    this.numStaffs = 0;
    this.measures.forEach(measure => {
      this.numStaffs = Math.max(this.numStaffs, measure.getNumStaffs())
    });

    return this.numStaffs;
  }
}
