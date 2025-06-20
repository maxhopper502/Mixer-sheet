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
      updateList();
      alert("✅ Job imported successfully!");
    } catch (err) {
      alert("❌ Failed to import job: " + err);
    }
  };
  reader.readAsText(file);
});
