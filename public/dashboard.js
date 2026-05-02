const lotId = localStorage.getItem("lot_id");
const apiBaseUrl = `${window.location.origin}/api/auth`;

document.addEventListener("DOMContentLoaded", () => {
  if (!lotId) {
    showMessage("Session expired", "Please login again to continue.", "error", () => {
      window.location.href = "login.html";
    });
    return;
  }

  document.getElementById("activeLotId").textContent = lotId;
});

let messageCallback = null;

function showMessage(title, message, type = "error", onClose = null) {
  const popup = document.getElementById("messagePopup");
  const icon = document.getElementById("messageIcon");

  messageCallback = onClose;
  document.getElementById("messageTitle").textContent = title;
  document.getElementById("messageText").textContent = message;
  icon.textContent = type === "success" ? "OK" : "!";
  popup.className = `message-popup ${type}`;
}

function closeMessage() {
  document.getElementById("messagePopup").classList.add("hidden");

  if (messageCallback) {
    const callback = messageCallback;
    messageCallback = null;
    callback();
  }
}

function showPopup(popupId) {
  document.getElementById("modalOverlay").classList.remove("hidden");
  document.getElementById(popupId).classList.remove("hidden");
}

// CHECK-IN
function openCheckin() {
  document.getElementById("lot_id_checkin").value = lotId;
  document.getElementById("vehicle_no_checkin").value = "";
  document.getElementById("four_no_checkin").value = "";

  showPopup("checkinPopup");
}

// CHECK-OUT
function openCheckout() {
  document.getElementById("lot_id_checkout").value = lotId;
  document.getElementById("vehicle_no_checkout").value = "";
  document.getElementById("four_no_checkout").value = "";
  document.getElementById("checkoutDuration").classList.add("hidden");
  document.getElementById("checkoutDurationValue").textContent = "0 hours 0 minutes";

  showPopup("checkoutPopup");
}

function closePopup() {
  document.getElementById("modalOverlay").classList.add("hidden");
  document.getElementById("checkinPopup").classList.add("hidden");
  document.getElementById("checkoutPopup").classList.add("hidden");
}

function validateParkingForm(vehicleNo, fourNo) {
  if (!vehicleNo || !fourNo) {
    showMessage("Missing details", "Please enter vehicle number and four digit number.");
    return false;
  }

  if (!/^\d{4}$/.test(fourNo)) {
    showMessage("Invalid four digit number", "Four digit number must contain exactly 4 digits.");
    return false;
  }

  return true;
}

// API CALLS
function submitCheckin() {
  const vehicleNo = document.getElementById("vehicle_no_checkin").value.trim().toUpperCase();
  const fourNo = document.getElementById("four_no_checkin").value.trim();

  if (!validateParkingForm(vehicleNo, fourNo)) {
    return;
  }

  fetch(`${apiBaseUrl}/checkin`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      lot_id: lotId,
      vehicle_no: vehicleNo,
      four_no: fourNo
    })
  })
  .then(async (res) => {
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || data.error || "Check-In failed");
    }

    closePopup();
    showMessage("Check-In successful", data.message || "Vehicle checked in successfully.", "success");
  })
  .catch((err) => showMessage("Check-In failed", err.message));
}

function submitCheckout() {
  const vehicleNo = document.getElementById("vehicle_no_checkout").value.trim().toUpperCase();
  const fourNo = document.getElementById("four_no_checkout").value.trim();

  if (!validateParkingForm(vehicleNo, fourNo)) {
    return;
  }

  fetch(`${apiBaseUrl}/checkout`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      lot_id: lotId,
      vehicle_no: vehicleNo,
      four_no: fourNo
    })
  })
  .then(async (res) => {
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || data.error || "Check-Out failed");
    }

    const duration = data.duration || { hours: 0, minutes: 0 };
    const hours = Number(duration.hours) || 0;
    const minutes = Number(duration.minutes) || 0;

    document.getElementById("checkoutDurationValue").textContent = `${hours} hours ${minutes} minutes`;
    document.getElementById("checkoutDuration").classList.remove("hidden");
    showMessage("Check-Out successful", data.message || "Vehicle checked out successfully.", "success");
  })
  .catch((err) => showMessage("Check-Out failed", err.message));
}
