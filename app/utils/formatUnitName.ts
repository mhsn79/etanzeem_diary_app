/**
 * Formats a unit name with description if available
 * @param unit - The unit object containing Name/name and Description/description properties
 * @returns Formatted unit name string
 */
export const formatUnitName = (unit: any): string => {
  if (!unit) return '';
  
  const name = unit.Name || unit.name || '';
  const description = unit.Description || unit.description || '';
  
  // If description exists and is different from name, append it
  if (description && description !== name) {
    return `${name} (${description})`;
  }
  
  return name;
}; 