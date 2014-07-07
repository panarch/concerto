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
    var backends = Vex.Flow.Renderer.Backends.RAPHAEL; 
    if(options && options.backends) {
        backends = options.backends;
    }
    
    var numPages = Concerto.Parser.getNumPages(musicjson);
    var pages = [];
    var doms = [];
    for(var i = 0; i < numPages; i++) {
        var $div = $('<div>');
        $div.addClass('content' + i);
        
        var size = Concerto.Parser.getPageSize(musicjson);
        $div.css('width', size.width)
            .css('height', size.height);

        $container.append($div);
        
        var vexflowRenderer = new Vex.Flow.Renderer($div[0], backends);
        var ctx = vexflowRenderer.getContext();
        pages.push(ctx);
        doms.push($div);
    }

    this.musicjson = musicjson;
    this.numPages = numPages;
    this.pages = pages;
    this.doms = doms;
};

/**
 * @this {Concerto.Renderer}
 */
Concerto.Renderer.prototype.draw = function(page) {
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

