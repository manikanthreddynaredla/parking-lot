function showMessage(title, message, type = "error") {
  const popup = document.getElementById("messagePopup");
  const icon = document.getElementById("messageIcon");

  document.getElementById("messageTitle").textContent = title;
  document.getElementById("messageText").textContent = message;
  icon.textContent = type === "success" ? "OK" : "!";
  popup.className = `message-popup ${type}`;
}

function closeMessage() {
  document.getElementById("messagePopup").classList.add("hidden");
}

async function login() {
  const lot_id = document.getElementById("lot_id").value.trim();
  const user_id = document.getElementById("user_id").value.trim();
  const password = document.getElementById("password").value;

  if (!lot_id || !user_id || !password) {
    showMessage("Missing details", "Please enter Lot ID, User ID, and Password.");
    return;
  }

  try {
    const loginUrl = await buildApiUrl("/login");

    fetch(loginUrl, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        lot_id,
        user_id,
        password
      })
    })
    .then(async (res) => {
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || data.error || "Login Failed");
      }

      // store lot_id
      localStorage.setItem("lot_id", lot_id);
      localStorage.setItem("user_id", user_id);

      // navigate to dashboard
      window.location.href = "dashboard.html";
    })
    .catch((err) => showMessage("Login failed", err.message));
  } catch (err) {
    showMessage("Login failed", err.message);
  }
}
