#!/usr/bin/env node
// ランダム相場が変わっていないかを確かめる（画面なしで script.js を動かし、値動きの「指紋」を比べる）
//
//   node tools/check_random.js                     # 今の script.js の指紋を表示
//   node tools/check_random.js 変更前.js script.js  # 2つの script.js を比べる（同じなら OK）
//
// 変更前のファイルは `git show HEAD:script.js > /tmp/before.js` などで用意する。
// シナリオ×難易度×シードの組み合わせごとに、全銘柄の日足・指数・ニュースを並べてハッシュにする。

const fs = require('fs');
const vm = require('vm');
const crypto = require('crypto');
const path = require('path');

const CASES = [
  ['month', 'easy', 1], ['month', 'normal', 12345], ['storm', 'normal', 777],
  ['year', 'hard', 2024], ['free', 'normal', 99],
];
const DAYS = 60;

// 何を聞かれても「それらしい空の値」を返す偽物の DOM
const NUM = new Set(['length', 'clientWidth', 'clientHeight', 'offsetWidth', 'offsetHeight', 'scrollHeight', 'width', 'height', 'top', 'left', 'right', 'bottom', 'x', 'y']);
function dummy() {
  const f = function () { return dummy(); };
  return new Proxy(f, {
    get(t, k) {
      if (k === Symbol.toPrimitive) return hint => (hint === 'number' ? 0 : '');
      if (k === Symbol.iterator) return function* () {};
      if (k === 'then') return undefined;
      if (NUM.has(k)) return 0;   // 大きさは 0 にして、チャートなどの描画を早めに打ち切らせる
      return dummy();
    },
    set() { return true; },
    apply() { return dummy(); },
    construct() { return dummy(); },
  });
}

function load(file) {
  const g = {
    console, Math, JSON, Date, Object, Array, Number, String, Set, Map, Promise, Symbol, Proxy,
    setTimeout: () => 0, clearTimeout: () => {}, requestAnimationFrame: () => 0,
    performance: { now: () => 0 }, innerWidth: 1400, innerHeight: 900, devicePixelRatio: 1,
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    document: dummy(), getComputedStyle: () => dummy(), matchMedia: () => ({ matches: false }),
    Audio: function () { return dummy(); }, ResizeObserver: function () { return dummy(); },
    addEventListener() {}, scrollTo() {}, navigator: dummy(), fetch: () => new Promise(() => {}),
  };
  g.window = g;
  vm.createContext(g);
  // データファイル（あれば）も読み込む。ランダム相場の比較には使わない
  for (const name of ['corona2020.js', 'news2020.js']) {
    const data = path.join(path.dirname(file), 'data', name);
    if (fs.existsSync(data)) vm.runInContext(fs.readFileSync(data, 'utf8'), g);
  }
  vm.runInContext(fs.readFileSync(file, 'utf8'), g, { filename: file });
  return g.window.__kabutore;
}

function fingerprint(file) {
  const K = load(file), out = {};
  for (const [scen, diff, seed] of CASES) {
    K.newGame(scen, diff, seed);
    for (let d = 0; d < DAYS && !K.G.ended; d++) { K.runDay(); K.closeModal(); if (!K.G.ended) K.nextDay(); }
    const G = K.G;
    const body = JSON.stringify({
      stocks: G.stocks.map(s => [s.code, s.daily.map(x => [x.d, x.o, x.h, x.l, x.c, x.v])]),
      idx: G.market.idxDaily.map(x => [x.d, x.c]),
      news: G.news.map(n => [n.day, n.time, n.text]),
    });
    out[`${scen}/${diff}/${seed}`] = crypto.createHash('sha256').update(body).digest('hex').slice(0, 16);
  }
  return out;
}

module.exports = { load };
if (require.main === module) main();

function main() {
  const files = process.argv.slice(2);
  if (!files.length) files.push(path.join(__dirname, '..', 'script.js'));
  const prints = files.map(f => fingerprint(path.resolve(f)));
  let same = true;
  for (const k of Object.keys(prints[0])) {
    const v = prints.map(p => p[k]), ok = v.every(x => x === v[0]);
    if (!ok) same = false;
    console.log(`${files.length > 1 ? (ok ? '[OK  ] ' : '[ズレ] ') : ''}${k.padEnd(20)} ${v.join('  ')}`);
  }
  if (files.length > 1) { console.log(same ? '\nランダム相場は変更前と完全に同じです。' : '\nランダム相場が変更前と違います。'); process.exit(same ? 0 : 1); }
}
