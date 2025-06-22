
// Force fallback job for testing
const testJob = {
  client: "Test Client",
  crop: "Wheat",
  hectares: 100,
  loadSize: 20,
  products: [
    { name: "Chemical A", rate: 1.5, unit: "L" },
    { name: "Chemical B", rate: 2.2, unit: "L" }
  ]
};
localStorage.setItem("jobData", JSON.stringify(testJob));
let jobData = testJob;

console.log("Loaded test jobData:", jobData);

let loadCount = 0;

function addLoad() {
  const container = document.getElementById("products");
  if (!container) return;

  loadCount++;
  const loadDiv = document.createElement("div");
  loadDiv.className = "product-card";

  const loadHeader = document.createElement("strong");
  loadHeader.textContent = "Load " + loadCount;
  loadDiv.appendChild(loadHeader);

  jobData.products.forEach((product, index) => {
    const perHa = parseFloat(product.rate || 0);
    const loadSize = parseFloat(jobData.loadSize || 0);
    const amount = (perHa * loadSize).toFixed(3);

    let productBlock = document.createElement("p");
    productBlock.innerHTML = `
      ${product.name} — ${amount} ${product.unit} 
      <button data-load="${loadCount}" data-product="${index}" onclick="markAdded(this)">Add</button>
    `;
    loadDiv.appendChild(productBlock);
  });

  const loadedBtn = document.createElement("button");
  loadedBtn.textContent = "✅ Loaded";
  loadedBtn.disabled = true;
  loadedBtn.style.marginTop = "10px";
  loadedBtn.onclick = function () {
    const time = new Date().toLocaleTimeString();
    loadedBtn.textContent = "✅ Loaded at " + time;
    loadedBtn.disabled = true;
  };
  loadDiv.appendChild(loadedBtn);

  container.appendChild(loadDiv);

  if (!window.loadState) window.loadState = {};
  window.loadState["load" + loadCount] = {
    added: Array(jobData.products.length).fill(false),
    loadedButton: loadedBtn
  };
}

function markAdded(button) {
  const load = button.getAttribute("data-load");
  const product = button.getAttribute("data-product");
  button.textContent = "Added";
  button.disabled = true;

  if (window.loadState && window.loadState["load" + load]) {
    window.loadState["load" + load].added[product] = true;

    const allAdded = window.loadState["load" + load].added.every(v => v);
    if (allAdded) {
      window.loadState["load" + load].loadedButton.disabled = false;
    }
  }
}

function resetData() {
  if (confirm("Reset all loads?")) {
    const container = document.getElementById("products");
    if (container) container.innerHTML = "";
    loadCount = 0;
    window.loadState = {};
  }
}
