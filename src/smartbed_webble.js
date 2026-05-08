'use strict';  // Define JavaScript code should be executed in "strict mode"
// Global variables
let container;
let longPressTimeout;
let isLongPress = false;
let leftAngle_last = 0;
let leftAngle_current = 0;
let rightAngle_last = 0;
let rightAngle_current = 0;
let backAngle_current = 0;
let legAngle_current = 0;
const numCols = 48;
const numRows = 20;
const pixelScaleX = 14;
const pixelScaleY = 14;
const totalPixelCount = numCols * numRows;
let pixelCount;
const pixelsPerPackage = 120; // 6 columns of 20 rows
let pmap_packageNumber;
let psm_data;
let executionMode = 0; // mode_mixed or Smart Mode
let executionModeText = "Smart Mode";
let timerPVS;
let transmitCharacteristicFound;
let mamActive = false;
let reportedModeIndex = 0;
let manualSelectedMode = null;
let bleWriteChain = Promise.resolve();
const PRESSURE_SCAN_SWEEP_IDS = [
  "panelA1","panelA2","panelA3","panelA4","panelA5","panelA6","panelA7",
  "panelB1","panelB2","panelB3","panelB4","panelB5","panelB6","panelB7",
  "panelC1","panelC2","panelC3","panelC4","panelC5","panelC6","panelC7"
];
const PRESSURE_SCAN_SWEEP_INTERVAL_MS = 250;
const PRESSURE_SCAN_EXPECTED_MIN_MS = PRESSURE_SCAN_SWEEP_IDS.length * PRESSURE_SCAN_SWEEP_INTERVAL_MS;
const PSCAN_RESULT_HOLD_MS = 5000;
const PROBE_RESULT_HOLD_MS = 5000;
let pressureScanActive = false;
let pressureScanSweepTimer = null;
let pressureScanSweepIndex = -1;
let pressureScanStartedAt = 0;
let pressureScanResetTimer = null;
let pressureScanPollTimer = null;
let pressureBannerTimer = null;
let lastPressureSnapshotKey = "";
let pressureScanPendingPressures = null;
let pressureScanAwaitFinalFrame = false;
let pressureScanLockUntil = 0;
let pressureScanLockManual = false;
let probePollTimer = null;
let probeUiActive = false;
let probeAwaitFinalFrame = false;
let probeLockUntil = 0;
let probeLockManual = false;

// Using ArrayBuffer with TypedArray instead of normal array as it uses contiguous memory space, allow direct memory manipulation, faster calculation, and conserve space
const buffer1 = new ArrayBuffer(960);
let rawImageGreyPixelArray = new Uint8Array(buffer1);
let imageGreyPixelArray = rawImageGreyPixelArray;
const bufferPmapSmart = new ArrayBuffer(960);
let smartImageGreyPixelArray = new Uint8Array(bufferPmapSmart);
const buffer2 = new ArrayBuffer(121);
let dataArray = new Uint8Array(buffer2);
const buffer3 = new ArrayBuffer(16);
let bedStatusArray = new Uint8Array(buffer3); //0: not exist or not turned on, 1: exists with ESPNOW but not ACTIVELY shown on Nursing Station (only top-level status), 2: exists and screens ACTIVELY shown on NS
bedStatusArray.fill(0);

let cells;
let bResetToDefaults = false;
//let bMeasureBody = false;
let bModeChanged = false;
let bScreenChanged = false;
let bAlert = false;
let bToStopAlert = false;
let bUserInfoChanged = false;
let bPressureReleaseSettingChanged = false;
let bSetPressureReleaseSettingDefault = false;
let bDefaultPRSNotYetModified = false;
let bNotToTurn = false;
let bNotToTurnRight = false;
let bNotToTurnLeft = false;
let bNotToMoveBack = false;
let bNotToMoveLeg = false;
let bCaregiverAlert = true;
let bFaultAlert = true;

let bNoPillowMassage = false;
let bNoCooling = false;
let bRedistPlusAlter = true;

let AUTOTURN_INTERVAL = 30;
let NUMBER_OF_TURNS = 2;
let SIDEBAG_FILL_INTERVAL = 15;
let LEG_AIRBAG_INTERVAL = 30;
let POSTURE_CHECK_INTERVAL = 120;
let HOLD_TIME_TO_COOL_VALVES = 1;

let PRESSURE_FIRM = 42;
let PRESSURE_SITTING = PRESSURE_FIRM + 10;
let PRESSURE_RELEASED = 16;
let PRESSURE_MAX = 80;
let PRESSURE_HYSTERESIS = 1;

let MIN_MATTRESS_TEMP_C = 25;
let MAX_MATTRESS_TEMP_C = 30;
let MAX_MATTRESS_RH = 85;
let DELTA_TEMPERATURE_C = 2;
let HEATSINK_MAX_TEMP_C = 65;

let weight = 60;
let setStaticPressure = 32;
let setAutofirmPressure = PRESSURE_FIRM;
let setDurationAlternating = 5;
let setDurationRedistribute = 30;
let setDurationAutoturn= AUTOTURN_INTERVAL;
let setDurationMixed = 30;
let setAutoTurnAngle = 15;
let operatingModeSelected = 0;
let minuteToNextRedistribute = setDurationRedistribute;
let minuteToNextAlternating = setDurationAlternating;
let minuteToNextAutoturn = setDurationAutoturn;
let minuteToNextMixedModeAction = setDurationMixed;
let percentPressurePoints = 40;
let midBodyWidth = 7;
let midBodyHeight = 12;
let columnsEyeToHip = 19;
let columnsEyeToHeel = 40;
let degreeHipToThighs = 35;

let nBigSpontaneousMovements = 0;
let nSmallSpontaneousMovements = 0;

const BSIGNORE = 0;
const BSL = 1;
const BSM = 2;
const BSH = 3;
const BSUSED = 4;
const PERIOD0 = 0;
const PERIOD1 = 1;
const PERIOD2 = 2;
const PERIOD3 = 3;
const PERIOD4 = 4;
const minStepAngle = 3;
let prsStepAngle = [
  [9, 9, 9, 9, 9], // step angle should also be modified with valueShear*minStepAngle
  [3, 3, 3, 3, 3],
  [6, 6, 6, 6, 6],
  [9, 9, 9, 9, 9],
  [9, 9, 9, 9, 9]
];

let prsLegAngle = [
  [30, 25, 30, 40, 30],
  [30, 25, 30, 40, 30],
  [30, 25, 30, 40, 30],
  [30, 25, 30, 40, 30],
  [30, 25, 30, 40, 30]
];

let prsBackAngle = [
  [10, 5, 10, 25, 10],
  [10, 5, 10, 25, 10],
  [10, 5, 10, 25, 10],
  [10, 5, 10, 25, 10],
  [10, 5, 10, 25, 10]
];

const minTurnAngle = 10;
let prsTurnAngle = [
  [setAutoTurnAngle, setAutoTurnAngle, setAutoTurnAngle, setAutoTurnAngle, setAutoTurnAngle],
  [15, 15, 15, 15, 15], //PERIOD3 will be modified to valueShear*minTurnAngle
  [15, 15, 15, 20, 15],
  [15, 15, 15, 30, 15],
  [15, 15, 15, 30, 15]
];

let prsDuration = [  //preDuration[braden_scale][periodN], note: [row][column]
  [setDurationMixed, setDurationMixed, setDurationMixed, setDurationMixed, setDurationMixed], // BSIGNORE used for default values
  // {4, 4, 4, 4, 4}, // BSIGNORE used for quick test
  [20, 20, 20, 20, 20], //BSL
  [30, 30, 30, 30, 30], //BSM
  [45, 45, 45, 45, 45], //BSH
  [45, 45, 45, 45, 45]  //BSUSED
];

let prsDurationInTurnPosition = [
  [6, 6, 6, 6, 6],
  [6, 6, 6, 6, 6],
  [6, 6, 6, 6, 6],
  [6, 6, 6, 6, 6],
  [6, 6, 6, 6, 6]
];

let prsDurationInFlatPosition = [
  //{setDurationAutoturn, setDurationAutoturn, setDurationAutoturn, setDurationAutoturn, setDurationAutoturn},
  [20, 20, 20, 20, 20],
  [20, 20, 20, 20, 20],
  [20, 20, 20, 20, 20],
  [20, 20, 20, 20, 20],
  [20, 20, 20, 20, 20]
];

let prsDurationAlternating = [
  //{setDurationAlternating, setDurationAlternating, setDurationAlternating, setDurationAlternating, setDurationAlternating},
  [3, 3, 3, 3, 3],
  [5, 5, 5, 5, 5],
  [5, 5, 5, 5, 5],
  [10, 10, 10, 10, 10],
  [10, 10, 10, 10, 10]
];

let indexSex = 0;
let iWeight = 0;
let iAge = 0;
let iHeight = 0;
let iEyeToHip = 0;
let iDurationP1 = prsDuration[BSUSED][1];
let iDurationP2 = prsDuration[BSUSED][2];
let iDurationP3 = prsDuration[BSUSED][3];
let iDurationP4 = prsDuration[BSUSED][4];
let iBackAngleP1 = prsBackAngle[BSUSED][1];
let iBackAngleP2 = prsBackAngle[BSUSED][2];
let iBackAngleP3 = prsBackAngle[BSUSED][3];
let iBackAngleP4 = prsBackAngle[BSUSED][4];
let iLegAngleP1 = prsLegAngle[BSUSED][1];
let iLegAngleP2 = prsLegAngle[BSUSED][2];
let iLegAngleP3 = prsLegAngle[BSUSED][3];
let iLegAngleP4 = prsLegAngle[BSUSED][4];
let iTurnAngleP1 = prsTurnAngle[BSUSED][1];
let iTurnAngleP2 = prsTurnAngle[BSUSED][2];
let iTurnAngleP3 = prsTurnAngle[BSUSED][3];
let iTurnAngleP4 = prsTurnAngle[BSUSED][4];
let iStepAngle = prsStepAngle[BSUSED][1];
let iDurationInTurnPosition = prsDurationInTurnPosition[BSUSED][1];
let iDurationInFlatPosition = prsDurationInFlatPosition[BSUSED][1];
let iDurationAlternating = prsDurationAlternating[BSUSED][1];
let fBMI = 0.00;
let valueSensory = 4;
let valueMoisture = 4;
let valueActivity = 4;
let valueMobility = 4;
let valueNutrition = 4;
let valueShear = 3;
let iBradenScore = 23;
let iBradenScoreIndex = BSUSED;
let iBradenScorePrevious = 23;
let valueShearPrevious = 3;

// alert messages
const textMessage = [
  "The bedsheet is wet.\nAttention is needed.", // 0
  "The battery level is low.\nPlease charge the battery.", // 1
  "The bedsheet is wet. The battery level is also low.\nAttention is needed.", // 2
  "Patient is sitting on the edge of the bed,\n and may attempt to stand up.", // 3
  "Valves are too hot!\nPump is stopped and all valves are turned off.\nPlease call the technician.", // 4
  "Air Pressure is too high!\nPump is stopped and all valves are turned off.\nPlease call the technician.", // 5
  "Auto pressure release is not effective! Please turn patient manually.", // 6
  "Unexpectedly large air leakage has occurred.\nAll valves and pump are turned off.\nPlease call the technician.", // 7
  "Last action was not properly executed.", // 8
  "Subsystems are not able to communicate with each other.\nSystem reset was attempted, but the problem remains.\nPlease call the technician.", // 9
  "Caregiver's help is needed.", // 10
  "Caregiver's urgent attention is required." // 11
]
const textMessageShort = [ // for the top-level alert message
  "Wet bedsheet", // 0
  "Low battery on urine detector", // 1
  "Wet bedsheet & low battery", // 2
  "Sitting on bed edge", // 3
  "Hot valves", // 4
  "High air pressure", // 5
  "Pressure relief not adequate", // 6
  "Air leakage", // 7
  "Improper execution", // 8
  "Subsystems not communicating", // 9
  "Need help", // 10
  "Need urgent help" // 11
]
// Voices
const synth = window.speechSynthesis;
let voices = synth.getVoices();
voices = synth.getVoices();

// Page icons click event

// Hide all elements with the setVisibility class
document.querySelectorAll('.setVisibility').forEach((el) => {
  el.style.visibility = 'hidden';
});

// DOM Elements
// Pages
const backgroundContainer = document.getElementById("backgroundContainer");
const airmattressContainer = document.getElementById("airmattressContainer");
const pressuremapContainer = document.getElementById("pressuremapContainer");
const settingContainer = document.getElementById("settingContainer");
const allbedsContainer = document.getElementById("allbedsContainer");
const bedContainer = document.getElementById("bedContainer");
const extraSettingsContainer = document.getElementById("extraSettingsContainer");
const userInformationContainer = document.getElementById("userInformationContainer");
const smartbedControlContainer = document.getElementById("smartbedControlContainer");
// Summary Views
const bedRadioGroup = document.getElementsByName("bedRadioGroup");
const table = document.getElementById('topLevelTable');
const summaryRows = table ? table.getElementsByTagName('tr') : null;
if (table) {
  Array.from(summaryRows).forEach((row) => {
    row.addEventListener('click', () => {
      const cells = row.getElementsByTagName('td');
      if (cells.length > 7) cells[7].textContent = "";
    });
  });
}
function setSummaryCell(rowIndex, cellIndex, value) {
  if (!summaryRows) return;
  const rowNum = Number(rowIndex);
  if (!Number.isFinite(rowNum) || rowNum < 0 || rowNum >= summaryRows.length) return;
  const row = summaryRows[rowNum];
  if (!row || !row.cells || cellIndex < 0 || cellIndex >= row.cells.length) return;
  row.cells[cellIndex].textContent = value;
}
// Background
const modeSelect = document.getElementById('modeSelect');
// BLE Connect
const connectButton = document.getElementById('connectBleButton');
const disconnectButton = document.getElementById('disconnectBleButton');
const bleStateContainer = document.getElementById('bleState');
const retrievedValue = document.getElementById('valueContainer');
const latestValueSent = document.getElementById('valueSent');
const timestampContainer = document.querySelector('.timestamp') || document.getElementById('timestamp');
function setTimestampNow() {
  const d = new Date();
  const s = d.getHours() + ":" + ((d.getMinutes() < 10) ? "0" : "") + d.getMinutes();
  const nodes = document.querySelectorAll('.timestamp');
  nodes.forEach(n => { n.innerHTML = s; });
}
function updatePressureBannerVisibility() {
  const msg = document.getElementById('pressureReleaseActionMsg');
  if (!msg) return;
  const am = document.getElementById("airmattressContainer");
  const pm = document.getElementById("pressuremapContainer");
  const bed = document.getElementById("bedContainer");
  const setting = document.getElementById("settingContainer");
  const showOn = (el) => !!el && el.style.display === "block";
  const visible = showOn(am) || showOn(pm) || showOn(bed);
  msg.style.visibility = visible && msg.innerHTML ? 'visible' : 'hidden';
}

function setPressureBanner(text) {
  const msg = document.getElementById("pressureReleaseActionMsg");
  if (!msg) return;
  msg.innerHTML = text || "";
  updatePressureBannerVisibility();
}

function clearPressureBannerTimer() {
  if (pressureBannerTimer) {
    window.clearTimeout(pressureBannerTimer);
    pressureBannerTimer = null;
  }
}

function showTransientPressureBanner(text, delayMs = 3500) {
  clearPressureBannerTimer();
  setPressureBanner(text);
  if (delayMs > 0) {
    pressureBannerTimer = window.setTimeout(() => {
      pressureBannerTimer = null;
      updateSharedStatusBanner();
    }, delayMs);
  }
}

function getModeStatusText(modeIndex) {
  switch (Number(modeIndex)) {
    case 1: return "Redistribution";
    case 2: return "Alternating";
    case 3: return "Auto turn";
    case 4: return "Static";
    case 5: return "Autofirm";
    case 6: return "Manual";
    default: return "Smart mode";
  }
}

function getCountdownLabel(msgCode) {
  if (Number(msgCode) === 1) return "Redistribute in";
  if (Number(msgCode) === 2) return "Alternating in";
  if (Number(msgCode) === 3) return "Auto turn in";
  return "Pressure relief in";
}

function isPressureReliefMode(modeIndex) {
  const mode = Number(modeIndex);
  return mode === 1 || mode === 2 || mode === 3;
}

function getManualCountdownState() {
  const mprState = window.__MPR_STATE__;
  const mode = Number(manualSelectedMode);
  if (!mprState || !isPressureReliefMode(mode)) return null;
  const msgCode = Number(mprState.nMsg);
  if (mode === 2) return (msgCode === 1 || msgCode === 2) ? mprState : null;
  if (mode === 1) return msgCode === 1 ? mprState : null;
  if (mode === 3) return msgCode === 3 ? mprState : null;
  return null;
}

function getModeFallbackMinutes(modeIndex) {
  switch (Number(modeIndex)) {
    case 1: return Number(minuteToNextRedistribute || setDurationRedistribute || 0);
    case 2: return Number(minuteToNextAlternating || setDurationAlternating || 0);
    case 3: return Number(minuteToNextAutoturn || setDurationAutoturn || 0);
    default: return Number(minuteToNextMixedModeAction || setDurationMixed || 0);
  }
}

function getRemainingMprMinutes() {
  const s = window.__MPR_STATE__;
  if (!s) return null;
  const elapsedMin = Math.floor((Date.now() - s.t0) / 60000);
  let base = Number(s.minute || 0);
  if (base === 0) {
    const modeHint = Number(s.nMsg || reportedModeIndex || executionMode);
    base = getModeFallbackMinutes(modeHint);
  }
  return Math.max(0, base - elapsedMin);
}

function updateSharedStatusBanner() {
  if (lblAutoTurn) {
    lblAutoTurn.innerHTML = "";
    lblAutoTurn.style.visibility = "hidden";
  }
  const remaining = getRemainingMprMinutes();
  const mprState = window.__MPR_STATE__;
  if (mamActive) {
    if (probeUiActive) {
      setPressureBanner("Manual: probe running");
      return;
    }
    if (manualSelectedMode !== null && Number(manualSelectedMode) !== 6) {
      const manualCountdownState = getManualCountdownState();
      if (remaining !== null && manualCountdownState) {
        setPressureBanner(getCountdownLabel(manualCountdownState.nMsg) + " " + String(remaining) + " minutes");
        return;
      }
      setPressureBanner("Manual: " + getModeStatusText(manualSelectedMode) + " active");
    } else {
      setPressureBanner("Manual: waiting for action");
    }
    return;
  }
  if (remaining !== null && mprState && Number(reportedModeIndex) !== 4 && Number(reportedModeIndex) !== 5) {
    setPressureBanner(getCountdownLabel(mprState.nMsg) + " " + String(remaining) + " minutes");
    return;
  }
  if (executionModeText === "Redistribution") setPressureBanner("Redistribute in " + getModeFallbackMinutes(1) + " minutes");
  else if (executionModeText === "Alternating") setPressureBanner("Alternating in " + getModeFallbackMinutes(2) + " minutes");
  else if (executionModeText === "Smart Mode") setPressureBanner("Pressure relief in " + getModeFallbackMinutes(0) + " minutes");
  else if (executionModeText === "Autoturn") setPressureBanner("Auto turn in " + getModeFallbackMinutes(3) + " minutes");
  else setPressureBanner("");
}

function updateExecutionModeSelection(modeIndex) {
  const idx = Number(modeIndex);
  if (!modeSelect || !Number.isFinite(idx) || idx < 0 || idx >= modeSelect.options.length) return;
  modeSelect.selectedIndex = idx;
  executionMode = idx;
  executionModeText = modeSelect.options[idx].text;
}

function applyReportedModeToUi() {
  if (mamActive) {
    updateExecutionModeSelection(6);
    return;
  }
  updateExecutionModeSelection(reportedModeIndex);
}

function updateManualModeState(active) {
  mamActive = !!active;
  applyReportedModeToUi();
  updateSharedStatusBanner();
}

function updateModeFromDevice(modeIndex) {
  const idx = Number(modeIndex);
  if (!Number.isFinite(idx) || idx < 0) return;
  const prevManualSelected = manualSelectedMode;
  reportedModeIndex = idx;
  if (mamActive && idx !== 6) manualSelectedMode = idx;
  else if (idx === 6) manualSelectedMode = null;
  applyReportedModeToUi();
  if (mamActive && idx !== 6 && idx !== prevManualSelected) {
    showTransientPressureBanner("Manual: " + getModeStatusText(idx) + " active");
  }
  updateSharedStatusBanner();
}

