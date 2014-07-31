// Concerto Base Libraries.
// Taehoon Moon <panarch@kaist.ac.kr>
//
// Renderer
//
// Copyright Taehoon Moon 2014

/**
 * @constructor
 * @template Concerto.Renderer
 */
Concerto.Renderer = function($container, musicjson, options) {
    this.backends = Vex.Flow.Renderer.Backends.RAPHAEL;
    if(options && options.backends) {
        this.backends = options.backends;
    }

    this.$container = $container;

    this.numPages = Concerto.Parser.getNumPages(musicjson);
    this.pages = [];
    this.doms = [];
    this.pageSize = Concerto.Parser.getPageSize(musicjson);
    for(var i = 0; i < this.numPages; i++) {
        this.addPage();
    }

    this.musicjson = musicjson;
};

/**
 * @this {Concerto.Renderer}
 */
Concerto.Renderer.prototype.addPage = function() {
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
Concerto.Renderer.prototype.draw = function(page) {
    var numPages = Concerto.Parser.getNumPages(this.musicjson);
    if(numPages !== this.numPages) {
        if(numPages > this.numPages) {
            this.addPage();
        }
        else {
            // remove last child
            this.$container.find('.concerto-page:last-child').remove();
        }
        this.numPages = numPages;
    }

    var pages;
    if(page === undefined) {
        pages = this.pages;
    }
    else {
        for(var i = 0; i < pages.length; i++) {
            if(page === i) {
                pages.push(pages[i]);
            }
            else {
                pages.push(undefined);
            }
        }
    }

    Concerto.Parser.parseAndDraw(pages, this.musicjson);
};

Concerto.Renderer.prototype.clear = function(page) {
    var all = false;
    if(page === undefined) {
        all = true;
    }

    for(var i = 0; i < this.doms.length; i++) {
        if(all || page === i) {
            var $dom = this.doms[i];
            $dom.find('svg').empty();
        }
    }
};

Concerto.Renderer.prototype.update = function(page) {
    // redraw only specific page
    this.clear(page);
    this.draw(page);
};

