function log(msg) {
    print("FullScreenify: " + msg);
}

const handleWindows = new Map();
const isMoved = 2;
const newDesktopNum = 3;
const originDesktopNum = 1;

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
    let windowId = window.internalId.toString();
    let windowName = window.caption.toString();
    log(`Creating new desktop and move window: ${windowId}`);
    let newDesktopNumber = workspace.desktops.length;
    workspace.createDesktop(newDesktopNumber, windowName);
    let newDesktop = workspace.desktops[newDesktopNumber];
    window.desktops = [newDesktop];
    workspace.currentDesktop = newDesktop;
    handleWindows.get(windowId)[isMoved] = true;
    handleWindows.get(windowId).push(newDesktop);
}

function restoreDesktop(window) {
    let windowId = window.internalId.toString();
    log(`Restoring window: ${window.internalId.toString()}`);
    if (!handleWindows.get(windowId)[isMoved]) return;
    let originDesktop = handleWindows.get(windowId)[originDesktopNum];
    let newDesktop = handleWindows.get(windowId)[newDesktopNum];
    if (!workspace.desktops.includes(originDesktop)) {
        log(`Origin desktop does not exist in workspace. Moving to desktop 0.`);
        originDesktop = workspace.desktops[0];
    }
    window.desktops = [originDesktop];
    if (workspace.desktops.includes(newDesktop)) {
        workspace.removeDesktop(newDesktop);
    }
    workspace.currentDesktop = originDesktop;
    handleWindows.get(windowId)[isMoved] = false;
    handleWindows.get(windowId).pop();
}

function fullScreenChanged(window) {
    let windowId = window.internalId.toString();
    if (window.fullScreen && !handleWindows.get(windowId)[isMoved]) {
        log(`Full-screen change fullscreen window: ${windowId}`);
        moveToNewDesktop(window);
    } else {
        log(`Full-screen change restore window: ${windowId}`);
        restoreDesktop(window);
        workspace.raiseWindow(window);
    }
}

function windowCaptionChanged(window) {
    let windowId = window.internalId.toString();
    let windowName = window.caption.toString();
    if (handleWindows.get(windowId)[isMoved]) {
        log(`Updating desktop name for ${windowId}`);
        window.desktops[0].name = windowName;
    }
}

function installWindowHandlers(window) {
    if (!shouldSkip(window) && window !== null && window.normalWindow && !window.skipTaskbar && !window.splash && window.fullScreenable) {
        let windowId = window.internalId.toString();
        if (handleWindows.has(windowId)) {
            log(`Already handling window: ${windowId}`);
            return;
        } else {
            log(`Add window to handle: ${windowId}`);
            handleWindows.set(windowId, [window, workspace.currentDesktop, false]);
        }
        if (window.fullScreenable) {
            log("Connecting handler on fullScreenChanged: " + windowId);
            window.fullScreenChanged.connect(() => fullScreenChanged(window));
            window.captionChanged.connect(() => windowCaptionChanged(window));
        }
        log("Connecting handler on close: " + windowId);
        window.closed.connect(() => {
            restoreDesktop(window);
            handleWindows.delete(windowId);
        });
    }
}

function install() {
    log("Installing handlers");
    workspace.windowActivated.connect(window => installWindowHandlers(window));
    workspace.windowAdded.connect(window => installWindowHandlers(window));
}

install();
