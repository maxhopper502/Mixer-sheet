const jobForm = document.getElementById("job-form");
const productForm = document.getElementById("product-form");
const productList = document.getElementById("product-list");
const importInput = document.getElementById("importFile");

let products = [];

productForm.onsubmit = e => {
  e.preventDefault();
  const formData = new FormData(productForm);
  const name = formData.get("name");
  const rate = parseFloat(formData.get("rate"));
  const container = parseFloat(formData.get("container"));
  const count = parseInt(formData.get("count"));
  if (!name || !rate || !container || !count) return;

  const containers = Array(count).fill(container);
  const product = { name, rate, containers };
  products.push(product);
  updateList();
  productForm.reset();
};

function updateList() {
  const jobData = new FormData(jobForm);
  const hectares = parseFloat(jobData.get("hectares") || 0);

  productList.innerHTML = products.map(p => {
    const totalRequired = (p.rate * hectares).toFixed(2);
    const totalAvailable = p.containers.reduce((sum, c) => sum + c, 0).toFixed(2);
    const diff = (totalAvailable - totalRequired).toFixed(2);
    const status = diff >= 0
      ? `✅ Enough. Forecast leftover: ${diff} L`
      : `⚠️ Short by: ${Math.abs(diff)} L`;

    return `<p><strong>${p.name}</strong><br>
      Rate: ${p.rate.toFixed(2)} L/ha<br>
      Stock: ${p.containers.length} × ${p.containers[0].toFixed(2)} L = ${totalAvailable} L<br>
      Required: ${totalRequired} L<br>
      ${status}
    </p>`;
  }).join("");
}

function startJob() {
  const jobData = new FormData(jobForm);
  const jobDetails = {
    client: jobData.get("client"),
    crop: jobData.get("crop"),
    hectares: parseFloat(jobData.get("hectares")),
    loads: parseInt(jobData.get("loads")),
    volPerHa: parseFloat(jobData.get("volPerHa")),
    pilot: jobData.get("pilot"),
    aircraft: jobData.get("aircraft")
  };

  localStorage.setItem("mixerJob", JSON.stringify(jobDetails));
  localStorage.setItem("mixerProducts", JSON.stringify(products));
  window.location.href = "job.html";
}

function parseCSV(contents) {
  const lines = contents.split(/\r?\n/).filter(l => l.trim() !== "");
  const jobLine = lines[1]?.split(",");
  if (jobLine?.length >= 7) {
    const [client, crop, hectares, loads, volPerHa, pilot, aircraft] = jobLine;
    jobForm.client.value = client;
    jobForm.crop.value = crop;
    jobForm.hectares.value = hectares;
    jobForm.loads.value = loads;
    jobForm.volPerHa.value = volPerHa;
    jobForm.pilot.value = pilot;
    jobForm.aircraft.value = aircraft;
  }

  const productLines = lines.slice(3);
  for (const line of productLines) {
    const [name, rate, size, count] = line.split(",");
    if (!name || !rate || !size || !count) continue;
    const containers = Array(parseInt(count)).fill(parseFloat(size));
    products.push({ name, rate: parseFloat(rate), containers });
  }

  updateList();
}

importInput?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    parseCSV(event.target.result);
  };
  reader.readAsText(file);
});

window.onload = () => {
  const saved = localStorage.getItem("mixerProducts");
  if (saved) {
    products = JSON.parse(saved);
    updateList();
  }
};