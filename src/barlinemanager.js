// Concerto Base Libraries.
// Taehoon Moon <panarch@kaist.ac.kr>
//
// BarlineManager
//
// Copyright Taehoon Moon 2014


Concerto.Parser.BarlineManager = {};

/**
 * @param {Object} barline
 * @param {boolean} isLeft
 * @return {number}
 */
Concerto.Parser.BarlineManager.getBarlineType = function(barline, isLeft) {
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

    Concerto.logWarn('Unhandled barline style : ' + barline['bar-style']);
    // default barline
    return Vex.Flow.Barline.type.SINGLE;
};

/**
 * @param {Object} stave
 * @param {object} barlineDict
 */
Concerto.Parser.BarlineManager.addBarlineToStave = function(stave, barlineDict) {
    if(barlineDict['left-barline']) {
        var leftBarline = barlineDict['left-barline'];
        var barlineType = Concerto.Parser.BarlineManager.getBarlineType(leftBarline, true);
        stave.setBegBarType(barlineType);
    }

    if(barlineDict['right-barline']) {
        var rightBarline = barlineDict['right-barline'];
        var barlineType = Concerto.Parser.BarlineManager.getBarlineType(rightBarline, false);
        stave.setEndBarType(barlineType);
    }
};