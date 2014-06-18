// Concerto Base Libraries.
// Taehoon Moon <panarch@kaist.ac.kr>
//
// LayoutManager
//
// Copyright Taehoon Moon 2014

/**
 * @constructor
 * @template Concerto.Parser.LayoutManager
 */
Concerto.Parser.LayoutManager = function(musicjson) {
    this.page = 1;
    this.parts = musicjson['part'];
    this.pageLayout = musicjson['defaults']['page-layout'];
    this.leftMargin = 0;
};

/**
 * @this {Concerto.Parser.LayoutManager}
 * @param {number} page
 * @return {Object}
 */
Concerto.Parser.LayoutManager.prototype.getPageMargins = function() {
    if(Array.isArray(this.pageLayout['page-margins']) === false) {
        return this.pageLayout['page-margins'];
    }
    else if(this.pageLayout['page-margins'].length == 1) {
        // both
        return this.pageLayout['page-margins'][0];
    }

    var pageType = (this.page % 2 == 1) ? 'odd' : 'even';
    for(var i = 0; i < this.pageLayout['page-margins'].length; i++) {
        if(this.pageLayout['page-margins'][i]['@type'] == pageType) {
            return this.pageLayout['page-margins'][i];
        }
    }

    Concerto.logError('page-margins required');
    return {};
};

/**
 * @this {Concerto.Parser.LayoutManager}
 * @param {number} page
 */
Concerto.Parser.LayoutManager.prototype.setPageIndex = function(pageIndex) {
    this.page = pageIndex + 1;
};

/**
 * @this {Concerto.Parser.LayoutManager}
 * @param {Object} measure
 * @param {Object} leftMeasure
 * @param {Object} aboveMeasure
 * @param {Object} firstMeasure
 * @return {Array}
 */
Concerto.Parser.LayoutManager.prototype.getStavePositions = function(measure, leftMeasure, aboveMeasure, firstMeasure) {
    var positions = [];
    var pageMargins = this.getPageMargins();
    var position, print;

    if(leftMeasure) {
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
        if(print['system-layout']) {
            var systemLayout = print['system-layout'];
            if(systemLayout['system-margins'] && 
                systemLayout['system-margins']['left-margin']) {
                this.leftMargin = systemLayout['system-margins']['left-margin'];
            }
            else {
                this.leftMargin = 0;
            }

            if(systemLayout['top-system-distance'] !== undefined) {
                // new page
                var topMargin = pageMargins['top-margin'];
                measure['y'] = topMargin + systemLayout['top-system-distance'];
            }
            else if(systemLayout['system-distance'] !== undefined) {
                // new system
                measure['y'] = aboveMeasure['bottom-line-y'] + systemLayout['system-distance'];
            }
            else {
                Concerto.logError('Unhandled layout state');
            }
        }
        else if(print['staff-layout'].length > 0) {
            // new system, staff
            measure['y'] = aboveMeasure['bottom-line-y'] + print['staff-layout'][0]['staff-distance'];
        }
        else {
            Concerto.logError('Lack of print tag');
        }

        measure['x'] += this.leftMargin;
        position = {
            'x': measure['x'],
            'y': measure['y']
        };
        positions.push(position);
    }

    // check first measure's print
    print = firstMeasure['print'];
    //if(print['staff-layout'] && print['staff-layout']['@number'] == 2) {
    if(!print['staff-layout']) {
        return positions;
    }

    var staffDistance;
    if(print['staff-layout'].length > 1) {
        staffDistance = print['staff-layout'][1]['staff-distance'];
    }
    else if(print['system-layout'] && print['staff-layout'].length > 0) {
        staffDistance = print['staff-layout'][0]['staff-distance'];
    }
    else {
        Concerto.logError('Wrong staff-layout.');
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
 * @this {Concerto.Parser.LayoutManager}
 * @param {Object} measure
 * @param {Object} leftMeasure
 * @param {Object} aboveMeasure
 * @param {Object} firstMeasure
 * @return {Array}
 */
Concerto.Parser.LayoutManager.prototype.getStaves = function(measure, leftMeasure, aboveMeasure, firstMeasure) {
    var positions = this.getStavePositions(measure, leftMeasure, aboveMeasure, firstMeasure);

    var staves = [];
    for(var i = 0; i < positions.length; i++) {
        var position = positions[i];
        var stave = new Vex.Flow.Stave(position['x'], position['y'],
                            measure['width'], Concerto.Table.STAVE_DEFAULT_OPTIONS);
        staves.push(stave);
    }

    return staves;
};


