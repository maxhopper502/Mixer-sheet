window.onload = function () {
  const urlParams = new URLSearchParams(window.location.search);
  const aircraft = urlParams.get("aircraft");

  let job = null;
  let products = null;

  if (aircraft) {
    job = JSON.parse(localStorage.getItem(`job_${aircraft}`));
    products = JSON.parse(localStorage.getItem(`products_${aircraft}`));
  }

  if (!job || !products || products.length === 0) {
    job = JSON.parse(localStorage.getItem("mixerJob"));
    products = JSON.parse(localStorage.getItem("mixerProducts"));
  }

  if (!job || !products || products.length === 0) {
    alert("❌ No job or product found. Please import or set up a job first.");
    window.location.href = "setup.html";
    return;
  }

  job.totalVolume = job.hectares * job.volPerHa;
  job.loadArea = job.hectares / job.loads;
  job.loadVolume = job.loadArea * job.volPerHa;
  job.loadTimes = job.loadTimes || [];

  document.getElementById("client").textContent = job.client;
  document.getElementById("crop").textContent = job.crop;
  document.getElementById("pilot").textContent = job.pilot;
  document.getElementById("aircraft").textContent = job.aircraft;
  document.getElementById("hectares").textContent = job.hectares;
  document.getElementById("volPerHa").textContent = job.volPerHa;
  document.getElementById("totalVolume").textContent = Math.round(job.totalVolume);
  document.getElementById("loadArea").textContent = job.loadArea.toFixed(1);
  document.getElementById("loadVolume").textContent = Math.round(job.loadVolume);
  document.getElementById("loads").textContent = job.loads;

  let currentLoad = 0;
  window.containerState = products.map(p => [...p.containers].sort((a, b) => a - b));
  const productsDiv = document.getElementById("products");

  function updateProductRemaining() {
    const summary = document.getElementById("stock-summary");
    if (summary) summary.remove();
    const newSummary = document.createElement("div");
    newSummary.id = "stock-summary";
    newSummary.innerHTML = `<h4>Product Remaining</h4>` + products.map((p, i) => {
      const total = containerState[i].reduce((a, b) => a + b, 0).toFixed(2);
      return `<p><strong>${p.name}</strong>: ${total} ${p.unit}</p>`;
    }).join("");
    document.body.appendChild(newSummary);
  }

  function renderLoadBlock() {
    if (currentLoad >= job.loads) {
      alert("✅ All loads complete");
      return;
    }

    const loadDiv = document.createElement("div");
    loadDiv.className = "load-block";
    loadDiv.innerHTML = `<h3>Load ${currentLoad + 1} – Pilot: ${job.pilot} in ${job.aircraft}</h3>`;
    const allAdded = new Array(products.length).fill(false);

    products.forEach((product, index) => {
      const totalPerLoad = product.rate * job.loadArea;
      let remaining = totalPerLoad;
      const fromContainers = [];

      for (let i = 0; i < containerState[index].length && remaining > 0; i++) {
        const available = containerState[index][i];
        if (available > 0) {
          const used = Math.min(available, remaining);
          containerState[index][i] -= used;
          remaining -= used;
          let line = `Container ${i + 1}: ${used.toFixed(2)} ${product.unit}`;
          if (containerState[index][i] > 0 && remaining === 0) {
            line += ` (Remaining: ${containerState[index][i].toFixed(2)} ${product.unit})`;
          }
          fromContainers.push(line);
        }
      }

      const pDiv = document.createElement("div");
      pDiv.innerHTML = `
        <p><strong>${product.name}</strong>: ${totalPerLoad.toFixed(2)} ${product.unit}</p>
        <ul>${fromContainers.map(c => `<li>${c}</li>`).join("")}</ul>
        <button class="add-btn">🧪 Add</button>
      `;
      loadDiv.appendChild(pDiv);

      const button = pDiv.querySelector("button");
      button.onclick = () => {
        allAdded[index] = !allAdded[index];
        if (allAdded[index]) {
          button.textContent = "✅ Added";
          button.style.background = "#28a745";
        } else {
          button.textContent = "🧪 Add";
          button.style.background = "";
        }

        const allConfirmed = allAdded.every(v => v);
        const existingLoadedBtn = loadDiv.querySelector(".load-confirm");

        if (allConfirmed && !existingLoadedBtn) {
          const loadedBtn = document.createElement("button");
          loadedBtn.textContent = "➕ Load Plane";
          loadedBtn.className = "load-confirm";
          loadedBtn.onclick = () => {
            loadedBtn.disabled = true;
            loadedBtn.textContent = "✅ Loaded";
            loadedBtn.style.background = "#28a745";
            const ts = new Date().toLocaleString();
            const tsP = document.createElement("p");
            tsP.textContent = `🕒 Loaded at ${ts}`;
            loadDiv.appendChild(tsP);
            job.loadTimes.push(ts);
            localStorage.setItem("mixerJob", JSON.stringify(job));
            currentLoad++;
            renderLoadBlock();
            updateProductRemaining();
          };
          loadDiv.appendChild(loadedBtn);
        }

        if (!allConfirmed && existingLoadedBtn) {
          existingLoadedBtn.remove();
        }
      };
    });

    productsDiv.appendChild(loadDiv);
  }

  renderLoadBlock();
  updateProductRemaining();
};

