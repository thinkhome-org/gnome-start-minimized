export class Startup {
    constructor(apps, deps, duration = 60000, quiet = 15000, windowAge = 900) {
        this.pending = new Set(apps);
        this.deps = deps;
        this.duration = duration;
        this.quiet = quiet;
        this.windowAge = windowAge;
        this.states = new Map(apps.map(app => [app, {seen: new Map(), lastNew: null}]));
        this.deadline = null;
    }

    get done() { return this.pending.size === 0; }

    matches(app, window) {
        return window.id === app.id || (!window.id && Boolean(app.classes?.includes(window.wmClass)));
    }

    begin() {
        if (this.deadline !== null)
            return;
        this.deadline = this.deps.now() + this.duration;
        const windows = this.deps.getWindows();
        for (const app of this.pending) {
            try {
                if (!windows.some(w => this.matches(app, w)))
                    this.deps.launch(app.launcherId ?? app.id);
                if (!app.minimize)
                    this.pending.delete(app);
            } catch (error) {
                this.deps.log(`${app.id}: ${error.message}`);
                this.pending.delete(app);
            }
        }
    }

    tick() {
        if (this.done)
            return false;
        const now = this.deps.now();
        if (now > this.deadline) {
            for (const app of this.pending) {
                const state = this.states.get(app);
                if (!state.confirmed)
                    this.deps.log(`${app.id}: no window confirmed minimized before timeout`);
            }
            this.pending.clear();
            return false;
        }
        const windows = this.deps.getWindows();
        for (const app of this.pending) {
            const matches = windows.filter(w => this.matches(app, w));
            const state = this.states.get(app);
            for (const window of matches) {
                if (!state.seen.has(window.key)) {
                    state.seen.set(window.key, {since: now, handled: false});
                    state.lastNew = now;
                }
                const seen = state.seen.get(window.key);
                if (seen.handled || now - seen.since < this.windowAge)
                    continue;
                if (!window.minimized)
                    window.minimize();
                if (window.minimized) {
                    seen.handled = true;
                    state.confirmed = true;
                    this.deps.log(`${app.id}: startup window ${window.key} minimized`);
                    if (app.firstOnly) {
                        this.pending.delete(app);
                        break;
                    }
                }
            }
            if (state.lastNew !== null && now - state.lastNew >= this.quiet &&
                matches.every(w => state.seen.get(w.key).handled))
                this.pending.delete(app);
        }
        return !this.done;
    }
}
