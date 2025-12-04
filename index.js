// src/index.js
import express from "express";
import fs from "fs";
import PdfPrinter from "pdfmake";
import fetch from "node-fetch";
import path from "path";

const app = express();
app.use(express.json({ limit: "50mb" })); // soporta JSON grande

// ⚡ Rutas de fuentes
const fontsPath = path.resolve("./fonts");

const fonts = {
  Roboto: {
    normal: path.join(fontsPath, "Roboto-Regular.ttf"),
    bold: path.join(fontsPath, "Roboto-Medium.ttf"),
    italics: path.join(fontsPath, "Roboto-Italic.ttf"),
    bolditalics: path.join(fontsPath, "Roboto-MediumItalic.ttf"),
  },
};

const printer = new PdfPrinter(fonts);

app.get("/", (req, res) => {
  res.send("PDF Server on Render is running!");
});

app.post("/generate-pdf", async (req, res) => {
  try {
    const { sections } = req.body;

    // Convertir URLs de fotos a base64
    for (const section of sections) {
      for (const col of section.columns || []) {
        for (const item of col.items || []) {
          if (item.type === "photo" && item.url) {
            const response = await fetch(item.url);
            const buffer = await response.arrayBuffer();
            const base64 = Buffer.from(buffer).toString("base64");
            const ext = item.url.endsWith(".png") ? "png" : "jpeg";
            item.base64 = `data:image/${ext};base64,${base64}`;
          }
        }
      }
    }

    // Construir docDefinition para pdfMake
    const docDefinition = {
      content: sections.map((section) => {
        const content = [];

        if (section.sectionTitle) {
          content.push({ text: section.sectionTitle, style: "header" });
        }

        for (const col of section.columns || []) {
          for (const item of col.items || []) {
            if (item.type === "text") {
              content.push({ text: item.inputItem || "", margin: [0, 4] });
            } else if (item.type === "photo" && item.base64) {
              content.push({
                image: item.base64,
                width: 250,
                margin: [0, 4],
              });
            }
          }
        }

        return content;
      }).flat(),
      styles: {
        header: { fontSize: 16, bold: true, margin: [0, 10, 0, 10] },
      },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks = [];
    pdfDoc.on("data", (chunk) => chunks.push(chunk));
    pdfDoc.on("end", () => {
      const result = Buffer.concat(chunks);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="report.pdf"'
      );
      res.send(result);
    });
    pdfDoc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
