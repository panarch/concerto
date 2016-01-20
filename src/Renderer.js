// Copyright (c) Taehoon Moon 2015.
// @author Taehoon Moon

import Vex from 'vexflow';

export default class Renderer {
  constructor(score, { element }) {
    this.score = score;
    this.element = element;
    this.numPages = score.getNumPages();
    this.contexts = [];
  }

  getContexts() { return this.contexts; }

  setupRenderers() {
    const pageSize = this.score.getDefaults().getPageSize();

    this.contexts = [];
    for (let i = 0; i < this.numPages; i++) {
      const context = Vex.Flow.Renderer.getSVGContext(this.element, pageSize.width, pageSize.height);
      this.contexts.push(context);
    }
  }

  renderStaves() {
    this.score.getParts().forEach((part, pi) => {
      let index = 0;
      let context = this.contexts[index];

      part.getMeasures().forEach((measure, mi) =>{
        if (measure.hasNewPage()) {
          index++;
          context = this.contexts[index];
        }

        measure.getStaves().forEach(stave => {
          stave.setContext(context).draw();
        });
      });
    });
  }

  renderStaveConnectors() {
    const parts = this.score.getParts();
    const partList = this.score.getPartList();
    const partGroups = partList.getPartGroups();
    const numMeasures = parts[0].getMeasures().length;

    const findTopStave = (pi, mi, max) => {
      for (; pi < max; pi++) {
        const staves = parts[pi].getMeasures()[mi].getStaves();
        if (staves && staves.length > 0)
          return staves[0];

      }
    };

    const findBottomStave = (pi, mi, min) => {
      for (; pi > min; pi--) {
        const staves = parts[pi].getMeasures()[mi].getStaves();
        if (staves && staves.length > 0)
          return staves[staves.length - 1];

      }
    };

    let index = 0;
    let context = this.contexts[index];

    for (let mi = 0; mi < numMeasures; mi++) {
      const firstPartMeasure = parts[0].getMeasures()[mi];
      const isNewLineStarting = mi === 0 || firstPartMeasure.isNewLineStarting();
      if (firstPartMeasure.hasNewPage()) {
        index++;
        context = this.contexts[index];
      }

      if (isNewLineStarting) {
        const topStave = findTopStave(0, mi, parts.length - 1);
        const bottomStave = findBottomStave(parts.length - 1, mi, 0);
        if (topStave && bottomStave) {
          const connector = new Vex.Flow.StaveConnector(topStave, bottomStave);
          connector.setContext(context);
          connector.setType(Vex.Flow.StaveConnector.type.SINGLE_LEFT);
          connector.draw();
        }
      }

      partGroups.forEach(partGroup => {
        const { startPartIndex, stopPartIndex } = partGroup;
        let topStave = findTopStave(startPartIndex, mi, stopPartIndex);
        let bottomStave = findBottomStave(stopPartIndex, mi, startPartIndex);
        if (!topStave || !bottomStave) {
          if (partGroup.groupSymbol !== 'bracket' || !isNewLineStarting) return;

          topStave = findTopStave(startPartIndex, mi, stopPartIndex + 1);
          bottomStave = findBottomStave(stopPartIndex, mi, startPartIndex - 1);
          if (!topStave || !bottomStave) return;

          const connector = new Vex.Flow.StaveConnector(topStave, bottomStave);
          connector.setContext(context);
          connector.setType(Vex.Flow.StaveConnector.type.BRACKET);
          connector.draw();
          return;
        }

        const connector = new Vex.Flow.StaveConnector(topStave, bottomStave);
        connector.setContext(context);
        if (partGroup.groupBarline) {
          connector.setType(Vex.Flow.StaveConnector.type.SINGLE_RIGHT);
          connector.draw();
        }

        if (!isNewLineStarting) return;

        if (partGroup.groupSymbol) {
          const connectorType = Renderer.getVexConnectorType(partGroup.groupSymbol);
          connector.setType(connectorType);
          connector.draw();
          connector.setXShift(0);
        }
      });

      // single part && multiple-staff
      parts.forEach(part => {
        const staves = part.getMeasures()[mi].getStaves();
        if (!staves || staves.length === 1) return;

        const [topStave, bottomStave] = [staves[0], staves[staves.length - 1]];
        if (!topStave || !bottomStave) return;

        const connector = new Vex.Flow.StaveConnector(topStave, bottomStave);
        connector.setContext(context);
        if (isNewLineStarting) {
          connector.setType(Vex.Flow.StaveConnector.type.BRACE);
          connector.draw();
          connector.setType(Vex.Flow.StaveConnector.type.SINGLE_LEFT);
          connector.draw();
        }

        connector.setType(Vex.Flow.StaveConnector.type.SINGLE_RIGHT);
        connector.draw();
      });
    }
  }

  render() {
    this.setupRenderers();
    this.renderStaves();
    this.renderStaveConnectors();
  }

  static getVexConnectorType(groupSymbol) {
    let connectorType;
    switch (groupSymbol) {
      case 'brace':
        connectorType = Vex.Flow.StaveConnector.type.BRACE;
        break;
      case 'bracket':
        connectorType = Vex.Flow.StaveConnector.type.BRACKET;
        break;
      case 'line':
      default:
        connectorType = Vex.Flow.StaveConnector.type.DOUBLE;
    }

    return connectorType;
  }
}
