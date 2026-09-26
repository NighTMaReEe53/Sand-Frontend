/* Generates simple flat line-art Lottie JSON assets (Implamtion_plan.md §5).
   Run: node scripts/generate-lottie.mjs  (from frontend/) */
import { writeFileSync, mkdirSync } from 'node:fs';

mkdirSync('src/assets/lottie', { recursive: true });

const FR = 30;
const DUR = 90; // 3s loop

const base = (w, h, layers) => ({
  v: '5.7.4', fr: FR, ip: 0, op: DUR, w, h, nm: 'asset', ddd: 0,
  assets: [], layers, markers: [],
});

const shapeLayer = (nm, items, extra = {}) => ({
  ddd: 0, ind: 1, ty: 4, nm, sr: 1,
  ks: {
    o: { a: 0, k: 100 }, r: { a: 0, k: 0 },
    p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] },
    ...extra.ks,
  },
  ao: 0, shapes: items, ip: 0, op: DUR, st: 0, bm: 0,
  ...(extra.props || {}),
});

const INK = [0.066, 0.066, 0.066];      // #111111
const MUTED = [0.42, 0.42, 0.42];       // #6b6b6b
const GOLD = [0.831, 0.627, 0.165];     // #d4a02a
const SOFT = [0.969, 0.969, 0.961];     // #f7f7f5

const stroke = (c, w = 2) => ({ ty: 'st', c: { a: 0, k: c }, o: { a: 0, k: 100 }, w: { a: 0, k: w }, lc: 2, lj: 2, nm: 'stroke' });
const fill = (c) => ({ ty: 'fl', c: { a: 0, k: c }, o: { a: 0, k: 100 }, nm: 'fill' });
const rect = (p, s, r = 8) => ({ ty: 'rc', p: { a: 0, k: p }, s: { a: 0, k: s }, r: { a: 0, k: r } });
const ellipse = (p, s) => ({ ty: 'el', p: { a: 0, k: p }, s: { a: 0, k: s } });
const group = (items) => ({ ty: 'gr', it: [...items, { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }], nm: 'group' });
const floatY = (dist = 10) => ({ ks: { p: { a: 1, k: [
  { t: 0, s: [0, 0], to: [0, -dist / 3], ti: [0, dist / 3], i: { x: [0.42], y: [0] }, o: { x: [0.58], y: [1] } },
  { t: DUR / 2, s: [0, -dist], to: [0, dist / 3], ti: [0, -dist / 3], i: { x: [0.42], y: [0] }, o: { x: [0.58], y: [1] } },
  { t: DUR, s: [0, 0] },
] } } });

// ---- hero-student: laptop with floating idea circles --------------------
const heroLayers = [
  shapeLayer('laptop-base', [group([
    rect([0, 60], [220, 14], 7), fill(SOFT), stroke(INK),
  ])], floatY(6)),
  shapeLayer('laptop-screen', [group([
    rect([0, -30], [170, 110], 12), fill([1, 1, 1]), stroke(INK, 2.5),
    rect([0, -30], [140, 80], 6), fill(SOFT),
  ])]),
  shapeLayer('spark-gold', [group([
    ellipse([110, -120], [18, 18]), fill(GOLD),
  ])], floatY(16)),
  shapeLayer('spark-muted', [group([
    ellipse([-115, -90], [12, 12]), stroke(MUTED),
  ])], floatY(20)),
];
writeFileSync('src/assets/lottie/hero-student.json',
  JSON.stringify(base(480, 360, heroLayers)));

// ---- progress-chart: bars growing in loop --------------------------------
const barHeights = [70, 110, 90, 150];
const chartBars = barHeights.map((h, i) =>
  shapeLayer(`bar-${i}`, [group([
    rect([(i - 1.5) * 46, 40], [28, h], 6), fill(i === 3 ? GOLD : SOFT), stroke(INK),
  ])], {
    props: { sy: 1 },
    ks: {
      s: { a: 1, k: Array.from({ length: 3 }, (_, j) => {
        const t = (DUR / 2) * (j / 2);
        const v = j % 2 === 0 ? 100 : 88 + i * 3;
        return { t, s: [100, v], i: { x: [0.42], y: [1] }, o: { x: [0.58], y: [0] } };
      }).concat([{ t: DUR, s: [100, 100] }]) },
    },
  })
);
writeFileSync('src/assets/lottie/progress-chart.json',
  JSON.stringify(base(320, 240, [
    ...chartBars,
    shapeLayer('baseline', [group([rect([0, 95], [200, 2], 1), fill(MUTED)])]),
  ])));

// ---- certificate: badge with rotating dashed ring ------------------------
const certLayers = [
  shapeLayer('ring', [group([
    ellipse([0, 0], [130, 130]), stroke(GOLD, 3),
  ])], { props: { sy: 1 }, ks: { r: { a: 1, k: [
    { t: 0, s: [0] }, { t: DUR, s: [360] },
  ] } } }),
  shapeLayer('badge-body', [group([
    ellipse([0, 0], [96, 96]), fill(SOFT), stroke(INK, 2.5),
  ])]),
  shapeLayer('star', [group([
    { ty: 'sr', sy: 1, pt: { a: 0, k: 5 }, p: { a: 0, k: [0, 0] }, or: { a: 0, k: 38 }, ir: { a: 0, k: 17 }, r: { a: 0, k: 0 } },
    fill(GOLD),
  ])], floatY(8)),
  shapeLayer('ribbons', [group([
    rect([-24, 78], [16, 34], 4), fill(GOLD),
    rect([24, 78], [16, 34], 4), fill(GOLD),
  ]) ], floatY(6)),
];
writeFileSync('src/assets/lottie/certificate.json',
  JSON.stringify(base(280, 280, certLayers)));

console.log('Lottie assets generated.');
