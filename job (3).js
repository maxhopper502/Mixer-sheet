
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

    const prodDiv = document.createElement("div");
    prodDiv.className = "products";

    load.products.forEach((p) => {
      const button = document.createElement("button");
      const unit = getUnit(p.name);
      const label = `${p.name} (${p.volume} ${unit})`;
      button.textContent = p.added ? `✅ ${label}` : `➕ Add ${label}`;
      button.disabled = p.added;

      const preview = previewContainerUsage(p.name, parseFloat(p.volume));
      const usagePreview = document.createElement("div");
      usagePreview.style.fontSize = "0.9em";
      usagePreview.style.marginBottom = "5px";
      usagePreview.innerHTML = `<em>${preview.join("<br>")}</em>`;

      button.onclick = () => {
        p.added = true;
        const used = deductFromContainers(p.name, parseFloat(p.volume));
        p.usageLog = used;
        renderLoads();
      };

      prodDiv.appendChild(button);
      prodDiv.appendChild(usagePreview);
    });

    div.innerHTML = `<h3>Load ${i + 1}</h3>`;
    div.appendChild(prodDiv);

    const loadedDiv = document.createElement("div");
    loadedDiv.className = "loaded";
    if (load.products.every(p => p.added)) {
      if (!load.loaded) {
        const loadedBtn = document.createElement("button");
        loadedBtn.textContent = "✅ Loaded";
        loadedBtn.onclick = () => {
          load.loaded = true;
          load.time = new Date().toLocaleTimeString();
          renderLoads();
        };
        loadedDiv.appendChild(loadedBtn);
      } else {
        loadedDiv.innerHTML = `<p><strong>Loaded at:</strong> ${load.time}</p>`;
      }
    }
    div.appendChild(loadedDiv);

    const usageDiv = document.createElement("div");
    usageDiv.className = "usage-log";
    load.products.forEach(p => {
      if (p.usageLog) {
        usageDiv.innerHTML += `<p><strong>${p.name} container usage:</strong><br>${p.usageLog.join("<br>")}</p>`;
      }
    });
    div.appendChild(usageDiv);

    container.appendChild(div);
  });

  const addBtn = document.querySelector("button[onclick='addLoad()']");
  if (addBtn) addBtn.disabled = !(loads.length === 0 || (loads[loads.length - 1]?.loaded));

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

function previewContainerUsage(productName, volume) {
  const prod = products.find(p => p.name === productName);
  if (!prod || !Array.isArray(prod.containers)) return [];
  const messages = [];
  for (let i = 0; i < prod.containers.length; i++) {
    if (volume <= 0) break;
    const available = prod.containers[i];
    if (available > 0) {
      const used = Math.min(volume, available);
      const remaining = available - used;
      messages.push(`→ ${used.toFixed(2)} from Container ${i + 1} (${remaining.toFixed(2)} left)`);
      volume -= used;
    }
  }
  return messages;
}

function deductFromContainers(productName, volume) {
  const prod = products.find(p => p.name === productName);
  if (!prod || !Array.isArray(prod.containers)) return [];

  const usageLog = [];
  for (let i = 0; i < prod.containers.length; i++) {
    if (volume <= 0) break;
    const available = prod.containers[i];
    if (available > 0) {
      const used = Math.min(volume, available);
      prod.containers[i] -= used;
      usageLog.push(`‣ ${used.toFixed(2)} from Container ${i + 1}`);
      volume -= used;
    }
  }

  localStorage.setItem("mixerProducts", JSON.stringify(products));
  return usageLog;
}

function getUnit(name) {
  const prod = products.find(p => p.name === name);
  return prod ? prod.unit : "L";
}

function renderStockStatus() {
  const container = document.getElementById("products");
  const stockDiv = document.createElement("div");
  stockDiv.innerHTML = "<h4>🧪 Product Remaining</h4>";
  products.forEach(p => {
    const totalLeft = p.containers.reduce((a, b) => a + b, 0).toFixed(2);
    if (totalLeft > 0) {
      stockDiv.innerHTML += `<p><strong>${p.name}:</strong> ${totalLeft} ${p.unit}</p>`;
    }
  });
  document.body.appendChild(stockDiv); // move it below everything
}

function resetData() {
  if (confirm("Reset all job progress?")) {
    localStorage.removeItem("mixerJob");
    localStorage.removeItem("mixerProducts");
    location.reload();
  }
}

window.onload = loadJob;
