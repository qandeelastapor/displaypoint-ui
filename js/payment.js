/* ═══════════════ S4 PAYMENT ═══════════════ */
function buildPayment() {
  const booked = ALL_DPS.filter((d) => S.checked.has(d.id));
  const totalSlots = booked.reduce(
    (a, d) => a + (S.slots[d.id] || []).length,
    0,
  );
  const totalTokens = booked.reduce(
    (a, dp) => a + (S.slots[dp.id] || []).length * dp.tokensPerSlot,
    0,
  );
  document.getElementById("payDPs").textContent = booked.length;
  document.getElementById("paySlots").textContent = totalSlots;
  document.getElementById("payTokens").textContent = totalTokens;
  document.getElementById("paySumDPs").textContent = booked.length;
  document.getElementById("paySumSlots").textContent = totalSlots;
  document.getElementById("payTotal").textContent = totalTokens;
  document.getElementById("payBtnAmt").textContent =
    `${totalTokens} token${totalTokens !== 1 ? "s" : ""}`;
}

