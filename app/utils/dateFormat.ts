/**
 * Formats a date object into a string with the specified format
 * @param date The date to format
 * @param formatStr The format string (currently only supports 'yyyy-MM-dd')
 * @returns Formatted date string
 */
export function formatDate(date: Date, formatStr: string = 'yyyy-MM-dd'): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  
  // For now we only support 'yyyy-MM-dd' format
  if (formatStr === 'yyyy-MM-dd') {
    const year = date.getFullYear();
    // Month is 0-indexed, so add 1 and pad with 0 if needed
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
  
  // Return ISO string as fallback for unsupported formats
  return date.toISOString().split('T')[0];
}