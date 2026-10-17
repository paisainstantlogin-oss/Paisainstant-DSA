function checkPin() {
  const pin = document.getElementById("pinInput").value.trim();
  const box = document.getElementById("pinResults");
  const names = {
    muthoot: "Muthoot",
    incred: "InCred",
    fibe: "Fibe",
    poonawalla: "Poonawalla Fincorp",
    unity: "Unity Bank",
    hero: "Hero KYC Loan",
    perfr: "PrefR Loan",
    moneycontrol: "Moneycontrol",
    moneyview: "Moneyview",
    bharatpe: "BharatPe"
  };
  const additionalLenders = ["moneycontrol", "moneyview", "bharatpe"];

  if (pin.length !== 6) {
    box.innerHTML = "<p>Enter a valid 6-digit pincode</p>";
    return;
  }

  const matchedLenders = window.PINCODE_LENDERS[pin] || [];
  const lenders = [...new Set([...matchedLenders, ...additionalLenders])];
  box.innerHTML = "<b>Available Lenders</b>" + lenders
    .map((id) => `<div class="pin-lender">✅ ${names[id] || id}</div>`)
    .join("");
}