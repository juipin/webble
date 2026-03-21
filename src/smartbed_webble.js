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
let PRESSURE_HYSTERESIS = 4;

let MIN_MATTRESS_TEMP_C = 25;
let MAX_MATTRESS_TEMP_C = 30;
let MAX_MATTRESS_RH = 85;
let DELTA_TEMPERATURE_C = 2;
let HEATSINK_MAX_TEMP_C = 65;

let weight = 60;
let setStaticPressure = 22;
let setAutofirmPressure = 32;
let setDurationAlternating = 5;
let setDurationRedistribute = 30;
let setDurationAutoturn= 20;
let setDurationMixed = 30;
let setAutoTurnAngle = 15;
let operatingModeSelected = 1;
let minuteToNextRedistribute = 30;
let minuteToNextAlternating = setDurationAlternating;
let minuteToNextAutoturn = 20;
let minuteToNextMixedModeAction = 30;
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
const timestampContainer = document.getElementById('timestamp');
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
console.log("isAccumulatedPressureChecked", isAccumulatedPressureChecked);

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
const channelColour = ['#FFA500', '#00FF00', '#FFFFFF', '#FFA500'];
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
      let d = new Date();
      timestampContainer.innerHTML = d.getHours() + ":" + ((d.getMinutes() < 10) ? "0" : "") + d.getMinutes();
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
    writeOnCharacteristic("#RALLX");
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
  const bytes = new Uint8Array(rawValue.buffer, rawValue.byteOffset, rawValue.byteLength);
  if (bytes.length >= 9 && bytes[0] === 35) {
    let msg = "";
    for (let i = 0; i < 9; i++) {
      if (bytes[i] === 0) break;
      msg += String.fromCharCode(bytes[i]);
    }

    if (msg === "#PSMAP" || msg === "#PZMAP") {
      const colStart = bytes[9];
      const packageNumber = Math.floor(colStart / 6);
      pixelCount = packageNumber * pixelsPerPackage;
      for (let i = 0; i < pixelsPerPackage; i++) {
        if ((pixelCount + i) >= totalPixelCount) break;
        imageGreyPixelArray[pixelCount + i] = bytes[10 + i];
      }

      container = document.getElementById("pressuremapContainer");
      if (pixelCount >= 840 && container.style.display == "block") {
        if (msg === "#PSMAP") drawPSColorMap();
        else drawPZColorMap();
      }
      return;
    }
  }

  if (!window.__bleRxBuffer) window.__bleRxBuffer = "";
  let chunk = "";
  for (let i = 0; i < bytes.length; i++) chunk += String.fromCharCode(bytes[i]);
  if (chunk.indexOf("#") >= 0) {
    window.__bleRxBuffer = chunk.substring(chunk.indexOf("#"));
  } else {
    window.__bleRxBuffer += chunk;
  }

  if (window.__bleRxBuffer.startsWith("#ALLX")) {
    const baseLen = 5 + 3 * 59;
    if (window.__bleRxBuffer.length >= baseLen + 3) {
      const nameLen = Number(window.__bleRxBuffer.substring(5 + 3 * 59, 5 + 3 * 60));
      const totalLen = 5 + 3 * (60 + nameLen);
      if (window.__bleRxBuffer.length >= totalLen) {
        const payload = window.__bleRxBuffer.substring(5, totalLen);
        const n = Math.floor((payload.length) / 3);
        let out = "#ALLX ";
        for (let i = 0; i < n; i++) {
          out += Number(payload.substring(i * 3, (i + 1) * 3));
          if (i < n - 1) out += " ";
        }
        retrievedValue.innerHTML = out;
        let d2 = new Date();
        timestampContainer.innerHTML = d2.getHours() + ":" + d2.getMinutes();
        processReceivedString(window.__bleRxBuffer.substring(0, totalLen));
        window.__bleRxBuffer = window.__bleRxBuffer.substring(totalLen);
        return;
      }
    }
  } else {
    if (chunk.indexOf("#") >= 0) {
      let esc = "";
      for (let i = 0; i < chunk.length; i++) {
        const c = chunk.charCodeAt(i);
        if (c < 32 || c > 126) esc += "\\x" + c.toString(16).padStart(2, "0");
        else esc += chunk[i];
      }
      retrievedValue.innerHTML = esc;
      let d = new Date();
      timestampContainer.innerHTML = d.getHours() + ":" + d.getMinutes();
    }
  }
}

