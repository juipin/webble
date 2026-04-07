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

// Using ArrayBuffer with TypedArray instead of normal array as it uses contiguous memory space, allow direct memory manipulation, faster calculation, and conserve space
const buffer1 = new ArrayBuffer(960);
let imageGreyPixelArray = new Uint8Array(buffer1);
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
if (table) {
  const rows = table.getElementsByTagName('tr');
  Array.from(rows).forEach((row) => {
    row.addEventListener('click', () => {
      const cells = row.getElementsByTagName('td');
      if (cells.length > 7) cells[7].textContent = "";
    });
  });
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

// Pressure Map
const maxProbabilityLabel = document.getElementById('maxProbabilityLabel');
const maxProbability = document.getElementById('maxProbability');
const pressureMapCanvas = document.getElementById('pressureMapCanvas');
const isAccumulatedPressure = document.getElementById('isAccumulatedPressure');
let isAccumulatedPressureChecked = false;
if (isAccumulatedPressure.checked) isAccumulatedPressureChecked = true;

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
  "Right",
  "Left",
  "Supine",
  "Unknown",
  "Sit on Right Edge",
  "Sit on Left Edge",
  "Sit on Bed",
  "Sleep on Right Edge",
  "Sleep on Left Edge",
  "Prone"
];
const ctx = pressureMapCanvas.getContext("2d");
ctx.fillStyle = "grey";
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
    const scheduleMs = 7500;
    setTimeout(() => {
      if (bleTransmitServer && bleTransmitServer.connected && !window.__seenAllx) {
        writeOnCharacteristic("#RALLX")
          .then(() => new Promise(res => setTimeout(res, 600)))
          .then(() => writeOnCharacteristic("#RALL"))
          .then(() => new Promise(res => setTimeout(res, 600)))
          .then(() => writeOnCharacteristic("#RSETX"))
          .then(() => new Promise(res => setTimeout(res, 600)))
          .then(() => writeOnCharacteristic("#RSETS"))
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
  console.log("handleCharacteristicChange");
  const rawValue = event.target.value;
  const bytes = new Uint8Array(rawValue.buffer, rawValue.byteOffset, rawValue.byteLength);
 
  // Byte-buffer accumulator (robust to binary payloads and MTU fragmentation)
  if (!window.__rxBytes) window.__rxBytes = new Uint8Array(0);
  if (bytes.length > 0) {
    console.log("bytes: ", bytes);
    console.log("bytes.length: ", bytes.length);
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
 
  // Drop leading garbage until '#'
  const firstHashIdx = window.__rxBytes.indexOf(35); // '#'
  if (firstHashIdx > 0) {
    window.__rxBytes = window.__rxBytes.slice(firstHashIdx);
  }
 
  // 1) Pressure map packets (#PSMAP## / #PZMAP##) - binary payload follows 8-byte header
  while (window.__rxBytes.length >= 9) {
    const header8 = decodeAscii(window.__rxBytes, 0, 8);
    if (header8 === "#PSMAP##" || header8 === "#PZMAP##") {
      const need = 9 + pixelsPerPackage;
      if (window.__rxBytes.length < need) break;
      const colStart = window.__rxBytes[8];
      const packageNumber = Math.floor(colStart / 6);
      pixelCount = packageNumber * pixelsPerPackage;
      for (let i = 0; i < pixelsPerPackage; i++) {
        if ((pixelCount + i) >= totalPixelCount) break;
        imageGreyPixelArray[pixelCount + i] = window.__rxBytes[9 + i];
      }
      container = document.getElementById("pressuremapContainer");
      if (pixelCount >= 840 && container.style.display == "block") {
        if (header8 === "#PSMAP##") drawPSColorMap();
        else drawPZColorMap();
      }
      window.__rxBytes = window.__rxBytes.slice(need);
      continue;
    }
    break;
  }
 
  // Note: #ALLX and other commands over BLE are ASCII-encoded triplets from ACM; handled by ASCII router below.
 
  // 3) AIRM acknowledgement: "#AIRM###" + mode[3] + minute[3] (ASCII digits)
  while (window.__rxBytes.length >= 14 && decodeAscii(window.__rxBytes, 0, 8) === "#AIRM###") {
    const modeStr = decodeAscii(window.__rxBytes, 8, 3);
    const minuteStr = decodeAscii(window.__rxBytes, 11, 3);
    const modeIdx = parseInt(modeStr || "0", 10);
    const minute = parseInt(minuteStr || "0", 10);
    retrievedValue.innerHTML = "#AIRM " + modeIdx + " " + minute;
    setTimestampNow();
    if (modeSelect && modeIdx >= 0 && modeIdx < modeSelect.options.length) {
      modeSelect.selectedIndex = modeIdx;
      executionMode = modeIdx;
      executionModeText = modeSelect.options[modeIdx].text;
      pressureReleaseActionMsg.innerHTML = "";
      pressureReleaseActionMsg.style.visibility = 'hidden';
    }
    window.__rxBytes = window.__rxBytes.slice(14);
  }
 
  // 4) ASCII accumulator for other commands (chunked notifications)
  if (typeof window.__bleRxBuffer !== "string") window.__bleRxBuffer = "";
  let chunk = "";
  for (let i = 0; i < bytes.length; i++) chunk += String.fromCharCode(bytes[i]);
  window.__bleRxBuffer += chunk;
  const firstHash = window.__bleRxBuffer.indexOf("#");
  if (firstHash > 0) window.__bleRxBuffer = window.__bleRxBuffer.substring(firstHash);
  if (window.__bleRxBuffer.length > 2048) {
    window.__bleRxBuffer = window.__bleRxBuffer.slice(-1024);
  }
  // Process known ASCII-encoded frames via router
  if (window.__bleRxBuffer.startsWith("#")) {
    // Split by header boundaries and process complete frames
    while (true) {
      const nextHash = window.__bleRxBuffer.indexOf("#", 8);
      if (nextHash === -1) break;
      const frame = window.__bleRxBuffer.substring(0, nextHash);
      retrievedValue.innerHTML = frame;
      setTimestampNow();
      processReceivedString(frame);
      if (typeof updatePressureBannerVisibility === "function") updatePressureBannerVisibility();
      window.__bleRxBuffer = window.__bleRxBuffer.substring(nextHash);
    }
    // If we have a single frame without a trailing '#', defer processing until no new chunks arrive briefly
    if (window.__asciiFlushTimer) clearTimeout(window.__asciiFlushTimer);
    const remsFlush = () => {
      if (window.__bleRxBuffer && window.__bleRxBuffer.startsWith("#")) {
        if (window.__bleRxBuffer.substring(0,5) === "#REMS") {
          const lenStr = window.__bleRxBuffer.substring(5,8);
          const len = Number(lenStr);
          const need = 8 + (isFinite(len) ? (len * 3) : 0);
          if (window.__bleRxBuffer.length < need) {
            window.__asciiFlushTimer = setTimeout(remsFlush, 250);
            return;
          }
        }
        retrievedValue.innerHTML = window.__bleRxBuffer;
        setTimestampNow();
        console.log("window.__bleRxBuffer: ", window.__bleRxBuffer);
        processReceivedString(window.__bleRxBuffer);
        window.__bleRxBuffer = "";
      }
    };
    window.__asciiFlushTimer = setTimeout(remsFlush, 180);
  } else {
    // Do not overwrite UI with escaped bytes; wait for a header
  }
}

function writeOnCharacteristic(value){
  if (bleTransmitServer && bleTransmitServer.connected && bleTransmitServiceFound) {
    return bleTransmitServiceFound.getCharacteristic(transmitCharacteristic)
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
            modeSelect.selectedIndex = idx;
            executionMode = idx;
            executionModeText = modeSelect.options[idx].text;
            const minute = minuteToNextMixedModeAction;
            pressureReleaseActionMsg.innerHTML = "";
            pressureReleaseActionMsg.style.visibility = 'hidden';
          }
        }
      })
      .catch(error => {
        console.error("Error writing to the transmit characteristic: ", error);
        throw error;
      });
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
  executionMode = modeSelect.selectedIndex;
  executionModeText = modeSelect.options[modeSelect.selectedIndex].text;
  var s = "#AIRM00" + executionMode;
  writeOnCharacteristic(s).then(()=> {
    const txt = String(executionModeText || "").toLowerCase();
    if (txt.indexOf("manual") !== -1) {
      return writeOnCharacteristic("*SETMAM");
    } else {
      return writeOnCharacteristic("*CLRMAM");
    }
  }).catch(()=>{});
  
}

