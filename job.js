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
    alert("No job or product found. Please import or set up a job first.");
    window.location.href = "setup.html";
    return;
  }

  // Calculate job metrics
  job.totalVolume = job.hectares * job.volPerHa;
  job.loadArea = job.hectares / job.loads;
  job.loadVolume = job.loadArea * job.volPerHa;
  job.loadTimes = job.loadTimes || [];

  // Populate summary
  document.getElementById("client").textContent = job.client || '—';
  document.getElementById("crop").textContent = job.crop || '—';
  document.getElementById("pilot").textContent = job.pilot || '—';
  document.getElementById("aircraft").textContent = job.aircraft || '—';
  document.getElementById("hectares").textContent = job.hectares || 0;
  document.getElementById("volPerHa").textContent = job.volPerHa || 0;
  document.getElementById("totalVolume").textContent = Math.round(job.totalVolume) || 0;
  document.getElementById("loadArea").textContent = job.loadArea?.toFixed(1) || 0;
  document.getElementById("loadVolume").textContent = Math.round(job.loadVolume) || 0;
  document.getElementById("loads").textContent = job.loads || 0;

  let currentLoad = 0;

  // Master container state - only modified when "Add" is clicked
  window.containerState = products.map(p => [...p.containers].sort((a, b) => a - b));

  const productsDiv = document.getElementById("products");

  function updateProductRemaining() {
    const summary = document.getElementById("stock-summary");
    summary.innerHTML = `
      <div class="card-title">
        <span class="icon orange">📦</span>
        Product Remaining
      </div>
      <div class="jobs-grid">
        ${products.map((p, i) => {
          const total = window.containerState[i].reduce((a, b) => a + b, 0).toFixed(2);
          return `
            <div class="product-item">
              <strong>${p.name}</strong>: ${total} ${p.unit}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Calculate what would be used from containers WITHOUT modifying state
  function calculateUsage(productIndex, amountNeeded) {
    const containers = [...window.containerState[productIndex]]; // Copy, don't modify
    let remaining = amountNeeded;
    const usage = [];

    for (let i = 0; i < containers.length && remaining > 0; i++) {
      const available = containers[i];
      if (available > 0) {
        const used = Math.min(available, remaining);
        remaining -= used;
        const leftInContainer = available - used;
        let line = `Container ${i + 1}: ${used.toFixed(2)} ${products[productIndex].unit}`;
        if (leftInContainer > 0 && remaining === 0) {
          line += ` (Remaining: ${leftInContainer.toFixed(2)} ${products[productIndex].unit})`;
        }
        usage.push({ containerIndex: i, used, line });
      }
    }

    return usage;
  }

  // Actually deduct from containers - called when "Add" is clicked
  function deductFromContainers(productIndex, amountNeeded) {
    let remaining = amountNeeded;

    for (let i = 0; i < window.containerState[productIndex].length && remaining > 0; i++) {
      const available = window.containerState[productIndex][i];
      if (available > 0) {
        const used = Math.min(available, remaining);
        window.containerState[productIndex][i] -= used;
        remaining -= used;
      }
    }

    // Update the display after deducting
    updateProductRemaining();
  }

  function renderLoadBlock() {
    if (currentLoad >= job.loads) {
      const completeDiv = document.createElement("div");
      completeDiv.className = "card";
      completeDiv.innerHTML = `
        <div style="text-align: center; padding: 30px;">
          <div style="font-size: 4rem; margin-bottom: 15px;">✅</div>
          <h2 style="color: #00b894;">All Loads Complete!</h2>
          <p style="color: #636e72; margin-top: 10px;">Great work! All ${job.loads} loads have been mixed and loaded.</p>
        </div>
      `;
      productsDiv.appendChild(completeDiv);
      return;
    }

    const loadDiv = document.createElement("div");
    loadDiv.className = "card load-block";
    loadDiv.innerHTML = `<h3>Load ${currentLoad + 1} of ${job.loads} — Pilot: ${job.pilot} in ${job.aircraft}</h3>`;

    const allAdded = new Array(products.length).fill(false);
    const productDeducted = new Array(products.length).fill(false); // Track if already deducted

    products.forEach((product, index) => {
      const totalPerLoad = product.rate * job.loadArea;

      // Calculate usage WITHOUT modifying state
      const usage = calculateUsage(index, totalPerLoad);

      const pDiv = document.createElement("div");
      pDiv.className = "product-entry";
      pDiv.innerHTML = `
        <strong style="color: #6c5ce7;">${product.name}</strong>: ${totalPerLoad.toFixed(2)} ${product.unit}
        <ul style="margin: 10px 0; padding-left: 20px; color: #636e72;">
          ${usage.map(u => `<li>${u.line}</li>`).join('')}
        </ul>
        <button class="btn btn-primary btn-sm add-btn">🧪 Add</button>
      `;
      loadDiv.appendChild(pDiv);

      const button = pDiv.querySelector(".add-btn");
      button.onclick = () => {
        allAdded[index] = !allAdded[index];

        if (allAdded[index]) {
          // Only deduct from containers when marked as added (and not already deducted)
          if (!productDeducted[index]) {
            deductFromContainers(index, totalPerLoad);
            productDeducted[index] = true;
          }
          button.textContent = "✅ Added";
          button.className = "btn btn-success btn-sm";
        } else {
          // If unchecking, we need to add the product back
          if (productDeducted[index]) {
            // Add back to containers
            let remaining = totalPerLoad;
            for (let i = 0; i < window.containerState[index].length && remaining > 0; i++) {
              // Find original capacity and add back what was taken
              const originalContainer = products[index].containers.sort((a,b) => a-b)[i] || 0;
              const currentAmount = window.containerState[index][i];
              const spaceUsed = originalContainer - currentAmount;
              const addBack = Math.min(spaceUsed, remaining);
              window.containerState[index][i] += addBack;
              remaining -= addBack;
            }
            productDeducted[index] = false;
            updateProductRemaining();
          }
          button.textContent = "🧪 Add";
          button.className = "btn btn-primary btn-sm";
        }

        const allConfirmed = allAdded.every(v => v);
        const existingLoadedBtn = loadDiv.querySelector(".load-confirm");

        if (allConfirmed && !existingLoadedBtn) {
          const loadedBtn = document.createElement("button");
          loadedBtn.textContent = "➕ Load Plane";
          loadedBtn.className = "btn btn-success load-confirm";
          loadedBtn.style.width = "100%";
          loadedBtn.style.marginTop = "15px";
          loadedBtn.onclick = () => {
            loadedBtn.disabled = true;
            loadedBtn.textContent = "✅ Loaded";
            loadedBtn.style.opacity = "0.7";

            const ts = new Date().toLocaleString();
            const tsP = document.createElement("p");
            tsP.style.marginTop = "10px";
            tsP.style.color = "#00b894";
            tsP.style.fontWeight = "500";
            tsP.innerHTML = `🕒 Loaded at ${ts}`;
            loadDiv.appendChild(tsP);

            job.loadTimes.push(ts);
            localStorage.setItem("mixerJob", JSON.stringify(job));

            currentLoad++;
            renderLoadBlock();
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

// Navigation functions
function editJob() {
  const aircraft = new URLSearchParams(location.search).get("aircraft");
  window.location.href = `setup.html?aircraft=${aircraft}`;
}

function deleteJob() {
  const aircraft = new URLSearchParams(location.search).get("aircraft");
  if (confirm("Are you sure you want to delete this job?")) {
    localStorage.removeItem(`job_${aircraft}`);
    localStorage.removeItem(`products_${aircraft}`);
    localStorage.removeItem("mixerJob");
    localStorage.removeItem("mixerProducts");
    window.location.href = "index.html";
  }
}

async function exportJob() {
  const job = JSON.parse(localStorage.getItem("mixerJob"));
  const products = JSON.parse(localStorage.getItem("mixerProducts"));

  if (!job || !products || products.length === 0) {
    alert("No job or product data to export.");
    return;
  }

  const mixer = prompt("Enter mixer name:");
  if (!mixer) return;

  // Calculate product remaining
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
  doc.text(`Area: ${job.hectares} ha | Vol/Ha: ${job.volPerHa} L | Total Vol: ${Math.round(job.totalVolume)} L`, margin, y);
  y += 6;
  doc.text(`Load Area: ${job.loadArea.toFixed(1)} ha | Load Vol: ${Math.round(job.loadVolume)} L | Loads: ${job.loads}`, margin, y);
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

  // Save to history
  const history = JSON.parse(localStorage.getItem('completedJobs') || '[]');
  history.push({
    client: job.client,
    aircraft: job.aircraft,
    orderNumber: job.orderNumber,
    exportDate: new Date().toLocaleString(),
    mixer: mixer
  });
  localStorage.setItem('completedJobs', JSON.stringify(history));

  alert("✅ Job exported successfully! PDF downloaded.");
}
