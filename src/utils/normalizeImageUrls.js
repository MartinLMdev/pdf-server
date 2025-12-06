// src/utils/normalizeImageUrls.js

export function normalizeSectionImageUrls(sections) {
  if (!Array.isArray(sections)) return [];

  const OLD_BASE =
    "https://tcgmsgnwoxbavyucytdr.supabase.co/functions/v1/r2Proxy/";
  const NEW_BASE = "https://r2-images.martin-lm-dev.workers.dev/images/";

  return sections.map((section) => {
    const updatedColumns = section.columns?.map((col) => {
      const updatedItems = col.items?.map((item) => {
        // Validar inputItem como string
        if (item?.inputItem && typeof item.inputItem === "string") {
          const newInputItem = item.inputItem.startsWith(OLD_BASE)
            ? item.inputItem.replace(OLD_BASE, NEW_BASE)
            : item.inputItem; // si no coincide no lo toca

          return {
            ...item,
            inputItem: newInputItem,
          };
        }
        return item;
      });

      return {
        ...col,
        items: updatedItems,
      };
    });

    return {
      ...section,
      columns: updatedColumns,
    };
  });
}
