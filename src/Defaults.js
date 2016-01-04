// Copyright (c) Taehoon Moon 2015.
// @author Taehoon Moon

export default class Defaults {
  constructor({ scaling, pageLayout, systemLayout, staffLayouts }) {
    this.scaling = scaling;
    this.pageLayout = pageLayout;
    this.systemLayout = systemLayout;
    this.staffLayouts = staffLayouts;
  }

  getPageLayout() { return this.pageLayout; }
  getSystemLayout() { return this.systemLayout; }
  getStaffLayout() { return this.staffLayout; }

  getPageSize() {
    return {
      width: this.pageLayout.pageWidth,
      height: this.pageLayout.pageHeight,
    };
  }

  getPageMarginsMap() {
    return this.pageLayout && this.pageLayout.pageMarginsMap ?
      this.pageLayout.pageMarginsMap :
      undefined;
  }

  getPageMargin(pageNumber, pageMarginType) {
    const pageMarginsMap = this.getPageMarginsMap();
    const defaultMargin = Defaults.PAGE_MARGINS[pageMarginType];

    if (!pageMarginsMap) return defaultMargin;

    const pageMargins = pageMarginsMap.has('both') ?
      pageMarginsMap.get('both') :
      pageMarginsMap.get(pageNumber % 2 === 0 ? 'even' : 'odd');

    return pageMargins && pageMargins[pageMarginType] !== undefined ?
      pageMargins[pageMarginType] :
      defaultMargin;
  }

  getPageLeftMargin(pageNumber) { return this.getPageMargin(pageNumber, 'leftMargin'); }
  getPageRightMargin(pageNumber) { return this.getPageMargin(pageNumber, 'rightMargin'); }
  getPageTopMargin(pageNumber) { return this.getPageMargin(pageNumber, 'topMargin'); }
  getPageBottomMargin(pageNumber) { return this.getPageMargin(pageNumber, 'bottomMargin'); }

  getSystemMargins() {
    return this.systemLayout && this.systemLayout.systemMargins ?
      this.systemLayout.systemMargins :
      undefined;
  }

  getSystemMargin(systemMarginType) {
    const systemMargins = this.getSystemMargins();
    return systemMargins ?
      systemMargins[systemMarginType] :
      Defaults.SYSTEM_MARGINS[systemMarginType];
  }

  getSystemLeftMargin() { return this.getSystemMargin('leftMargin'); }
  getSystemRightMargin() { return this.getSystemMargin('rightMargin'); }

  getTopSystemDistance() {
    return this.systemLayout && this.systemLayout.topSystemDistance !== undefined ?
      this.systemLayout.topSystemDistance :
      Defaults.TOP_SYSTEM_DISTANCE;
  }

  getSystemDistance() {
    return this.systemLayout && this.systemLayout.systemDistance !== undefined ?
      this.systemLayout.systemDistance :
      this.SYSTEM_DISTANCE;
  }

  getStaffDistance(index = 0) {
    return this.staffLayouts && this.staffLayouts[index] !== undefined ?
      this.staffLayouts[index].staffDistance :
      this.STAFF_DISTANCE;
  }
}

// default values
Defaults.PAGE_MARGINS = {
  leftMargin: 10,
  rightMargin: 10,
  topMargin: 0,
  bottomMargin: 0,
};
Defaults.SYSTEM_MARGINS = {
  leftMargin: 0,
  rightMargin: 0,
};
Defaults.TOP_SYSTEM_DISTANCE = 40;
Defaults.SYSTEM_DISTANCE = 40;
Defaults.STAFF_DISTANCE = 30;
