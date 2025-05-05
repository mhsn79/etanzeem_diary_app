/**
 * This file re-exports the normalization functions from apiNormalizers.ts
 * for backward compatibility.
 */
export {
  normalizePersonData,
  normalizePersonDataArray,
  normalizeActivityData,
  normalizeActivityDataArray,
  normalizeActivityTypeData,
  normalizeActivityTypeDataArray,
  normalizeTanzeemiUnitData,
  normalizeTanzeemiUnitDataArray,
  normalizeData,
  normalizeDataArray
} from './apiNormalizers';