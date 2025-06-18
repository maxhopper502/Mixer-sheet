function toggleAdded(button) {
  button.classList.toggle("added");
  button.textContent = button.classList.contains("added") ? "✔️ Added" : "✅ Added";
}
