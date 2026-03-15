# Smartbed Web UI (BLE)

This folder hosts the **single-bed** web GUI that talks to a Smartbed over **Web Bluetooth**.

## Folder layout

- `index.html`
  - Page structure and tabs/containers.
  - References scripts in `src/` + shared scripts in `common/`, and images/icons in `asset/`.
- `asset/`
  - Static assets only: `.jpg`, `.png`, `.ico`, etc.
- `common/`
  - Shared UI scripts used by both WebBLE GUI and Nursing Station.
- `src/`
  - JavaScript + CSS.

## Where “similarities” vs “differences” live

The project is intentionally split into:

- **Shared UI behavior (similarities)**:
  - [smartbed_init.js](file:///f:/PlatformIO/Projects/Smartbed/WebBLE_GUI/common/smartbed_init.js): app-wide startup helpers (`setInitialValues`, `toggleMenu`, and safe HTTPS redirect).
  - [smartbed_ui_common.js](file:///f:/PlatformIO/Projects/Smartbed/WebBLE_GUI/common/smartbed_ui_common.js): shared tab switching rules (`button_click`) and common behaviors (tab highlight, icon highlight, canvas reset, periodic `#RP&VS` polling while on “Air Mattress”).
- **Transport + device logic (differences)**:
  - [smartbed_webble.js](file:///f:/PlatformIO/Projects/Smartbed/WebBLE_GUI/src/smartbed_webble.js): BLE-specific connect/read/write code and parsing; it initializes the shared UI by providing `send(cmd)` as `writeOnCharacteristic(cmd)`.

This pattern keeps **UI navigation rules in one place** while allowing each app to supply its own “how to send a command” implementation.

## Adding a new page/tab (recommended pattern)

1. In `index.html`, add a new container `<div id="yourNewContainer">...</div>` and a button in the navbar that calls `button_click(this.id)`.
2. If the new page exists in both apps (BLE + Nursing Station), add the tab switching logic once in `common/smartbed_ui_common.js` and gate any Nursing-Station-only views behind `hasAllBeds` or a similar config flag.
3. Keep transport actions out of UI code:
   - UI asks: “send `#SCREENX` now”
   - BLE adapter answers: “I know how to send strings over BLE”

## PWA: Service Worker (sw.js)

The service worker ([sw.js](file:///f:/PlatformIO/Projects/Smartbed/WebBLE_GUI/sw.js)) makes the app “installable” and more resilient by:

- Pre-caching the core files (HTML/CSS/JS/icons) so the app can start even if the network is slow or briefly unavailable.
- Intercepting requests and serving cached files when appropriate (especially for app startup/navigation).
- Enabling the browser to treat the site like an app together with the manifest ([manifest.webmanifest](file:///f:/PlatformIO/Projects/Smartbed/WebBLE_GUI/manifest.webmanifest)).

### Install on PC (Chrome / Edge)

You can “install” the web app on Windows/macOS too:

- Open the site in **Chrome** or **Microsoft Edge**.
- Use the browser menu:
  - Chrome: menu → **Cast, save, and share** → **Install page as app** (wording may vary)
  - Edge: menu → **Apps** → **Install this site as an app**
- An app icon is created and it runs in a standalone window (no URL bar).

### Updates

PWAs update by downloading new files in the background.

- The service worker controls caching, so updates may not appear immediately in an already-open app.
- This app shows an **“Update available → Reload”** banner when a new version is ready, so users can reload at a safe time.
- When publishing a release, bumping the cache name in `sw.js` (e.g. `smartbed-webble-v3`, `v4`) forces old caches to be dropped automatically.

## Asset paths (important)

Use these conventions to avoid breaking references when you move files:

- Images/icons: `asset/<file>`
- CSS: `src/style.css`
- Shared JS: `common/<file>.js`
- App-specific JS: `src/<file>.js`
