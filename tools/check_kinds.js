#!/usr/bin/env node
// 追加銘柄の「種類ごとの性格」を実測する（画面なしで script.js を動かす）
//
//   node tools/check_kinds.js
//
// 1. 年率ボラ：「1年チャレンジ」（ふつう）を SEEDS_Y 本回して、日次の終値の変化から年率ボラを出す。
//    合格基準：高配当は約15〜25%、景気敏感は約30〜50%、高配当は普通の銘柄の平均より低く、景気敏感は高い
// 2. 嵐の四半期の下げ幅：暴落の日の前日の終値から、暴落後の数日の最安値までの下げ。SEEDS_S 本の平均。
//    合格基準：高配当 < 普通 < 景気敏感（下げの小さい順）
// 3. 低位株（倒産するシードでは、前兆の前日までで測る）：年率ボラ 80〜150%。分足が1円の呼値で横線ばかりにならないか（5分足の完全な横線が5割以下、1日の値幅が平均3呼値以上）

const path = require('path');
const { load } = require('./check_random.js');

const FILE = path.join(__dirname, '..', 'script.js');
const SEEDS_Y = [1, 2, 3], SEEDS_S = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const store = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const start = (scen, seed) => { const K = load(FILE, store()); Object.assign(K.profile(), { xp: 6000, r7: true }); K.newGame(scen, 'normal', seed); return K; };
const finish = (K, hook) => { while (!K.G.ended) { K.runDay(); if (hook) hook(K); K.closeModal(); if (!K.G.ended) K.nextDay(); } };
const KN = { div: '高配当', cyc: '景気敏感', perk: '優待', normal: '普通', growth: '新興', penny: '低位', ipo: '新規' };   // 新規上場は、上場日からの日足で測る（参考）
// 呼値（script.js の TICKS と同じ。低位株は1円）
const tickOf = (s, p) => (s.tick1 ? 1 : p <= 1000 ? 0.1 : p <= 3000 ? 0.5 : p <= 10000 ? 1 : p <= 30000 ? 5 : p <= 100000 ? 10 : 50);
const BARS = ['X717', 'X718', 'K605', 'K603', 'K201', 'K401'];   // 横線を測る銘柄（低位株と、値段の低い既存銘柄・普通の銘柄）
const bars = {};   // code → { m1: [横線, 本数], m5: [横線, 本数], doji5: 始値＝終値の5分足, range: [呼値の数の合計, 日数] }
function barStats(K) {
  for (const s of K.G.stocks.concat(K.G.extra)) {
    if (!BARS.includes(s.code) || K.G.dayIndex >= (s.dl?.F ?? Infinity)) continue;   // 倒産の前兆からあとは測らない
    const b = (bars[s.code] ||= { m1: [0, 0], m5: [0, 0], doji5: 0, range: [0, 0] }), I = s.intraday;
    for (const x of I) { b.m1[1]++; if (x.o === x.h && x.h === x.l && x.l === x.c) b.m1[0]++; }
    for (let i = 0; i < I.length; i += 5) {
      const g = I.slice(i, i + 5), o = g[0].o, c = g.at(-1).c, h = Math.max(...g.map(x => x.h)), l = Math.min(...g.map(x => x.l));
      b.m5[1]++; if (o === h && h === l && l === c) b.m5[0]++; if (o === c) b.doji5++;
    }
    b.range[0] += (s.high - s.low) / tickOf(s, s.price); b.range[1]++;
  }
}
// 「普通」= 種類が普通の銘柄（30銘柄のうち新興グロース以外＋ステップAの普通の5社）。新興グロースは別
const kindOf = s => (s.kind || (s.sector === 'growth' ? 'growth' : 'normal'));

let fails = 0;
const result = (ok, msg) => { if (!ok) fails++; console.log(`${ok ? '[OK  ]' : '[ズレ]'} ${msg}`); };
const pad = (s, n) => String(s).padEnd(n);

