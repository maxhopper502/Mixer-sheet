
function addProduct() {
  const div = document.createElement("div");
  div.className = "product-block";
  div.innerHTML = \`
    <input type="text" placeholder="Product Name" class="productName" required>
    <input type="number" step="0.001" placeholder="Rate per Ha" class="productRate" required>
    <input type="number" placeholder="Container Size (L or kg)" class="productContainerSize" required>
    <input type="number" placeholder="Number of Containers" class="productContainerCount" required>
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
  const sizes = document.querySelectorAll(".productContainerSize");
  const counts = document.querySelectorAll(".productContainerCount");
  const units = document.querySelectorAll(".productUnit");

  const hectares = parseFloat(document.getElementById("hectares").value || 0);
  const loadCount = parseInt(document.getElementById("loads").value || 0);
  const waterRate = parseFloat(document.getElementById("waterRate").value || 0);

  for (let i = 0; i < names.length; i++) {
    const rate = parseFloat(rates[i].value || 0);
    const size = parseFloat(sizes[i].value || 0);
    const count = parseInt(counts[i].value || 0);
    const totalAvailable = size * count;
    const totalRequired = rate * hectares;
    const leftover = totalAvailable - totalRequired;

    const product = {
      name: names[i].value,
      rate,
      unit: units[i].value,
      containerSize: size,
      containerCount: count,
      totalAvailable,
      totalRequired,
      leftover
    };

    if (leftover < 0) {
      alert(\`Warning: Not enough \${product.name} (short by \${(-leftover).toFixed(2)} \${product.unit})\`);
    }

    products.push(product);
  }

  const job = {
    client: document.getElementById("client").value,
    crop: document.getElementById("crop").value,
    hectares,
    loads: loadCount,
    waterRate,
    pilot: document.getElementById("pilot").value,
    aircraft: document.getElementById("aircraft").value.toUpperCase(),
    products
  };

  localStorage.setItem("jobData", JSON.stringify(job));
  window.location.href = "job.html";
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
        loads: 5,
        waterRate: 80,
        pilot: "CSV",
        aircraft: "CSV",
        products
      };

      localStorage.setItem("jobData", JSON.stringify(job));
      alert("CSV job imported successfully!");
    } else {
      alert("Unsupported file type.");
    }
  };
  reader.readAsText(file);
}
