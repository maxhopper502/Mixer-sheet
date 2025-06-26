document.getElementById("importFile").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      const data = JSON.parse(event.target.result);
      if (!data.client || !data.products || !Array.isArray(data.products)) {
        alert("❌ Invalid job file format");
        return;
      }
      document.querySelector("input[name='client']").value = data.client;
      document.querySelector("input[name='crop']").value = data.crop || "";
      document.querySelector("input[name='hectares']").value = data.hectares || "";
      document.querySelector("input[name='loads']").value = data.loads || "";
      document.querySelector("input[name='volPerHa']").value = data.volPerHa || "";
      document.querySelector("input[name='pilot']").value = data.pilot || "";
      document.querySelector("input[name='aircraft']").value = data.aircraft || "";

      const eventAdd = new Event("submit");
      window.products = [];
      data.products.forEach(p => {
        if (!p.name || !p.rate || !p.unit || !p.containers) return;
        products.push(p);
      });
      localStorage.setItem("mixerProducts", JSON.stringify(products));
      updateList();
    } catch (err) {
      alert("❌ Failed to import job: " + err.message);
    }
  };
  reader.readAsText(file);
});
