import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import {buildPage} from './preferences.js';

export default class StartMinimizedPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window.set_default_size(680, 550);
        window.add(buildPage(this.getSettings()));
    }
}
