
document.addEventListener("DOMContentLoaded", () => {
  const job = JSON.parse(localStorage.getItem("mixerJob") || "{}");
  const products = JSON.parse(localStorage.getItem("mixerProducts") || "[]");
  const loadArea = job.hectares / job.loads;
  const loadVolume = loadArea * job.volPerHa;
  let loads = [];

  const headerBox = document.getElementById("jobDetails");
  if (headerBox) {
    headerBox.innerHTML = `
      <div><strong>Client:</strong> ${job.client}</div>
      <div><strong>Crop:</strong> ${job.crop}</div>
      <div><strong>Pilot:</strong> ${job.pilot}</div>
      <div><strong>Aircraft:</strong> ${job.aircraft}</div>
      <div><strong>Total Area:</strong> ${job.hectares} ha</div>
      <div><strong>Vol/Ha:</strong> ${job.volPerHa} L</div>
      <div><strong>Total Volume:</strong> ${(job.volPerHa * job.hectares).toFixed(1)} L</div>
      <div><strong>No. of Loads:</strong> ${job.loads}</div>
      <div><strong>Load Area:</strong> ${loadArea.toFixed(2)} ha</div>
      <div><strong>Load Volume:</strong> ${loadVolume.toFixed(1)} L</div>
    `;
  }

  function updateRemaining() {
    const remDiv = document.getElementById("remaining");
    remDiv.innerHTML = products.map(p => {
      const remaining = p.containers.reduce((a, b) => a + b, 0).toFixed(2);
      return `<p><strong>${p.name}</strong>: ${remaining} ${p.unit} remaining</p>`;
    }).join("");
  }

  function renderLoads() {
    const out = document.getElementById("loadList");
    out.innerHTML = "";
    loads.forEach((load, i) => {
      const div = document.createElement("div");
      div.className = "load";
      div.innerHTML = `<h3>Load ${i + 1}</h3>`;
      load.products.forEach(p => {
        const amt = (p.rate * loadArea).toFixed(2);
        const containersUsed = [];
        let needed = p.rate * loadArea;
        for (let j = 0; j < p.containers.length && needed > 0; j++) {
          const take = Math.min(p.containers[j], needed);
          containersUsed.push({ index: j + 1, amount: take });
          p.containers[j] -= take;
          needed -= take;
        }
        div.innerHTML += `<p><strong>${p.name}</strong>: ${amt} ${p.unit} → ` +
          containersUsed.map(c => `C${c.index}: ${c.amount.toFixed(1)}`).join(", ") + `</p>`;
      });
      div.innerHTML += `<button onclick="markLoaded(${i})">${load.loaded ? "✅ Loaded" : "Mark as Loaded"}</button>`;
      out.appendChild(div);
    });
    updateRemaining();
  }

  window.addLoad = () => {
    if (loads.length >= job.loads) return alert("✅ All loads complete.");
    loads.push({
      products: JSON.parse(JSON.stringify(products)),
      loaded: false,
    });
    renderLoads();
  };

  window.markLoaded = (i) => {
    loads[i].loaded = true;
    renderLoads();
  };

  window.resetJob = () => {
    if (confirm("Clear this job and return to start?")) {
      localStorage.removeItem("mixerJob");
      localStorage.removeItem("mixerProducts");
      window.location.href = "setup.html";
    }
  };

  addLoad();
});
