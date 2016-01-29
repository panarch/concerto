// Copyright (c) Taehoon Moon 2015.
// @author Taehoon Moon

import Vex from 'vexflow';

export default class Renderer {
  constructor(score, { element }) {
    this.score = score;
    this.element = element;
    this.numPages = score.getNumPages();
    this.pageSize = this.score.getDefaults().getPageSize();
    this.contexts = [];
  }

  getContexts() { return this.contexts; }

  setupRenderers() {
    const { width, height } = this.pageSize;

    this.contexts = [];
    for (let i = 0; i < this.numPages; i++) {
      const context = Vex.Flow.Renderer.getSVGContext(this.element, width, height);
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

  renderPartList() {
    this.score.getPartList().getConnectors().forEach(connector => {
      const context = this.contexts[connector.page - 1];
      connector.staveConnector.setContext(context).draw();
    });
  }

  renderCredits() {
    this.score.getCredits().forEach(credit => {
      const context = this.contexts[credit.getPage() - 1];

      credit.getTexts().forEach(({ content, x, y, attributes }) => {
        context.save();
        attributes.forEach((value, key) => context.attributes[key] = value);
        context.fillText(content, x, y);
        context.restore();
      });
    });
  }

  render() {
    this.setupRenderers();
    this.renderStaves();
    this.renderPartList();
    this.renderCredits();
  }
}
