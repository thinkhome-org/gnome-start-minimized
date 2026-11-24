# Start Minimized

Start Minimized is a GNOME Shell extension that launches selected applications when you sign in. Choose which apps open normally and which start minimized. Minimized windows are still regular application windows: restore them from the dock, the overview, or the window switcher. The extension does not move apps to the system tray.

**Compatibility:** v1.0.0 supports **GNOME Shell 51 only**. Check your version with `gnome-shell --version`. Other versions are outside the supported scope; do not bypass GNOME Shell's extension compatibility check.

## Install v1.0.0

1. Open the [v1.0.0 release](https://github.com/thinkhome-org/gnome-start-minimized/releases/tag/v1.0.0) and download `start-minimized@local.shell-extension.zip` from Assets, not GitHub's “Source code (zip)” archive or the source tarball.
2. In the download directory, run the following command as your desktop user, not with `sudo`:

   ```sh
   gnome-extensions install ./start-minimized@local.shell-extension.zip
   ```

3. Save your work, log out, and log back in so GNOME Shell loads the new files. Then enable the extension and open Preferences:

   ```sh
   gnome-extensions enable start-minimized@local
   gnome-extensions prefs start-minimized@local
   ```

## Choose your startup apps

In Preferences, select an installed application and click **Add**. Turn off **Start minimized** to open it normally. With **Start minimized** on, choose a scope:

- **Normally:** launch the app at sign-in without minimizing its windows.
- **Minimized, first window only:** minimize the first eligible window and leave additional windows alone.
- **Minimized, all startup windows:** also minimize eligible windows that appear later in the bounded startup phase. Windows opened after that phase are left alone.

Remove an app from the list to stop Start Minimized from launching it. Save your work and sign out and back in to try new settings. If the selected app already starts through its own preferences or another autostart tool, turn off that entry if Start Minimized should manage it instead. Some apps open more than one window, show progress before their main window, or are already running; see [troubleshooting](docs/troubleshooting.md) if the result differs from what you expect.

Startup minimization is not a permanent rule. Once the extension has handled a window, restoring that same window does not cause it to minimize again. While **all startup windows** is active, a newly created window from the same app can still be treated as part of startup. No keyboard or mouse input is simulated.

## Update, roll back, or uninstall

The UUID is still `start-minimized@local`, including for users migrating from a local install. Keep a copy of your previous installable ZIP if you may need to roll back. Disable the current copy first, then install the replacement ZIP with `--force`:

```sh
gnome-extensions disable start-minimized@local
gnome-extensions install --force ./REPLACEMENT-FILE.zip
```

Replace `REPLACEMENT-FILE.zip` with the actual filename. Log out and back in **before** re-enabling the extension. To roll back, use the same steps with your known-good ZIP, check Preferences, and test a fresh sign-in. If no compatible previous ZIP is available, leave the extension disabled.

To remove the user-installed copy:

```sh
gnome-extensions disable start-minimized@local
gnome-extensions uninstall start-minimized@local
```

Log out and back in afterward. Disabling or uninstalling does not close apps already launched. Do not rely on uninstalling or reinstalling to reset your saved preferences.

## Project links

- [Troubleshooting](docs/troubleshooting.md)
- [Architecture](docs/architecture.md)
- [Contributing and building from source](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)
- [Security policy](SECURITY.md)

## License

GPL-3.0-or-later. See [LICENSE](LICENSE).
