// ── setup.js v3.1 ────────────────────────────────────────────────────────────
// Each job gets a unique jobId (timestamp). Aircraft registration is display-
// only — multiple jobs for the same aircraft are fully supported.

let products  = [];
let editIndex = null;
let currentJobId = null;   // set when editing an existing job

// ── Auto-rate from supplied quantity ─────────────────────────────────────────
function autoCalcRate() {
  const ha = parseFloat(document.getElementById('job-form').elements['hectares'].value);
  if (!ha || ha <= 0) {
    alert('Please enter total hectares first.');
    document.getElementById('useAll').checked = false;
    return;
  }
  const s1 = parseFloat(document.getElementById('product-form').elements['container1'].value);
  const c1 = parseInt(document.getElementById('product-form').elements['count1'].value);
  const s2 = parseFloat(document.getElementById('product-form').elements['container2'].value);
  const c2 = parseInt(document.getElementById('product-form').elements['count2'].value);
  const total = (isNaN(s1)||isNaN(c1) ? 0 : s1 * c1) + (isNaN(s2)||isNaN(c2) ? 0 : s2 * c2);
  const rate  = total / ha;
  document.getElementById('rateField').value       = rate.toFixed(3);
  document.getElementById('autoRate').textContent  = `Auto Rate: ${rate.toFixed(3)} per ha`;
}

// ── Add / Edit product ────────────────────────────────────────────────────────
document.getElementById('product-form').onsubmit = e => {
  e.preventDefault();
  const data = new FormData(e.target);
  const containers = [];
  const s1 = parseFloat(data.get('container1')), c1 = parseInt(data.get('count1'));
  if (!isNaN(s1) && c1 > 0) for (let i = 0; i < c1; i++) containers.push(s1);
  const s2 = parseFloat(data.get('container2')), c2 = parseInt(data.get('count2'));
  if (!isNaN(s2) && c2 > 0) for (let i = 0; i < c2; i++) containers.push(s2);

  const updated = {
    name:       data.get('name'),
    rate:       parseFloat(data.get('rate')),
    unit:       data.get('unit'),
    containers
  };

  if (editIndex !== null) { products[editIndex] = updated; editIndex = null; }
  else products.push(updated);

  // Persist products under current jobId (or temp key if not yet assigned)
  const tempKey = currentJobId || 'setup_temp';
  localStorage.setItem(`products_${tempKey}`, JSON.stringify(products));

  e.target.reset();
  document.getElementById('autoRate').textContent = '';
  document.getElementById('useAll').checked = false;
  updateProductList();
};

// ── Product list rendering ────────────────────────────────────────────────────
function updateProductList() {
  const ha   = parseFloat(new FormData(document.getElementById('job-form')).get('hectares') || 0);
  const list = document.getElementById('product-list');
  if (products.length === 0) {
    list.innerHTML = '<div class="empty-state" style="padding:16px 0"><p>No products added yet.</p></div>';
    return;
  }
  list.innerHTML = products.map((p, i) => {
    const required  = +(p.rate * ha).toFixed(3);
    const available = +p.containers.reduce((a, b) => a + b, 0).toFixed(3);
    const diff      = +(available - required).toFixed(3);
    const ok        = diff >= 0;
    return `<div class="product-item">
      <div class="product-item-name">${p.name}</div>
      <div class="product-item-detail">Rate: ${p.rate.toFixed(3)} ${p.unit}/ha</div>
      <div class="product-item-detail">Required: ${required} ${p.unit}</div>
      <div class="product-item-detail">Supplied: ${available} ${p.unit}</div>
      <div class="product-item-detail ${ok ? 'product-item-diff-ok' : 'product-item-diff-low'}">
        Difference: ${diff > 0 ? '+' : ''}${diff} ${p.unit} ${ok ? '✅' : '⚠️ SHORT'}
      </div>
      <div class="product-actions">
        <button class="btn btn-ghost btn-sm" onclick="loadProduct(${i})">✏️ Edit</button>
        <button class="btn btn-red btn-sm" onclick="deleteProduct(${i})">🗑 Delete</button>
      </div>
    </div>`;
  }).join('');
}