function runAccumulatedPressureSelect() {
  if (bleStateContainer.innerHTML == "Device disconnected") {
    if (isAccumulatedPressure.checked) {
      isAccumulatedPressureChecked = true;
      writeOnCharacteristic("#SCREEN4");
    }
    else {
      isAccumulatedPressureChecked = false;
      writeOnCharacteristic("#SCREEN3");
    }
    console.log("isAccumulatedPressureChecked:", isAccumulatedPressureChecked);
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
          drawPSColorMap();
        }
      }
      else if (rx_data.substring(0, 8) == "#PZMAP##") {        
        loadColorMapData(rx_data.substring(8, rx_data.length));
        container = document.getElementById("pressuremapContainer"); 
        if (pixelCount >= 840 && container.style.display == "block") {
          drawPZColorMap();
        }
      }
      else if (rx_data.substring(0, 8) == "#POSE###") {
        maxProbabilityLabel.innerHTML = posture[Number(rx_data.substring(8,11))];
        maxProbability.innerHTML = Number(rx_data.substring(11,14));
        rows[selectedBedAddr].cells[3].textContent = posture[Number(rx_data.substring(8,11))];
      }
      else if (rx_data.substring(0, 8) == "#POSE_P#") {
        maxProbabilityLabel.innerHTML = posture[Number(rx_data.substring(8,11))];
        maxProbability.innerHTML = Number(rx_data.substring(11,14));
      }
      else if (rx_data.substring(0, 8) == "#MPZ####") {
        
      }
      else if (rx_data.startsWith("#P&VS###") || rx_data.startsWith("#P&VS")) {
        container = document.getElementById("airmattressContainer");
        if (container.style.display == "block") {
          const payload = rx_data.startsWith("#P&VS###") ? rx_data.substring(8) : rx_data.substring(5);
          loadAndShowPVSData(payload);
        }
      }
      else if (rx_data.substring(0, 8) == "#AIRM###") {
        modeSelect.selectedIndex = Number(rx_data.substring(8,11));
        pressureReleaseActionMsg.style.visibility = 'hidden';
        pressureReleaseActionMsg.innerHTML = "";
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
          rows[Number(rx_data.substring(9, 11))].cells[7].textContent = textMsgShort;
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
            rows[Number(rx_data.substring(8, 11))].cells[7].textContent = textMsgShort;
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
  console.log(imageGreyPixelArray);
}

