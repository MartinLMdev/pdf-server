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
    // Normalize URL
    const safeUrl = typeof url === "string" ? url.trim() : "";
    const cacheKey = `${type}::${safeUrl || "no-url"}`;

    // 1. Cache
    if (imageCache.has(cacheKey)) return imageCache.get(cacheKey);

    let buffer = null;

    // 2. Try fetching from URL
    if (safeUrl) {
      try {
        const res = await fetch(safeUrl);
        if (res.ok) {
          // buffer = await res.buffer();
          buffer = await res.arrayBuffer();
        } else {
          console.error(`Fetch error ${res.status} -> ${safeUrl}`);
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

      const placeholderPath = placeholderMap[type];

      if (!placeholderPath) {
        console.error("No placeholder for type:", type);
        return null;
      }

      const absolutePath = path.resolve(placeholderPath);

      if (fs.existsSync(absolutePath)) {
        buffer = fs.readFileSync(absolutePath);
      } else {
        console.error("Placeholder not found:", absolutePath);
        return null;
      }
    }

    // 4. Resize → critical for 10–20 images
    buffer = await processBuffer(buffer, type);

    // 5. Convert to base64
    // const base64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;
    const base64 = `data:image/jpeg;base64,${Buffer.from(buffer).toString(
      "base64"
    )}`;

    // 6. Save in cache
    imageCache.set(cacheKey, base64);

    return base64;
  } catch (err) {
    console.error("getImageBase64 fatal error:", err);
    return null;
  }
}
