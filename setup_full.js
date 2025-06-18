const jobForm = document.getElementById("job-form");
const productForm = document.getElementById("product-form");
const productList = document.getElementById("product-list");

let products = [];

productForm.onsubmit = e => {
  e.preventDefault();
  const formData = new FormData(productForm);
  const name = formData.get("name");
  const rate = parseFloat(formData.get("rate"));
  const container = parseFloat(formData.get("container"));

  if (!name || !rate || !container) return;

  const product = { name, rate, containers: [container] };
  products.push(product);
  updateList();
  productForm.reset();
};

function updateList() {
  productList.innerHTML = products.map(p =>
    `<p><strong>${p.name}</strong> - ${p.rate} L/ha | Container: ${p.containers[0]} L</p>`
  ).join("");
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

window.onload = () => {
  const saved = localStorage.getItem("mixerProducts");
  if (saved) {
    products = JSON.parse(saved);
    updateList();
  }
};