// src/utils/helpers/pdfImages.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import sharp from "sharp";

// In-memory cache to avoid downloading repeated images
const imageCache = new Map();

// Resize images so that pdfMake doesn't run out of memory.
// Recommended max size for photos: 900px
async function processBuffer(buffer, type) {
  try {
    const maxSize = {
      photo: 900,
      drawing: 800,
      signature: 600,
      location: 700,
    };

    const size = maxSize[type] || 900;

    return await sharp(buffer)
      .resize({ width: size, height: size, fit: "inside" })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch (err) {
    console.error("Error procesando imagen con sharp:", err);
    return buffer; // fallback
  }
}

// Returns optimized Base64 from a URL or placeholder
export async function getImageBase64(url, type) {
  try {
    // 1. Cache
    if (imageCache.has(url)) return imageCache.get(url);

    let buffer = null;

    // 2. Try fetching from URL
    if (url) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          // buffer = await res.buffer();
          buffer = await res.arrayBuffer();
        } else {
          console.error(`Fetch error ${res.status} -> ${url}`);
        }
      } catch (err) {
        console.error("Fetch exception:", err);
      }
    }

    // 3. If no buffer, use placeholder
    if (!buffer) {
      const placeholderMap = {
        photo: "./assets/kitchen01.jpg",
        signature: "./assets/signature.jpg",
        drawing: "./assets/draw01.jpg",
        location: "./assets/location.jpg",
      };

      const p = path.resolve(placeholderMap[type] || "");

      if (fs.existsSync(p)) buffer = fs.readFileSync(p);
      else {
        console.error("Placeholder not found:", p);
        return null;
      }
    }

    // 4. Resize → critical for 10–20 images
    buffer = await processBuffer(buffer, type);

    // 5. Convert to base64
    const base64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;

    // 6. Save in cache
    imageCache.set(url, base64);

    return base64;
  } catch (err) {
    console.error("getImageBase64 fatal error:", err);
    return null;
  }
}
