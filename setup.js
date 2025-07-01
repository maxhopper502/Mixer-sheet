let products = JSON.parse(localStorage.getItem("mixerProducts") || "[]");
let editIndex = null;

document.getElementById("importFile").addEventListener("change", function(evt) {
  const file = evt.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      const job = data.job || data;
      if (!job.client || !job.hectares || !data.products) throw "Invalid file format";

      const f = document.getElementById("job-form");
      f.elements["client"].value = job.client || "";
      f.elements["crop"].value = job.crop || "";
      f.elements["pilot"].value = job.pilot || "";
      f.elements["aircraft"].value = job.aircraft || "";
      f.elements["hectares"].value = job.hectares || "";
      f.elements["volPerHa"].value = job.volPerHa || "";
      f.elements["loads"].value = job.loads || "";
      f.elements["orderNumber"].value = job.orderNumber || "";

      localStorage.setItem("mixerJob", JSON.stringify(job));
      localStorage.setItem("mixerProducts", JSON.stringify(data.products));

      products = data.products;
      updateProductList();
      alert("✅ Job imported successfully!");
    } catch (err) {
      alert("❌ Failed to import job: " + err);
    }
  };
  reader.readAsText(file);
});

function updateProductList() {
  const ha = parseFloat(new FormData(document.getElementById("job-form")).get("hectares") || 0);
  const list = document.getElementById("product-list");
  list.innerHTML = products.map((p, i) => {
    const required = +(p.rate * ha).toFixed(3);
    const available = +p.containers.reduce((a,b)=>a+b,0).toFixed(3);
    const diff = +(available - required).toFixed(3);
    const ok = diff >= 0;
    return `<div class="product-card"><strong>${p.name}</strong> @ ${p.rate.toFixed(3)} ${p.unit}/ha<br>
    Required: ${required} ${p.unit}<br>
    Supplied: ${available} ${p.unit}<br>
    Difference: ${diff} ${p.unit} ${ok ? "✅" : "⚠️"}<br>
    <button onclick="loadProduct(${i})">Edit</button>
    <button onclick="deleteProduct(${i})">🗑 Delete</button></div>`;
  }).join("");
}

function loadProduct(index) {
  const p = products[index];
  const form = document.getElementById("product-form");
  form.name.value = p.name;
  form.rate.value = p.rate;
  form.unit.value = p.unit;
  form.container.value = p.containers[0];
  form.count.value = p.containers.length;
  editIndex = index;
}

function deleteProduct(index) {
  if (confirm("Are you sure you want to delete this product?")) {
    products.splice(index, 1);
    localStorage.setItem("mixerProducts", JSON.stringify(products));
    updateProductList();
  }
}

document.getElementById("product-form").onsubmit = e => {
  e.preventDefault();
  const data = new FormData(e.target);
  const updated = {
    name: data.get("name"),
    rate: parseFloat(data.get("rate")),
    unit: data.get("unit"),
    containers: Array(parseInt(data.get("count"))).fill(parseFloat(data.get("container")))
  };
  if (editIndex !== null) {
    products[editIndex] = updated;
    editIndex = null;
  } else {
    products.push(updated);
  }
  localStorage.setItem("mixerProducts", JSON.stringify(products));
  e.target.reset();
  updateProductList();
};

function startJob() {
  const f = new FormData(document.getElementById("job-form"));
  const job = {
    client: f.get("client"),
    crop: f.get("crop"),
    hectares: parseFloat(f.get("hectares")),
    loads: parseInt(f.get("loads")),
    volPerHa: parseFloat(f.get("volPerHa")),
    pilot: f.get("pilot"),
    aircraft: f.get("aircraft").trim().toUpperCase(),
    orderNumber: f.get("orderNumber")
  };
  localStorage.setItem("mixerJob", JSON.stringify(job));
  window.location.href = "job.html";
};

document.addEventListener("DOMContentLoaded", () => {
  const job = JSON.parse(localStorage.getItem("mixerJob"));
  if (job) {
    const f = document.getElementById("job-form");
    f.elements["client"].value = job.client || "";
    f.elements["crop"].value = job.crop || "";
    f.elements["pilot"].value = job.pilot || "";
    f.elements["aircraft"].value = job.aircraft || "";
    f.elements["hectares"].value = job.hectares || "";
    f.elements["volPerHa"].value = job.volPerHa || "";
    f.elements["loads"].value = job.loads || "";
    f.elements["orderNumber"].value = job.orderNumber || "";
  }

  const saved = JSON.parse(localStorage.getItem("mixerProducts"));
  if (saved && Array.isArray(saved)) {
    products = saved;
    updateProductList();
  }
});


function importFromPhoto() {
  const file = document.getElementById("photoInput").files[0];
  if (!file) return alert("Please select a photo first.");

  Tesseract.recognize(file, 'eng').then(({ data: { text } }) => {
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

      // Skip "Load Volume" entirely
    });

    alert("✅ OCR complete. Please confirm the details and add Pilot + Aircraft manually.");
  }).catch(err => {
    console.error(err);
    alert("❌ OCR failed. Try again with a clearer photo.");
  });
});
}
