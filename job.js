
function addLoad() {
  console.log("Add Load clicked");

  const productsContainer = document.getElementById("products");
  if (!productsContainer) {
    console.error("products container not found");
    return;
  }

  const loadDiv = document.createElement("div");
  loadDiv.className = "product-card";
  loadDiv.innerHTML = "<strong>Load:</strong> Product mix goes here";
  productsContainer.appendChild(loadDiv);
}

function resetData() {
  console.log("Reset clicked");

  const productsContainer = document.getElementById("products");
  if (!productsContainer) {
    console.error("products container not found");
    return;
  }

  productsContainer.innerHTML = "";
}
