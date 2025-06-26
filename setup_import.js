let products = [];

document.getElementById('importFile').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      const data = JSON.parse(event.target.result);
      const jobFields = ['client', 'crop', 'hectares', 'loads', 'volPerHa', 'pilot', 'aircraft'];
      jobFields.forEach(name => {
        const input = document.querySelector(`[name="${name}"]`);
        if (input) input.value = data[name] || '';
      });

      const job = {};
      jobFields.forEach(name => {
        job[name] = data[name];
      });
      localStorage.setItem("mixerJob", JSON.stringify(job));

      products = data.products || [];
      localStorage.setItem("mixerProducts", JSON.stringify(products));
    } catch (err) {
      alert("❌ Failed to import JSON: " + err.message);
    }
  };
  reader.readAsText(file);
});

document.getElementById('importCsv').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      const lines = event.target.result.split(/\r?\n/).filter(l => l.trim() !== '');
      const jobLine = lines.find(l => l.startsWith('Client'));
      const jobData = lines[lines.indexOf(jobLine) + 1].split(',');
      const productLines = lines.slice(lines.indexOf('Product,Rate,Unit,ContainerSize,ContainerCount') + 1);

      const fields = ['client', 'crop', 'hectares', 'loads', 'volPerHa', 'pilot', 'aircraft'];
      fields.forEach((name, i) => {
        document.querySelector(`[name="${name}"]`).value = jobData[i];
      });

      const job = {};
      fields.forEach(name => {
        const value = document.querySelector(`[name="${name}"]`).value;
        job[name] = ['hectares', 'loads', 'volPerHa'].includes(name) ? parseFloat(value) : value.trim();
      });
      localStorage.setItem("mixerJob", JSON.stringify(job));

      products = [];
      for (const line of productLines) {
        const [name, rate, unit, size, count] = line.split(',');
        if (!name) continue;
        products.push({
          name,
          rate: parseFloat(rate),
          unit,
          containers: Array(parseInt(count)).fill(parseFloat(size))
        });
      }
      localStorage.setItem("mixerProducts", JSON.stringify(products));
    } catch (err) {
      alert("❌ Failed to import CSV: " + err.message);
    }
  };
  reader.readAsText(file);
});
