/*
  App-wide startup helpers used by both WebBLE_GUI and WebSerial_NS.
*/
(function () {
  const byId = (id) => document.getElementById(id);
  const hide = (id) => {
    const el = byId(id);
    if (el) el.style.display = "none";
  };
  const showV = (id) => {
    const el = byId(id);
    if (el) el.style.visibility = "visible";
  };
  const bg = (id, color) => {
    const el = byId(id);
    if (el) el.style.backgroundColor = color;
  };

  if (window.location.protocol === "http:" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    window.location.href = "https:" + window.location.href.substring(5);
  }

  window.setInitialValues = function () {
    hide("backgroundContainer");
    hide("allbedsContainer");
    hide("userInformationContainer");
    hide("smartbedControlContainer");
    hide("extraSettingsContainer");

    showV("lblPressurePump");
    showV("lblPressureMainA");
    showV("lblPressureMainB");
    showV("lblPressureMainC");
    showV("lblPressurePillow");
    showV("lblPressureA1");
    showV("lblPressureB1");
    showV("lblPressureC1");
    showV("lblPressureA2");
    showV("lblPressureB2");
    showV("lblPressureC2");
    showV("lblPressureA3");
    showV("lblPressureB3");
    showV("lblPressureC3");
    showV("lblPressureA4");
    showV("lblPressureB4");
    showV("lblPressureC4");
    showV("lblPressureA5");
    showV("lblPressureB5");
    showV("lblPressureC5");
    showV("lblPressureA6");
    showV("lblPressureB6");
    showV("lblPressureC6");
    showV("lblPressureA7");
    showV("lblPressureB7");
    showV("lblPressureC7");
    showV("lblPressureRight");
    showV("lblPressureLeft");
    showV("lblPressureLeg");
    showV("imgExhaustBlocked");

    bg("panelA1", "#FFA500");
    bg("panelB1", "#FFA500");
    bg("panelC1", "#FFA500");
    bg("panelA2", "#FFA500");
    bg("panelB2", "#FFA500");
    bg("panelC2", "#FFA500");
    bg("panelA3", "#FFA500");
    bg("panelB3", "#FFA500");
    bg("panelC3", "#FFA500");
    bg("panelA4", "#FFA500");
    bg("panelB4", "#FFA500");
    bg("panelC4", "#FFA500");
    bg("panelA5", "#FFA500");
    bg("panelB5", "#FFA500");
    bg("panelC5", "#FFA500");
    bg("panelA6", "#FFA500");
    bg("panelB6", "#FFA500");
    bg("panelC6", "#FFA500");
    bg("panelA7", "#FFA500");
    bg("panelB7", "#FFA500");
    bg("panelC7", "#FFA500");
    bg("panelRight", "#00ff88ff");
    bg("panelLeft", "#00ff88ff");
    bg("panelLeg", "#00ff88ff");
    bg("panelMainA", "#FFA500");
    bg("panelMainB", "#FFA500");
    bg("panelMainC", "#FFA500");
    bg("panelPump", "#FFA500");
    bg("panelPump1", "#FFA500");

    if (typeof updateUserInfoFromDisplay === "function") updateUserInfoFromDisplay();
  };

  window.toggleMenu = function () {
    const el = byId("navDemo");
    if (!el) return;
    if (el.className.indexOf("w3-show") == -1) el.className += " w3-show";
    else el.className = el.className.replace(" w3-show", "");
  };
})();
