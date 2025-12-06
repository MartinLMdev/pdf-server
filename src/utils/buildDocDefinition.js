// src/utils/buildDocDefinition.js
import { normalizeSectionImageUrls } from "./normalizeImageUrls.js";
import { createWorkOrderSection } from "./helpers.js";
import { getImageBase64 } from "./pdfImages.js";
import fs from "fs";
import path from "path";

/**
 * Construye docDefinition para pdfMake
 */
export async function buildDocDefinition(
  sections,
  regulations = [],
  lang = "en",
  field = "inputItem",
  options = {}
) {
  const logoPath = path.resolve("./assets/logo-hoodz.png");

  let logoBase64 = null;
  if (fs.existsSync(logoPath)) {
    const buffer = fs.readFileSync(logoPath);
    logoBase64 = `data:image/png;base64,${buffer.toString("base64")}`;
  }

  const width = 200;
  const height = 220;
  const logoWidth = 120;

  const orderData = {
    order_number: "WO-12345",
    customer: "Bubba Gump Shrimp Co.",
    leadTechnician: "John Doe",
    order_description: "Kitchen exhaust cleaning",
    branch: "SAN ANTONIO",
    location: "123 Street",
    start_date: "2025-12-04 23:00",
    end_date: "2025-12-05 02:00",
  };

  const { workOrderSectionData } = options;
  const content = [];
  const allRegulations = [];
  // Create work order section
  const workOrderSection = createWorkOrderSection(workOrderSectionData, "en");

  // Insert it into sections
  sections.unshift(workOrderSection);

  // Normalize image URLs
  const normalizedSections = normalizeSectionImageUrls(sections);
  const visibleSections = (normalizedSections || []).filter(
    (s) => s.showSection
  );
  const sortedSections = visibleSections.sort((a, b) => a.order - b.order);

  for (const [index, section] of sortedSections.entries()) {
    // Reiniciar regulaciones solo como texto, NO se hará push aquí
    // const regulations = [];
    const regulationTexts = [];

    const title =
      section.sectionTitle?.[lang] || section.sectionTitle?.en || "";
    const sectionsNoBreak = [0, 1]; // <--- Sections are joined Control

    content.push({
      text: title,
      style: "sectionTitle",
      ...(index > 0 &&
        !sectionsNoBreak.includes(index) && { pageBreak: "before" }),
    });

    const columns = (section.columns || []).sort((a, b) => a.order - b.order);

    for (let i = 0; i < columns.length; i += 2) {
      const colPair = columns.slice(i, i + 2);
      const tableBody = [];

      tableBody.push(
        colPair.map((col) => ({
          text: col.columnTitle?.[lang] || col.columnTitle?.en || "",
          style: "body",
          margin: [0, 4],
        }))
      );

      const maxItems = Math.max(
        ...colPair.map((col) => (col.items ? col.items.length : 0))
      );

      for (let j = 0; j < maxItems; j++) {
        const row = colPair.map((col) => {
          const item = col.items?.[j];
          if (!item) return "";

          const value = item[field] ?? item.inputItem ?? "";
          const label =
            item.itemLabel?.[lang] || item.itemLabel?.en || item.itemId;

          switch (item.type) {
            case "text":
              return {
                text: `${label}: ${value || ""}`,
                style: "itemText",
                margin: [0, 2],
              };
            case "datetime":
              return {
                text: `${label}: ${
                  value
                    ? new Date(value).toLocaleString(
                        lang === "es" ? "es-MX" : "en-US"
                      )
                    : ""
                }`,
                style: "itemText",
                margin: [0, 2],
              };
            case "number":
              return {
                text: `${label}: ${value ?? item.default ?? 0}`,
                style: "itemText",
                margin: [0, 2],
              };
            case "checkbox": {
              const isChecked = value === true || value === "true";

              // 🔥 NUEVO: acumular regulaciones globales
              if (item.regulation && isChecked) {
                const regItem = (regulations || []).find(
                  (r) => r.id_regulation === item.idRegulation
                );
                allRegulations.push({
                  label,
                  text: `* ${label}\n${regItem?.name || ""}\n${
                    regItem?.description || "\n\n\n"
                  }`,
                });
              }

              return {
                text: `${isChecked ? "[X]" : "[  ]"} ${label}`,
                style: "itemText",
                margin: [0, 2],
              };
            }
            case "signature":
            case "location":
            case "photo":
            case "drawing":
              return {
                text: label,
                style: "itemLabel",
                alignment: "center",
                margin: [0, 0, 0, 2],
              };
            case "textarea":
              return { text: label, style: "itemText", margin: [0, 6] };
            default:
              return { text: label, style: "itemLabel", margin: [0, 2] };
          }
        });

        tableBody.push(row);

        const extraRow = [];

        for (const col of colPair) {
          const item = col.items?.[j];

          if (!item) {
            extraRow.push("");
            continue;
          }

          const imageSrc = (item[field] || item.inputItem || "").trim(); // || item.inputSamplePhoto

          // Use pdfImages.js optimized function
          if (
            ["photo", "signature", "drawing", "location"].includes(item.type)
          ) {
            try {
              const imgBase64 = await getImageBase64(imageSrc, item.type);

              extraRow.push(
                imgBase64
                  ? {
                      image: imgBase64,
                      width,
                      height,
                      alignment: "center",
                      ...(options.linkImages && imageSrc
                        ? { link: imageSrc }
                        : {}),
                    }
                  : ""
              );
            } catch (err) {
              console.error("Error image processing:", imageSrc, err);
              extraRow.push("");
            }
          } else if (item.type === "textarea") {
            extraRow.push({
              text: item[field] || "\n\n\n\n\n\n",
              style: "itemText",
              margin: [2, 2, 2, 2],
            });
          } else {
            extraRow.push("");
          }
        }

        if (extraRow.some((c) => c !== "")) {
          tableBody.push(extraRow);
        }
      }

      content.push({
        table: { widths: colPair.map(() => "*"), body: tableBody },
        layout: {
          fillColor: (row) =>
            row === 0 ? "#4a4a4a" : row % 2 === 0 ? "#f9f9f9" : null,
          hLineWidth: () => 0.8,
          vLineWidth: () => 0.8,
        },
        margin: [0, 4, 0, 12],
      });
    }
  }

  // New: Add Regulations at the end of the Report
  if (allRegulations.length > 0) {
    content.push({
      text: "REGULATIONS / CUMPLIMIENTO NORMATIVO",
      style: "sectionTitle",
      pageBreak: "before",
    });

    for (const reg of allRegulations) {
      content.push({
        text: reg.label,
        style: "itemLabel",
        margin: [0, 2],
      });
      content.push({
        text: reg.text,
        style: "itemText",
        margin: [0, 0, 0, 6],
      });
    }
  }

  // Final DocDefinition
  const docDefinition = {
    pageSize: "LETTER",
    pageMargins: [20, 100, 20, 60],
    content,
    styles: {
      body: {
        bold: true,
        color: "#ffffff",
        alignment: "center",
      },
      sectionTitle: {
        fontSize: 12,
        bold: true,
        margin: [0, 8, 0, 4],
        decoration: "underline",
      },
      itemText: { fontSize: 10 },
      itemLabel: {
        fontSize: 10,
        bold: true,
        color: "#ffffff",
        fillColor: "#999999",
      },
    },
    header: (currentPage) => {
      if (!logoBase64) return null;

      return {
        margin: [40, 20, 40, 20],
        stack: [
          { image: logoBase64, width: logoWidth, alignment: "center" },
          {
            text: "Test Form 2025.11.24",
            alignment: "center",
            style: "header",
          },
        ],
      };
    },
    footer: (currentPage, pageCount) => ({
      margin: [40, 10, 40, 0],
      fontSize: 8,
      alignment: "center",
      text: `Page ${currentPage} of ${pageCount}`,
    }),
  };

  return docDefinition;
}