function requestManualModeState() {
  return writeOnCharacteristic("*W-MAM").catch(() => {});
}

function getPressureScanStatusLabel() {
  return document.getElementById("lblPressureScanStatus");
}

function setPressureScanStatus(text, state) {
  const el = getPressureScanStatusLabel();
  if (!el) return;
  el.textContent = text;
  el.classList.remove("pressureScanActive", "pressureScanBusy", "pressureScanDone");
  if (state === "active") el.classList.add("pressureScanActive");
  else if (state === "busy") el.classList.add("pressureScanBusy");
  else if (state === "done") el.classList.add("pressureScanDone");
}

function clearPressureScanResetTimer() {
  if (pressureScanResetTimer) {
    window.clearTimeout(pressureScanResetTimer);
    pressureScanResetTimer = null;
  }
}

function clearPressureScanPollTimer() {
  if (pressureScanPollTimer) {
    window.clearInterval(pressureScanPollTimer);
    pressureScanPollTimer = null;
  }
}

function isAirmattressVisible() {
  const el = document.getElementById("airmattressContainer");
  if (!el) return false;
  return window.getComputedStyle(el).display !== "none";
}

function startPressureScanPolling() {
  clearPressureScanPollTimer();
  pressureScanPollTimer = window.setInterval(() => {
    if (!pressureScanActive || !bleTransmitServer || !bleTransmitServer.connected) {
      clearPressureScanPollTimer();
      return;
    }
    if (!isAirmattressVisible()) return;
    writeOnCharacteristic("#RP&VS").catch(() => {});
  }, 700);
}

function clearProbePollTimer() {
  if (probePollTimer) {
    window.clearInterval(probePollTimer);
    probePollTimer = null;
  }
}

function startProbePolling() {
  clearProbePollTimer();
  probePollTimer = window.setInterval(() => {
    if (!probeUiActive || pressureScanActive || !bleTransmitServer || !bleTransmitServer.connected) {
      clearProbePollTimer();
      return;
    }
    if (!isAirmattressVisible()) return;
    writeOnCharacteristic("#RP&VS").catch(() => {});
  }, 350);
}

function clearPressureScanSweep() {
  if (pressureScanSweepTimer) {
    window.clearInterval(pressureScanSweepTimer);
    pressureScanSweepTimer = null;
  }
  PRESSURE_SCAN_SWEEP_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("pressureScanSweep");
  });
  pressureScanSweepIndex = -1;
}

function highlightPressureSweepCell(idx) {
  const next = Number(idx);
  if (!Number.isFinite(next) || next < 0 || next >= PRESSURE_SCAN_SWEEP_IDS.length) return;
  if (pressureScanSweepIndex === next) return;
  if (pressureScanSweepIndex >= 0) {
    const prevEl = document.getElementById(PRESSURE_SCAN_SWEEP_IDS[pressureScanSweepIndex]);
    if (prevEl) prevEl.classList.remove("pressureScanSweep");
  }
  pressureScanSweepIndex = next;
  const el = document.getElementById(PRESSURE_SCAN_SWEEP_IDS[pressureScanSweepIndex]);
  if (el) el.classList.add("pressureScanSweep");
}

function finishPressureScan(text, state, resetDelayMs) {
  pressureScanActive = false;
  pressureScanAwaitFinalFrame = false;
  clearPressureScanSweep();
  clearPressureScanResetTimer();
  clearPressureScanPollTimer();
  pressureScanPendingPressures = null;
  setPressureScanStatus(text, state);
  if (resetDelayMs > 0) {
    pressureScanResetTimer = window.setTimeout(() => {
      setPressureScanStatus("Scan: idle", "");
      pressureScanResetTimer = null;
    }, resetDelayMs);
  }
}

function startPressureScanSweep() {
  clearPressureScanSweep();
  clearPressureScanResetTimer();
  clearPressureScanPollTimer();
  pressureScanActive = true;
  pressureScanAwaitFinalFrame = false;
  pressureScanStartedAt = Date.now();
  lastPressureSnapshotKey = "";
  pressureScanPendingPressures = null;
  setPressureScanStatus("Scan: running", "active");
  highlightPressureSweepCell(0);
  startPressureScanPolling();
  pressureScanSweepTimer = window.setInterval(() => {
    if (!pressureScanActive) { clearPressureScanSweep(); return; }
    const next = pressureScanSweepIndex + 1;
    if (next >= PRESSURE_SCAN_SWEEP_IDS.length) {
      clearPressureScanSweep();
      setPressureScanStatus("Scan: finalizing", "busy");
      return;
    }
    highlightPressureSweepCell(next);
  }, PRESSURE_SCAN_SWEEP_INTERVAL_MS);

  pressureScanResetTimer = window.setTimeout(() => {
    if (!pressureScanActive) return;
    finishPressureScan("Scan: waiting device done", "busy", 5000);
  }, Math.max(4000, PRESSURE_SCAN_EXPECTED_MIN_MS + 1200));
}

function notePressureScanRequested() {
  clearPressureScanResetTimer();
  setPressureScanStatus("Scan: requesting...", "active");
}

function isPressureScanCommand(value) {
  const normalized = String(value || "").trim().toUpperCase();
  return normalized === "PSCAN" || normalized === "#PSCAN" || normalized === "*PSCAN" ||
         normalized === "PSCN" || normalized === "#PSCN";
}
// Bed
const btnLeftTurn = document.getElementById('btnLeftTurn');
const btnRightTurn = document.getElementById('btnRightTurn');
const btnBackUp = document.getElementById('btnBackUp');
const btnBackDown = document.getElementById('btnBackDown');
const btnLegUp = document.getElementById('btnLegUp');
const btnLegDown = document.getElementById('btnLegDown');
const btnAutoturnA = document.getElementById('btnAutoturnA');
const btnAutoturnB = document.getElementById('btnAutoturnB');
const btnResetPosition = document.getElementById('btnResetPosition');
const panelLegFlat = document.getElementById('panelLegFlat');
const panelLegSlope = document.getElementById('panelLegSlope');
const panelCentre = document.getElementById('panelCentre');
const panelBack = document.getElementById('panelBack');
const ledAction = document.getElementById('ledAction');
const lblAutoTurn = document.getElementById('lblAutoTurn');
const imgLeftTurn = document.getElementById('imgLeftTurn');
const imgRightTurn = document.getElementById('imgRightTurn');

// Air Mattress
const btnBagLegUp = document.getElementById('btnBagLegUp');
const btnBagLegDown = document.getElementById('btnBagLegDown');
const btnBagLegHold = document.getElementById('btnBagLegHold');
const btnBagTurnL = document.getElementById('btnBagTurnL');
const btnBagTurnR = document.getElementById('btnBagTurnR');
const btnBagTurnStop = document.getElementById('btnBagTurnStop');
let leftBagPressure = 0;
let rightBagPressure = 0;
let legBagPressure = 0;
let pillowBagPressure = 0;
let sideBagPressure = 0;

function triggerBagCommand(command) {
  if (!command) return;
  writeOnCharacteristic(command)
    .then(() => new Promise((resolve) => window.setTimeout(resolve, 120)))
    .then(() => writeOnCharacteristic("#RP&VS"))
    .catch(() => {});
}

function getTurnLeftCommand() {
  if (leftBagPressure < PRESSURE_RELEASED && rightBagPressure < PRESSURE_RELEASED) return "#INFR";
  if (rightBagPressure < PRESSURE_RELEASED && leftBagPressure >= PRESSURE_RELEASED) return "#TURNL";
  return "#TURNL";
}

function getTurnRightCommand() {
  if (leftBagPressure < PRESSURE_RELEASED && rightBagPressure < PRESSURE_RELEASED) return "#INFL";
  if (leftBagPressure < PRESSURE_RELEASED && rightBagPressure >= PRESSURE_RELEASED) return "#TURNR";
  return "#TURNR";
}

if (btnBagLegUp) btnBagLegUp.addEventListener('click', () => triggerBagCommand("#LG1"));
if (btnBagLegDown) btnBagLegDown.addEventListener('click', () => triggerBagCommand("#LG0"));
if (btnBagLegHold) btnBagLegHold.addEventListener('click', () => triggerBagCommand("#HLDG"));
if (btnBagTurnL) btnBagTurnL.addEventListener('click', () => triggerBagCommand(getTurnLeftCommand()));
if (btnBagTurnR) btnBagTurnR.addEventListener('click', () => triggerBagCommand(getTurnRightCommand()));
if (btnBagTurnStop) btnBagTurnStop.addEventListener('click', () => triggerBagCommand("#HOLDB"));

// Pressure Map
const maxProbabilityLabel = document.getElementById('maxProbabilityLabel');
const maxProbability = document.getElementById('maxProbability');
const pressureMapCanvas = document.getElementById('pressureMapCanvas');
const isPosturePressure = document.getElementById('isPosturePressure');
const pmapViewMode = document.getElementById('pmapViewMode');
let isPosturePressureChecked = !!(isPosturePressure && isPosturePressure.checked);

// Setting
let lblStaticPressure = document.getElementById("lblStaticPressure");
let lblDurationRedistribute = document.getElementById("lblDurationRedistribute");
let lblDurationAlternating = document.getElementById("lblDurationAlternating");
const ddSex = document.getElementById('ddSex');
const ddSensory = document.getElementById('ddSensory');
const ddMoisture = document.getElementById('ddMoisture');
const ddActivity = document.getElementById('ddActivity');
const ddMobility = document.getElementById('ddMobility');
const ddNutrition = document.getElementById('ddNutrition');
const ddShear = document.getElementById('ddShear');
const lblBradenScoreUser = document.getElementById('lblBradenScoreUser')
const lblBMI = document.getElementById("lblBMI");

// Define BLE Device Specs
const deviceName ='Smart Bed';
const bleService = 'cd5c1105-4448-7db8-ae4c-d1da8cba36bb';
const receiveCharacteristic = 'cd5c1106-4448-7db8-ae4c-d1da8cba36bb';
const bleTransmitService = 'cd5c1100-4448-7db8-ae4c-d1da8cba36bb';
const transmitCharacteristic = 'cd5c1101-4448-7db8-ae4c-d1da8cba36bb';

// Global Variables to Handle Bluetooth
var bleServer;
var bleTransmitServer;
var bleServiceFound;
var bleTransmitServiceFound;
var receiveCharacteristicFound;

// Connect Button (search for BLE Devices only if BLE is available)
connectButton.addEventListener('click', (event) => {
  if (isWebBluetoothEnabled()){
      connectToDevice();
  }

  // Get and display current time
  getAndDisplayTime();

});

// Disconnect Button
disconnectButton.addEventListener('click', disconnectDevice);


// Write to the ESP32 transmitCharacteristi
// Bed
if ('ontouchstart' in window) {
  // For touch devices
  // Do not use an extra click event as it will be triggered after the long press event
  // Use touchend event before long press has timed out as the click event
  btnLeftTurn.addEventListener('touchstart', () => {longPressTimeout = setTimeout(() => {writeOnCharacteristic("#LTB30"); isLongPress = true;}, 500)});
  btnLeftTurn.addEventListener('touchend', () => {clearTimeout(longPressTimeout); if (isLongPress) isLongPress = false; else writeOnCharacteristic("#LTS"); });
  btnRightTurn.addEventListener('touchstart', () => {longPressTimeout = setTimeout(() => {writeOnCharacteristic("#RTB30"); isLongPress = true;}, 500)});
  btnRightTurn.addEventListener('touchend', () => {clearTimeout(longPressTimeout); if (isLongPress) isLongPress = false; else rwiteOnCharacteristic("#RTS"); });
  btnBackUp.addEventListener('touchstart', () => {longPressTimeout = setTimeout(() => {writeOnCharacteristic("#BUB80"); isLongPress = true;}, 500)});
  btnBackUp.addEventListener('touchend', () => {clearTimeout(longPressTimeout); if (isLongPress) isLongPress = false; else writeOnCharacteristic("#BUS"); });
  btnBackDown.addEventListener('touchstart', () => {longPressTimeout = setTimeout(() => {writeOnCharacteristic("#BDB00"); isLongPress = true;}, 500)});
  btnBackDown.addEventListener('touchend', () => {clearTimeout(longPressTimeout); if (isLongPress) isLongPress = false; else writeOnCharacteristic("#BDS"); });
  btnLegUp.addEventListener('touchstart', () => {longPressTimeout = setTimeout(() => {if (legAngle_current >= 0) writeOnCharacteristic("#LUB45"); else writeOnCharacteristic("#LUB00"); isLongPress = true;}, 500)});
  btnLegUp.addEventListener('touchend', () => {clearTimeout(longPressTimeout); if (isLongPress) isLongPress = false; else writeOnCharacteristic("#LUS"); });
  btnLegDown.addEventListener('touchstart', () => {longPressTimeout = setTimeout(() => {if (legAngle_current > 0) writeOnCharacteristic("#LDB00"); else writeOnCharacteristic("#LDB80"); isLongPress = true;}, 500)});
  btnLegDown.addEventListener('touchend', () => {clearTimeout(longPressTimeout); if (isLongPress) isLongPress = false; else writeOnCharacteristic("#LDS"); });
  btnAutoturnA.addEventListener('touchstart', () => {longPressTimeout = setTimeout(() => {writeOnCharacteristic("#ATB20"); isLongPress = true;}, 500)});
  btnAutoturnA.addEventListener('touchend', () => {clearTimeout(longPressTimeout); if (isLongPress) isLongPress = false;});
  btnAutoturnB.addEventListener('touchstart', () => {longPressTimeout = setTimeout(() => {writeOnCharacteristic("#ATB45"); isLongPress = true;}, 500)});
  btnAutoturnB.addEventListener('touchend', () => {clearTimeout(longPressTimeout); if (isLongPress) isLongPress = false;});
  btnResetPosition.addEventListener('touchstart', () => {longPressTimeout = setTimeout(() => {writeOnCharacteristic("#RSB"); isLongPress = true;}, 500)});
  btnResetPosition.addEventListener('touchend', () => {clearTimeout(longPressTimeout); if (isLongPress) isLongPress = false; else writeOnCharacteristic("#RSB"); });
} else {
  // For desktop devices
  btnLeftTurn.addEventListener('mousedown', () => {longPressTimeout = setTimeout(() => {writeOnCharacteristic("#LTB30"); isLongPress = true;}, 500)});
  btnLeftTurn.addEventListener('mouseup', () => {clearTimeout(longPressTimeout); if (isLongPress) isLongPress = false; else writeOnCharacteristic("#LTS"); });
  btnRightTurn.addEventListener('mousedown', () => {longPressTimeout = setTimeout(() => {writeOnCharacteristic("#RTB30"); isLongPress = true;}, 500)});
  btnRightTurn.addEventListener('mouseup', () => {clearTimeout(longPressTimeout); if (isLongPress) isLongPress = false; else writeOnCharacteristic("#RTS"); });
  btnBackUp.addEventListener('mousedown', () => {longPressTimeout = setTimeout(() => {writeOnCharacteristic("#BUB80"); isLongPress = true;}, 500)});
  btnBackUp.addEventListener('mouseup', () => {clearTimeout(longPressTimeout); if (isLongPress) isLongPress = false; else writeOnCharacteristic("#BUS"); });
  btnBackDown.addEventListener('mousedown', () => {longPressTimeout = setTimeout(() => {writeOnCharacteristic("#BDB00"); isLongPress = true;}, 500)});
  btnBackDown.addEventListener('mouseup', () => {clearTimeout(longPressTimeout); if (isLongPress) isLongPress = false; else writeOnCharacteristic("#BDS"); });
  btnLegUp.addEventListener('mousedown', () => {longPressTimeout = setTimeout(() => {if (legAngle_current >= 0) writeOnCharacteristic("#LUB45"); else writeOnCharacteristic("#LUB00"); isLongPress = true;}, 500)});
  btnLegUp.addEventListener('mouseup', () => {clearTimeout(longPressTimeout); if (isLongPress) isLongPress = false; else writeOnCharacteristic("#LUS"); });
  btnLegDown.addEventListener('mousedown', () => {longPressTimeout = setTimeout(() => {if (legAngle_current > 0) writeOnCharacteristic("#LDB00"); else writeOnCharacteristic("#LDB80"); isLongPress = true;}, 500)});
  btnLegDown.addEventListener('mouseup', () => {clearTimeout(longPressTimeout); if (isLongPress) isLongPress = false; else writeOnCharacteristic("#LDS"); });
  btnAutoturnA.addEventListener('mousedown', () => {longPressTimeout = setTimeout(() => {writeOnCharacteristic("#ATB20"); isLongPress = true;}, 500)});
  btnAutoturnA.addEventListener('mouseup', () => {clearTimeout(longPressTimeout); if (isLongPress) isLongPress = false;});
  btnAutoturnB.addEventListener('mousedown', () => {longPressTimeout = setTimeout(() => {writeOnCharacteristic("#ATB45"); isLongPress = true;}, 500)});
  btnAutoturnB.addEventListener('mouseup', () => {clearTimeout(longPressTimeout); if (isLongPress) isLongPress = false;});
  btnResetPosition.addEventListener('mousedown', () => {longPressTimeout = setTimeout(() => {writeOnCharacteristic("#RSB"); isLongPress = true;}, 500)});
  btnResetPosition.addEventListener('mouseup', () => {clearTimeout(longPressTimeout); if (isLongPress) isLongPress = false; else writeOnCharacteristic("#RSB"); });
}

// Air Mattress
const channelColour = ['#FFFFFF', '#00FF00', '#FFA500'];
var ACellColourCode = [];
var BCellColourCode = [];
var CCellColourCode = [];
var DCellColourCode = [];

// Pressure Map
const posture = [
  "Unknown",
  "Supine",
  "Left",
  "Right",
  "Sit on Bed",
  "Sit on Left Edge",
  "Sit on Right Edge",
  "Unknown",
  "Sleep on Right Edge",
  "Sleep on Left Edge",
  "Prone"
];
const pressureMapBackground = "#2f343b";
const ctx = pressureMapCanvas.getContext("2d", { willReadFrequently: true });
ctx.fillStyle = pressureMapBackground;
ctx.fillRect(0, 0, 672, 280);

// Setting
let rangeStaticPressure = document.getElementById("rangeStaticPressure");
let rangeDurationRedistribute = document.getElementById("rangeDurationRedistribute");
let rangeDurationAlternating = document.getElementById("rangeDurationAlternating");
if (lblStaticPressure && rangeStaticPressure) lblStaticPressure.innerHTML = rangeStaticPressure.value;
if (lblDurationRedistribute && rangeDurationRedistribute) lblDurationRedistribute.innerHTML = rangeDurationRedistribute.value;
if (lblDurationAlternating && rangeDurationAlternating) lblDurationAlternating.innerHTML = rangeDurationAlternating.value;

// Setup Actions



/** Web BLE Functions */

// Check if BLE is available in your Browser
function isWebBluetoothEnabled() {
  if (!navigator.bluetooth) {
    console.log('Web Bluetooth API is not available in this browser!');
    bleStateContainer.innerHTML = "Web Bluetooth API is not available in this browser/device!";
    return false
  }
  console.log('Web Bluetooth API supported in this browser.');
  return true
}

