// src/utils/filterUtils.js
import { TIME_ID_TO_BUCKET } from './globalConfig';

/**
 * Filtra un array de datos basado en los filtros proporcionados.
 * Esta versión actualizada permite que los filtros de 'level' y 'time' sean opcionales
 * y maneja de forma segura los datos que no tienen la propiedad 'tags'.
 * @param {Array} data - El array de datos normalizados para filtrar.
 * @param {Object} filters - El objeto de filtros con level, time, platforms y tags.
 * @returns {Array} - Un nuevo array con los datos filtrados.
 */
export const filterData = (data, filters) => {
  if (!data || !filters) return [];

  // --- PREPARACIÓN DE FILTROS ---
  // Si 'filters.level' es 0 o no está definido, 'levelFilter' será 0 (lo usaremos para "Todos").
  const levelFilter = Number(filters.level) || 0;
  
  // Si 'filters.time' es 0 o no está definido, 'timeIdFilter' será 0 (para "Todos").
  const timeIdFilter = Number(filters.time) || 0;
  
  // Solo obtenemos un valor para 'timeBucketFilter' si se ha seleccionado un tiempo específico.
  const timeBucketFilter = timeIdFilter ? TIME_ID_TO_BUCKET[timeIdFilter] : null;

  const platformFilter = new Set((filters.platforms || []).map(Number).filter(Number.isFinite));
  const tagFilter = new Set(filters.tags || []);

  // --- LÓGICA DE FILTRADO ---
  return data.filter(item => {
    // CAMBIO 1: El filtro de 'awareness' ahora es opcional.
    // La condición se cumple si no hay filtro (!levelFilter) O si el nivel coincide.
    const levelMatch = !levelFilter || item.awareness === levelFilter;

    // CAMBIO 2: El filtro de 'timeBucket' ahora es opcional.
    // La condición se cumple si no hay filtro (!timeBucketFilter) O si el periodo coincide.
    const timeMatch = !timeBucketFilter || item.timeBucket === timeBucketFilter;

    // La lógica para plataformas se mantiene igual.
    const platformMatch = platformFilter.size === 0 || platformFilter.has(item.platformId);
    
    // CAMBIO 3: Se comprueba si 'item.tags' es un array antes de intentar recorrerlo.
    // Esto evita errores y filtra correctamente los items sin tags si hay un filtro de tags activo.
    const tagMatch = tagFilter.size === 0 || (Array.isArray(item.tags) && item.tags.some(t => tagFilter.has(t)));

    // Un item se mostrará solo si cumple TODAS las condiciones activas.
    return levelMatch && timeMatch && platformMatch && tagMatch;
  });
};