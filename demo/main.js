// Concerto Base Libraries.
// Taehoon Moon <panarch@kaist.ac.kr>
//
// main
//
// Copyright Taehoon Moon 2014

define(function(require, exports, module) {
    var $ = require('jquery');
    var Logger = require('js-logger');
    Logger.useDefaults();
    var L = Logger.get('main');
    var Converter = require('Converter');
    var Renderer = require('Renderer');
    var Player = require('Player');

    var musicjson;

    /*
    var examples = [
        './examples/scales.xml',
        './examples/sonata16.xml', // x
        './examples/adeste.xml',
        './examples/inv4.xml',
        './examples/inv1.xml',
        './examples/test_notations.xml',
        './examples/blank_a7.xml'
    ];
    */

    function load(url) {
        L.debug('load...... ' + url);
        // use xml example instead of using templates.js
        $.ajax({
            url: url,
            data: null,
            success: function(data) {
                musicjson = Converter.toJSON(data);
                /*
                var valid = tv4.validate(musicjson, schema);
                if(valid) { console.log('pre-validation success'); }
                else { console.log(tv4.error); }
                */

                var $container = $('#container');
                var renderer = new Renderer($container, musicjson);
                renderer.draw();

                var player = new Player(renderer);
                player.load(function() {
                    L.debug('loaded');
                }, '/bower_components/midi-soundfonts/FluidR3_GM/');

                $('#play').on('click', function() {
                    player.play();
                });

                $('#stop').on('click', function() {
                    player.stop();
                });

                /*
                var valid = tv4.validate(musicjson, schema);
                if(valid) { console.log('post-validation success'); }
                else { console.log(tv4.error); }
                */
            },
            dataType: 'xml'
        });
    }

    /*
    $(document).ready(function() {
        $.getJSON('/schema/musicjson.json', function(schema) {
            onReady(schema);
        });
    });
    */
    var defaultUrl = $('#score').val();
    load(defaultUrl);

    $('#score').on('change', function() {
        $('#container').empty();
        var url = $('#score').val();
        load(url);
    });
});
