#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
temp=$(mktemp -d)
trap 'rm -rf "$temp"' EXIT HUP INT TERM
mkdir -p "$temp/schemas" "$temp/data/applications"
cp extension/schemas/*.xml "$temp/schemas/"
cp tests/fixtures/org.example.StartMinimizedTest.desktop "$temp/data/applications/"
glib-compile-schemas --strict "$temp/schemas"
export GSETTINGS_BACKEND=memory GSETTINGS_SCHEMA_DIR="$temp/schemas" XDG_DATA_HOME="$temp/data"
gjs -m tests/preferences.js
