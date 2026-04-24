/* ═══════════════ AUTH (login + register) ═══════════════
   Two-tab screen. If wizard hits Payment and user is not logged in,
   we navigate here, then return to the wizard on success. Mirrors the
   xlsx LOGIN/REGISTER sheets (screenshots image29 and image30). */

/* authReturnTo: where to go after successful auth.
   'payment' → come back to wizard step 4 (Payment)
   'dashboard' (default) */

function goToAuth(returnTo) {
  S.authReturnTo = returnTo || "dashboard";
  goView("auth");
}

function renderAuthScreen() {
  /* Default to Login tab each time we enter auth. */
  switchAuthTab("login");
  /* Mirror userType onto the register segmented control. */
  setRegType(S.userType || "individual");
}

function switchAuthTab(which) {
  document
    .querySelectorAll(".auth-tab")
    .forEach((t) => t.classList.toggle("on", t.dataset.tab === which));
  document.getElementById("authLoginPane").style.display =
    which === "login" ? "block" : "none";
  document.getElementById("authRegisterPane").style.display =
    which === "register" ? "block" : "none";
}

function setRegType(t) {
  S.userType = t;
  document
    .querySelectorAll(".auth-regtype-btn")
    .forEach((b) => b.classList.toggle("on", b.dataset.regtype === t));
}

function doLogin() {
  const email = document.getElementById("authLoginEmail").value.trim();
  const pwd = document.getElementById("authLoginPwd").value;
  if (!email || !pwd) {
    toast("Enter email and password");
    return;
  }
  S.authed = true;
  toast("Welcome back");
  onAuthSuccess();
}

function doFingerprintLogin() {
  S.authed = true;
  toast("Logged in via biometrics");
  onAuthSuccess();
}

function doRegister() {
  const email = document.getElementById("authRegEmail").value.trim();
  const pwd = document.getElementById("authRegPwd").value;
  const pwd2 = document.getElementById("authRegPwd2").value;
  if (!email || !pwd) {
    toast("Fill in required fields");
    return;
  }
  if (pwd !== pwd2) {
    toast("Passwords don't match");
    return;
  }
  S.authed = true;
  toast("Account created");
  onAuthSuccess();
}

function onAuthSuccess() {
  const target = S.authReturnTo;
  S.authReturnTo = null;
  if (target === "payment") {
    goView("wizard");
    goStep(4);
  } else if (target === "review") {
    goView("wizard");
    goStep(3);
  } else {
    goView("dashboard");
  }
}

function authBack() {
  /* Back button on auth screen: return to wherever we came from. */
  if (S.authReturnTo === "payment" || S.authReturnTo === "review") {
    goView("wizard");
    goStep(3);
  } else {
    goView("dashboard");
  }
}
