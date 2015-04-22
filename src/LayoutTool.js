// Concerto Base Libraries.
// Taehoon Moon <panarch@kaist.ac.kr>
//
// LayoutTool
//
// Copyright Taehoon Moon 2014

define(function(require, exports, module) {
    var $ = require('jquery');

    function LayoutTool() {}

    /**
     * @param {Object} musicjson
     * @return {integer}
     */
    LayoutTool.getNumPages = function getNumPages(musicjson) {
        var measures = musicjson['part'][0]['measure'];
        var num = 1;
        for (var i = 0; i < measures.length; i++) {
            var measure = measures[i];
            if (measure['print'] && measure['print']['@new-page'])
                num++;
        }

        return num;
    };

    /**
     * @param {Object} musicjson
     * @return {Object.<string, number>}
     */
    LayoutTool.getPageSize = function getPageSize(musicjson) {
        var pageLayout = musicjson['defaults']['page-layout'];
        $('#content').css('width', pageLayout['page-width'])
                     .css('height', pageLayout['page-height']);
        $('#content').find('svg').remove();
        return {
            width: pageLayout['page-width'],
            height: pageLayout['page-height']
        };
    };

    module.exports = LayoutTool;
});
