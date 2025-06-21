
let products = JSON.parse(localStorage.getItem("mixerProducts") || "[]");
let editIndex = null;

document.getElementById("importFile").addEventListener("change", function(evt) {
  const file = evt.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.job || !data.products) throw "Invalid file format";

      const f = document.getElementById("job-form");
      f.client.value = data.job.client || "";
      f.crop.value = data.job.crop || "";
      f.hectares.value = data.job.hectares || "";
      f.loads.value = data.job.loads || "";
      f.volPerHa.value = data.job.volPerHa || "";
      f.pilot.value = data.job.pilot || "";
      f.aircraft.value = data.job.aircraft || "";

      localStorage.setItem("mixerJob", JSON.stringify(data.job));
      localStorage.setItem("mixerProducts", JSON.stringify(data.products));

      products = data.products;
      updateProductList();
      alert("✅ Job imported successfully!");
    } catch (err) {
      alert("❌ Failed to import job: " + err);
    }
  };
  reader.readAsText(file);
});

function updateProductList() {
  const ha = parseFloat(new FormData(document.getElementById("job-form")).get("hectares") || 0);
  const list = document.getElementById("product-list");
  list.innerHTML = products.map((p, i) => {
    const required = +(p.rate * ha).toFixed(3);
    const available = +p.containers.reduce((a,b)=>a+b,0).toFixed(3);
    const diff = +(available - required).toFixed(3);
    const ok = diff >= 0;
    return `<p><strong>${p.name}</strong> @ ${p.rate.toFixed(3)} ${p.unit}/ha<br>
    Required: ${required} ${p.unit}<br>
    Supplied: ${available} ${p.unit}<br>
    Difference: ${diff} ${p.unit} ${ok ? "✅" : "⚠️"}<br>
    <button onclick="loadProduct(${i})">Edit</button>
    <button onclick="deleteProduct(${i})">🗑 Delete</button></p>`;
  }).join("");
}

function loadProduct(index) {
  const p = products[index];
  const form = document.getElementById("product-form");
  form.name.value = p.name;
  form.rate.value = p.rate;
  form.unit.value = p.unit;
  form.container.value = p.containers[0];
  form.count.value = p.containers.length;
  editIndex = index;
}

function deleteProduct(index) {
  if (confirm("Are you sure you want to delete this product?")) {
    products.splice(index, 1);
    localStorage.setItem("mixerProducts", JSON.stringify(products));
    updateProductList();
  }
}

document.getElementById("product-form").onsubmit = e => {
  e.preventDefault();
  const data = new FormData(e.target);
  const updated = {
    name: data.get("name"),
    rate: parseFloat(data.get("rate")),
    unit: data.get("unit"),
    containers: Array(parseInt(data.get("count"))).fill(parseFloat(data.get("container")))
  };
  if (editIndex !== null) {
    products[editIndex] = updated;
    editIndex = null;
  } else {
    products.push(updated);
  }
  localStorage.setItem("mixerProducts", JSON.stringify(products));
  e.target.reset();
  updateProductList();
};

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
  window.location.href = "job.html";
}
