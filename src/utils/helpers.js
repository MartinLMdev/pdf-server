// src/utils/helpers.js

/**
 * Crea la sección de información de la orden de trabajo para pdfMake
 * @param {Object} orderData - Datos de la orden (sections)
 * @param {Object} options - Datos adicionales como customer o leadTechnician
 * @param {String} lang - Idioma "es" o "en"
 * @returns {Object} Sección compatible con buildDocDefinition
 */
export function createWorkOrderSection(orderData, options = {}, lang = "en") {
  return {
    showSection: true,
    sectionTitle: {
      en: "WORK ORDER INFORMATION",
      es: "INFORMACIÓN DE LA ORDEN DE TRABAJO",
    },
    columns: [
      {
        columnTitle: { en: "", es: "" },
        items: [
          { type: "text", itemLabel: { en: "Work Order", es: "Orden de Trabajo" }, inputItem: orderData.order_number || "N/A" },
          { type: "text", itemLabel: { en: "Service Description", es: "Descripción del Servicio" }, inputItem: orderData.order_description || "N/A" },
          { type: "text", itemLabel: { en: "Customer", es: "Cliente" }, inputItem: options.customer || "N/A" },
          { type: "text", itemLabel: { en: "Branch", es: "Sucursal" }, inputItem: orderData.branch || "N/A" },
          { type: "text", itemLabel: { en: "Location", es: "Ubicación" }, inputItem: orderData.location || "N/A" },
          { type: "text", itemLabel: { en: "Lead Technician", es: "Técnico Líder" }, inputItem: options.leadTechnician || "N/A" },
          {
            type: "text",
            itemLabel: { en: "Start Date", es: "Fecha Inicio" },
            inputItem: orderData.start_date
              ? new Date(orderData.start_date).toLocaleDateString(lang === "es" ? "es-MX" : "en-US")
              : "N/A",
          },
          {
            type: "text",
            itemLabel: { en: "End Date", es: "Fecha Fin" },
            inputItem: orderData.end_date
              ? new Date(orderData.end_date).toLocaleDateString(lang === "es" ? "es-MX" : "en-US")
              : "N/A",
          },
        ],
      },
    ],
  };
}
