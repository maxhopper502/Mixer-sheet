document.addEventListener("DOMContentLoaded", function () {
  const fileInput = document.getElementById("importFile");
  const importBtn = document.getElementById("importButton");
  const productForm = document.getElementById("product-form");

  importBtn.addEventListener("click", () => {
    if (!fileInput.files.length) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = JSON.parse(e.target.result);

        // Fill job fields
        const job = data.job || {};
        document.getElementById("client").value = job.client || "";
        document.getElementById("crop").value = job.crop || "";
        document.getElementById("hectares").value = job.hectares || "";
        document.getElementById("loads").value = job.loads || "";
        document.getElementById("waterPerHa").value = job.volPerHa || "";
        document.getElementById("pilot").value = job.pilot || "";
        document.getElementById("aircraft").value = job.aircraft || "";

        // Save for job page
        localStorage.setItem("mixerJob", JSON.stringify(job));
        localStorage.setItem("mixerProducts", JSON.stringify(data.products));

        const productList = document.getElementById("product-list");
        productList.innerHTML = "";

        (data.products || []).forEach(product => {
          const containerData = (product.containers || []).reduce((acc, size) => {
            acc[size] = (acc[size] || 0) + 1;
            return acc;
          }, {});
          addProduct(product.name, product.rate, product.unit, containerData);
        });

        updateStocktake();
        alert("✅ Job and products imported successfully!");
      } catch (err) {
        alert("❌ Error importing job: " + err.message);
        console.error(err);
      }
    };
    reader.readAsText(fileInput.files[0]);
  });

  productForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = productForm.elements["name"].value;
    const rate = parseFloat(productForm.elements["rate"].value);
    const unit = productForm.elements["unit"].value;

    const containerSizes = [...productForm.querySelectorAll('input[name="container"]')];
    const containerCounts = [...productForm.querySelectorAll('input[name="count"]')];
    const containers = {};

    for (let i = 0; i < containerSizes.length; i++) {
      const size = parseFloat(containerSizes[i].value);
      const count = parseInt(containerCounts[i].value);
      if (!isNaN(size) && !isNaN(count)) {
        containers[size] = (containers[size] || 0) + count;
      }
    }

    addProduct(name, rate, unit, containers);
    updateStocktake();
    productForm.reset();
    document.getElementById("product-containers").innerHTML = `
      <input type="number" name="container" placeholder="Container Size" required />
      <input type="number" name="count" placeholder="# Containers" required />
    `;
  });

  function addProduct(name, rate, unit, containers) {
    const productList = document.getElementById("product-list");
    const div = document.createElement("div");
    div.className = "product-tile";

    const header = document.createElement("strong");
    header.textContent = name;
    div.appendChild(header);

    const details = document.createElement("p");
    details.innerHTML = `Rate: ${rate} ${unit}/ha`;
    div.appendChild(details);

    const containerList = document.createElement("ul");
    for (let size in containers) {
      const item = document.createElement("li");
      item.textContent = `${containers[size]} × ${size}${unit}`;
      containerList.appendChild(item);
    }

    div.appendChild(containerList);
    div.dataset.name = name;
    div.dataset.rate = rate;
    div.dataset.unit = unit;
    div.dataset.containers = JSON.stringify(containers);
    productList.appendChild(div);
  }

  function updateStocktake() {
    const jobHa = parseFloat(document.getElementById("hectares").value);
    const summary = document.getElementById("stock-summary");
    if (summary) summary.remove();

    const products = [...document.querySelectorAll(".product-tile")].map(tile => {
      return {
        name: tile.dataset.name,
        rate: parseFloat(tile.dataset.rate),
        unit: tile.dataset.unit,
        containers: JSON.parse(tile.dataset.containers)
      };
    });

    const summaryDiv = document.createElement("div");
    summaryDiv.id = "stock-summary";
    summaryDiv.innerHTML = "<h4>🧮 Stocktake</h4>";

    products.forEach(p => {
      const required = p.rate * jobHa;
      const supplied = Object.entries(p.containers)
        .reduce((sum, [size, count]) => sum + parseFloat(size) * count, 0);
      const diff = supplied - required;
      summaryDiv.innerHTML += `
        <p><strong>${p.name}</strong><br>
        Required: ${required.toFixed(2)} ${p.unit}<br>
        Supplied: ${supplied.toFixed(2)} ${p.unit}<br>
        Difference: ${diff.toFixed(2)} ${p.unit}</p>
      `;
    });

    document.body.appendChild(summaryDiv);
  }
});