// Connect to BLE Device and Enable Notifications
function connectToDevice(){
  console.log('Initializing Bluetooth...');
  navigator.bluetooth.requestDevice({
    filters: [{namePrefix: deviceName}],
    optionalServices: [bleService, bleTransmitService]
  })
  .then(device => {
    console.log('Device Selected:', device.name);
    bleStateContainer.innerHTML = 'Connected to device ' + device.name;
    bleStateContainer.style.color = "#24af37";
    device.addEventListener('gattservicedisconnected', onDisconnected);
    return device.gatt.connect();
  })
  .then(gattServer =>{
    bleServer = gattServer;
    bleTransmitServer = gattServer;
    console.log("Connected to GATT Server");
    return bleServer.getPrimaryService(bleService);
  })
  .then(service => {
    bleServiceFound = service;
    console.log("Service discovered:", service.uuid);
    return service.getCharacteristic(receiveCharacteristic);
  })
  .then(characteristic => {
    console.log("Characteristic discovered:", characteristic.uuid);
    receiveCharacteristicFound = characteristic;
    characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicChange);
    characteristic.startNotifications();
    console.log("Notifications Started.");
    window.__bleNotifStarted = Date.now();
    //return characteristic.readValue(); // on mobile, returns DOMException: GATT operation failed for unknown reason. Delete it for now since it only fetches the previously received data
  })
  .then(value => {
    // ignore all the following code because of the above bug, other than updating the timestamp
    // console.log("value: ", value);
    // console.log("value.byteLength: ", value.byteLength);
    // if (value.byteLength > 0) {
    //   console.log("Read value: ", value);
    //   const decodedValue = new TextDecoder().decode(value);
    //   console.log("Decoded value: ", decodedValue);
    //   retrievedValue.innerHTML = decodedValue;
      setTimestampNow();
    // }

    if (bleTransmitServer) {
      console.log("Connected to GATT Transmit Server");
      return bleTransmitServer.getPrimaryService(bleTransmitService);
    }
  })
  .then(service => {
    bleTransmitServiceFound = service;
    console.log("Transmit service discovered:", service.uuid);
    return service.getCharacteristic(transmitCharacteristic);
  })
  .then(characteristic => {
    console.log("Transmit characteristic discovered:", characteristic.uuid);
    transmitCharacteristicFound = characteristic;
    const scheduleMs = 5500;
    setTimeout(() => {
      if (bleTransmitServer && bleTransmitServer.connected && !window.__seenAllx) {
        writeOnCharacteristic("#RALLX")
          .then(() => new Promise(res => setTimeout(res, 600)))
          .then(() => writeOnCharacteristic("#RALL"))
          .then(() => new Promise(res => setTimeout(res, 600)))
          .then(() => writeOnCharacteristic("#RSETX"))
          .then(() => new Promise(res => setTimeout(res, 600)))
          .then(() => writeOnCharacteristic("#RSETS"))
          .then(() => new Promise(res => setTimeout(res, 600)))
          .then(() => requestManualModeState())
          .catch(err => console.log("Error in initial request chain:", err));
      } else {
        console.log("Initial request chain skipped: #ALLX already received");
      }
    }, scheduleMs);
  })
  .catch(error => {
    console.log('Error: ', error);
  })
}

function onDisconnected(event){
  console.log('Device Disconnected:', event.target.device.name);
  bleStateContainer.innerHTML = "Device disconnected";
  bleStateContainer.style.color = "#d13a30";

  connectToDevice();
}

function handleCharacteristicChange(event){
  const rawValue = event.target.value;
  let bytes = new Uint8Array(rawValue.buffer, rawValue.byteOffset, rawValue.byteLength);
 
  // Byte-buffer accumulator (robust to binary payloads and MTU fragmentation)
  if (!window.__rxBytes) window.__rxBytes = new Uint8Array(0);
  if (bytes.length > 0) {
    const merged = new Uint8Array(window.__rxBytes.length + bytes.length);
    merged.set(window.__rxBytes);
    merged.set(bytes, window.__rxBytes.length);
    window.__rxBytes = merged;
    if (window.__rxBytes.length > 8192) {
      window.__rxBytes = window.__rxBytes.slice(-4096);
    }
  }
 
  // Helper to decode ASCII from byte buffer
  const decodeAscii = (buf, start, len) => {
    let s = "";
    const end = Math.min(buf.length, start + len);
    for (let i = start; i < end; i++) s += String.fromCharCode(buf[i]);
    return s;
  };
  const isDigitByte = (b) => b >= 48 && b <= 57;
  const digitsOk = (start, len) => {
    if (window.__rxBytes.length < start + len) return false;
    for (let i = start; i < start + len; i++) {
      if (!isDigitByte(window.__rxBytes[i])) return false;
    }
    return true;
  };
  const knownHeaders = [
    "#PSMAP##", "#PZMAP##", "#PBMAP##", "#POSE###", "#POSE_P#", "#AIRM###", "#MAM###",
    "#REMS", "#TEXT", "#PRS", "#MALLOW", "#THRS", "#P&VS", "#SETS", "#SETX",
    "#ALL ", "#ALLX", "#BODY", "#MPR", "#BEDS###", "#ALERT", "#ACKA", "#ACKX",
    "#ACKR", "#PROBE", "#PRBDONE", "#PSCAN", "#PSBUSY", "#PSDONE", "#PSRES", "#MPZ####"
  ];
  const startsWithKnownHeaderAt = (idx) => knownHeaders.some((header) => {
    if (idx + header.length > window.__rxBytes.length) return false;
    return decodeAscii(window.__rxBytes, idx, header.length) === header;
  });
  const startsWithKnownHeaderPrefixAt = (idx) => knownHeaders.some((header) => {
    const available = window.__rxBytes.length - idx;
    if (available <= 0) return false;
    const testLen = Math.min(header.length, available);
    return decodeAscii(window.__rxBytes, idx, testLen) === header.substring(0, testLen);
  });
  const findNextKnownHeader = (startIdx = 0) => {
    for (let i = Math.max(0, startIdx); i < window.__rxBytes.length; i++) {
      if (window.__rxBytes[i] !== 35) continue;
      if (startsWithKnownHeaderAt(i) || startsWithKnownHeaderPrefixAt(i)) return i;
    }
    return -1;
  };
  const discardUntilKnownHeader = (reason, startIdx = 1) => {
    const nextKnownIdx = findNextKnownHeader(startIdx);
    if (nextKnownIdx <= 0) return false;
    const dropped = decodeAscii(window.__rxBytes, 0, nextKnownIdx);
    console.log("RX discarded fragment:", dropped, reason ? "(" + reason + ")" : "");
    window.__rxBytes = window.__rxBytes.slice(nextKnownIdx);
    return true;
  };
  const consumeAsciiFrame = (frameLen) => {
    const frame = decodeAscii(window.__rxBytes, 0, frameLen);
    if (frame.startsWith("#POSE###") || frame.startsWith("#POSE_P#") || frame.startsWith("#TEXT")) {
      console.log("RX ascii frame:", frame);
    }
    if (retrievedValue) retrievedValue.innerHTML = frame;
    setTimestampNow();
    processReceivedString(frame);
    window.__rxBytes = window.__rxBytes.slice(frameLen);
  };
 
  // Drop leading garbage until '#'
  const firstHashIdx = findNextKnownHeader(0);
  if (firstHashIdx > 0) {
    const dropped = decodeAscii(window.__rxBytes, 0, firstHashIdx);
    console.log("RX discarded fragment:", dropped, "(before known header)");
    window.__rxBytes = window.__rxBytes.slice(firstHashIdx);
  }
 
  // 1) Pressure map packets (#PSMAP## / #PZMAP## / #PBMAP##) - binary payload follows 8-byte header
  let processedBinary = false;
  while (window.__rxBytes.length >= 9) {
    const header8 = decodeAscii(window.__rxBytes, 0, 8);
    if (header8 === "#PSMAP##" || header8 === "#PZMAP##" || header8 === "#PBMAP##") {
      const need = 9 + pixelsPerPackage;
      if (window.__rxBytes.length < need) break;
      const colStart = window.__rxBytes[8] >>> 0;
      if (colStart === 0) {
        console.log("RX binary map:", header8);
      }
      setTimestampNow();
      const packageNumber = Math.floor(colStart / 6);
      pixelCount = packageNumber * pixelsPerPackage;
      const targetPixels = (header8 === "#PBMAP##") ? smartImageGreyPixelArray : rawImageGreyPixelArray;
      for (let i = 0; i < pixelsPerPackage; i++) {
        if ((pixelCount + i) >= totalPixelCount) break;
        targetPixels[pixelCount + i] = window.__rxBytes[9 + i];
      }
      container = document.getElementById("pressuremapContainer");
      if (pixelCount >= 840 && container.style.display == "block") {
        if (header8 === "#PSMAP##") window.lastRawMapKind = "PS";
        else if (header8 === "#PZMAP##") window.lastRawMapKind = "PZ";
        renderSelectedPressureMap();
      }
      window.__rxBytes = window.__rxBytes.slice(need);
      processedBinary = true;
      continue;
    }
    // If buffer doesn't start with a known header, drop until the next known header
    const hashIdx = findNextKnownHeader(0);
    if (hashIdx > 0) {
      const dropped = decodeAscii(window.__rxBytes, 0, hashIdx);
      console.log("RX discarded fragment:", dropped, "(before binary header)");
      window.__rxBytes = window.__rxBytes.slice(hashIdx);
      continue;
    }
    break;
  }
 
  // Parse ASCII frames directly from __rxBytes and slice them out
  while (window.__rxBytes.length >= 5 && window.__rxBytes[0] === 35) {
    if (window.__rxBytes.length >= 8) {
      const h8 = decodeAscii(window.__rxBytes, 0, 8);
      if (h8.startsWith("#MALLOW")) {
        const hexReady = window.__rxBytes.length >= 11;
        if (hexReady) {
          const c7 = window.__rxBytes[7], c8 = window.__rxBytes[8], c9 = window.__rxBytes[9], c10 = window.__rxBytes[10];
          const isHex = (x)=>(x>=48&&x<=57)||(x>=65&&x<=70)||(x>=97&&x<=102);
          if (isHex(c7)&&isHex(c8)&&isHex(c9)&&isHex(c10)) {
            const frame = decodeAscii(window.__rxBytes, 0, 11);
            if (retrievedValue) retrievedValue.innerHTML = frame;
            setTimestampNow();
            processReceivedString(frame);
            window.__rxBytes = window.__rxBytes.slice(11);
            continue;
          }
        }
        const nextIdxM = window.__rxBytes.indexOf(35, 1);
        if (nextIdxM > 0) {
          const frame = decodeAscii(window.__rxBytes, 0, nextIdxM);
          if (retrievedValue) retrievedValue.innerHTML = frame;
          setTimestampNow();
          processReceivedString(frame);
          window.__rxBytes = window.__rxBytes.slice(nextIdxM);
          continue;
        } else {
          if (window.__rxBytes.length >= 9 && window.__rxBytes.length <= 16) {
            const frame = decodeAscii(window.__rxBytes, 0, window.__rxBytes.length);
            if (retrievedValue) retrievedValue.innerHTML = frame;
            setTimestampNow();
            processReceivedString(frame);
            window.__rxBytes = new Uint8Array(0);
            continue;
          }
        }
      }
      if (h8 === "#PSMAP##" || h8 === "#PZMAP##" || h8 === "#PBMAP##") break;
      if (h8 === "#POSE###") {
        if (window.__rxBytes.length < 14) break;
        if (!digitsOk(8, 6)) {
          if (!discardUntilKnownHeader("bad #POSE digits")) break;
          continue;
        }
        if (window.__rxBytes.length >= 17 && digitsOk(14, 3)) {
          consumeAsciiFrame(17);
          continue;
        }
        if (window.__rxBytes.length === 14 || (window.__rxBytes.length > 14 && window.__rxBytes[14] === 35)) {
          consumeAsciiFrame(14);
          continue;
        }
        if (window.__rxBytes.length < 17) break;
      }
      if (h8 === "#POSE_P#") {
        if (window.__rxBytes.length < 14) break;
        if (!digitsOk(8, 6)) {
          if (!discardUntilKnownHeader("bad #POSE_P digits")) break;
          continue;
        }
        if (window.__rxBytes.length >= 20 && digitsOk(14, 6)) {
          consumeAsciiFrame(20);
          continue;
        }
        if (window.__rxBytes.length === 14 || (window.__rxBytes.length > 14 && window.__rxBytes[14] === 35)) {
          consumeAsciiFrame(14);
          continue;
        }
        if (window.__rxBytes.length < 20) break;
      }
      if (h8 === "#AIRM###") {
        if (window.__rxBytes.length < 14) break;
        consumeAsciiFrame(14);
        continue;
      }
      if (h8.startsWith("#MAM###")) {
        if (window.__rxBytes.length < 10) break;
        consumeAsciiFrame(10);
        continue;
      }
      if (h8.startsWith("#REMS")) {
        if (window.__rxBytes.length < 8) break;
        const lenStr = decodeAscii(window.__rxBytes, 5, 3);
        const len = Number(lenStr);
        const need = 8 + (isFinite(len) ? len * 3 : 0);
        if (window.__rxBytes.length < need) break;
        consumeAsciiFrame(need);
        window.__gotREMS = true;
        continue;
      }
      if (h8.startsWith("#TEXT")) {
        if (window.__rxBytes.length < 8) break;
        const lenStr = decodeAscii(window.__rxBytes, 5, 3);
        const len = Number(lenStr);
        const need = 8 + (isFinite(len) ? len * 3 : 0);
        if (window.__rxBytes.length < need) break;
        if (!digitsOk(8, len * 3)) {
          if (!discardUntilKnownHeader("bad #TEXT digits")) break;
          continue;
        }
        consumeAsciiFrame(need);
        continue;
      }
    }
    // Deterministic fixed-length parsing for common ASCII frames.
    const asciiHeader = decodeAscii(window.__rxBytes, 0, Math.min(8, window.__rxBytes.length));
    if (asciiHeader.startsWith("#ALLX")) {
      const fixedTriplets = 51; // 28 ALL + 22 SETX + 1 nameLen
      const fixedChars = 5 + fixedTriplets * 3;
      if (window.__rxBytes.length < fixedChars) break;
      if (!digitsOk(5, fixedTriplets * 3)) {
        if (!discardUntilKnownHeader("bad #ALLX header digits")) break;
        continue;
      }
      const nameLen = Number(decodeAscii(window.__rxBytes, 5 + 50 * 3, 3));
      if (!isFinite(nameLen) || nameLen < 0) {
        if (!discardUntilKnownHeader("bad #ALLX name length")) break;
        continue;
      }
      const totalTriplets = fixedTriplets + nameLen;
      const need = 5 + totalTriplets * 3;
      if (window.__rxBytes.length < need) break;
      if (!digitsOk(5, totalTriplets * 3)) {
        if (!discardUntilKnownHeader("bad #ALLX digits")) break;
        continue;
      }
      consumeAsciiFrame(need);
      window.__gotALLX = true;
      continue;
    }
    if (asciiHeader.startsWith("#ALL ")) {
      const need = 5 + 28 * 3;
      if (window.__rxBytes.length < need) break;
      if (!digitsOk(5, 28 * 3)) {
        if (!discardUntilKnownHeader("bad #ALL digits")) break;
        continue;
      }
      consumeAsciiFrame(need);
      continue;
    }
    if (asciiHeader.startsWith("#SETS")) {
      const need = 5 + 11 * 3;
      if (window.__rxBytes.length < need) break;
      if (!digitsOk(5, 11 * 3)) {
        if (!discardUntilKnownHeader("bad #SETS digits")) break;
        continue;
      }
      consumeAsciiFrame(need);
      continue;
    }
    if (asciiHeader.startsWith("#SETX")) {
      const need = 5 + 22 * 3;
      if (window.__rxBytes.length < need) break;
      if (!digitsOk(5, 22 * 3)) {
        if (!discardUntilKnownHeader("bad #SETX digits")) break;
        continue;
      }
      consumeAsciiFrame(need);
      continue;
    }
    if (asciiHeader.startsWith("#P&VS")) {
      const tripletCount = 77;
      const need = 5 + tripletCount * 3;
      if (window.__rxBytes.length < need) break;
      if (!digitsOk(5, tripletCount * 3)) {
        if (!discardUntilKnownHeader("bad #P&VS digits")) break;
        continue;
      }
      consumeAsciiFrame(need);
      continue;
    }
    if (asciiHeader.startsWith("#THRS")) {
      const need = 5 + 6 * 3;
      if (window.__rxBytes.length < need) break;
      if (!digitsOk(5, 6 * 3)) {
        if (!discardUntilKnownHeader("bad #THRS digits")) break;
        continue;
      }
      consumeAsciiFrame(need);
      continue;
    }
    if (asciiHeader.startsWith("#MPR")) {
      const need = 4 + 4 * 3;
      if (window.__rxBytes.length < need) break;
      if (!digitsOk(4, 4 * 3)) {
        if (!discardUntilKnownHeader("bad #MPR digits")) break;
        continue;
      }
      consumeAsciiFrame(need);
      continue;
    }
    if (asciiHeader.startsWith("#ACKA") || asciiHeader.startsWith("#ACKX") || asciiHeader.startsWith("#ACKR")) {
      if (window.__rxBytes.length < 5) break;
      consumeAsciiFrame(5);
      continue;
    }
    if (asciiHeader.startsWith("#PSCAN")) {
      if (window.__rxBytes.length < 6) break;
      consumeAsciiFrame(6);
      continue;
    }
    if (asciiHeader.startsWith("#PROBE")) {
      if (window.__rxBytes.length < 6) break;
      consumeAsciiFrame(6);
      continue;
    }
    if (asciiHeader.startsWith("#PSBUSY")) {
      if (window.__rxBytes.length < 7) break;
      consumeAsciiFrame(7);
      continue;
    }
    if (asciiHeader.startsWith("#PSDONE")) {
      if (window.__rxBytes.length < 7) break;
      consumeAsciiFrame(7);
      continue;
    }
    if (asciiHeader.startsWith("#PSRES")) {
      const need = 6 + 21 * 3;
      if (window.__rxBytes.length < need) break;
      if (!digitsOk(6, 21 * 3)) {
        if (!discardUntilKnownHeader("bad #PSRES digits")) break;
        continue;
      }
      consumeAsciiFrame(need);
      continue;
    }
    if (asciiHeader.startsWith("#PRBDONE")) {
      if (window.__rxBytes.length < 8) break;
      consumeAsciiFrame(8);
      continue;
    }
    // Exact-length gating for #PRS (20 triplets) to avoid waiting for the next '#'
    if (asciiHeader.startsWith("#PSMAP##") || asciiHeader.startsWith("#PZMAP##") || asciiHeader.startsWith("#PBMAP##")) break;
    if (asciiHeader.startsWith("#PRS")) {
      const need = 4 + 20 * 3;
      if (window.__rxBytes.length < need) break;
      consumeAsciiFrame(need);
      continue;
    }
    if (asciiHeader.startsWith("#REMS")) {
      if (window.__rxBytes.length >= 8) {
        const lenStr = decodeAscii(window.__rxBytes, 5, 3);
        const len = Number(lenStr);
        if (isFinite(len) && len >= 0) {
          const need = 8 + len * 3;
          if (window.__rxBytes.length < need) break;
          let digitsOk = true;
          for (let i = 8; i < need; i++) {
            const ch = window.__rxBytes[i];
            if (ch < 48 || ch > 57) { digitsOk = false; break; }
          }
          if (!digitsOk) {
            if (!discardUntilKnownHeader("bad #REMS digits")) break;
            continue;
          }
          consumeAsciiFrame(need);
          window.__gotREMS = true;
          continue;
        }
      }
    }
    if (asciiHeader.startsWith("#TEXT")) {
      if (window.__rxBytes.length >= 8) {
        const lenStr = decodeAscii(window.__rxBytes, 5, 3);
        const len = Number(lenStr);
        if (isFinite(len) && len >= 0) {
          const need = 8 + len * 3;
          if (window.__rxBytes.length < need) break;
          let textDigitsOk = true;
          for (let i = 8; i < need; i++) {
            const ch = window.__rxBytes[i];
            if (ch < 48 || ch > 57) { textDigitsOk = false; break; }
          }
          if (!textDigitsOk) {
            if (!discardUntilKnownHeader("bad #TEXT digits")) break;
            continue;
          }
          consumeAsciiFrame(need);
          continue;
        }
      }
    }
    if (!discardUntilKnownHeader("unknown header")) break;
  }
  // Second pass for binary frames that may now be at buffer head
  while (window.__rxBytes.length >= 9) {
    const header8b = decodeAscii(window.__rxBytes, 0, 8);
    if (header8b === "#PSMAP##" || header8b === "#PZMAP##" || header8b === "#PBMAP##") {
      const needB = 9 + pixelsPerPackage;
      if (window.__rxBytes.length < needB) break;
      const colStartB = window.__rxBytes[8] >>> 0;
      if (colStartB === 0) {
        console.log("RX binary map:", header8b);
      }
      setTimestampNow();
      const packageNumberB = Math.floor(colStartB / 6);
      pixelCount = packageNumberB * pixelsPerPackage;
      const targetPixelsB = (header8b === "#PBMAP##") ? smartImageGreyPixelArray : rawImageGreyPixelArray;
      for (let i = 0; i < pixelsPerPackage; i++) {
        if ((pixelCount + i) >= totalPixelCount) break;
        targetPixelsB[pixelCount + i] = window.__rxBytes[9 + i];
      }
      container = document.getElementById("pressuremapContainer");
      if (pixelCount >= 840 && container.style.display == "block") {
        if (header8b === "#PSMAP##") window.lastRawMapKind = "PS";
        else if (header8b === "#PZMAP##") window.lastRawMapKind = "PZ";
        renderSelectedPressureMap();
      }
      window.__rxBytes = window.__rxBytes.slice(needB);
      continue;
    }
    break;
  }
  // Leave any residual bytes for next notification without aggressive truncation
}

