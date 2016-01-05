// Copyright (c) Taehoon Moon 2015.
// @author Taehoon Moon

export const parseSystemLayout = node => {
  const systemLayout = {};
  const systemMarginsNode = node.querySelector('system-margins');
  const topSystemDistanceNode = node.querySelector('top-system-distance');
  const systemDistanceNode = node.querySelector('system-distance');

  if (systemMarginsNode) {
    systemLayout.systemMargins = {
      leftMargin: Number(systemMarginsNode.querySelector('left-margin').textContent),
      rightMargin: Number(systemMarginsNode.querySelector('right-margin').textContent),
    };
  }

  if (topSystemDistanceNode)
    systemLayout.topSystemDistance = Number(topSystemDistanceNode.textContent);

  if (systemDistanceNode)
    systemLayout.systemDistance = Number(systemDistanceNode.textContent);

  return systemLayout;
};

export const parseStaffLayout = nodes => {
  const staffLayoutMap = new Map();

  nodes.forEach(node => {
    const staff = node.hasAttribute('number') ? Number(node.getAttribute('number')) : 1;
    staffLayoutMap.set(staff, {
      number: staff,
      staffDistance: Number(node.querySelector('staff-distance').textContent),
    });
  });

  return staffLayoutMap;
};

export const parsePageLayout = layoutNode => {
  const pageLayout = {
    pageWidth: Number(layoutNode.querySelector('page-width').textContent),
    pageHeight: Number(layoutNode.querySelector('page-height').textContent),
    pageMarginsMap: new Map(),
  };

  [...layoutNode.querySelectorAll('page-margins')].forEach(node => {
    const type = node.hasAttribute('type') ? node.getAttribute('type') : 'both';

    pageLayout.pageMarginsMap.set(type, {
      leftMargin: Number(node.querySelector('left-margin').textContent),
      rightMargin: Number(node.querySelector('right-margin').textContent),
      topMargin: Number(node.querySelector('top-margin').textContent),
      bottomMargin: Number(node.querySelector('bottom-margin').textContent),
    });
  });

  return pageLayout;
};