// ---------- 1. 年率ボラ ----------
console.log(`1. 年率ボラ（1年チャレンジ・ふつう・シード ${SEEDS_Y.join('/')} の平均）`);
const vol = {}, info = {};
for (const seed of SEEDS_Y) {
  const K = start('year', seed); finish(K, barStats);
  for (const s of K.G.stocks.concat(K.G.extra)) {
    const c = s.daily.filter(d => d.di >= 0 && d.di < (s.dl?.F ?? Infinity)).map(d => d.c); let q = 0; for (let i = 1; i < c.length; i++) q += Math.log(c[i] / c[i - 1]) ** 2;   // 倒産する銘柄は、前兆の前日まで
    (vol[s.code] ||= []).push(Math.sqrt(q / (c.length - 1) * 245) * 100);
    info[s.code] = { name: s.name, kind: kindOf(s), sector: s.sector };
  }
}
const V = c => mean(vol[c]);
const codes = Object.keys(vol), byKind = k => codes.filter(c => info[c].kind === k);
console.log(`${pad('コード', 6)}${pad('銘柄', 18)}${pad('種類', 8)}${pad('業種', 8)}年率ボラ`);
for (const c of codes.filter(c => c >= 'X7' || ['K201', 'K401', 'K301', 'K103', 'K105', 'K501', 'K601'].includes(c))) console.log(`${pad(c, 6)}${pad(info[c].name, 18)}${pad(KN[info[c].kind], 8)}${pad(info[c].sector, 8)}${V(c).toFixed(1)}%`);
const normal = mean(byKind('normal').map(V));
console.log(`\n種類ごとの平均：${['div', 'cyc', 'perk', 'normal', 'growth', 'ipo'].map(k => `${KN[k]} ${mean(byKind(k).map(V)).toFixed(1)}%（${byKind(k).length}社）`).join('　')}`);
for (const c of byKind('div')) result(V(c) >= 15 && V(c) <= 25 && V(c) < normal, `高配当 ${c} ${info[c].name}：${V(c).toFixed(1)}%（15〜25%・普通の平均 ${normal.toFixed(1)}% より低い）`);
for (const c of byKind('cyc')) result(V(c) >= 30 && V(c) <= 50 && V(c) > normal, `景気敏感 ${c} ${info[c].name}：${V(c).toFixed(1)}%（30〜50%・普通の平均 ${normal.toFixed(1)}% より高い）`);

// ---------- 2. 嵐の四半期の下げ幅 ----------
console.log(`\n2. 嵐の四半期の下げ幅（ふつう・シード ${SEEDS_S.length}本の平均。暴落の前日の終値 → 暴落の日から5営業日の最安値）`);
const drop = {};
for (const seed of SEEDS_S) {
  const K = start('storm', seed), cd = K.G.crashDay;
  while (K.G.dayIndex <= cd + 5 && !K.G.ended) { K.runDay(); K.closeModal(); if (!K.G.ended) K.nextDay(); }
  for (const s of K.G.stocks.concat(K.G.extra)) {
    const at = d => s.daily.find(x => x.di === d)?.c, base = at(cd - 1);
    let lo = Infinity; for (let d = cd; d <= cd + 5; d++) lo = Math.min(lo, at(d));
    (drop[s.code] ||= []).push((lo / base - 1) * 100);
  }
}
const D = c => mean(drop[c]), grp = k => mean(byKind(k).map(D));
console.log(`${pad('コード', 6)}${pad('銘柄', 18)}${pad('種類', 8)}下げ幅`);
for (const c of codes.filter(c => c >= 'X7' || ['K201', 'K401', 'K301', 'K103', 'K105', 'K501', 'K601'].includes(c))) console.log(`${pad(c, 6)}${pad(info[c].name, 18)}${pad(KN[info[c].kind], 8)}${D(c).toFixed(1)}%`);
console.log(`\n種類ごとの平均：${['div', 'cyc', 'perk', 'normal', 'growth'].map(k => `${KN[k]} ${grp(k).toFixed(1)}%`).join('　')}`);
result(grp('div') > grp('normal') && grp('normal') > grp('cyc'), `下げ幅の順番：高配当 ${grp('div').toFixed(1)}% ＞ 普通 ${grp('normal').toFixed(1)}% ＞ 景気敏感 ${grp('cyc').toFixed(1)}%（高配当 < 普通 < 景気敏感 = 下げの小さい順）`);

// ---------- 3. 低位株 ----------
console.log(`\n3. 低位株（1年チャレンジ・ふつう・シード ${SEEDS_Y.join('/')}）`);
for (const c of byKind('penny')) result(V(c) >= 80 && V(c) <= 150, `低位 ${c} ${info[c].name}：年率ボラ ${V(c).toFixed(1)}%（80〜150%）`);
console.log(`${pad('コード', 6)}${pad('銘柄', 18)}${pad('1分足の横線', 12)}${pad('5分足の横線', 12)}${pad('5分足の始値=終値', 16)}1日の値幅（呼値の数）`);
const pct = ([a, n]) => (a / n * 100).toFixed(1) + '%';
for (const c of BARS) { const b = bars[c]; console.log(`${pad(c, 6)}${pad(info[c].name, 18)}${pad(pct(b.m1), 12)}${pad(pct(b.m5), 12)}${pad(pct([b.doji5, b.m5[1]]), 16)}${(b.range[0] / b.range[1]).toFixed(1)}`); }
for (const c of byKind('penny')) { const b = bars[c], r = b.range[0] / b.range[1]; result(b.m5[0] / b.m5[1] <= 0.5 && r >= 3, `低位 ${c} ${info[c].name}：5分足の完全な横線 ${pct(b.m5)}（5割以下）、1日の値幅 平均${r.toFixed(1)}呼値（3以上）`); }

console.log(fails ? `\n${fails}件の基準に届いていません。bm・ssm を調整してください。` : '\nすべての基準を満たしています。');
process.exit(fails ? 1 : 0);
