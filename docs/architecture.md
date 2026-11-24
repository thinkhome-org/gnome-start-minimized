# Architecture

Start Minimized runs in the GNOME Shell session. It launches selected desktop apps at startup and manages their regular windows only during a short, bounded startup phase. It is not a separate daemon, a tray integration, or a general-purpose window rule engine.

## Settings and application identity

Preferences store the startup list and per-app behavior in the `org.gnome.shell.extensions.start-minimized` GSettings schema. Apps are identified by desktop launcher IDs, not by window titles. The `apps` key maps `.desktop` IDs to booleans (`true` for minimized, `false` for normal). The `first-window-only` key lists IDs for which only one window should be minimized. Minimized apps not in that list use **all startup windows**. Preferences are read for the startup pass; use a fresh sign-in to exercise changes.

The extension retains the UUID `start-minimized@local` and the existing `apps` key so local installs that used the same schema can retain their startup list.

## Startup lifecycle

1. Once the Shell is ready, the extension starts a startup pass. It uses desktop launchers rather than constructing shell commands. If a matching window already exists, it skips launching another instance. Apps set to open normally are not watched for minimization.
2. For a minimized app, track eligible regular windows using desktop app identity. Where the Shell cannot associate a window with a desktop app, a window-class match can help; this is not guaranteed for every app. Dialogs and other non-regular windows are outside scope.
3. In **first window only** mode, stop handling that app after its first eligible window has been handled. In **all startup windows** mode, continue looking for additional windows, including delayed ones, until the app settles or the overall startup deadline is reached.
4. Remember each handled window so restoring it during the startup phase does not minimize it again. A different window created while the app is still being watched may be minimized. The extension does not minimize new windows after the startup pass, and disabling it stops active monitoring.

The extension uses Shell window operations, not simulated keypresses or clicks. Minimizing changes the state of a regular window; it does not hide the application in the system tray. Independent autostart tools and the user's actions can also create windows during sign-in; the extension cannot reliably distinguish two same-app windows by who requested them.

## Source layout

- `extension/` contains the Shell entry point, startup logic, preferences, metadata, and GSettings schema.
- `tests/` covers the startup and packaging behavior that can be checked outside an interactive session.
- `scripts/` contains repository tooling for checks and packaging.

Keep Shell integration separate from startup policy where possible. Verify timing and window identification in a real GNOME Shell 51 session as well as with automated checks. Machine-specific launch or window workarounds are not part of the extension package.

An optional `launchers` GSettings mapping replaces only the desktop entry used to start an app. The original desktop ID still identifies its windows. This allows a separate installed launcher for a systemd-managed application without modifying the app's usual launcher or bundling local commands.
