// Concerto Base Libraries.
// Taehoon Moon <panarch@kaist.ac.kr>
//
// AttributesManager
//
// Copyright Taehoon Moon 2014

/**
 * @constructor
 * @template Concerto.Parser.AttributesManager
 */
Concerto.Parser.AttributesManager = function() {
    this.time = {
        'beats': Concerto.Table.DEFAULT_TIME_BEATS,
        'beat-type': Concerto.Table.DEFAULT_TIME_BEAT_TYPE 
    };
    this.divisions = 1;
    this.keyDict = {};
    this.clefDict = {};

    this.partIndex = 0;
    this.measureIndex = 0;
};


/**
 * @this {Concerto.Parser.AttributesManager}
 * @param {number} part
 * @param {number=} staff
 * @param {string} clef
 */
Concerto.Parser.AttributesManager.prototype.setClef = function(part, staff, clef) {
    if(this.clefDict[part] === undefined) {
        this.clefDict[part] = {};
    }

    if(staff === undefined) {
        staff = 1;
        this.clefDict[part][staff] = clef;
    }
    else {
        if(staff == 1) {
            this.clefDict[part][staff] = clef;
            if(this.clefDict[part][2] === undefined) {
                this.clefDict[part][2] = clef;
            }
        }
        else {
            this.clefDict[part][staff] = clef;
        }
    }
};

/**
 * Converts raw clefs and set.
 * @this {Concerto.Parser.AttributesManager}
 * @param {Array} rawClefs
 * @param {number} part
 */
Concerto.Parser.AttributesManager.prototype.setClefs = function(rawClefs, part) {
    if(this.clefDict[part] === undefined) {
        this.clefDict[part] = {};
    }

    var changedStaffs = [];

    for(var i = 0; i < rawClefs.length; i++) {
        var rawClef = rawClefs[i];
        var clef = Concerto.Parser.AttributesManager.getVexClef(rawClef);
        
        if(clef === undefined) {
            Concerto.logError('Unsupported clef sign: ' + clefSign);
            clef = Concerto.Table.DEFAULT_CLEF;
        }

        var staff;
        if(rawClef['@number'] !== undefined) {
            staff = rawClef['@number'];
        }
        else {
            staff = 1;
        }
        this.clefDict[part][staff] = clef;
        changedStaffs.push(staff);
    }

    return changedStaffs;
};

/**
 * Returns converted clef information.
 * @this {Concerto.Parser.AttributesManager}
 * @param {number} part
 * @param {number=} staff
 * @param {string=} defaultClef
 * @return {string} clef
 */
Concerto.Parser.AttributesManager.prototype.getClef = function(part, staff, defaultClef) {
    if(staff === undefined) {
        staff = 1;
    }
    if(this.clefDict[part] === undefined || this.clefDict[part][staff] === undefined) {
        return defaultClef;
    }
    return this.clefDict[part][staff];
};

/**
 * @this {Concerto.Parser.AttributesManager}
 * @param {Object} key
 * @param {number} part
 * @param {number=} staff
 */
Concerto.Parser.AttributesManager.prototype.setKeySignature = function(key, part, staff) {
    if(staff === undefined) {
        staff = 1;
    }
    if(this.keyDict[part] === undefined) {
        this.keyDict[part] = {};
    }
    this.keyDict[part][staff] = key;
};

/**
 * @this {Concerto.Parser.AttributesManager}
 * @param {number} part
 * @param {number=} staff
 * @return {Object}
 */
Concerto.Parser.AttributesManager.prototype.getKeySignature = function(part, staff) {
    if(staff === undefined) {
        staff = 1;
    }
    return this.keyDict[part][staff];
};

/**
 * @this {Concerto.Parser.AttributesManager}
 * @param {number} divisions
 */
Concerto.Parser.AttributesManager.prototype.setDivisions = function(divisions) {
    this.divisions = divisions;
};

/**
 * @this {Concerto.Parser.AttributesManager}
 * @return {number}
 */
