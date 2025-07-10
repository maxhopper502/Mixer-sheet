window.onload = function () {
  const urlParams = new URLSearchParams(window.location.search);
  const aircraft = urlParams.get("aircraft");

  let job = null;
  let products = null;

  if (aircraft) {
    job = JSON.parse(localStorage.getItem(`job_${aircraft}`));
    products = JSON.parse(localStorage.getItem(`products_${aircraft}`));
  }

  if (!job || !products || products.length === 0) {
    job = JSON.parse(localStorage.getItem("mixerJob"));
    products = JSON.parse(localStorage.getItem("mixerProducts"));
  }

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

  renderLoadBlock();
  updateProductRemaining();
};

function renderLoadBlock() {
  // same as before (unchanged)
}

function updateProductRemaining() {
  // same as before (unchanged)
}

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
  const { jsPDF } = window.jspdf;

  if (!job || !products || products.length === 0) {
    alert("❌ No job or product data to export.");
    return;
  }

  const mixer = prompt("Enter mixer name:");
  if (!mixer) return;

  const region = prompt("Send to which base? (EP, MN, YP, SE)");
  const regionEmails = {
    EP: "cumminsaerotech@gmail.com",
    MN: "midnorth@aerotech.net.au",
    YP: "yp@aerotech.net.au",
    SE: "southeast@aerotech.net.au"
  };
  const email = regionEmails[region?.toUpperCase()] || "";

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-AU");
  const timeStr = now.toLocaleTimeString("en-AU");

  // PDF export
  const doc = new jsPDF();
  let y = 15;
  doc.setFontSize(14);
  doc.text(`Mixer Sheet – Client: ${job.client}`, 10, y);
  y += 8;
  if (job.orderNumber) {
    doc.setFontSize(12);
    doc.text(`Work Order #: ${job.orderNumber}`, 10, y);
    y += 8;
  }
  doc.text(`Date: ${dateStr}`, 10, y);
  y += 10;
  doc.setFontSize(12);
  doc.text(`Crop: ${job.crop}`, 10, y); y += 6;
  doc.text(`Pilot: ${job.pilot}`, 10, y); y += 6;
  doc.text(`Aircraft: ${job.aircraft}`, 10, y); y += 6;
  doc.text(`Mixer: ${mixer}`, 10, y); y += 10;

  doc.text(`Hectares: ${job.hectares}`, 10, y); y += 6;
  doc.text(`Vol/Ha: ${job.volPerHa}`, 10, y); y += 6;
  doc.text(`Total Vol: ${Math.round(job.totalVolume)}`, 10, y); y += 6;
  doc.text(`Load Area: ${job.loadArea.toFixed(1)} | Load Vol: ${Math.round(job.loadVolume)} | Loads: ${job.loads}`, 10, y); y += 8;

  doc.text("Products:", 10, y); y += 6;
  products.forEach(p => {
    doc.text(`${p.name} – ${p.rate} ${p.unit}/ha`, 10, y); y += 6;
  });

  y += 4;
  doc.text("Remaining Product:", 10, y); y += 6;
  const containerState = products.map(p => [...p.containers].sort((a, b) => a - b));
  products.forEach((p, i) => {
    const total = containerState[i].reduce((a, b) => a + b, 0).toFixed(2);
    doc.text(`${p.name}: ${total} ${p.unit}`, 10, y);
    y += 6;
  });

  if (job.loadTimes?.length) {
    y += 4;
    doc.text("Load Times:", 10, y);
    job.loadTimes.forEach((t, i) => {
      y += 6;
      doc.text(`Load ${i + 1}: ${t}`, 10, y);
    });
  }

  const pdfFileName = `${job.client}_${job.orderNumber || 'job'}_mixer_sheet.pdf`;
  const jsonFileName = `${job.client}_${job.orderNumber || 'job'}_data.json`;

  const pdfBlob = doc.output("blob");
  const jsonBlob = new Blob([JSON.stringify({ job: { ...job, mixer }, products }, null, 2)], { type: "application/json" });

  // Dropbox upload
  const dropboxToken = "sl.u.AF3QU_JklPTIbJJTYYepBRFpHm0QgTOvOeRvBpB_ycY_XzAASmdwOCcDmAMIu3ghdTKC4UQfTLiDhsnrTGubxYRAvm86hfH1lRzuOPwlOc9zdi4OPjWP4x1lGGhtz8pmJyy75PhFAhTRo4rFa7P1dgsTdiyDzTaMeLgIuWjKYfyGicYVhvZd4-YBX2u9jsnsgX95WIhOqtnLCGZYy9XK4Qd6stk7QRZIBZ94p0aVDoXhyE2vUx0btEN0W5jgxTxf4yzjfTP7UTCOU8DTi-Ioqh9EaSTERGcAn8V_KMHkjfFGlUCFttaeJME3nd5-tgWH4LM9ame3JUF3EwG2Mr_UY_lkqp1jxkiqZwmEls2h4toaUgu-dhkwBP5l4Ei5I4dKb0WmQJNmIy5R3R43YMQlBGevHsAbdWRUz6aLKMAEMqvzdn5fZMtGsyn89sAwCqhrvFBZz_LyxWudlM0NWNDOKf8VzRa1TDtGoETc7IvEwJfqF6dAGwEKJtg5_c_hzqwSXJzjVE65cY6_U7OYJvjVJtte7CZiHeSP7g2KRVpgPlw1ro5dKSztUwBgqRxodTtbaX8DHaAa3JJdVzfeVYIlXmbtareVLXc_EdtleritIu5avxHcGPMdOvFHN_rlhVsNokTZ_GfeZ6VUcXqnhcH4F0yJ9rgeKDB9kflWEwT9DS0ZvaVNkXe3-lyFp6_2uvI_7m_1tS2GBWt9FZbTQxW-e38gZnwCrFZDsmOzadOh8Ot1KTX7bHAduqxMMMAf9YoeRLvBq4yP6rK-dJLsBGITolwe6Wr8OITIazoQQALisK6uOLnZClHI0rL8BaQhvhXWv8c0kXY621Yp_ZRvRFBxKfWuVEr6akutZxN3YSL7xxnDoTRiXIIG5OIroDFaesjgZHHDiACz6_vL6b7O_W8dNDqaEKIOu8snWBMz-xKqPzfdRkF2a72_eXUJM9cr0_KNgKA2w7d0q-9HXBC4nOHiMEgZwV66T7CJRgWc9Dfe7jWzsg9cRcqFg6jpjs2-boFB0wCVe9zdboSxZlpfhOfzwurlcuicydzIQzZejTEbTMm0TpnaS_BuzISHKsWlC1qbftKU_PmDwMEX7-ySv4BSJta1XbiUZHOlKTIXhfBRmqR6U9CPOqtwoZpWhqRtrNmR5vdbK8eTJolImoLBwAhhgRnLSScJbA3EbRGoKQEl5ZAGoUzTwL3idJ8jjPkzlUdrkm584hzE1gpADn7UxAd0AIApz1DEWVYQmWKuDLVSBMixhafjGYrsRV73UkC45R46Io9i2-FaT2b2otBuyLv-g402fadrK5npjibKLORXRoov6W5X9gulOy1xScSKVv4XdtY4Aw-UubQm6S_jGXWdkwlAcYB_OVVycS703rzJOGOLDUn8iYPMTGNwmA8tu5xaPwRsUqBhq5pli454p3YuSiHlc4bHf7D6J6ea7A9aa0kLlw";
  const uploadToDropbox = async (path, blob) => {
    const response = await fetch("https://content.dropboxapi.com/2/files/upload", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${dropboxToken}`,
        "Content-Type": "application/octet-stream",
        "Dropbox-API-Arg": JSON.stringify({
          path: `/${path}`,
          mode: "overwrite",
          autorename: false,
          mute: false
        })
      },
      body: blob
    });
    return response.ok;
  };

  const uploadedPDF = await uploadToDropbox(pdfFileName, pdfBlob);
  const uploadedJSON = await uploadToDropbox(jsonFileName, jsonBlob);

  if (uploadedPDF && uploadedJSON) {
    alert(`✅ Files uploaded to Dropbox.\nPDF: ${pdfFileName}\nJSON: ${jsonFileName}`);
  } else {
    alert("❌ Failed to upload to Dropbox.");
  }
}

