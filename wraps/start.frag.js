// wrap-start.frag.js
(function (root, factory) {
    if (typeof define === 'function') {
        define(factory);
    } else if (typeof exports === 'object') {
         module.exports = factory();
    } else {
         // change "myLib" to whatever your library is called
         root.Concerto = factory();
    }
}(this, function () {