window.addEventListener("DOMContentLoaded", () => {
  const btnWrap = document.createElement("div");
  btnWrap.style.margin = "30px 12px";

  const editJobBtn = document.createElement("button");
  editJobBtn.textContent = "✏️ Edit Job";
  editJobBtn.onclick = () => {
    const aircraft = new URLSearchParams(location.search).get("aircraft");
    window.location.href = `setup.html?aircraft=${aircraft}`;
  };

  const deleteJobBtn = document.createElement("button");
  deleteJobBtn.textContent = "🗑️ Delete Job";
  deleteJobBtn.onclick = () => {
    const aircraft = new URLSearchParams(location.search).get("aircraft");
    if (confirm("Are you sure you want to delete this job?")) {
      localStorage.removeItem(`job_${aircraft}`);
      localStorage.removeItem(`products_${aircraft}`);
      localStorage.removeItem("mixerJob");
      localStorage.removeItem("mixerProducts");
      window.location.href = "setup.html";
    }
  };

  const exportJobBtn = document.createElement("button");
  exportJobBtn.textContent = "📤 Export Job";
  exportJobBtn.onclick = exportJob;

  btnWrap.appendChild(editJobBtn);
  btnWrap.appendChild(deleteJobBtn);
  btnWrap.appendChild(exportJobBtn);
  document.body.appendChild(btnWrap);
});

async function exportJob() {
  const job = JSON.parse(localStorage.getItem("mixerJob"));
  const products = JSON.parse(localStorage.getItem("mixerProducts"));
  if (!job || !products || products.length === 0) {
    alert("❌ No job or product data to export.");
    return;
  }

  const mixer = prompt("Enter mixer name:");
  if (!mixer) return;

  // Update product remaining
  const productRemaining = products.map((p, i) => ({
    name: p.name,
    remaining: window.containerState[i].reduce((a, b) => a + b, 0).toFixed(2),
    unit: p.unit
  }));

  // Generate PDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const margin = 14;
  let y = 20;

  doc.setFontSize(16);
  doc.text(`Mixer Sheet – Client: ${job.client}`, margin, y);
  y += 8;
  if (job.orderNumber) {
    doc.setFontSize(12);
    doc.text(`Work Order #: ${job.orderNumber}`, margin, y);
    y += 8;
  }
  doc.text(`Mixer: ${mixer}`, margin, y);
  y += 8;

  doc.setFontSize(11);
  doc.text(`Pilot: ${job.pilot}`, margin, y);
  y += 6;
  doc.text(`Aircraft: ${job.aircraft}`, margin, y);
  y += 6;
  doc.text(`Crop: ${job.crop}`, margin, y);
  y += 6;
  doc.text(`Area: ${job.hectares} ha  | Vol/Ha: ${job.volPerHa} L  | Total Vol: ${Math.round(job.totalVolume)} L`, margin, y);
  y += 6;
  doc.text(`Load Area: ${job.loadArea.toFixed(1)} ha  | Load Vol: ${Math.round(job.loadVolume)} L  | Loads: ${job.loads}`, margin, y);
  y += 10;

  doc.text("Chemicals:", margin, y);
  y += 6;
  products.forEach(p => {
    doc.text(`${p.name} – ${p.rate} ${p.unit}/ha`, margin + 4, y);
    y += 6;
  });

  y += 4;
  doc.text("Remaining Product:", margin, y);
  y += 6;
  productRemaining.forEach(p => {
    doc.text(`${p.name}: ${p.remaining} ${p.unit}`, margin + 4, y);
    y += 6;
  });

  if (job.loadTimes?.length) {
    y += 6;
    doc.text("Load Times:", margin, y);
    job.loadTimes.forEach((t, i) => {
      y += 6;
      doc.text(`Load ${i + 1}: ${t}`, margin + 4, y);
    });
  }

  const filename = `${job.client}_${job.orderNumber || 'order'}_${job.aircraft}_mixer_sheet.pdf`;
  doc.save(filename);

  // Upload to Dropbox
  const blob = doc.output("blob");
  const dbToken = "YOUR_DROPBOX_ACCESS_TOKEN_HERE"; // Replace with your Dropbox token
  const path = `/${filename}`;
  await fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${dbToken}`,
      "Dropbox-API-Arg": JSON.stringify({ path, mode: "add", autorename: true }),
      "Content-Type": "application/octet-stream"
    },
    body: blob
  });

  const jsonBlob = new Blob(
    [JSON.stringify({ job: { ...job, mixer }, products }, null, 2)],
    { type: "application/json" }
  );

  await fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${dbToken}`,
      "Dropbox-API-Arg": JSON.stringify({ path: `/${filename.replace(".pdf", ".json")}`, mode: "add", autorename: true }),
      "Content-Type": "application/octet-stream"
    },
    body: jsonBlob
  });

  alert("✅ Job exported and uploaded to Dropbox.");
}

