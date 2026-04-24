/* ═══════════════ PACKAGES ═══════════════ */
function openPackagesModal() {
  document.getElementById("packagesModal").classList.add("open");
  renderPackagesContent();
}

function closePackagesModal() {
  document.getElementById("packagesModal").classList.remove("open");
}

function renderPackagesContent() {
  const container = document.getElementById("packagesContainer");
  let html = '<div style="margin-bottom:16px">';

  // Add More button on top
  html += `
    <button style="width:100%;padding:14px;background:var(--blue);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:16px" onclick="openCustomPurchaseSheet()">
      <i class="fas fa-plus" style="margin-right:6px"></i> Add More
    </button>`;

  // Regular packages
  html +=
    '<div style="font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;margin-bottom:10px">Standard Packages</div>';
  PACKAGES.forEach((pkg) => {
    html += `
      <div class="package-card">
        <div class="package-info">
          <div class="package-name">${pkg.name}</div>
          <div class="package-tokens">${pkg.tokens.toLocaleString()} Tokens</div>
          <div class="package-price">€${pkg.price}</div>
        </div>
        <button class="package-btn" onclick="buyPackage(${pkg.id})">Buy</button>
      </div>`;
  });

  // Business packages
 
  BUSINESS_PACKAGES.forEach((pkg) => {
    html += `
      <div class="package-card">
        <div class="package-info">
          <div class="package-name">${pkg.name}</div>
          <div class="package-tokens">${pkg.tokens.toLocaleString()} Tokens</div>
          <div class="package-price">€${pkg.price}</div>
        </div>
        <button class="package-btn" onclick="buyPackage(${pkg.id})">Buy</button>
      </div>`;
  });

  html += "</div>";
  container.innerHTML = html;
}

function updateCustomTotal() {
  const tokens =
    parseInt(document.getElementById("customTokens").value) || 0;
  const ratePerToken = 5 / 50;
  const total = (tokens * ratePerToken).toFixed(2);
  document.getElementById("customTotal").textContent = total;
}

function buyPackage(packageId) {
  const allPackages = [...PACKAGES, ...BUSINESS_PACKAGES];
  const pkg = allPackages.find((p) => p.id === packageId);
  if (pkg) {
    S.tokenBalance += pkg.tokens;
    toast(`✓ ${pkg.name} purchased! +${pkg.tokens} tokens`);
    closePackagesModal();
    if (S.step === 3) buildReview();
  }
}

function buyCustomPackage() {
  const tokens =
    parseInt(document.getElementById("customTokens").value) || 0;
  if (tokens < 1) {
    toast("Please enter a valid amount");
    return;
  }
  const ratePerToken = 5 / 50;
  const total = (tokens * ratePerToken).toFixed(2);
  S.tokenBalance += tokens;
  toast(`✓ Custom purchase! +${tokens} tokens for €${total}`);
  closePackagesModal();
  if (S.step === 3) buildReview();
}

function openCustomPurchaseSheet() {
  document.getElementById("bsBackdrop").classList.add("show");
  document.getElementById("customPurchaseSheet").classList.add("open");
  setTimeout(() => {
    const input = document.getElementById("bsCustomTokens");
    if (input) input.focus();
  }, 100);
  document
    .getElementById("bsCustomTokens")
    .addEventListener("input", updateBSCustomTotal);
}

function closeCustomPurchaseSheet() {
  document.getElementById("customPurchaseSheet").classList.remove("open");
  document.getElementById("bsBackdrop").classList.remove("show");
  document.getElementById("bsCustomTokens").value = "";
  document.getElementById("bsCustomTotal").textContent = "0.00";
}

function updateBSCustomTotal() {
  const tokens =
    parseInt(document.getElementById("bsCustomTokens").value) || 0;
  const ratePerToken = 5 / 50;
  const total = (tokens * ratePerToken).toFixed(2);
  document.getElementById("bsCustomTotal").textContent = total;
}

function buyCustomPackageFromSheet() {
  const tokens =
    parseInt(document.getElementById("bsCustomTokens").value) || 0;
  if (tokens < 1) {
    toast("Please enter a valid amount");
    return;
  }
  const ratePerToken = 5 / 50;
  const total = (tokens * ratePerToken).toFixed(2);
  S.tokenBalance += tokens;
  toast(`✓ Custom purchase! +${tokens} tokens for €${total}`);
  document.getElementById("customPurchaseSheet").classList.remove("open");
  document.getElementById("bsBackdrop").classList.remove("show");
  document.getElementById("bsCustomTokens").value = "";
  document.getElementById("bsCustomTotal").textContent = "0.00";
  if (S.step === 3) buildReview();
}