function writeOnCharacteristic(value){
  if (typeof value === "string" && value !== "#RP&VS") {
    pressureScanLockManual = false;
    pressureScanLockUntil = 0;
    probeLockManual = false;
    probeLockUntil = 0;
  }
  if (isPressureScanCommand(value)) notePressureScanRequested();
  if (bleTransmitServer && bleTransmitServer.connected && bleTransmitServiceFound) {
    const queuedWrite = bleWriteChain
      .catch(() => {})
      .then(() => bleTransmitServiceFound.getCharacteristic(transmitCharacteristic))
      .then(characteristic => {
        console.log("Found the transmit characteristic: ", characteristic.uuid);
        console.log("value =", value);
        const data = Uint8Array.from(value.split("").map(x => x.charCodeAt(0)));
        console.log("data =", data);
        return characteristic.writeValue(data);
      })
      .then(() => {
        latestValueSent.innerHTML = value;
        console.log("Value written to transmit characteristic:", value);
        setTimestampNow();
        if (typeof value === "string" && value.startsWith("#AIRM00")) {
          const idx = parseInt(value.substring(7, 8), 10);
          if (!isNaN(idx) && modeSelect && idx >= 0 && idx < modeSelect.options.length) {
            reportedModeIndex = idx;
            updateExecutionModeSelection(idx);
          }
        }
        return new Promise((resolve) => window.setTimeout(resolve, 30));
      })
      .catch(error => {
        console.error("Error writing to the transmit characteristic: ", error);
        throw error;
      });
    bleWriteChain = queuedWrite.then(() => undefined, () => undefined);
    return queuedWrite;
  } else {
    console.error ("Bluetooth is not connected. Cannot write to characteristic.")
    window.alert("Bluetooth is not connected. Cannot write to characteristic. \n Connect to BLE first!")
    return Promise.reject(new Error("BLE not connected"));
  }
}

const cmdInputBle = document.getElementById("cmdInputBle");
const cmdSendBle = document.getElementById("cmdSendBle");
if (cmdSendBle && cmdInputBle) {
  cmdSendBle.addEventListener("click", () => {
    const v = String(cmdInputBle.value || "").trim();
    if (v.length > 0) writeOnCharacteristic(v);
  });
  cmdInputBle.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const v = String(cmdInputBle.value || "").trim();
      if (v.length > 0) writeOnCharacteristic(v);
    }
  });
}
function disconnectDevice() {
  console.log("Disconnect Device.");
  if (bleServer && bleServer.connected) {
    if (receiveCharacteristicFound) {
      receiveCharacteristicFound.stopNotifications()
        .then(() => {
            console.log("Notifications Stopped");
            return bleServer.disconnect();
        })
        .then(() => {
            console.log("Device Disconnected");
            bleStateContainer.innerHTML = "Device Disconnected";
            bleStateContainer.style.color = "#d13a30";

        })
        .catch(error => {
            console.log("An error occurred:", error); 
        });
    } else {
      console.log("No characteristic found to disconnect.");
    }
  } else {
    // Throw an error if Bluetooth is not connected
    console.error("Bluetooth is not connected.");
    window.alert("Bluetooth is not connected.")
  }
}

function runModeSelect() {
  if (!modeSelect) return;
  const requestedMode = modeSelect.selectedIndex;
  if (requestedMode === 6) {
    updateExecutionModeSelection(6);
    updateManualModeState(true);
    writeOnCharacteristic("*SETMAM")
      .then(() => requestManualModeState())
      .catch(() => {});
    return;
  }
  reportedModeIndex = requestedMode;
  manualSelectedMode = null;
  updateExecutionModeSelection(requestedMode);
  const s = "#AIRM00" + requestedMode;
  if (mamActive) {
    // Clear the local manual latch immediately so an #AIRM### response does not
    // force the selector back to Manual while the explicit #MAM###000 ack is in flight.
    updateManualModeState(false);
    writeOnCharacteristic("*CLRMAM")
      .then(() => new Promise((resolve) => window.setTimeout(resolve, 120)))
      .then(() => writeOnCharacteristic(s))
      .then(() => requestManualModeState())
      .catch(() => {});
    return;
  }
  writeOnCharacteristic(s).catch(() => {});
}

function runAccumulatedPressureSelect() {
  isPosturePressureChecked = !!(isPosturePressure && isPosturePressure.checked);
  const container = document.getElementById("pressuremapContainer");
  const visible = container && container.style.display === "block";
  if (visible) {
    const rawCmd = isPosturePressureChecked ? "#RPZMAP" : "#RPSMAP";
    const viewMode = (pmapViewMode && pmapViewMode.value) ? pmapViewMode.value : "smart";
    try {
      if (viewMode === "smart") {
        writeOnCharacteristic("#RPBMAP");
      } else if (viewMode === "compare") {
        writeOnCharacteristic(rawCmd);
        writeOnCharacteristic("#RPBMAP");
      } else {
        writeOnCharacteristic(rawCmd);
      }
    } catch (_) {}
    renderSelectedPressureMap();
  }
}

function processReceivedString(rx_data) {
  try {
    if (rx_data.length > 8) {
      //ledAction.style.visibility = 'visible';
      if (rx_data.substring(0, 8) == "#PSMAP##") {         
        loadColorMapData(rx_data.substring(8, rx_data.length));
        container = document.getElementById("pressuremapContainer");
        // console.log("pixelCount: ", pixelCount);
        // console.log("container.style.display: ", container.style.display);
        if (pixelCount >= 840 && container.style.display == "block") {
          window.lastRawMapKind = "PS";
          renderSelectedPressureMap();
        }
      }
      else if (rx_data.substring(0, 8) == "#PZMAP##") {        
        loadColorMapData(rx_data.substring(8, rx_data.length));
        container = document.getElementById("pressuremapContainer"); 
        if (pixelCount >= 840 && container.style.display == "block") {
          window.lastRawMapKind = "PZ";
          renderSelectedPressureMap();
        }
      }
      else if (rx_data.substring(0, 8) == "#POSE###") {
        console.log("RX frame:", rx_data);
        maxProbabilityLabel.innerHTML = posture[Number(rx_data.substring(8,11))];
        maxProbability.innerHTML = Number(rx_data.substring(11,14)) + "%";
        if (typeof selectedBedAddr !== "undefined") {
          setSummaryCell(selectedBedAddr, 3, posture[Number(rx_data.substring(8,11))]);
        }
      }
      else if (rx_data.substring(0, 8) == "#POSE_P#") {
        console.log("RX frame:", rx_data);
        maxProbabilityLabel.innerHTML = posture[Number(rx_data.substring(8,11))];
        maxProbability.innerHTML = Number(rx_data.substring(11,14)) + "%";
      }
      else if (rx_data.substring(0, 5) == "#TEXT") {
        const len = Number(rx_data.substring(5, 8));
        if (isFinite(len) && len >= 0 && rx_data.length >= 8 + len * 3) {
          let s = "";
          for (let i = 0; i < len; i++) {
            const code = Number(rx_data.substring(8 + i * 3, 11 + i * 3));
            s += String.fromCharCode(code);
          }
          console.log("RX frame:", rx_data);
          console.log("RX text:", s);
          if (retrievedValue) retrievedValue.innerHTML = s;
        }
      }
      else if (rx_data.substring(0, 8) == "#MPZ####") {
        
      }
      else if (rx_data.substring(0, 6) == "#PSRES") {
        console.log("RX frame:", rx_data);
        const vals = [];
        for (let i = 0; i < 21; i++) vals.push(Number(rx_data.substring(6 + i*3, 9 + i*3)));
        for (let i = 0; i < 7; i++) {
          const elA = document.getElementById("lblPressureA" + (i + 1));
          const elB = document.getElementById("lblPressureB" + (i + 1));
          const elC = document.getElementById("lblPressureC" + (i + 1));
          if (elA) elA.textContent = String(vals[i]);
          if (elB) elB.textContent = String(vals[7 + i]);
          if (elC) elC.textContent = String(vals[14 + i]);
        }
        pressureScanLockManual = !!mamActive;
        pressureScanLockUntil = pressureScanLockManual ? 0 : (Date.now() + PSCAN_RESULT_HOLD_MS);
        finishPressureScan("Scan: updated", "done", 4000);
      }
      else if (rx_data.startsWith("#P&VS###") || rx_data.startsWith("#P&VS")) {
        container = document.getElementById("airmattressContainer");
        if (container.style.display == "block") {
          const payload = rx_data.startsWith("#P&VS###") ? rx_data.substring(8) : rx_data.substring(5);
          loadAndShowPVSData(payload);
        }
      }
      else if (rx_data.substring(0, 8) == "#AIRM###") {
        const nextMode = Number(rx_data.substring(8,11));
        const prevMode = reportedModeIndex;
        const manualWasActive = mamActive;
        updateModeFromDevice(nextMode);
        if (!manualWasActive && !mamActive && Number.isFinite(nextMode) && nextMode !== prevMode && nextMode !== 6) {
          showTransientPressureBanner(getModeStatusText(nextMode) + " started");
        }
      }
      else if (rx_data.substring(0, 7) == "#MAM###") {
        updateManualModeState(Number(rx_data.substring(7,10)) === 1);
      }
      else if (rx_data.substring(0, 5) == "#SETS") {
        loadSETSData(rx_data.substring(5, rx_data.length));
      }
      else if (rx_data.substring(0, 5) == "#SETX") {
        loadSETXData(rx_data.substring(5, rx_data.length));
      }
      else if (rx_data.substring(0, 5) == "#ALLX") {
        loadALLXData(rx_data.substring(5, rx_data.length));
      }
      else if (rx_data.substring(0, 5) == "#REMS") {
        const len = Number(rx_data.substring(5,8));
        if (isFinite(len) && len >= 0) {
          const needChars = 8 + len * 3;
          if (rx_data.length >= needChars) {
            let s = "";
            for (let i = 0; i < len; i++) {
              const code = Number(rx_data.substring(8 + i*3, 11 + i*3));
              s += String.fromCharCode(code);
            }
            const elRem = document.getElementById("taReminders");
            if (elRem) {
              elRem.value = s;
              if (typeof updateRemCounter === "function") updateRemCounter();
              if (typeof showRemsToast === "function") showRemsToast("Saved");
            }
          } else {
            // Incomplete; let buffer accumulate and process later
            return;
          }
        }
      }
      else if (rx_data.substring(0, 7) == "#MALLOW") {
        const hex = rx_data.substring(7, 11);
        let mask = 0;
        try { mask = parseInt(hex, 16); } catch (_) { mask = 0; }
        const setChk = (id, on)=>{ const el=document.getElementById(id); if (el) el.checked = !!on; };
        setChk("chkAllowCooling",         (mask & 0x0001));
        setChk("chkAllowOccupancy",       (mask & 0x0002));
        setChk("chkAllowClassify",        (mask & 0x0004));
        setChk("chkAllowPress",           (mask & 0x0008));
        setChk("chkAllowFocus",           (mask & 0x0010));
        setChk("chkAllowProbe",           (mask & 0x0020));
        setChk("chkAllowEdge",            (mask & 0x0040));
        setChk("chkAllowTare",            (mask & 0x0080));
      }
      else if (rx_data.substring(0, 5) == "#THRS") {
        const vals = [];
        for (let i = 0; i < 6; i++) vals.push(Number(rx_data.substring(5 + i*3, 8 + i*3)));
        const [P, DT10, S, E, SC, FC] = vals;
        const setVal = (id,val)=>{ const el=document.getElementById(id); if (el) el.value = val; };
        setVal("thrOccPressDelta", P);
        setVal("thrOccTempDeltaC", (DT10/10).toFixed(1));
        setVal("thrSettleSec", S);
        setVal("thrEdgeHighDelta", E);
        setVal("thrSitCenterDelta", SC);
        setVal("thrFewCountMax", FC);
      }
      else if (rx_data.substring(0, 5) == "#ALL ") {
        loadALLData(rx_data.substring(5, rx_data.length));
      }
      else if (rx_data.substring(0, 4) == "#PRS") {
        loadPRSData(rx_data.substring(4, rx_data.length));
      }
      else if (rx_data.substring(0, 5) == "#BODY") {
        updateAndSaveBodyData(rx_data.substring(5, rx_data.length));
        updateUserInfoToDisplay();
      }
      else if (rx_data.substring(0, 4) == "#MPR") {
        loadAndExecuteMPR(rx_data.substring(4, rx_data.length));
      }
      else if (rx_data.substring(0, 8) == "#BEDS###") {
        // Dongle should scan to see which beds are ESP-NOW connected and send this command to set the ratio button visible/selectable
        loadConnectedBeds(rx_data.substring(8, rx_data.length)); // first number indicate the ID of the connected bed
      }      
      else if (rx_data.substring(0, 6) == "#ALERT") { // #ALERTnn where nn provides the alert message index
        var textMsgShort = textMessageShort[Number(rx_data.substring(6, 8))];
        var textMsg = "Bed " + rx_data.substring(9, 11) + "\n" + textMessage[Number(rx_data.substring(6, 8))];
        //try { responsiveVoice.speak(textMsg); }
        try {
          setSummaryCell(Number(rx_data.substring(9, 11)), 7, textMsgShort);
          // need a short delay to display the above first
          setTimeout(function() {
            var utterThis = new SpeechSynthesisUtterance(textMsg);
            utterThis.voice = voices[1]; // just select a voice
            synth.speak(utterThis);
            alert(textMsg);
          }, 100);          
        }
        catch ({name, message}) {
          console.log(name); // "TypeError"
          console.log(message); // error message
        }
      }
      //ledAction.style.visibility = 'hidden';
    } else { // Bed plate actions
      if (rx_data == "#PSCAN") {
        startPressureScanSweep();
      }
      else if (rx_data == "#PSBUSY") {
        finishPressureScan("Scan: busy", "busy", 3000);
      }
      else if (rx_data == "#PSDONE") {
        pressureScanAwaitFinalFrame = true;
        setPressureScanStatus("Scan: finalizing", "busy");
        writeOnCharacteristic("#RP&VS").catch(() => {});
      }
      else if (rx_data.substring(0, 6) == "#PSRES") {
        const vals = [];
        for (let i = 0; i < 21; i++) vals.push(Number(rx_data.substring(6 + i*3, 9 + i*3)));
        for (let i = 0; i < 7; i++) {
          const elA = document.getElementById("lblPressureA" + (i + 1));
          const elB = document.getElementById("lblPressureB" + (i + 1));
          const elC = document.getElementById("lblPressureC" + (i + 1));
          if (elA) elA.textContent = String(vals[i]);
          if (elB) elB.textContent = String(vals[7 + i]);
          if (elC) elC.textContent = String(vals[14 + i]);
        }
        pressureScanLockManual = !!mamActive;
        pressureScanLockUntil = pressureScanLockManual ? 0 : (Date.now() + PSCAN_RESULT_HOLD_MS);
        finishPressureScan("Scan: updated", "done", 4000);
      }
      else if (rx_data == "#PROBE") {
        probeUiActive = true;
        probeAwaitFinalFrame = false;
        probeLockManual = false;
        probeLockUntil = 0;
        pressureScanLockManual = false;
        pressureScanLockUntil = 0;
        clearPressureScanSweep();
        clearPressureBannerTimer();
        updateSharedStatusBanner();
        startProbePolling();
      }
      else if (rx_data == "#PRBDONE") {
        probeUiActive = false;
        clearPressureScanSweep();
        showTransientPressureBanner("Probe complete", 4000);
        clearProbePollTimer();
        probeAwaitFinalFrame = true;
        writeOnCharacteristic("#RP&VS").catch(() => {});
      }
      if (rx_data.length == 8) {
        ledAction.style.visibility = 'visible';
        if (rx_data == "#RSB####") {
          lblAutoTurn.innerHTML = "";
          lblAutoTurn.style.visibility = 'hidden';
          ledAction.style.visibility = 'hidden';
        }
        else if (rx_data.substring(0, 4) == "####") {
          ledAction.style.visibility = 'hidden';
        }
        else if (rx_data.substring(0, 4) == "##LT") {
          leftAngle_current = rx_data.substring(5, 7);
          lblLeftAngleCurrent.innerHTML = leftAngle_current;
          lblLeftAngleCurrent.style.visibility = 'visible';
          imgLeftTurn.style.visibility = 'visible';
          leftAngle_last = leftAngle_current;
        }
        else if (rx_data.substring(0, 4) == "##RT") {
          rightAngle_current = rx_data.substring(5, 7);
          lblRightAngleCurrent.innerHTML = rightAngle_current;
          lblRightAngleCurrent.style.visibility = 'visible';
          imgRightTurn.style.visibility = 'visible';
          rightAngle_last = rightAngle_current;
        }
        else if (rx_data.substring(0, 4) == "##BU") {
          backAngle_current = rx_data.substring(5, 7);
          lblBackAngleCurrent.innerHTML = backAngle_current;
          lblBackAngleCurrent.style.visibility = 'visible';
          panelBack.style.backgroundColor = "green";
        }
        else if (rx_data.substring(0, 4) == "##BD") {
          backAngle_current = rx_data.substring(5, 7);
          lblBackAngleCurrent.innerHTML = backAngle_current;
          lblBackAngleCurrent.style.visibility = 'visible';
          if (backAngle_current == 0) panelBack.style.backgroundColor = "white";
          else panelBack.style.backgroundColor = "chocolate";
        }
        else if (rx_data.substring(0, 4) == "##LU") {
          legAngle_current = rx_data.substring(4, 7);
          lblLegAngleCurrent.innerHTML = legAngle_current;
          lblLegAngleCurrent.style.visibility = 'visible';
          if (legAngle_current == 0) {panelLegSlope.style.backgroundColor = "white"; panelLegFlat.style.backgroundColor = "white";}
          else {panelLegSlope.style.backgroundColor = "green"; panelLegFlat.style.backgroundColor = "darkgreen";}
        }
        else if (rx_data.substring(0, 4) == "##LD") {
          legAngle_current = rx_data.substring(4, 7);
          lblLegAngleCurrent.innerHTML = legAngle_current;
          lblLegAngleCurrent.style.visibility = 'visible';
          if (legAngle_current == 0) {panelLegSlope.style.backgroundColor = "white"; panelLegFlat.style.backgroundColor = "white";}
          else {panelLegSlope.style.backgroundColor = "chocolate"; panelLegFlat.style.backgroundColor = "peru";}
        }
        else if (rx_data.substring(0, 2) == "#T") {
          lblAutoTurn.innerHTML = rx_data.substring(2, 1) + "-turn in ~ " + rx_data.substring(3, 5) + " minutes";
          lblAutoTurn.style.visibility = 'visible';
        }
        else if (rx_data == "#STOP###") {
          ledAction.style.visibility = 'hidden';
          if (leftAngle_current == 0 && rightAngle_current == 0) {lblRightAngleCurrent.style.visibility = 'hidden'; lblLeftAngleCurrent.style.visibility = 'hidden';}
          if (leftAngle_current == 0) imgLeftTurn.style.visibility = 'hidden';
          if (rightAngle_current == 0) imgRightTurn.style.visibility = 'hidden';
          if (backAngle_current == 0) lblBackAngleCurrent.style.visibility = 'hidden';
          if (legAngle_current == 0) lblLegAngleCurrent.style.visibility = 'hidden';
        }
        // Special instructions (make it exactly 8 chars)
        else if (rx_data.substring(0, 6) == "#ALERT") { // #ALERTnn where nn provides the alert message index
          var textMsgShort = textMessageShort[Number(rx_data.substring(6, 8))];
          var textMsg = textMessage[Number(rx_data.substring(6, 8))];
          //try { responsiveVoice.speak(textMsg); }
          try {
            setSummaryCell(Number(rx_data.substring(8, 11)), 7, textMsgShort);
            // need a short delay to display the above first
            setTimeout(function() {
              var utterThis = new SpeechSynthesisUtterance(textMsg);
              utterThis.voice = voices[1]; // just select a voice
              synth.speak(utterThis);
              alert(textMsg);
            }, 100);
          }
          catch ({name, message}) {
            console.log(name); // "TypeError"
            console.log(message); // error message
          }
        }
      }
    }
  } catch ({name, message}) {
    console.log(name); // "TypeError"
    console.log(message); // error message
  }
}

