
let job = {};
let products = [];
let loads = [];

function loadJob() {
  try {
    job = JSON.parse(localStorage.getItem("mixerJob"));
    products = JSON.parse(localStorage.getItem("mixerProducts"));
    console.log("✅ Job loaded:", job);
    console.log("✅ Products loaded:", products);
  } catch {
    alert("❌ No job or products found. Please import or set up a job first.");
    return;
  }

  if (!job || !products || products.length === 0) {
    alert("❌ No job or products found. Please import or set up a job first.");
    return;
  }

  // Fill header fields
  document.getElementById("client").textContent = job.client || "";
  document.getElementById("crop").textContent = job.crop || "";
  document.getElementById("hectares").textContent = job.hectares || "";
  document.getElementById("volPerHa").textContent = job.volPerHa || "";
  document.getElementById("pilot").textContent = job.pilot || "";
  document.getElementById("aircraft").textContent = job.aircraft || "";
  document.getElementById("loads").textContent = job.loads || "";

  // Calculate and display total volume
  const totalVol = (job.hectares * job.volPerHa).toFixed(1);
  document.getElementById("totalVolume").textContent = totalVol;

  // Calculate per-load area and volume
  const loadArea = (job.hectares / job.loads).toFixed(2);
  const loadVolume = (loadArea * job.volPerHa).toFixed(1);
  document.getElementById("loadArea").textContent = loadArea;
  document.getElementById("loadVolume").textContent = loadVolume;

  console.log("🔁 Load Area:", loadArea, "ha");
  console.log("🔁 Load Volume:", loadVolume, "L");
}

function addLoad() {
  alert("New load added (placeholder).");
}

function resetData() {
  if (confirm("Reset all job progress?")) {
    localStorage.removeItem("mixerJob");
    localStorage.removeItem("mixerProducts");
    location.reload();
  }
}

window.onload = loadJob;
