// src/index.js
import express from "express";
import PdfPrinter from "pdfmake";
import path from "path";
import { buildDocDefinitionMinimal } from "./src/utils/buildDocDefinitionMinimal.js";

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
    const data = req.body; // tu JSON
    console.log("Received data JSON for PDF generation:", JSON.stringify(req.body, null, 2));
    // const orderData = { ...defaults, ...data }; // combinar con defaults

    // Usar builder para generar docDefinition
    const docDefinition = buildDocDefinitionMinimal(orderData, "es");

    // Crear PDF
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
