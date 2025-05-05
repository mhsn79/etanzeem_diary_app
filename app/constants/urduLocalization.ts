/**
 * Urdu localization constants
 */

// Urdu months
export const URDU_MONTHS = [
  'جنوری',   // January
  'فروری',   // February
  'مارچ',    // March
  'اپریل',   // April
  'مئی',     // May
  'جون',     // June
  'جولائی',  // July
  'اگست',    // August
  'ستمبر',   // September
  'اکتوبر',  // October
  'نومبر',   // November
  'دسمبر'    // December
];

// Helper function to get Urdu month name (1-based index, January = 1)
export const getUrduMonth = (monthNumber: number): string => {
  // Ensure month number is between 1-12
  if (monthNumber < 1 || monthNumber > 12) {
    console.warn(`Invalid month number: ${monthNumber}. Using default.`);
    return 'نامعلوم ماہ'; // Unknown month
  }
  
  // Convert 1-based month number to 0-based array index
  return URDU_MONTHS[monthNumber - 1];
};

// Urdu weekdays
export const URDU_WEEKDAYS = [
  'اتوار',    // Sunday
  'پیر',      // Monday
  'منگل',     // Tuesday
  'بدھ',      // Wednesday
  'جمعرات',   // Thursday
  'جمعہ',     // Friday
  'ہفتہ'      // Saturday
];

// Helper function to get Urdu weekday name (0-based index, Sunday = 0)
export const getUrduWeekday = (dayNumber: number): string => {
  // Ensure day number is between 0-6
  if (dayNumber < 0 || dayNumber > 6) {
    console.warn(`Invalid day number: ${dayNumber}. Using default.`);
    return 'نامعلوم دن'; // Unknown day
  }
  
  return URDU_WEEKDAYS[dayNumber];
};