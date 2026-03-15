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

    showV("lblPressurePump");
    showV("lblPressureMainA");
    showV("lblPressureMainB");
    showV("lblPressureMainC");
    showV("lblPressurePillow");
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
    bg("panelA6Right", "#FFA500");
    bg("panelA6Left", "#FFA500");
    bg("panelB6Right", "#FFA500");
    bg("panelB6Left", "#FFA500");
    bg("panelC6Right", "#FFA500");
    bg("panelC6Left", "#FFA500");
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
