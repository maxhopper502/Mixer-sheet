window.onload = function () {
  const job = JSON.parse(localStorage.getItem("mixerJob"));
  const storedProducts = JSON.parse(localStorage.getItem("mixerProducts"));
  if (!job || !storedProducts || storedProducts.length === 0) {
    alert("❌ No job or product found. Please import or set up a job first.");
    window.location.href = "setup.html";
    return;
  }

  job.totalVolume = job.hectares * job.volPerHa;
  job.loadArea = job.hectares / job.loads;
  job.loadVolume = job.loadArea * job.volPerHa;

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

  state.job = job;
  state.products = storedProducts.map(p => ({
    name: p.name,
    rate: p.rate,
    unit: p.unit,
    containers: [...p.containers],
    remaining: [...p.containers],
  }));

  updateDisplay();
};

const state = {
  job: null,
  loadNumber: 1,
  loads: [],
  products: [],
};

function updateDisplay() {
  const container = document.getElementById("products");
  container.innerHTML = "";

  state.loads.forEach((load, index) => {
    const block = document.createElement("div");
    block.className = "load-block";
    block.innerHTML = `<h3>Load ${index + 1}</h3>`;
    load.products.forEach(p => {
      block.innerHTML += `<p>${p.name}: ${p.amount.toFixed(2)} ${p.unit}</p>`;
      block.innerHTML += `<ul>${p.breakdown.map((b, i) => `<li>Container ${i+1}: ${b.toFixed(2)} ${p.unit}</li>`).join("")}</ul>`;
    });
    block.innerHTML += `<p>✅ Loaded at ${load.timestamp}</p>`;
    container.appendChild(block);
  });

  if (state.loadNumber <= state.job.loads) {
    const block = document.createElement("div");
    block.className = "load-block";
    block.innerHTML = `<h3>Load ${state.loadNumber}</h3>`;
    state.products.forEach((p, i) => {
      const amount = p.rate * state.job.loadArea;
      block.innerHTML += `
        <p><strong>${p.name}</strong> ${amount.toFixed(2)} ${p.unit}
        <button onclick="markAdded(${i})" id="add-btn-${i}" class="add-btn">🧪 Add</button></p>`;
    });
    block.innerHTML += `<button id="loadedBtn" onclick="markLoaded()" disabled>➕ Load</button>`;
    container.appendChild(block);
  }

  // Restore product remaining summary at bottom
  const summary = document.createElement("div");
  summary.id = "stock-summary";
  summary.style.marginTop = "20px";
  summary.innerHTML = "<h4>Product Remaining</h4>";
  state.products.forEach(p => {
    const total = p.remaining.reduce((a,b)=>a+b,0).toFixed(2);
    summary.innerHTML += `<p>✔️ ${p.name}: ${total} ${p.unit}</p>`;
  });
  container.appendChild(summary);
}

const added = new Set();

function markAdded(index) {
  added.add(index);
  const btn = document.getElementById(`add-btn-${index}`);
  if (btn) {
    btn.textContent = "✅ Added";
    btn.disabled = true;
  }

  if (added.size === state.products.length) {
    const lb = document.getElementById("loadedBtn");
    if (lb) {
      lb.disabled = false;
      lb.textContent = "✅ Loaded";
    }
  }
}

function markLoaded() {
  const load = {
    number: state.loadNumber,
    timestamp: new Date().toLocaleTimeString(),
    products: []
  };

  state.products.forEach(p => {
    const required = p.rate * state.job.loadArea;
    let pulled = 0;
    let i = 0;
    const breakdown = [];

    while (pulled < required && i < p.remaining.length) {
      const available = p.remaining[i];
      const take = Math.min(available, required - pulled);
      pulled += take;
      breakdown.push(take);
      if (take === available) {
        p.remaining.splice(i, 1);
      } else {
        p.remaining[i] -= take;
        i++;
      }
    }

    load.products.push({
      name: p.name,
      unit: p.unit,
      amount: pulled,
      breakdown
    });
  });

  state.loads.push(load);
  state.loadNumber++;
  added.clear();
  updateDisplay();
}

function editJob() {
  window.location.href = "setup.html";
}

function deleteJob() {
  if (confirm("Clear this job and start again?")) {
    localStorage.removeItem("mixerJob");
    localStorage.removeItem("mixerProducts");
    window.location.href = "setup.html";
  }
}