function requestAllowlist() {
  writeOnCharacteristic("*MALLOW?");
}

function applyAllowlist() {
  const get = (id)=>!!document.getElementById(id)?.checked;
  let mask = 0;
  if (get("chkAllowCooling"))   mask |= 0x0001;
  if (get("chkAllowOccupancy")) mask |= 0x0002;
  if (get("chkAllowClassify"))  mask |= 0x0004;
  if (get("chkAllowPress"))     mask |= 0x0008;
  if (get("chkAllowFocus"))     mask |= 0x0010;
  if (get("chkAllowProbe"))     mask |= 0x0020;
  if (get("chkAllowEdge"))      mask |= 0x0040;
  if (get("chkAllowTare"))      mask |= 0x0080;
  const hex = ("0000" + mask.toString(16).toUpperCase()).slice(-4);
  writeOnCharacteristic("*MALLOW=0x" + hex);
}

function setAllowDefaults() {
  const set = (id, on)=>{ const el=document.getElementById(id); if (el) el.checked = !!on; };
  set("chkAllowCooling", false);
  set("chkAllowOccupancy", true);
  set("chkAllowClassify", true);
  set("chkAllowPress", true);
  set("chkAllowFocus", false);
  set("chkAllowProbe", false);
  set("chkAllowEdge", false);
  set("chkAllowTare", false);
  writeOnCharacteristic("*MALLOWD");
  setTimeout(()=>requestAllowlist(), 400);
}

/* function loadColorMapData(receivedString) {
  pmap_packageNumber = Number(receivedString.substring(8, 11));
  pixelCount = pmap_packageNumber * pixelsPerPackage;
  psm_data = receivedString.substring(11, receivedString.length);
  for (let i = 0; i < Math.floor(psm_data.length/3); i++) {
    if ((pixelCount + i) >= totalPixelCount) break;
    else {
      imageGreyPixelArray[pixelCount + i] = Number(psm_data.substring(i*3,(i+1)*3));
    }
  }
  //console.log(imageGreyPixelArray);
} */

function loadColorMapData(receivedString) {
  pmap_packageNumber = receivedString.charCodeAt(8);
  pixelCount = pmap_packageNumber * pixelsPerPackage;
  psm_data = receivedString.substring(9, receivedString.length);
  for (let i = 0; i < psm_data.length; i++) {
    if ((pixelCount + i) >= totalPixelCount) break;
    else {
      imageGreyPixelArray[pixelCount + i] = psm_data.charCodeAt(i);;
    }
  }
  if (pixelCount >= 840) {
    console.log(imageGreyPixelArray);
  }
}

function getPressureRenderMode() {
  return (document.documentElement && document.documentElement.dataset && document.documentElement.dataset.workflowMode === "developer" && window.renderMode) ? window.renderMode : "normal";
}

function getSelectedPmapViewMode() {
  return (pmapViewMode && pmapViewMode.value) ? pmapViewMode.value : "smart";
}

function resolveRenderSource(src) {
  const mode = getPressureRenderMode();
  return { mode, data: (mode === "smooth") ? getSmoothedArray(src) : src };
}

function paintMapIntoImage(imgData, src, scaleX, xOffset) {
  const pixels = imgData.data;
  for (let i = 0; i < totalPixelCount; i++) {
    const force = src[i] / 255.0;
    if (force <= 0) continue;
    const g = (((6 - (2 * 0.8)) * force) + 0.8);
    const red = Math.round((Math.max((3.0 - Math.abs(g - 4.0) - Math.abs(g - 5.0)) / 2.0, 0)) * 255);
    const green = Math.round((Math.max((4.0 - Math.abs(g - 2.0) - Math.abs(g - 4.0)) / 2.0, 0)) * 255);
    const blue = Math.round((Math.max((3.0 - Math.abs(g - 1.0) - Math.abs(g - 2.0)) / 2.0, 0)) * 255);
    const x = xOffset + (Math.floor(i / numRows) * scaleX);
    const y = (numRows - 1 - (i % numRows)) * pixelScaleY;
    for (let xx = x; xx < x + scaleX; xx++) {
      for (let yy = y; yy < y + pixelScaleY; yy++) {
        const off = (yy * imgData.width + xx) * 4;
        pixels[off] = red;
        pixels[off + 1] = green;
        pixels[off + 2] = blue;
        pixels[off + 3] = 255;
      }
    }
  }
}

function drawColorMapFromSource(src, badgeKind) {
  const canvasWidth = pressureMapCanvas.width;
  const canvasHeight = pressureMapCanvas.height;
  const resolved = resolveRenderSource(src);
  ctx.fillStyle = pressureMapBackground;
  ctx.fillRect(0, 0, 672, 280);
  const imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  paintMapIntoImage(imgData, resolved.data, pixelScaleX, 0);
  ctx.putImageData(imgData, 0, 0);
  window.lastMapKind = badgeKind;
  drawOverlayBadge(badgeKind, resolved.mode);
}

function drawCompareColorMap() {
  const canvasWidth = pressureMapCanvas.width;
  const canvasHeight = pressureMapCanvas.height;
  const rawResolved = resolveRenderSource(rawImageGreyPixelArray);
  const smartResolved = resolveRenderSource(smartImageGreyPixelArray);
  ctx.fillStyle = pressureMapBackground;
  ctx.fillRect(0, 0, 672, 280);
  const imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  paintMapIntoImage(imgData, rawResolved.data, 7, 0);
  paintMapIntoImage(imgData, smartResolved.data, 7, 336);
  ctx.putImageData(imgData, 0, 0);
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.beginPath();
  ctx.moveTo(336, 0);
  ctx.lineTo(336, 280);
  ctx.stroke();
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(6, 6, 80, 20);
  ctx.fillRect(342, 6, 96, 20);
  ctx.fillStyle = "#fff";
  ctx.font = "12px sans-serif";
  ctx.fillText(window.lastRawMapKind === "PS" ? "RAW PS" : "RAW PZ", 10, 21);
  ctx.fillText("SMART PB", 346, 21);
  window.lastMapKind = "CMP";
}

function drawPSColorMap() {
  drawColorMapFromSource(rawImageGreyPixelArray, "PS");
}

function drawPZColorMap() {
  drawColorMapFromSource(rawImageGreyPixelArray, "PZ");
}

function drawPBColorMap() {
  drawColorMapFromSource(smartImageGreyPixelArray, "PB");
}

function renderSelectedPressureMap() {
  const viewMode = getSelectedPmapViewMode();
  if (viewMode === "smart") {
    drawPBColorMap();
  } else if (viewMode === "compare") {
    drawCompareColorMap();
  } else if (window.lastRawMapKind === "PS") {
    drawPSColorMap();
  } else {
    drawPZColorMap();
  }
}

function getSmoothedArray(src) {
  const out = new Uint8Array(totalPixelCount);
  const W = 48, H = 20;
  const idx = (x,y)=> x*20 + y;
  const clamp=(v,min,max)=> v<min?min:(v>max?max:v);
  for (let x=0;x<W;x++) {
    for (let y=0;y<H;y++) {
      let sum=0, wsum=0;
      for (let dx=-1;dx<=1;dx++) {
        for (let dy=-1;dy<=1;dy++) {
          const nx = clamp(x+dx,0,W-1);
          const ny = clamp(y+dy,0,H-1);
          const w = (dx===0 && dy===0) ? 4 : (Math.abs(dx)+Math.abs(dy)===1 ? 2 : 1);
          sum += w * src[idx(nx,ny)];
          wsum += w;
        }
      }
      out[idx(x,y)] = Math.round(sum/wsum);
    }
  }
  return out;
}

function drawOverlayBadge(kind, mode) {
  if (!(document.documentElement && document.documentElement.dataset && document.documentElement.dataset.workflowMode === "developer")) return;
  const txt = kind + (mode==="smooth" ? "·SM" : "");
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(6,6,72,20);
  ctx.fillStyle = "#fff";
  ctx.font = "12px sans-serif";
  ctx.fillText(txt, 10, 21);
}

if (typeof window.renderMode === "undefined") window.renderMode = "normal";
if (typeof window.lastRawMapKind === "undefined") window.lastRawMapKind = "PZ";
const pressureMapCanvasEl = document.getElementById("pressureMapCanvas");
if (pressureMapCanvasEl) {
  pressureMapCanvasEl.addEventListener("click", () => {
    if (!(document.documentElement && document.documentElement.dataset && document.documentElement.dataset.workflowMode === "developer")) return;
    window.renderMode = (window.renderMode === "normal") ? "smooth" : "normal";
    renderSelectedPressureMap();
  });
}

function loadAndShowPVSData(receivedString) {
  var dataLength = Math.floor(receivedString.length/3);
  const buffer = new ArrayBuffer(dataLength);
  var data = new Uint8Array(buffer);
  for (let i = 0; i < dataLength; i++) {
      data[i] = Number(receivedString.substring(i*3,(i+1)*3));
  }

  panelMainA.style.backgroundColor = channelColour[data[0]];
  panelMainB.style.backgroundColor = channelColour[data[1]];
  panelMainC.style.backgroundColor = channelColour[data[2]];
  if (data[3] == 0) imgExhaustBlocked.style.visibility = 'visible'; else imgExhaustBlocked.style.visibility = 'hidden';
  if (data[4] == 0) {panelPump.style.backgroundColor = "#FFFFFF"; panelPump1.style.backgroundColor = "#FFFFFF";}
  else {panelPump.style.backgroundColor = "#00FF00"; panelPump1.style.backgroundColor = "#00FF00";}
  lblPressurePump.innerHTML = data[5];

  for (let i = 0; i < 7; i++) {
    ACellColourCode[i] = data[6 + i];
    BCellColourCode[i] = data[13 + i];
    CCellColourCode[i] = data[20 + i];
    DCellColourCode[i] = data[27 + i];
  }
  // Show channel/cell colour
  panelA1.style.backgroundColor = channelColour[ACellColourCode[0]];
  panelA2.style.backgroundColor = channelColour[ACellColourCode[1]];
  panelA3.style.backgroundColor = channelColour[ACellColourCode[2]];
  panelA4.style.backgroundColor = channelColour[ACellColourCode[3]];
  panelA5.style.backgroundColor = channelColour[ACellColourCode[4]];
  panelA6.style.backgroundColor = channelColour[ACellColourCode[5]];
  panelA7.style.backgroundColor = channelColour[ACellColourCode[6]];
  panelB1.style.backgroundColor = channelColour[BCellColourCode[0]];
  panelB2.style.backgroundColor = channelColour[BCellColourCode[1]];
  panelB3.style.backgroundColor = channelColour[BCellColourCode[2]];
  panelB4.style.backgroundColor = channelColour[BCellColourCode[3]];
  panelB5.style.backgroundColor = channelColour[BCellColourCode[4]];
  panelB6.style.backgroundColor = channelColour[BCellColourCode[5]];
  panelB7.style.backgroundColor = channelColour[BCellColourCode[6]];
  panelC1.style.backgroundColor = channelColour[CCellColourCode[0]];
  panelC2.style.backgroundColor = channelColour[CCellColourCode[1]];
  panelC3.style.backgroundColor = channelColour[CCellColourCode[2]];
  panelC4.style.backgroundColor = channelColour[CCellColourCode[3]];
  panelC5.style.backgroundColor = channelColour[CCellColourCode[4]];
  panelC6.style.backgroundColor = channelColour[CCellColourCode[5]];
  panelC7.style.backgroundColor = channelColour[CCellColourCode[6]];

  // Optional: 6 Temp and 6 RH sensors after cell colours
  if (dataLength >= 51) {
    const tStart = 34, hStart = 40;
    const setTxt = (id, text) => { const el=document.getElementById(id); if (el) el.textContent = text; return el; };
    const temps = [];
    const rhs = [];
    for (let i=0;i<6;i++){ temps[i]=data[tStart+i]; rhs[i]=data[hStart+i]; }
    setTxt("lblTemp1", "HOT: " + temps[0] + "°C");
    setTxt("lblTemp2", "COLD: " + temps[1] + "°C");
    setTxt("lblTemp3", "ROOM: " + temps[2] + "°C");
    setTxt("lblTemp4", "T1: " + temps[3] + "°C");
    setTxt("lblTemp5", "T2: " + temps[4] + "°C");
    setTxt("lblTemp6", "T3: " + temps[5] + "°C");
    setTxt("lblRh1", "RHT: " + rhs[0] + "%");
    setTxt("lblRh2", "RHC: " + rhs[1] + "%");
    setTxt("lblRh3", "RHR: " + rhs[2] + "%");
    setTxt("lblRh4", "RH1: " + rhs[3] + "%");
    setTxt("lblRh5", "RH2: " + rhs[4] + "%");
    setTxt("lblRh6", "RH3: " + rhs[5] + "%");
    const colTemp = (v)=> v>=MAX_MATTRESS_TEMP_C ? "#FFA500" : (v<=MIN_MATTRESS_TEMP_C ? "#66ccff" : "#FFFFFF");
    const colRh = (v)=> v>=MAX_MATTRESS_RH ? "#FFA500" : "#FFFFFF";
    const setCol=(id,c)=>{ const el=document.getElementById(id); if(el) el.style.color=c; };
    setCol("lblTemp1", colTemp(temps[0]));
    setCol("lblTemp2", colTemp(temps[1]));
    setCol("lblTemp3", colTemp(temps[2]));
    setCol("lblTemp4", colTemp(temps[3]));
    setCol("lblTemp5", colTemp(temps[4]));
    setCol("lblTemp6", colTemp(temps[5]));
    setCol("lblRh1", colRh(rhs[0]));
    setCol("lblRh2", colRh(rhs[1]));
    setCol("lblRh3", colRh(rhs[2]));
    setCol("lblRh4", colRh(rhs[3]));
    setCol("lblRh5", colRh(rhs[4]));
    setCol("lblRh6", colRh(rhs[5]));
  }

  // Optional: side bags and leg bag status colors + TEC/Blower states
  if (dataLength >= 51) {
    const bagColour = ["#FFFFFF", "#00cc66", "#CC8400"];
    const scL = data[46], scR = data[47], scLeg = data[48];
    const panel = (id, code, palette) => { const el=document.getElementById(id); if (el) el.style.backgroundColor = palette[code] || "#FFFFFF"; };
    panel("panelLeft", scL, bagColour);
    panel("panelRight", scR, bagColour);
    panel("panelLeg", scLeg, bagColour);
    const tec = document.getElementById("lblTec");
    const blw = document.getElementById("lblBlower");
    if (tec) { tec.textContent = (data[49] ? "TEC: ON" : "TEC: OFF"); tec.style.color = data[49] ? "#00cc66" : "#cccccc"; }
    if (blw) { blw.textContent = (data[50] ? "BLW: ON" : "BLW: OFF"); blw.style.color = data[50] ? "#00cc66" : "#cccccc"; }
  }
  // Optional: per-cell pressures appended at the tail
  if (dataLength >= 72) {
    const pAStart = 51, pBStart = 58, pCStart = 65;
    const pressures = Array.from(data.slice(pAStart, pCStart + 7));
    lastPressureSnapshotKey = pressures.join(",");
    const applyCellPressures = (vals) => {
      if (!vals || vals.length < 21) return;
      for (let i = 0; i < 7; i++) {
        const elA = document.getElementById("lblPressureA" + (i + 1));
        const elB = document.getElementById("lblPressureB" + (i + 1));
        const elC = document.getElementById("lblPressureC" + (i + 1));
        if (elA) elA.textContent = String(vals[i]);
        if (elB) elB.textContent = String(vals[7 + i]);
        if (elC) elC.textContent = String(vals[14 + i]);
      }
    };

    if (pressureScanActive) pressureScanPendingPressures = pressures;

    const nowMs = Date.now();
    if (!pressureScanLockManual && pressureScanLockUntil > 0 && nowMs >= pressureScanLockUntil) pressureScanLockUntil = 0;
    if (!probeLockManual && probeLockUntil > 0 && nowMs >= probeLockUntil) probeLockUntil = 0;

    const pressureScanLocked = pressureScanLockManual || (pressureScanLockUntil > 0 && nowMs < pressureScanLockUntil);
    const probeLocked = probeLockManual || (probeLockUntil > 0 && nowMs < probeLockUntil);

    if (pressureScanAwaitFinalFrame) {
      applyCellPressures(pressures);
      pressureScanLockManual = !!mamActive;
      pressureScanLockUntil = pressureScanLockManual ? 0 : (nowMs + PSCAN_RESULT_HOLD_MS);
      pressureScanAwaitFinalFrame = false;
      finishPressureScan("Scan: updated", "done", 4000);
    } else if (probeAwaitFinalFrame) {
      applyCellPressures(pressures);
      probeLockManual = !!mamActive;
      probeLockUntil = probeLockManual ? 0 : (nowMs + PROBE_RESULT_HOLD_MS);
      probeAwaitFinalFrame = false;
    } else if (!pressureScanActive && !pressureScanLocked && !probeLocked) {
      applyCellPressures(pressures);
    }
  }

  if (dataLength >= 77) {
    const pLeft = data[72], pRight = data[73], pLeg = data[74], pPillow = data[75], pSide = data[76];
    const setTxt = (id, text) => { const el=document.getElementById(id); if (el) { el.textContent = text; el.style.visibility = "visible"; } };
    leftBagPressure = pLeft;
    rightBagPressure = pRight;
    legBagPressure = pLeg;
    pillowBagPressure = pPillow;
    sideBagPressure = pSide;
    setTxt("lblPressureLeft", String(pLeft));
    setTxt("lblPressureRight", String(pRight));
    setTxt("lblPressureLeg", String(pLeg));
    setTxt("lblPressurePillow", String(pPillow));
    setTxt("lblPressureSide", "Side: " + String(pSide));
  }
}

function loadPRSData(receivedString) {
  var dataLength = Math.floor(receivedString.length/3);
  const buffer = new ArrayBuffer(dataLength);
  var data = new Uint8Array(buffer);
  for (let i = 0; i < dataLength; i++) {
      data[i] = Number(receivedString.substring(i*3,(i+1)*3));
  }

  iDurationP1 = data[0];
  iDurationP2 = data[1];
  iDurationP3 = data[2];
  iDurationP4 = data[3];
  iBackAngleP1 = data[4];
  iBackAngleP2 = data[5];
  iBackAngleP3 = data[6];
  iBackAngleP4 = data[7];
  iLegAngleP1 = data[8];
  iLegAngleP2 = data[9];
  iLegAngleP3 = data[10];
  iLegAngleP4 = data[11];
  iTurnAngleP1 = data[12];
  iTurnAngleP2 = data[13];
  iTurnAngleP3 = data[14];
  iTurnAngleP4 = data[15];
  iStepAngle = data[16];
  iDurationInTurnPosition = data[17];
  iDurationInFlatPosition = data[18];
  iDurationAlternating = data[19];

  // Update PRS page controls
  const setVal = (id,val)=>{ const el=document.getElementById(id); if (el) el.value = String(val); };
  setVal("taDurationP1", iDurationP1);
  setVal("taDurationP2", iDurationP2);
  setVal("taDurationP3", iDurationP3);
  setVal("taDurationP4", iDurationP4);
  setVal("taBackAngleP1", iBackAngleP1);
  setVal("taBackAngleP2", iBackAngleP2);
  setVal("taBackAngleP3", iBackAngleP3);
  setVal("taBackAngleP4", iBackAngleP4);
  setVal("taLegAngleP1", iLegAngleP1);
  setVal("taLegAngleP2", iLegAngleP2);
  setVal("taLegAngleP3", iLegAngleP3);
  setVal("taLegAngleP4", iLegAngleP4);
  setVal("taTurnAngleP1", iTurnAngleP1);
  setVal("taTurnAngleP2", iTurnAngleP2);
  setVal("taTurnAngleP3", iTurnAngleP3);
  setVal("taTurnAngleP4", iTurnAngleP4);
  setVal("taStepAngle", iStepAngle);
  setVal("taDurationInTurnPosition", iDurationInTurnPosition);
  setVal("taDurationInFlatPosition", iDurationInFlatPosition);
  setVal("taDurationAlternating", iDurationAlternating);
  if (typeof updatePressureReleaseSettingToDisplay === "function") updatePressureReleaseSettingToDisplay();
}

