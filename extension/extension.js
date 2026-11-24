import GioUnix from 'gi://GioUnix';
import GLib from 'gi://GLib';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Startup} from './startup.js';

let startup;

export default class StartMinimizedExtension extends Extension {
    enable() {
        const settings = this.getSettings();
        const firstOnly = new Set(settings.get_strv('first-window-only'));
        const launchers = settings.get_value('launchers').deepUnpack();
        const configuredApps = Object.entries(settings.get_value('apps').deepUnpack())
            .map(([id, minimize]) => {
                const info = GioUnix.DesktopAppInfo.new(id);
                const aliases = [id.replace(/\.desktop$/, ''), info?.get_startup_wm_class(),
                    info?.get_executable()?.split('/').at(-1)];
                return {id, minimize, launcherId: Object.hasOwn(launchers, id) ? launchers[id] : id,
                    firstOnly: firstOnly.has(id),
                    classes: aliases.filter(Boolean).map(x => x.toLowerCase())};
            });
        startup ??= new Startup(configuredApps, {
            getWindows: () => {
                const tracker = Shell.WindowTracker.get_default();
                return global.get_window_actors()
                    .map(actor => actor.meta_window)
                    .filter(w => w?.get_window_type() === Meta.WindowType.NORMAL &&
                        !w.get_transient_for() && !w.is_skip_taskbar())
                    .map(w => ({
                        key: w.get_id(),
                        id: (() => {
                            const app = tracker.get_window_app(w);
                            return app && !app.is_window_backed() ? app.get_id() : null;
                        })(),
                        wmClass: w.get_wm_class()?.toLowerCase(),
                        get minimized() { return w.minimized; },
                        minimize: () => { if (w.can_minimize()) w.minimize(); },
                    }));
            },
            launch: id => {
                const app = GioUnix.DesktopAppInfo.new(id);
                if (!app || !app.launch([], global.create_app_launch_context(0, -1)))
                    throw new Error(`Could not launch ${id}`);
            },
            now: () => GLib.get_monotonic_time() / 1000,
            log: message => console.log(`[${this.uuid}] ${message}`),
        });
        if (startup.done)
            return;
        if (Main.layoutManager._startingUp) {
            this._readyId = Main.layoutManager.connect('startup-complete', () => {
                Main.layoutManager.disconnect(this._readyId);
                this._readyId = 0;
                this._start();
            });
        } else {
            this._start();
        }
    }

    _start() {
        startup.begin();
        if (startup.tick()) {
            this._timerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 250, () => {
                if (startup.tick())
                    return GLib.SOURCE_CONTINUE;
                this._timerId = 0;
                return GLib.SOURCE_REMOVE;
            });
        }
    }

    disable() {
        if (this._readyId)
            Main.layoutManager.disconnect(this._readyId);
        if (this._timerId)
            GLib.Source.remove(this._timerId);
        this._readyId = 0;
        this._timerId = 0;
    }
}
