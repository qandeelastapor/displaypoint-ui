/* ═══════════════ STEPS ═══════════════
   New flow order per proposed flow.xlsx:
     1 Locations  →  2 Format  →  3 Review  →  4 Payment  →  5 Done

   Screen IDs in the DOM are kept stable to avoid CSS churn:
     #s1 is the Format screen, #s2 is the Locations screen, etc.
   STEP_CFG.scrId maps the logical step number to the DOM screen. */
const STEP_CFG = {
  1: {
    scrId: "s2",
    title: "Select Locations",
    prog: "20%",
    btn: "Continue",
    pls: [1, 0, 0, 0, 0],
  },
  2: {
    scrId: "s1",
    title: "Ad Format",
    prog: "40%",
    btn: "Review Campaign",
    pls: [2, 1, 0, 0, 0],
  },
  3: {
    scrId: "s3",
    title: "Review Campaign",
    prog: "60%",
    btn: "Proceed to Payment",
    pls: [2, 2, 1, 0, 0],
  },
  4: {
    scrId: "s4",
    title: "Payment",
    prog: "80%",
    btn: "",
    pls: [2, 2, 2, 1, 0],
  },
  5: {
    scrId: "s5",
    title: "Done!",
    prog: "100%",
    btn: "New Campaign",
    pls: [2, 2, 2, 2, 1],
  },
};

function goStep(n) {
  document
    .querySelectorAll(".scr")
    .forEach((s) => s.classList.remove("on"));
  const c = STEP_CFG[n];
  const scr = document.getElementById(c.scrId);
  if (scr) scr.classList.add("on");
  S.step = n;

  /* Locations title is flow-aware: xlsx labels this "One Shot AD" in
     the fast-track path and "New Campaign" in the customized path. */
  let title = c.title;
  if (n === 1) {
    title = S.flow === "oneshot" ? "One Shot AD" : "New Campaign";
  }
  document.getElementById("hdTitle").textContent = title;

  const mainBtnEl = document.getElementById("mainBtn");
  mainBtnEl.textContent = c.btn;
  document.getElementById("progFill").style.width = c.prog;
  mainBtnEl.style.display = n === 4 ? "none" : "block";
  mainBtnEl.disabled = false;
  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById("pl" + i);
    const v = c.pls[i - 1];
    el.className = "pl" + (v === 1 ? " act" : v === 2 ? " done" : "");
  }
  if (n === 1) {
    renderLocTabs();
    renderDPList();
  }
  if (n === 2 && typeof setMediaPickSource === "function") {
    setMediaPickSource(S.mediaPickSource || "gallery");
  }
  if (n === 3) buildReview();
  if (n === 4) buildPayment();
}

document.getElementById("mainBtn").onclick = () => {
  if (S.step === 1) {
    /* Validate at least one DP with at least one slot. */
    const valid = [...S.checked].filter(
      (id) => (S.slots[id] || []).length > 0,
    );
    if (!S.checked.size) {
      toast("Select at least one display point");
      return;
    }
    if (!valid.length) {
      toast("Add at least one slot to a selected display point");
      return;
    }
    goStep(2);
  } else if (S.step === 2) {
    goStep(3);
  } else if (S.step === 3) {
    /* The review button is kept disabled by buildReview() unless the
       user is authed AND has enough tokens AND has booked something.
       If it is clicked it means all gates pass — but double-check
       defensively so a stale state can't slip through. */
    const booked = ALL_DPS.filter((d) => S.checked.has(d.id));
    const totalTokens = booked.reduce(
      (a, dp) => a + (S.slots[dp.id] || []).length * dp.tokensPerSlot,
      0,
    );
    if (!booked.length || totalTokens < 1) {
      toast("Select display points and slots first");
      return;
    }
    if (!S.authed) {
      goToAuth("review");
      return;
    }
    if (S.tokenBalance < totalTokens) {
      toast("You need enough tokens to complete this campaign");
      return;
    }
    goStep(4);
  } else if (S.step === 5) {
    resetAll();
  }
};

document.getElementById("backBtn").onclick = () => {
  if (S.step === 1) {
    /* Back from the first wizard step returns to Dashboard. */
    goView("dashboard");
  } else if (S.step === 2) goStep(1);
  else if (S.step === 3) goStep(2);
  else if (S.step === 4) goStep(3);
  else if (S.step === 5) goView("dashboard");
};
