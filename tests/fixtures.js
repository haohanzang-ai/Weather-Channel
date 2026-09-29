'use strict';
/* Regression fixtures — representative analyses whose outputs are pinned.
   If a code change moves any of these numbers, the test fails and the change
   must be justified. This is the guard against a UI edit silently altering a
   scientific result. */

/* Profiles are READ FROM THE APP, not copied.
   These used to be hand-typed duplicates of the switchgrass and sugarcane rows,
   which meant a change to a threshold in js/stress.js left every fixture
   passing — exactly the regression the fixtures exist to catch, and contrary to
   what docs/ARCHITECTURE.md promised. Importing the real table means editing a
   species threshold now fails these tests until the change is acknowledged. */
const fs = require('fs'), vm = require('vm'), path = require('path');
const _ctx = { console };
vm.createContext(_ctx);
vm.runInContext(
  fs.readFileSync(path.join(__dirname, '..', 'js', 'science-constants.js'), 'utf8')
    .replace(/if \(typeof module[\s\S]*?^}/m, ''), _ctx);
/* Load the whole of stress.js rather than slicing it at a comment string. The
   previous version cut the file at the literal text '// ── Stress computation',
   so renaming a comment would have silently broken fixture loading and taken
   every regression pin with it. stress.js only defines functions and constants
   at load time, so evaluating all of it is safe here. */
vm.runInContext(
  fs.readFileSync(path.join(__dirname, '..', 'js', 'stress.js'), 'utf8'), _ctx);
const PROFILES = vm.runInContext('PLANT_ENV_PROFILES', _ctx);

const SWITCHGRASS = PROFILES.switchgrass;
const SUGARCANE   = PROFILES.sugarcane;
if (!SWITCHGRASS || !SUGARCANE) {
  throw new Error('fixtures: expected switchgrass and sugarcane profiles in PLANT_ENV_PROFILES');
}

/* A hot dry Texas summer afternoon, full data. */
const AUSTIN_JULY = {
  label: 'Austin, July afternoon — full data',
  profile: SWITCHGRASS,
  env: { lat:30.2672, lon:-97.7431, tSuffix:'°C',
         current:{ temp:38, humidity:32, uv:9 },
         archive30:{ et0Sum:180, precipSum:22, deficit:158, days:30 },
         hourlyVPD:4.51, hourlySoil:0.09,
         aqi:{ usAqi:62 }, alerts:[], errors:[], fetchTime:'2026-07-15T20:00:00Z' },
  expect: { tolerance: 37, productivity: 41, inputCompleteness: 100 },
};

/* A mild spring day — conditions well inside tolerance. */
const AUSTIN_APRIL = {
  label: 'Austin, mild April day — full data',
  profile: SWITCHGRASS,
  env: { lat:30.2672, lon:-97.7431, tSuffix:'°C',
         current:{ temp:24, humidity:68, uv:6 },
         archive30:{ et0Sum:95, precipSum:110, deficit:-15, days:30 },
         hourlyVPD:0.96, hourlySoil:0.31,
         aqi:{ usAqi:34 }, alerts:[], errors:[], fetchTime:'2026-04-10T18:00:00Z' },
  expect: { tolerance: 97, productivity: 99, inputCompleteness: 100 },
};

/* Degraded providers — archive and soil endpoints failed. */
const DEGRADED = {
  label: 'Provider failure — archive and soil unavailable',
  profile: SWITCHGRASS,
  env: { lat:30.2672, lon:-97.7431, tSuffix:'°C',
         current:{ temp:38, humidity:32 },
         archive30:null, hourlyVPD:4.51, hourlySoil:null,
         aqi:{ usAqi:62 }, alerts:[],
         errors:['archive unavailable','soil unavailable'], fetchTime:'2026-07-15T20:00:00Z' },
  expect: { tolerance: 54, productivity: 55, inputCompleteness: 60 },
};

/* A species poorly matched to the same conditions — must score worse than
   switchgrass on identical inputs. */
const AUSTIN_JULY_SUGARCANE = {
  label: 'Austin, July afternoon — sugarcane (poor match)',
  profile: SUGARCANE,
  env: AUSTIN_JULY.env,
  expect: { tolerance: 0, productivity: 0, inputCompleteness: 100 },
};

module.exports = { SWITCHGRASS, SUGARCANE, AUSTIN_JULY, AUSTIN_APRIL, DEGRADED, AUSTIN_JULY_SUGARCANE };
