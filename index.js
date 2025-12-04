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

const defaults = {
  order_number: "WO-0000",
  order_description: "No description",
  customer: "N/A",
  branch: "N/A",
  location: "N/A",
  leadTechnician: "N/A"
};

app.get("/", (req, res) => {
  res.send("PDF Server on Render is running!");
});

app.post("/generate-pdf", async (req, res) => {
  try {
    const data = req.body; // aquí está tu JSON
    const orderData = { ...defaults, ...data }; // combinar con defaults

    const { sections } = orderData;

    // Convertir URLs de fotos a base64
    for (const section of sections || []) {
      for (const col of section.columns || []) {
        for (const item of col.items || []) {
          if (
            ["photo", "location", "signature", "drawing"].includes(item.type) &&
            item.inputItem
          ) {
            const response = await fetch(item.inputItem);
            const buffer = await response.arrayBuffer();
            const ext = item.inputItem.endsWith(".png") ? "png" : "jpeg";
            item.base64 = `data:image/${ext};base64,${Buffer.from(buffer).toString(
              "base64"
            )}`;
          }
        }
      }
    }

    // Construir docDefinition para pdfMake
    const docDefinition = {
      content: (sections || []).map((section) => {
        const content = [];

        if (section.sectionTitle) {
          content.push({ text: section.sectionTitle.es || section.sectionTitle.en, style: "header" });
        }

        for (const col of section.columns || []) {
          for (const item of col.items || []) {
            const label = item.itemLabel?.es || item.itemLabel?.en || "";
            switch (item.type) {
              case "text":
              case "textarea":
                content.push({ text: `${label}: ${item.inputItem || ""}`, margin: [0, 4] });
                break;
              case "photo":
              case "location":
              case "signature":
              case "drawing":
                if (item.base64) {
                  content.push({ image: item.base64, width: 250, margin: [0, 4] });
                }
                break;
              case "checkbox":
                content.push({ text: `${item.inputItem ? "[X]" : "[ ]"} ${label}`, margin: [0, 2] });
                break;
              default:
                content.push({ text: label, margin: [0, 2] });
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
      res.setHeader("Content-Disposition", 'attachment; filename="report.pdf"');
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
