// Copyright (c) Taehoon Moon 2015.
// @author Taehoon Moon

import Vex from 'vexflow';
import Measure from './Measure';

export default class Formatter {
  constructor(score) {
    this.score = score;
    this.defaults = this.score.getDefaults();
    this.parts = this.score.getParts();
    this.partList = this.score.getPartList();

    this.resetState();
  }

  resetState() {
    this.state = {
      numParts: this.parts.length,
      numMeasures: this.parts[0].getMeasures().length,
      pageNumber: 1,
      topSystemDistanceMap: new Map(),
      systemDistanceMap: new Map(),
      staffDistanceMap: new Map(),
      staffDisplayedMap: new Map(), // ${pi}/{staff}
    };

    const topSystemDistance = this.defaults.getTopSystemDistance();
    const systemDistance = this.defaults.getSystemDistance();
    const staffDistance = this.defaults.getStaffDistance();

    for (let pi = 0; pi < this.state.numParts; pi++) {
      this.state.topSystemDistanceMap.set(pi, topSystemDistance);
      this.state.systemDistanceMap.set(pi, systemDistance);
      this.state.staffDistanceMap.set(pi, staffDistance);

      const numStaffs = this.parts[pi].getNumStaffs();
      for (let staff = 1; staff <= numStaffs; staff++) {
        this.state.staffDisplayedMap.set(`${pi}/${staff}`, true);
      }
    }
  }

  formatX() {
    this.state.pageNumber = 1;
    const pageLeftMargin = this.defaults.getPageLeftMargin(this.state.pageNumber);
    const systemLeftMargin = this.defaults.getSystemLeftMargin();

    let x = 0;
    this.parts.forEach((part, pi) => {
      part.getMeasures().forEach((measure, mi) => {
        const printMeasure = this.parts[0].getMeasures()[mi];

        if (printMeasure.hasNewPage())
          this.state.pageNumber++;

        if (printMeasure.isNewLineStarting() || mi === 0)
          x = pageLeftMargin + printMeasure.getLeftMargin(systemLeftMargin);

        measure.setX(x);
        x += measure.getWidth();
      });
    });
  }

  updateMeasureDistances(mi) {
    this.parts.forEach((part, pi) => {
      const measure = part.getMeasures()[mi];
      if (!measure.hasPrint()) return;

      if (measure.hasTopSystemDistance())
        this.state.topSystemDistanceMap.set(pi, measure.getTopSystemDistance());

      if (measure.hasSystemDistance())
        this.state.systemDistanceMap.set(pi, measure.getSystemDistance());

      if (measure.hasStaffDistances())
        this.state.staffDistanceMap.set(pi, measure.getStaffDistance());

    });
  }

  updateMeasureYs({ aboveBottomY, mi }) {
    const measureTopYs = [];
    const measureBottomYs = [];

    const getDisplayed = (pi, numStaffs) => {
      for (let staff = 1; staff <= numStaffs; staff++) {
        if (this.state.staffDisplayedMap.get(`${pi}/${staff}`))
          return true;
      }

      return false;
    };

    this.parts.forEach((part, pi) => {
      const measure = part.getMeasures()[mi];
      const numStaffs = part.getNumStaffs();
      const topSystemDistance = this.state.topSystemDistanceMap.get(pi);
      const pageTopMargin = this.defaults.getPageTopMargin(this.state.pageNumber);
      const systemDistance = this.state.systemDistanceMap.get(pi);
      const staffDistance = this.state.staffDistanceMap.get(pi);
      const height = measure.getHeight(numStaffs, staffDistance);
      const displayed = getDisplayed(pi, numStaffs);

      if (displayed === false) {
        measureTopYs.push(undefined);
        measureBottomYs.push(undefined);
        return;
      }

      const measureTopY = pi === 0 && (measure.hasNewPage() || mi === 0) ?
        topSystemDistance + pageTopMargin :
        aboveBottomY + measure.getStaffDistance(0, staffDistance);
      const measureBottomY = measureTopY + height;

      aboveBottomY = measureBottomY;
      measureTopYs.push(measureTopY);
      measureBottomYs.push(measureBottomY);
    });

    return { measureTopYs, measureBottomYs };
  }

  updateStaffDisplayed(mi) {
    this.parts.forEach((part, pi) => {
      const numStaffs = part.getNumStaffs();
      const measure = part.getMeasures()[mi];

      for (let staff = 1; staff <= numStaffs; staff++) {
        const staffDisplayed = measure.isStaffDisplayed(staff, null);

        if (staffDisplayed !== null) {
          this.state.staffDisplayedMap.set(`${pi}/${staff}`, staffDisplayed);
        }
      }
    });
  }

  formatY() {
    this.state.pageNumber = 1;

    let measureTopYs = [];
    let measureBottomYs = [
      this.defaults.getPageTopMargin(this.state.pageNumber),
    ];

    for (let mi = 0; mi < this.state.numMeasures; mi++) {
      this.updateMeasureDistances(mi);

      this.parts.forEach((part, pi) => {
        const numStaffs = part.getNumStaffs();
        const measure = part.getMeasures()[mi];

        if ((measure.isNewLineStarting() || mi === 0) && pi === 0) {
          if (measure.hasNewPage()) this.state.pageNumber++;

          this.updateStaffDisplayed(mi);

          ({ measureTopYs, measureBottomYs } = this.updateMeasureYs({
            aboveBottomY: measureBottomYs[measureBottomYs.length - 1],
            mi,
          }));
        }

        const measureTopY = measureTopYs[pi];
        const staffDistance = this.state.staffDistanceMap.has(pi) ?
          this.state.staffDistanceMap.get(pi) : 0;

        for (let staff = 1; staff <= numStaffs; staff++) {
          measure.setStaffY(staff,
            measureTopY + (Measure.STAFF_HEIGHT + staffDistance) * (staff - 1)
          );
          measure.setStaffDisplayed(staff,
            this.state.staffDisplayedMap.get(`${pi}/${staff}`)
          );
        }

        measure.setY(measureTopY);
      });
    }
  }

  format() {
    this.resetState();
    this.formatX();
    this.formatY();

    this.parts.forEach(part => {
      const numStaffs = part.getNumStaffs();
      const measures = part.getMeasures();
      let printMeasure = measures[0];

      measures.forEach((measure, mi) => {
        if (measure.isNewLineStarting())
          printMeasure = measure;

        const staves = [];
        const staveOptions = {
          space_above_staff_ln: 0,
        };

        for (let staff = 1; staff <= numStaffs; staff++) {
          const x = measure.getX();
          const y = measure.getStaffY(staff);

          if (printMeasure.isStaffDisplayed(staff))
            staves.push(new Vex.Flow.Stave(x, y, measure.getWidth(), staveOptions));
        }

        measure.setStaves(staves);
      });
    });
  }
}
