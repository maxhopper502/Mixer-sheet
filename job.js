let loadCount = 0;
const job = JSON.parse(localStorage.getItem("mixerJob") || "{}");
let products = JSON.parse(localStorage.getItem("mixerProducts") || "[]");

function getCurrentTime() {
  return new Date().toLocaleTimeString();
}

function getCurrentDate() {
  return new Date().toLocaleDateString();
}

function showHeader() {
  const el = document.getElementById("job-header");
  el.innerHTML = `
    <p><strong>Client:</strong> ${job.client}</p>
    <p><strong>Crop:</strong> ${job.crop} | <strong>Ha:</strong> ${job.hectares} | <strong>Loads:</strong> ${job.loads}</p>
    <p><strong>Pilot:</strong> ${job.pilot} | <strong>Aircraft:</strong> ${job.aircraft}</p>
  `;
}

function addLoad() {
  const haPerLoad = job.hectares / job.loads;
  if (!haPerLoad || isNaN(haPerLoad)) {
    alert("Job data invalid");
    return;
  }

  loadCount++;
  const container = document.getElementById("products");
  const load = document.createElement("div");
  load.className = "load";

  let html = `<h3>Load #${loadCount}</h3>`;
  html += `<p><strong>Date:</strong> ${getCurrentDate()} | <strong>Time:</strong> ${getCurrentTime()}</p>`;

  products.forEach((p, i) => {
    const required = p.rate * haPerLoad;
    html += `<p><strong>${p.name}</strong><br>
      Rate: ${p.rate.toFixed(3)} ${p.unit}/ha | Per Load: ${required.toFixed(3)} ${p.unit}<br>
      Container breakdown: ${p.containers.join(", ")}
    </p>`;
  });

  container.appendChild(load);
  load.innerHTML = html;
}

function resetData() {
  localStorage.clear();
  location.reload();
}

window.onload = () => {
  showHeader();
};
