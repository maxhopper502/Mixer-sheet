
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

  // Fill job header fields
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
    div.innerHTML = `<h3>Load ${i + 1}</h3><div class="products"></div><div class="loaded"></div>`;

    const prodDiv = div.querySelector(".products");
    load.products.forEach((p, j) => {
      const button = document.createElement("button");
      button.textContent = p.added ? `✅ ${p.name} Added` : `➕ Add ${p.name}`;
      button.disabled = p.added;
      button.onclick = () => {
        p.added = true;
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

    container.appendChild(div);
  });

  // Disable Add Load button if max loads reached
  const addBtn = document.querySelector("button[onclick='addLoad()']");
  if (loads.length >= job.loads) {
    addBtn.disabled = true;
  } else {
    addBtn.disabled = false;
  }
}

function addLoad() {
  if (loads.length >= job.loads) {
    alert("🚫 All planned loads have already been added.");
    return;
  }
  const newLoad = {
    products: products.map(p => ({
      name: p.name,
      added: false
    })),
    loaded: false,
    time: null
  };
  loads.push(newLoad);
  renderLoads();
}

function resetData() {
  if (confirm("Reset all job progress?")) {
    localStorage.removeItem("mixerJob");
    localStorage.removeItem("mixerProducts");
    location.reload();
  }
}

window.onload = loadJob;
