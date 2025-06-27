
let products = [];

document.getElementById("product-form").onsubmit = e => {
  e.preventDefault();
  const data = new FormData(e.target);
  const name = data.get("name");
  const rate = parseFloat(data.get("rate"));
  const unit = data.get("unit");
  const size = parseFloat(data.get("container"));
  const count = parseInt(data.get("count"));

  let match = products.find(p => p.name === name && p.unit === unit && p.rate === rate);
  if (match) {
    match.containers.push(...Array(count).fill(size));
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
  const form = document.getElementById("job-form");
  const ha = parseFloat(new FormData(form).get("hectares") || 0);
  const list = document.getElementById("product-list");
  list.innerHTML = products.map((p, i) => {
    const required = (p.rate * ha).toFixed(3);
    const supplied = p.containers.reduce((a,b)=>a+b,0).toFixed(3);
    const diff = (supplied - required).toFixed(3);
    const ok = supplied >= required;
    return `<div class="product-tile">
      <p><strong>${p.name}</strong> — ${p.rate.toFixed(3)} ${p.unit}/ha</p>
      <p>Required: ${required} ${p.unit}</p>
      <p>Supplied: ${supplied} ${p.unit}</p>
      <p>Difference: ${diff} ${p.unit} ${ok ? "✅" : "⚠️ Not enough!"}</p>
      <button onclick="editProduct(${i})">✏️ Edit</button>
      <button onclick="deleteProduct(${i})">🗑️ Delete</button>
    </div>`;
  }).join("");
}

function editProduct(i) {
  const p = products[i];
  const name = prompt("Product Name", p.name);
  const rate = parseFloat(prompt("Rate per ha", p.rate));
  const unit = prompt("Unit (L or kg)", p.unit);
  const size = parseFloat(prompt("Container size", p.containers[0]));
  const count = parseInt(prompt("# Containers", p.containers.length));
  if (name && !isNaN(rate) && unit && !isNaN(size) && !isNaN(count)) {
    products[i] = {
      name,
      rate,
      unit,
      containers: Array(count).fill(size)
    };
    localStorage.setItem("mixerProducts", JSON.stringify(products));
    updateList();
  }
}

function deleteProduct(i) {
  if (confirm("Delete this product?")) {
    products.splice(i, 1);
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

document.getElementById("importFile").addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  try {
    const data = JSON.parse(text);
    if (data.client && data.hectares && data.volPerHa && data.loads) {
      Object.entries(data).forEach(([key, val]) => {
        const input = document.querySelector(`[name="${key}"]`);
        if (input) input.value = val;
      });
    }
    if (Array.isArray(data.products)) {
      products = data.products;
      localStorage.setItem("mixerProducts", JSON.stringify(products));
    }
    updateList();
    alert("✅ Job imported successfully!");
  } catch (err) {
    alert("❌ Failed to import job: " + err.message);
  }
});

window.onload = () => {
  try {
    products = JSON.parse(localStorage.getItem("mixerProducts")) || [];
  } catch {
    products = [];
  }
  updateList();
};
