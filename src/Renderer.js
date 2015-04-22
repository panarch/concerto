// Concerto Base Libraries.
// Taehoon Moon <panarch@kaist.ac.kr>
//
// Renderer
//
// Copyright Taehoon Moon 2014

define(function(require, exports, module) {
    var $ = require('jquery');
    var Vex = require('vexflow');
    var LayoutTool = require('./LayoutTool');
    var Parser = require('./Parser');

    /**
     * @constructor
     * @template Concerto.Renderer
     * @param {Object} musicjson
     * @param {Object} options
     */
    function Renderer(musicjson, options) {
        this.backends = Vex.Flow.Renderer.Backends.RAPHAEL;
        this.musicjson = musicjson;

        if (!options)
            return;

        if (options.backends)
            this.backends = options.backends;

        if (options.$container) {
            this.$container = options.$container;

            this.numPages = LayoutTool.getNumPages(musicjson);
            this.pages = [];
            this.doms = [];
            this.pageSize = LayoutTool.getPageSize(musicjson);
            for (var i = 0; i < this.numPages; i++)
                this.addPage();
        }
        else if (options.pages)
            this.pages = options.pages;
    }

    /**
     * @this {Concerto.Renderer}
     * @param {Object} ctx VexFlow renderer's context
     */
    Renderer.prototype.addPageContext = function addPageContext(ctx) {
        this.pages.push(ctx);
    };

    /**
     * @this {Concerto.Renderer}
     */
    Renderer.prototype.addPage = function addPage() {
        var $div = $('<div>');

        $div.css('width', this.pageSize.width)
            .css('height', this.pageSize.height);

        $div.addClass('concerto-page');

        this.$container.append($div);

        var vexflowRenderer = new Vex.Flow.Renderer($div[0], this.backends);
        var ctx = vexflowRenderer.getContext();
        this.pages.push(ctx);
        this.doms.push($div);
    };

    /**
     * @this {Concerto.Renderer}
     */
    Renderer.prototype.draw = function draw(page) {
        if (this.$container) {
            var numPages = LayoutTool.getNumPages(this.musicjson);
            if (numPages !== this.numPages) {
                if (numPages > this.numPages)
                    this.addPage();
                else // remove last child
                    this.$container.find('.concerto-page:last-child').remove();
                this.numPages = numPages;
            }
        }

        var pages;
        if (page === undefined)
            pages = this.pages;
        else {
            for (var i = 0; i < pages.length; i++) {
                if (page === i)
                    pages.push(pages[i]);
                else
                    pages.push(undefined);
            }
        }

        Parser.parseAndDraw(pages, this.musicjson);
    };

    Renderer.prototype.clear = function clear(page) {
        var i;
        var all = false;
        if (page === undefined)
            all = true;

        if (!this.doms) {
            for (i = 0; i < this.pages.length; i++)
                this.pages[i].clear();

            return;
        }

        for (i = 0; i < this.doms.length; i++) {
            if (!all && page !== i)
                continue;

            var $dom = this.doms[i];
            var $svg = $dom.find('svg');
            $svg.empty();
            $svg.attr('width', this.pageSize.width)
                .attr('height', this.pageSize.height);
        }
    };

    Renderer.prototype.update = function update(page) {
        // redraw only specific page
        this.clear(page);
        this.draw(page);
    };

    Renderer.prototype.getMusicjson = function getMusicjson() {
        return this.musicjson;
    };

    Renderer.prototype.getContext = function getContext(page) {
        return this.pages[page];
    };

    module.exports = Renderer;
});
