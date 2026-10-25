#!/usr/bin/env node
// リアル相場（data/corona2020.js）の2020年の値動きが変わっていないかを確かめる
//
//   node tools/check_real.js                     # 今の script.js の指紋を表示
//   node tools/check_real.js 変更前.js script.js  # 2つの script.js を比べる（日ごとに同じか）
//
// 変更前のファイルは script.js と同じフォルダ（data/ が隣にある場所）に置くか、
// 隣に data/ へのリンクを作っておく（data/ がないとリアル相場を始められない）。
// シードごとに全営業日を回し、その日の分足・日足・指数・ニュースを1日ずつハッシュにする。
// 2020年より前の過去チャート（di < 0）は比べない。

const crypto = require('crypto');
const path = require('path');
const { load } = require('./check_random');

const SEEDS = [42, 7];
const hash = x => crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 12);

function run(file) {
  const K = load(file), out = {};
  for (const seed of SEEDS) {
    K.newGame('real', 'normal', seed, 0, 'real');
    if (K.G.mode !== 'real') throw new Error(file + ': リアル相場を始められません（data/corona2020.js がない？）');
    const days = [];
    while (!K.G.ended) {
      K.runDay();
      const G = K.G, di = G.dayIndex, mk = G.market;
      const day = {
        date: G.date,
        stocks: G.stocks.map(s => [s.code, s.daily.filter(x => x.di === di).map(x => [x.o, x.h, x.l, x.c, x.v]), s.intraday.map(x => [x.o, x.h, x.l, x.c, x.v])]),
        idx: mk.idxDaily.filter(x => x.d === G.date).map(x => [x.o, x.h, x.l, x.c]),
        news: G.news.filter(n => n.day === di).map(n => [n.time, n.text]),
      };
      days.push({ date: G.date, h: hash(day), day });
      K.closeModal();
      if (!K.G.ended) K.nextDay();
    }
    out[seed] = days;
  }
  return out;
}

if (require.main === module) main();

function main() {
  const files = process.argv.slice(2);
  if (!files.length) files.push(path.join(__dirname, '..', 'script.js'));
  const runs = files.map(f => run(path.resolve(f)));
  if (runs.length === 1) {
    for (const seed of SEEDS) console.log(`seed ${seed}: ${runs[0][seed].length}日  全体 ${hash(runs[0][seed].map(d => d.h))}`);
    return;
  }
  const [a, b] = runs; let same = true;
  for (const seed of SEEDS) {
    const A = a[seed], B = b[seed];
    const diff = [];
    for (let i = 0; i < Math.max(A.length, B.length); i++) if (A[i]?.h !== B[i]?.h || A[i]?.date !== B[i]?.date) diff.push(i);
    const rest = diff.filter(i => i > 0);
    if (rest.length || A.length !== B.length) same = false;
    console.log(`[${rest.length || A.length !== B.length ? 'ズレ' : 'OK  '}] seed ${seed}: ${A.length}日 / ${B.length}日  2日目以降のズレ ${rest.length}日${rest.length ? '（' + rest.slice(0, 5).map(i => A[i]?.date).join(', ') + ' …）' : ''}`);
    console.log(`       初日 ${A[0].date}: ${diff.includes(0) ? '変わった' : '同じ'}`);
    if (diff.includes(0)) {
      const d0a = A[0].day, d0b = B[0].day;
      const n = d0a.stocks.filter((s, k) => JSON.stringify(s[1]) !== JSON.stringify(d0b.stocks[k][1])).length;
      const nc = d0a.stocks.filter((s, k) => s[1][0]?.[3] !== d0b.stocks[k][1][0]?.[3]).length;
      const nn = JSON.stringify(d0a.news) === JSON.stringify(d0b.news);
      console.log(`       日足（始値・高値・安値・終値・出来高）が変わった銘柄 ${n} / 終値が変わった銘柄 ${nc} / ニュース ${nn ? '同じ' : '変わった'}`);
      console.log(`       指数 始値・高値・安値・終値: ${d0a.idx[0].map(v => v.toFixed(2)).join(' / ')}  →  ${d0b.idx[0].map(v => v.toFixed(2)).join(' / ')}`);
      for (const k of [0, 13]) {
        const [code, da] = d0a.stocks[k], db = d0b.stocks[k][1];
        console.log(`       ${code} 始値・高値・安値・終値・出来高: ${da[0].join(' / ')}  →  ${db[0].join(' / ')}`);
      }
    }
  }
  console.log(same ? '\nリアル相場の2日目以降は変更前と完全に同じです。' : '\nリアル相場の2日目以降が変更前と違います。');
  process.exit(same ? 0 : 1);
}