function writeOnCharacteristic(value){
  if (bleTransmitServer && bleTransmitServer.connected && bleTransmitServiceFound) {
    bleTransmitServiceFound.getCharacteristic(transmitCharacteristic)
    .then(characteristic => {
        console.log("Found the transmit characteristic: ", characteristic.uuid);
        console.log("value =", value);
        var data = new Uint8Array();
        data = Uint8Array.from(value.split("").map(x => x.charCodeAt()));
        console.log("data =", data);
        return characteristic.writeValue(data);
    })
    .then(() => {
        latestValueSent.innerHTML = value;
        console.log("Value written to transmit characteristic:", value);
        let d = new Date();
        timestampContainer.innerHTML = d.getHours() + ":" + d.getMinutes();
    })
    .catch(error => {
        console.error("Error writing to the transmit characteristic: ", error);
    });
  } else {
    console.error ("Bluetooth is not connected. Cannot write to characteristic.")
    window.alert("Bluetooth is not connected. Cannot write to characteristic. \n Connect to BLE first!")
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
  executionMode = modeSelect.value;
  executionModeText = modeSelect.options[modeSelect.selectedIndex].text;
  var s = "#AIRM00" + executionMode;
  writeOnCharacteristic(s);
  
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
      else if (rx_data.substring(0, 8) == "#P&VS###") {
        container = document.getElementById("airmattressContainer");
        if (container.style.display == "block") {          
          loadAndShowPVSData(rx_data.substring(8, rx_data.length));
        }
      }
      else if (rx_data.substring(0, 8) == "#AIRM###") {
        modeSelect.selectedIndex = Number(rx_data.substring(8,11));
        var minuteToNextMixedModeAction = Number(rx_data.substring(11,14));
        //runModeSelect(); // is this needed?
        pressureReleaseActionMsg.style.visibility = 'visible';
        executionModeText = modeSelect.options[modeSelect.selectedIndex].text;
        if (executionModeText === "Redistribution") pressureReleaseActionMsg.innerHTML = "Redistribute in " + minuteToNextMixedModeAction + " minutes";
        else if (executionModeText === "Alternating") pressureReleaseActionMsg.innerHTML = "Alternate in " + minuteToNextMixedModeAction + " minutes";
        else if (executionModeText === "Smart Mode") pressureReleaseActionMsg.innerHTML = "Pressure relief in " + minuteToNextMixedModeAction + " minutes";
        else if (executionModeText === "Autoturn") pressureReleaseActionMsg.innerHTML = "Auto turn in " + minuteToNextMixedModeAction + " minutes";
        else pressureReleaseActionMsg.innerHTML = "";
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
      else if (rx_data.substring(0, 5) == "#ALL ") {
        loadALLData(rx_data.substring(5, rx_data.length));
      }
      else if (rx_data.substring(0, 5) == "#PRS") {
        loadPRSData(rx_data.substring(5, rx_data.length));
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
  lblPressureMainA.innerHTML = data[6];
  lblPressureMainB.innerHTML = data[7];
  lblPressureMainC.innerHTML = data[8];
  lblPressurePillow.innerHTML = data[9];

  for (let i = 0; i < 7; i++) {
    ACellColourCode[i] = data[10 + i];
    BCellColourCode[i] = data[17 + i];
    CCellColourCode[i] = data[24 + i];
    DCellColourCode[i] = data[31 + i];
  }
  // Show channel/cell colour
  panelA1.style.backgroundColor = channelColour[ACellColourCode[0]];
  panelA2.style.backgroundColor = channelColour[ACellColourCode[1]];
  panelA3.style.backgroundColor = channelColour[ACellColourCode[2]];
  panelA4.style.backgroundColor = channelColour[ACellColourCode[3]];
  panelA5.style.backgroundColor = channelColour[ACellColourCode[4]];
  panelA6.style.backgroundColor = channelColour[ACellColourCode[5]];
  panelA7.style.backgroundColor = channelColour[ACellColourCode[5]];
  panelB1.style.backgroundColor = channelColour[BCellColourCode[0]];
  panelB2.style.backgroundColor = channelColour[BCellColourCode[1]];
  panelB3.style.backgroundColor = channelColour[BCellColourCode[2]];
  panelB4.style.backgroundColor = channelColour[BCellColourCode[3]];
  panelB5.style.backgroundColor = channelColour[BCellColourCode[4]];
  panelB6.style.backgroundColor = channelColour[BCellColourCode[5]];
  panelB7.style.backgroundColor = channelColour[BCellColourCode[5]];
  panelC1.style.backgroundColor = channelColour[CCellColourCode[0]];
  panelC2.style.backgroundColor = channelColour[CCellColourCode[1]];
  panelC3.style.backgroundColor = channelColour[CCellColourCode[2]];
  panelC4.style.backgroundColor = channelColour[CCellColourCode[3]];
  panelC5.style.backgroundColor = channelColour[CCellColourCode[4]];
  panelC6.style.backgroundColor = channelColour[CCellColourCode[5]];
  panelC7.style.backgroundColor = channelColour[CCellColourCode[5]];
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
  iBackAgleP2 = data[5];
  iBackAgleP3 = data[6];
  iBackAgleP4 = data[7];
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

  // Show PRS information on the PRS screen
}

function loadSETSData(receivedString) {
  var dataLength = Math.floor(receivedString.length/3);
  const buffer = new ArrayBuffer(dataLength);
  var data = new Uint8Array(buffer);
  for (let i = 0; i < dataLength; i++) {
      data[i] = Number(receivedString.substring(i*3,(i+1)*3));
  }

  setStaticPressure = data[0] - 10;
  setDurationRedistribute = data[1];
  setDurationAlternating = data[2];
  setAutoTurnAngle = data[3];
  if (data[4] == 1) bNotToTurn = true; else bNotToTurn = false;
  if (data[5] == 1) bNotToTurnRight = true; else bNotToTurnRight = false;
  if (data[6] == 1) bNotToTurnLeft = true; else bNotToTurnLeft = false;
  if (data[7] == 1) bNotToMoveBack = true; else bNotToMoveBack = false;
  if (data[8] == 1) bNotToMoveLeg = true; else bNotToMoveLeg = false;
  if (data[9] == 1) bCaregiverAlert = true; else bCaregiverAlert = false;
  if (data[10] == 1) bFaultAlert = true; else bFaultAlert = false;

  // Show ALL information on the User Info setting screen
  saveSettings();
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
  var dataLength = Math.floor(receivedString.length/3);
  const buffer = new ArrayBuffer(dataLength);
  var data = new Uint8Array(buffer);
  for (let i = 0; i < dataLength; i++) {
      data[i] = Number(receivedString.substring(i*3,(i+1)*3));
  }
  
  if (dataLength < 59) return; // 28(ALL) + 11(SETS) + 20(SETX)

  let offset = 0;
  
  // 1. ALL data (28 bytes)
  iWeight = data[offset++];
  iAge = data[offset++];
  iHeight = data[offset++];
  iEyeToHip = data[offset++];
  indexSex = data[offset++];
  valueSensory = data[offset++];
  valueMoisture = data[offset++];
  valueActivity = data[offset++];
  valueMobility = data[offset++];
  valueNutrition = data[offset++];
  valueShear = data[offset++];
  weight = data[offset++];
  setStaticPressure = data[offset++] - 10;
  setAutofirmPressure = data[offset++] + 10;
  setDurationRedistribute = data[offset++];
  setDurationAlternating = data[offset++];
  setAutoTurnAngle = data[offset++];
  operatingModeSelected = data[offset++];
  minuteToNextRedistribute = data[offset++];
  minuteToNextAlternating = data[offset++];
  minuteToNextAutoturn = data[offset++];
  minuteToNextMixedModeAction = data[offset++];
  percentPressurePoints = data[offset++];
  midBodyWidth = data[offset++];
  midBodyHeight = data[offset++];
  columnsEyeToHip = data[offset++];
  columnsEyeToHeel = data[offset++];
  degreeHipToThighs = data[offset++];

  // 2. SETS data (11 bytes)
  setStaticPressure = data[offset++] - 10; // Overrides ALL
  setDurationRedistribute = data[offset++]; // Overrides ALL
  setDurationAlternating = data[offset++]; // Overrides ALL
  setAutoTurnAngle = data[offset++]; // Overrides ALL
  bNotToTurn = data[offset++] == 1;
  bNotToTurnRight = data[offset++] == 1;
  bNotToTurnLeft = data[offset++] == 1;
  bNotToMoveBack = data[offset++] == 1;
  bNotToMoveLeg = data[offset++] == 1;
  bCaregiverAlert = data[offset++] == 1;
  bFaultAlert = data[offset++] == 1;

  // 3. SETX data (20 bytes)
  let setxHeader = data[offset++];
  if (setxHeader == 1) {
    bNoPillowMassage = data[offset++] == 1;
    bNoCooling = data[offset++] == 1;
    bRedistPlusAlter = data[offset++] == 1;

    AUTOTURN_INTERVAL = data[offset++];
    NUMBER_OF_TURNS = data[offset++];
    SIDEBAG_FILL_INTERVAL = data[offset++];
    LEG_AIRBAG_INTERVAL = data[offset++];
    POSTURE_CHECK_INTERVAL = data[offset++];
    HOLD_TIME_TO_COOL_VALVES = data[offset++];

    PRESSURE_FIRM = data[offset++];
    PRESSURE_SITTING = data[offset++];
    PRESSURE_RELEASED = data[offset++];
    PRESSURE_MAX = data[offset++];
    PRESSURE_HYSTERESIS = data[offset++];

    MIN_MATTRESS_TEMP_C = data[offset++];
    MAX_MATTRESS_TEMP_C = data[offset++];
    MAX_MATTRESS_RH = data[offset++];
    DELTA_TEMPERATURE_C = data[offset++];
    HEATSINK_MAX_TEMP_C = data[offset++];
  } else {
    offset += 19; // Skip rest of SETX if header not 1
  }

  // 4. Name data
  if (offset < dataLength) {
    let nameLen = data[offset++];
    let nameStr = "";
    for (let i = 0; i < nameLen && offset < dataLength; i++) {
      nameStr += String.fromCharCode(data[offset++]);
    }
    document.getElementById('taName').value = nameStr;
  }

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
  if (rangeAutoTurnAngle && lblAutoTurnAngle) {
    rangeAutoTurnAngle.value = setAutoTurnAngle;
    lblAutoTurnAngle.innerHTML = setAutoTurnAngle;
  }
  if (typeof chkNoTurn !== "undefined" && chkNoTurn) chkNoTurn.checked = bNotToTurn;
  if (typeof chkNoTurnRight !== "undefined" && chkNoTurnRight) chkNoTurnRight.checked = bNotToTurnRight;
  if (typeof chkNoTurnLeft !== "undefined" && chkNoTurnLeft) chkNoTurnLeft.checked = bNotToTurnLeft;
  if (typeof chkNoMoveBack !== "undefined" && chkNoMoveBack) chkNoMoveBack.checked = bNotToMoveBack;
  if (typeof chkNoMoveLeg !== "undefined" && chkNoMoveLeg) chkNoMoveLeg.checked = bNotToMoveLeg;
  if (typeof chkCaregiverAlert !== "undefined" && chkCaregiverAlert) chkCaregiverAlert.checked = bCaregiverAlert;
  if (typeof chkFaultAlert !== "undefined" && chkFaultAlert) chkFaultAlert.checked = bFaultAlert;

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
  weight = data[11];
  setStaticPressure = data[12] - 10;
  setAutofirmPressure = data[13] + 10;
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

  var minute = data[0];
  var nMsg = data[1];
  nBigSpontaneousMovements = data[2];
  nSmallSpontaneousMovements = data[3];

  // Update next pressure release action
  // ********************** To Do ******************************************
  // if (nMsg < 255) { // 255 will just update body movements and not pressure release message
  //   if (nMsg == 0) lv_label_set_text(ui_lblNextPressureReleaseAction,"Pressure relief in");
  //   else if (nMsg == 1) lv_label_set_text(ui_lblNextPressureReleaseAction,"Redistribute in");
  //   else if (nMsg == 2) lv_label_set_text(ui_lblNextPressureReleaseAction,"Alternate in");
  //   else if (nMsg == 3) lv_label_set_text(ui_lblNextPressureReleaseAction,"Auto turn in");
  //   lv_label_set_text_fmt(ui_lblMinutePressureZoneUpdate, "%d", minute);
  // }
  // lv_label_set_text_fmt(ui_lblTurns, "%d", nBigSpontaneousMovements);
  // lv_label_set_text_fmt(ui_lblShifts, "%d", nSmallSpontaneousMovements);

}

function saveSettings() {
  if (bResetToDefaults) {
    bResetToDefaults = false;
    setStaticPressure = 22;    
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
    SIDEBAG_FILL_INTERVAL = 15;
    LEG_AIRBAG_INTERVAL = 30;
    POSTURE_CHECK_INTERVAL = 120;
    HOLD_TIME_TO_COOL_VALVES = 1;

    PRESSURE_FIRM = 42;
    PRESSURE_SITTING = PRESSURE_FIRM + 10;
    PRESSURE_RELEASED = 16;
    PRESSURE_MAX = 80;
    PRESSURE_HYSTERESIS = 4;

    MIN_MATTRESS_TEMP_C = 25;
    MAX_MATTRESS_TEMP_C = 30;
    MAX_MATTRESS_RH = 85;
    DELTA_TEMPERATURE_C = 2;
    HEATSINK_MAX_TEMP_C = 65;
  }
  
  // if weight is changed, also want to change and update the label of autofirm pressure. So have to always do it since we don't know what has been changed.
  setAutofirmPressure = 0.0022*weight*weight-0.1679*weight+29.226; // always setAutofirmPressure when weight changes
  if (setAutofirmPressure < setStaticPressure) setAutofirmPressure = setStaticPressure;

  setDurationRedistribute = clampIntInRange(setDurationRedistribute, 15, 60);
  setDurationAlternating = clampIntInRange(setDurationAlternating, 1, 15);
  const staticPressureUi = clampIntInRange(setStaticPressure + 10, 25, 40);
  setStaticPressure = staticPressureUi - 10;

  AUTOTURN_INTERVAL = clampIntInRange(AUTOTURN_INTERVAL, 15, 60);
  NUMBER_OF_TURNS = clampIntInRange(NUMBER_OF_TURNS, 1, 4);
  SIDEBAG_FILL_INTERVAL = clampIntInRange(SIDEBAG_FILL_INTERVAL, 5, 20);
  LEG_AIRBAG_INTERVAL = clampIntInRange(LEG_AIRBAG_INTERVAL, 15, 60);
  POSTURE_CHECK_INTERVAL = clampIntInRange(POSTURE_CHECK_INTERVAL, 30, 120);
  HOLD_TIME_TO_COOL_VALVES = clampIntInRange(HOLD_TIME_TO_COOL_VALVES, 1, 3);

  PRESSURE_FIRM = clampIntInRange(PRESSURE_FIRM, 32, 52);
  PRESSURE_SITTING = clampIntInRange(PRESSURE_SITTING, PRESSURE_FIRM, PRESSURE_FIRM + 20);
  PRESSURE_RELEASED = clampIntInRange(PRESSURE_RELEASED, 10, staticPressureUi);
  PRESSURE_MAX = clampIntInRange(PRESSURE_MAX, 60, 80);
  PRESSURE_HYSTERESIS = clampIntInRange(PRESSURE_HYSTERESIS, 2, 8);

  MIN_MATTRESS_TEMP_C = clampIntInRange(MIN_MATTRESS_TEMP_C, 22, 30);
  MAX_MATTRESS_TEMP_C = clampIntInRange(MAX_MATTRESS_TEMP_C, 25, 33);
  MAX_MATTRESS_RH = clampIntInRange(MAX_MATTRESS_RH, 50, 95);
  DELTA_TEMPERATURE_C = clampIntInRange(DELTA_TEMPERATURE_C, 0, 5);
  HEATSINK_MAX_TEMP_C = clampIntInRange(HEATSINK_MAX_TEMP_C, 65, 75);

  // update display
  setValue("rangeStaticPressure", staticPressureUi);
  setValue("rangeDurationRedistribute", setDurationRedistribute);
  setValue("rangeDurationAlternating", setDurationAlternating);
  if (lblStaticPressure) lblStaticPressure.innerHTML = String(staticPressureUi);
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

  setMinMax("taPressureReleased", 10, staticPressureUi);
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

function setSmartbedControl() {
  if (window.SmartbedUICommon) window.SmartbedUICommon.showSmartbedControl();
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
  s += get3DigitString(setStaticPressure+10) + get3DigitString(setAutofirmPressure+10) + get3DigitString(setDurationRedistribute) + get3DigitString(setDurationAlternating);        
  s += get3DigitString(setAutoTurnAngle) + get3DigitString(operatingModeSelected) + get3DigitString(minuteToNextRedistribute) + get3DigitString(minuteToNextAlternating);       
  s += get3DigitString(minuteToNextAutoturn) + get3DigitString(minuteToNextMixedModeAction);
  s += get3DigitString(percentPressurePoints) + get3DigitString(midBodyWidth) + get3DigitString(midBodyHeight);
  s += get3DigitString(columnsEyeToHip) + get3DigitString(columnsEyeToHeel) + get3DigitString(degreeHipToThighs);

  // 2. SETS data (11 bytes)
  s += get3DigitString(setStaticPressure+10);
  s += get3DigitString(setDurationRedistribute);
  s += get3DigitString(setDurationAlternating);
  s += get3DigitString(setAutoTurnAngle);
  s += get3DigitString(bNotToTurn?1:0) + get3DigitString(bNotToTurnRight?1:0) + get3DigitString(bNotToTurnLeft?1:0);
  s += get3DigitString(bNotToMoveBack?1:0) + get3DigitString(bNotToMoveLeg?1:0);
  s += get3DigitString(bCaregiverAlert?1:0) + get3DigitString(bFaultAlert?1:0);

  // 3. SETX data (20 bytes)
  s += get3DigitString(1); // setxHeader
  s += get3DigitString(bNoPillowMassage?1:0) + get3DigitString(bNoCooling?1:0) + get3DigitString(bRedistPlusAlter?1:0);
  s += get3DigitString(AUTOTURN_INTERVAL) + get3DigitString(NUMBER_OF_TURNS);
  s += get3DigitString(SIDEBAG_FILL_INTERVAL) + get3DigitString(LEG_AIRBAG_INTERVAL) + get3DigitString(POSTURE_CHECK_INTERVAL) + get3DigitString(HOLD_TIME_TO_COOL_VALVES);
  s += get3DigitString(PRESSURE_FIRM) + get3DigitString(PRESSURE_SITTING) + get3DigitString(PRESSURE_RELEASED);
  s += get3DigitString(PRESSURE_MAX) + get3DigitString(PRESSURE_HYSTERESIS);
  s += get3DigitString(MIN_MATTRESS_TEMP_C) + get3DigitString(MAX_MATTRESS_TEMP_C) + get3DigitString(MAX_MATTRESS_RH);
  s += get3DigitString(DELTA_TEMPERATURE_C) + get3DigitString(HEATSINK_MAX_TEMP_C);

  // 4. Name data
  let nameStr = document.getElementById("taName").value;
  if (!nameStr) nameStr = "Jane Doe";
  let maxNameLen = Math.min(nameStr.length, 20); // keep reasonable limit
  s += get3DigitString(maxNameLen);
  for (let i = 0; i < maxNameLen; i++) {
    s += get3DigitString(nameStr.charCodeAt(i));
  }

  writeOnCharacteristic(s);
}

function executeSendAll() {
  executeSendAllX();
}

function updateUserInfoFromDisplay() {
  iWeight = Number(document.getElementById("taBodyWeight").value);
  iHeight = Number(document.getElementById("taBodyHeight").value);
  if (iHeight > 100) fBMI = iWeight * 10000 / (iHeight * iHeight);
  // console.log("iWeight: ", iWeight);
  // console.log("iHeight: ", iHeight);
  // console.log("fBMI: ", fBMI);
  lblBMI.textContent = parseFloat(String(fBMI)).toFixed(2);
  valueSensory = Number(ddSensory.value);
  valueMoisture = Number(ddMoisture.value);
  valueActivity = Number(ddActivity.value);
  valueMobility = Number(ddMobility.value);
  valueNutrition = Number(ddNutrition.value);
  valueShear = Number(ddShear.value);
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
  document.getElementById("taBodyWeight").textContent = String(iWeight);
  document.getElementById("taAge").textContent = String(iAge);
  document.getElementById("taBodyHeight").textContent = String(iHeight);
  document.getElementById("taEyeToHip").textContent = String(iEyeToHip);
  ddSex.value = indexSex;
  ddSensory.value = valueSensory;
  ddMoisture.value = valueMoisture;
  ddActivity.value = valueActivity;
  ddMobility.value = valueMobility;
  ddNutrition.value = valueNutrition;
  ddShear.value = valueShear;

  if (iHeight > 100) fBMI = iWeight * 10000 / (iHeight * iHeight);
  iBradenScore = valueSensory + valueMoisture + valueActivity + valueMobility + valueNutrition + valueShear;

  document.getElementById("taBodyPercent").textContent = String(percentPressurePoints);
  document.getElementById("taBodyWidth").textContent = String(midBodyWidth);
  document.getElementById("taBodyHeight").textContent = String(midBodyHeight);
  document.getElementById("taEye2HipCols").textContent = String(columnsEyeToHip);
  document.getElementById("taEye2HeelCols").textContent = String(columnsEyeToHeel);
  document.getElementById("taHip2ThighsAngle").textContent = String(degreeHipToThighs);
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
    return;
  }

  document.getElementById("taDurationP1").value = String(iDurationP1);
  document.getElementById("taDurationP2").value = String(iDurationP2);
  document.getElementById("taDurationP3").value = String(iDurationP3);
  document.getElementById("taDurationP4").value = String(iDurationP4);
  document.getElementById("taBackAngleP1").value = String(iBackAngleP1);
  document.getElementById("taBackAngleP2").value = String(iBackAngleP2);
  document.getElementById("taBackAngleP3").value = String(iBackAngleP3);
  document.getElementById("taBackAngleP4").value = String(iBackAngleP4);
  document.getElementById("taLegAngleP1").value = String(iLegAngleP1);
  document.getElementById("taLegAngleP2").value = String(iLegAngleP2);
  document.getElementById("taLegAngleP3").value = String(iLegAngleP3);
  document.getElementById("taLegAngleP4").value = String(iLegAngleP4);
  document.getElementById("taTurnAngleP1").value = String(iTurnAngleP1);
  document.getElementById("taTurnAngleP2").value = String(iTurnAngleP2);
  document.getElementById("taTurnAngleP3").value = String(iTurnAngleP3);
  document.getElementById("taTurnAngleP4").value = String(iTurnAngleP4);
  document.getElementById("taDurationInTurnPosition").value = String(iDurationInTurnPosition);
  document.getElementById("taDurationInFlatPosition").value = String(iDurationInFlatPosition);
  document.getElementById("taDurationAlternating").value = String(iDurationAlternating);
  document.getElementById("lblBradenScorePRS").textContent = String(iBradenScore);
  document.getElementById("lblShear").textContent = String(valueShear);
  document.getElementById("lblMobility").textContent = String(valueMobility);
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
  let d = new Date();
  timestampContainer.innerHTML = d.getHours() + ":" + ((d.getMinutes() < 10) ? "0" : "") + d.getMinutes();
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
    const ui = clampIntInRange(v, 25, 40);
    setStaticPressure = ui - 10;
    el.value = String(ui);
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
  else if (setting == "taPressureHysteresis") {PRESSURE_HYSTERESIS = clampIntInRange(v, 2, 8); el.value = String(PRESSURE_HYSTERESIS);}
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
