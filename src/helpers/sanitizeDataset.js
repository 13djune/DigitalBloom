// helpers/sanitizeDataset.js (crea este archivo)
const TIME_ID_TO_BUCKET = { 1: '4w', 2: '6m', 3: '1y' };
const DEFAULT_PLATFORM_ID_TO_KEY = {
  1:'SPOTIFY',2:'YOUTUBE',3:'TIKTOK',4:'INSTAGRAM',5:'IPHONE',6:'WHATSAPP',7:'STREAMING',8:'GOOGLE'
};

export default function sanitizeDataset(raw = []) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (let i = 0; i < raw.length; i++) {
    const d = raw[i];
    if (!d || typeof d !== 'object') continue;

    // platformId numérico válido
    const pid = Number(d.platformId ?? d.platform_id ?? d.platform);
    if (!Number.isFinite(pid) || !DEFAULT_PLATFORM_ID_TO_KEY[pid]) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[sanitizeDataset] Registro sin platformId válido:', i, d);
      }
      continue;
    }

    // timeBucket normalizado
    let tb = d.timeBucket;
    if (!tb) {
      const t = Number(d.time ?? d.details?.time);
      tb = TIME_ID_TO_BUCKET[t] ?? d.details?.timeBucket ?? d.time_bucket ?? '4w';
    }
    // obligamos formato corto: '4w'|'6m'|'1y'
    if (!['4w','6m','1y'].includes(tb)) {
      if (typeof tb === 'string') {
        const s = tb.toLowerCase();
        if (s.includes('4') && s.includes('w')) tb = '4w';
        else if (s.includes('6') && s.includes('m')) tb = '6m';
        else if (s.includes('y')) tb = '1y';
        else tb = '4w';
      } else tb = '4w';
    }

    out.push({
      ...d,
      id: d.id ?? `${pid}-${d.title ?? d.url ?? i}`,
      platformId: pid,
      timeBucket: tb
    });
  }
  return out;
}
