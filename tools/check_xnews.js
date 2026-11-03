#!/usr/bin/env node
// 追加銘柄のニュース（ステップE）のチェック（画面なしで script.js を動かす）
//
//   node tools/check_xnews.js <ステップD3の script.js>
//
// 1. 30銘柄・指数・30銘柄のニュースが、D3 と全日同じ
// 2. ニュースの効果を0にすると（xnFx(0)）、全銘柄（30銘柄＋追加20社）の分足・日足が D3 と全日同じ（乱数の並びが変わっていない）
// 3. 効果ありで、追加銘柄は最初のニュースの前日まで D3 と同じ。ニュースのない銘柄は全日同じ
// 4. 銘柄ごとの独立性：ある銘柄のニュースを止めても、ほかの銘柄のニュースの日・時刻と値動きは変わらない
// 5. 再現性（同じシードを2回）・保存と読み込みをまたいでも同じ
// 6. 頻度と偏り（日程は100シード、テンプレートの内訳は SEEDS_T 本の1年分）
// 7. 増配・減配・優待の拡充・廃止が、配当・優待・権利落ち・カレンダー・今日のできごとに反映される
// 8. 一覧の上限（50銘柄 200件・30銘柄 120件）と、出さない日（X717・X718 の前兆から先、X719・X720 の上場前）
const path = require('path');
const crypto = require('crypto');
const { load } = require('./check_random.js');

const FILE = path.join(__dirname, '..', 'script.js');
const PREV = process.argv[2] && path.resolve(process.argv[2]);
if (!PREV) { console.log('使い方: node tools/check_xnews.js <ステップD3の script.js>'); process.exit(2); }
const store = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };
const hash = x => crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 16);
const bar = x => [x.o, x.h, x.l, x.c, x.v];
let fails = 0;
const result = (ok, msg) => { if (!ok) fails++; console.log(`${ok ? '[OK  ]' : '[ズレ]'} ${msg}`); };
const isX = c => c[0] === 'X';

function fresh(file, seed, scen = 'year', diff = 'normal', setup) {
  const K = load(file, store()); Object.assign(K.profile(), { xp: 6000, r7: true });
  if (setup) setup(K);
  K.newGame(scen, diff, seed); return K;
}
// 1日ずつ回して、日ごとの指紋を集める。main = 30銘柄・指数・30銘柄のニュース、x = 追加銘柄ごと
function play(K, days) {
  const out = [];
  for (let d = 0; d < days && !K.G.ended; d++) {
    K.runDay(); const G = K.G, di = G.dayIndex;
    const x = {}; for (const s of G.extra) x[s.code] = hash([s.daily.at(-1)?.di === di ? bar(s.daily.at(-1)) : null, s.intraday.map(bar)]);
    out.push({ main: hash({ s: G.stocks.map(s => [bar(s.daily.at(-1)), s.intraday.map(bar)]), idx: G.market.idxDaily.at(-1), news: G.news.filter(n => n.day === di && !(n.codes || []).some(isX)).map(n => [n.time, n.text]) }), x,
      xn: G.news.filter(n => n.day === di && n.xn).map(n => [n.codes[0], n.time, n.text]) });
    K.closeModal(); if (!K.G.ended) K.nextDay();
  }
  return out;
}
const CASES = [['year', 'normal', 2024, 245], ['year', 'easy', 31, 245]];   // 全銘柄の全日比較は、1年チャレンジを2シード

