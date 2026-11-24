SHELL := /bin/sh
ZIP := dist/start-minimized@local.shell-extension.zip
VERSION := 1.0.0
SOURCE := dist/gnome-start-minimized-$(VERSION).tar.gz

.PHONY: check test test-ui test-shell package source install clean
check: test test-ui package

test:
	glib-compile-schemas --strict --dry-run extension/schemas
	gjs -m tests/startup.js

test-ui:
	./scripts/test-ui.sh

test-shell:
	./tests/headless-shell.sh

package:
	mkdir -p dist
	gnome-extensions pack --force --extra-source=startup.js --extra-source=preferences.js --out-dir=dist extension
	unzip -tq $(ZIP)

install: package
	gnome-extensions install --force $(ZIP)

source:
	mkdir -p dist
	git archive --format=tar.gz --prefix=gnome-start-minimized-$(VERSION)/ --output=$(SOURCE) HEAD
	tar -tzf $(SOURCE) >/dev/null

clean:
	rm -f $(ZIP) $(SOURCE)
