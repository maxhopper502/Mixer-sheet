
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

  // Initialize loads
  let loads = [];
  const productTotals = products.map(p => p.containers.reduce((a,b) => a+b, 0));
  const loadContainer = document.getElementById("products");
  const stockSummary = document.createElement("div");
  stockSummary.id = "stock-summary";
  loadContainer.after(stockSummary);

  function render() {
    loadContainer.innerHTML = "";
    loads.forEach((load, i) => {
      const block = document.createElement("div");
      block.className = "load-block";
      block.innerHTML = `<h3>Load ${i + 1}</h3>`;
      load.products.forEach((amt, j) => {
        block.innerHTML += `<p>${products[j].name}: ${amt.toFixed(2)} ${products[j].unit}</p>`;
      });
      loadContainer.appendChild(block);
    });

    const remaining = productTotals.map((total, i) =>
      total - loads.reduce((sum, l) => sum + l.products[i], 0)
    );

    stockSummary.innerHTML = "<h4>Product Remaining</h4>" + remaining.map((r, i) =>
      `<p>${products[i].name}: ${r.toFixed(2)} ${products[i].unit}</p>`
    ).join("");
  }

  window.addLoad = function () {
    if (loads.length >= job.loads) {
      alert("✅ All loads added.");
      return;
    }

    const newLoad = {
      products: products.map(p => p.rate * job.loadArea)
    };
    loads.push(newLoad);
    render();
  };
};
