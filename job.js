
window.onload = function () {
  const job = JSON.parse(localStorage.getItem("mixerJob"));
  const products = JSON.parse(localStorage.getItem("mixerProducts"));
  if (!job || !products || products.length === 0) {
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

  state.products = products.map(p => ({
    ...p,
    remaining: [...p.containers],
    used: [],
  }));

  updateDisplay();
};

const state = {
  loadNumber: 1,
  products: [],
  loads: []
};

function updateDisplay() {
  const container = document.getElementById("products");
  container.innerHTML = "";

  for (let i = 0; i < state.loads.length; i++) {
    const load = state.loads[i];
    const div = document.createElement("div");
    div.className = "load-block";

    let html = `<h3>Load ${load.number}</h3>`;
    for (let chem of load.products) {
      html += `<p>${chem.name}: ${chem.amount.toFixed(2)} ${chem.unit}</p>`;
    }
    html += `<p>✅ Loaded at ${load.timestamp}</p>`;
    div.innerHTML = html;
    container.appendChild(div);
  }

  const canAdd = state.loadNumber <= JSON.parse(localStorage.getItem("mixerJob")).loads;
  const button = document.querySelector("button[onclick='addLoad()']");
  button.disabled = !canAdd;

  // Show product remaining summary
  const stock = document.createElement("div");
  stock.id = "stock-summary";
  stock.innerHTML = "<h4>Product Remaining</h4>";
  state.products.forEach(p => {
    const total = p.remaining.reduce((a, b) => a + b, 0).toFixed(2);
    stock.innerHTML += `<p>${p.name}: ${total} ${p.unit}</p>`;
  });
  container.appendChild(stock);
}

function addLoad() {
  const job = JSON.parse(localStorage.getItem("mixerJob"));
  const newLoad = {
    number: state.loadNumber,
    products: [],
    timestamp: new Date().toLocaleTimeString()
  };

  for (let p of state.products) {
    const totalNeeded = p.rate * job.loadArea;
    let pulled = 0;
    let from = [];

    while (pulled < totalNeeded && p.remaining.length > 0) {
      const current = p.remaining[0];
      const take = Math.min(current, totalNeeded - pulled);
      pulled += take;

      if (take < current) {
        p.remaining[0] -= take;
      } else {
        p.remaining.shift();
      }

      from.push(take);
    }

    p.used.push(from);
    newLoad.products.push({
      name: p.name,
      unit: p.unit,
      amount: pulled
    });
  }

  state.loads.push(newLoad);
  state.loadNumber++;
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
