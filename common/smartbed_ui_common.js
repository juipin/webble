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

  const setDisplay = (el, value) => {
    if (el) el.style.display = value;
  };

  const setSelected = (el, selected) => {
    if (!el) return;
    if (selected) el.classList.add("selected");
    else el.classList.remove("selected");
  };

  const api = {};

  const ensureInit = () => api._ctx;

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
    setDisplay(ctx.containers.setting, "block");
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

    setText("lblBradenScore", fields.bradenScore);
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
    api._ctx = { containers };

    const icons = {
      bed: byId("bedIcon"),
      airmattress: byId("airmattressIcon"),
      pressuremap: byId("pressuremapIcon"),
      setting: byId("settingIcon"),
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
      setDisplay(containers.userInfo, "none");
      setDisplay(containers.smartbedControl, "none");

      if (clicked === connectButtonId) {
        stopPvsTimer();
        hideAllMainScreens();
        setDisplay(containers.connect, "block");
        setDisplay(containers.background, "none");
        try {
          send("#SCREEN0");
        } catch (_) {}
        return;
      }

      if (hasAllBeds && clicked === allbedsButtonId) {
        stopPvsTimer();
        hideAllMainScreens();
        setDisplay(containers.allbeds, "block");
        return;
      }

      if (clicked === "bedButton" || clicked === "bedIcon") {
        stopPvsTimer();
        hideAllMainScreens();
        setDisplay(containers.background, "block");
        setDisplay(containers.bed, "block");
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
