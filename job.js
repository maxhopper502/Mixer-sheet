
let jobData = JSON.parse(localStorage.getItem("jobData"));
let loadCount = 0;

if (!jobData || !jobData.products || jobData.products.length === 0) {
  alert("No job or products found. Please import or set up a job first.");
}

function addLoad() {
  if (!jobData || !jobData.products || jobData.products.length === 0) {
    alert("No job or products found.");
    return;
  }

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
