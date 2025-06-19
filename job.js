alert("✅ job.js is loaded!");
let loadCount = 0;
const job = JSON.parse(localStorage.getItem("mixerJob") || "{}");
let products = [];

function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString();
}

function getCurrentDate() {
  const now = new Date();
  return now.toLocaleDateString();
}

function validateAndRepairProducts(rawProducts) {
  if (!Array.isArray(rawProducts)) return [];

  const repaired = rawProducts.filter((p, index) => {
    const valid =
      p &&
      typeof p.name === "string" &&
      typeof p.rate === "number" &&
      typeof p.unit === "string" &&
      Array.isArray(p.containers) &&
      p.containers.every(c => typeof c === "number");

    if (!valid) {
      console.warn("⚠️ Skipping invalid product at index", index, p);
    }

    return valid;
  });

  if (repaired.length !== rawProducts.length) {
    localStorage.setItem("mixerProducts", JSON.stringify(repaired));
  }

  return repaired;
}

function showHeader() {
  const el = document.getElementById("job-header");
  el.innerHTML = `
    <p><strong>Client:</strong> ${job.client || ""}</p>
    <p><strong>Crop:</strong> ${job.crop || ""} &nbsp; <strong>Ha:</strong> ${job.hectares || 0} &nbsp; <strong>Loads:</strong> ${job.loads || 0}</p>
    <p><strong>Vol/Ha:</strong> ${Number(job.volPerHa || 0).toFixed(2)} L &nbsp; <strong>Pilot:</strong> ${job.pilot || ""} &nbsp; <strong>Aircraft:</strong> ${job.aircraft || ""}</p>
    <button onclick="resetAll()">🧹 Reset All</button>
  `;
}

function addLoad() {
  const haPerLoad = (parseFloat(job.hectares) || 0) / (parseInt(job.loads) || 0);
  if (!haPerLoad || isNaN(haPerLoad) || haPerLoad <= 0) {
    alert("⚠️ Invalid job hectares or load count. Please reset and re-enter.");
    return;
  }

  loadCount++;
  const container = document.getElementById("products");
  const load = document.createElement("div");
  load.className = "load";
  load.dataset.completed = "false";

  let html = `<h3>Load #${loadCount}</h3>`;
  html += `<p><strong>Date:</strong> ${getCurrentDate()} &nbsp; <strong>Time:</strong> ${getCurrentTime()}</p>`;

  const productChecks = [];

  products.forEach((product, index) => {
    try {
      const name = product.name;
      const rate = parseFloat(product.rate);
      const unit = product.unit;
      const required = rate * haPerLoad;

      let fromContainers = [];
      let remaining = required;
      const validContainers = Array.isArray(product.containers)
        ? product.containers.filter(c => typeof c === "number" && c > 0)
        : [];

      product.containers = validContainers;

      while (remaining > 0 && product.containers.length > 0) {
        const available = product.containers[0];
        if (available >= remaining) {
          product.containers[0] -= remaining;
          fromContainers.push(`${remaining.toFixed(3)} ${unit} from container (now ${product.containers[0].toFixed(3)} ${unit})`);
          remaining = 0;
        } else {
          fromContainers.push(`${available.toFixed(3)} ${unit} from container (now 0 ${unit})`);
          remaining -= available;
          product.containers.shift();
        }
      }

      const btnId = `load-${loadCount}-product-${index}`;
      html += `<p><strong>${name}</strong><br>
               Rate: ${rate.toFixed(3)} ${unit}/ha &nbsp; Per Load: ${required.toFixed(3)} ${unit}<br>
               ${fromContainers.join("<br>")}
               <br><button id="${btnId}" onclick="markProductAdded('${btnId}', this)">✅ Add</button></p>`;
      productChecks.push(btnId);
    } catch (err) {
      html += `<p style="color:red;">⚠️ Failed to render product at index ${index}</p>`;
      console.error("Error rendering product", index, product, err);
    }
  });

  html += `<div id="load-complete-${loadCount}" style="display:none;"><strong>✅ Loaded at ${getCurrentTime()}</strong></div>`;
  load.dataset.checks = JSON.stringify(productChecks);
  container.appendChild(load);
  localStorage.setItem("mixerProducts", JSON.stringify(products));
}

function markProductAdded(id, btn) {
  btn.textContent = "✔️ Added";
  btn.disabled = true;

  const parentLoad = btn.closest(".load");
  const checks = JSON.parse(parentLoad.dataset.checks);
  const allDone = checks.every(cid => {
    const el = document.getElementById(cid);
    return el && el.disabled;
  });

  if (allDone && parentLoad.dataset.completed !== "true") {
    const completeBox = parentLoad.querySelector(`[id^='load-complete-']`);
    completeBox.style.display = "block";
    completeBox.innerHTML = `✅ Loaded at ${getCurrentTime()}`;
    parentLoad.dataset.completed = "true";
  }
}

function resetData() {
  localStorage.removeItem("mixerProducts");
  localStorage.removeItem("mixerJob");
  location.href = "setup.html";
}

function resetAll() {
  if (confirm("Reset everything and start over?")) {
    resetData();
  }
}

window.onload = () => {
  const rawProducts = JSON.parse(localStorage.getItem("mixerProducts") || "[]");
  products = validateAndRepairProducts(rawProducts);
  showHeader();
};
