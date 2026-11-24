#!/bin/sh
set -eu
case ${1-} in
  --inside) root=$2 ;;
  *)
    root=$(mktemp -d)
    trap 'rm -rf "$root"' EXIT
    mkdir -m 700 "$root/run"
    mkdir "$root/home" "$root/services"
    export HOME="$root/home" XDG_RUNTIME_DIR="$root/run" XDG_CONFIG_HOME="$root/config" XDG_DATA_HOME="$root/data" XDG_CACHE_HOME="$root/cache"
    export DCONF_PROFILE="$root/dconf-profile"
    printf 'user-db:start_minimized_test\n' > "$DCONF_PROFILE"
    cp /usr/share/dbus-1/services/ca.desrt.dconf.service "$root/services/"
    printf '<busconfig><type>session</type><listen>unix:tmpdir=%s</listen><servicedir>%s</servicedir><policy context="default"><allow send_destination="*" eavesdrop="true"/><allow eavesdrop="true"/><allow own="*"/></policy></busconfig>\n' "$root/run" "$root/services" > "$root/bus.conf"
    dbus-run-session --config-file="$root/bus.conf" -- "$0" --inside "$root"
    exit
    ;;
esac
cd "$(dirname "$0")/.."
base=$(pwd)
cleanup() {
    if [ -n "${shell_pid-}" ]; then
        kill "$shell_pid" 2>/dev/null || :
        wait "$shell_pid" 2>/dev/null || :
    fi
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' HUP TERM

export GSETTINGS_BACKEND=dconf WAYLAND_DISPLAY=wayland-startmin-test XDG_SESSION_TYPE=wayland XDG_CURRENT_DESKTOP=GNOME
export DBUS_SYSTEM_BUS_ADDRESS="$DBUS_SESSION_BUS_ADDRESS" GDK_BACKEND=wayland GTK_A11Y=none GIO_USE_VFS=local
unset DISPLAY XDG_SESSION_ID

apps="$XDG_DATA_HOME/applications"
ext="$XDG_DATA_HOME/gnome-shell/extensions/start-minimized@local"
mkdir -p "$apps" "$ext" "$XDG_CONFIG_HOME"
cp -R extension/. "$ext/"
glib-compile-schemas --strict "$ext/schemas"
for mode in All First Normal; do
    id="org.example.StartMinimized$mode"
    printf '[Desktop Entry]\nName=Test %s\nType=Application\nExec=gjs -m "%s/tests/fixtures/windows.js" %s\n' "$mode" "$base" "$id" > "$apps/$id.desktop"
done
cp "$apps/org.example.StartMinimizedAll.desktop" "$apps/org.example.StartMinimizedLauncher.desktop"
printf 'NoDisplay=true\n' >> "$apps/org.example.StartMinimizedLauncher.desktop"
sed -i 's/^Exec=.*/Exec=\/usr\/bin\/false/' "$apps/org.example.StartMinimizedAll.desktop"
GSETTINGS_SCHEMA_DIR="$ext/schemas" gsettings set org.gnome.shell.extensions.start-minimized apps "{'org.example.StartMinimizedAll.desktop': true, 'org.example.StartMinimizedFirst.desktop': true, 'org.example.StartMinimizedNormal.desktop': false}"
GSETTINGS_SCHEMA_DIR="$ext/schemas" gsettings set org.gnome.shell.extensions.start-minimized launchers "{'org.example.StartMinimizedAll.desktop': 'org.example.StartMinimizedLauncher.desktop'}"
GSETTINGS_SCHEMA_DIR="$ext/schemas" gsettings set org.gnome.shell.extensions.start-minimized first-window-only "['org.example.StartMinimizedFirst.desktop']"
gsettings set org.gnome.shell enabled-extensions "['start-minimized@local']"
gsettings set org.gnome.shell disable-user-extensions false
: > "$root/shell.log"
gnome-shell --headless --wayland --virtual-monitor=1024x768 --wayland-display="$WAYLAND_DISPLAY" >"$root/shell.log" 2>&1 &
shell_pid=$!
if ! python3 - "$root/shell.log" <<'PY'
import pathlib, re, sys, time
log = pathlib.Path(sys.argv[1]); stop = time.monotonic() + 22
while time.monotonic() < stop:
    text = log.read_text()
    if len(re.findall(r'\[start-minimized@local\] org\.example\.StartMinimizedAll\.desktop: startup window \d+ minimized', text)) == 2 and all(f'[fixture] org.example.StartMinimized{mode} restored a second window' in text for mode in ('All','First','Normal')):
        time.sleep(1.5)
        text = log.read_text()
        for mode, expected in [('All', 2), ('First', 1), ('Normal', 0)]:
            count = len(re.findall(r'\[start-minimized@local\] org\.example\.StartMinimized'+mode+r'\.desktop: startup window \d+ minimized', text))
            assert count == expected, (mode, count, expected)
        print('PASS: real GNOME / Wayland; delayed GTK windows minimized 2 / 1 / 0 for all / first / normal.')
        break
    time.sleep(.2)
else:
    raise SystemExit('Timed out waiting for real Shell and GTK window results')
PY
then
    cat "$root/shell.log" >&2
    exit 1
fi