console.log('1〜3. D3 との比較');
const runs = {};
for (const [scen, diff, seed, days] of CASES) {
  const a = play(fresh(PREV, seed, scen, diff), days), b = play(fresh(FILE, seed, scen, diff), days);
  const z = play(fresh(FILE, seed, scen, diff, K => K.xnFx(0)), days);
  runs[seed] = b;
  const n = b.reduce((t, d) => t + d.xn.length, 0);
  result(a.every((d, i) => d.main === b[i]?.main), `${scen}/${diff}/${seed} ${a.length}日：30銘柄・指数・30銘柄のニュースが全日同じ（追加銘柄のニュース ${n}件）`);
  result(a.every((d, i) => d.main === z[i]?.main && Object.keys(d.x).every(c => d.x[c] === z[i].x[c])) && z.reduce((t, d) => t + d.xn.length, 0) === n,
    `  効果0：全銘柄（30銘柄＋追加${Object.keys(a[0].x).length}社）が全日同じ（ニュースは同じ ${n}件出る）`);
  // 効果あり：銘柄ごとに、最初のニュースの日の前日まで同じ（夜間のニュースは当日の寄り付きから、場中のニュースはその分から効く）
  let okAll = true, none = 0, sameDays = 0;
  for (const c of Object.keys(a[0].x)) {
    const first = b.findIndex(d => d.xn.some(x => x[0] === c)), upto = first < 0 ? a.length : first;
    for (let i = 0; i < upto; i++) if (a[i].x[c] !== b[i].x[c]) okAll = false;
    if (first < 0) { none++; } sameDays += upto;
  }
  result(okAll, `  効果あり：追加銘柄は、最初のニュースの前日まで同じ（比べた日 計${sameDays}、ニュースが1件もない銘柄 ${none}社は全日同じ）`);
}

console.log('\n4. 銘柄ごとの独立性');
{
  const base = runs[2024];
  for (const skip of ['X710', 'X714', 'X717']) {
    const r = play(fresh(FILE, 2024, 'year', 'normal', K => K.xnSkip(skip)), 245);
    const others = Object.keys(base[0].x).filter(c => c !== skip);
    // 優待の廃止は1ゲームに1社だけなので、優待の銘柄どうしは廃止のテンプレートの選び方がつながる（日と時刻は独立）
    const newsSame = r.every((d, i) => JSON.stringify(d.xn.filter(x => x[0] !== skip).map(x => x.slice(0, 2))) === JSON.stringify(base[i].xn.filter(x => x[0] !== skip).map(x => x.slice(0, 2))));
    const pxSame = others.every(c => r.every((d, i) => d.x[c] === base[i].x[c]));
    result(newsSame && pxSame && r.every((d, i) => d.main === base[i].main) && !r.some(d => d.xn.some(x => x[0] === skip)), `${skip} のニュースを止める → ほかの追加銘柄のニュースの日・時刻 同じ ${newsSame}、値動き 同じ ${pxSame}`);
  }
}

console.log('\n5. 再現性・保存');
{
  const a = play(fresh(FILE, 2024), 245);
  result(JSON.stringify(a) === JSON.stringify(runs[2024]), '同じシードを2回：全日同じ（ニュースの文面・時刻も）');
  // 40・90・150日目の引けで保存 → 読み込み（翌朝から）
  let K = fresh(FILE, 2024); const out = [];
  for (let d = 0; d < 245 && !K.G.ended; d++) {
    K.runDay(); const G = K.G, di = G.dayIndex;
    out.push(hash({ x: G.extra.map(s => [s.daily.at(-1)?.di === di ? bar(s.daily.at(-1)) : null, s.div, s.perk]), xn: G.news.filter(n => n.day === di && (n.codes || []).some(isX)).map(n => [n.time, n.text]) }));
    if ([40, 90, 150].includes(d)) { const t = K.saveText(); K = load(FILE, store()); Object.assign(K.profile(), { xp: 6000, r7: true }); K.resume(t); continue; }
    K.closeModal(); K.nextDay();
  }
  let K2 = fresh(FILE, 2024); const ref = [];
  for (let d = 0; d < 245 && !K2.G.ended; d++) { K2.runDay(); const G = K2.G, di = G.dayIndex; ref.push(hash({ x: G.extra.map(s => [s.daily.at(-1)?.di === di ? bar(s.daily.at(-1)) : null, s.div, s.perk]), xn: G.news.filter(n => n.day === di && (n.codes || []).some(isX)).map(n => [n.time, n.text]) })); K2.closeModal(); K2.nextDay(); }
  result(out.length === ref.length && out.every((h, i) => h === ref[i]), '40・90・150日目の引けで保存して読み込み：通しで遊んだのと全日同じ（値動き・配当・優待・ニュース）');
}

