# Makefile to create a tar archive of the current directory

# Variables
ARCHIVE_NAME := full-screenify.kwinscript
DESTINATION := ~/Downloads/$(ARCHIVE_NAME)

.PHONY: all clean

# Default target
all: package

# Create the tar archive
package:
	@echo "Creating tar archive..."
	@tar -cf $(DESTINATION) .
	@echo "Archive saved to $(DESTINATION)"

# Clean up the archive from the destination
clean:
	@echo "Removing existing archive..."
	@rm -f $(DESTINATION)
	@echo "Archive removed from $(DESTINATION)"