function loadProduct(index) {
  const p    = products[index];
  const form = document.getElementById('product-form');
  form.elements['name'].value = p.name;
  form.elements['rate'].value = p.rate;
  form.elements['unit'].value = p.unit;
  const grouped = p.containers.reduce((acc, size) => {
    acc[size] = (acc[size] || 0) + 1; return acc;
  }, {});
  const sizes = Object.entries(grouped);
  if (sizes[0]) { form.elements['container1'].value = sizes[0][0]; form.elements['count1'].value = sizes[0][1]; }
  if (sizes[1]) { form.elements['container2'].value = sizes[1][0]; form.elements['count2'].value = sizes[1][1]; }
  editIndex = index;
}

function deleteProduct(index) {
  products.splice(index, 1);
  const tempKey = currentJobId || 'setup_temp';
  localStorage.setItem(`products_${tempKey}`, JSON.stringify(products));
  updateProductList();
}

// ── Start / Save job ──────────────────────────────────────────────────────────
function startJob() {
  const f = new FormData(document.getElementById('job-form'));
  const aircraft = (f.get('aircraft') || '').trim().toUpperCase();
  const client   = (f.get('client')   || '').trim();

  if (!client || !aircraft) {
    alert('Please fill in Client and Aircraft Registration.');
    return;
  }
  if (!f.get('hectares') || !f.get('loads')) {
    alert('Please fill in Hectares and Number of Loads.');
    return;
  }
  if (products.length === 0) {
    alert('Please add at least one product.');
    return;
  }

  // Reuse existing jobId when editing; generate new one for new jobs
  const jobId = currentJobId || Date.now().toString();

  const job = {
    jobId,
    aircraft,
    client,
    crop:        f.get('crop')       || '',
    pilot:       f.get('pilot')      || '',
    hectares:    parseFloat(f.get('hectares')),
    volPerHa:    parseFloat(f.get('volPerHa')),
    loads:       parseInt(f.get('loads')),
    orderNumber: f.get('orderNumber') || ''
  };

  // Clean up temp key if it exists
  localStorage.removeItem('products_setup_temp');

  // Save job and products — keyed by unique jobId, NEVER overwrites another job
  localStorage.setItem(`job_${jobId}`,      JSON.stringify(job));
  localStorage.setItem(`products_${jobId}`, JSON.stringify(products));

  // Only reset progress if this is a brand-new job (not an edit)
  if (!currentJobId) {
    localStorage.removeItem(`progress_${jobId}`);
  }

  window.location.href = `job.html?jobId=${encodeURIComponent(jobId)}`;
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const params     = new URLSearchParams(window.location.search);
  const jobId      = params.get('jobId');
  const copyClient = params.get('copyClient');
  const copyOrder  = params.get('copyOrder');

  if (jobId) {
    // ── Editing existing job ────────────────────────────────────────────────
    currentJobId = jobId;
    const job  = JSON.parse(localStorage.getItem(`job_${jobId}`));
    const prods = JSON.parse(localStorage.getItem(`products_${jobId}`));
    if (job) {
      const els = document.getElementById('job-form').elements;
      els['client'].value      = job.client      || '';
      els['crop'].value        = job.crop        || '';
      els['pilot'].value       = job.pilot       || '';
      els['aircraft'].value    = job.aircraft    || '';
      els['hectares'].value    = job.hectares    || '';
      els['volPerHa'].value    = job.volPerHa    || '';
      els['loads'].value       = job.loads       || '';
      els['orderNumber'].value = job.orderNumber || '';
    }
    if (prods && Array.isArray(prods)) products = prods;

  } else if (copyClient) {
    // ── Adding aircraft to existing job ────────────────────────────────────
    const els = document.getElementById('job-form').elements;
    els['client'].value      = decodeURIComponent(copyClient);
    els['orderNumber'].value = decodeURIComponent(copyOrder || '');
    document.getElementById('copy-banner').style.display = '';
  }
  // else: fresh new job — products = [], form is empty

  updateProductList();

  // Auto-recalc rate when containers change
  ['container1','count1','container2','count2'].forEach(name => {
    document.getElementById('product-form').elements[name]
      ?.addEventListener('input', () => {
        if (document.getElementById('useAll').checked) autoCalcRate();
      });
  });
});