console.log('\n6. 頻度と偏り');
{
  // 日程：NS シード × 245日。出せる日（上場後・前兆の前）は日程の関数から求める
  const K = fresh(FILE, 1), G = K.G, codes = G.extra.map(s => s.code);
  let tot = 0, perCode = {}, gap = 0, eligDays = 0;
  const NS = 100;
  for (let seed = 1; seed <= NS; seed++) {
    G.seed = seed;
    for (const c of codes) {
      const s = G._map[c], F = s.dl ? K.dlPlan(seed, c)?.F ?? Infinity : Infinity, L = s.ipo ? K.ipoSchedule(seed, c) : -1;
      for (let d = 1; d < 245; d++) {
        if (d >= F || d <= L) continue;
        eligDays++; G.dayIndex = d; const p = K.xnPlan(c);
        if (p != null) { tot++; perCode[c] = (perCode[c] || 0) + 1; if (p === -1) gap++; }
      }
    }
  }
  const perDay = tot / NS / 244, pc = Object.values(perCode).map(v => v / NS);
  result(perDay > 0.8 && perDay < 1.1, `追加銘柄全体で1日 ${perDay.toFixed(2)}件（${NS}シード。1社あたりの誤差 約±${(Math.sqrt(12 * NS) / NS).toFixed(1)}件）、夜間 ${(gap / tot * 100).toFixed(0)}%`);
  console.log('       1社あたり年: ' + codes.map(c => `${c} ${((perCode[c] || 0) / NS).toFixed(1)}`).join('  '));
  result(codes.filter(c => !['X717', 'X718', 'X719', 'X720'].includes(c)).every(c => perCode[c] / NS > 10 && perCode[c] / NS < 14), `通年で出せる16社は年10〜14件（X717・X718 は前兆から先、X719・X720 は上場前に出ないので少ない）`);
  // テンプレートの内訳（実際にゲームを回す）
  const SEEDS_T = Array.from({ length: 30 }, (_, i) => 100 + i), by = {}, up = {}, dn = {}, chg = {};
  for (const seed of SEEDS_T) {
    const R = fresh(FILE, seed);
    const all = [];   // 一覧は200件までなので、日ごとに集める
    for (let d = 0; d < 245; d++) { R.runDay(); all.push(...R.G.news.filter(n => n.day === R.G.dayIndex && n.xn)); R.closeModal(); if (R.G.ended) break; R.nextDay(); }
    for (const n of all.filter(n => n.type !== 'deny')) {   // 訂正は数えない
      const k = R.G._map[n.codes[0]].kind, key = n.text.replace(R.G._map[n.codes[0]].name, '{n}').replace(/[\d,.]+/g, '#').replace(/（.*→.*）/, '');
      (by[k] ||= {})[key] = (by[k][key] || 0) + 1;
      if (n.hint.startsWith('↑')) up[k] = (up[k] || 0) + 1; else dn[k] = (dn[k] || 0) + 1;
    }
    for (const s of R.G.extra) { if (s.perkGone) chg.pcut = (chg.pcut || 0) + 1; }
    for (const n of all) { const m = /増配|減配|優待の拡充を発表|優待の内容を変更|優待の廃止/.exec(n.text); if (m && !n.text.startsWith('観測')) { const k = n.codes[0] + m[0].slice(0, 2); chg[k] = (chg[k] || 0) + 1; } }
    const per = {}; for (const n of all) if (/増配を発表|減配を発表|優待の拡充を発表|優待の内容を変更|優待の廃止を発表/.test(n.text) && !n.text.startsWith('観測')) per[n.codes[0]] = (per[n.codes[0]] || 0) + 1;
    chg.maxPer = Math.max(chg.maxPer || 0, ...Object.values(per), 0);
  }
  for (const k of Object.keys(by)) {
    const tot = Object.values(by[k]).reduce((a, b) => a + b, 0);
    console.log(`  ${k}（${tot}件、上げ ${up[k] || 0}・下げ ${dn[k] || 0}）: ` + Object.entries(by[k]).sort((a, b) => b[1] - a[1]).map(([t, v]) => `${t} ${v}`).join(' / '));
  }
  const words = { div: /配当|増配|減配|業績|自社株|利益/, cyc: /受注|市況|業績|工場|減産/, perk: /優待|店|業績/, penny: /増資|新株予約権|提携|業績|事業|出資/, ipo: /受注|提携|増資|売上|業績|売り出し|売却/ };
  result(Object.entries(words).every(([k, re]) => by[k] && Object.keys(by[k]).every(t => re.test(t))), '種類ごとの偏り：高配当・景気敏感・優待・低位・新規は、それぞれの話題だけ');
  const bad = Object.keys(by.penny || {}).filter(t => /資金繰り|債務超過|継続企業|倒産|破産|再生/.test(t));
  result(!bad.length, `低位株に資金繰り・債務超過・倒産の話は出ない${bad.length ? '：' + bad.join(' / ') : ''}`);
  result(chg.maxPer <= 1, `配当・優待を変えるニュースは1社につき1年に1回まで（${SEEDS_T.length}本の1年で、1社の最多 ${chg.maxPer}回）`);
  result((chg.pcut || 0) <= SEEDS_T.length * 0.5, `優待の廃止は1ゲームに1社まで、出るのは一部のゲームだけ（${SEEDS_T.length}本のうち ${chg.pcut || 0}本）`);
}

