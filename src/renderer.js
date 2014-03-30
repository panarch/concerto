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
    for(var i = 0; i < numPages; i++) {
        var divId = 'content' + i;
        var $div = $('<div>', {id: divId});
        
        var size = Concerto.Parser.getPageSize(musicjson);
        $div.css('width', size.width)
            .css('height', size.height);

        $container.append($div);
        
        var vexflowRenderer = new Vex.Flow.Renderer(divId, backends);
        var ctx = vexflowRenderer.getContext();
        pages.push(ctx); 
    }

    this.musicjson = musicjson;
    this.numPages = numPages;
    this.pages = pages;
};

/**
 * @this {Concerto.Renderer}
 */
Concerto.Renderer.prototype.draw = function() {
    Concerto.Parser.parseAndDraw(this.pages, this.musicjson);
};