function loadSETSData(receivedString) {
  var dataLength = Math.floor(receivedString.length/3);
  const buffer = new ArrayBuffer(dataLength);
  var data = new Uint8Array(buffer);
  for (let i = 0; i < dataLength; i++) {
      data[i] = Number(receivedString.substring(i*3,(i+1)*3));
  }

  // Mapping (SETS 11 bytes):
  // [0]=mode, [1]=staticPressure, [2]=durationRedistribute, [3]=durationAlternating, [4]=autoTurnAngle,
  // [5]=noTurn, [6]=noTurnRight, [7]=noTurnLeft, [8]=noMoveBack, [9]=noMoveLeg, [10]=reserved
  setStaticPressure = data[1];
  setDurationRedistribute = data[2];
  setDurationAlternating = data[3];
  setAutoTurnAngle = data[4];
  bNotToTurn = (data[5] == 1);
  bNotToTurnRight = (data[6] == 1);
  bNotToTurnLeft = (data[7] == 1);
  bNotToMoveBack = (data[8] == 1);
  bNotToMoveLeg = (data[9] == 1);

  // Show ALL information on the User Info setting screen
  saveSettings();
  // Update Settings page controls
  if (lblStaticPressure && rangeStaticPressure) {
    rangeStaticPressure.value = setStaticPressure;
    lblStaticPressure.innerHTML = setStaticPressure;
  }
  if (rangeDurationRedistribute && lblDurationRedistribute) {
    rangeDurationRedistribute.value = setDurationRedistribute;
    lblDurationRedistribute.innerHTML = setDurationRedistribute;
  }
  if (rangeDurationAlternating && lblDurationAlternating) {
    rangeDurationAlternating.value = setDurationAlternating;
    lblDurationAlternating.innerHTML = setDurationAlternating;
  }
  const setCheck = (id, v) => { const el = document.getElementById(id); if (el) el.checked = !!v; };
  setCheck("notToTurn", bNotToTurn);
  setCheck("notToMoveLeg", bNotToMoveLeg);
  setCheck("caregiverAlert", bCaregiverAlert);
  setCheck("faultAlert", bFaultAlert);
}

function loadSETXData(receivedString) {
  var dataLength = Math.floor(receivedString.length/3);
  const buffer = new ArrayBuffer(dataLength);
  var data = new Uint8Array(buffer);
  for (let i = 0; i < dataLength; i++) {
      data[i] = Number(receivedString.substring(i*3,(i+1)*3));
  }

  if (dataLength < 20) return;
  if (data[0] != 1) return;

  bNoPillowMassage = data[1] == 1;
  bNoCooling = data[2] == 1;
  bRedistPlusAlter = data[3] == 1;

  AUTOTURN_INTERVAL = data[4];
  NUMBER_OF_TURNS = data[5];
  SIDEBAG_FILL_INTERVAL = data[6];
  LEG_AIRBAG_INTERVAL = data[7];
  POSTURE_CHECK_INTERVAL = data[8];
  HOLD_TIME_TO_COOL_VALVES = data[9];

  PRESSURE_FIRM = data[10];
  PRESSURE_SITTING = data[11];
  PRESSURE_RELEASED = data[12];
  PRESSURE_MAX = data[13];
  PRESSURE_HYSTERESIS = data[14];

  MIN_MATTRESS_TEMP_C = data[15];
  MAX_MATTRESS_TEMP_C = data[16];
  MAX_MATTRESS_RH = data[17];
  DELTA_TEMPERATURE_C = data[18];
  HEATSINK_MAX_TEMP_C = data[19];

  saveSettings();
}

function loadALLXData(receivedString) {
  const readTriplet = (i) => Number(receivedString.substring(i * 3, (i + 1) * 3));
  const minHeaderTriplets = 51; // 28(ALL) + 22(SETX) + 1(nameLen)
  if (receivedString.length < 3 * minHeaderTriplets) return;
  let ti = 0;
  // 1. ALL data (28 bytes)
  iWeight = readTriplet(ti++); 
  iAge = readTriplet(ti++);
  iHeight = readTriplet(ti++);
  iEyeToHip = readTriplet(ti++);
  indexSex = readTriplet(ti++);
  valueSensory = readTriplet(ti++);
  valueMoisture = readTriplet(ti++);
  valueActivity = readTriplet(ti++);
  valueMobility = readTriplet(ti++);
  valueNutrition = readTriplet(ti++);
  valueShear = readTriplet(ti++);
  iBradenScore = readTriplet(ti++);
  setStaticPressure = readTriplet(ti++);
  setAutofirmPressure = readTriplet(ti++);
  setDurationRedistribute = readTriplet(ti++);
  setDurationAlternating = readTriplet(ti++);
  setAutoTurnAngle = readTriplet(ti++);
  operatingModeSelected = readTriplet(ti++);
  minuteToNextRedistribute = readTriplet(ti++);
  minuteToNextAlternating = readTriplet(ti++);
  minuteToNextAutoturn = readTriplet(ti++);
  minuteToNextMixedModeAction = readTriplet(ti++);
  percentPressurePoints = readTriplet(ti++);
  midBodyWidth = readTriplet(ti++);
  midBodyHeight = readTriplet(ti++);
  columnsEyeToHip = readTriplet(ti++);
  columnsEyeToHeel = readTriplet(ti++);
  degreeHipToThighs = readTriplet(ti++);
  // 2. SETX data (22 bytes)
  let setxHeader = readTriplet(ti++);
  if (setxHeader == 1) {
    bNoPillowMassage = readTriplet(ti++) == 1;
    bNoCooling = readTriplet(ti++) == 1;
    bRedistPlusAlter = readTriplet(ti++) == 1;
    AUTOTURN_INTERVAL = readTriplet(ti++);
    NUMBER_OF_TURNS = readTriplet(ti++);
    SIDEBAG_FILL_INTERVAL = readTriplet(ti++);
    LEG_AIRBAG_INTERVAL = readTriplet(ti++);
    POSTURE_CHECK_INTERVAL = readTriplet(ti++);
    HOLD_TIME_TO_COOL_VALVES = readTriplet(ti++);
    PRESSURE_FIRM = readTriplet(ti++);
    PRESSURE_SITTING = readTriplet(ti++);
    PRESSURE_RELEASED = readTriplet(ti++);
    PRESSURE_MAX = readTriplet(ti++);
    PRESSURE_HYSTERESIS = readTriplet(ti++);
    MIN_MATTRESS_TEMP_C = readTriplet(ti++);
    MAX_MATTRESS_TEMP_C = readTriplet(ti++);
    MAX_MATTRESS_RH = readTriplet(ti++);
    DELTA_TEMPERATURE_C = readTriplet(ti++);
    HEATSINK_MAX_TEMP_C = readTriplet(ti++);
    bCaregiverAlert = readTriplet(ti++) == 1;
    bFaultAlert = readTriplet(ti++) == 1;
  } else {
    ti += 21; // Skip rest of SETX if header not 1
  }
  const nameLen = readTriplet(ti++);
  const expectedTripletLen = 3 * (minHeaderTriplets + nameLen);
  const expectedAsciiLen = 3 * minHeaderTriplets + nameLen;
  let nameStr = "";
  if (receivedString.length >= expectedTripletLen) {
    for (let i = 0; i < nameLen; i++) {
      const code = readTriplet(ti++);
      nameStr += String.fromCharCode(code);
    }
  } else if (receivedString.length >= expectedAsciiLen) {
    const asciiStart = 3 * minHeaderTriplets;
    const asciiEnd = asciiStart + nameLen;
    nameStr = receivedString.substring(asciiStart, asciiEnd);
  }
  if (nameStr.length > 0) {
    const elName = document.getElementById('taName');
    if (elName) elName.value = nameStr;
  }

  // Optional: Reminders text follows name (len + chars)
  if (ti * 3 <= receivedString.length - 3) {
    const remLen = readTriplet(ti++);
    let remStr = "";
    if ((ti + remLen) * 3 <= receivedString.length) {
      for (let i = 0; i < remLen; i++) {
        const code = readTriplet(ti++);
        remStr += String.fromCharCode(code);
      }
      const elRem = document.getElementById("taReminders");
      if (elRem) elRem.value = remStr;
    }
  }
  window.__seenAllx = true;

  // Apply to UI controls that reflect mode and settings
  if (typeof modeSelect !== "undefined" && modeSelect) {
    if (operatingModeSelected >= 0 && operatingModeSelected < modeSelect.options.length) {
      updateModeFromDevice(operatingModeSelected);
      updateSharedStatusBanner();
    }
  }
  if (lblStaticPressure && rangeStaticPressure) {
    rangeStaticPressure.value = setStaticPressure;
    lblStaticPressure.innerHTML = setStaticPressure;
  }
  if (rangeDurationRedistribute && lblDurationRedistribute) {
    rangeDurationRedistribute.value = setDurationRedistribute;
    lblDurationRedistribute.innerHTML = setDurationRedistribute;
  }
  if (rangeDurationAlternating && lblDurationAlternating) {
    rangeDurationAlternating.value = setDurationAlternating;
    lblDurationAlternating.innerHTML = setDurationAlternating;
  }
  if (typeof chkNoTurn !== "undefined" && chkNoTurn) chkNoTurn.checked = bNotToTurn;
  if (typeof chkNoTurnRight !== "undefined" && chkNoTurnRight) chkNoTurnRight.checked = bNotToTurnRight;
  if (typeof chkNoTurnLeft !== "undefined" && chkNoTurnLeft) chkNoTurnLeft.checked = bNotToTurnLeft;
  if (typeof chkNoMoveBack !== "undefined" && chkNoMoveBack) chkNoMoveBack.checked = bNotToMoveBack;
  if (typeof chkNoMoveLeg !== "undefined" && chkNoMoveLeg) chkNoMoveLeg.checked = bNotToMoveLeg;
  if (typeof chkCaregiverAlert !== "undefined" && chkCaregiverAlert) chkCaregiverAlert.checked = bCaregiverAlert;
  if (typeof chkFaultAlert !== "undefined" && chkFaultAlert) chkFaultAlert.checked = bFaultAlert;

  // Settings page values
  const setNumber = (id, v) => { const el = document.getElementById(id); if (el) el.value = String(v); };
  const setCheck = (id, v) => { const el = document.getElementById(id); if (el) el.checked = !!v; };
  setNumber("taAutoturnInterval", AUTOTURN_INTERVAL);
  setNumber("taNumberOfTurns", NUMBER_OF_TURNS);
  setNumber("taSidebagFillInterval", SIDEBAG_FILL_INTERVAL);
  setNumber("taLegAirbagInterval", LEG_AIRBAG_INTERVAL);
  setNumber("taPostureCheckInterval", POSTURE_CHECK_INTERVAL);
  setNumber("taHoldTimeToCoolValves", HOLD_TIME_TO_COOL_VALVES);
  setNumber("taPressureFirm", PRESSURE_FIRM);
  setNumber("taPressureSitting", PRESSURE_SITTING);
  setNumber("taPressureReleased", PRESSURE_RELEASED);
  setNumber("taPressureMax", PRESSURE_MAX);
  setNumber("taPressureHysteresis", PRESSURE_HYSTERESIS);
  setNumber("taMinMattressTempC", MIN_MATTRESS_TEMP_C);
  setNumber("taMaxMattressTempC", MAX_MATTRESS_TEMP_C);
  setNumber("taMaxMattressRh", MAX_MATTRESS_RH);
  setNumber("taDeltaTemperatureC", DELTA_TEMPERATURE_C);
  setNumber("taHeatsinkMaxTempC", HEATSINK_MAX_TEMP_C);
  setCheck("noPillowMassage", bNoPillowMassage);
  setCheck("noCooling", bNoCooling);
  setCheck("redistPlusAlter", bRedistPlusAlter);
  setCheck("caregiverAlert", bCaregiverAlert);
  setCheck("faultAlert", bFaultAlert);

  updateUserInfoToDisplay();
  saveSettings();
}

function loadALLXDataBytes(payload) {
  // payload is Uint8Array containing 51 header bytes + nameLen + name bytes
  if (!payload || payload.length < 51) return;
  let ti = 0;
  // 1. ALL data (28 bytes)
  iWeight = payload[ti++]; 
  iAge = payload[ti++];
  iHeight = payload[ti++];
  iEyeToHip = payload[ti++];
  indexSex = payload[ti++];
  valueSensory = payload[ti++];
  valueMoisture = payload[ti++];
  valueActivity = payload[ti++];
  valueMobility = payload[ti++];
  valueNutrition = payload[ti++];
  valueShear = payload[ti++];
  iBradenScore = payload[ti++];
  setStaticPressure = payload[ti++];
  setAutofirmPressure = payload[ti++];
  setDurationRedistribute = payload[ti++];
  setDurationAlternating = payload[ti++];
  setAutoTurnAngle = payload[ti++];
  operatingModeSelected = payload[ti++];
  minuteToNextRedistribute = payload[ti++];
  minuteToNextAlternating = payload[ti++];
  minuteToNextAutoturn = payload[ti++];
  minuteToNextMixedModeAction = payload[ti++];
  percentPressurePoints = payload[ti++];
  midBodyWidth = payload[ti++];
  midBodyHeight = payload[ti++];
  columnsEyeToHip = payload[ti++];
  columnsEyeToHeel = payload[ti++];
  degreeHipToThighs = payload[ti++];
  // 2. SETX data (22 bytes)
  const setxHeader = payload[ti++];
  if (setxHeader === 1) {
    bNoPillowMassage = payload[ti++] === 1;
    bNoCooling = payload[ti++] === 1;
    bRedistPlusAlter = payload[ti++] === 1;
    AUTOTURN_INTERVAL = payload[ti++];
    NUMBER_OF_TURNS = payload[ti++];
    SIDEBAG_FILL_INTERVAL = payload[ti++];
    LEG_AIRBAG_INTERVAL = payload[ti++];
    POSTURE_CHECK_INTERVAL = payload[ti++];
    HOLD_TIME_TO_COOL_VALVES = payload[ti++];
    PRESSURE_FIRM = payload[ti++];
    PRESSURE_SITTING = payload[ti++];
    PRESSURE_RELEASED = payload[ti++];
    PRESSURE_MAX = payload[ti++];
    PRESSURE_HYSTERESIS = payload[ti++];
    MIN_MATTRESS_TEMP_C = payload[ti++];
    MAX_MATTRESS_TEMP_C = payload[ti++];
    MAX_MATTRESS_RH = payload[ti++];
    DELTA_TEMPERATURE_C = payload[ti++];
    HEATSINK_MAX_TEMP_C = payload[ti++];
    bCaregiverAlert = payload[ti++] === 1;
    bFaultAlert = payload[ti++] === 1;
  } else {
    ti += 21;
  }
  const nameLen = payload[ti++];
  let nameStr = "";
  if (nameLen > 0 && ti + nameLen <= payload.length) {
    for (let i = 0; i < nameLen; i++) {
      nameStr += String.fromCharCode(payload[ti++]);
    }
    const elName = document.getElementById('taName');
    if (elName) elName.value = nameStr;
  }
  // Optional: Reminders text follows name (len + chars)
  if (ti < payload.length) {
    const remLen = payload[ti++];
    if (remLen > 0 && ti + remLen <= payload.length) {
      let remStr = "";
      for (let i = 0; i < remLen; i++) remStr += String.fromCharCode(payload[ti++]);
      const elRem = document.getElementById('taReminders');
      if (elRem) elRem.value = remStr;
    }
  }
  window.__seenAllx = true;
  // Apply to UI
  if (typeof modeSelect !== "undefined" && modeSelect) {
    if (operatingModeSelected >= 0 && operatingModeSelected < modeSelect.options.length) {
      updateModeFromDevice(operatingModeSelected);
      updateSharedStatusBanner();
    }
  }
  if (lblStaticPressure && rangeStaticPressure) {
    rangeStaticPressure.value = setStaticPressure;
    lblStaticPressure.innerHTML = setStaticPressure;
  }
  if (rangeDurationRedistribute && lblDurationRedistribute) {
    rangeDurationRedistribute.value = setDurationRedistribute;
    lblDurationRedistribute.innerHTML = setDurationRedistribute;
  }
  if (rangeDurationAlternating && lblDurationAlternating) {
    rangeDurationAlternating.value = setDurationAlternating;
    lblDurationAlternating.innerHTML = setDurationAlternating;
  }
  if (typeof chkNoTurn !== "undefined" && chkNoTurn) chkNoTurn.checked = bNotToTurn;
  if (typeof chkNoTurnRight !== "undefined" && chkNoTurnRight) chkNoTurnRight.checked = bNotToTurnRight;
  if (typeof chkNoTurnLeft !== "undefined" && chkNoTurnLeft) chkNoTurnLeft.checked = bNotToTurnLeft;
  if (typeof chkNoMoveBack !== "undefined" && chkNoMoveBack) chkNoMoveBack.checked = bNotToMoveBack;
  if (typeof chkNoMoveLeg !== "undefined" && chkNoMoveLeg) chkNoMoveLeg.checked = bNotToMoveLeg;
  if (typeof chkCaregiverAlert !== "undefined" && chkCaregiverAlert) chkCaregiverAlert.checked = bCaregiverAlert;
  if (typeof chkFaultAlert !== "undefined" && chkFaultAlert) chkFaultAlert.checked = bFaultAlert;
  // Settings page values
  const setNumber = (id, v) => { const el = document.getElementById(id); if (el) el.value = String(v); };
  const setCheck = (id, v) => { const el = document.getElementById(id); if (el) el.checked = !!v; };
  setNumber("taAutoturnInterval", AUTOTURN_INTERVAL);
  setNumber("taNumberOfTurns", NUMBER_OF_TURNS);
  setNumber("taSidebagFillInterval", SIDEBAG_FILL_INTERVAL);
  setNumber("taLegAirbagInterval", LEG_AIRBAG_INTERVAL);
  setNumber("taPostureCheckInterval", POSTURE_CHECK_INTERVAL);
  setNumber("taHoldTimeToCoolValves", HOLD_TIME_TO_COOL_VALVES);
  setNumber("taPressureFirm", PRESSURE_FIRM);
  setNumber("taPressureSitting", PRESSURE_SITTING);
  setNumber("taPressureReleased", PRESSURE_RELEASED);
  setNumber("taPressureMax", PRESSURE_MAX);
  setNumber("taPressureHysteresis", PRESSURE_HYSTERESIS);
  setNumber("taMinMattressTempC", MIN_MATTRESS_TEMP_C);
  setNumber("taMaxMattressTempC", MAX_MATTRESS_TEMP_C);
  setNumber("taMaxMattressRh", MAX_MATTRESS_RH);
  setNumber("taDeltaTemperatureC", DELTA_TEMPERATURE_C);
  setNumber("taHeatsinkMaxTempC", HEATSINK_MAX_TEMP_C);
  setCheck("noPillowMassage", bNoPillowMassage);
  setCheck("noCooling", bNoCooling);
  setCheck("redistPlusAlter", bRedistPlusAlter);
  setCheck("caregiverAlert", bCaregiverAlert);
  setCheck("faultAlert", bFaultAlert);
  updateUserInfoToDisplay();
  saveSettings();
}

function loadALLData(receivedString) {
  var dataLength = Math.floor(receivedString.length/3);
  const buffer = new ArrayBuffer(dataLength);
  var data = new Uint8Array(buffer);
  for (let i = 0; i < dataLength; i++) {
      data[i] = Number(receivedString.substring(i*3,(i+1)*3));
  }

  iWeight = data[0];
  iAge = data[1];
  iHeight = data[2];
  iEyeToHip = data[3];
  indexSex = data[4];
  valueSensory = data[5];
  valueMoisture = data[6];
  valueActivity = data[7];
  valueMobility = data[8];
  valueNutrition = data[9];
  valueShear = data[10];
  iBradenScore = data[11];
  setStaticPressure = data[12];
  setAutofirmPressure = data[13];
  setDurationRedistribute = data[14];
  setDurationAlternating = data[15];
  setAutoTurnAngle = data[16];
  operatingModeSelected = data[17];
  minuteToNextRedistribute = data[18];
  minuteToNextAlternating = data[19];
  minuteToNextAutoturn = data[20];
  minuteToNextMixedModeAction = data[21];
  percentPressurePoints = data[22];
  midBodyWidth = data[23];
  midBodyHeight = data[24];
  columnsEyeToHip = data[25];
  columnsEyeToHeel = data[26];
  degreeHipToThighs = data[27];

  updateUserInfoToDisplay();
  saveSettings();
}

