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
            deps: ['jquery', 'raphael'],
            exports: 'Vex'
        }
    },
    paths: {
        requirejs: '../bower_components/requirejs/require',
        almond: '../bower_components/almond/almond',
        jquery: '../bower_components/jquery/dist/jquery',
        'js-logger': '../bower_components/js-logger/src/logger',
        raphael: '../bower_components/raphael/raphael',
        vexflow: '../bower_components/vexflow/releases/vexflow-min'
    },
    packages: [

    ]
});
require(['Concerto']);
