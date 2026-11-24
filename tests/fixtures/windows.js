import GLib from 'gi://GLib';
import Gtk from 'gi://Gtk?version=4.0';

const appId = ARGV[0];
const app = new Gtk.Application({application_id: appId});
app.connect('activate', () => {
    const open = title => new Gtk.ApplicationWindow({application: app, title, default_width: 320, default_height: 220}).present();
    open('Startup window');
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 3400, () => {
        open('Restored window');
        print(`[fixture] ${appId} restored a second window`);
        return GLib.SOURCE_REMOVE;
    });
});
app.run([]);
