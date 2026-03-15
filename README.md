# Smartbed Web UI (BLE)

This folder hosts the **single-bed** web GUI that talks to a Smartbed over **Web Bluetooth**.

## Folder layout

- `index.html`
  - Page structure and tabs/containers.
  - References all scripts in `src/` and all images/icons in `asset/`.
- `asset/`
  - Static assets only: `.jpg`, `.png`, `.ico`, etc.
- `src/`
  - JavaScript + CSS.

## Where “similarities” vs “differences” live

The project is intentionally split into:

- **Shared UI behavior (similarities)**:
  - [smartbed_init.js](file:///f:/PlatformIO/Projects/Smartbed/WebBLE_GUI/src/smartbed_init.js): app-wide startup helpers (`setInitialValues`, `toggleMenu`, and safe HTTPS redirect).
  - [smartbed_ui_common.js](file:///f:/PlatformIO/Projects/Smartbed/WebBLE_GUI/src/smartbed_ui_common.js): shared tab switching rules (`button_click`) and common behaviors (icon highlight, canvas reset, periodic `#RP&VS` polling while on “Air Mattress”).
- **Transport + device logic (differences)**:
  - [smartbed_webble.js](file:///f:/PlatformIO/Projects/Smartbed/WebBLE_GUI/src/smartbed_webble.js): BLE-specific connect/read/write code and parsing; it initializes the shared UI by providing `send(cmd)` as `writeOnCharacteristic(cmd)`.

This pattern keeps **UI navigation rules in one place** while allowing each app to supply its own “how to send a command” implementation.

## Adding a new page/tab (recommended pattern)

1. In `index.html`, add a new container `<div id="yourNewContainer">...</div>` and a button in the navbar that calls `button_click(this.id)`.
2. If the new page exists in both apps (BLE + Nursing Station), add the tab switching logic once in `src/smartbed_ui_common.js` and gate any Nursing-Station-only views behind `hasAllBeds` or a similar config flag.
3. Keep transport actions out of UI code:
   - UI asks: “send `#SCREENX` now”
   - BLE adapter answers: “I know how to send strings over BLE”

## Asset paths (important)

Use these conventions to avoid breaking references when you move files:

- Images/icons: `asset/<file>`
- CSS: `src/style.css`
- JS: `src/<file>.js`

