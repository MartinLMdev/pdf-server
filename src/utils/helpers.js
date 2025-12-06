// src/utils/helpers.js

/**
 * Crea la sección de información de la orden de trabajo para pdfMake
 * @param {Object} orderData - Datos de la orden (sections)
 * @param {Object} options - Datos adicionales como customer o leadTechnician
 * @param {String} lang - Idioma "es" o "en"
 * @returns {Object} Sección compatible con buildDocDefinition
 */

//  Genera IDs únicos seguros para pdfMake
function uid(prefix = "id") {
  return prefix + Math.floor(Date.now() * Math.random());
}

// Create text items with the exact structure required
function buildTextItem(labelEn, labelEs, value) {
  return {
    type: "text",
    order: Date.now() + Math.floor(Math.random() * 1000),
    itemId: uid("item"),
    object: false,
    disabled: true,
    required: true,
    extraData: {},
    inputItem: value || "N/A",
    itemLabel: { en: labelEn, es: labelEs },
    inputItems: null,
    regulation: false,
    idRegulation: "",
    inputSamplePhoto: "",
    bindingSourceItemId: null,
    bindingTargetItemsIds: null,
    bindingTargetSectionId: null,
  };
}

//  Create the Work Order Information section with the EXACT structure of the JSON
export function createWorkOrderSection(orderData, lang = "en") {
  const sectionId = uid("sec");
  const columnId = uid("col");

  const parseDateOrFallback = (dateValue, fallbackEn, fallbackEs) => {
    const d = new Date(dateValue);
    if (dateValue && !isNaN(d)) {
      return d.toLocaleDateString(lang === "es" ? "es-MX" : "en-US");
    } else {
      return lang === "es" ? fallbackEs : fallbackEn;
    }
  };

  // Ejemplo de uso:
  const startDate = parseDateOrFallback(
    orderData.start_date,
    "Pending",
    "Pendiente"
  );
  const endDate = parseDateOrFallback(
    orderData.end_date,
    "In Progress",
    "En Progreso"
  );

  return {
    order: 0,
    columns: [
      {
        items: [
          buildTextItem(
            "Work Order",
            "Orden de Trabajo",
            orderData.order_number
          ),
          buildTextItem(
            "Service Description",
            "Descripción del Servicio",
            orderData.order_description
          ),
          buildTextItem("Customer", "Cliente", orderData.customer),
          buildTextItem("Branch", "Sucursal", orderData.branch),
          buildTextItem("Location", "Ubicación", orderData.location),
          buildTextItem(
            "Lead Technician",
            "Técnico Líder",
            orderData.leadTechnician
          ),
          buildTextItem("Start Date", "Fecha Inicio", startDate),
          buildTextItem("End Date", "Fecha Fin", endDate),
        ],
        order: 1,
        columnId,
        columnTitle: {
          en: "Work Order Information",
          es: "Información del Servicio",
        },
      },
    ],
    sectionId,
    showSection: true,
    sectionTitle: {
      en: "WORK ORDER INFORMATION",
      es: "INFORMACIÓN DE LA ORDEN DE TRABAJO",
    },
  };
}
