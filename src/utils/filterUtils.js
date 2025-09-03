// src/utils/filterUtils.js
import { TIME_ID_TO_BUCKET } from './globalConfig';

/**
 * Filtra un array de datos basado en los filtros proporcionados.
 * @param {Array} data - El array de datos normalizados para filtrar.
 * @param {Object} filters - El objeto de filtros con level, time, platforms y tags.
 * @returns {Array} - Un nuevo array con los datos filtrados.
 */
export const filterData = (data, filters) => {
  if (!data || !filters) return [];

  const lv = Number(filters.level) || 1;
  const tb = TIME_ID_TO_BUCKET[Number(filters.time) || 1] ?? '4w';
  const plats = new Set((filters.platforms || []).map(Number).filter(Number.isFinite));
  const tagSet = new Set(filters.tags || []);

  return data.filter(it =>
    it.awareness === lv &&
    it.timeBucket === tb &&
    (plats.size === 0 || plats.has(it.platformId)) &&
    (tagSet.size === 0 || it.tags.some(t => tagSet.has(t)))
  );
};