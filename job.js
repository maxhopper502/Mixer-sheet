let loadCount = 0;
let addButton;
const job = JSON.parse(localStorage.getItem("mixerJob") || "{}");
let products = JSON.parse(localStorage.getItem("mixerProducts") || "[]");

function getCurrentTime() {
  return new Date().toLocaleTimeString();
}

function getCurrentDate() {
  return new Date().toLocaleDateString();
}

function showHeader() {
  const el = document.getElementById("job-header");
  const totalVolume = (job.hectares * job.volPerHa).toFixed(1);
  el.innerHTML = `
    <p><strong>Client:</strong> ${job.client}</p>
    <p><strong>Crop:</strong> ${job.crop} | <strong>Ha:</strong> ${job.hectares} | <strong>Water/Ha:</strong> ${job.volPerHa} L</p>
    <p><strong>Total Volume:</strong> ${totalVolume} L | <strong>Loads:</strong> ${job.loads}</p>
    <p><strong>Pilot:</strong> ${job.pilot} | <strong>Aircraft:</strong> ${job.aircraft}</p>
  `;
}

function addLoad() {
  const haPerLoad = job.hectares / job.loads;
  loadCount++;

  const container = document.getElementById("products");
  const load = document.createElement("div");
  load.className = "load";
  load.dataset.completed = "false";

  let html = `<h3>Load #${loadCount}</h3>
              <p><strong>Date:</strong> ${getCurrentDate()} | <strong>Time:</strong> ${getCurrentTime()}</p>`;

  const productChecks = [];

  products.forEach((product, i) => {
    const rate = product.rate;
    const unit = product.unit;
    const required = rate * haPerLoad;
    let fromContainers = [];
    let remaining = required;
    product.containers = product.containers || [];

    while (remaining > 0 && product.containers.length > 0) {
      const available = product.containers[0];
      if (available >= remaining) {
        product.containers[0] -= remaining;
        fromContainers.push(`${remaining.toFixed(3)} ${unit} from container (now ${product.containers[0].toFixed(3)} ${unit})`);
        remaining = 0;
      } else {
        fromContainers.push(`${available.toFixed(3)} ${unit} from container (now 0 ${unit})`);
        remaining -= available;
        product.containers.shift();
      }
    }

    const btnId = `load-${loadCount}-product-${i}`;
    html += `<p><strong>${product.name}</strong><br>
      Rate: ${rate.toFixed(3)} ${unit}/ha | Per Load: ${required.toFixed(3)} ${unit}<br>
      ${fromContainers.join("<br>")}
      <br><button id="${btnId}" onclick="markProductAdded('${btnId}', this)">✅ Add</button>
    </p>`;
    productChecks.push(btnId);
  });

  html += `<div id="load-done-${loadCount}" style="display:none;">
    <button onclick="markLoadComplete(${loadCount}, this)">✅ Loaded</button>
  </div>
  <div id="load-complete-${loadCount}" style="display:none;"><strong>✅ Load Confirmed at ${getCurrentTime()}</strong></div>`;

  load.dataset.checks = JSON.stringify(productChecks);
  container.appendChild(load);
  load.innerHTML += html;
  localStorage.setItem("mixerProducts", JSON.stringify(products));

  if (addButton) addButton.disabled = (loadCount > 0); // disable again after new load
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
    const doneDiv = parentLoad.querySelector(`[id^='load-done-']`);
    doneDiv.style.display = "block";
  }
}

function markLoadComplete(loadNum, btn) {
  const box = document.getElementById(`load-complete-${loadNum}`);
  box.style.display = "block";
  btn.style.display = "none";

  if (addButton) addButton.disabled = false;
}

function resetData() {
  localStorage.removeItem("mixerProducts");
  localStorage.removeItem("mixerJob");
  location.href = "setup.html";
}

window.onload = () => {
  showHeader();
  addButton = document.getElementById("add-load-button");
  if (addButton) addButton.disabled = loadCount > 0; // disabled at start
};
