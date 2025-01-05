function log(msg) {
    // print("FullScreenify: " + msg);
}

const savedDesktops = {};
const savedModes = {};
const savedHandlers = {};

const alwaysSkippedWindows = ['kwin', 'kwin_wayland', 'ksmserver-logout-greeter', 'ksmserver',
    'kscreenlocker_greet', 'ksplash', 'ksplashqml', 'plasmashell', 'org.kde.plasmashell', 'krunner',
    'SkipWindows', 'lattedock', 'latte-dock', 'org.kde.spectacle'];

function shouldSkip(window) {
    if (window === null) return true;
    const windowClass = (window.resourceClass.toString() || "").toLowerCase();
    if (!windowClass) {
        log(`Skipped: Null`);
        return true;
    }
    if (alwaysSkippedWindows.indexOf(windowClass) != -1) {
        log(`Skipped: ${windowClass}`);
        return true;
    }
    log(`Handled: ${windowClass}`);
    return false;
}

function moveToNewDesktop(window) {
    let windowName = window.caption.toString();
    let windowId = window.internalId.toString();
    log("Creating new desktop after all existing ones for window: " + windowName);
    let newDesktopNumber = workspace.desktops.length;
    workspace.createDesktop(newDesktopNumber, windowName);
    let newDesktop = workspace.desktops[newDesktopNumber];
    savedDesktops[windowId] = window.desktops;
    window.desktops = [newDesktop];
    workspace.currentDesktop = newDesktop;
    log("Window moved to new desktop: " + newDesktop.name);
}

function sanitizeDesktops(desktops) {
    log("Sanitizing desktops: " + JSON.stringify(desktops))
    let sanitizedDesktops = desktops.filter(value => Object.keys(value).length !== 0);
    log("Sanitized Desktops: " + JSON.stringify(sanitizedDesktops))
    if (sanitizedDesktops.length < 1) {
        sanitizedDesktops = [workspace.desktops[0]];
    }
    return sanitizedDesktops
}

function cleanDesktop(desktop) {
    log("Cleaning desktop: " + JSON.stringify(desktop));
    for (var i in workspace.windowList()) {
        let window = workspace.windowList()[i];
        if (window.desktops.includes(desktop) && !window.skipTaskbar) {
            let windowName = window.resourceName;
            log("Window: " + windowName + " is on the desktop");
            window.desktops = window.desktops.filter(item => item.id !== desktop.id);
            if (window.desktops.length < 1) {
                window.desktops = [workspace.desktops[0]];
            }
            log("Window " + windowName + ": " + JSON.stringify(window.desktops));
        }
    }
}

function restoreDesktop(window) {
    let windowId = window.internalId.toString();
    log("Restoring desktops for " + windowId);
    let currentDesktop = window.desktops[0];
    log("Current desktop: " + JSON.stringify(currentDesktop));
    if (windowId in savedDesktops) {
        log("Found saved desktops for: " + windowId);
        let desktops = sanitizeDesktops(savedDesktops[windowId]);
        log("Saved desktops for window: " + windowId + ": " + JSON.stringify(savedDesktops[windowId]) + " before restore");
        delete savedDesktops[windowId];
        window.desktops = desktops;
        cleanDesktop(currentDesktop);
        workspace.currentDesktop = window.desktops[0];
        workspace.removeDesktop(currentDesktop);
    } else {
        log(windowId + " has no saved desktops. Not restoring")
    }

}

function fullScreenChanged(window) {
    let windowId = window.internalId.toString();
    log("Window : " + windowId + " full-screen : " + window.fullScreen);
    if (window.fullScreen) {
        moveToNewDesktop(window);
    } else {
        restoreDesktop(window);
        workspace.raiseWindow(window);
    }
}

function minimizedStateChanged(window) {
    let windowId = window.internalId.toString();
    if (window.minimized) {
        log("window: " + windowId + " is minimized. Restoring desktops");
        restoreDesktop(window);
    } else if (windowId in savedModes && savedModes[windowId] == 3) {
        log("window: " + windowId + " is un-minimized and was maximized before.");
        moveToNewDesktop(window);
    } else {
        log("Nothing to do for window " + windowId);
        return;
    }
}

function windowCaptionChanged(window) {
    let windowId = window.internalId.toString();
    let windowName = window.caption.toString();
    if (windowId in savedDesktops) {
        log("Updating desktop name for " + windowId);
        window.desktops[0].name = windowName;
    }
}

function installWindowHandlers(window) {
    if (window !== null && window.normalWindow && !window.skipTaskbar && !window.splash && window.fullScreenable) {
        let windowId = window.internalId.toString();
        if (windowId in savedHandlers) {
            log(windowId + " is already being tracked");
            return;
        } else {
            savedHandlers[windowId] = window.resourceName;
        }
        log("Installing handles for " + windowId);
        if (window.fullScreenable) {
            window.fullScreenChanged.connect(function() {
                log(windowId + ": full-screen changed");
                fullScreenChanged(window);
            });
        }
        if (window.fullScreenable) {
            window.captionChanged.connect(function() {
                log(windowId + ": Caption changed");
                windowCaptionChanged(window);
            });
        }

        window.closed.connect(function() {
            log(windowId + ": closed");
            restoreDesktop(window);
            delete savedHandlers[windowId];
            delete savedModes[windowId];
        });
    }
}

function install() {
    log("Installing handler for workspace to track activated windows");
    workspace.windowActivated.connect(window => {
        if (shouldSkip(window)) {
            return;
        }
        installWindowHandlers(window)
    });
    workspace.windowAdded.connect(window => {
        if (shouldSkip(window)) {
            return;
        }
        installWindowHandlers(window);
    });
    log("Workspace handler installed");
}

log("Initializing...");
install();
