// Concerto Base Libraries.
// Taehoon Moon <panarch@kaist.ac.kr>
//
// MeasureManager
//
// Copyright Taehoon Moon 2014

define(function(require, exports, module) {
    /**
     * @constructor
     * @template MeasureManager
     */
    function MeasureManager(musicjson) {
        this.parts = musicjson['part'];
        this.pageLayout = musicjson['defaults']['page-layout'];
        // first measure on same line.
        this.firstMeasures = new Array(this.parts.length);
        this.partIndex = 0;
        this.measureIndex = 0;
    }

    /** 
     * @this {MeasureManager}
     * @param {number} partIndex
     */
    MeasureManager.prototype.setPartIndex = function setPartIndex(partIndex) {
        this.partIndex = partIndex;
        var measure = this.parts[this.partIndex]['measure'][this.measureIndex];
        if(measure['print']) {
            this.firstMeasures[this.partIndex] = measure;
        }
    };

    /**
     * @this {MeasureManager}
     * @param {number} measureIndex
     */
    MeasureManager.prototype.setMeasureIndex = function setMeasureIndex(measureIndex) {
        this.measureIndex = measureIndex;
    };

    /**
     * @this {MeasureManager}
     * @param {number=} partIndex
     * @return {Object}
     */
    MeasureManager.prototype.getFirstMeasure = function getFirstMeasure(partIndex) {
        if(partIndex === undefined) {
            partIndex = this.partIndex;
        }
        return this.firstMeasures[partIndex];
    };

    /**
     * @this {MeasureManager}
     * @return {Object=}
     */
    MeasureManager.prototype.getLeftMeasure = function getLeftMeasure() {
        var measure = this.parts[this.partIndex]['measure'][this.measureIndex];
        if(measure['print'] && 
            (measure['print']['@new-page'] || measure['print']['@new-system'])) {
            return undefined;
        }

        return this.parts[this.partIndex]['measure'][this.measureIndex - 1];
    };

    /**
     * @this {MeasureManager}
     * @return {Object}
     */
    MeasureManager.prototype.getAboveMeasure = function getAboveMeasure() {
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

    module.exports = MeasureManager;
});