console.log('\n7. 増配・減配・優待の変更の反映');
{
  const toDate = (K, d) => { while (K.G.date < d) { K.runDay(); K.closeModal(); K.nextDay(); } };
  const toMin = (K, m) => { while (K.G.phase === 'pre') K.tick(); while (K.G.phase === 'open' && K.G.minute < m) K.tick(); };
  const ord = (K, o) => K.placeOrder({ type: 'mkt', price: null, reserve: 0, mg: false, side: 'buy', qty: 100, ...o });
  const evs = K => [...new Set(K.G.dayEvents.concat(K.G.last?.events || []))];
  const Dt = (K, m) => { const y = K.G.date.slice(0, 4); let d = `${y}-${String(m).padStart(2, '0')}-20`; return d; };
  // (a) 増配：X708 を持って、3月より前に増配 → 3月の権利確定の配当が新しい額。カレンダーの表も新しい額
  {
    const K = fresh(FILE, 2024, 'year', 'normal', K => K.xnSkip('X708'));
    const s = K.G._map.X708, y0 = s.div; toMin(K, 30); ord(K, { code: 'X708', qty: 300 }); K.runDay(); K.closeModal(); K.nextDay();
    K.xnSkip(null);
    K.xnForce('X708', 'dup');
    const y1 = s.div, ev1 = evs(K).find(e => e.includes('年間配当')), nw = K.G.news.at(-1).text;
    K.xnSkip('X708');
    // 次の権利確定日（3月か9月の最終営業日）まで
    let got = null, gap = null;
    while (!got) { const pd = K.G.player.pendingDiv; K.runDay(); const ev = evs(K).find(e => e.includes(s.name) && e.includes('配当の権利')); if (ev) { got = ev; gap = s.gap; } K.closeModal(); K.nextDay(); }
    const per = y1 / s.rec.length;
    K.switchView('cal'); const cal = K.G._map.X708.div;
    result(y1 > y0 * 1.09 && y1 < y0 * 1.21 && nw.includes('増配') && ev1 && got.includes(`${per}円`) && cal === y1,
      `(a) 増配：年間配当 ${y0}円 → ${y1}円（ニュース「${nw}」）、今日のできごと「${ev1}」、権利確定「${got}」`);
  }
  // (b) 減配：0.7倍。持っていなければ「今日のできごと」には出ない
  {
    const K = fresh(FILE, 2024, 'year', 'normal', K => K.xnSkip('X709'));
    K.xnSkip(null); const s = K.G._map.X709, y0 = s.div; K.runDay(); K.closeModal(); K.nextDay();
    K.xnForce('X709', 'dcut');
    result(Math.abs(s.div - Math.round(y0 * 0.7 * 10) / 10) < 1e-9 && !evs(K).some(e => e.includes('年間配当')), `(b) 減配：${y0}円 → ${s.div}円、持っていないので今日のできごとには出ない`);
  }
  // (c) 優待の拡充：金額1.5倍、文面の金額も。権利確定で新しい額が入る
  {
    const K = fresh(FILE, 2024, 'year', 'normal', K => K.xnSkip('X716'));
    const s = K.G._map.X716, y0 = s.perk.yen; toMin(K, 30); ord(K, { code: 'X716', qty: 100 }); K.runDay(); K.closeModal(); K.nextDay();
    K.xnForce('X716', 'pup');
    const y1 = s.perk.yen, t1 = s.perk.text;
    let got = null; while (!got) { K.runDay(); if (K.G.player.pendingPerk > 0) got = K.G.player.pendingPerk; K.closeModal(); K.nextDay(); }
    result(y1 === Math.round(y0 * 1.5 / 100) * 100 && t1.includes(y1.toLocaleString()) && got === y1, `(c) 優待の拡充：${y0}円 → ${y1}円（${t1}）、権利確定で ${got}円`);
  }
  // (d) 優待の廃止：s.perk がなくなり、バッジ・絞り込み・カレンダーから外れる。権利確定日には保有者だけ1行。2社目は廃止にならない
  for (const hold of [true, false]) {
    const K = fresh(FILE, 2024, 'year', 'normal', K => K.xnSkip('X716'));
    const s = K.G._map.X716; toMin(K, 30); if (hold) ord(K, { code: 'X716', qty: 100 }); K.runDay(); K.closeModal(); K.nextDay();
    K.xnForce('X716', 'pcut');
    const gone = !s.perk && s.perkGone && K.G.xnPerkCut === 'X716';
    K.render();
    let line = null, pend = 0, drop = null;
    while (!line && K.G.date.slice(5, 7) !== '09') {
      const p0 = s.price; K.runDay(); const e = evs(K).find(x => x.includes('優待がなくなったため')); if (e) line = e; pend += K.G.player.pendingPerk; K.closeModal(); K.nextDay();
      if (e || K.G.date.slice(5, 7) === '03') break;
    }
    // 2社目の廃止は出ない（xnForce で廃止を選んでも、選べるテンプレートがないので別の変化にならない）
    let second = null; try { K.xnForce('X714', 'pcut'); second = !!K.G._map.X714.perk; } catch (e) { second = 'エラー: ' + e.message; }
    if (hold) result(gone && line && pend === 0, `(d) 優待の廃止（保有あり）：s.perk なし、権利確定日（8月）に「${line}」、優待の入金 ${pend}円`);
    else result(gone && !line && pend === 0, `(d) 優待の廃止（保有なし）：権利確定日に何も出ない`);
    if (hold) result(second === true, `(d) 2社目（X714）は廃止にならない：X714 の優待 ${second === true ? '残る' : second}`);
  }
}

