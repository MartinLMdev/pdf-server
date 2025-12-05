// index.js
import express from "express";
import PdfPrinter from "pdfmake";
import path from "path";
import { buildDocDefinition } from "./src/utils/buildDocDefinition.js"; // <- builder asincrónico
import { link } from "fs";

const app = express();
app.use(express.json({ limit: "50mb" }));

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
  res.send("PDF Server is running!");
});

app.post("/generate-pdf", async (req, res) => {
  try {
    const sections = req.body; // asumimos que envías el array de sections directamente
    // console.log("Received sections JSON:", JSON.stringify(sections, null, 2));
    const options = {
      mode: "open",
      autoDownload: true,
      headerLogo: "/logo-hoodz.png",
      footerText: [
        "4831 West Ave. #206 San Antonio, TX 78213\n",
        "P: 210.265.1086   F: 210.569.6402\n",
        "hoodz.eastsa@hoodz.us.com | www.hoodzinternational.com\n",
      ],
      showHeaderOnAllPages: true,
      showFooterOnAllPages: true,
      linkImages: false,
    };

    // ⚡ Esperar que buildDocDefinition procese imágenes y genere docDefinition
    const docDefinition = await buildDocDefinition(sections, "en", "inputItem", options);

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
