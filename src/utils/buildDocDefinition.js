// src/utils/buildDocDefinitionMinimal.js

/**
 * Construye un docDefinition básico para pdfMake solo usando el JSON
 * @param {Object} data - Datos del formulario
 * @param {String} lang - Idioma ("es" o "en")
 * @returns {Object} docDefinition compatible con pdfMake
 */
export function buildDocDefinitionMinimal(data, lang = "en") {
  const content = [];

  // Información de orden
  if (data.order_number) {
    content.push({
      text: "WORK ORDER INFORMATION",
      style: "sectionTitle",
      margin: [0, 0, 0, 6],
    });

    content.push({
      table: {
        widths: ["auto", "*"],
        body: [
          ["Work Order:", data.order_number || "N/A"],
          ["Service Description:", data.order_description || "N/A"],
          ["Customer:", data.customer || "N/A"],
          ["Branch:", data.branch || "N/A"],
          ["Location:", data.location || "N/A"],
          ["Lead Technician:", data.leadTechnician || "N/A"],
        ],
      },
      layout: "lightHorizontalLines",
      margin: [0, 0, 0, 18],
    });
  }

  // Secciones dinámicas
  const sortedSections = (data.sections || []).sort((a, b) => a.order - b.order);

  for (const section of sortedSections) {
    const title = section.sectionTitle?.[lang] || section.sectionTitle?.en || "";
    content.push({
      text: title,
      style: "sectionTitle",
      margin: [0, 8, 0, 4],
    });

    const columns = section.columns.sort((a, b) => a.order - b.order);

    for (const col of columns) {
      content.push({
        text: col.columnTitle?.[lang] || col.columnTitle?.en || "",
        style: "itemLabel",
        margin: [0, 4, 0, 2],
      });

      for (const item of col.items || []) {
        const label = item.itemLabel?.[lang] || item.itemLabel?.en || item.itemId;
        switch (item.type) {
          case "text":
          case "number":
          case "datetime":
          case "textarea":
            content.push({
              text: `${label}: ${item.inputItem || ""}`,
              style: "itemText",
              margin: [0, 2],
            });
            break;
          case "checkbox":
            content.push({
              text: `${item.inputItem ? "[X]" : "[  ]"} ${label}`,
              style: "itemText",
              margin: [0, 2],
            });
            break;
          case "location":
          case "signature":
          case "photo":
          case "drawing":
            content.push({
              text: `${label} [IMAGE PLACEHOLDER]`,
              style: "itemLabel",
              margin: [0, 2],
            });
            break;
          default:
            content.push({
              text: label,
              style: "itemText",
              margin: [0, 2],
            });
        }
      }
    }
  }

  const docDefinition = {
    pageSize: "LETTER",
    pageMargins: [20, 60, 20, 40],
    content,
    styles: {
      sectionTitle: { fontSize: 12, bold: true, decoration: "underline" },
      itemText: { fontSize: 10 },
      itemLabel: { fontSize: 10, bold: true, color: "#444" },
    },
  };

  return docDefinition;
}
