const dropboxToken = "sl.u.AF2ZkOUfexaJSY0BW-DnOvBGmYjUbVE1T3xLoJ8QfCUZdjgQetI-cH92gcobuqYtSlqiCwJ0mfKvwqqn5OjbfnC23xEEfZAqtNnOHJ3GLOz4ckdgWaXaYDwkxI5_DGwsmxgSvme-sZbo5rBaWeLa2DZxaRgCwr69WRWBlRUxTXlNGkLZVKA1ozBIXsmBdZL-uizCNbFHCbPN5qMGpgMnWh2J0Q9nOKkjsJBHwGsD_KACKHPHSGV-_o8fDACtt3AhYHp5UkcIt96m9jL1vvZqPsGAAYgj0s8sgmzc5xRqSWiqaUHsOqJTiBNCl9nXL5axaVIsm_T5ksYanByOr8WTsa7IpAxTgYPQB7TvCKY9Bsc-ZvGrk2VMaQg89tjvIKkyqvZLndIgJQg9WkEKoRGaXgGq6iQp3qXPMH6vONfI5YHkZ-J3c_9HpZO9So-O1NxWx3NinV1l_UJ5VKdr5TRKNtDTZ4DW96ZsJdr_hWZQAH9gRF3hxZLb0JHeMdrohylWixkfFdnkvZGFHnIzZ_qxJGcqKHvcniJvhjrPadeyeI9fFgujCg5EC2L60cwJ7tw5mTU5IOv4r3ea1RtLOzILFiwZIA7seDnjFlcI4xwQ0dxWs0nS7B_wha0WQE1kocYdAzZRXam4aUS_CjmvrA3aFX9Qcb59Em1ave0gWaZFTugAWo49UDC7MMDPm3WEoAFOnoL0ZV9MYeZHBEzHWYATI_i5vPSt1gcd0PXrk4iiBzjBPyhevu2O9wL8Ow_AEVXIgQ8Pudzs0A-MfcdlkwKHbiYgp9Q2QLpTUyo9OhCytl_ZcmrqDp1MhRYacUwsUb56kiBq1IodA0WdHNVheTzOSHOz0aa8rdIuFWQMjROX0eZrlDW8FZXh7C9dioRUvgqTSaWSTAoQOUhBiV-dWBxTtqhgpQK2pBoofnt53HF9yoMHcnGo-IcWgTmH8fgYCYsRuX79o8_31BHlBln5eOQdzm3H611Qd-PpKF-lVaWE63oHpSMmxA8R83EbzoheyWFRzVQDywjCNt8lCcDn_rWazwcIp9XLR-byDslOCipSExmh5Ma1kLd6oBvVHdUn129jIfgHtDJq3u2dPw-vPiYs7pa_djy-pevkxXvUCuAgEseG3S88hAG3VKXm2wSzAiP-ZX8L-6_Bq1C-OquStn7cU1MChY67eM9nB1bFPr-EM175ArvNgDlooyt2KCkka4_9H2Nu1smf-8_JTwEMtODxaLeEKLOdbNWWOZzaBdNeWCmEmsrxkSkHH1__M1J5opzg6pJW_VSxPGO8b44ZYLqsNQT-Cffp93Y_uAabWcOJ4Ufo5MbjjSwcgAAMkpZ45xsx2uDuaDlTYLWeH9qQUPGoJBxsu5O0ESPjK5h0eDN5y3uufwaOJNNZnXfStpSoH8735OKXklonzfH_Lk72XoRh5OnOXrPbOfhHg1TvHenZlIJuVg"; // 🔁 Replace this with your actual token

