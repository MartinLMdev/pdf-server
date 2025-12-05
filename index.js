// index.js
import express from "express";
import PdfPrinter from "pdfmake";
import path from "path";
import cors from "cors";
import { buildDocDefinition } from "./src/utils/buildDocDefinition.js";

const app = express();
app.use(
  cors({
    origin: [
      "https://dohoodz.pages.dev",
      "http://localhost:5173",
      "http://localhost:5174",
    ],
  })
);
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

async function generatePdfBuffer(form, regulations, lang, field, options) {
  const docDefinition = await buildDocDefinition(
    form,
    regulations,
    lang,
    field,
    options
  );

  return new Promise((resolve, reject) => {
    const pdf = pdfMake.createPdf(docDefinition);

    pdf.getBuffer((buffer) => {
      if (!buffer) return reject("Error generating PDF buffer");
      resolve(buffer);
    });
  });
}

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
    const docDefinition = await buildDocDefinition(
      sections,
      "en",
      "inputItem",
      options
    );

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

app.post("/generate-pdf-blob", async (req, res) => {
  try {
    const { form, regulations, lang, field, options } = req.body;

    const buffer = await generatePdfBuffer(
      form,
      regulations,
      lang,
      field,
      options
    );

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=report.pdf",
    });

    return res.send(buffer);
  } catch (error) {
    console.error("Error in /generate-pdf-blob:", error);
    res.status(500).json({ error: "Error generating PDF Blob" });
  }
});

app.post("/generate-pdf-base64", async (req, res) => {
  try {
    const { form, regulations, lang, field, options } = req.body;

    const buffer = await generatePdfBuffer(
      form,
      regulations,
      lang,
      field,
      options
    );

    const base64 = buffer.toString("base64");

    return res.json({
      fileName: "report.pdf",
      mimeType: "application/pdf",
      base64,
    });
  } catch (error) {
    console.error("Error in /generate-pdf-base64:", error);
    res.status(500).json({ error: "Error generating PDF Base64" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
