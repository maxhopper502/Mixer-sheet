
window.onload = function () {
  const job = JSON.parse(localStorage.getItem("mixerJob"));
  const products = JSON.parse(localStorage.getItem("mixerProducts"));
  if (!job || !products || products.length === 0) {
    alert("❌ No job or product found. Please import or set up a job first.");
    window.location.href = "setup.html";
    return;
  }

  job.totalVolume = job.hectares * job.volPerHa;
  job.loadArea = job.hectares / job.loads;
  job.loadVolume = job.loadArea * job.volPerHa;

  document.getElementById("client").textContent = job.client;
  document.getElementById("crop").textContent = job.crop;
  document.getElementById("pilot").textContent = job.pilot;
  document.getElementById("aircraft").textContent = job.aircraft;
  document.getElementById("hectares").textContent = job.hectares;
  document.getElementById("volPerHa").textContent = job.volPerHa;
  document.getElementById("totalVolume").textContent = Math.round(job.totalVolume);
  document.getElementById("loadArea").textContent = job.loadArea.toFixed(1);
  document.getElementById("loadVolume").textContent = Math.round(job.loadVolume);
  document.getElementById("loads").textContent = job.loads;

  let currentLoad = 0;
  const containerState = products.map(p => [...p.containers]);
  const productsDiv = document.getElementById("products");
  const buttonsContainer = document.getElementById("buttons-container");

  function updateProductRemaining() {
    const summary = document.getElementById("stock-summary");
    if (summary) summary.remove();
    const newSummary = document.createElement("div");
    newSummary.id = "stock-summary";
    newSummary.innerHTML = `<h4>Product Remaining</h4>` + products.map((p, i) => {
      const total = containerState[i].reduce((a, b) => a + b, 0).toFixed(2);
      return `<p><strong>${p.name}</strong>: ${total} ${p.unit}</p>`;
    }).join("");
    document.body.appendChild(newSummary);
  }

  function renderLoadBlock() {
    if (currentLoad >= job.loads) {
      alert("✅ All loads complete");
      return;
    }

    const loadDiv = document.createElement("div");
    loadDiv.className = "load-block";
    loadDiv.innerHTML = `<h3>Load ${currentLoad + 1}</h3>`;

    const allAdded = new Array(products.length).fill(false);

    products.forEach((product, index) => {
      const totalPerLoad = product.rate * job.loadArea;
      let remaining = totalPerLoad;
      const fromContainers = [];

      for (let i = 0; i < containerState[index].length && remaining > 0; i++) {
        const available = containerState[index][i];
        if (available > 0) {
          const used = Math.min(available, remaining);
          containerState[index][i] -= used;
          remaining -= used;
          fromContainers.push(`Container ${i + 1}: ${used.toFixed(2)} ${product.unit}`);
        }
      }

      const pDiv = document.createElement("div");
      pDiv.innerHTML = `
        <p><strong>${product.name}</strong>: ${totalPerLoad.toFixed(2)} ${product.unit}</p>
        <ul>${fromContainers.map(c => `<li>${c}</li>`).join("")}</ul>
        <button class="add-btn">🧪 Add</button>
      `;
      loadDiv.appendChild(pDiv);

      const button = pDiv.querySelector("button");
      button.onclick = () => {
        button.disabled = true;
        button.textContent = "✅ Added";
        button.style.background = "#28a745";
        allAdded[index] = true;

        if (allAdded.filter(Boolean).length === products.length) {
          const loadedBtn = document.createElement("button");
          loadedBtn.textContent = "➕ Add Load";
          loadedBtn.onclick = () => {
            loadedBtn.disabled = true;
            loadedBtn.textContent = "✅ Loaded";
            loadedBtn.style.background = "#28a745";
            const ts = new Date().toLocaleTimeString();
            const tsP = document.createElement("p");
            tsP.textContent = `🕒 Loaded at ${ts}`;
            loadDiv.appendChild(tsP);
            currentLoad++;
            renderLoadBlock();
            updateProductRemaining();
          };
          loadDiv.appendChild(loadedBtn);
        }
      };
    });

    
    loadDiv.appendChild(delBtn);

    productsDiv.appendChild(loadDiv);
  }

  // Init first load button
  renderLoadBlock();
  updateProductRemaining();
};


// Global Edit/Delete Job buttons
window.addEventListener("DOMContentLoaded", () => {
  const btnWrap = document.createElement("div");
  btnWrap.style.margin = "30px 12px";

  const editJobBtn = document.createElement("button");
  editJobBtn.textContent = "✏️ Edit Job";
  editJobBtn.onclick = () => {
    window.location.href = "setup.html";
  };

  const deleteJobBtn = document.createElement("button");
  deleteJobBtn.textContent = "🗑️ Delete Job";
  deleteJobBtn.onclick = () => {
    if (confirm("Are you sure you want to delete this job?")) {
      localStorage.removeItem("mixerJob");
      localStorage.removeItem("mixerProducts");
      window.location.href = "setup.html";
    }
  };

  btnWrap.appendChild(editJobBtn);
  btnWrap.appendChild(deleteJobBtn);
  
});


// Add footer Edit/Delete Job buttons at the bottom
const footer = document.createElement('div');
footer.style.textAlign = 'center';
footer.style.margin = '30px 10px';

const editJobBtn = document.createElement('button');
editJobBtn.innerText = '✏️ Edit Job';
editJobBtn.className = 'btn';
editJobBtn.onclick = () => {
  window.location.href = 'setup.html?edit=1';
};

const deleteJobBtn = document.createElement('button');
deleteJobBtn.innerText = '❌ Delete Job';
deleteJobBtn.className = 'btn';
deleteJobBtn.style.marginLeft = '10px';
deleteJobBtn.onclick = () => {
  localStorage.clear();
  window.location.href = 'setup.html';
};

footer.appendChild(editJobBtn);
footer.appendChild(deleteJobBtn);
document.body.appendChild(footer);
