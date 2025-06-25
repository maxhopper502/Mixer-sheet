
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
    div.innerHTML = `<h3>Load ${i + 1}</h3>`;
    load.products.forEach(p => {
      const btn = document.createElement("button");
      btn.textContent = p.added ? `✅ ${p.name} (${p.volume} ${p.unit})` : `➕ Add ${p.name} (${p.volume} ${p.unit})`;
      btn.disabled = p.added;
      btn.onclick = () => {
        p.added = true;
        renderLoads();
      };
      div.appendChild(btn);

      const ul = document.createElement("ul");
      p.usageLog.forEach(msg => {
        const li = document.createElement("li");
        li.textContent = msg;
        ul.appendChild(li);
      });
      div.appendChild(ul);
    });

    if (load.products.every(p => p.added)) {
      if (!load.loaded) {
        const loadedBtn = document.createElement("button");
        loadedBtn.textContent = "✅ Loaded";
        loadedBtn.onclick = () => {
          load.loaded = true;
          load.time = new Date().toLocaleTimeString();
          renderLoads();
        };
        div.appendChild(loadedBtn);
      } else {
        div.innerHTML += `<p><strong>Loaded at:</strong> ${load.time}</p>`;
      }
    }

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

  const loadArea = job.hectares / job.loads;

  const newLoad = {
    products: products.map(p => {
      const volume = (p.rate * loadArea).toFixed(2);
      const containerUsage = [];
      let remaining = parseFloat(volume);

      for (let i = 0; i < p.containers.length && remaining > 0; i++) {
        const available = p.containers[i];
        if (available > 0) {
          const used = Math.min(available, remaining);
          p.containers[i] -= used;
          containerUsage.push(`→ ${used.toFixed(2)} from Container ${i + 1} (${p.containers[i].toFixed(2)} left)`);
          remaining -= used;
        }
      }

      return {
        name: p.name,
        volume,
        added: false,
        usageLog: containerUsage,
        unit: p.unit
      };
    }),
    loaded: false,
    time: null
  };

  loads.push(newLoad);
  localStorage.setItem("mixerProducts", JSON.stringify(products));
  renderLoads();
}

function renderStockStatus() {
  const existing = document.getElementById("stock-summary");
  if (existing) existing.remove();

  const stockDiv = document.createElement("div");
  stockDiv.id = "stock-summary";
  stockDiv.innerHTML = "<h4>🧪 Product Remaining</h4>";
  products.forEach(p => {
    const totalLeft = p.containers.reduce((a, b) => a + b, 0).toFixed(2);
    if (totalLeft > 0) {
      stockDiv.innerHTML += `<p><strong>${p.name}:</strong> ${totalLeft} ${p.unit}</p>`;
    }
  });
  document.body.appendChild(stockDiv);
}

function resetData() {
  if (confirm("Reset all job progress?")) {
    localStorage.removeItem("mixerJob");
    localStorage.removeItem("mixerProducts");
    location.reload();
  }
}

window.onload = loadJob;
