// Concerto Base Libraries.
// Taehoon Moon <panarch@kaist.ac.kr>
//
// AttributesManager
//
// Copyright Taehoon Moon 2014

define(function(require, exports, module) {
    var Vex = require('vexflow');
    var L = require('js-logger').get('AttributesManager');
    var Table = require('./Table');

    /**
     * @constructor
     * @template AttributesManager
     */
    function AttributesManager() {
        this.time = {
            'beats': Table.DEFAULT_TIME_BEATS,
            'beat-type': Table.DEFAULT_TIME_BEAT_TYPE
        };
        this.divisions = 1;
        this.keyDict = {};
        this.clefDict = {};

        this.partIndex = 0;
        this.measureIndex = 0;
    }

    /**
     * @this {AttributesManager}
     * @param {number} part
     * @param {number=} staff
     * @param {string} clef
     */
    AttributesManager.prototype.setClef = function setClef(part, staff, clef) {
        if (this.clefDict[part] === undefined)
            this.clefDict[part] = {};

        if (staff === undefined) {
            staff = 1;
            this.clefDict[part][staff] = clef;
        }
        else
            if (staff === 1) {
                this.clefDict[part][staff] = clef;
                if (this.clefDict[part][2] === undefined)
                    this.clefDict[part][2] = clef;
            }
            else
                this.clefDict[part][staff] = clef;
    };

    /**
     * Converts raw clefs and set.
     * @this {AttributesManager}
     * @param {Array} rawClefs
     * @param {number} part
     */
    AttributesManager.prototype.setClefs = function setClefs(rawClefs, part) {
        if (this.clefDict[part] === undefined)
            this.clefDict[part] = {};

        var changedStaffs = [];

        for (var i = 0; i < rawClefs.length; i++) {
            var rawClef = rawClefs[i];
            var clef = AttributesManager.getVexClef(rawClef);

            if (clef === undefined) {
                L.error('Unsupported clef sign: ' + clef);
                clef = Table.DEFAULT_CLEF;
            }

            var staff;
            if (rawClef['@number'] !== undefined)
                staff = rawClef['@number'];
            else
                staff = 1;

            this.clefDict[part][staff] = clef;
            changedStaffs.push(staff);
        }

        return changedStaffs;
    };

    /**
     * Returns converted clef information.
     * @this {AttributesManager}
     * @param {number} part
     * @param {number=} staff
     * @param {string=} defaultClef
     * @return {string} clef
     */
    AttributesManager.prototype.getClef = function getClef(part, staff, defaultClef) {
        if (staff === undefined)
            staff = 1;

        if (this.clefDict[part] === undefined || this.clefDict[part][staff] === undefined)
            return defaultClef;

        return this.clefDict[part][staff];
    };

    /**
     * @this {AttributesManager}
     * @param {Object} key
     * @param {number} part
     * @param {number=} staff
     */
    AttributesManager.prototype.setKeySignature = function setKeySignature(key, part, staff) {
        if (staff === undefined)
            staff = 1;

        if (this.keyDict[part] === undefined)
            this.keyDict[part] = {};

        this.keyDict[part][staff] = key;
    };

    /**
     * @this {AttributesManager}
     * @param {number} part
     * @param {number=} staff
     * @return {Object}
     */
    AttributesManager.prototype.getKeySignature = function getKeySignature(part, staff) {
        if (staff === undefined)
            staff = 1;

        return this.keyDict[part][staff];
    };

    /**
     * @this {AttributesManager}
     * @param {number} divisions
     */
    AttributesManager.prototype.setDivisions = function setDivisions(divisions) {
        this.divisions = divisions;
    };

    /**
     * @this {AttributesManager}
     * @return {number}
     */
    AttributesManager.prototype.getDivisions = function getDivisions() {
        return this.divisions;
    };

    /**
     * @this {AttributesManager}
     * @param {Object.<string, number>} time
     */
    AttributesManager.prototype.setTimeSignature = function setTimeSignature(time) {
        this.time = time;
    };

    /**
     * @this {AttributesManager}
     * @return {Object.<string, number>}
     */
    AttributesManager.prototype.getTimeSignature = function getTimeSignature() {
        return this.time;
    };

    /**
     * @this {AttributesManager}
     * @param {number} partIndex
     */
    AttributesManager.prototype.setPartIndex = function setPartIndex(partIndex) {
        this.partIndex = partIndex;
    };

    /**
     * @this {AttributesManager}
     * @param {number} measureIndex
     */
    AttributesManager.prototype.setMeasureIndex = function setMeasureIndex(measureIndex) {
        this.measureIndex = measureIndex;
    };

    // static functions

    /**
     * @param {Object} stave
     * @param {string} clef
     * @param {string} defaultClef
     */
    AttributesManager.addClefToStave = function addClefToStave(stave, clef) {
        //if (clef === undefined) {}
    };

    /**
     * @param {Object} stave
     * @param {Object} keyDict
     */
    AttributesManager.addKeySignatureToStave = function addKeySignatureToStave(stave, keyDict, clef) {
        if (keyDict['fifths'] === undefined) {
            L.error('key fifths does not exists');
            return;
        }

        if (clef)
            stave.clef = clef;

        var fifths = keyDict['fifths'];
        var keySpec;

        if (fifths === 0)
            keySpec = 'C';
        else if (fifths > 0)
            keySpec = Table.SHARP_MAJOR_KEY_SIGNATURES[fifths - 1];
        else
            keySpec = Table.FLAT_MAJOR_KEY_SIGNATURES[-fifths - 1];

        stave.addKeySignature(keySpec);
    };

    /**
     * @param {Object} stave
     * @param {Object} timeDict
     */
    AttributesManager.addTimeSignatureToStave = function addTimeSignatureToStave(stave, timeDict) {
        var timeSpec;
        if (timeDict['@symbol'])
            if (timeDict['@symbol'] === 'common')
                timeSpec = 'C';
            else if (timeDict['@symbol'] === 'cut')
                timeSpec = 'C|';
            else {
                L.warn('Unsupported time symbol');
                timeSpec = 'C';
            }
        else
            timeSpec = timeDict['beats'] + '/' + timeDict['beat-type'];

        stave.addTimeSignature(timeSpec);
    };

    /**
     * @param {Array.<Object>} staves
     * @param {Array.<Object>} rawClefs
     */
    AttributesManager.addEndClefToStave = function addEndClefToStave(staves, rawClefs) {
        for (var i = 0; i < rawClefs.length; i++) {
            var rawClef = rawClefs[i];
            var clef = AttributesManager.getVexClef(rawClef);
            clef += '_small';
            if (rawClef['@number'] === 1)
                staves[0].addEndClef(clef);
            else
                staves[1].addEndClef(clef);
        }
    };

    /**
     * @param {Array.<Object>} rawClefs
     * @return {Object} clefNote;
     */
    AttributesManager.getClefNote = function getClefNote(rawClefs) {
        var clef = AttributesManager.getVexClef(rawClefs[0]);
        clef += '_small';
        var clefNote = new Vex.Flow.ClefNote(clef);
        return clefNote;
    };

    /**
     * @param {Object} rawClef
     * @return {string} clef
     */
    AttributesManager.getVexClef = function getVexClef(rawClef) {
        var clefKey = rawClef['sign'] + '/' + rawClef['line'];
        var clef = Table.CLEF_TYPE_DICT[clefKey];
        return clef;
    };

    module.exports = AttributesManager;
});