console.log('\n8. 一覧の上限と、出さない日');
{
  const K = fresh(FILE, 2024); for (let d = 0; d < 245; d++) { K.runDay(); K.closeModal(); K.nextDay(); }
  const K30 = load(FILE, store()); K30.newGame('year', 'normal', 2024); for (let d = 0; d < 245; d++) { K30.runDay(); K30.closeModal(); K30.nextDay(); }
  result(K.G.news.length === 200 && K30.G.news.length === 120, `1年後のニュースの件数：50銘柄 ${K.G.news.length}件（上限200）、30銘柄 ${K30.G.news.length}件（上限120）`);
  let bad = 0;
  for (const seed of [2024, 31, 7, 8, 9]) {
    const R = seed === 2024 ? K : fresh(FILE, seed); if (seed !== 2024) for (let d = 0; d < 245; d++) { R.runDay(); R.closeModal(); R.nextDay(); }
    for (const n of R.G.news.filter(n => n.xn)) {
      const s = R.G._map[n.codes[0]];
      if (s.dl && n.day >= s.dl.F) bad++;
      if (s.ipo && n.day <= s.ipo.day) bad++;
    }
  }
  result(!bad, `X717・X718 の前兆から先、X719・X720 の上場日まで（5シード）：出たニュース ${bad}件`);
}

console.log(fails ? `\n${fails}件の確認が通りませんでした。` : '\nすべての確認が通りました。');
process.exit(fails ? 1 : 0);
