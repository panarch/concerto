// Concerto Base Libraries.
// Taehoon Moon <panarch@kaist.ac.kr>
//
// LayoutManager
//
// Copyright Taehoon Moon 2014

define(function(require, exports, module) {
    var Vex = require('vexflow');
    var L = require('js-logger').get('LayoutManager');
    var Table = require('Table');

    /**
     * @constructor
     * @template LayoutManager
     */
     function LayoutManager(musicjson) {
        this.page = 1;
        this.parts = musicjson['part'];
        this.pageLayout = musicjson['defaults']['page-layout'];
        this.leftMargin = 0;
    }

    /**
     * @this {LayoutManager}
     * @param {number} page
     * @return {Object}
     */
    LayoutManager.prototype.getPageMargins = function getPageMargins() {
        if (Array.isArray(this.pageLayout['page-margins']) === false)
            return this.pageLayout['page-margins'];
        else if (this.pageLayout['page-margins'].length === 1) // both
            return this.pageLayout['page-margins'][0];

        var pageType = (this.page % 2 === 1) ? 'odd' : 'even';
        for (var i = 0; i < this.pageLayout['page-margins'].length; i++)
            if (this.pageLayout['page-margins'][i]['@type'] === pageType)
                return this.pageLayout['page-margins'][i];

        L.error('page-margins required');
        return {};
    };

    /**
     * @this {LayoutManager}
     * @param {number} pageIndex
     */
    LayoutManager.prototype.setPageIndex = function setPageIndex(pageIndex) {
        this.page = pageIndex + 1;
    };

    /**
     * @this {LayoutManager}
     * @param {Object} measure
     * @param {Object} leftMeasure
     * @param {Object} aboveMeasure
     * @param {Object} firstMeasure
     * @return {Array}
     */
    LayoutManager.prototype.getStavePositions = function getStavePositions(measure, leftMeasure, aboveMeasure, firstMeasure) {
        var positions = [];
        var pageMargins = this.getPageMargins();
        var position;
        var print;

        if (leftMeasure) {
            measure['y'] = leftMeasure['y'];
            measure['x'] = leftMeasure['x'] + leftMeasure['width'];
            position = {
                'x': measure['x'],
                'y': measure['y']
            };
            positions.push(position);
        }
        else {
            print = measure['print'];
            measure['x'] = pageMargins['left-margin'];
            if (print['system-layout']) {
                var systemLayout = print['system-layout'];
                if (systemLayout['system-margins'] &&
                    systemLayout['system-margins']['left-margin'])
                    this.leftMargin = systemLayout['system-margins']['left-margin'];
                else
                    this.leftMargin = 0;

                if (systemLayout['top-system-distance'] !== undefined) {
                    // new page
                    var topMargin = pageMargins['top-margin'];
                    measure['y'] = topMargin + systemLayout['top-system-distance'];
                }
                else if (systemLayout['system-distance'] !== undefined) // new system
                    measure['y'] = aboveMeasure['bottom-line-y'] + systemLayout['system-distance'];
                else
                    L.error('Unhandled layout state');
            }
            else if (print['staff-layout'].length > 0) // new system, staff
                measure['y'] = aboveMeasure['bottom-line-y'] + print['staff-layout'][0]['staff-distance'];
            else
                L.error('Lack of print tag');

            measure['x'] += this.leftMargin;
            position = {
                'x': measure['x'],
                'y': measure['y']
            };
            positions.push(position);
        }

        // check first measure's print
        print = firstMeasure['print'];
        //if (print['staff-layout'] && print['staff-layout']['@number'] == 2) {
        if (!print['staff-layout'])
            return positions;

        var staffDistance;
        if (print['staff-layout'].length > 1)
            staffDistance = print['staff-layout'][1]['staff-distance'];
        else if (print['system-layout'] && print['staff-layout'].length > 0)
            staffDistance = print['staff-layout'][0]['staff-distance'];
        else {
            L.error('Wrong staff-layout.');
            return positions;
        }

        var y = measure['y'] + 40 + staffDistance;
        position = {
            'x': measure['x'],
            'y': y
        };
        measure['y2'] = y;
        positions.push(position);

        return positions;
    };

    /**
     * @this {LayoutManager}
     * @param {Object} measure
     * @param {Object} leftMeasure
     * @param {Object} aboveMeasure
     * @param {Object} firstMeasure
     * @return {Array}
     */
    LayoutManager.prototype.getStaves = function getStaves(measure, leftMeasure, aboveMeasure, firstMeasure) {
        var positions = this.getStavePositions(measure, leftMeasure, aboveMeasure, firstMeasure);

        var staves = [];
        for (var i = 0; i < positions.length; i++) {
            var position = positions[i];
            var stave = new Vex.Flow.Stave(position['x'], position['y'],
                                measure['width'], Table.STAVE_DEFAULT_OPTIONS);
            staves.push(stave);
        }

        return staves;
    };

    module.exports = LayoutManager;
});
