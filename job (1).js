
let job = {};
let products = [];
let loads = [];

function loadJob() {
  try {
    job = JSON.parse(localStorage.getItem("mixerJob"));
    products = JSON.parse(localStorage.getItem("mixerProducts"));
    if (!job || !products || products.length === 0) throw new Error();
  } catch {
    alert("❌ No job or products found. Please import or set up a job first.");
    return;
  }

  document.getElementById("client").textContent = job.client || "";
  document.getElementById("crop").textContent = job.crop || "";
  document.getElementById("hectares").textContent = job.hectares || "";
  document.getElementById("volPerHa").textContent = job.volPerHa || "";
  document.getElementById("pilot").textContent = job.pilot || "";
  document.getElementById("aircraft").textContent = job.aircraft || "";
  document.getElementById("loads").textContent = job.loads || "";

  const totalVol = (job.hectares * job.volPerHa).toFixed(1);
  document.getElementById("totalVolume").textContent = totalVol;

  const loadArea = (job.hectares / job.loads).toFixed(2);
  const loadVolume = (loadArea * job.volPerHa).toFixed(1);
  document.getElementById("loadArea").textContent = loadArea;
  document.getElementById("loadVolume").textContent = loadVolume;

  renderLoads();
}

function renderLoads() {
  const container = document.getElementById("products");
  container.innerHTML = "";

  loads.forEach((load, i) => {
    const div = document.createElement("div");
    div.className = "load-block";
    div.style.border = "2px solid #ccc";
    div.style.margin = "10px 0";
    div.style.padding = "10px";
    div.innerHTML = `<h3>Load ${i + 1}</h3><div class="products"></div><div class="loaded"></div><div class="usage-log"></div>`;

    const prodDiv = div.querySelector(".products");
    load.products.forEach((p, j) => {
      const button = document.createElement("button");
      const unit = getUnit(p.name);
      const label = `${p.name} (${p.volume} ${unit})`;
      button.textContent = p.added ? `✅ ${label}` : `➕ Add ${label}`;
      button.disabled = p.added;
      button.onclick = () => {
        p.added = true;
        const usage = deductFromContainers(p.name, parseFloat(p.volume));
        p.usageLog = usage;
        renderLoads();
      };
      prodDiv.appendChild(button);
    });

    if (load.products.every(p => p.added) && !load.loaded) {
      const loadedBtn = document.createElement("button");
      loadedBtn.textContent = "✅ Loaded";
      loadedBtn.onclick = () => {
        load.loaded = true;
        load.time = new Date().toLocaleTimeString();
        renderLoads();
      };
      div.querySelector(".loaded").appendChild(loadedBtn);
    } else if (load.loaded) {
      div.querySelector(".loaded").innerHTML = `<p><strong>Loaded at:</strong> ${load.time}</p>`;
    }

    // Show usage breakdown
    const usageDiv = div.querySelector(".usage-log");
    load.products.forEach(p => {
      if (p.usageLog) {
        usageDiv.innerHTML += `<p><strong>${p.name} container usage:</strong><br>${p.usageLog.join("<br>")}</p>`;
      }
    });

    container.appendChild(div);
  });

  const addBtn = document.querySelector("button[onclick='addLoad()']");
  addBtn.disabled = loads.length >= job.loads;

  renderStockStatus();
}

function addLoad() {
  if (loads.length >= job.loads) {
    alert("🚫 All planned loads have already been added.");
    return;
  }
  const loadArea = (job.hectares / job.loads);
  const newLoad = {
    products: products.map(p => ({
      name: p.name,
      volume: (p.rate * loadArea).toFixed(2),
      added: false,
      usageLog: []
    })),
    loaded: false,
    time: null
  };
  loads.push(newLoad);
  renderLoads();
}

function getUnit(name) {
  const prod = products.find(p => p.name === name);
  return prod ? prod.unit : "L";
}

function deductFromContainers(productName, volume) {
  const prod = products.find(p => p.name === productName);
  if (!prod || !prod.containers || !Array.isArray(prod.containers)) return [];

  const usageLog = [];
  for (let i = 0; i < prod.containers.length; i++) {
    if (volume <= 0) break;
    const available = prod.containers[i];
    if (available >= volume) {
      prod.containers[i] -= volume;
      usageLog.push(`‣ ${volume.toFixed(2)} from Container ${i + 1}`);
      volume = 0;
    } else {
      prod.containers[i] = 0;
      usageLog.push(`‣ ${available.toFixed(2)} from Container ${i + 1}`);
      volume -= available;
    }
  }

  localStorage.setItem("mixerProducts", JSON.stringify(products));
  return usageLog;
}

function renderStockStatus() {
  const container = document.getElementById("products");
  const stockDiv = document.createElement("div");
  stockDiv.innerHTML = "<h4>🧪 Product Remaining</h4>";
  products.forEach(p => {
    const totalLeft = p.containers.reduce((a, b) => a + b, 0).toFixed(2);
    stockDiv.innerHTML += `<p><strong>${p.name}:</strong> ${totalLeft} ${p.unit}</p>`;
  });
  container.appendChild(stockDiv);
}

function resetData() {
  if (confirm("Reset all job progress?")) {
    localStorage.removeItem("mixerJob");
    localStorage.removeItem("mixerProducts");
    location.reload();
  }
}

window.onload = loadJob;
