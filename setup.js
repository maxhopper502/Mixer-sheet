
const form = document.getElementById("product-form");
const list = document.getElementById("product-list");

let products = [];

form.onsubmit = e => {
  e.preventDefault();
  const formData = new FormData(form);
  const name = formData.get("name");
  const rate = parseFloat(formData.get("rate"));
  const container = parseFloat(formData.get("container"));

  if (!name || !rate || !container) return;

  const product = { name, rate, containers: [container] };
  products.push(product);
  updateList();
  form.reset();
  localStorage.setItem("mixerProducts", JSON.stringify(products));
};

function updateList() {
  list.innerHTML = products.map(p => 
    `<p><strong>${p.name}</strong> - ${p.rate} L/ha | Container: ${p.containers[0]} L</p>`
  ).join("");
}

window.onload = () => {
  const saved = localStorage.getItem("mixerProducts");
  if (saved) {
    products = JSON.parse(saved);
    updateList();
  }
};
