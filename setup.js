
function autoCalcRate() {
  const ha = parseFloat(document.getElementById("job-form").elements["hectares"].value);
  if (!ha || ha <= 0) {
    alert("Please enter total hectares first.");
    document.getElementById("useAll").checked = false;
    return;
  }

  const size1 = parseFloat(document.getElementById("product-form").elements["container1"].value);
  const count1 = parseInt(document.getElementById("product-form").elements["count1"].value);
  const size2 = parseFloat(document.getElementById("product-form").elements["container2"].value);
  const count2 = parseInt(document.getElementById("product-form").elements["count2"].value);

  const totalSupplied =
    (isNaN(size1) || isNaN(count1) ? 0 : size1 * count1) +
    (isNaN(size2) || isNaN(count2) ? 0 : size2 * count2);

  const rate = totalSupplied / ha;
  document.getElementById("rateField").value = rate.toFixed(3);
  document.getElementById("autoRate").textContent = `Auto Rate: ${rate.toFixed(3)} per ha`;
}

// --- Rest of setup.js from working version below this line ---

// (This placeholder assumes autoCalcRate is at the top, and rest of the working setup.js follows)
