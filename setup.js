// ── setup.js ─────────────────────────────────────────────────────────────────

function autoCalcRate() {
  const ha = parseFloat(document.getElementById('job-form').elements['hectares'].value);
  if (!ha || ha <= 0) {
    alert('Please enter total hectares first.');
    document.getElementById('useAll').checked = false;
    return;
  }
  const size1  = parseFloat(document.getElementById('product-form').elements['container1'].value);
  const count1 = parseInt(document.getElementById('product-form').elements['count1'].value);
  const size2  = parseFloat(document.getElementById('product-form').elements['container2'].value);
  const count2 = parseInt(document.getElementById('product-form').elements['count2'].value);
  const total  = (isNaN(size1)||isNaN(count1) ? 0 : size1*count1)
               + (isNaN(size2)||isNaN(count2) ? 0 : size2*count2);
  const rate = total / ha;
  document.getElementById('rateField').value = rate.toFixed(3);
  document.getElementById('autoRate').textContent = `Auto Rate: ${rate.toFixed(3)} per ha`;
}

let products = [];
let editIndex = null;

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

  const aircraft = (document.getElementById('job-form').elements['aircraft'].value || '').trim().toUpperCase();
  localStorage.setItem(`products_${aircraft}`, JSON.stringify(products));

  e.target.reset();
  document.getElementById('autoRate').textContent = '';
  document.getElementById('useAll').checked = false;
  updateProductList();
};

function updateProductList() {
  const ha   = parseFloat(new FormData(document.getElementById('job-form')).get('hectares') || 0);
  const list = document.getElementById('product-list');
  if (products.length === 0) {
    list.innerHTML = '<div class="empty-state" style="padding:16px 0"><p>No products added yet.</p></div>';
    return;
  }
  list.innerHTML = products.map((p, i) => {
    const required  = +(p.rate * ha).toFixed(3);
    const available = +p.containers.reduce((a,b)=>a+b,0).toFixed(3);
    const diff      = +(available - required).toFixed(3);
    const ok        = diff >= 0;
    return `<div class="product-item">
      <div class="product-item-name">${p.name}</div>
      <div class="product-item-detail">Rate: ${p.rate.toFixed(3)} ${p.unit}/ha</div>
      <div class="product-item-detail">Required: ${required} ${p.unit}</div>
      <div class="product-item-detail">Supplied: ${available} ${p.unit}</div>
      <div class="product-item-detail ${ok ? 'product-item-diff-ok' : 'product-item-diff-low'}">
        Difference: ${diff > 0 ? '+' : ''}${diff} ${p.unit} ${ok ? '✅' : '⚠️'}
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
  form.name.value      = p.name;
  form.rate.value      = p.rate;
  form.unit.value      = p.unit;
  const grouped = p.containers.reduce((acc, size) => { acc[size] = (acc[size]||0)+1; return acc; }, {});
  const sizes   = Object.entries(grouped);
  if (sizes[0]) { form.container1.value = sizes[0][0]; form.count1.value = sizes[0][1]; }
  if (sizes[1]) { form.container2.value = sizes[1][0]; form.count2.value = sizes[1][1]; }
  editIndex = index;
}

function deleteProduct(index) {
  products.splice(index, 1);
  const aircraft = (document.getElementById('job-form').elements['aircraft'].value || '').trim().toUpperCase();
  localStorage.setItem(`products_${aircraft}`, JSON.stringify(products));
  updateProductList();
}

function startJob() {
  const f = new FormData(document.getElementById('job-form'));
  const job = {
    client:      f.get('client'),
    crop:        f.get('crop'),
    hectares:    parseFloat(f.get('hectares')),
    loads:       parseInt(f.get('loads')),
    volPerHa:    parseFloat(f.get('volPerHa')),
    pilot:       f.get('pilot'),
    aircraft:    f.get('aircraft').trim().toUpperCase(),
    orderNumber: f.get('orderNumber')
  };
  if (!job.client || !job.aircraft || !job.hectares || !job.loads) {
    alert('Please fill in Client, Aircraft, Hectares and Loads.');
    return;
  }
  if (products.length === 0) {
    alert('Please add at least one product.');
    return;
  }
  // Clear any old progress for this aircraft if it's a fresh setup
  const existing = localStorage.getItem(`job_${job.aircraft}`);
  if (!existing) localStorage.removeItem(`progress_${job.aircraft}`);

  localStorage.setItem(`job_${job.aircraft}`,      JSON.stringify(job));
  localStorage.setItem(`products_${job.aircraft}`, JSON.stringify(products));
  window.location.href = `job.html?aircraft=${encodeURIComponent(job.aircraft)}`;
}

// ── Initialise on DOMContentLoaded ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const params   = new URLSearchParams(window.location.search);
  const aircraft = params.get('aircraft');
  const copyClient = params.get('copyClient');
  const copyOrder  = params.get('copyOrder');

  // Editing existing job
  if (aircraft) {
    const job = JSON.parse(localStorage.getItem(`job_${aircraft}`));
    if (job) {
      const f = document.getElementById('job-form');
      f.elements['client'].value      = job.client      || '';
      f.elements['crop'].value        = job.crop        || '';
      f.elements['pilot'].value       = job.pilot       || '';
      f.elements['aircraft'].value    = job.aircraft    || '';
      f.elements['hectares'].value    = job.hectares    || '';
      f.elements['volPerHa'].value    = job.volPerHa    || '';
      f.elements['loads'].value       = job.loads       || '';
      f.elements['orderNumber'].value = job.orderNumber || '';
    }
    const saved = JSON.parse(localStorage.getItem(`products_${aircraft}`));
    if (saved && Array.isArray(saved)) products = saved;

  // Adding aircraft to existing job (copying client/order)
  } else if (copyClient) {
    const f = document.getElementById('job-form');
    f.elements['client'].value      = decodeURIComponent(copyClient);
    f.elements['orderNumber'].value = decodeURIComponent(copyOrder || '');
    document.getElementById('copy-banner').style.display = '';
  }

  updateProductList();

  // Auto-recalculate rate when container inputs change
  ['container1','count1','container2','count2'].forEach(id => {
    document.getElementById('product-form').elements[id]?.addEventListener('input', () => {
      if (document.getElementById('useAll').checked) autoCalcRate();
    });
  });
});
