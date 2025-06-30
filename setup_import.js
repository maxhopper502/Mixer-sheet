
let products = [];

document.getElementById("product-form").onsubmit = e => {
  e.preventDefault();
  const data = new FormData(e.target);
  const name = data.get("name");
  const rate = parseFloat(data.get("rate"));
  const unit = data.get("unit");
  const size = parseFloat(data.get("container"));
  const count = parseInt(data.get("count"));

  let existing = products.find(p => p.name === name && p.unit === unit && p.rate === rate);
  if (existing) {
    existing.containers.push(...Array(count).fill(size));
  } else {
    products.push({
      name,
      rate,
      unit,
      containers: Array(count).fill(size)
    });
  }

  localStorage.setItem("mixerProducts", JSON.stringify(products));
  e.target.reset();
  updateList();
};

function updateList() {
  const ha = parseFloat(new FormData(document.getElementById("job-form")).get("hectares") || 0);
  const list = document.getElementById("product-list");
  list.innerHTML = products.map((p, index) => {
    const required = (p.rate * ha).toFixed(3);
    const available = p.containers.reduce((a,b)=>a+b,0).toFixed(3);
    const diff = (available - required).toFixed(3);
    const ok = available >= required;
    return `<div class="product-tile">
      <p><strong>${p.name}</strong> — ${p.rate.toFixed(3)} ${p.unit}/ha</p>
      <p>Required: ${required} ${p.unit}</p>
      <p>Supplied: ${available} ${p.unit}</p>
      <p>Difference: ${diff} ${p.unit} ${ok ? "✅" : "⚠️ Not enough!"}</p>
      <button onclick="editProduct(${index})">✏️ Edit</button>
      <button onclick="deleteProduct(${index})">🗑️ Delete</button>
    </div>`;
  }).join("");
}

function editProduct(index) {
  const p = products[index];
  const name = prompt("Product Name:", p.name);
  const rate = parseFloat(prompt("Rate per ha:", p.rate));
  const unit = prompt("Unit (L or kg):", p.unit);
  const size = parseFloat(prompt("Container size:", p.containers[0]));
  const count = parseInt(prompt("# Containers:", p.containers.length));
  if (name && !isNaN(rate) && unit && !isNaN(size) && !isNaN(count)) {
    products[index] = {
      name,
      rate,
      unit,
      containers: Array(count).fill(size)
    };
    localStorage.setItem("mixerProducts", JSON.stringify(products));
    updateList();
  }
}

function deleteProduct(index) {
  if (confirm("Delete this product?")) {
    products.splice(index, 1);
    localStorage.setItem("mixerProducts", JSON.stringify(products));
    updateList();
  }
}

function startJob() {
  const f = new FormData(document.getElementById("job-form"));
  const job = {
    client: f.get("client"),
    crop: f.get("crop"),
    hectares: parseFloat(f.get("hectares")),
    loads: parseInt(f.get("loads")),
    volPerHa: parseFloat(f.get("volPerHa")),
    pilot: f.get("pilot"),
    aircraft: f.get("aircraft").trim().toUpperCase()
  };
  localStorage.setItem("mixerJob", JSON.stringify(job));
  localStorage.setItem("mixerProducts", JSON.stringify(products));
  window.location.href = "job.html";
}

window.onload = () => {
  try {
    products = JSON.parse(localStorage.getItem("mixerProducts")) || [];
  } catch {
    products = [];
  }
  updateList();
};