function drawPSColorMap() {
  let canvasWidth = pressureMapCanvas.width;
  let canvasHeight = pressureMapCanvas.height;
  let g;
  let red;
  let green;
  let blue;
  let x;
  let y;
  // Clear the canvas
  ctx.fillStyle = "grey";
  ctx.fillRect(0, 0, 672, 280);
  // Get canvas image data
  let imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  let pixels = imgData.data;
  // Replace rectangles (14x14 pixels) with force
  let force = 0.0;
  for (let i = 0; i < totalPixelCount; i++) {
    force = imageGreyPixelArray[i]/255.00;
    console.log("force: ", force);
    if (force > 0) {
      g = (((6 - (2 * 0.8)) * force) + 0.8);
      red = Math.round((Math.max((3.0 - Math.abs(g - 4.0) - Math.abs(g - 5.0)) / 2.0, 0)) * 255);
      green = Math.round((Math.max((4.0 - Math.abs(g - 2.0) - Math.abs(g - 4.0)) / 2.0, 0)) * 255);
      blue = Math.round((Math.max((3.0 - Math.abs(g - 1.0) - Math.abs(g - 2.0)) / 2.0, 0)) * 255);
      x = (Math.floor(i / numRows)) * pixelScaleX;
      y = numRows * pixelScaleY - (i % numRows) * pixelScaleY;
      // console.log("g: ", g);
      // console.log("red: ", red);
      // console.log("green: ", green);
      // console.log("blue: ", blue);
      // console.log("x: ", x);
      // console.log("y: ", y);
      for (let xx = x; xx < x+pixelScaleX; xx++) {
        for (let yy = y; yy < y+pixelScaleY; yy++) {
          var off = (yy * imgData.width + xx) * 4;
          pixels[off] = red;
          pixels[off + 1] = green;
          pixels[off + 2] = blue;
          pixels[off + 3] = 255;
        }
      }
    }
  }
  // Put the pixel colours on the canvas
  ctx.putImageData(imgData, 0, 0);
}

