/*globals require*/
require.config({
    shim: {
        jquery: {
            exports: '$'
        },
        raphael: {
            exports: 'Raphael'
        },
        vexflow: {
            deps: ['raphael'],
            exports: 'Vex'
        },
        jsmidgen: {
            exports: 'Midi'
        },
        midi: {
            deps: ['base64binary', 'jasmid-stream', 'jasmid-midifile', 'jasmid-replayer'],
            exports: 'MIDI'
        },
        base64binary: {
            exports: 'Base64Binary'
        },
        'jasmid-stream': {
            exports: 'Stream'
        },
        'jasmid-midifile': {
            exports: 'MidiFile'
        },
        'jasmid-replayer': {
            exports: 'Replayer'
        }
    },
    paths: {
        requirejs: '../bower_components/requirejs/require',
        almond: '../bower_components/almond/almond',
        jquery: '../bower_components/jquery/dist/jquery',
        'js-logger': '../bower_components/js-logger/src/logger',
        raphael: '../bower_components/raphael/raphael',
        vexflow: '../bower_components/vexflow/releases/vexflow-min',
        jsmidgen: '../bower_components/jsmidgen/lib/jsmidgen',
        midi: '../bower_components/panarch-midi/build/MIDI',
        base64binary: '../bower_components/panarch-midi/inc/base64binary',
        'jasmid-stream': '../bower_components/panarch-midi/inc/jasmid/stream',
        'jasmid-midifile': '../bower_components/panarch-midi/inc/jasmid/midifile',
        'jasmid-replayer': '../bower_components/panarch-midi/inc/jasmid/replayer'
    },
    packages: [

    ]
});
require(['Concerto']);
