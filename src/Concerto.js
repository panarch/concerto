// Concerto Base Libraries.
// Taehoon Moon <panarch@kaist.ac.kr>
//
// Concerto
//
// Copyright Taehoon Moon 2014

define(function(require, exports, module) {
    var Table = require('./Table');
    var Converter = require('./Converter');
    var AttributesManager = require('./AttributesManager');
    var MeasureManager = require('./MeasureManager');
    var LayoutManager = require('./LayoutManager');
    var NoteManager = require('./NoteManager');
    var BarlineManager = require('./BarlineManager');
    var Parser = require('./Parser');
    var Renderer = require('./Renderer');

    function Concerto() {}

    Concerto.Table = Table;
    Concerto.Converter = Converter;
    Concerto.AttributesManager = AttributesManager;
    Concerto.MeasureManager = MeasureManager;
    Concerto.LayoutManager = LayoutManager;
    Concerto.NoteManager = NoteManager;
    Concerto.BarlineManager = BarlineManager;
    Concerto.Parser = Parser;
    Concerto.Renderer = Renderer;

    window.Concerto = Concerto;
    module.exports = Concerto;
});