function updateAndSaveBodyData(receivedString) {
  var dataLength = Math.floor(receivedString.length/3);
  const buffer = new ArrayBuffer(dataLength);
  var data = new Uint8Array(buffer);
  for (let i = 0; i < dataLength; i++) {
      data[i] = Number(receivedString.substring(i*3,(i+1)*3));
  }

  percentPressurePoints = data[0];
  midBodyWidth = data[1];
  midBodyHeight = data[2];
  columnsEyeToHip = data[3];
  columnsEyeToHeel = data[4];
  degreeHipToThighs = data[5];

  // Save to file?

  // Show BODY information on the PRS screen
}

function loadAndExecuteMPR(receivedString) {
  var dataLength = Math.floor(receivedString.length/3);
  const buffer = new ArrayBuffer(dataLength);
  var data = new Uint8Array(buffer);
  for (let i = 0; i < dataLength; i++) {
      data[i] = Number(receivedString.substring(i*3,(i+1)*3));
  }

  var minute = data[0] || 0;
  var nMsg = data[1] || 0;
  nBigSpontaneousMovements = data[2] || 0;
  nSmallSpontaneousMovements = data[3] || 0;

  if (nMsg === 1) minuteToNextRedistribute = minute;
  else if (nMsg === 2) minuteToNextAlternating = minute;
  else if (nMsg === 3) minuteToNextAutoturn = minute;
  else minuteToNextMixedModeAction = minute;

  window.__MPR_STATE__ = { minute: minute, nMsg: nMsg, t0: Date.now() };
  function updateCountdown() {
    updateSharedStatusBanner();
  }
  if (!window.__MPR_TICK__) {
    window.__MPR_TICK__ = setInterval(updateCountdown, 30000);
  }
  updateCountdown();

}

function saveSettings() {
  if (bResetToDefaults) {
    bResetToDefaults = false;
    setStaticPressure = 32;    
    setDurationRedistribute = 30;
    setDurationAlternating = 5; minuteToNextAlternating = setDurationAlternating;
    setAutoTurnAngle = 15;
    bNotToTurn = false;
    bNotToTurnRight = false;
    bNotToTurnLeft = false;
    bNotToMoveBack = false;
    bNotToMoveLeg = false;
    bCaregiverAlert = true;
    bFaultAlert = true;

    bNoPillowMassage = false;
    bNoCooling = false;
    bRedistPlusAlter = true;

    AUTOTURN_INTERVAL = 30;
    NUMBER_OF_TURNS = 2;
    SIDEBAG_FILL_INTERVAL = 10;
    LEG_AIRBAG_INTERVAL = 30;
    POSTURE_CHECK_INTERVAL = 120;
    HOLD_TIME_TO_COOL_VALVES = 1;

    PRESSURE_FIRM = 42;
    PRESSURE_SITTING = PRESSURE_FIRM + 10;
    PRESSURE_RELEASED = 16;
    PRESSURE_MAX = 80;
    PRESSURE_HYSTERESIS = 1;

    MIN_MATTRESS_TEMP_C = 25;
    MAX_MATTRESS_TEMP_C = 30;
    MAX_MATTRESS_RH = 85;
    DELTA_TEMPERATURE_C = 2;
    HEATSINK_MAX_TEMP_C = 65;
  }
  
  // Align autofirm with firm pressure
  setAutofirmPressure = PRESSURE_FIRM;

  setDurationRedistribute = clampIntInRange(setDurationRedistribute, 15, 60);
  setDurationAlternating = clampIntInRange(setDurationAlternating, 1, 15);
  setStaticPressure = clampIntInRange(setStaticPressure, 25, 40);

  AUTOTURN_INTERVAL = clampIntInRange(AUTOTURN_INTERVAL, 15, 60);
  NUMBER_OF_TURNS = clampIntInRange(NUMBER_OF_TURNS, 1, 4);
  SIDEBAG_FILL_INTERVAL = clampIntInRange(SIDEBAG_FILL_INTERVAL, 3, 20);
  LEG_AIRBAG_INTERVAL = clampIntInRange(LEG_AIRBAG_INTERVAL, 15, 60);
  POSTURE_CHECK_INTERVAL = clampIntInRange(POSTURE_CHECK_INTERVAL, 30, 120);
  HOLD_TIME_TO_COOL_VALVES = clampIntInRange(HOLD_TIME_TO_COOL_VALVES, 1, 3);

  PRESSURE_FIRM = clampIntInRange(PRESSURE_FIRM, 32, 52);
  PRESSURE_SITTING = clampIntInRange(PRESSURE_SITTING, PRESSURE_FIRM, PRESSURE_FIRM + 20);
  PRESSURE_RELEASED = clampIntInRange(PRESSURE_RELEASED, 10, setStaticPressure);
  PRESSURE_MAX = clampIntInRange(PRESSURE_MAX, 60, 120);
  PRESSURE_HYSTERESIS = clampIntInRange(PRESSURE_HYSTERESIS, 0, 3);

  MIN_MATTRESS_TEMP_C = clampIntInRange(MIN_MATTRESS_TEMP_C, 22, 30);
  MAX_MATTRESS_TEMP_C = clampIntInRange(MAX_MATTRESS_TEMP_C, 25, 33);
  MAX_MATTRESS_RH = clampIntInRange(MAX_MATTRESS_RH, 50, 95);
  DELTA_TEMPERATURE_C = clampIntInRange(DELTA_TEMPERATURE_C, 0, 5);
  HEATSINK_MAX_TEMP_C = clampIntInRange(HEATSINK_MAX_TEMP_C, 65, 75);

  // update display
  setValue("rangeStaticPressure", setStaticPressure);
  setValue("rangeDurationRedistribute", setDurationRedistribute);
  setValue("rangeDurationAlternating", setDurationAlternating);
  if (lblStaticPressure) lblStaticPressure.innerHTML = String(setStaticPressure);
  if (lblDurationRedistribute) lblDurationRedistribute.innerHTML = String(setDurationRedistribute);
  if (lblDurationAlternating) lblDurationAlternating.innerHTML = String(setDurationAlternating);

  setChecked("notToTurn", bNotToTurn);
  setChecked("notToTurnRight", bNotToTurnRight);
  setChecked("notToTurnLeft", bNotToTurnLeft);
  setChecked("notToMoveBack", bNotToMoveBack);
  setChecked("notToMoveLeg", bNotToMoveLeg);
  setChecked("caregiverAlert", bCaregiverAlert);
  setChecked("faultAlert", bFaultAlert);

  setChecked("noPillowMassage", bNoPillowMassage);
  setChecked("noCooling", bNoCooling);
  setChecked("redistPlusAlter", bRedistPlusAlter);

  setValue("taAutoturnInterval", AUTOTURN_INTERVAL);
  setValue("taNumberOfTurns", NUMBER_OF_TURNS);
  setValue("taSidebagFillInterval", SIDEBAG_FILL_INTERVAL);
  setValue("taLegAirbagInterval", LEG_AIRBAG_INTERVAL);
  setValue("taPostureCheckInterval", POSTURE_CHECK_INTERVAL);
  setValue("taHoldTimeToCoolValves", HOLD_TIME_TO_COOL_VALVES);

  setValue("taPressureFirm", PRESSURE_FIRM);
  setValue("taPressureSitting", PRESSURE_SITTING);
  setValue("taPressureReleased", PRESSURE_RELEASED);
  setValue("taPressureMax", PRESSURE_MAX);
  setValue("taPressureHysteresis", PRESSURE_HYSTERESIS);

  setValue("taMinMattressTempC", MIN_MATTRESS_TEMP_C);
  setValue("taMaxMattressTempC", MAX_MATTRESS_TEMP_C);
  setValue("taMaxMattressRh", MAX_MATTRESS_RH);
  setValue("taDeltaTemperatureC", DELTA_TEMPERATURE_C);
  setValue("taHeatsinkMaxTempC", HEATSINK_MAX_TEMP_C);

  setMinMax("taPressureReleased", 10, setStaticPressure);
  setMinMax("taPressureSitting", PRESSURE_FIRM, PRESSURE_FIRM + 20);

  // save to file

}

function setDefaultValues() {
  bResetToDefaults = true;
  saveSettings();
  executeSendAllX(); // Send #ALLX command to sync defaults to ACM
}

function setUserInformation() {
  if (window.SmartbedUICommon) window.SmartbedUICommon.showUserInformation();
}

function showExtraSettings() {
  const setting = document.getElementById("settingContainer");
  const bg = document.getElementById("backgroundContainer");
  const extra = document.getElementById("extraSettingsContainer");
  if (setting) setting.style.display = "none";
  if (bg) bg.style.display = "none";
  if (extra) extra.style.display = "block";
  writeOnCharacteristic("#RTHRS");
  setTimeout(()=>{ if (typeof requestAllowlist === "function") requestAllowlist(); }, 300);
}

function returnFromExtraSettings() {
  const setting = document.getElementById("settingContainer");
  const bg = document.getElementById("backgroundContainer");
  const extra = document.getElementById("extraSettingsContainer");
  if (extra) extra.style.display = "none";
  if (bg) bg.style.display = "block";
  if (setting) setting.style.display = "block";
}

function setSmartbedControl() {
  if (window.SmartbedUICommon) window.SmartbedUICommon.showSmartbedControl();
  writeOnCharacteristic("#RPRS");
}

function setSaveUserInfoAndReturn() {
  if (typeof updateUserInfoFromDisplay === "function") updateUserInfoFromDisplay();
  executeSendUserInfo();
  if (window.SmartbedUICommon) window.SmartbedUICommon.returnFromUserInformation();
} 

function executeSendUserInfo() {
  executeSendAllX();
}

function executeSendAllX() {
  var s = "#ALLX";
  
  // 1. ALL data (28 bytes)
  s += get3DigitString(iWeight) + get3DigitString(iAge) + get3DigitString(iHeight) + get3DigitString(iEyeToHip) + get3DigitString(indexSex);
  s += get3DigitString(valueSensory) + get3DigitString(valueMoisture) + get3DigitString(valueActivity) + get3DigitString(valueMobility);
  s += get3DigitString(valueNutrition) + get3DigitString(valueShear) + get3DigitString(iBradenScore);
  s += get3DigitString(setStaticPressure) + get3DigitString(setAutofirmPressure) + get3DigitString(setDurationRedistribute) + get3DigitString(setDurationAlternating);        
  s += get3DigitString(setAutoTurnAngle) + get3DigitString(operatingModeSelected) + get3DigitString(minuteToNextRedistribute) + get3DigitString(minuteToNextAlternating);       
  s += get3DigitString(minuteToNextAutoturn) + get3DigitString(minuteToNextMixedModeAction);
  s += get3DigitString(percentPressurePoints) + get3DigitString(midBodyWidth) + get3DigitString(midBodyHeight);
  s += get3DigitString(columnsEyeToHip) + get3DigitString(columnsEyeToHeel) + get3DigitString(degreeHipToThighs);

  // 2. SETX data (22 bytes; last 2 are caregiver/fault alerts)
  s += get3DigitString(1); // setxHeader
  s += get3DigitString(bNoPillowMassage?1:0) + get3DigitString(bNoCooling?1:0) + get3DigitString(bRedistPlusAlter?1:0);
  s += get3DigitString(AUTOTURN_INTERVAL) + get3DigitString(NUMBER_OF_TURNS);
  s += get3DigitString(SIDEBAG_FILL_INTERVAL) + get3DigitString(LEG_AIRBAG_INTERVAL) + get3DigitString(POSTURE_CHECK_INTERVAL) + get3DigitString(HOLD_TIME_TO_COOL_VALVES);
  s += get3DigitString(PRESSURE_FIRM) + get3DigitString(PRESSURE_SITTING) + get3DigitString(PRESSURE_RELEASED);
  s += get3DigitString(PRESSURE_MAX) + get3DigitString(PRESSURE_HYSTERESIS);
  s += get3DigitString(MIN_MATTRESS_TEMP_C) + get3DigitString(MAX_MATTRESS_TEMP_C) + get3DigitString(MAX_MATTRESS_RH);
  s += get3DigitString(DELTA_TEMPERATURE_C) + get3DigitString(HEATSINK_MAX_TEMP_C);
  s += get3DigitString(bCaregiverAlert?1:0) + get3DigitString(bFaultAlert?1:0);

  // 4. Name data
  let nameStr = document.getElementById("taName").value;
  if (!nameStr) nameStr = "Jane Doe";
  let maxNameLen = Math.min(nameStr.length, 20); // keep reasonable limit
  s += get3DigitString(maxNameLen);
  for (let i = 0; i < maxNameLen; i++) {
    s += get3DigitString(nameStr.charCodeAt(i));
  }

  // Debounce duplicate #ALLX within a short window to avoid double-send
  if (window.__lastAllx && window.__lastAllx.msg === s && (Date.now() - window.__lastAllx.at) < 1200) {
    console.log("Skipped duplicate #ALLX within debounce window");
  } else {
    window.__lastAllx = { msg: s, at: Date.now() };
  }
  // Send #ALLX then (if non-empty) #REMS sequentially to avoid BLE write overlap
  writeOnCharacteristic(s).then(() => {
    const remEl = document.getElementById("taReminders");
    let remStr = remEl && typeof remEl.value === "string" ? remEl.value : "";
    if (remStr) remStr = remStr.trim();
    if (remStr.length > 0) {
      if (remStr.length > 150) remStr = remStr.substring(0, 150);
      let r = "#REMS";
      r += get3DigitString(remStr.length);
      for (let i = 0; i < remStr.length; i++) {
        r += get3DigitString(remStr.charCodeAt(i));
      }
      return writeOnCharacteristic(r).then(()=>{ showRemsToast("Saved"); });
    }
  }).catch(()=>{});
}

function executeSendAll() {
  executeSendAllX();
}

function sendThresholdsFromUI() {
  const p = Number(document.getElementById("thrOccPressDelta")?.value || 5);
  const dtC = Number(document.getElementById("thrOccTempDeltaC")?.value || 0.7);
  const s = Number(document.getElementById("thrSettleSec")?.value || 60);
  const e = Number(document.getElementById("thrEdgeHighDelta")?.value || 15);
  const sc = Number(document.getElementById("thrSitCenterDelta")?.value || 15);
  const fc = Number(document.getElementById("thrFewCountMax")?.value || 6);
  const clamp = (n,min,max)=>Math.max(min,Math.min(max,Math.round(n)));
  const P = clamp(p,0,30);
  const DT10 = clamp(Math.round(dtC*10),0,50);
  const S = clamp(s,0,255);
  const E = clamp(e,0,40);
  const SC = clamp(sc,0,40);
  const FC = clamp(fc,0,10);
  let sCmd = "#THRS";
  sCmd += get3DigitString(P);
  sCmd += get3DigitString(DT10);
  sCmd += get3DigitString(S);
  sCmd += get3DigitString(E);
  sCmd += get3DigitString(SC);
  sCmd += get3DigitString(FC);
  writeOnCharacteristic(sCmd);
}

function requestThresholds() {
  writeOnCharacteristic("#RTHRS");
}

function updateRemCounter() {
  const el = document.getElementById("taReminders");
  const ctr = document.getElementById("remCounter");
  if (!el || !ctr) return;
  let v = el.value || "";
  if (v.length > 150) v = v.substring(0, 150);
  if (v !== el.value) el.value = v;
  ctr.textContent = v.length + "/150";
}

function showRemsToast(text) {
  const elRem = document.getElementById("taReminders");
  if (!elRem) return;
  let toast = document.getElementById("remsToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "remsToast";
    toast.style.position = "absolute";
    toast.style.background = "rgba(0,0,0,0.8)";
    toast.style.color = "white";
    toast.style.padding = "4px 8px";
    toast.style.borderRadius = "6px";
    toast.style.fontSize = "12px";
    toast.style.zIndex = "2000";
    document.body.appendChild(toast);
  }
  toast.textContent = text || "Saved";
  const rect = elRem.getBoundingClientRect();
  toast.style.left = (rect.right - 70) + "px";
  toast.style.top = (rect.top - 28) + "px";
  toast.style.display = "block";
  if (window.__remsToastTimer) clearTimeout(window.__remsToastTimer);
  window.__remsToastTimer = setTimeout(() => { toast.style.display = "none"; }, 1500);
}

function updateUserInfoFromDisplay() {
  const elWeight = document.getElementById("taBodyWeight");
  const elAge = document.getElementById("taAge");
  const elHeight = document.getElementById("taBodyHeight");
  const elEyeToHip = document.getElementById("taEyeToHip");
  const elSex = document.getElementById("ddSex");
  const elSensory = document.getElementById("ddSensory");
  const elMoisture = document.getElementById("ddMoisture");
  const elActivity = document.getElementById("ddActivity");
  const elMobility = document.getElementById("ddMobility");
  const elNutrition = document.getElementById("ddNutrition");
  const elShear = document.getElementById("ddShear");
  if (elWeight) iWeight = Number(elWeight.value);
  if (elAge) iAge = Number(elAge.value);
  if (elHeight) iHeight = Number(elHeight.value);
  if (elEyeToHip) iEyeToHip = Number(elEyeToHip.value);
  if (elSex) indexSex = Number(elSex.value);
  if (iHeight > 100) fBMI = iWeight * 10000 / (iHeight * iHeight);
  // console.log("iWeight: ", iWeight);
  // console.log("iHeight: ", iHeight);
  // console.log("fBMI: ", fBMI);
  if (typeof lblBMI !== "undefined" && lblBMI) lblBMI.textContent = parseFloat(String(fBMI)).toFixed(2);
  if (elSensory) valueSensory = Number(elSensory.value);
  if (elMoisture) valueMoisture = Number(elMoisture.value);
  if (elActivity) valueActivity = Number(elActivity.value);
  if (elMobility) valueMobility = Number(elMobility.value);
  if (elNutrition) valueNutrition = Number(elNutrition.value);
  if (elShear) valueShear = Number(elShear.value);
  iBradenScore = valueSensory + valueMoisture + valueActivity + valueMobility + valueNutrition + valueShear;
  if (lblBradenScoreUser) lblBradenScoreUser.textContent = String(iBradenScore);
  const lblBradenScorePRS = document.getElementById("lblBradenScorePRS");
  if (lblBradenScorePRS) lblBradenScorePRS.textContent = String(iBradenScore);
  const lblShear = document.getElementById("lblShear");
  if (lblShear) lblShear.textContent = String(valueShear);
  const lblMobility = document.getElementById("lblMobility");
  if (lblMobility) lblMobility.textContent = String(valueMobility);
}

function updateUserInfoToDisplay() {
  const setIfExists = (id, prop, value) => {
    const el = document.getElementById(id);
    if (el && prop in el) el[prop] = String(value);
  };
  setIfExists("taBodyWeight", "value", iWeight);
  setIfExists("taAge", "value", iAge);
  setIfExists("taBodyHeight", "value", iHeight);
  setIfExists("taEyeToHip", "value", iEyeToHip);
  if (ddSex) ddSex.value = indexSex;
  const dd = (id) => document.getElementById(id);
  const s = dd("ddSensory"); if (s) s.value = String(valueSensory);
  const m = dd("ddMoisture"); if (m) m.value = String(valueMoisture);
  const a = dd("ddActivity"); if (a) a.value = String(valueActivity);
  const mob = dd("ddMobility"); if (mob) mob.value = String(valueMobility);
  const n = dd("ddNutrition"); if (n) n.value = String(valueNutrition);
  const sh = dd("ddShear"); if (sh) sh.value = String(valueShear);

  if (iHeight > 100) fBMI = iWeight * 10000 / (iHeight * iHeight);
  iBradenScore = valueSensory + valueMoisture + valueActivity + valueMobility + valueNutrition + valueShear;

  const setTextIfExists = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value);
  };
  // Show BMI (1 decimal) and Braden totals on User Information and PRS headers
  if (typeof lblBMI !== "undefined" && lblBMI) lblBMI.textContent = parseFloat(String(fBMI)).toFixed(1);
  const lblBradenScoreUser = document.getElementById("lblBradenScoreUser");
  if (lblBradenScoreUser) lblBradenScoreUser.textContent = String(iBradenScore);
  const lblBradenScorePRS = document.getElementById("lblBradenScorePRS");
  if (lblBradenScorePRS) lblBradenScorePRS.textContent = String(iBradenScore);
  // Update PRS panel Shear and Mobility if present
  const lblShear = document.getElementById("lblShear");
  if (lblShear) lblShear.textContent = String(valueShear);
  const lblMobility = document.getElementById("lblMobility");
  if (lblMobility) lblMobility.textContent = String(valueMobility);

  setTextIfExists("taBodyPercent", percentPressurePoints);
  setTextIfExists("taBodyWidth", midBodyWidth);
  setTextIfExists("taBodyHeight", midBodyHeight);
  setTextIfExists("taEye2HipCols", columnsEyeToHip);
  setTextIfExists("taEye2HeelCols", columnsEyeToHeel);
  setTextIfExists("taHip2ThighsAngle", degreeHipToThighs);
}

