#!/usr/bin/env node
'use strict';
/* Run every suite and report once.  Usage:  node tests/run.js   (or: npm test) */
console.log('\x1b[1mTexasClimate test suite\x1b[0m');
require('./test-models.js');
require('./test-confidence.js');
require('./test-pipeline.js');
require('./test-integrity.js');
require('./harness.js').report();
