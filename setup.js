
function autoCalcRate() {
  const ha = parseFloat(document.getElementById("job-form").elements["hectares"].value);
  if (!ha || ha <= 0) {
    alert("Please enter total hectares first.");
    document.getElementById("useAll").checked = false;
    return;
  }

  const size1 = parseFloat(document.getElementById("product-form").elements["container1"].value);
  const count1 = parseInt(document.getElementById("product-form").elements["count1"].value);
  const size2 = parseFloat(document.getElementById("product-form").elements["container2"].value);
  const count2 = parseInt(document.getElementById("product-form").elements["count2"].value);

  const totalSupplied =
    (isNaN(size1) || isNaN(count1) ? 0 : size1 * count1) +
    (isNaN(size2) || isNaN(count2) ? 0 : size2 * count2);

  const rate = totalSupplied / ha;
  document.getElementById("rateField").value = rate.toFixed(3);
  document.getElementById("autoRate").textContent = `Auto Rate: ${rate.toFixed(3)} per ha`;
}

let products = [];
let editIndex = null;

document.getElementById("product-form").onsubmit = e => {
  e.preventDefault();
  const data = new FormData(e.target);
  const containers = [];

  const size1 = parseFloat(data.get("container1"));
  const count1 = parseInt(data.get("count1"));
  if (!isNaN(size1) && count1 > 0) {
    for (let i = 0; i < count1; i++) containers.push(size1);
  }

  const size2 = parseFloat(data.get("container2"));
  const count2 = parseInt(data.get("count2"));
  if (!isNaN(size2) && count2 > 0) {
    for (let i = 0; i < count2; i++) containers.push(size2);
  }

  const updated = {
    name: data.get("name"),
    rate: parseFloat(data.get("rate")),
    unit: data.get("unit"),
    containers
  };

  if (editIndex !== null) {
    products[editIndex] = updated;
    editIndex = null;
  } else {
    products.push(updated);
  }

  const aircraft = (document.getElementById("job-form").elements["aircraft"].value || "").trim().toUpperCase();
  localStorage.setItem(`products_${aircraft}`, JSON.stringify(products));
  localStorage.setItem("mixerProducts", JSON.stringify(products));
  e.target.reset();
  document.getElementById("autoRate").textContent = "";
  updateProductList();
};

function updateProductList() {
  const ha = parseFloat(new FormData(document.getElementById("job-form")).get("hectares") || 0);
  const list = document.getElementById("product-list");
  list.innerHTML = products.map((p, i) => {
    const required = +(p.rate * ha).toFixed(3);
    const available = +p.containers.reduce((a,b)=>a+b,0).toFixed(3);
    const diff = +(available - required).toFixed(3);
    const ok = diff >= 0;
    return `<div class="product-card"><strong>${p.name}</strong> @ ${p.rate.toFixed(3)} ${p.unit}/ha<br>
    Required: ${required} ${p.unit}<br>
    Supplied: ${available} ${p.unit}<br>
    Difference: ${diff} ${p.unit} ${ok ? "✅" : "⚠️"}<br>
    <button onclick="loadProduct(${i})">Edit</button>
    <button onclick="deleteProduct(${i})">🗑 Delete</button></div>`;
  }).join("");
}

function loadProduct(index) {
  const p = products[index];
  const form = document.getElementById("product-form");
  form.name.value = p.name;
  form.rate.value = p.rate;
  form.unit.value = p.unit;

  const grouped = p.containers.reduce((acc, size) => {
    acc[size] = (acc[size] || 0) + 1;
    return acc;
  }, {});
  const sizes = Object.entries(grouped);
  if (sizes[0]) {
    form.container1.value = sizes[0][0];
    form.count1.value = sizes[0][1];
  }
  if (sizes[1]) {
    form.container2.value = sizes[1][0];
    form.count2.value = sizes[1][1];
  }

  editIndex = index;
}

