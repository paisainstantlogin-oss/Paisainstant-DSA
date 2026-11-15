function checkPin() {
  const pin = document.getElementById("pinInput").value.trim();
  const box = document.getElementById("pinResults");
  const names = {
    muthoot: "Muthoot EMI",
    poonawalla: "Poonawalla Fincorp",
    moneycontrol: "Moneycontrol",
  };
  const additionalLenders = ["moneycontrol"];

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