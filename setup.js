
function addProduct() {
  const div = document.createElement("div");
  div.innerHTML = \`
    <input type="text" placeholder="Product Name" class="productName" required>
    <input type="number" step="0.001" placeholder="Rate per Ha" class="productRate" required>
    <select class="productUnit">
      <option value="L">L</option>
      <option value="kg">kg</option>
    </select><br><br>
  \`;
  document.getElementById("productList").appendChild(div);
}

function saveJob() {
  const products = [];
  const names = document.querySelectorAll(".productName");
  const rates = document.querySelectorAll(".productRate");
  const units = document.querySelectorAll(".productUnit");

  for (let i = 0; i < names.length; i++) {
    products.push({
      name: names[i].value,
      rate: parseFloat(rates[i].value),
      unit: units[i].value
    });
  }

  const job = {
    client: document.getElementById("client").value,
    crop: document.getElementById("crop").value,
    hectares: parseFloat(document.getElementById("hectares").value),
    loadSize: parseFloat(document.getElementById("loadSize").value),
    pilot: document.getElementById("pilot").value,
    aircraft: document.getElementById("aircraft").value.toUpperCase(),
    products: products
  };

  localStorage.setItem("jobData", JSON.stringify(job));
  alert("Job saved. You can now go to the mixing page.");
}

function importJob() {
  const fileInput = document.getElementById("importFile");
  const file = fileInput.files[0];
  if (!file) return alert("Please select a file.");

  const reader = new FileReader();
  reader.onload = function (e) {
    const content = e.target.result;

    if (file.name.endsWith(".json")) {
      try {
        const job = JSON.parse(content);
        localStorage.setItem("jobData", JSON.stringify(job));
        alert("JSON job imported successfully!");
      } catch (err) {
        alert("Invalid JSON format.");
      }
    } else if (file.name.endsWith(".csv")) {
      const lines = content.trim().split("\n");
      const products = lines.slice(1).map(line => {
        const [name, rate, unit] = line.split(",");
        return { name, rate: parseFloat(rate), unit };
      });

      const job = {
        client: "CSV Import",
        crop: "Unknown",
        hectares: 100,
        loadSize: 20,
        pilot: "CSV",
        aircraft: "CSV",
        products: products
      };

      localStorage.setItem("jobData", JSON.stringify(job));
      alert("CSV job imported successfully!");
    } else {
      alert("Unsupported file type.");
    }
  };
  reader.readAsText(file);
}
