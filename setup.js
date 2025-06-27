document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("importButton").addEventListener("click", () => {
    const fileInput = document.getElementById("importFile");
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

        // Save to localStorage for job.js
        localStorage.setItem("mixerJob", JSON.stringify(job));
        localStorage.setItem("mixerProducts", JSON.stringify(data.products));

        // Display products
        const productList = document.getElementById("product-list");
        if (!productList) throw new Error("Missing #product-list element in HTML.");
        productList.innerHTML = "";

        (data.products || []).forEach(product => {
          const containerData = (product.containers || []).reduce((acc, size) => {
            acc[size] = (acc[size] || 0) + 1;
            return acc;
          }, {});
          addProduct(product.name, product.rate, product.unit, containerData);
        });

        updateStocktake();  // Trigger stocktake after import

        alert("✅ Job and products imported successfully!");
      } catch (err) {
        alert("❌ Error importing job: " + err.message);
        console.error(err);
      }
    };
    reader.readAsText(fileInput.files[0]);
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
    productList.appendChild(div);
  }

  function updateStocktake() {
    const job = {
      hectares: parseFloat(document.getElementById("hectares").value),
    };

    const products = JSON.parse(localStorage.getItem("mixerProducts")) || [];
    const summary = document.getElementById("stock-summary");
    if (summary) summary.remove();

    const summaryDiv = document.createElement("div");
    summaryDiv.id = "stock-summary";
    summaryDiv.innerHTML = "<h4>🧮 Stocktake</h4>";

    products.forEach(p => {
      const required = p.rate * job.hectares;
      const supplied = (p.containers || []).reduce((a, b) => a + b, 0);
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
