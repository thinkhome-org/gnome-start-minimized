# Changelog

## v1.0.0

Initial release for **GNOME Shell 51**.

- Choose which installed applications launch at sign-in and whether each opens normally or minimized. Preferences are stored in GSettings.
- For each minimized app, choose to minimize only its first eligible window or also minimize delayed windows during a bounded startup phase.
- Once a window has been handled, restoring it does not cause it to minimize again. No simulated input or system-tray integration is used.
- Retain the `start-minimized@local` UUID for migration from local installs.
