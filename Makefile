ARCHIVE_NAME := fullscreenify.kwinscript
DESTINATION := ~/Downloads/$(ARCHIVE_NAME)
PACKAGE_DIR := $(shell pwd)

.PHONY: all clean install uninstall clean-install list env debug interact

all: clean-install

package:
	@echo "Creating tar archive..."
	@tar -cf $(DESTINATION) .
	@echo "Archive saved to $(DESTINATION)"

clean:
	@echo "Removing existing archive..."
	@rm -f $(DESTINATION)
	@echo "Archive removed from $(DESTINATION)"

install: 
	@kpackagetool6 --type=KWin/Script -i .
	
uninstall:
	-@kpackagetool6 --type=KWin/Script -r fullscreenify

clean-install:
	-@kpackagetool6 --type=KWin/Script -r fullscreenify || true
	@kpackagetool6 --type=KWin/Script -i .

interact:
	@plasma-interactiveconsole --kwin
	
list:
	@kpackagetool6 --type=KWin/Script --list

env:
	@set QT_LOGGING_RULES "kwin_*.debug=true"

debug:
	@journalctl -f QT_CATEGORY=js QT_CATEGORY=kwin_scripting
