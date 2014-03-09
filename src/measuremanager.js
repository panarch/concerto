// Concerto Base Libraries.
// Taehoon Moon <panarch@kaist.ac.kr>
//
// MeasureManager
//
// Copyright Taehoon Moon 2014

/**
 * @constructor
 * @template Concerto.Parser.MeasureManager
 */
Concerto.Parser.MeasureManager = function(musicjson) {
    this.parts = musicjson['part'];
    this.pageLayout = musicjson['defaults']['page-layout'];
    // first measure on same line.
    this.firstMeasures = new Array(this.parts.length);
    this.partIndex = 0;
    this.measureIndex = 0;
};

/** 
 * @this {Concerto.Parser.MeasureManager}
 * @param {number} partIndex
 */
Concerto.Parser.MeasureManager.prototype.setPartIndex = function(partIndex) {
    this.partIndex = partIndex;
    var measure = this.parts[this.partIndex]['measure'][this.measureIndex];
    if(measure['print']) {
        this.firstMeasures[this.partIndex] = measure;
    }
};

/**
 * @this {Concerto.Parser.MeasureManager}
 * @param {number} measureIndex
 */
Concerto.Parser.MeasureManager.prototype.setMeasureIndex = function(measureIndex) {
    this.measureIndex = measureIndex;
};

/**
 * @this {Concerto.Parser.MeasureManager}
 * @param {number=} partIndex
 * @return {Object}
 */
Concerto.Parser.MeasureManager.prototype.getFirstMeasure = function(partIndex) {
    if(partIndex === undefined) {
        partIndex = this.partIndex;
    }
    return this.firstMeasures[partIndex];
};

/**
 * @this {Concerto.Parser.MeasureManager}
 * @return {Object=}
 */
Concerto.Parser.MeasureManager.prototype.getLeftMeasure = function() {
    var measure = this.parts[this.partIndex]['measure'][this.measureIndex];
    if(measure['print'] && 
        (measure['print']['@new-page'] || measure['print']['@new-system'])) {
        return undefined;
    }
    
    return this.parts[this.partIndex]['measure'][this.measureIndex - 1];
};

/**
 * @this {Concerto.Parser.MeasureManager}
 * @return {Object}
 */
Concerto.Parser.MeasureManager.prototype.getAboveMeasure = function() {
    if(this.partIndex === 0) {
        var i = this.measureIndex - 1;
        var firstMeasure = this.getFirstMeasure(this.partIndex);
        if(firstMeasure['print']['system-layout']['top-system-distance'] !== undefined) { 
            // firstMeasure['print']['@new-page'] 
            return undefined;
        }
        // @new-system
        return this.parts[this.parts.length - 1]['measure'][this.measureIndex - 1];
    }

    return this.parts[this.partIndex - 1]['measure'][this.measureIndex];
};
