
async function handleImageOCR(event) {
  const file = event.target.files[0];
  if (!file) return;

  const { createWorker } = Tesseract;
  const worker = await createWorker({
    logger: m => console.log(m)
  });

  const imageURL = URL.createObjectURL(file);
  const imageElement = document.createElement("img");
  imageElement.src = imageURL;
  imageElement.style.maxWidth = "100%";
  document.body.appendChild(imageElement);

  await worker.loadLanguage("eng");
  await worker.initialize("eng");

  const { data: { text } } = await worker.recognize(imageURL);
  console.log("🔍 OCR Result:", text);
  alert("📸 Text detected:\n\n" + text.slice(0, 300));
  await worker.terminate();
}
document.getElementById("photoInput").addEventListener("change", handleImageOCR);