function deleteProduct(index) {
  products.splice(index, 1);
  const aircraft = (document.getElementById("job-form").elements["aircraft"].value || "").trim().toUpperCase();
  localStorage.setItem(`products_${aircraft}`, JSON.stringify(products));
  localStorage.setItem("mixerProducts", JSON.stringify(products));
  updateProductList();
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
    aircraft: f.get("aircraft").trim().toUpperCase(),
    orderNumber: f.get("orderNumber")
  };

  localStorage.removeItem(`job_${job.aircraft}`);
  localStorage.removeItem(`products_${job.aircraft}`);
  localStorage.setItem(`job_${job.aircraft}`, JSON.stringify(job));
  localStorage.setItem(`products_${job.aircraft}`, JSON.stringify(products));
  localStorage.setItem("mixerJob", JSON.stringify(job));
  localStorage.setItem("mixerProducts", JSON.stringify(products));
  window.location.href = `job.html?aircraft=${job.aircraft}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const aircraft = params.get("aircraft");

  let job = aircraft
    ? JSON.parse(localStorage.getItem(`job_${aircraft}`))
    : JSON.parse(localStorage.getItem("mixerJob"));

  if (job) {
    const f = document.getElementById("job-form");
    f.elements["client"].value = job.client || "";
    f.elements["crop"].value = job.crop || "";
    f.elements["pilot"].value = job.pilot || "";
    f.elements["aircraft"].value = job.aircraft || "";
    f.elements["hectares"].value = job.hectares || "";
    f.elements["volPerHa"].value = job.volPerHa || "";
    f.elements["loads"].value = job.loads || "";
    f.elements["orderNumber"].value = job.orderNumber || "";
  }

  let saved = aircraft
    ? JSON.parse(localStorage.getItem(`products_${aircraft}`))
    : JSON.parse(localStorage.getItem("mixerProducts"));

  if (saved && Array.isArray(saved)) {
    products = saved;
    updateProductList();
  }
});


// Recalculate if 'use all' is checked and containers change
document.addEventListener("DOMContentLoaded", () => {
  ["container1", "count1", "container2", "count2"].forEach(id => {
    document.getElementById("product-form").elements[id].addEventListener("input", () => {
      if (document.getElementById("useAll").checked) autoCalcRate();
    });
  });

  const params = new URLSearchParams(window.location.search);
  const aircraft = params.get("aircraft");

  let job = aircraft
    ? JSON.parse(localStorage.getItem(`job_${aircraft}`))
    : JSON.parse(localStorage.getItem("mixerJob"));

  if (job) {
    const f = document.getElementById("job-form");
    f.elements["client"].value = job.client || "";
    f.elements["crop"].value = job.crop || "";
    f.elements["pilot"].value = job.pilot || "";
    f.elements["aircraft"].value = job.aircraft || "";
    f.elements["hectares"].value = job.hectares || "";
    f.elements["volPerHa"].value = job.volPerHa || "";
    f.elements["loads"].value = job.loads || "";
    f.elements["orderNumber"].value = job.orderNumber || "";
  }

  let saved = aircraft
    ? JSON.parse(localStorage.getItem(`products_${aircraft}`))
    : JSON.parse(localStorage.getItem("mixerProducts"));

  if (saved && Array.isArray(saved)) {
    products = saved;
    updateProductList();
  }
});

// Fix importJob logic globally
document.getElementById("importFile").addEventListener("change", function(evt) {
  const file = evt.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      const job = data.job || data;
      const products = data.products;

      if (!job.client || !job.hectares || !products) throw "Invalid file format";

      const f = document.getElementById("job-form");
      f.elements["client"].value = job.client || "";
      f.elements["crop"].value = job.crop || "";
      f.elements["pilot"].value = job.pilot || "";
      f.elements["aircraft"].value = job.aircraft || "";
      f.elements["hectares"].value = job.hectares || "";
      f.elements["volPerHa"].value = job.volPerHa || "";
      f.elements["loads"].value = job.loads || "";
      f.elements["orderNumber"].value = job.orderNumber || "";

      const aircraft = job.aircraft?.trim().toUpperCase() || "DEFAULT";

      localStorage.setItem(`job_${aircraft}`, JSON.stringify(job));
      localStorage.setItem(`products_${aircraft}`, JSON.stringify(products));
      localStorage.setItem("mixerJob", JSON.stringify(job));
      localStorage.setItem("mixerProducts", JSON.stringify(products));

      alert("✅ Job imported successfully!");
      location.href = `job.html?aircraft=${aircraft}`;
    } catch (err) {
      alert("❌ Failed to import job: " + err);
    }
  };
  reader.readAsText(file);
});
