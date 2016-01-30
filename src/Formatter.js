// Copyright (c) Taehoon Moon 2015.
// @author Taehoon Moon

import Vex from 'vexflow';
import Measure from './Measure';
import {
  getVFClef,
  getVFKeySignature,
  getVFConnectorType,
} from './Util';

export default class Formatter {
  constructor(score) {
    this.score = score;
    this.defaults = this.score.getDefaults();
    this.credits = this.score.getCredits();
    this.parts = this.score.getParts();
    this.partList = this.score.getPartList();
    this.context = this.createContext();
  }

  createContext() {
    // Fake context for using measureText function
    const div = document.createElement('div');
    div.style.width = '1px';
    div.style.height = '1px';
    div.style.opacity = 0;
    div.style.zIndex = -1;
    document.getElementsByTagName('body')[0].appendChild(div);

    return Vex.Flow.Renderer.getSVGContext(div, 100, 100);
  }

  resetState() {
    this.state = {
      numParts: this.parts.length,
      numMeasures: this.parts[0].getMeasures().length,
      pageNumber: 1,
      topSystemDistanceMap: new Map(),
      systemDistanceMap: new Map(),
      staffDistanceMap: new Map(), // ${pi}/{staff}
      staffDisplayedMap: new Map(), // ${pi}/{staff}
    };

    const topSystemDistance = this.defaults.getTopSystemDistance();
    const systemDistance = this.defaults.getSystemDistance();
    const staffDistance = this.defaults.getStaffDistance();

    for (let pi = 0; pi < this.state.numParts; pi++) {
      this.state.topSystemDistanceMap.set(pi, topSystemDistance);
      this.state.systemDistanceMap.set(pi, systemDistance);

      const numStaffs = this.parts[pi].getNumStaffs();
      for (let staff = 1; staff <= numStaffs; staff++) {
        const key = `${pi}/${staff}`;
        this.state.staffDistanceMap.set(key, staffDistance);
        this.state.staffDisplayedMap.set(key, true);
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

      if (measure.hasStaffDistances()) {
        [...measure.getStaffLayoutMap().keys()].forEach(staff => {
          this.state.staffDistanceMap.set(`${pi}/${staff}`, measure.getStaffDistance(staff));
        });
      }

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
      const staffDistance = this.state.staffDistanceMap.get(`${pi}/1`);
      const displayed = getDisplayed(pi, numStaffs);

      if (displayed === false) {
        measureTopYs.push(undefined);
        measureBottomYs.push(undefined);
        return;
      }

      let height = Measure.STAFF_HEIGHT;
      for (let staff = 2; staff <= numStaffs; staff++) {
        height += Measure.STAFF_HEIGHT + this.state.staffDistanceMap.get(`${pi}/${staff}`);
      }

      const measureTopY = pi === 0 && (measure.hasNewPage() || mi === 0) ?
        topSystemDistance + pageTopMargin :
        aboveBottomY + (pi === 0 ? systemDistance : staffDistance);
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
        for (let staff = 1; staff <= numStaffs; staff++) {
          const key = `${pi}/${staff}`;
          const staffDistance = this.state.staffDistanceMap.has(key) ?
            this.state.staffDistanceMap.get(key) : 0;

          measure.setStaffY(staff,
            measureTopY + (Measure.STAFF_HEIGHT + staffDistance) * (staff - 1)
          );
          measure.setStaffDisplayed(staff, this.state.staffDisplayedMap.get(`${pi}/${staff}`));
        }

        measure.setY(measureTopY);
      });
    }
  }

  createStaves() {
    this.parts.forEach(part => {
      const numStaffs = part.getNumStaffs();
      const measures = part.getMeasures();
      let printMeasure = measures[0];

      measures.forEach((measure, mi) => {
        if (measure.isNewLineStarting())
          printMeasure = measure;

        const x = measure.getX();
        const width = measure.getWidth();
        const options = {
          space_above_staff_ln: 0,
        };

        for (let staff = 1; staff <= numStaffs; staff++) {
          const y = measure.getStaffY(staff);

          if (printMeasure.isStaffDisplayed(staff)) {
            const stave = new Vex.Flow.Stave(x, y, width, options);
            stave.setBegBarType(Vex.Flow.Barline.type.NONE);
            measure.setStave(staff, stave);
          }
        }
      });
    });
  }

  formatMeasureNumber() {
    let measureNumbering = 'system'; // default value

    this.parts[0].getMeasures().forEach((measure, mi) => {
      const print = measure.getPrint();
      if (print && print.measureNumbering) measureNumbering = print.measureNumbering;

      const topStave = measure.getStaves()[0];
      if (!topStave) return;

      if (measureNumbering === 'measure' ||
          (measureNumbering === 'system' && measure.isNewLineStarting())) {
        topStave.setMeasure(mi + 1);
      }
    });
  }

  formatClef() {
    this.parts.forEach((part, pi) => {
      const clefMap = new Map(); // {staff}
      let prevMeasure;

      part.getMeasures().forEach((measure, mi) => {
        const clefUpdated = new Map(); // {staff}

        measure.getClefMap().forEach((clef, staff) => {
          clefMap.set(staff, clef);
          clefUpdated.set(staff, clef);
        });

        if (mi === 0 || measure.isNewLineStarting()) {
          measure.getStaveMap().forEach((stave, staff) => {
            const vfClef = getVFClef(clefMap.get(staff));
            if (vfClef) stave.addClef(vfClef);
          });
        }

        clefUpdated.forEach((clef, staff) => {
          if (!prevMeasure) return;

          const vfClef = getVFClef(clef);
          const stave = prevMeasure.getStave(staff);
          if (stave) stave.addEndClef(vfClef, 'small');
        });

        measure.getNotesMap().forEach(notes => {
          let staff = 1;
          notes.forEach(note => {
            if (note.staff && note.staff !== staff) staff = note.staff;
            if (note.tag === 'clef') clefMap.set(staff, note);
          });
        });

        prevMeasure = measure;
      });
    });
  }

  formatKeySignature() {
    this.parts.forEach((part, pi) => {
      let prevMeasure;
      let key;

      part.getMeasures().forEach((measure, mi) => {
        let keyUpdated = false;

        if (measure.getKey()) {
          key = measure.getKey();
          keyUpdated = true;
        }

        if (mi === 0 || measure.isNewLineStarting() || keyUpdated) {
          measure.getStaves().forEach(stave => {
            const vfKey = getVFKeySignature(key);
            if (key) stave.addKeySignature(vfKey);
          })
        }

        if (measure.isNewLineStarting() && keyUpdated) {
          prevMeasure.getStaves().forEach(stave => {
            // TODO: Apply after current PR for vexflow merged.
            //const vfKey = getVFKeySignature(key);
            //if (key) stave.addEndKeySignature(vfKey);
          });
        }

        prevMeasure = measure;
      });
    });
  }

  formatTimeSignature() {
    this.parts.forEach((part, pi) => {
      //const numStaffs = part.getNumStaffs();
      let prevMeasure;
      let time;

      part.getMeasures().forEach((measure, mi) => {
        let timeUpdated = false;

        if (measure.getTime()) {
          time = measure.getTime();
          timeUpdated = true;
        }

        if (mi === 0 || timeUpdated) {
          measure.getStaves().forEach(stave => {
            if (time) stave.addTimeSignature(`${time.beats}/${time.beatType}`);
          });
        }

        if (measure.isNewLineStarting() && timeUpdated) {
          prevMeasure.getStaves().forEach(stave => {
            stave.addEndTimeSignature(`${time.beats}/${time.beatType}`);
          });
        }

        prevMeasure = measure;
      });
    });
  }

  formatCredits() {
    const getTextAnchor = value => {
      switch (value) {
        case 'left': return 'start';
        case 'right': return 'end';
        case 'center': return 'middle';
      }
    };

    const getDominantBaseline = value => {
      switch (value) {
        case 'top': return 'hanging';
        case 'middle': return 'middle';
        case 'bottom':
        case 'baseline': return 'alphabetical';
      }
    };

    const pageSize = this.score.getDefaults().getPageSize();
    // words.fontSize = Number(/(\d+)\w*/.exec(node.getAttribute('font-size')[1]));
    this.credits.forEach(credit => {
      const texts = [];
      let x;
      let y;
      let fontSize;
      let textAnchor = 'hanging'; // TODO: full justify & halign support
      let baseline = 'start';

      credit.getWordsList().forEach(words => {
        if (!/\w+/.test(words.content)) return; // ignore empty line-break

        const text = {
          content: words.content,
          attributes: new Map(),
        };

        if (words.defaultX !== undefined) x = words.defaultX;
        if (words.defaultY !== undefined) y = pageSize.height - words.defaultY;
        if (words.justify !== undefined) textAnchor = getTextAnchor(words.justify);
        if (words.halign !== undefined) textAnchor = getTextAnchor(words.halign);
        if (words.valign !== undefined) baseline = getDominantBaseline(words.valign);

        if (textAnchor) text.attributes.set('text-anchor', textAnchor);
        if (baseline) text.attributes.set('dominant-baseline', baseline);

        this.context.save();
        if (words.fontSize !== undefined) {
          fontSize = words.fontSize;
          if (/\d+$/.test(fontSize)) {
            fontSize = Number(fontSize) * 2.5; // TODO
            fontSize += 'px';
          }

          text.attributes.set('font-size', fontSize);
          this.context.attributes['font-size'] = fontSize; // svgcontext only
        }

        // default font: "times", no custom font support
        text.attributes.set('font-family', 'times');
        this.context.attributes['font-family'] = 'times';

        const bbox = this.context.measureText(text.content);
        this.context.restore();

        text.x = x;
        text.y = y;
        texts.push(text);
        y += bbox.height;
      });

      credit.setTexts(texts);
    });
  }

  formatPartList() {
    const partGroups = this.partList.getPartGroups();
    const scoreParts = this.partList.getScoreParts();
    const numMeasures = this.parts[0].getMeasures().length;
    const connectors = [];

    const findTopStave = (pi, mi, max) => {
      for (; pi < max; pi++) {
        const staves = this.parts[pi].getMeasures()[mi].getStaves();
        if (staves && staves.length > 0)
          return staves[0];

      }
    };

    const findBottomStave = (pi, mi, min) => {
      for (; pi > min; pi--) {
        const staves = this.parts[pi].getMeasures()[mi].getStaves();
        if (staves && staves.length > 0)
          return staves[staves.length - 1];

      }
    };

    const setText = ({ stave, staveConnector, text }) => {
      const contents = text.split(/\n/);
      const topY = (1 - contents.length) * 10;
      contents.forEach((content, i) => {
        const textOptions = { shift_y: topY + i * 20 };
        if (stave) {
          const position = Vex.Flow.Modifier.Position.LEFT;
          textOptions.shift_x = 8;
          stave.setText(content, position, textOptions);
        }
        else staveConnector.setText(content, textOptions);
      });
    };

    let page = 1;

    for (let mi = 0; mi < numMeasures; mi++) {
      const firstPartMeasure = this.parts[0].getMeasures()[mi];
      const isNewLineStarting = mi === 0 || firstPartMeasure.isNewLineStarting();
      if (firstPartMeasure.hasNewPage()) page++;

      if (isNewLineStarting) {
        const topStave = findTopStave(0, mi, this.parts.length - 1);
        const bottomStave = findBottomStave(this.parts.length - 1, mi, 0);
        if (topStave && bottomStave) {
          const staveConnector = new Vex.Flow.StaveConnector(topStave, bottomStave);
          staveConnector.setType(Vex.Flow.StaveConnector.type.SINGLE_LEFT);
          connectors.push({ page, staveConnector });
        }
      }

      partGroups.forEach(partGroup => {
        const { startPartIndex, stopPartIndex } = partGroup;
        let topStave = findTopStave(startPartIndex, mi, stopPartIndex);
        let bottomStave = findBottomStave(stopPartIndex, mi, startPartIndex);
        if (!topStave || !bottomStave) {
          if (!isNewLineStarting) return;

          topStave = findTopStave(startPartIndex, mi, stopPartIndex + 1);
          bottomStave = findBottomStave(stopPartIndex, mi, startPartIndex - 1);
          if (!topStave || !bottomStave) return;

          const staveConnector = new Vex.Flow.StaveConnector(topStave, bottomStave);
          const connectorType = partGroup.groupSymbol === 'bracket' ?
            Vex.Flow.StaveConnector.type.BRACKET :
            Vex.Flow.StaveConnector.type.SINGLE_LEFT;
          staveConnector.setType(connectorType);

          /* TODO: Current vexflow StaveConnector only provides a single text
          if (mi === 0 && partGroup.groupName)
            setText({ staveConnector, text: partGroup.partName });
          */
          if (mi > 0 && partGroup.groupAbbreviation)
            setText({ staveConnector, text: partGroup.groupAbbreviation });

          connectors.push({ page, staveConnector });
          return;
        }

        if (partGroup.groupBarline) {
          const staveConnector = new Vex.Flow.StaveConnector(topStave, bottomStave);
          staveConnector.setType(Vex.Flow.StaveConnector.type.SINGLE_RIGHT);
          connectors.push({ page, staveConnector });
        }

        if (!isNewLineStarting) return;

        const staveConnector = new Vex.Flow.StaveConnector(topStave, bottomStave);
        let hasGroupSymbol = false;
        if (partGroup.groupSymbol) {
          hasGroupSymbol = true;
          const connectorType = getVFConnectorType(partGroup.groupSymbol);
          staveConnector.setType(connectorType);
          staveConnector.setXShift(0);
        }

        if (mi === 0 && partGroup.groupName)
          setText({ staveConnector, text: partGroup.groupName });
        else if (mi > 0 && partGroup.groupAbbreviation)
          setText({ staveConnector, text: partGroup.groupAbbreviation });

        // TODO: update vexflow StaveConnector NONE type
        if (!hasGroupSymbol) staveConnector.setType(Vex.Flow.StaveConnector.type.SINGLE_LEFT);

        connectors.push({ page, staveConnector });
      });

      // single part && multiple-staff
      this.parts.forEach((part, pi) => {
        const scorePart = scoreParts[pi];
        const staves = part.getMeasures()[mi].getStaves();

        if (staves.length === 1) {
          const stave = staves[0];
          if (mi === 0 && scorePart.partName)
            setText({ stave, text: scorePart.partName });
          else if (mi > 0 && isNewLineStarting && scorePart.partAbbreviation)
            setText({ stave, text: scorePart.partAbbreviation });

          return;
        } else if (!staves) return;

        const [topStave, bottomStave] = [staves[0], staves[staves.length - 1]];
        if (!topStave || !bottomStave) return;

        if (isNewLineStarting) {
          let staveConnector = new Vex.Flow.StaveConnector(topStave, bottomStave);
          staveConnector.setType(Vex.Flow.StaveConnector.type.BRACE);
          connectors.push({ page, staveConnector });

          if (mi === 0 && scorePart.partName)
            setText({ staveConnector, text: scorePart.partName });
          else if (mi > 0 && isNewLineStarting && scorePart.partAbbreviation)
            setText({ staveConnector, text: scorePart.partAbbreviation });

          staveConnector = new Vex.Flow.StaveConnector(topStave, bottomStave);
          staveConnector.setType(Vex.Flow.StaveConnector.type.SINGLE_LEFT);
          connectors.push({ page, staveConnector });
        }

        const staveConnector = new Vex.Flow.StaveConnector(topStave, bottomStave);
        staveConnector.setType(Vex.Flow.StaveConnector.type.SINGLE_RIGHT);
        connectors.push({ page, staveConnector });
      });
    }

    this.partList.setConnectors(connectors);
  }

  format() {
    this.resetState();
    this.formatX();
    this.formatY();
    this.createStaves();
    this.formatMeasureNumber();
    this.formatClef();
    this.formatKeySignature();
    this.formatTimeSignature();
    this.formatCredits();
    this.formatPartList();
  }
}
