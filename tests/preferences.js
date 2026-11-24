import Adw from 'gi://Adw?version=1';
import Gtk from 'gi://Gtk?version=4.0';
import Gio from 'gi://Gio';
import {buildPage} from '../extension/preferences.js';

Adw.init();
const settings = new Gio.Settings({schema_id: 'org.gnome.shell.extensions.start-minimized'});
const page = buildPage(settings);
const window = new Adw.PreferencesWindow();
window.add(page);
function* descendants(root) {
    yield root;
    for (let child = root.get_first_child(); child; child = child.get_next_sibling())
        yield* descendants(child);
}
function check(condition, message) { if (!condition) throw new Error(message); }
const widgets = () => [...descendants(window)];
const picker = widgets().find(w => w instanceof Gtk.DropDown);
const model = picker.get_model();
const target = 'org.example.StartMinimizedTest.desktop';
const pos = Array.from({length: model.get_n_items()}, (_, i) => model.get_string(i)).findIndex(s => s.endsWith(`(${target})`));
check(pos >= 0, 'installed fixture listed');
picker.set_selected(pos);
widgets().find(w => w instanceof Gtk.Button && w.label === 'Add').emit('clicked');
const read = () => settings.get_value('apps').deepUnpack();
check(read()[target] === true, 'adding defaults to minimized');
const row = widgets().find(w => w instanceof Adw.SwitchRow);
const mode = widgets().find(w => w instanceof Gtk.DropDown && w !== picker);
mode.selected = 1;
check(settings.get_strv('first-window-only').includes(target), 'window scope preference saved');
row.active = false;
check(read()[target] === false && !mode.sensitive, 'switch writes normal mode');
widgets().find(w => w instanceof Gtk.Button && w.tooltip_text === 'Remove from startup').emit('clicked');
check(!Object.hasOwn(read(), target) && !settings.get_strv('first-window-only').includes(target),
    'removal cleans both settings');
print('PASS: real GTK/Libadwaita preferences; picker, add, mode switch and removal use GSettings.');
window.destroy();
