// ── job.js v3.1 ───────────────────────────────────────────────────────────────

window.onload = function () {
  const params = new URLSearchParams(window.location.search);
  // Support both new ?jobId= and old ?aircraft= URLs for backward compat
  const jobId  = params.get('jobId') || params.get('aircraft');

  if (!jobId) {
    alert('No job ID found. Returning to home.');
    window.location.href = 'index.html';
    return;
  }

  // ── Load job data ──────────────────────────────────────────────────────────
  let job      = JSON.parse(localStorage.getItem(`job_${jobId}`));
  let products = JSON.parse(localStorage.getItem(`products_${jobId}`));

  // Backward compat: old apps stored under 'mixerJob'/'mixerProducts'
  if (!job)      job      = JSON.parse(localStorage.getItem('mixerJob'));
  if (!products) products = JSON.parse(localStorage.getItem('mixerProducts'));

  if (!job || !products || products.length === 0) {
    alert('Job not found. Returning to home.');
    window.location.href = 'index.html';
    return;
  }

  job.jobId = jobId;

  // ── Restore saved progress ────────────────────────────────────────────────
  const savedProgress = JSON.parse(localStorage.getItem(`progress_${jobId}`)) || {};
  let currentLoad     = savedProgress.currentLoad || 0;
  job.loadTimes       = savedProgress.loadTimes   || [];

  // ── Derived metrics ───────────────────────────────────────────────────────
  job.totalVolume = job.hectares * job.volPerHa;
  job.loadArea    = job.hectares / job.loads;
  job.loadVolume  = job.loadArea * job.volPerHa;

  // ── Header / summary ──────────────────────────────────────────────────────
  document.getElementById('header-sub').textContent = `${job.aircraft} — ${job.client}`;
  document.getElementById('client').textContent      = job.client      || '—';
  document.getElementById('aircraft').textContent    = job.aircraft    || '—';
  document.getElementById('pilot').textContent       = job.pilot       || '—';
  document.getElementById('crop').textContent        = job.crop        || '—';
  document.getElementById('hectares').textContent    = job.hectares    || 0;
  document.getElementById('volPerHa').textContent    = job.volPerHa    || 0;
  document.getElementById('totalVolume').textContent = Math.round(job.totalVolume) || 0;
  document.getElementById('loadArea').textContent    = job.loadArea?.toFixed(1) || 0;
  document.getElementById('loadVolume').textContent  = Math.round(job.loadVolume) || 0;
  document.getElementById('loads').textContent       = job.loads       || 0;

  // ── Switch bar ────────────────────────────────────────────────────────────
  buildSwitchBar(jobId);

  // ── Container state: restore or initialise ────────────────────────────────
  window.containerState = savedProgress.containerState
    ? savedProgress.containerState
    : products.map(p => [...p.containers].sort((a, b) => a - b));

  const productsDiv = document.getElementById('products');

  // ── Progress bar ──────────────────────────────────────────────────────────
  function updateProgressBar() {
    const pct = Math.min(100, Math.round((currentLoad / job.loads) * 100));
    document.getElementById('progress-fill').style.width = pct + '%';
    document.getElementById('progress-label').textContent =
      `${currentLoad} of ${job.loads} loads complete`;
  }
  updateProgressBar();

  // ── Save progress to localStorage ─────────────────────────────────────────
  function saveProgress() {
    localStorage.setItem(`progress_${jobId}`, JSON.stringify({
      currentLoad,
      containerState: window.containerState,
      loadTimes:      job.loadTimes
    }));
    updateProgressBar();
  }

  // ── Stock summary ─────────────────────────────────────────────────────────
  function updateStockSummary() {
    document.getElementById('stock-summary').innerHTML = products.map((p, i) => {
      const total = window.containerState[i].reduce((a, b) => a + b, 0).toFixed(2);
      const ok    = parseFloat(total) >= 0;
      return `<div class="stock-item">
        <span>${p.name}</span>
        <span class="${ok ? 'stock-ok' : 'stock-low'}">${total} ${p.unit}</span>
      </div>`;
    }).join('');
  }
  updateStockSummary();

  // ── Container deduction / add-back ────────────────────────────────────────
  function deductFromContainers(productIndex, amountNeeded) {
    let remaining = amountNeeded;
    for (let i = 0; i < window.containerState[productIndex].length && remaining > 0; i++) {
      const avail = window.containerState[productIndex][i];
      if (avail > 0) {
        const used = Math.min(avail, remaining);
        window.containerState[productIndex][i] -= used;
        remaining -= used;
      }
    }
    updateStockSummary();
    saveProgress();
  }

  function addBackToContainers(productIndex, amountNeeded) {
    let remaining = amountNeeded;
    const origSorted = [...products[productIndex].containers].sort((a, b) => a - b);
    for (let i = 0; i < window.containerState[productIndex].length && remaining > 0; i++) {
      const original = origSorted[i] || 0;
      const space    = original - window.containerState[productIndex][i];
      const addBack  = Math.min(space, remaining);
      window.containerState[productIndex][i] += addBack;
      remaining -= addBack;
    }
    updateStockSummary();
    saveProgress();
  }

  function calculateUsage(productIndex, amountNeeded) {
    const containers = [...window.containerState[productIndex]];
    let remaining    = amountNeeded;
    const usage      = [];
    for (let i = 0; i < containers.length && remaining > 0; i++) {
      const available = containers[i];
      if (available > 0) {
        const used     = Math.min(available, remaining);
        remaining     -= used;
        const leftOver = available - used;
        let line = `Container ${i + 1}: ${used.toFixed(2)} ${products[productIndex].unit}`;
        if (leftOver > 0 && remaining === 0)
          line += ` (${leftOver.toFixed(2)} left in this container)`;
        usage.push({ line });
      }
    }
    return usage;
  }

  // ── Render one load block ─────────────────────────────────────────────────
  function renderLoadBlock() {
    if (currentLoad >= job.loads) {
      const div = document.createElement('div');
      div.className = 'card complete-banner';
      div.innerHTML = `<h2>✅ All Loads Complete!</h2>
        <p style="color:var(--muted);margin-bottom:12px">All ${job.loads} loads mixed for ${job.aircraft}.</p>
        <button class="btn btn-blue" onclick="exportJob()">📤 Export PDF</button>`;
      productsDiv.appendChild(div);
      saveProgress();
      return;
    }

    const loadDiv      = document.createElement('div');
    loadDiv.className  = 'card load-block';
    loadDiv.id         = `load-block-${currentLoad}`;

    const titleDiv     = document.createElement('div');
    titleDiv.className = 'load-block-title';
    titleDiv.textContent = `Load ${currentLoad + 1} of ${job.loads} — ${job.pilot || 'Pilot'} / ${job.aircraft}`;
    loadDiv.appendChild(titleDiv);

    const allAdded = new Array(products.length).fill(false);
    const deducted = new Array(products.length).fill(false);

    products.forEach((product, index) => {
      const totalPerLoad = product.rate * job.loadArea;
      const usage        = calculateUsage(index, totalPerLoad);

      const pDiv = document.createElement('div');
      pDiv.className = 'product-entry';

      const usageHtml = usage.length
        ? `<ul class="container-usage">${usage.map(u => `<li>${u.line}</li>`).join('')}</ul>`
        : `<p class="container-usage" style="color:var(--red)">⚠️ Insufficient stock</p>`;

      pDiv.innerHTML = `
        <div class="product-entry-name">${product.name}</div>
        <div class="product-entry-amount">${totalPerLoad.toFixed(2)} ${product.unit} per load</div>
        ${usageHtml}
        <button class="btn btn-blue btn-sm add-btn">🧪 Add</button>`;

      loadDiv.appendChild(pDiv);

      pDiv.querySelector('.add-btn').onclick = function () {
        allAdded[index] = !allAdded[index];
        if (allAdded[index]) {
          if (!deducted[index]) { deductFromContainers(index, totalPerLoad); deducted[index] = true; }
          this.textContent = '✅ Added';
          this.className   = 'btn btn-green btn-sm add-btn';
        } else {
          if (deducted[index]) { addBackToContainers(index, totalPerLoad); deducted[index] = false; }
          this.textContent = '🧪 Add';
          this.className   = 'btn btn-blue btn-sm add-btn';
        }
        const allConfirmed    = allAdded.every(v => v);
        const existingConfirm = loadDiv.querySelector('.load-confirm');
        if (allConfirmed && !existingConfirm) {
          const loadedBtn       = document.createElement('button');
          loadedBtn.textContent = '✈️ Load Plane';
          loadedBtn.className   = 'btn btn-green load-confirm btn-block';
          loadedBtn.style.marginTop = '12px';
          loadedBtn.onclick     = () => {
            loadedBtn.disabled      = true;
            loadedBtn.textContent   = '✅ Plane Loaded';
            loadedBtn.style.opacity = '0.7';
            const ts  = new Date().toLocaleString();
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
        if (!allConfirmed && existingConfirm) existingConfirm.remove();
      };
    });

    productsDiv.appendChild(loadDiv);
    loadDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  renderLoadBlock();

  // ── Action handlers ───────────────────────────────────────────────────────
  window.editJob = () => {
    window.location.href = `setup.html?jobId=${encodeURIComponent(jobId)}`;
  };

  window.deleteJob = () => {
    if (!confirm(`Delete job for ${job.aircraft} (${job.client})? This cannot be undone.`)) return;
    localStorage.removeItem(`job_${jobId}`);
    localStorage.removeItem(`products_${jobId}`);
    localStorage.removeItem(`progress_${jobId}`);
    window.location.href = 'index.html';
  };

  window.exportJob = async () => {
    const mixer = prompt('Enter mixer name:');
    if (mixer === null) return;

    const productRemaining = products.map((p, i) => ({
      name:      p.name,
      remaining: window.containerState[i].reduce((a, b) => a + b, 0).toFixed(2),
      unit:      p.unit
    }));

    if (!window.jspdf) {
      alert('PDF library not loaded. Try refreshing the page.');
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 14;
    const m = 14;

    doc.setFontSize(16);
    doc.text(`Mixer Sheet — ${job.client}`, m, y); y += 8;
    if (job.orderNumber) { doc.setFontSize(12); doc.text(`Work Order #: ${job.orderNumber}`, m, y); y += 7; }
    doc.setFontSize(12);
    doc.text(`Mixer: ${mixer || '—'}`, m, y); y += 7;
    doc.setFontSize(11);
    doc.text(`Pilot: ${job.pilot || '—'}  Aircraft: ${job.aircraft}  Crop: ${job.crop || '—'}`, m, y); y += 6;
    doc.text(`Area: ${job.hectares} ha  |  Vol/Ha: ${job.volPerHa} L  |  Total: ${Math.round(job.totalVolume)} L`, m, y); y += 6;
    doc.text(`Load Area: ${job.loadArea?.toFixed(1)} ha  |  Load Vol: ${Math.round(job.loadVolume)} L  |  Loads: ${job.loads}`, m, y); y += 10;

    doc.text('Products per load:', m, y); y += 6;
    products.forEach(p => { doc.text(`  ${p.name} — ${p.rate} ${p.unit}/ha`, m, y); y += 6; });

    y += 4;
    doc.text('Product Remaining:', m, y); y += 6;
    productRemaining.forEach(p => { doc.text(`  ${p.name}: ${p.remaining} ${p.unit}`, m, y); y += 6; });

    if (job.loadTimes?.length) {
      y += 4;
      doc.text('Load Times:', m, y); y += 6;
      job.loadTimes.forEach((t, i) => { doc.text(`  Load ${i + 1}: ${t}`, m, y); y += 6; });
    }

    const filename = `${job.client}_${job.orderNumber || 'job'}_${job.aircraft}_mixer.pdf`
      .replace(/[^a-z0-9_\-\.]/gi, '_');
    doc.save(filename);

    // Archive
    const history = JSON.parse(localStorage.getItem('completedJobs') || '[]');
    history.push({
      client:      job.client,
      aircraft:    job.aircraft,
      orderNumber: job.orderNumber,
      exportDate:  new Date().toLocaleString(),
      mixer:       mixer || '—'
    });
    localStorage.setItem('completedJobs', JSON.stringify(history));
    alert('✅ PDF exported!');
  };
};

// ── Switch bar (shows other active jobs) ──────────────────────────────────────
function buildSwitchBar(currentJobId) {
  const allJobs = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('job_')) continue;
    try {
      const j    = JSON.parse(localStorage.getItem(key));
      if (!j || !j.client) continue;
      const jId  = j.jobId || key.slice(4);
      const prog = JSON.parse(localStorage.getItem(`progress_${jId}`)) || {};
      const done = (prog.currentLoad || 0) >= (j.loads || 1);
      allJobs.push({ jId, aircraft: j.aircraft, client: j.client, done });
    } catch(e) {}
  }
  if (allJobs.length <= 1) return;

  const bar  = document.getElementById('switch-bar');
  const wrap = document.getElementById('switch-pills');
  bar.style.display = '';
  wrap.innerHTML = allJobs.map(j =>
    `<a href="job.html?jobId=${encodeURIComponent(j.jId)}"
        class="switch-pill${j.jId === currentJobId ? ' active' : ''}">
       ${j.done ? '✅' : '✈️'} ${j.aircraft}<span class="switch-pill-sub">${j.client}</span>
     </a>`
  ).join('');
}
