// ── job.js — Mixer Sheet v3.0 ─────────────────────────────────────────────
// Key upgrade: load progress is persisted to localStorage so switching
// between aircraft never loses where you were up to.

window.onload = function () {
  const params   = new URLSearchParams(window.location.search);
  const aircraft = params.get('aircraft') || '';

  // ── Load job data ──────────────────────────────────────────────────────
  let job      = JSON.parse(localStorage.getItem(`job_${aircraft}`))      || JSON.parse(localStorage.getItem('mixerJob'));
  let products = JSON.parse(localStorage.getItem(`products_${aircraft}`)) || JSON.parse(localStorage.getItem('mixerProducts'));

  if (!job || !products || products.length === 0) {
    alert('No job found. Please set up a job first.');
    window.location.href = 'setup.html';
    return;
  }

  // ── Restore saved progress (the critical new feature) ─────────────────
  const savedProgress = JSON.parse(localStorage.getItem(`progress_${aircraft}`)) || {};
  let currentLoad = savedProgress.currentLoad || 0;
  job.loadTimes   = savedProgress.loadTimes   || [];

  // ── Calculate job metrics ─────────────────────────────────────────────
  job.totalVolume = job.hectares * job.volPerHa;
  job.loadArea    = job.hectares / job.loads;
  job.loadVolume  = job.loadArea * job.volPerHa;

  // ── Populate header / summary ─────────────────────────────────────────
  document.getElementById('header-sub').textContent = `${job.aircraft} — ${job.client}`;
  document.getElementById('client').textContent      = job.client      || '—';
  document.getElementById('aircraft').textContent    = job.aircraft    || '—';
  document.getElementById('pilot').textContent       = job.pilot       || '—';
  document.getElementById('crop').textContent        = job.crop        || '—';
  document.getElementById('hectares').textContent    = job.hectares    || 0;
  document.getElementById('volPerHa').textContent    = job.volPerHa   || 0;
  document.getElementById('totalVolume').textContent = Math.round(job.totalVolume) || 0;
  document.getElementById('loadArea').textContent    = job.loadArea?.toFixed(1)    || 0;
  document.getElementById('loadVolume').textContent  = Math.round(job.loadVolume)  || 0;
  document.getElementById('loads').textContent       = job.loads       || 0;

  // ── Build switch bar from other active jobs ───────────────────────────
  buildSwitchBar(aircraft);

  // ── Container state: restore or initialise ────────────────────────────
  window.containerState = savedProgress.containerState
    ? savedProgress.containerState
    : products.map(p => [...p.containers].sort((a, b) => a - b));

  const productsDiv = document.getElementById('products');

  // ── Progress bar helper ───────────────────────────────────────────────
  function updateProgressBar() {
    const pct = Math.min(100, Math.round((currentLoad / job.loads) * 100));
    document.getElementById('progress-fill').style.width = pct + '%';
    document.getElementById('progress-label').textContent =
      `${currentLoad} of ${job.loads} loads complete`;
  }
  updateProgressBar();

  // ── Persist progress to localStorage ─────────────────────────────────
  function saveProgress() {
    localStorage.setItem(`progress_${aircraft}`, JSON.stringify({
      currentLoad,
      containerState: window.containerState,
      loadTimes:      job.loadTimes
    }));
    updateProgressBar();
  }

  // ── Stock summary ─────────────────────────────────────────────────────
  function updateStockSummary() {
    const div = document.getElementById('stock-summary');
    div.innerHTML = products.map((p, i) => {
      const total = window.containerState[i].reduce((a, b) => a + b, 0).toFixed(2);
      const ok    = parseFloat(total) >= 0;
      return `<div class="stock-item">
        <span>${p.name}</span>
        <span class="${ok ? 'stock-ok' : 'stock-low'}">${total} ${p.unit}</span>
      </div>`;
    }).join('');
  }
  updateStockSummary();

  // ── Container usage calculator (non-destructive) ──────────────────────
  function calculateUsage(productIndex, amountNeeded) {
    const containers = [...window.containerState[productIndex]];
    let remaining    = amountNeeded;
    const usage      = [];
    for (let i = 0; i < containers.length && remaining > 0; i++) {
      const available = containers[i];
      if (available > 0) {
        const used           = Math.min(available, remaining);
        remaining           -= used;
        const leftOver       = available - used;
        let line = `Container ${i + 1}: ${used.toFixed(2)} ${products[productIndex].unit}`;
        if (leftOver > 0 && remaining === 0)
          line += ` (${leftOver.toFixed(2)} remaining in this container)`;
        usage.push({ containerIndex: i, used, line });
      }
    }
    return usage;
  }

  function deductFromContainers(productIndex, amountNeeded) {
    let remaining = amountNeeded;
    for (let i = 0; i < window.containerState[productIndex].length && remaining > 0; i++) {
      const available = window.containerState[productIndex][i];
      if (available > 0) {
        const used                         = Math.min(available, remaining);
        window.containerState[productIndex][i] -= used;
        remaining                          -= used;
      }
    }
    updateStockSummary();
    saveProgress();
  }

  function addBackToContainers(productIndex, amountNeeded) {
    let remaining = amountNeeded;
    for (let i = 0; i < window.containerState[productIndex].length && remaining > 0; i++) {
      const original = products[productIndex].containers.sort((a,b)=>a-b)[i] || 0;
      const current  = window.containerState[productIndex][i];
      const space    = original - current;
      const addBack  = Math.min(space, remaining);
      window.containerState[productIndex][i] += addBack;
      remaining -= addBack;
    }
    updateStockSummary();
    saveProgress();
  }

  // ── Render a load block ───────────────────────────────────────────────
  function renderLoadBlock() {
    if (currentLoad >= job.loads) {
      const div = document.createElement('div');
      div.className = 'card complete-banner';
      div.innerHTML = `<h2>✅ All Loads Complete!</h2>
        <p style="color:var(--muted);margin-bottom:12px">All ${job.loads} loads have been mixed for ${job.aircraft}.</p>
        <button class="btn btn-blue" onclick="exportJob()">📤 Export PDF</button>`;
      productsDiv.appendChild(div);
      saveProgress();
      return;
    }

    const loadDiv       = document.createElement('div');
    loadDiv.className   = 'card load-block';
    loadDiv.id          = `load-block-${currentLoad}`;

    const titleDiv      = document.createElement('div');
    titleDiv.className  = 'load-block-title';
    titleDiv.textContent = `Load ${currentLoad + 1} of ${job.loads} — ${job.pilot || 'Pilot'} in ${job.aircraft}`;
    loadDiv.appendChild(titleDiv);

    const allAdded      = new Array(products.length).fill(false);
    const deducted      = new Array(products.length).fill(false);

    products.forEach((product, index) => {
      const totalPerLoad = product.rate * job.loadArea;
      const usage        = calculateUsage(index, totalPerLoad);

      const pDiv         = document.createElement('div');
      pDiv.className     = 'product-entry';

      const usageHtml = usage.length
        ? `<ul class="container-usage">${usage.map(u => `<li>${u.line}</li>`).join('')}</ul>`
        : `<p class="container-usage" style="color:var(--red)">⚠️ Insufficient stock</p>`;

      pDiv.innerHTML = `
        <div class="product-entry-name">${product.name}</div>
        <div class="product-entry-amount">${totalPerLoad.toFixed(2)} ${product.unit} per load</div>
        ${usageHtml}
        <button class="btn btn-blue btn-sm add-btn">🧪 Add</button>`;

      loadDiv.appendChild(pDiv);

      const btn = pDiv.querySelector('.add-btn');
      btn.onclick = () => {
        allAdded[index] = !allAdded[index];
        if (allAdded[index]) {
          if (!deducted[index]) { deductFromContainers(index, totalPerLoad); deducted[index] = true; }
          btn.textContent  = '✅ Added';
          btn.className    = 'btn btn-green btn-sm add-btn';
        } else {
          if (deducted[index]) { addBackToContainers(index, totalPerLoad); deducted[index] = false; }
          btn.textContent  = '🧪 Add';
          btn.className    = 'btn btn-blue btn-sm add-btn';
        }
        const allConfirmed  = allAdded.every(v => v);
        const existingLoadBtn = loadDiv.querySelector('.load-confirm');
        if (allConfirmed && !existingLoadBtn) {
          const loadedBtn     = document.createElement('button');
          loadedBtn.textContent = '✈️ Load Plane';
          loadedBtn.className   = 'btn btn-green load-confirm btn-block';
          loadedBtn.style.marginTop = '12px';
          loadedBtn.onclick   = () => {
            loadedBtn.disabled    = true;
            loadedBtn.textContent = '✅ Plane Loaded';
            loadedBtn.style.opacity = '0.7';
            const ts = new Date().toLocaleString();
            const tsP = document.createElement('p');
            tsP.style.cssText = 'margin-top:8px;color:var(--green);font-weight:600;font-size:0.85rem';
            tsP.textContent = `🕒 Loaded at ${ts}`;
            loadDiv.appendChild(tsP);
            job.loadTimes.push(ts);
            currentLoad++;
            saveProgress();
            renderLoadBlock();
          };
          loadDiv.appendChild(loadedBtn);
        }
        if (!allConfirmed && existingLoadBtn) existingLoadBtn.remove();
      };
    });

    productsDiv.appendChild(loadDiv);
    loadDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  renderLoadBlock();

  // ── Navigation ────────────────────────────────────────────────────────
  window.editJob = () => {
    window.location.href = `setup.html?aircraft=${encodeURIComponent(aircraft)}`;
  };

  window.deleteJob = () => {
    if (!confirm(`Delete job for ${aircraft}? This cannot be undone.`)) return;
    localStorage.removeItem(`job_${aircraft}`);
    localStorage.removeItem(`products_${aircraft}`);
    localStorage.removeItem(`progress_${aircraft}`);
    window.location.href = 'index.html';
  };

  window.exportJob = async () => {
    const mixer = prompt('Enter mixer name:');
    if (!mixer) return;

    const productRemaining = products.map((p, i) => ({
      name:      p.name,
      remaining: window.containerState[i].reduce((a, b) => a + b, 0).toFixed(2),
      unit:      p.unit
    }));

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 14;
    const m = 14;

    doc.setFontSize(16);
    doc.text(`Mixer Sheet — ${job.client}`, m, y); y += 8;
    if (job.orderNumber) { doc.setFontSize(12); doc.text(`Work Order #: ${job.orderNumber}`, m, y); y += 7; }
    doc.setFontSize(12);
    doc.text(`Mixer: ${mixer}`, m, y); y += 7;
    doc.setFontSize(11);
    doc.text(`Pilot: ${job.pilot}  Aircraft: ${job.aircraft}  Crop: ${job.crop}`, m, y); y += 6;
    doc.text(`Area: ${job.hectares} ha  |  Vol/Ha: ${job.volPerHa} L  |  Total Vol: ${Math.round(job.totalVolume)} L`, m, y); y += 6;
    doc.text(`Load Area: ${job.loadArea?.toFixed(1)} ha  |  Load Vol: ${Math.round(job.loadVolume)} L  |  Loads: ${job.loads}`, m, y); y += 10;

    doc.text('Chemicals:', m, y); y += 6;
    products.forEach(p => { doc.text(`  ${p.name} — ${p.rate} ${p.unit}/ha`, m, y); y += 6; });

    y += 4;
    doc.text('Product Remaining:', m, y); y += 6;
    productRemaining.forEach(p => { doc.text(`  ${p.name}: ${p.remaining} ${p.unit}`, m, y); y += 6; });

    if (job.loadTimes?.length) {
      y += 4;
      doc.text('Load Times:', m, y); y += 6;
      job.loadTimes.forEach((t, i) => { doc.text(`  Load ${i+1}: ${t}`, m, y); y += 6; });
    }

    const filename = `${job.client}_${job.orderNumber||'job'}_${job.aircraft}_mixer.pdf`;
    doc.save(filename);

    // Archive to history
    const history = JSON.parse(localStorage.getItem('completedJobs') || '[]');
    history.push({ client: job.client, aircraft: job.aircraft, orderNumber: job.orderNumber, exportDate: new Date().toLocaleString(), mixer });
    localStorage.setItem('completedJobs', JSON.stringify(history));
    alert('✅ PDF exported!');
  };
};

// ── Switch bar: show other active aircraft ────────────────────────────────
function buildSwitchBar(currentAircraft) {
  const pills = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('job_')) {
      const ac = key.slice(4);
      const prog = JSON.parse(localStorage.getItem(`progress_${ac}`)) || {};
      const job  = JSON.parse(localStorage.getItem(key));
      const done = (prog.currentLoad || 0) >= (job?.loads || 1);
      pills.push({ ac, active: ac === currentAircraft, done });
    }
  }
  if (pills.length <= 1) return;
  const bar   = document.getElementById('switch-bar');
  const wrap  = document.getElementById('switch-pills');
  bar.style.display = '';
  wrap.innerHTML = pills.map(p =>
    `<a href="job.html?aircraft=${encodeURIComponent(p.ac)}"
        class="switch-pill${p.active ? ' active' : ''}">
       ${p.done ? '✅' : '✈️'} ${p.ac}
     </a>`
  ).join('');
}