window.onload = function () {
  const urlParams = new URLSearchParams(window.location.search);
  const aircraft = urlParams.get("aircraft");

  let job = JSON.parse(localStorage.getItem(`job_${aircraft}`)) || JSON.parse(localStorage.getItem("mixerJob"));
  let products = JSON.parse(localStorage.getItem(`products_${aircraft}`)) || JSON.parse(localStorage.getItem("mixerProducts"));

  if (!job || !products || products.length === 0) {
    alert("❌ No job or product found. Please import or set up a job first.");
    window.location.href = "setup.html";
    return;
  }

  job.totalVolume = job.hectares * job.volPerHa;
  job.loadArea = job.hectares / job.loads;
  job.loadVolume = job.loadArea * job.volPerHa;
  job.loadTimes = job.loadTimes || [];

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
  const containerState = products.map(p => [...p.containers].sort((a, b) => a - b));
  const productsDiv = document.getElementById("products");

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
    loadDiv.innerHTML = `<h3>Load ${currentLoad + 1} – Pilot: ${job.pilot} in ${job.aircraft}</h3>`;
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
          let line = `Container ${i + 1}: ${used.toFixed(2)} ${product.unit}`;
          if (containerState[index][i] > 0 && remaining === 0) {
            line += ` (Remaining: ${containerState[index][i].toFixed(2)} ${product.unit})`;
          }
          fromContainers.push(line);
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
        allAdded[index] = !allAdded[index];
        if (allAdded[index]) {
          button.textContent = "✅ Added";
          button.style.background = "#28a745";
        } else {
          button.textContent = "🧪 Add";
          button.style.background = "";
        }

        const allConfirmed = allAdded.every(v => v);
        const existingLoadedBtn = loadDiv.querySelector(".load-confirm");

        if (allConfirmed && !existingLoadedBtn) {
          const loadedBtn = document.createElement("button");
          loadedBtn.textContent = "➕ Load Plane";
          loadedBtn.className = "load-confirm";
          loadedBtn.onclick = () => {
            loadedBtn.disabled = true;
            loadedBtn.textContent = "✅ Loaded";
            loadedBtn.style.background = "#28a745";
            const ts = new Date().toLocaleString();
            const tsP = document.createElement("p");
            tsP.textContent = `🕒 Loaded at ${ts}`;
            loadDiv.appendChild(tsP);
            job.loadTimes.push(ts);
            localStorage.setItem("mixerJob", JSON.stringify(job));
            currentLoad++;
            renderLoadBlock();
            updateProductRemaining();
          };
          loadDiv.appendChild(loadedBtn);
        }

        if (!allConfirmed && existingLoadedBtn) {
          existingLoadedBtn.remove();
        }
      };
    });

    productsDiv.appendChild(loadDiv);
  }

  renderLoadBlock();
  updateProductRemaining();
};

window.addEventListener("DOMContentLoaded", () => {
  const btnWrap = document.createElement("div");
  btnWrap.style.margin = "30px 12px";

  const editJobBtn = document.createElement("button");
  editJobBtn.textContent = "✏️ Edit Job";
  editJobBtn.onclick = () => {
    const aircraft = new URLSearchParams(location.search).get("aircraft");
    window.location.href = `setup.html?aircraft=${aircraft}`;
  };

  const deleteJobBtn = document.createElement("button");
  deleteJobBtn.textContent = "🗑️ Delete Job";
  deleteJobBtn.onclick = () => {
    const aircraft = new URLSearchParams(location.search).get("aircraft");
    if (confirm("Are you sure you want to delete this job?")) {
      localStorage.removeItem(`job_${aircraft}`);
      localStorage.removeItem(`products_${aircraft}`);
      localStorage.removeItem("mixerJob");
      localStorage.removeItem("mixerProducts");
      window.location.href = "setup.html";
    }
  };

  const exportJobBtn = document.createElement("button");
  exportJobBtn.textContent = "📤 Export Job";
  exportJobBtn.onclick = exportJob;

  btnWrap.appendChild(editJobBtn);
  btnWrap.appendChild(deleteJobBtn);
  btnWrap.appendChild(exportJobBtn);
  document.body.appendChild(btnWrap);
});

async function exportJob() {
  const job = JSON.parse(localStorage.getItem("mixerJob"));
  const products = JSON.parse(localStorage.getItem("mixerProducts"));
  if (!job || !products || products.length === 0) {
    alert("❌ No job or product data to export.");
    return;
  }

  const mixer = prompt("Enter mixer name:");
  if (!mixer) return;

  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const exportData = {
    job: { ...job, mixer, exportDate: dateStr },
    products
  };

  const filename = `${job.client}_${job.orderNumber || "WO"}.json`.replace(/\s+/g, "_");

  const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });

  try {
    const res = await fetch("https://content.dropboxapi.com/2/files/upload", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${dropboxToken}`,
        "Dropbox-API-Arg": JSON.stringify({
          path: `/${filename}`,
          mode: "overwrite",
          autorename: false,
          mute: false
        }),
        "Content-Type": "application/octet-stream"
      },
      body: jsonBlob
    });

    if (res.ok) {
      alert("✅ Exported and saved to Dropbox successfully!");
    } else {
      const err = await res.text();
      alert("❌ Dropbox upload failed:\n" + err);
    }
  } catch (e) {
    alert("❌ Error uploading to Dropbox: " + e.message);
  }
}

