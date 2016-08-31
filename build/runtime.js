// This builds the runtime file we need including all deps
var rollup = require('rollup');
var nodeResolve = require('rollup-plugin-node-resolve');
var builtins = require('rollup-plugin-node-builtins');
var commonjs = require('rollup-plugin-commonjs');
var path = require('path');
rollup.rollup({
  // The bundle's starting point. This file will be
  // included, along with the minimum necessary code
  // from its dependencies
    entry: path.resolve(__dirname + '/../src/runtime.js'),
    plugins: [ nodeResolve({ jsnext: true, main: true, browser: true }), commonjs() ],
}).then( function ( bundle ) {
  bundle.write({ 
      dest: path.resolve(__dirname + '/../lib/runtime.js'),
      format: 'iife' 
  })
});
