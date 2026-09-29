'use strict';
/* Minimal zero-dependency test harness. Node only, no install step. */
let _pass = 0, _fail = 0, _suite = '';
const _failures = [];

function suite(name) { _suite = name; console.log('\n\x1b[1m' + name + '\x1b[0m'); }
function ok(cond, msg) {
  if (cond) { _pass++; console.log('  \x1b[32m✓\x1b[0m ' + msg); }
  else { _fail++; _failures.push(_suite + ' → ' + msg); console.log('  \x1b[31m✗ ' + msg + '\x1b[0m'); }
}
function eq(actual, expected, msg) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  ok(a === e, `${msg}  (got ${a}, expected ${e})`);
}
function near(actual, expected, tol, msg) {
  ok(actual != null && Math.abs(actual - expected) <= tol,
     `${msg}  (got ${actual}, expected ${expected} ±${tol})`);
}
function throws(fn, msg) {
  let threw = false;
  try { fn(); } catch { threw = true; }
  ok(threw, msg);
}
function report() {
  console.log(`\n${_fail === 0 ? '\x1b[32m' : '\x1b[31m'}${_pass} passed, ${_fail} failed\x1b[0m`);
  if (_failures.length) { console.log('\nFailures:'); _failures.forEach(f => console.log('  · ' + f)); }
  process.exit(_fail === 0 ? 0 : 1);
}
function total(){ return _pass + _fail; }
module.exports = { suite, ok, eq, near, throws, report, total };
