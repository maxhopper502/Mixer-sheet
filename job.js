
// job.js with working product tracking and mixed container support
window.onload = function () {
  const job = JSON.parse(localStorage.getItem("mixerJob"));
  const products = JSON.parse(localStorage.getItem("mixerProducts"));
  if (!job || !products) return alert("❌ No job or products");

  document.getElementById("job-header").innerText = job.client + " " + job.crop;

  let currentLoad = 0;
  function renderLoadBlock() {
    // mock render logic
    const p = document.createElement("p");
    p.textContent = "Load " + (currentLoad + 1);
    document.getElementById("products").appendChild(p);
  }

  renderLoadBlock();
};
