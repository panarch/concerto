// Concerto Base Libraries.
// Taehoon Moon <panarch@kaist.ac.kr>
//
// BarlineManager
//
// Copyright Taehoon Moon 2014

define(function(require, exports, module) {
    var Vex = require('vexflow');
    var L = require('js-logger').get('BarlineManager');

    function BarlineManager() {}

    /**
     * @param {Object} barline
     * @param {boolean} isLeft
     * @return {number}
     */
    BarlineManager.getBarlineType = function getBarlineType(barline, isLeft) {
        if(barline['repeat']) {
            if(isLeft) {
                return Vex.Flow.Barline.type.REPEAT_BEGIN;
            }
            else {
                return Vex.Flow.Barline.type.REPEAT_END;
            }
        }

        if(barline['bar-style'] == 'light-light') {
            return Vex.Flow.Barline.type.DOUBLE;
        }
        else if(barline['bar-style'] == 'light-heavy') {
            return Vex.Flow.Barline.type.END;
        }

        L.warn('Unhandled barline style : ' + barline['bar-style']);
        // default barline
        return Vex.Flow.Barline.type.SINGLE;
    };

    /**
     * @param {Object} stave
     * @param {object} barlineDict
     */
    BarlineManager.addBarlineToStave = function addBarlineToStave(stave, barlineDict) {
        var barlineType;
        if(barlineDict['left-barline']) {
            var leftBarline = barlineDict['left-barline'];
            barlineType = BarlineManager.getBarlineType(leftBarline, true);
            stave.setBegBarType(barlineType);
        }

        if(barlineDict['right-barline']) {
            var rightBarline = barlineDict['right-barline'];
            barlineType = BarlineManager.getBarlineType(rightBarline, false);
            stave.setEndBarType(barlineType);
        }
    };

    module.exports = BarlineManager;
});
