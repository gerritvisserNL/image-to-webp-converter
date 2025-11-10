const dropzone = document.getElementById("dropzone");
const previewContainer = document.getElementById("preview");
const downloadZipBtn = document.getElementById("downloadZip");
const optimizeCheckbox = document.getElementById("optimize");

const convertedFiles = new Map(); // filename -> Blob

// === Drag & Drop ===
dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("dragover");
});
dropzone.addEventListener("dragleave", () =>
  dropzone.classList.remove("dragover")
);
dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("dragover");
  handleFiles(e.dataTransfer.files);
});

// === Folder select button ===
document.getElementById("selectBtn").addEventListener("click", () => {
  const tmpInput = document.createElement("input");
  tmpInput.type = "file";
  tmpInput.multiple = true;
  tmpInput.webkitdirectory = true;
  tmpInput.onchange = (e) => handleFiles(e.target.files);
  tmpInput.click();
});

// === Handle Files ===
function handleFiles(files) {
  [...files].forEach((file) => {
    if (!file.type.startsWith("image/")) return;

    const supportedFormats = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/bmp",
      "image/avif",
    ];

    if (!supportedFormats.includes(file.type)) return;

    const newFileName = file.name.replace(
      /\.(jpg|jpeg|png|gif|bmp|avif)$/i,
      ".webp"
    );
    if (convertedFiles.has(newFileName)) return;

    convertToWebP(file);
  });
}

// === Convert to WebP ===
function convertToWebP(file) {
  const img = new Image();
  img.src = URL.createObjectURL(file);

  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    const quality = optimizeCheckbox.checked ? 0.8 : 0.95;

    canvas.toBlob(
      (blob) => {
        const oldSize = (file.size / 1024).toFixed(1);
        const newSize = (blob.size / 1024).toFixed(1);
        const newFileName = file.name.replace(
          /\.(jpg|jpeg|png|gif|bmp|avif)$/i,
          ".webp"
        );

        convertedFiles.set(newFileName, blob);
        downloadZipBtn.disabled = false;

        showPreview(blob, newFileName, oldSize, newSize);
      },
      "image/webp",
      quality
    );
  };
}

// === Show Preview ===
function showPreview(blob, filename, oldSize, newSize) {
  const previewItem = document.createElement("div");
  previewItem.className = "preview-item";

  const img = document.createElement("img");
  img.src = URL.createObjectURL(blob);

  // Delete button rechtsboven
  const removeBtn = document.createElement("button");
  removeBtn.textContent = "×";
  removeBtn.className = "remove";
  removeBtn.onclick = () => {
    previewItem.remove();
    convertedFiles.delete(filename);
    if (convertedFiles.size === 0) downloadZipBtn.disabled = true;
  };

  // Filename & size info
  const nameEl = document.createElement("p");
  nameEl.className = "file-name";
  nameEl.textContent = filename;

  const oldSizeEl = document.createElement("p");
  oldSizeEl.className = "size-info";
  oldSizeEl.textContent = `Original: ${oldSize} KB`;

  const newSizeEl = document.createElement("p");
  newSizeEl.className = "size-info";
  newSizeEl.textContent = `Converted: ${newSize} KB`;

  // Download button onder afbeelding
  const actions = document.createElement("div");
  actions.className = "preview-actions";

  const downloadBtn = document.createElement("button");
  downloadBtn.textContent = "Download";
  downloadBtn.className = "download";
  downloadBtn.onclick = () => {
    const link = document.createElement("a");
    link.href = img.src;
    link.download = filename;
    link.click();
  };

  actions.append(downloadBtn);

  previewItem.append(img, removeBtn, nameEl, oldSizeEl, newSizeEl, actions);
  previewContainer.appendChild(previewItem);
}

// === Download All as ZIP ===
downloadZipBtn.addEventListener("click", async () => {
  if (convertedFiles.size === 0) return;

  const zip = new JSZip();
  convertedFiles.forEach((blob, filename) => {
    zip.file(filename, blob);
  });

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(zipBlob);
  link.download = "converted_images.zip";
  link.click();
});
