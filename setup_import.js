const jobForm = document.getElementById("job-form");
const productForm = document.getElementById("product-form");
const productList = document.getElementById("product-list");

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
  const editIndex = productForm.dataset.editIndex;

  if (editIndex !== undefined) {
    products[parseInt(editIndex)] = product;
    delete productForm.dataset.editIndex;
  } else {
    products.push(product);
  }

  updateList();
  productForm.reset();
};

function editProduct(index) {
  const p = products[index];
  if (!p) return;
  productForm.name.value = p.name;
  productForm.rate.value = p.rate;
  productForm.unit.value = p.unit;
  productForm.container.value = p.containers[0];
  productForm.count.value = p.containers.length;
  productForm.dataset.editIndex = index;
}

function updateList() {
  const hectares = parseFloat(new FormData(jobForm).get("hectares") || 0);
  productList.innerHTML = products.map((p, i) => {
    const required = (p.rate * hectares).toFixed(3);
    const available = p.containers.reduce((a, b) => a + b, 0).toFixed(3);
    const shortfall = (available - required).toFixed(3);
    const warning = shortfall < 0
      ? `<span style="color:red;">⚠️ Short ${Math.abs(shortfall)} ${p.unit}</span>`
      : `<span style="color:green;">✅ Ok — Leftover: ${shortfall} ${p.unit}</span>`;
    return `<p><strong>${p.name}</strong> (${p.rate.toFixed(3)} ${p.unit}/ha)<br>
      ${p.containers.length} × ${p.containers[0]} = ${available} ${p.unit}<br>
      Required: ${required} ${p.unit}<br>
      ${warning}<br>
      <button type="button" onclick="editProduct(${i})">✏️ Edit</button>
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
