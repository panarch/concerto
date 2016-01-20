// Copyright (c) Taehoon Moon 2015.
// @author Taehoon Moon

export const parseSystemLayout = node => {
  const systemLayout = {};
  const systemMarginsNode = node.getElementsByTagName('system-margins')[0];
  const topSystemDistanceNode = node.getElementsByTagName('top-system-distance')[0];
  const systemDistanceNode = node.getElementsByTagName('system-distance')[0];

  if (systemMarginsNode) {
    systemLayout.systemMargins = {
      leftMargin: Number(systemMarginsNode.getElementsByTagName('left-margin')[0].textContent),
      rightMargin: Number(systemMarginsNode.getElementsByTagName('right-margin')[0].textContent),
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
      staffDistance: Number(node.getElementsByTagName('staff-distance')[0].textContent),
    });
  });

  return staffLayoutMap;
};

export const parsePageLayout = layoutNode => {
  const pageLayout = {
    pageWidth: Number(layoutNode.getElementsByTagName('page-width')[0].textContent),
    pageHeight: Number(layoutNode.getElementsByTagName('page-height')[0].textContent),
    pageMarginsMap: new Map(),
  };

  [...layoutNode.getElementsByTagName('page-margins')].forEach(node => {
    const type = node.hasAttribute('type') ? node.getAttribute('type') : 'both';

    pageLayout.pageMarginsMap.set(type, {
      leftMargin: Number(node.getElementsByTagName('left-margin')[0].textContent),
      rightMargin: Number(node.getElementsByTagName('right-margin')[0].textContent),
      topMargin: Number(node.getElementsByTagName('top-margin')[0].textContent),
      bottomMargin: Number(node.getElementsByTagName('bottom-margin')[0].textContent),
    });
  });

  return pageLayout;
};
