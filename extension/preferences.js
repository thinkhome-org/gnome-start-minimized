import Gio from 'gi://Gio';
import GioUnix from 'gi://GioUnix';
import GLib from 'gi://GLib';
import Gtk from 'gi://Gtk?version=4.0';
import Adw from 'gi://Adw?version=1';

export function buildPage(settings) {
    const page = new Adw.PreferencesPage({title: 'Startup Apps', icon_name: 'system-run-symbolic'});
    const choices = new Adw.PreferencesGroup({title: 'Add an application',
        description: 'Changes apply the next time you sign in.'});
    const list = new Adw.PreferencesGroup({title: 'Apps that start at login',
        description: 'Minimized windows stay in the dock. They are not moved to the system tray.'});
    page.add(choices);
    page.add(list);

    const pickerRow = new Adw.ActionRow({title: 'Installed applications'});
    const picker = new Gtk.DropDown({enable_search: true, valign: Gtk.Align.CENTER, hexpand: true});
    const add = new Gtk.Button({label: 'Add', valign: Gtk.Align.CENTER});
    pickerRow.add_suffix(picker);
    pickerRow.add_suffix(add);
    choices.add(pickerRow);

    const read = () => settings.get_value('apps').deepUnpack();
    const save = apps => settings.set_value('apps', new GLib.Variant('a{sb}', apps));
    let available = [];
    let rows = [];

    function refresh() {
        const apps = read();
        available = Gio.AppInfo.get_all()
            .filter(info => info.should_show() && info.get_id()?.endsWith('.desktop') && !Object.hasOwn(apps, info.get_id()))
            .sort((left, right) => left.get_display_name().localeCompare(right.get_display_name()));
        picker.set_model(Gtk.StringList.new(available.map(info => `${info.get_display_name()} (${info.get_id()})`)));
        picker.set_sensitive(available.length > 0);
        add.set_sensitive(available.length > 0);
        for (const row of rows)
            list.remove(row);
        rows = [];
        for (const [id, minimize] of Object.entries(apps)) {
            const app = GioUnix.DesktopAppInfo.new(id);
            const mode = new Gtk.DropDown({valign: Gtk.Align.CENTER,
                tooltip_text: 'Which startup windows to minimize',
                model: Gtk.StringList.new(['All startup windows', 'First window only']),
                selected: Number(settings.get_strv('first-window-only').includes(id)), sensitive: minimize});
            mode.connect('notify::selected', () => {
                const ids = new Set(settings.get_strv('first-window-only'));
                if (mode.selected === 1)
                    ids.add(id);
                else
                    ids.delete(id);
                settings.set_strv('first-window-only', [...ids]);
            });
            const row = new Adw.SwitchRow({title: app?.get_display_name() ?? id, use_markup: false,
                subtitle: app ? 'Start minimized' : 'Application not installed', active: minimize});
            row.connect('notify::active', () => {
                save({...read(), [id]: row.active});
                mode.sensitive = row.active;
            });
            const remove = new Gtk.Button({icon_name: 'list-remove-symbolic', tooltip_text: 'Remove from startup',
                valign: Gtk.Align.CENTER});
            remove.connect('clicked', () => {
                const updated = read();
                delete updated[id];
                save(updated);
                settings.set_strv('first-window-only', settings.get_strv('first-window-only').filter(x => x !== id));
                const launchers = settings.get_value('launchers').deepUnpack();
                delete launchers[id];
                settings.set_value('launchers', new GLib.Variant('a{ss}', launchers));
                refresh();
            });
            row.add_suffix(mode);
            row.add_suffix(remove);
            list.add(row);
            rows.push(row);
        }
        if (rows.length === 0) {
            const empty = new Adw.ActionRow({title: 'No applications configured'});
            list.add(empty);
            rows.push(empty);
        }
    }

    add.connect('clicked', () => {
        const app = available[picker.get_selected()];
        if (!app)
            return;
        save({...read(), [app.get_id()]: true});
        refresh();
    });
    refresh();
    return page;
}
