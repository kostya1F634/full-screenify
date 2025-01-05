function log(msg) {
    print("FullScreenify: " + msg);
}

const handleWindows = new Map();

const alwaysSkippedWindows = [
    'kwin', 'kwin_wayland', 'ksmserver-logout-greeter', 'ksmserver',
    'kscreenlocker_greet', 'ksplash', 'ksplashqml', 'plasmashell', 'org.kde.plasmashell', 'krunner',
    'SkipWindows', 'lattedock', 'latte-dock', 'org.kde.spectacle'
];

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
    log("Creating new desktop after all existing ones for window: " + windowName);
    let newDesktopNumber = workspace.desktops.length;
    workspace.createDesktop(newDesktopNumber, windowName);
    let newDesktop = workspace.desktops[newDesktopNumber];
    window.desktops = [newDesktop];
    workspace.currentDesktop = newDesktop;
    log("Window moved to new desktop: " + newDesktop.name);
}

function restoreDesktop(window) {
    let windowId = window.internalId.toString();
    if (handleWindows.has(windowId)) {
        let originDesktop = handleWindows.get(windowId)[1];
        window.desktops = [originDesktop];
        workspace.removeDesktop(workspace.currentDesktop);
        workspace.currentDesktop = originDesktop;
        handleWindows.delete(windowId);
    }
}

function fullScreenChanged(window) {
    let windowName = window.caption.toString();
    if (window.fullScreen) {
        log("Full-screen change: fullscreen: " + windowName);
        moveToNewDesktop(window);
    } else {
        log("Full-screen change: restore: " + windowName);
        restoreDesktop(window);
        workspace.raiseWindow(window);
    }
}

function windowCaptionChanged(window) {
    let windowId = window.internalId.toString();
    let windowName = window.caption.toString();
    if (handleWindows.has(windowId)) {
        log(`Updating desktop name for ${windowId}`);
        window.desktops[0].name = windowName;
    }
}

function installWindowHandlers(window) {
    if (!shouldSkip(window) && window !== null && window.normalWindow && !window.skipTaskbar && !window.splash && window.fullScreenable) {
        let windowId = window.internalId.toString();
        let windowName = window.caption.toString();
        if (handleWindows.has(windowId)) {
            log(`Already handling window: ${windowId}`);
            return;
        } else {
            log(`Add window to handle: ${windowId}`);
            handleWindows.set(windowId, [window, workspace.currentDesktop]);
        }
        if (window.fullScreenable) {
            log("Connecting handler on fullScreenChanged: " + windowName);
            window.fullScreenChanged.connect(() => fullScreenChanged(window));
            // window.captionChanged.connect(() => windowCaptionChanged(window));
        }
        log("Connecting handler on close: " + windowName);
        window.closed.connect(() => restoreDesktop(window));
    }
}

function install() {
    log("Installing handlers");
    workspace.windowActivated.connect(window => installWindowHandlers(window));
    workspace.windowAdded.connect(window => installWindowHandlers(window));
}

install();
