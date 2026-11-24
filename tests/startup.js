import {Startup} from '../extension/startup.js';

function check(condition, message) { if (!condition) throw new Error(message); }
let now = 0;
let windows = [];
const launched = [];
const messages = [];
const app = {id: 'browser.desktop', minimize: true, classes: ['browser']};
const makeWindow = (id, key, wmClass) => ({id, key, wmClass, minimized: false,
    calls: 0, minimize() { this.calls++; this.minimized = true; }});
const deps = {getWindows: () => windows, launch: id => launched.push(id),
    now: () => now, log: s => messages.push(s)};
const first = makeWindow(app.id, 1);
const unrelated = makeWindow('unrelated.desktop', 2, 'browser');
windows = [first, unrelated];
const startup = new Startup([app], deps, 10000, 2000, 300);
startup.begin(); startup.begin();
check(launched.length === 0, 'no duplicate launch for existing windows');
check(startup.tick() && !first.minimized, 'initial window must age before minimization');
now = 400;
check(startup.tick() && first.minimized, 'first window minimized; keep monitoring');
first.minimized = false;
const restored = makeWindow(app.id, 3);
windows.push(restored);
now = 1500;
check(startup.tick() && !restored.minimized, 'late session-restore window recognized');
now = 1900;
check(startup.tick() && restored.minimized && first.calls === 1 && !unrelated.minimized,
    'late window minimized once; restored first and unrelated window untouched');
now = 3600;
check(!startup.tick() && startup.done, 'stop after quiet period');
const launchNormal = new Startup([{id: 'normal.desktop', minimize: false}], deps);
launchNormal.begin();
check(launched.at(-1) === 'normal.desktop' && !launchNormal.tick(), 'normal launch is not monitored');
const missing = new Startup([{id: 'missing.desktop', minimize: true}], deps, 100);
missing.begin(); now += 101;
check(!missing.tick() && messages.some(s => s.includes('no window confirmed')), 'bounded timeout diagnosed');
const one = makeWindow(app.id, 4);
const two = makeWindow(app.id, 5);
windows = [one, two];
const firstOnly = new Startup([{...app, firstOnly: true}], deps, 10000, 2000, 300);
firstOnly.begin(); firstOnly.tick(); now += 400;
check(!firstOnly.tick() && one.minimized && !two.minimized, 'only first window is minimized');
const overridden = new Startup([{id: 'other.desktop', launcherId: 'wrapper.desktop', minimize: true}], deps);
overridden.begin();
check(launched.at(-1) === 'wrapper.desktop' && !overridden.matches({id: 'other.desktop'}, makeWindow('wrapper.desktop', 6)), 'launcher override changes only launching');
print('PASS: late startup window; no repeats; quiet-period stop; normal launch; timeout; exact identity; first-window mode.');
