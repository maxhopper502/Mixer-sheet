
let loadCount = 0;
const haPerLoad = 15;
const products = [
  { name: "Prosaro 420 SC", rate: 0.45 },
  { name: "Smart Select ZMC Plus", rate: 3.0 }
];
let productContainers = {
  "Prosaro 420 SC": [400],
  "Smart Select ZMC Plus": [4000]
};

function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString();
}

function getCurrentDate() {
  const now = new Date();
  return now.toLocaleDateString();
}

function addLoad() {
  loadCount++;
  const container = document.getElementById("products");
  const load = document.createElement("div");
  load.className = "load";

  let html = `<h3>Load #${loadCount}</h3>`;
  html += `<p><strong>Date:</strong> ${getCurrentDate()} &nbsp; <strong>Time:</strong> ${getCurrentTime()}</p>`;

  products.forEach(product => {
    const required = product.rate * haPerLoad;
    let fromContainers = [];
    let remaining = required;

    productContainers[product.name] = productContainers[product.name].filter(vol => vol > 0);
    while (remaining > 0 && productContainers[product.name].length > 0) {
      const available = productContainers[product.name][0];
      if (available >= remaining) {
        productContainers[product.name][0] -= remaining;
        fromContainers.push(`${remaining.toFixed(2)} L from container (now ${productContainers[product.name][0].toFixed(2)} L)`);
        remaining = 0;
      } else {
        fromContainers.push(`${available.toFixed(2)} L from container (now 0 L)`);
        remaining -= available;
        productContainers[product.name].shift();
      }
    }

    html += `<p><strong>${product.name}</strong><br>
             Rate: ${product.rate} L/ha &nbsp; Per Load: ${required.toFixed(2)} L<br>
             ${fromContainers.join("<br>")}
             <br><button onclick="this.textContent='✔️ Added'; this.disabled=true;">✅ Add</button></p>`;
  });

  load.innerHTML = html;
  container.appendChild(load);
}
