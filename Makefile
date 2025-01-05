ARCHIVE_NAME := full-screenify.kwinscript
DESTINATION := ~/Downloads/$(ARCHIVE_NAME)
INSTALL_DIR := ~/.local/share/kwin/scripts/full-screenify
PACKAGE_DIR := $(shell pwd)

.PHONY: all clean install uninstall

all: install

package:
	@echo "Creating tar archive..."
	@tar -cf $(DESTINATION) .
	@echo "Archive saved to $(DESTINATION)"

clean:
	@echo "Removing existing archive..."
	@rm -f $(DESTINATION)
	@echo "Archive removed from $(DESTINATION)"

install:
	@echo "Installing full-screenify script..."
	@rm -rf $(INSTALL_DIR)  # Удаляем существующую директорию, если она есть
	@mkdir -p $(INSTALL_DIR) # Создаем новую пустую директорию
	@cp -r $(PACKAGE_DIR)/* $(INSTALL_DIR)/ # Копируем содержимое
	@echo "Script installed to $(INSTALL_DIR)"

uninstall:
	@echo "Uninstalling full-screenify script..."
	@rm -rf $(INSTALL_DIR)
	@echo "Script removed from $(INSTALL_DIR)"

