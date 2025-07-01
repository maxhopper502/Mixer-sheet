
function importFromPhoto() {
  const file = document.getElementById("photoInput").files[0];
  if (!file) return alert("Please select a photo first.");

  Tesseract.recognize(file, 'eng').then(({ data: { text } }) => {
    document.getElementById("ocrOutput").textContent = text;

    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    const f = document.getElementById("job-form");

    lines.forEach(line => {
      if (/client/i.test(line)) f.client.value = line.split(":")[1]?.trim() || "";
      if (/crop/i.test(line)) f.crop.value = line.split(":")[1]?.trim() || "";
      if (/pilot/i.test(line)) f.pilot.value = line.split(":")[1]?.trim() || "";
      if (/aircraft/i.test(line)) f.aircraft.value = line.split(":")[1]?.trim() || "";
      if (/hectares/i.test(line)) f.hectares.value = parseFloat(line.match(/\d+(\.\d+)?/));
      if (/volume.*ha/i.test(line)) f.volPerHa.value = parseFloat(line.match(/\d+(\.\d+)?/));
      if (/loads/i.test(line)) f.loads.value = parseInt(line.match(/\d+/));
    });

    alert("✅ OCR finished. Check and confirm job details.");
  }).catch(err => {
    console.error(err);
    alert("❌ OCR failed. Try again with a clearer photo.");
  });
}
