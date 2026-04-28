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

## Workflow mode (User vs Developer)

Workflow mode is a UI “profile” that changes which controls are visible (and which screens are allowed).

- Persistence key: `localStorage["smartbed.workflowMode"]` (`"user"` or `"developer"`)
- UI switch: `#workflowMode` on the **Setting** page
- DOM marker: the active mode is reflected as an attribute on `<html>`:
  - Developer: `html[data-workflow-mode="developer"]`
  - User: `html[data-workflow-mode="user"]`

### Show/hide elements with `data-workflow`

Any element can be gated with:

- Developer-only: `data-workflow="developer"`
- User-only: `data-workflow="user"`

The shared UI code toggles these elements by setting `style.display = "none"` for the inactive workflow.

### Hide an entire page in User mode (recommended)

To hide a whole tab/page in User mode:

1. Mark the **navbar tab** as developer-only:
   - `id="bedButton"` (and its duplicate in the small-screen menu) → add `data-workflow="developer"`
2. Mark the corresponding **bottom icon** as developer-only:
   - `id="bedIcon"` → add `data-workflow="developer"`

The shared UI logic will:

- Prevent navigation into developer-only pages in User mode.
- “Pack” the remaining bottom icons to the right so gaps are removed.

Implementation: [smartbed_ui_common.js](file:///f:/PlatformIO/Projects/Smartbed/WebBLE_GUI/common/smartbed_ui_common.js)

## Air Mattress: separate layouts without duplicating HTML

Air Mattress uses one set of element IDs (panels + labels) so the JS can update them consistently.

- Developer layout: defined by inline `style="left/top/width/height"` in [index.html](file:///f:/PlatformIO/Projects/Smartbed/WebBLE_GUI/index.html)
- User layout: defined as CSS overrides that only apply in User mode
  - Selector pattern: `html[data-workflow-mode="user"] #airmattressContainer #panelA1 { ... !important; }`
  - File: [style.css](file:///f:/PlatformIO/Projects/Smartbed/WebBLE_GUI/src/style.css)

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

### Install on Android Phone (Chrome / Edge)

- Open your GitHub Pages URL to .../WebBLE_GUI/index.html in Chrome
- Menu → Install app (or “Add to Home screen”)
- Launch from the new icon → it runs standalone (no URL bar)

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

## Protocol and BLE notes

- ACM delays its first `#ALLX` by ~3.5 seconds after connect. The UI waits ~5.5s before sending any `#R*` queries.
- BLE notifications can arrive in multiple short chunks. The app:
  - Accumulates ASCII in an internal buffer and only processes a frame once complete or after a brief quiet period (~180ms).
  - Does not attempt to parse partial frames, avoiding truncated `#ALLX` updates.
- Pressure map packets `#PSMAP##` / `#PZMAP##` are handled as binary after an 8‑byte header; the column-start byte and 120 payload bytes are extracted per package.
- On connect, initial requests are serialized with gaps: `#RALLX → #RALL → #RSETX → #RSETS`, preventing “GATT operation already in progress”.

## Command decoding details (adopted)

- PRS
  - Header: `#PRS`
  - Parse rule: check `rx_data.substring(0, 4) == "#PRS"` and decode payload from `substring(4)`.
  - Payload mapping (20 triplets): Duration P1..P4, Back angles P1..P4, Leg angles P1..P4, Turn angles P1..P4, Step angle, Duration In Turn Position, Duration In Flat Position, Duration Alternating.
  - UI update: populate inputs and call `updatePressureReleaseSettingToDisplay()`.
- P&VS (Pump & Valves + Status)
  - Request: `#RP&VS` is sent every 2s while the Air Mattress page is visible.
  - Response headers: `#P&VS###` (Dongle/gateway) or `#P&VS` (direct from ACM); UI accepts both.
  - Base payload (indices are 0-based triplets):
    - [0..2] Channel states A,B,C → 0=idle(white), 1=inflating(green), 2=exhausting(orange)
    - [3] Exhaust blocked flag → 0=blocked(show icon), 1=ok
    - [4] Pump state → 0=OFF, 1=ON
    - [5] Pump pressure (kPa or device unit displayed as-is)
    - [6..12] A1..A7 cell states (same palette as channels)
    - [13..19] B1..B7 cell states
    - [20..26] C1..C7 cell states
  - Optional extensions (the UI auto-detects by payload length):
    - If length ≥ 51:
      - Temps [34..39]: HOT, COLD, ROOM, T1, T2, T3 (°C)
      - RHs [40..45]: RHT, RHC, RHR, RH1, RH2, RH3 (%)
      - Side/Leg bags [46..48]: Left, Right, Leg → 0=idle(white), 1=active(green), 2=cooling/hold(orange)
      - [49] TEC state → 0=OFF, 1=ON
      - [50] Blower state → 0=OFF, 1=ON
    - If length ≥ 72:
      - Per‑cell pressures A1..A7 [51..57], B1..B7 [58..64], C1..C7 [65..71]
- ALLX
  - UI sends ALL (28) + SETX (22) + Name (length + chars) in one frame.
  - Device acknowledges with `#ACKX` when receiving from UI; on reconnect, the device may send `#ALLX` without an ACK.
- REMS / RREMS
  - UI sends reminders as length + chars encoded in triplets.
  - Device stores reminders and returns encoded text on `#RREMS`.
- Alternating / Redistribute
  - Alternating inflates both non‑relief channels in a single operation, reduces sequence length.
  - Redistribute deflates shared‑channel top cells by channel when 2+ top cells are in the same channel, then inflates non‑top cells.

## Preferences and settings payloads

- SETS (11 triplets)
  - [0]=mode, [1]=staticPressure, [2]=durationRedistribute, [3]=durationAlternating, [4]=autoTurnAngle,
  - [5]=noTurn, [6]=noTurnRight, [7]=noTurnLeft, [8]=noMoveBack, [9]=noMoveLeg, [10]=reserved
- SETX (≥ 20 triplets, versioned)
  - [0]=version(1), [1]=noPillowMassage, [2]=noCooling, [3]=redistPlusAlter,
  - [4]=AUTOTURN_INTERVAL, [5]=NUMBER_OF_TURNS, [6]=SIDEBAG_FILL_INTERVAL, [7]=LEG_AIRBAG_INTERVAL, [8]=POSTURE_CHECK_INTERVAL, [9]=HOLD_TIME_TO_COOL_VALVES,
  - [10]=PRESSURE_FIRM, [11]=PRESSURE_SITTING, [12]=PRESSURE_RELEASED, [13]=PRESSURE_MAX, [14]=PRESSURE_HYSTERESIS
- ALL (user/body snapshot, see `loadALLData`) and ALLX (combined settings + name) are parsed on connect and when requested.
- UI preferences
  - Workflow mode key: `localStorage["smartbed.workflowMode"]` → `"user"` or `"developer"`.
