
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

      // Populate product list UI
      products = data.products;
      updateProductList();
      alert("✅ Job imported successfully!");
    } catch (err) {
      alert("❌ Failed to import job: " + err);
    }
  };
  reader.readAsText(file);
});

let products = JSON.parse(localStorage.getItem("mixerProducts") || "[]");

function updateProductList() {
  const ha = parseFloat(new FormData(document.getElementById("job-form")).get("hectares") || 0);
  const list = document.getElementById("product-list");
  list.innerHTML = products.map((p, i) => {
    const required = (p.rate * ha).toFixed(3);
    const available = p.containers.reduce((a,b)=>a+b,0).toFixed(3);
    const ok = parseFloat(available) >= parseFloat(required);
    return `<p><strong>${p.name}</strong> ${p.rate.toFixed(3)} ${p.unit}/ha<br>
    Total: ${available} ${p.unit}, Required: ${required} ${p.unit}<br>
    ${ok ? "✅ OK" : "⚠️ Not enough!"}
    <button onclick="editProduct(${i})">Edit</button></p>`;
  }).join("");
}

function editProduct(index) {
  const product = products[index];
  const newRate = prompt("Edit Rate:", product.rate);
  const newCount = prompt("Edit Container Count:", product.containers.length);
  if (newRate && newCount) {
    product.rate = parseFloat(newRate);
    product.containers = Array(parseInt(newCount)).fill(20); // Default container size of 20
    localStorage.setItem("mixerProducts", JSON.stringify(products));
    updateProductList();
  }
}

document.getElementById("product-form").onsubmit = e => {
  e.preventDefault();
  const data = new FormData(e.target);
  products.push({
    name: data.get("name"),
    rate: parseFloat(data.get("rate")),
    unit: data.get("unit"),
    containers: Array(parseInt(data.get("count"))).fill(parseFloat(data.get("container")))
  });
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
