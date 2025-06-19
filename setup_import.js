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
  const unit = formData.get("unit");
  const container = parseFloat(formData.get("container"));
  const count = parseInt(formData.get("count"));
  if (!name || !rate || !container || !count) return;

  const containers = Array(count).fill(container);
  const product = { name, rate, unit, containers };
  products.push(product);
  updateList();
  productForm.reset();
};

function updateList() {
  const jobData = new FormData(jobForm);
  const hectares = parseFloat(jobData.get("hectares") || 0);

  productList.innerHTML = products.map(p => {
    const totalRequired = (p.rate * hectares).toFixed(3);
    const totalAvailable = p.containers.reduce((sum, c) => sum + c, 0).toFixed(3);
    const diff = (totalAvailable - totalRequired).toFixed(3);
    const status = diff >= 0
      ? `✅ Enough. Forecast leftover: ${diff} ${p.unit}`
      : `⚠️ Short by: ${Math.abs(diff)} ${p.unit}`;

    return `<p><strong>${p.name}</strong><br>
      Rate: ${p.rate.toFixed(3)} ${p.unit}/ha<br>
      Stock: ${p.containers.length} × ${p.containers[0].toFixed(3)} ${p.unit} = ${totalAvailable} ${p.unit}<br>
      Required: ${totalRequired} ${p.unit}<br>
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
