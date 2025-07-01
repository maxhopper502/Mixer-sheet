
window.importFromPhoto = function () {
  alert("📷 OCR function started");

  const file = document.getElementById("photoInput").files[0];
  if (!file) return alert("Please select a photo first.");

  Tesseract.recognize(file, 'eng').then(({ data: { text } }) => {
    alert("📄 OCR text recognized");
    document.getElementById("ocrOutput").textContent = text;

    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    const f = document.getElementById("job-form");

    lines.forEach(line => {
      if (/customer|client/i.test(line)) f.elements["client"].value = line.split(":")[1]?.trim() || "";
      if (/order.*work.*(number|no)/i.test(line)) {
        const match = line.match(/\b\d{4,}\b/);
        if (match) f.elements["orderNumber"].value = match[0];
      }
      if (/crop|farm/i.test(line) && !f.elements["crop"].value) {
        const cropMatch = line.match(/wheat|barley|canola|lucerne|sorghum|cotton|oats/i);
        if (cropMatch) f.elements["crop"].value = cropMatch[0];
      }
      if (/total.*area|hectares/i.test(line) && !/load volume/i.test(line)) {
        const ha = line.match(/\d+(\.\d+)?/);
        if (ha) f.elements["hectares"].value = parseFloat(ha[0]);
      }
      if ((/vol.*per.*ha/i.test(line) || /\/ha/i.test(line)) && !/load volume/i.test(line)) {
        const vol = line.match(/\d+(\.\d+)?/);
        if (vol) f.elements["volPerHa"].value = parseFloat(vol[0]);
      }
      if (/no.*loads/i.test(line)) {
        const loads = line.match(/\d+/);
        if (loads) f.elements["loads"].value = parseInt(loads[0]);
      }
    });

    alert("✅ OCR complete. Please confirm the details and add Pilot + Aircraft manually.");
  }).catch(err => {
    console.error(err);
    alert("❌ OCR failed. Try again with a clearer photo.");
  });
}
