let loadCount = 0;
const job = JSON.parse(localStorage.getItem("mixerJob") || "{}");
const products = JSON.parse(localStorage.getItem("mixerProducts") || "[]");
const haPerLoad = job.hectares / job.loads;

function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString();
}

function getCurrentDate() {
  const now = new Date();
  return now.toLocaleDateString();
}

function showHeader() {
  const el = document.getElementById("job-header");
  el.innerHTML = `
    <p><strong>Client:</strong> ${job.client}</p>
    <p><strong>Crop:</strong> ${job.crop} &nbsp; <strong>Ha:</strong> ${job.hectares} &nbsp; <strong>Loads:</strong> ${job.loads}</p>
    <p><strong>Vol/Ha:</strong> ${Number(job.volPerHa).toFixed(2)} L &nbsp; <strong>Pilot:</strong> ${job.pilot} &nbsp; <strong>Aircraft:</strong> ${job.aircraft}</p>
  `;
}

function addLoad() {
  loadCount++;
  const container = document.getElementById("products");
  const load = document.createElement("div");
  load.className = "load";
  load.dataset.completed = "false";

  let html = `<h3>Load #${loadCount}</h3>`;
  html += `<p><strong>Date:</strong> ${getCurrentDate()} &nbsp; <strong>Time:</strong> ${getCurrentTime()}</p>`;

  const productChecks = [];

  products.forEach((product, index) => {
    const rate = parseFloat(product.rate) || 0;
    const unit = product.unit || "L";
    const required = rate * haPerLoad;
    let fromContainers = [];
    let remaining = required;

    product.containers = (product.containers || []).filter(c => c > 0);
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
    html += `<p><strong>${product.name}</strong><br>
             Rate: ${rate.toFixed(3)} ${unit}/ha &nbsp; Per Load: ${required.toFixed(3)} ${unit}<br>
             ${fromContainers.join("<br>")}
             <br><button id="${btnId}" onclick="markProductAdded('${btnId}', this)">✅ Add</button></p>`;
    productChecks.push(btnId);
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

window.onload = showHeader;