Concerto.Parser.AttributesManager.prototype.getDivisions = function() {
    return this.divisions;
};

/**
 * @this {Concerto.Parser.AttributesManager}
 * @param {Object.<string, number>}
 */
Concerto.Parser.AttributesManager.prototype.setTimeSignature = function(time) {
    this.time = time;
};

/**
 * @this {Concerto.Parser.AttributesManager}
 * @return {Object.<string, number>}
 */
Concerto.Parser.AttributesManager.prototype.getTimeSignature = function() {
    return this.time;
};

/**
 * @this {Concerto.Parser.AttributesManager}
 * @param {number} partIndex
 */
Concerto.Parser.AttributesManager.prototype.setPartIndex = function(partIndex) {
    this.partIndex = partIndex;
};

/**
 * @this {Concerto.Parser.AttributesManager}
 * @param {number} measureIndex
 */
Concerto.Parser.AttributesManager.prototype.setMeasureIndex = function(measureIndex) {
    this.measureIndex = measureIndex;
};

// static functions

/**
 * @param {Object} stave
 * @param {string} clef
 * @param {string} defaultClef
 */
Concerto.Parser.AttributesManager.addClefToStave = function(stave, clef) {
    if(clef === undefined) {

    }
};

/**
 * @param {Object} stave
 * @param {Object} keyDict
 */
Concerto.Parser.AttributesManager.addKeySignatureToStave = function(stave, keyDict, clef) {
    if(keyDict['fifths'] === undefined) {
        Concerto.logError('key fifths does not exists');
        return;
    }

    if (clef)
        stave.clef = clef;

    var fifths = keyDict['fifths'];
    var keySpec;

    if(fifths === 0) {
        keySpec = 'C';
    }
    else if(fifths > 0) {
        keySpec = Concerto.Table.SHARP_MAJOR_KEY_SIGNATURES[fifths - 1];
    }
    else {
        keySpec = Concerto.Table.FLAT_MAJOR_KEY_SIGNATURES[-fifths - 1];
    }
    stave.addKeySignature(keySpec);
};

/**
 * @param {Object} stave
 * @param {Object} timeDict
 */
Concerto.Parser.AttributesManager.addTimeSignatureToStave = function(stave, timeDict) {
    var timeSpec;
    if(timeDict['@symbol']) {
        if(timeDict['@symbol'] == 'common') {
            timeSpec = 'C';
        }
        else if(timeDict['@symbol'] == 'cut') {
            timeSpec = 'C|';
        }
        else {
            Concerto.logWarn('Unsupported time symbol');
            timeSpec = 'C';
        }
    }
    else {
        timeSpec = timeDict['beats'] + '/' + timeDict['beat-type'];
    }
    stave.addTimeSignature(timeSpec);
};

/**
 * @param {Array.<Object>} staves
 * @param {Array.<Object>} rawClefs
 */
Concerto.Parser.AttributesManager.addEndClefToStave = function(staves, rawClefs) {
    for(var i = 0; i < rawClefs.length; i++) {
        var rawClef = rawClefs[i];
        var clef = Concerto.Parser.AttributesManager.getVexClef(rawClef);
        clef += '_small';
        if(rawClef['@number'] == 1) {
            staves[0].addEndClef(clef);
        }
        else {
            staves[1].addEndClef(clef);
        }
    }
};

/**
 * @param {Array.<Object>} rawClef
 * @return {Object} clefNote;
 */
Concerto.Parser.AttributesManager.getClefNote = function(rawClefs) {
    var clef = Concerto.Parser.AttributesManager.getVexClef(rawClefs[0]);
    clef += '_small';
    var clefNote = new Vex.Flow.ClefNote(clef);
    return clefNote;
};

/**
 * @param {Object} rawClef
 * @return {string} clef
 */
Concerto.Parser.AttributesManager.getVexClef = function(rawClef) {
    var clefKey = rawClef['sign'] + '/' + rawClef['line'];
    var clef = Concerto.Table.CLEF_TYPE_DICT[clefKey];
    return clef;
};

