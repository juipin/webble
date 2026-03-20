/*
  Shared UI logic (tabs + screen switching) used by both WebBLE_GUI and WebSerial_NS.

  Pattern:
  - Similarities live here: what each tab shows/hides, icon highlighting, pressure-map canvas reset,
    and the periodic "#RP&VS" polling while on the Air Mattress tab.
  - Differences live in each app's main script: the transport function that sends strings
    (BLE: writeOnCharacteristic, Serial: writeToStream) and any app-only pages (e.g. Nursing Station "All Beds").
*/
(function () {
  const byId = (id) => document.getElementById(id);

  const STORAGE_KEY_WORKFLOW = "smartbed.workflowMode";

  const setDisplay = (el, value) => { /* "none" or "block" for a container */
    if (el) el.style.display = value;
  };

  const setSelected = (el, selected) => { /* true or false for the bottom icon. When setSelected(icons.id, true), an orange frame is display around the icon. */
    if (!el) return;
    if (selected) el.classList.add("selected");
    else el.classList.remove("selected");
  };

  const api = {};

  const ensureInit = () => api._ctx;

  const isAllowedInMode = (el, mode) => {
    if (!el) return true;
    const wf = el.getAttribute("data-workflow");
    if (!wf) return true;
    return wf === mode;
  };

  const packBottomIcons = (ctx) => {
    if (!ctx || !ctx.iconOrder || !ctx.iconSlots || ctx.iconSlots.length === 0) return;
    const visible = ctx.iconOrder.filter((d) => d.el && window.getComputedStyle(d.el).display !== "none");
    visible.forEach((d, idx) => {
      d.el.style.right = ctx.iconSlots[idx] || ctx.iconSlots[ctx.iconSlots.length - 1];
    });
  };

  api.getWorkflowMode = function () {
    const v = (window.localStorage && localStorage.getItem(STORAGE_KEY_WORKFLOW)) || "user";
    return v === "developer" ? "developer" : "user";
  };

  api.applyWorkflowMode = function (mode) {
    const normalized = mode === "developer" ? "developer" : "user";
    document.documentElement.dataset.workflowMode = normalized;
    document.querySelectorAll('[data-workflow="developer"]').forEach((el) => {
      el.style.display = normalized === "developer" ? "" : "none";
    });
    document.querySelectorAll('[data-workflow="user"]').forEach((el) => {
      el.style.display = normalized === "user" ? "" : "none";
    });

    const select = byId("workflowMode");
    if (select) select.value = normalized;

    const ctx = ensureInit();
    if (ctx) packBottomIcons(ctx);
  };

  api.setWorkflowMode = function (mode) {
    const normalized = mode === "developer" ? "developer" : "user";
    if (window.localStorage) localStorage.setItem(STORAGE_KEY_WORKFLOW, normalized);
    api.applyWorkflowMode(normalized);

    const ctx = ensureInit();
    if (!ctx || typeof window.button_click !== "function") return;

    const pickFallback = () => {
      const candidates = ["airmattressButton", "pressuremapButton", "settingButton", "bedButton"];
      for (const id of candidates) {
        const el = byId(id);
        if (isAllowedInMode(el, normalized)) return id;
      }
      return null;
    };

    const fallback = pickFallback();
    if (!fallback) return;

    const pages = [
      { container: ctx.containers.bed, buttonId: "bedButton" },
      { container: ctx.containers.airmattress, buttonId: "airmattressButton" },
      { container: ctx.containers.pressuremap, buttonId: "pressuremapButton" },
      { container: ctx.containers.setting, buttonId: "settingButton" },
    ];

    if (ctx.containers.allbeds) pages.push({ container: ctx.containers.allbeds, buttonId: ctx.nav.allbedsButtonId });

    const current = pages.find((p) => p.container && p.container.style.display !== "none");
    if (!current) return;

    const currentButton = byId(current.buttonId);
    if (isAllowedInMode(currentButton, normalized)) return;

    window.button_click(fallback);
  };

  api.showUserInformation = function () {
    const ctx = ensureInit();
    if (!ctx) return;
    setDisplay(ctx.containers.background, "none");
    setDisplay(ctx.containers.setting, "none");
    setDisplay(ctx.containers.userInfo, "block");
  };

  api.showSmartbedControl = function () {
    const ctx = ensureInit();
    if (!ctx) return;
    setDisplay(ctx.containers.background, "none");
    setDisplay(ctx.containers.setting, "none");
    setDisplay(ctx.containers.smartbedControl, "block");
  };

  api.returnFromUserInformation = function () {
    const ctx = ensureInit();
    if (!ctx) return;
    setDisplay(ctx.containers.background, "block");
    setDisplay(ctx.containers.setting, "block");
    setDisplay(ctx.containers.userInfo, "none");
  };

  api.returnFromSmartbedControl = function () {
    const ctx = ensureInit();
    if (!ctx) return;
    setDisplay(ctx.containers.background, "block");
    setDisplay(ctx.containers.bed, "block");
    setDisplay(ctx.containers.smartbedControl, "none");
  };

  api.setPrsFields = function (fields) {
    const setValue = (id, value) => {
      const el = byId(id);
      if (!el) return;
      el.value = value === undefined || value === null ? "" : String(value);
    };

    const setText = (id, value) => {
      const el = byId(id);
      if (!el) return;
      el.textContent = value === undefined || value === null ? "" : String(value);
    };

    setValue("taDurationP1", fields.durationP1);
    setValue("taDurationP2", fields.durationP2);
    setValue("taDurationP3", fields.durationP3);
    setValue("taDurationP4", fields.durationP4);
    setValue("taBackAngleP1", fields.backAngleP1);
    setValue("taBackAngleP2", fields.backAngleP2);
    setValue("taBackAngleP3", fields.backAngleP3);
    setValue("taBackAngleP4", fields.backAngleP4);
    setValue("taLegAngleP1", fields.legAngleP1);
    setValue("taLegAngleP2", fields.legAngleP2);
    setValue("taLegAngleP3", fields.legAngleP3);
    setValue("taLegAngleP4", fields.legAngleP4);
    setValue("taTurnAngleP1", fields.turnAngleP1);
    setValue("taTurnAngleP2", fields.turnAngleP2);
    setValue("taTurnAngleP3", fields.turnAngleP3);
    setValue("taTurnAngleP4", fields.turnAngleP4);
    setValue("taDurationInTurnPosition", fields.durationInTurnPosition);
    setValue("taDurationInFlatPosition", fields.durationInFlatPosition);
    setValue("taDurationAlternating", fields.durationAlternating);

    setText("lblBradenScorePRS", fields.bradenScore);
    setText("lblShear", fields.shear);
    setText("lblMobility", fields.mobility);
  };

  api.getPrsFields = function () {
    const getNumber = (id) => {
      const el = byId(id);
      return el ? Number(el.value) : 0;
    };

    return {
      durationP1: getNumber("taDurationP1"),
      durationP2: getNumber("taDurationP2"),
      durationP3: getNumber("taDurationP3"),
      durationP4: getNumber("taDurationP4"),
      backAngleP1: getNumber("taBackAngleP1"),
      backAngleP2: getNumber("taBackAngleP2"),
      backAngleP3: getNumber("taBackAngleP3"),
      backAngleP4: getNumber("taBackAngleP4"),
      legAngleP1: getNumber("taLegAngleP1"),
      legAngleP2: getNumber("taLegAngleP2"),
      legAngleP3: getNumber("taLegAngleP3"),
      legAngleP4: getNumber("taLegAngleP4"),
      turnAngleP1: getNumber("taTurnAngleP1"),
      turnAngleP2: getNumber("taTurnAngleP2"),
      turnAngleP3: getNumber("taTurnAngleP3"),
      turnAngleP4: getNumber("taTurnAngleP4"),
      durationInTurnPosition: getNumber("taDurationInTurnPosition"),
      durationInFlatPosition: getNumber("taDurationInFlatPosition"),
      durationAlternating: getNumber("taDurationAlternating"),
    };
  };

  api.init = function (config) {
    const send = typeof config.send === "function" ? config.send : () => {};
    const connectButtonId = config.connectButtonId;
    const connectContainerId = config.connectContainerId;
    const hasAllBeds = !!config.hasAllBeds;
    const allbedsButtonId = config.allbedsButtonId || "allbedsButton";
    const allbedsContainerId = config.allbedsContainerId || "allbedsContainer";

    const containers = {
      connect: byId(connectContainerId),
      background: byId("backgroundContainer"),
      bed: byId("bedContainer"),
      airmattress: byId("airmattressContainer"),
      pressuremap: byId("pressuremapContainer"),
      setting: byId("settingContainer"),
      allbeds: hasAllBeds ? byId(allbedsContainerId) : null,
      userInfo: byId("userInformationContainer"),
      smartbedControl: byId("smartbedControlContainer"),
    };
    api._ctx = { containers, nav: { connectButtonId, hasAllBeds, allbedsButtonId } };

    const icons = {
      bed: byId("bedIcon"),
      airmattress: byId("airmattressIcon"),
      pressuremap: byId("pressuremapIcon"),
      setting: byId("settingIcon"),
    };
    api._ctx.icons = icons;
    const iconOrder = [
      { el: icons.setting },
      { el: icons.pressuremap },
      { el: icons.airmattress },
      { el: icons.bed },
    ].filter((d) => d.el);
    iconOrder.sort((a, b) => parseFloat(window.getComputedStyle(a.el).right) - parseFloat(window.getComputedStyle(b.el).right));
    const iconSlots = iconOrder
      .map((d) => window.getComputedStyle(d.el).right)
      .filter(Boolean)
      .filter((v, idx, arr) => arr.indexOf(v) === idx)
      .sort((a, b) => parseFloat(a) - parseFloat(b));
    api._ctx.iconOrder = iconOrder;
    api._ctx.iconSlots = iconSlots;

    api.applyWorkflowMode(api.getWorkflowMode());

    const tabIds = [
      connectButtonId,
      hasAllBeds ? allbedsButtonId : null,
      "bedButton",
      "airmattressButton",
      "pressuremapButton",
      "settingButton",
    ].filter(Boolean);

    const setActiveTab = (activeId) => {
      tabIds.forEach((id) => {
        document.querySelectorAll(`[id="${id}"]`).forEach((el) => el.classList.remove("w3-white"));
      });
      document.querySelectorAll(`[id="${activeId}"]`).forEach((el) => el.classList.add("w3-white"));
    };

    const stopPvsTimer = () => {
      if (window.timerPVS) clearInterval(window.timerPVS);
      window.timerPVS = null;
    };

    const startPvsTimer = () => {
      stopPvsTimer();
      window.timerPVS = setInterval(() => {
        try {
          send("#RP&VS");
        } catch (_) {}
      }, 2000);
    };

    const hideAllMainScreens = () => {
      setDisplay(containers.connect, "none");
      setDisplay(containers.background, "none");
      setDisplay(containers.bed, "none");
      setDisplay(containers.airmattress, "none");
      setDisplay(containers.pressuremap, "none");
      setDisplay(containers.setting, "none");
      if (hasAllBeds) setDisplay(containers.allbeds, "none");
    };

    window.button_click = function (clicked) {
      const mode = api.getWorkflowMode();
      const requested = byId(clicked);
      if (!isAllowedInMode(requested, mode)) {
        const candidates = ["airmattressButton", "pressuremapButton", "settingButton", "bedButton", connectButtonId];
        for (const id of candidates) {
          const el = byId(id);
          if (isAllowedInMode(el, mode)) {
            clicked = id;
            break;
          }
        }
      }

      setDisplay(containers.userInfo, "none");
      setDisplay(containers.smartbedControl, "none");

      if (clicked === connectButtonId) {
        stopPvsTimer();
        hideAllMainScreens();
        setDisplay(containers.connect, "block");
        setDisplay(containers.background, "none");
        setActiveTab(connectButtonId);
        setSelected(icons.bed, false);
        setSelected(icons.airmattress, false);
        setSelected(icons.pressuremap, false);
        setSelected(icons.setting, false);
        // try {
        //   send("#SCREEN0");
        // } catch (_) {}
        return;
      }

      if (hasAllBeds && clicked === allbedsButtonId) {
        stopPvsTimer();
        hideAllMainScreens();
        setDisplay(containers.allbeds, "block");
        setActiveTab(allbedsButtonId);
        setSelected(icons.bed, false);
        setSelected(icons.airmattress, false);
        setSelected(icons.pressuremap, false);
        setSelected(icons.setting, false);
        return;
      }

      if (clicked === "bedButton" || clicked === "bedIcon") {
        stopPvsTimer();
        hideAllMainScreens();
        setDisplay(containers.background, "block");
        setDisplay(containers.bed, "block");
        setActiveTab("bedButton");
        setSelected(icons.bed, true);
        setSelected(icons.airmattress, false);
        setSelected(icons.pressuremap, false);
        setSelected(icons.setting, false);
        try {
          send("#SCREEN2");
        } catch (_) {}
        return;
      }

      if (clicked === "airmattressButton" || clicked === "airmattressIcon") {
        hideAllMainScreens();
        setDisplay(containers.background, "block");
        setDisplay(containers.airmattress, "block");
        setActiveTab("airmattressButton");
        setSelected(icons.bed, false);
        setSelected(icons.airmattress, true);
        setSelected(icons.pressuremap, false);
        setSelected(icons.setting, false);
        startPvsTimer();
        try {
          send("#SCREEN1");
        } catch (_) {}
        return;
      }

      if (clicked === "pressuremapButton" || clicked === "pressuremapIcon") {
        stopPvsTimer();
        hideAllMainScreens();
        setDisplay(containers.background, "block");
        setDisplay(containers.pressuremap, "block");
        setActiveTab("pressuremapButton");
        setSelected(icons.bed, false);
        setSelected(icons.airmattress, false);
        setSelected(icons.pressuremap, true);
        setSelected(icons.setting, false);

        const ctx = window.ctx;
        if (ctx && typeof ctx.fillRect === "function") {
          ctx.fillStyle = "grey";
          ctx.fillRect(0, 0, 672, 280);
        }

        const useAccumulated = !!window.isAccumulatedPressureChecked;
        try {
          send(useAccumulated ? "#SCREEN4" : "#SCREEN3");
        } catch (_) {}
        return;
      }

      if (clicked === "settingButton" || clicked === "settingIcon") {
        stopPvsTimer();
        hideAllMainScreens();
        setDisplay(containers.background, "block");
        setDisplay(containers.setting, "block");
        setActiveTab("settingButton");
        setSelected(icons.bed, false);
        setSelected(icons.airmattress, false);
        setSelected(icons.pressuremap, false);
        setSelected(icons.setting, true);
        try {
          send("#SCREEN5");
        } catch (_) {}
      }
    };
  };

  window.SmartbedUICommon = api;
})();
