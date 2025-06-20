
let loadCount = parseInt(sessionStorage.getItem("loadCount") || "0");
const job = JSON.parse(localStorage.getItem("mixerJob") || "{}");
let products = JSON.parse(localStorage.getItem("mixerProducts") || "[]");

function showHeader() {
  const el = document.getElementById("job-header");
  if (!el || !job.client) return;

  const totalVolume = (job.hectares * job.volPerHa).toFixed(1);
  el.innerHTML = `<h3>${job.client} | ${job.crop} | ${job.hectares} ha</h3>
    <p>Water: ${job.volPerHa} L/ha → Total Volume: ${totalVolume} L</p>
    <p>Loads: ${job.loads} | Pilot: ${job.pilot} | Aircraft: ${job.aircraft}</p>`;
}

function addLoad() {
  if (loadCount >= job.loads) {
    alert("✅ All loads completed.");
    document.getElementById("add-load-button").disabled = true;
    return;
  }

  const haPerLoad = job.hectares / job.loads;
  loadCount++;
  sessionStorage.setItem("loadCount", loadCount);
  const container = document.getElementById("products");
  const div = document.createElement("div");
  div.className = "load";

  let html = `<h4>Load #${loadCount}</h4>`;
  const checks = [];

  products.forEach((p, i) => {
    const required = haPerLoad * p.rate;
    let from = [], remaining = required;
    p.containers = p.containers || [];

    while (remaining > 0 && p.containers.length) {
      const available = p.containers[0];
      if (available >= remaining) {
        p.containers[0] -= remaining;
        from.push(`${remaining.toFixed(3)} ${p.unit} (left: ${p.containers[0].toFixed(3)})`);
        remaining = 0;
      } else {
        from.push(`${available.toFixed(3)} ${p.unit} (empty)`);
        remaining -= available;
        p.containers.shift();
      }
    }

    const id = `prod-${loadCount}-${i}`;
    html += `<p><strong>${p.name}</strong>: ${required.toFixed(3)} ${p.unit}<br>${from.join(", ")} 
      <br><button id="${id}" onclick="markAdded('${id}')">✅ Add</button></p>`;
    checks.push(id);
  });

  html += `<div id="done-${loadCount}" style="display:none;"><button onclick="confirmLoad(${loadCount})">✅ Loaded</button></div>
           <div id="confirm-${loadCount}" style="display:none;"><strong>✅ Load confirmed</strong></div>`;

  div.dataset.checks = JSON.stringify(checks);
  container.appendChild(div);
  div.innerHTML += html;
  localStorage.setItem("mixerProducts", JSON.stringify(products));
  document.getElementById("add-load-button").disabled = true;
}

function markAdded(id) {
  const btn = document.getElementById(id);
  btn.textContent = "✔️ Added";
  btn.disabled = true;
  const load = btn.closest(".load");
  const all = JSON.parse(load.dataset.checks);
  if (all.every(cid => document.getElementById(cid).disabled)) {
    load.querySelector(`[id^='done-']`).style.display = "block";
  }
}

function confirmLoad(n) {
  document.getElementById(`done-${n}`).style.display = "none";
  document.getElementById(`confirm-${n}`).style.display = "block";
  if (loadCount < job.loads) {
    document.getElementById("add-load-button").disabled = false;
  } else {
    document.getElementById("add-load-button").disabled = true;
  }
}

function resetData() {
  sessionStorage.clear();
  localStorage.clear();
  window.location.href = "setup.html";
}

window.onload = () => {
  if (!job.client || !job.aircraft) {
    alert("⚠️ No job found. Please complete the setup.");
    window.location.href = "setup.html";
  } else {
    showHeader();
    if (loadCount >= job.loads) {
      document.getElementById("add-load-button").disabled = true;
    }
  }
};
