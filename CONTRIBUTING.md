# Contributing to Start Minimized

## Report a problem or suggest a change

Search the existing issues and read the [troubleshooting guide](docs/troubleshooting.md) first. For bugs, include your extension version, `gnome-shell --version` output, desktop app ID if known, app startup settings, and steps from a fresh sign-in. Share only the relevant, redacted lines from logs. Report suspected vulnerabilities privately using the [security policy](SECURITY.md).

For features, describe what happens today, what you want to happen, and how someone could recognize that the change works. Discuss changes to window matching, startup timing, persisted settings, or GNOME Shell compatibility before making a large patch.

## Build and check locally

Work from the repository root. Install GNU Make, GJS, GLib's `glib-compile-schemas`, the GTK 4 and libadwaita introspection libraries, `gnome-extensions`, and `unzip`. The preferences check needs a graphical session; for a headless Linux environment with D-Bus and Xvfb, run `dbus-run-session -- xvfb-run -a make check`. Use a **GNOME Shell 51** session to verify desktop behavior: the local checks are not a substitute for a fresh sign-in test.

```sh
make check
make package
make source  # archive the committed tree
```

Use the extension ZIP to test installation. The source tarball is for unpacking and building, not for `gnome-extensions install`. To install the build for your user from the checkout, run `make install`. If a copy is enabled, disable it before replacing its files. Log out and back in before enabling the new files; see the [installation guide](README.md#install-v100).

Verify at least the behavior you changed and record the result in your pull request. For changes to startup behavior, use a test account or a session where logging out is safe:

| Scenario | Expected result |
| --- | --- |
| No apps configured | No apps are launched by the extension. |
| One app configured to open normally | The app launches without its windows being minimized by the extension. |
| First-window-only with two startup windows | The first eligible window minimizes; the second stays in its normal state. |
| All startup windows with a delayed second window | Both eligible windows minimize if the second arrives while the app is still being watched. |
| Restore a handled window, then open another after startup ends | The restored window stays restored; the new window is not minimized by the extension. |
| Disable during startup | The extension stops handling windows, including delayed ones. |

## Open a pull request

- Keep the change focused. Add regression coverage when changing startup or settings behavior, and update the documentation when user-facing behavior changes.
- Describe what changed, the scenarios you checked, the GNOME Shell version used for any desktop test, and anything you could not test. Call out changes that affect existing settings or rollback.
- Do not broaden Shell compatibility without testing it. Keep machine-specific workarounds, personal launcher settings, credentials, and unredacted logs out of the repository and release artifacts.
- Submit only material you have the right to contribute under the project's GPL-3.0-or-later license. See [LICENSE](LICENSE).

See [architecture](docs/architecture.md) for the startup lifecycle and the window-matching boundaries.
