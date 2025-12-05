// src/utils/helpers/pdfImages.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import sharp from "sharp";

/**
 * Cache en memoria para evitar descargar imágenes repetidas
 */
const imageCache = new Map();

/**
 * Redimensiona imágenes para que pdfMake NO reviente memoria.
 * Máx recomendado para fotos: 900px
 */
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

/**
 * Retorna Base64 optimizado de una URL o placeholder
 */
export async function getImageBase64(url, type) {
  try {
    // 1. CACHE
    if (imageCache.has(url)) return imageCache.get(url);

    let buffer = null;

    // 2. Intentar fetch desde URL
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

    // 3. Si no hay buffer, usar placeholder
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

    // 4. Reducir tamaño → crítico para 10–20 imágenes
    buffer = await processBuffer(buffer, type);

    // 5. Convertir a base64
    const base64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;

    // 6. Guardar en cache
    imageCache.set(url, base64);

    return base64;
  } catch (err) {
    console.error("getImageBase64 fatal error:", err);
    return null;
  }
}