function drawPZColorMap() {
  let canvasWidth = pressureMapCanvas.width;
  let canvasHeight = pressureMapCanvas.height;
  let g;
  let red;
  let green;
  let blue;
  let x;
  let y;
  // Clear the canvas
  ctx.fillStyle = "grey";
  ctx.fillRect(0, 0, 672, 280);
  // Get canvas image data
  let imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  let pixels = imgData.data;
  // Replace rectangles (14x14 pixels) with force
  let force = 0.0;
  for (let i = 0; i < totalPixelCount; i++) {
    force = imageGreyPixelArray[i]/255.00;
    if (force > 0) {
      g = (((6 - (2 * 0.8)) * force) + 0.8);
      red = Math.round((Math.max((3.0 - Math.abs(g - 4.0) - Math.abs(g - 5.0)) / 2.0, 0)) * 255);
      green = Math.round((Math.max((4.0 - Math.abs(g - 2.0) - Math.abs(g - 4.0)) / 2.0, 0)) * 255);
      blue = Math.round((Math.max((3.0 - Math.abs(g - 1.0) - Math.abs(g - 2.0)) / 2.0, 0)) * 255);
      x = (Math.floor(i / numRows)) * pixelScaleX;
      y = numRows * pixelScaleY - (i % numRows) * pixelScaleY;
      for (let xx = x; xx < x+pixelScaleX; xx++) {
        for (let yy = y; yy < y+pixelScaleY; yy++) {
          var off = (yy * imgData.width + xx) * 4;
          pixels[off] = red;
          pixels[off + 1] = green;
          pixels[off + 2] = blue;
          pixels[off + 3] = 255;
        }
      }
    }
  }    
  // Put the pixel colours on the canvas
  ctx.putImageData(imgData, 0, 0);
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
    const setTxt = (id, text) => { const el=document.getElementById(id); if (el) el.textContent = text; };
    const pAStart = 51, pBStart = 58, pCStart = 65;
    for (let i=0;i<7;i++) setTxt("lblPressureA"+(i+1), String(data[pAStart+i]));
    for (let i=0;i<7;i++) setTxt("lblPressureB"+(i+1), String(data[pBStart+i]));
    for (let i=0;i<7;i++) setTxt("lblPressureC"+(i+1), String(data[pCStart+i]));
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
      modeSelect.selectedIndex = operatingModeSelected;
      executionMode = modeSelect.value;
      executionModeText = modeSelect.options[modeSelect.selectedIndex].text;
      if (executionModeText === "Redistribution") pressureReleaseActionMsg.innerHTML = "Redistribute in " + minuteToNextMixedModeAction + " minutes";
      else if (executionModeText === "Alternating") pressureReleaseActionMsg.innerHTML = "Alternate in " + minuteToNextMixedModeAction + " minutes";
      else if (executionModeText === "Smart Mode") pressureReleaseActionMsg.innerHTML = "Pressure relief in " + minuteToNextMixedModeAction + " minutes";
      else if (executionModeText === "Autoturn") pressureReleaseActionMsg.innerHTML = "Auto turn in " + minuteToNextMixedModeAction + " minutes";
      else pressureReleaseActionMsg.innerHTML = "";
      updatePressureBannerVisibility();
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
      modeSelect.selectedIndex = operatingModeSelected;
      executionMode = modeSelect.value;
      executionModeText = modeSelect.options[modeSelect.selectedIndex].text;
      if (executionModeText === "Redistribution") pressureReleaseActionMsg.innerHTML = "Redistribute in " + minuteToNextMixedModeAction + " minutes";
      else if (executionModeText === "Alternating") pressureReleaseActionMsg.innerHTML = "Alternate in " + minuteToNextMixedModeAction + " minutes";
      else if (executionModeText === "Smart Mode") pressureReleaseActionMsg.innerHTML = "Pressure relief in " + minuteToNextMixedModeAction + " minutes";
      else if (executionModeText === "Autoturn") pressureReleaseActionMsg.innerHTML = "Auto turn in " + minuteToNextMixedModeAction + " minutes";
      else pressureReleaseActionMsg.innerHTML = "";
      updatePressureBannerVisibility();
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

  window.__MPR_STATE__ = { minute: minute, nMsg: nMsg, t0: Date.now() };

  function fmtActionLabel(n) {
    if (n === 1) return "Redistribute in";
    if (n === 2) return "Alternating in";
    if (n === 3) return "Auto turn in";
    return "Pressure relief in";
  }
  function updateCountdown() {
    const s = window.__MPR_STATE__;
    if (!s) return;
    const elapsedMin = Math.floor((Date.now() - s.t0) / 60000);
    let remain = s.minute - elapsedMin;
    if (remain < 0) remain = 0;
    const modeSel = document.getElementById('modeSelect');
    const lblAuto = document.getElementById('lblAutoTurn');
    const lblTop = document.getElementById('pressureReleaseActionMsg');
    if (modeSel && modeSel.value === "3") {
      if (lblAuto) {
        lblAuto.innerHTML = "Auto turn in " + String(remain) + " minutes";
      }
    } else if (modeSel && modeSel.value === "1") {
      if (lblTop) {
        lblTop.innerHTML = "Redistribute in " + String(remain) + " minutes";
      }
    } else if (modeSel && modeSel.value === "2") {
      if (lblTop) {
        lblTop.innerHTML = "Alternating in " + String(remain) + " minutes";
      }
    } else {
      if (lblTop) {
        lblTop.innerHTML = fmtActionLabel(s.nMsg) + " " + String(remain) + " minutes";
      }
    }
    if (typeof updatePressureBannerVisibility === "function") updatePressureBannerVisibility();
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
  PRESSURE_MAX = clampIntInRange(PRESSURE_MAX, 60, 80);
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
  else if (setting == "taPressureMax") {PRESSURE_MAX = clampIntInRange(v, 60, 80); el.value = String(PRESSURE_MAX);}
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
