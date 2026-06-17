/**
 * Compress / convert an image file to WebP using the browser canvas API.
 *
 * @param {File} file          – The original File from <input type="file">
 * @param {Object} [opts]
 * @param {number} [opts.maxWidth=1024]
 * @param {number} [opts.maxHeight=1024]
 * @param {number} [opts.quality=0.85]    – Initial quality (0–1)
 * @param {number} [opts.maxBytes=3145728] – Max output size in bytes (default 3 MB)
 * @returns {Promise<Blob>}  WebP blob
 */
export async function compressToWebp(file, opts = {}) {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality: initialQuality = 0.85,
    maxBytes = 3 * 1024 * 1024,
  } = opts;

  // Load image into an <img> element
  const img = await loadImage(file);

  // Calculate scaled dimensions (maintain aspect ratio)
  let { width, height } = img;
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  // Draw onto an off-screen canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);

  // Try decreasing quality until under maxBytes
  let quality = initialQuality;
  let blob = await canvasToBlob(canvas, "image/webp", quality);

  while (blob.size > maxBytes && quality > 0.3) {
    quality -= 0.1;
    blob = await canvasToBlob(canvas, "image/webp", quality);
  }

  return blob;
}

/** Load a File/Blob into an HTMLImageElement */
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

/** Promisified canvas.toBlob */
function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
      type,
      quality,
    );
  });
}