function setSaveSmartbedControlInfoAndReturn() {
  bDefaultPRSNotYetModified = false;// once PRS screen has been opened and saved, assume decided to modify or not modify the default PRS values
  if (bSetPressureReleaseSettingDefault) {
    bSetPressureReleaseSettingDefault = false;
    setPressureReleaseSettingDefaultValues(); // also set the PRS values for the BSUSED row
    updatePressureReleaseSettingToDisplay();
  } else updatePressureReleaseSettingFromDisplay();

  savePressureReleaseSetting(); // May be want to save in computer
  executeSendPressureReleaseSettingToAIRBED();
  if (window.SmartbedUICommon) window.SmartbedUICommon.returnFromSmartbedControl();
}

function setPRSDefaultValues() {
  setPressureReleaseSettingDefaultValues();
  updatePressureReleaseSettingToDisplay();
  bSetPressureReleaseSettingDefault = false;
}

function setPressureReleaseSettingDefaultValues() {
  // set ixxx to default values based on iBradenScore/iBradenScoreIndex. Also, keep the current settings in the BSUSED row
  iDurationP1 = prsDuration[iBradenScoreIndex][1]; prsDuration[BSUSED][1] = iDurationP1;
  iDurationP2 = prsDuration[iBradenScoreIndex][2]; prsDuration[BSUSED][2] = iDurationP2;
  iDurationP3 = prsDuration[iBradenScoreIndex][3]; prsDuration[BSUSED][3] = iDurationP3;
  iDurationP4 = prsDuration[iBradenScoreIndex][4]; prsDuration[BSUSED][4] = iDurationP4;
  iBackAngleP1 = prsBackAngle[iBradenScoreIndex][1]; prsBackAngle[BSUSED][1] = iBackAngleP1;
  iBackAngleP2 = prsBackAngle[iBradenScoreIndex][2]; prsBackAngle[BSUSED][2] = iBackAngleP2;
  iBackAngleP3 = prsBackAngle[iBradenScoreIndex][3]; prsBackAngle[BSUSED][3] = iBackAngleP3;
  iBackAngleP4 = prsBackAngle[iBradenScoreIndex][4]; prsBackAngle[BSUSED][4] = iBackAngleP4;
  iLegAngleP1 = prsLegAngle[iBradenScoreIndex][1]; prsLegAngle[BSUSED][1] = iLegAngleP1;
  iLegAngleP2 = prsLegAngle[iBradenScoreIndex][2]; prsLegAngle[BSUSED][2] = iLegAngleP2;
  iLegAngleP3 = prsLegAngle[iBradenScoreIndex][3]; prsLegAngle[BSUSED][3] = iLegAngleP3;
  iLegAngleP4 = prsLegAngle[iBradenScoreIndex][4]; prsLegAngle[BSUSED][4] = iLegAngleP4;
  iTurnAngleP1 = prsTurnAngle[iBradenScoreIndex][1]; prsTurnAngle[BSUSED][1] = iTurnAngleP1;
  iTurnAngleP2 = prsTurnAngle[iBradenScoreIndex][2]; prsTurnAngle[BSUSED][2] = iTurnAngleP2;
  //iTurnAngleP3 = prsTurnAngle[iBradenScoreIndex][3]; prsTurnAngle[BSUSED][3] = iTurnAngleP3;
  iTurnAngleP3 = minTurnAngle * valueShear; prsTurnAngle[BSUSED][3] = iTurnAngleP3;
  iTurnAngleP4 = prsTurnAngle[iBradenScoreIndex][4]; prsTurnAngle[BSUSED][4] = iTurnAngleP4;
  //iStepAngle = prsStepAngle[iBradenScoreIndex][1]; prsStepAngle[BSUSED][1] = prsStepAngle[BSUSED][2] = prsStepAngle[BSUSED][3] = prsStepAngle[BSUSED][4] = iStepAngle;
  iStepAngle =  minStepAngle * valueShear; prsStepAngle[BSUSED][1] = prsStepAngle[BSUSED][2] = prsStepAngle[BSUSED][3] = prsStepAngle[BSUSED][4] = iStepAngle;
  iDurationInTurnPosition = prsDurationInTurnPosition[iBradenScoreIndex][1]; prsDurationInTurnPosition[BSUSED][1] = prsDurationInTurnPosition[BSUSED][2] = prsDurationInTurnPosition[BSUSED][3] = prsDurationInTurnPosition[BSUSED][4] = iDurationInTurnPosition;
  iDurationInFlatPosition = prsDurationInFlatPosition[iBradenScoreIndex][1]; prsDurationInFlatPosition[BSUSED][1] = prsDurationInFlatPosition[BSUSED][2] = prsDurationInFlatPosition[BSUSED][3] = prsDurationInFlatPosition[BSUSED][4] = iDurationInFlatPosition;
  iDurationAlternating = prsDurationAlternating[iBradenScoreIndex][1]; prsDurationAlternating[BSUSED][1] = prsDurationAlternating[BSUSED][2] = prsDurationAlternating[BSUSED][3] = prsDurationAlternating[BSUSED][4] = iDurationAlternating;
}

function updatePressureReleaseSettingToDisplay() {
  if (window.SmartbedUICommon && typeof window.SmartbedUICommon.setPrsFields === "function") {
    window.SmartbedUICommon.setPrsFields({
      durationP1: iDurationP1,
      durationP2: iDurationP2,
      durationP3: iDurationP3,
      durationP4: iDurationP4,
      backAngleP1: iBackAngleP1,
      backAngleP2: iBackAngleP2,
      backAngleP3: iBackAngleP3,
      backAngleP4: iBackAngleP4,
      legAngleP1: iLegAngleP1,
      legAngleP2: iLegAngleP2,
      legAngleP3: iLegAngleP3,
      legAngleP4: iLegAngleP4,
      turnAngleP1: iTurnAngleP1,
      turnAngleP2: iTurnAngleP2,
      turnAngleP3: iTurnAngleP3,
      turnAngleP4: iTurnAngleP4,
      durationInTurnPosition: iDurationInTurnPosition,
      durationInFlatPosition: iDurationInFlatPosition,
      durationAlternating: iDurationAlternating,
      bradenScore: iBradenScore,
      shear: valueShear,
      mobility: valueMobility,
    });
    // Continue to update DOM directly to ensure BLE GUI page reflects values
  }

  const setVal = (id,val)=>{ const el=document.getElementById(id); if (el) el.value = String(val); };
  setVal("taDurationP1", iDurationP1);
  setVal("taDurationP2", iDurationP2);
  setVal("taDurationP3", iDurationP3);
  setVal("taDurationP4", iDurationP4);
  setVal("taBackAngleP1", iBackAngleP1);
  setVal("taBackAngleP2", iBackAngleP2);
  setVal("taBackAngleP3", iBackAngleP3);
  setVal("taBackAngleP4", iBackAngleP4);
  setVal("taLegAngleP1", iLegAngleP1);
  setVal("taLegAngleP2", iLegAngleP2);
  setVal("taLegAngleP3", iLegAngleP3);
  setVal("taLegAngleP4", iLegAngleP4);
  setVal("taTurnAngleP1", iTurnAngleP1);
  setVal("taTurnAngleP2", iTurnAngleP2);
  setVal("taTurnAngleP3", iTurnAngleP3);
  setVal("taTurnAngleP4", iTurnAngleP4);
  setVal("taDurationInTurnPosition", iDurationInTurnPosition);
  setVal("taDurationInFlatPosition", iDurationInFlatPosition);
  setVal("taDurationAlternating", iDurationAlternating);
  const setText = (id,val)=>{ const el=document.getElementById(id); if (el) el.textContent = String(val); };
  setText("lblBradenScorePRS", iBradenScore);
  setText("lblShear", valueShear);
  setText("lblMobility", valueMobility);
}

function updatePressureReleaseSettingFromDisplay() {
  if (window.SmartbedUICommon && typeof window.SmartbedUICommon.getPrsFields === "function") {
    const fields = window.SmartbedUICommon.getPrsFields();
    iDurationP1 = fields.durationP1;
    iDurationP2 = fields.durationP2;
    iDurationP3 = fields.durationP3;
    iDurationP4 = fields.durationP4;
    iBackAngleP1 = fields.backAngleP1;
    iBackAngleP2 = fields.backAngleP2;
    iBackAngleP3 = fields.backAngleP3;
    iBackAngleP4 = fields.backAngleP4;
    iLegAngleP1 = fields.legAngleP1;
    iLegAngleP2 = fields.legAngleP2;
    iLegAngleP3 = fields.legAngleP3;
    iLegAngleP4 = fields.legAngleP4;
    iTurnAngleP1 = fields.turnAngleP1;
    iTurnAngleP2 = fields.turnAngleP2;
    iTurnAngleP3 = fields.turnAngleP3;
    iTurnAngleP4 = fields.turnAngleP4;
    iDurationInTurnPosition = fields.durationInTurnPosition;
    iDurationInFlatPosition = fields.durationInFlatPosition;
    iDurationAlternating = fields.durationAlternating;
    return;
  }

  iDurationP1 = Number(document.getElementById("taDurationP1").value);
  iDurationP2 = Number(document.getElementById("taDurationP2").value);
  iDurationP3 = Number(document.getElementById("taDurationP3").value);
  iDurationP4 = Number(document.getElementById("taDurationP4").value);
  iBackAngleP1 = Number(document.getElementById("taBackAngleP1").value);
  iBackAngleP2 = Number(document.getElementById("taBackAngleP2").value);
  iBackAngleP3 = Number(document.getElementById("taBackAngleP3").value);
  iBackAngleP4 = Number(document.getElementById("taBackAngleP4").value);
  iLegAngleP1 = Number(document.getElementById("taLegAngleP1").value);
  iLegAngleP2 = Number(document.getElementById("taLegAngleP2").value);
  iLegAngleP3 = Number(document.getElementById("taLegAngleP3").value);
  iLegAngleP4 = Number(document.getElementById("taLegAngleP4").value);
  iTurnAngleP1 = Number(document.getElementById("taTurnAngleP1").value);
  iTurnAngleP2 = Number(document.getElementById("taTurnAngleP2").value);
  iTurnAngleP3 = Number(document.getElementById("taTurnAngleP3").value);
  iTurnAngleP4 = Number(document.getElementById("taTurnAngleP4").value);
  iDurationInTurnPosition = Number(document.getElementById("taDurationInTurnPosition").value);
  iDurationInFlatPosition = Number(document.getElementById("taDurationInFlatPosition").value);
  iDurationAlternating = Number(document.getElementById("taDurationAlternating").value);
}

function savePressureReleaseSetting() {
  // May be want to save in computer
}

function executeSendPressureReleaseSettingToAIRBED() {
  var s = "#PRS";
  s += get3DigitString(iDurationP1) + get3DigitString(iDurationP2) + get3DigitString(iDurationP3) + get3DigitString(iDurationP4);
  s += get3DigitString(iBackAngleP1) + get3DigitString(iBackAngleP2) + get3DigitString(iBackAngleP3) + get3DigitString(iBackAngleP4);
  s += get3DigitString(iLegAngleP1) + get3DigitString(iLegAngleP2) + get3DigitString(iLegAngleP3) + get3DigitString(iLegAngleP4);
  s += get3DigitString(iTurnAngleP1) + get3DigitString(iTurnAngleP2) + get3DigitString(iTurnAngleP3) + get3DigitString(iTurnAngleP4);
  s += get3DigitString(iDurationInTurnPosition) + get3DigitString(iDurationInFlatPosition) + get3DigitString(iDurationAlternating);
  writeOnCharacteristic(s);
}

function executeSettingChangedActions() {
  saveSettings();
  executeSendAllX();
}

function executeSendMeasureBody() {
  //To instruct AIRBED to measure body parameters
  writeOnCharacteristic("#MEASURE");
}

function executeSendSettings() {
  executeSendAll();
}

function executeSendSettingsExtended() {
  var s = "#SETX";
  s += get3DigitString(1);
  s += get3DigitString(bNoPillowMassage?1:0) + get3DigitString(bNoCooling?1:0) + get3DigitString(bRedistPlusAlter?1:0);
  s += get3DigitString(AUTOTURN_INTERVAL) + get3DigitString(NUMBER_OF_TURNS);
  s += get3DigitString(SIDEBAG_FILL_INTERVAL) + get3DigitString(LEG_AIRBAG_INTERVAL) + get3DigitString(POSTURE_CHECK_INTERVAL) + get3DigitString(HOLD_TIME_TO_COOL_VALVES);
  s += get3DigitString(PRESSURE_FIRM) + get3DigitString(PRESSURE_SITTING) + get3DigitString(PRESSURE_RELEASED);
  s += get3DigitString(PRESSURE_MAX) + get3DigitString(PRESSURE_HYSTERESIS);
  s += get3DigitString(MIN_MATTRESS_TEMP_C) + get3DigitString(MAX_MATTRESS_TEMP_C) + get3DigitString(MAX_MATTRESS_RH);
  s += get3DigitString(DELTA_TEMPERATURE_C) + get3DigitString(HEATSINK_MAX_TEMP_C);
  writeOnCharacteristic(s);
}

function get3DigitString(n) {
  var s;
  if (n >= 255) s = "255"; 
  else if (n >= 100) s = String(n);
  else if (n >= 10) s = "0" + String(n);
  else if (n >= 0) s = "00" + String(n);
  return s;
}

function getAndDisplayTime() {
  setTimestampNow();
}

function getDateTime() {
  let currentdate = new Date();
  let day = ("00" + currentdate.getDate()).slice(-2); // Convert day to string and slice
  let month = ("00" + (currentdate.getMonth() + 1)).slice(-2);
  let year = currentdate.getFullYear();
  let hours = ("00" + currentdate.getHours()).slice(-2);
  let minutes = ("00" + currentdate.getMinutes()).slice(-2);
  let seconds = ("00" + currentdate.getSeconds()).slice(-2);

  let datetime = day + "/" + month + "/" + year + " at " + hours + ":" + minutes + ":" + seconds;
  return datetime;
}

function clampByte(n) {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 255) return 255;
  return v;
}

function clampIntInRange(n, min, max) {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return min;
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

function setChecked(id, checked) {
  const el = document.getElementById(id);
  if (!el) return;
  el.checked = !!checked;
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = String(value);
}

function setMinMax(id, min, max) {
  const el = document.getElementById(id);
  if (!el) return;
  el.min = String(min);
  el.max = String(max);
}

window.addEventListener("DOMContentLoaded", () => {
  setPressureScanStatus("Scan: idle", "");
  if (!window.SmartbedUICommon) return;
  window.SmartbedUICommon.init({
    connectButtonId: "bleButton",
    connectContainerId: "bleContainer",
    hasAllBeds: false,
    send: (cmd) => writeOnCharacteristic(cmd),
  });
});

function changeSliderSetting(setting) {
  const el = document.getElementById(setting);
  if (!el) return;
  const v = Number(el.value);

  if (setting == "rangeStaticPressure") {
    setStaticPressure = clampIntInRange(v, 25, 40);
    el.value = String(setStaticPressure);
    if (lblStaticPressure) lblStaticPressure.innerHTML = el.value;
  }
  else if (setting == "rangeDurationRedistribute") {
    setDurationRedistribute = clampIntInRange(v, 15, 60);
    el.value = String(setDurationRedistribute);
    if (lblDurationRedistribute) lblDurationRedistribute.innerHTML = el.value;
  }
  else if (setting == "rangeDurationAlternating") {
    setDurationAlternating = clampIntInRange(v, 1, 15);
    el.value = String(setDurationAlternating);
    if (lblDurationAlternating) lblDurationAlternating.innerHTML = el.value;
  }
  else if (setting == "taAutoturnInterval") {AUTOTURN_INTERVAL = clampIntInRange(v, 15, 60); el.value = String(AUTOTURN_INTERVAL);}
  else if (setting == "taNumberOfTurns") {NUMBER_OF_TURNS = clampIntInRange(v, 1, 4); el.value = String(NUMBER_OF_TURNS);}
  else if (setting == "taSidebagFillInterval") {SIDEBAG_FILL_INTERVAL = clampIntInRange(v, 5, 20); el.value = String(SIDEBAG_FILL_INTERVAL);}
  else if (setting == "taLegAirbagInterval") {LEG_AIRBAG_INTERVAL = clampIntInRange(v, 15, 60); el.value = String(LEG_AIRBAG_INTERVAL);}
  else if (setting == "taPostureCheckInterval") {POSTURE_CHECK_INTERVAL = clampIntInRange(v, 30, 120); el.value = String(POSTURE_CHECK_INTERVAL);}
  else if (setting == "taHoldTimeToCoolValves") {HOLD_TIME_TO_COOL_VALVES = clampIntInRange(v, 1, 3); el.value = String(HOLD_TIME_TO_COOL_VALVES);}
  else if (setting == "taPressureFirm") {PRESSURE_FIRM = clampIntInRange(v, 32, 52); el.value = String(PRESSURE_FIRM);}
  else if (setting == "taPressureSitting") {PRESSURE_SITTING = clampIntInRange(v, PRESSURE_FIRM, PRESSURE_FIRM + 20); el.value = String(PRESSURE_SITTING);}
  else if (setting == "taPressureReleased") {PRESSURE_RELEASED = clampIntInRange(v, 10, setStaticPressure + 10); el.value = String(PRESSURE_RELEASED);}
  else if (setting == "taPressureMax") {PRESSURE_MAX = clampIntInRange(v, 60, 120); el.value = String(PRESSURE_MAX);}
  else if (setting == "taPressureHysteresis") {PRESSURE_HYSTERESIS = clampIntInRange(v, 0, 3); el.value = String(PRESSURE_HYSTERESIS);}
  else if (setting == "taMinMattressTempC") {MIN_MATTRESS_TEMP_C = clampIntInRange(v, 22, 30); el.value = String(MIN_MATTRESS_TEMP_C);}
  else if (setting == "taMaxMattressTempC") {MAX_MATTRESS_TEMP_C = clampIntInRange(v, 25, 33); el.value = String(MAX_MATTRESS_TEMP_C);}
  else if (setting == "taMaxMattressRh") {MAX_MATTRESS_RH = clampIntInRange(v, 50, 95); el.value = String(MAX_MATTRESS_RH);}
  else if (setting == "taDeltaTemperatureC") {DELTA_TEMPERATURE_C = clampIntInRange(v, 0, 5); el.value = String(DELTA_TEMPERATURE_C);}
  else if (setting == "taHeatsinkMaxTempC") {HEATSINK_MAX_TEMP_C = clampIntInRange(v, 65, 75); el.value = String(HEATSINK_MAX_TEMP_C);}

  executeSettingChangedActions();
}

function checkbox_click(clicked) {
  const el = document.getElementById(clicked);
  const checked = !!(el && el.checked);

  if (clicked == "notToTurn") bNotToTurn = checked;
  else if (clicked == "notToTurnRight") bNotToTurnRight = checked;
  else if (clicked == "notToTurnLeft") bNotToTurnLeft = checked;
  else if (clicked == "notToMoveBack") bNotToMoveBack = checked;
  else if (clicked == "notToMoveLeg") bNotToMoveLeg = checked;
  else if (clicked == "caregiverAlert") bCaregiverAlert = checked;
  else if (clicked == "faultAlert") bFaultAlert = checked;
  else if (clicked == "noPillowMassage") bNoPillowMassage = checked;
  else if (clicked == "noCooling") bNoCooling = checked;
  else if (clicked == "redistPlusAlter") bRedistPlusAlter = checked;

  executeSettingChangedActions();
}

// To do something similar to Arduino loop(), may set up a polling function until timeout or onclick, or never ends
// function pollFunc(fn, timeout, interval) {
//     var startTime = (new Date()).getTime();
//     interval = interval || 1000,
//     canPoll = true;

//     (function p() {
//         canPoll = ((new Date).getTime() - startTime ) <= timeout;
//         if (!fn() && canPoll)  { // ensures the function exucutes
//             setTimeout(p, interval);
//         }
//     })();
// }

// pollFunc(sendHeartBeat, 60000, 1000);

// function sendHeartBeat(params) {
//     ...
//     ...
//     if (toStopConditionHappened) {
//         // no need to execute further
//         return true; // or false
//     }
// }
