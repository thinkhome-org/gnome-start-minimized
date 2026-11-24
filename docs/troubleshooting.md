# Troubleshooting

## The extension is missing, disabled, or shows an error

Check your GNOME Shell version and the extension's status from a terminal in your GNOME session:

```sh
gnome-shell --version
gnome-extensions info start-minimized@local
```

v1.0.0 supports GNOME Shell 51 only. If you just installed or replaced the ZIP, save your work and log out and back in before enabling it. Check that you used the extension ZIP from the release Assets, not a source archive. If user extensions are turned off in the GNOME Extensions app, turn them on before enabling Start Minimized.

## An app does not launch at sign-in

1. Confirm the app opens from the GNOME app grid, then close it before testing again.
2. Open `gnome-extensions prefs start-minimized@local` and confirm the intended app is in the startup list. If the app was removed or reinstalled under a different desktop ID, remove its old entry and add the installed one.
3. Sign out and back in. If the app has its own autostart option or an entry in another startup tool, disable that duplicate temporarily so you can test Start Minimized on its own.

## A window stays visible, or too many windows are minimized

- Confirm the app is set to open minimized. With **first window only**, a second window is intentionally left alone. With **all startup windows**, extra windows can be minimized while the app is still being watched.
- A window may briefly appear before minimization. A dialog, a window GNOME Shell cannot match to the app, or a very late window may stay visible. No window is monitored indefinitely.
- If you restore a minimized window, it should remain restored. If the app opens a separate window while being watched, that window may still be minimized. Include this distinction in a bug report.
- An app with no tray icon is not a bug here: the extension minimizes normal windows to the dock, overview, or window switcher; it does not create tray icons.

## Collect a short diagnostic log

On a system with `journalctl`, reproduce the problem from a fresh sign-in and look for messages tagged with the extension UUID:

```sh
journalctl --user -b --no-pager | grep -F 'start-minimized@local'
```

Some systems do not put Shell output in the user journal, so an empty result does not prove the extension ran without errors. In an issue, include only relevant lines, the extension and GNOME Shell versions, and the configured scope. Remove usernames, local paths, credentials, and other identifying details before posting.

## Stop or undo the change

Run `gnome-extensions disable start-minimized@local` to stop the extension for your session. That will not close apps already started. See the [rollback and uninstall instructions](../README.md#update-roll-back-or-uninstall) before replacing or removing the installed files.
