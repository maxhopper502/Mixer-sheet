
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

  document.getElementById("client").textContent = job.client;
  document.getElementById("crop").textContent = job.crop;
  document.getElementById("hectares").textContent = job.hectares;
  document.getElementById("volPerHa").textContent = job.volPerHa;
  document.getElementById("pilot").textContent = job.pilot;
  document.getElementById("aircraft").textContent = job.aircraft;
  document.getElementById("loads").textContent = job.loads;
  document.getElementById("totalVolume").textContent = (job.hectares * job.volPerHa).toFixed(1);
  document.getElementById("loadArea").textContent = (job.hectares / job.loads).toFixed(2);
  document.getElementById("loadVolume").textContent = ((job.hectares / job.loads) * job.volPerHa).toFixed(1);

  renderLoads();
}

function renderLoads() {
  const container = document.getElementById("products");
  container.innerHTML = "";

  loads.forEach((load, i) => {
    const div = document.createElement("div");
    div.className = "load-block";
    div.innerHTML = `<h3>Load ${i + 1}</h3>`;
    const prodList = document.createElement("div");

    load.products.forEach((p, j) => {
      const button = document.createElement("button");
      const unit = getUnit(p.name);
      button.textContent = p.added ? `✅ ${p.name} (${p.volume} ${unit})` : `➕ Add ${p.name} (${p.volume} ${unit})`;
      button.disabled = p.added;
      button.onclick = () => {
        p.added = true;
        const used = deductFromContainers(p.name, parseFloat(p.volume));
        p.usageLog = used;
        renderLoads();
      };

      const preview = previewContainerUsage(p.name, parseFloat(p.volume));
      const previewText = document.createElement("div");
      previewText.innerHTML = `<em>${preview.join("<br>")}</em>`;
      previewText.style.fontSize = "0.85em";

      prodList.appendChild(button);
      prodList.appendChild(previewText);
    });

    div.appendChild(prodList);

    if (load.products.every(p => p.added) && !load.loaded) {
      const loadedBtn = document.createElement("button");
      loadedBtn.textContent = "✅ Loaded";
      loadedBtn.onclick = () => {
        load.loaded = true;
        load.time = new Date().toLocaleTimeString();
        renderLoads();
      };
      div.appendChild(loadedBtn);
    } else if (load.loaded) {
      div.innerHTML += `<p><strong>Loaded at:</strong> ${load.time}</p>`;
    }

    container.appendChild(div);
  });

  document.getElementById("addLoadBtn").disabled = !(loads.length === 0 || loads[loads.length - 1]?.loaded);

  renderStockStatus();
}

function addLoad() {
  if (loads.length >= job.loads) {
    alert("🚫 All planned loads have already been added.");
    return;
  }
  const ha = job.hectares / job.loads;

  // Deep clone products for this load
  const newLoad = {
    products: products.map(p => ({
      name: p.name,
      volume: (p.rate * ha).toFixed(2),
      added: false,
      usageLog: [],
      unit: p.unit
    })),
    loaded: false,
    time: null
  };
  loads.push(newLoad);
  renderLoads();
}

function previewContainerUsage(productName, volume) {
  const prod = products.find(p => p.name === productName);
  const temp = [...prod.containers];
  const messages = [];
  for (let i = 0; i < temp.length; i++) {
    if (volume <= 0) break;
    const use = Math.min(volume, temp[i]);
    if (use > 0) {
      messages.push(`→ ${use.toFixed(2)} from Container ${i + 1} (${(temp[i] - use).toFixed(2)} left)`);
      volume -= use;
    }
  }
  return messages;
}

function deductFromContainers(productName, volume) {
  const prod = products.find(p => p.name === productName);
  const usage = [];
  for (let i = 0; i < prod.containers.length; i++) {
    if (volume <= 0) break;
    const use = Math.min(volume, prod.containers[i]);
    prod.containers[i] -= use;
    usage.push(`‣ ${use.toFixed(2)} from Container ${i + 1}`);
    volume -= use;
  }
  localStorage.setItem("mixerProducts", JSON.stringify(products));
  return usage;
}

function getUnit(name) {
  const prod = products.find(p => p.name === name);
  return prod ? prod.unit : "L";
}

function renderStockStatus() {
  const existing = document.getElementById("stock-summary");
  if (existing) existing.remove();
  const div = document.createElement("div");
  div.id = "stock-summary";
  div.innerHTML = "<h4>🧪 Product Remaining</h4>";
  products.forEach(p => {
    const totalLeft = p.containers.reduce((a, b) => a + b, 0).toFixed(2);
    div.innerHTML += `<p><strong>${p.name}:</strong> ${totalLeft} ${p.unit}</p>`;
  });
  document.body.appendChild(div);
}

function resetData() {
  if (confirm("Reset all job progress?")) {
    localStorage.removeItem("mixerJob");
    localStorage.removeItem("mixerProducts");
    location.reload();
  }
}

window.onload = loadJob;
