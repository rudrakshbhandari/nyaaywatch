// One-shot build: projects India state boundaries into SVG path strings
// committed at src/api/home/india-geography.ts.
//
// Source: adarshbiradar/maps-geojson (india.json), which uses India's OFFICIAL
// territorial boundary — Jammu & Kashmir includes Pakistan-occupied Kashmir
// (Muzaffarabad, Mirpur) and Ladakh includes Gilgit-Baltistan and Aksai Chin.
// This is the only correct boundary for an Indian product.
//
// To regenerate:
//
//   curl -sL -o /tmp/india-official.json \
//     https://raw.githubusercontent.com/adarshbiradar/maps-geojson/master/india.json
//   INPUT=/tmp/india-official.json node scripts/build-india-map.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const INPUT = process.env.INPUT ?? '/tmp/india-official.json';
const OUTPUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src/api/home/india-geography.ts',
);

// Map source `st_nm` → our SupportedStateCode (plus UT placeholders we draw
// for shape completeness). J&K and Ladakh are separate features post-2019,
// and both contain India-claimed territory currently administered by Pakistan
// (PoK, Gilgit-Baltistan) or China (Aksai Chin).
const NAME_TO_CODE = {
  'Andhra Pradesh': 'AP',
  'Arunachal Pradesh': 'AR',
  'Assam': 'AS',
  'Bihar': 'BR',
  'Chhattisgarh': 'CG',
  'Goa': 'GA',
  'Gujarat': 'GJ',
  'Haryana': 'HR',
  'Himachal Pradesh': 'HP',
  'Jammu and Kashmir': 'JK',
  'Jharkhand': 'JH',
  'Karnataka': 'KA',
  'Kerala': 'KL',
  'Ladakh': 'LA',
  'Madhya Pradesh': 'MP',
  'Maharashtra': 'MH',
  'Manipur': 'MN',
  'Meghalaya': 'ML',
  'Mizoram': 'MZ',
  'Nagaland': 'NL',
  'Odisha': 'OD',
  'Punjab': 'PB',
  'Rajasthan': 'RJ',
  'Sikkim': 'SK',
  'Tamil Nadu': 'TN',
  'Telangana': 'TS',
  'Tripura': 'TR',
  'Uttar Pradesh': 'UP',
  'Uttarakhand': 'UK',
  'West Bengal': 'WB',
  // UTs drawn for shape completeness (not interactive):
  'Delhi': 'DL_UT',
  'Chandigarh': 'CH_UT',
  'Puducherry': 'PY_UT',
  'Dadra and Nagar Haveli': 'DN_UT',
  'Daman and Diu': 'DD_UT',
  'Andaman and Nicobar Islands': 'AN_UT',
  'Lakshadweep': 'LD_UT',
};

const geo = JSON.parse(readFileSync(INPUT, 'utf8'));

// India (full claim) bbox: lon ~68–97.4, lat ~6.7–37.1. Cosine-compensated
// equirectangular projection scaled to fit a 1000×1100 viewBox.
const MID_LAT = 22.5;
const COS_MID = Math.cos(MID_LAT * Math.PI / 180);

const VIEW_W = 1000;
const VIEW_H = 1100;
const MARGIN = 20;

// Compute bounding box from all included features
let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
for (const f of geo.features) {
  if (!NAME_TO_CODE[f.properties.st_nm]) continue;
  const visit = (coords) => {
    if (typeof coords[0] === 'number') {
      const [lon, lat] = coords;
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    } else {
      coords.forEach(visit);
    }
  };
  visit(f.geometry.coordinates);
}

console.log('bbox:', { minLon, maxLon, minLat, maxLat });

const dLon = (maxLon - minLon) * COS_MID;
const dLat = maxLat - minLat;
const scaleX = (VIEW_W - 2 * MARGIN) / dLon;
const scaleY = (VIEW_H - 2 * MARGIN) / dLat;
const SCALE = Math.min(scaleX, scaleY);
const usedW = dLon * SCALE;
const usedH = dLat * SCALE;
const offsetX = (VIEW_W - usedW) / 2;
const offsetY = (VIEW_H - usedH) / 2;

function project(lon, lat) {
  const x = offsetX + (lon - minLon) * COS_MID * SCALE;
  const y = offsetY + (maxLat - lat) * SCALE;
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
}

// Douglas-Peucker simplification (recursive). Tolerance in projected px.
function perpDist(p, a, b) {
  const [px, py] = p, [ax, ay] = a, [bx, by] = b;
  const dx = bx - ax, dy = by - ay;
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
  const t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
  const cx = ax + t * dx, cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}
function simplify(points, tol) {
  if (points.length < 3) return points;
  let maxD = 0, idx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDist(points[i], points[0], points[points.length - 1]);
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD > tol) {
    const left = simplify(points.slice(0, idx + 1), tol);
    const right = simplify(points.slice(idx), tol);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[points.length - 1]];
}

function ringArea(points) {
  let a = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    a += (points[j][0] + points[i][0]) * (points[j][1] - points[i][1]);
  }
  return Math.abs(a / 2);
}

const TOL = 0.8;     // simplification tolerance (projected px)
const MIN_AREA = 6;  // drop rings smaller than this (px²)

function ringToPath(ring) {
  const projected = ring.map(([lon, lat]) => project(lon, lat));
  const simplified = simplify(projected, TOL);
  if (ringArea(simplified) < MIN_AREA) return null;
  let d = `M${simplified[0][0]},${simplified[0][1]}`;
  for (let i = 1; i < simplified.length; i++) {
    d += `L${simplified[i][0]},${simplified[i][1]}`;
  }
  d += 'Z';
  return d;
}

const results = {};
for (const f of geo.features) {
  const code = NAME_TO_CODE[f.properties.st_nm];
  if (!code) continue;
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  const paths = [];
  for (const poly of polys) {
    for (const ring of poly) {
      const p = ringToPath(ring);
      if (p) paths.push(p);
    }
  }
  results[code] = paths.join('');
}

console.log('codes produced:', Object.keys(results).sort().join(', '));
const totalChars = Object.values(results).reduce((s, v) => s + v.length, 0);
console.log('total path chars:', totalChars);

const out = `// AUTO-GENERATED by scripts/build-india-map.mjs — do not edit by hand.
// Source: https://github.com/adarshbiradar/maps-geojson (india.json).
// Uses India's OFFICIAL territorial boundary: Jammu & Kashmir includes PoK
// (Muzaffarabad, Mirpur), Ladakh includes Gilgit-Baltistan and Aksai Chin,
// Arunachal Pradesh is Indian territory.
// Simplified + projected to a ${VIEW_W}×${VIEW_H} viewBox using a cosine-compensated
// equirectangular projection.

export const INDIA_VIEWBOX = { width: ${VIEW_W}, height: ${VIEW_H} } as const;

export const INDIA_STATE_PATHS: Record<string, string> = ${JSON.stringify(results, null, 2)};
`;

writeFileSync(OUTPUT, out);
console.log('wrote', OUTPUT, 'size:', out.length);
