
let loadCount = 0;
const haPerLoad = 15;
let products = JSON.parse(localStorage.getItem("mixerProducts") || "[]");

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

    product.containers = product.containers.filter(c => c > 0);
    while (remaining > 0 && product.containers.length > 0) {
      const available = product.containers[0];
      if (available >= remaining) {
        product.containers[0] -= remaining;
        fromContainers.push(`${remaining.toFixed(2)} L from container (now ${product.containers[0].toFixed(2)} L)`);
        remaining = 0;
      } else {
        fromContainers.push(`${available.toFixed(2)} L from container (now 0 L)`);
        remaining -= available;
        product.containers.shift();
      }
    }

    html += `<p><strong>${product.name}</strong><br>
             Rate: ${product.rate} L/ha &nbsp; Per Load: ${required.toFixed(2)} L<br>
             ${fromContainers.join("<br>")}
             <br><button onclick="this.textContent='✔️ Added'; this.disabled=true;">✅ Add</button></p>`;
  });

  load.innerHTML = html;
  container.appendChild(load);
  localStorage.setItem("mixerProducts", JSON.stringify(products));
}

function resetData() {
  localStorage.removeItem("mixerProducts");
  location.reload();
}
