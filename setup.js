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

      // Clear existing products
      const productList = document.getElementById("productList");
      productList.innerHTML = "";

      (data.products || []).forEach(product => {
        const containerData = (product.containers || []).reduce((acc, size) => {
          acc[size] = (acc[size] || 0) + 1;
          return acc;
        }, {});
        addProduct(product.name, product.rate, product.unit, containerData);
      });

      alert("Job imported successfully!");
    } catch (err) {
      alert("Error importing job: " + err.message);
    }
  };
  reader.readAsText(fileInput.files[0]);
});