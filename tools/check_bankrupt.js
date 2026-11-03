#!/usr/bin/env node
// 破産（ステップD3）のチェック（画面なしで script.js を動かす）
//
//   node tools/check_bankrupt.js
//
// 1. 破産するケース：信用買いで現金をマイナスにし、倒産の強制決済で netAsset が0以下 → 失敗のリザルト・ポイント0・記録の印・セーブの削除
// 2. 現物だけで総資産が小さくなっても、現金がマイナスでも総資産がプラスなら、破産にならない
// 3. 場中は判定しない（引けだけ）
// 4. 前ぶれ（総資産が初期資金の20%を切ったら、1日1回、引けに）
// 5. 信用の練習中は判定しない
// 6. 全難易度・リアル相場でも判定する／期間無制限のフリープレイは破産が唯一の終わり方
// 7. 破産しない通常のゲームでは、全銘柄の全日がステップD2と同じ（--prev=ステップD2の script.js）
const path = require('path');
const crypto = require('crypto');
const { load: load0 } = require('./check_random.js');
// 追加銘柄のニュース（ステップE）の効果は切って調べる（効果ありの確認は tools/check_xnews.js）
const load = (file, storage) => { const K = load0(file, storage); K.xnFx?.(0); return K; };

const FILE = path.join(__dirname, '..', 'script.js');
const args = process.argv.slice(2), flag = n => { const a = args.find(x => x.startsWith(`--${n}=`)); return a && path.resolve(a.slice(n.length + 3)); };
const PREV = flag('prev');
const store = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), has: k => m.has(k) }; };
let fails = 0;
const result = (ok, msg) => { if (!ok) fails++; console.log(`${ok ? '[OK  ]' : '[ズレ]'} ${msg}`); };
const hash = x => crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 16);
const bar = x => [x.o, x.h, x.l, x.c, x.v];

function fresh(seed, cash, diff = 'normal', scen = 'year', file = FILE) {
  const st = store(), K = load(file, st); Object.assign(K.profile(), { xp: 6000, r7: true });
  K.newGame(scen, diff, seed, cash); return { K, st };
}
const toMin = (K, m) => { while (K.G.phase === 'pre') K.tick(); while (K.G.phase === 'open' && K.G.minute < m) K.tick(); };
const day = K => { K.runDay(); K.closeModal(); if (!K.G.ended) K.nextDay(); };
const ord = (K, o) => K.placeOrder({ type: 'mkt', qty: 100, price: null, reserve: 0, mg: false, ...o });
const evs = K => [...new Set(K.G.dayEvents.concat(K.G.last?.events || []))];

// 現金 cash で X717 を信用で目いっぱい買い、days 営業日後に前兆が始まる日程にして、最終売買日の引けまで回す
function crash(K, spot = 0) {
  day(K); toMin(K, 30);
  if (spot) ord(K, { code: 'X704', side: 'buy', qty: spot });
  const n = Math.floor(K.marginRoom('X717') / (K.G._map.X717.price * 1.05) / 100) * 100;
  ord(K, { code: 'X717', side: 'buy', qty: n, mg: true, open: true });
  const cp = K.forceDelist('X717', 1); K.runDay(); K.closeModal(); K.nextDay();
  while (K.G.dayIndex < cp.L && !K.G.ended) day(K);
  if (K.G.ended) return { n, cp };
  return { n, cp };
}

console.log('1. 破産するケース（現金40万円・X717 を信用買い → 倒産の強制決済）');
{
  const { K, st } = fresh(2024, 4e5), pts0 = K.profile().points;
  const { n, cp } = crash(K);
  if (!K.G.ended) K.runDay();
  const G = K.G, P = G.player, a = K.netAsset();
  result(a <= 0 && G.bankrupt === true && G.ended === true, `信用で X717 を ${n.toLocaleString()}株 → ${G.date}（${G.dayIndex}日目。倒産 ${cp.B}・最終売買日 ${cp.L}）の引けで 現金 ${Math.round(P.cash).toLocaleString()}円・総資産 ${Math.round(a).toLocaleString()}円 → 破産 ${G.bankrupt}、終了 ${G.ended}`);
  result(!st.has('kabutore.save'), `破産の日の引けで、セーブが消えている（保存データ ${st.has('kabutore.save') ? 'あり' : 'なし'}）`);
  result(evs(K).some(e => e.includes('破産')), `「今日のできごと」に破産が出る：${evs(K).filter(e => e.includes('破産')).join(' / ')}`);
  K.closeModal(); K.finalReport();
  const pr = K.profile(), rec = pr.records[0];
  result(rec && rec.bankrupt === true && rec.stars === 0 && rec.clear === false && rec.pt === 0 && rec.asset <= 0, `記録：bankrupt=${rec?.bankrupt}、星${rec?.stars}、クリア${rec?.clear}、pt ${rec?.pt}、最終資産 ${Math.round(rec?.asset || 0).toLocaleString()}円`);
  result(pr.points === pts0 && Object.keys(pr.pbest).length === 0, `ポイントは増えない（${pts0} → ${pr.points}）、この相場の最高点も残らない`);
  result(!st.has('kabutore.save'), 'リザルトのあとも、セーブは残らない');
}

console.log('\n2. 破産にならないケース');
{
  // 現物だけで X717 に全額 → 廃止で1円近くまで下がっても、総資産はプラス（破産ではない）
  const A = fresh(2024, 5e6).K; day(A); toMin(A, 30);
  ord(A, { code: 'X717', side: 'buy', qty: Math.floor(5e6 / A.G._map.X717.price / 100 / 1.02) * 100 });
  const cp = A.forceDelist('X717', 1); A.runDay(); A.closeModal(); A.nextDay();
  while (A.G.dayIndex < cp.L && !A.G.ended) day(A);
  A.runDay();
  const a = A.netAsset();
  result(a > 0 && a < 5e6 * 0.2 && !A.G.bankrupt && !A.G.ended, `現物だけで全額 X717 → 廃止の決済のあと 総資産 ${Math.round(a).toLocaleString()}円（初期資金の${(a / 5e6 * 100).toFixed(1)}%）でも、破産ではない`);
  // 現金がマイナスでも、総資産がプラスなら破産ではない（現物の別の銘柄でカバー）
  const B = fresh(2024, 4e6).K; day(B); toMin(B, 30);
  ord(B, { code: 'X704', side: 'buy', qty: Math.floor(3e6 / B.G._map.X704.price / 100) * 100 });
  const n = Math.floor(2e6 / B.G._map.X717.price / 100) * 100;
  ord(B, { code: 'X717', side: 'buy', qty: n, mg: true, open: true });
  const cb = B.forceDelist('X717', 1); B.runDay(); B.closeModal(); B.nextDay();
  while (B.G.dayIndex < cb.L && !B.G.ended) day(B);
  B.runDay();
  result(B.G.player.cash < 0 ? (B.netAsset() > 0 && !B.G.bankrupt) : true, `現金 ${Math.round(B.G.player.cash).toLocaleString()}円、総資産 ${Math.round(B.netAsset()).toLocaleString()}円 → 破産 ${!!B.G.bankrupt}（現金がマイナスだけでは判定しない：${B.G.player.cash < 0 ? '確認' : '現金がマイナスにならなかったので参考'}）`);
}

console.log('\n3. 場中は判定しない・前ぶれ');
{
  const { K } = fresh(2024, 5e6); day(K); toMin(K, 30);
  const P = K.G.player; P.cash = -1e6;   // 場中に総資産が0以下になっても、その場では終わらない
  while (K.G.phase === 'open') K.tick();
  result(K.G.phase === 'closed' && K.G.ended === true && K.G.bankrupt === true, '場中に総資産が0以下でも、引けまでは続き、引けで破産になる');
  const W = fresh(2024, 5e6).K; day(W); toMin(W, 30);
  const PW = W.G.player; PW.cash = 5e6 * 0.15;   // 初期資金の15%
  W.runDay();
  const w1 = evs(W).filter(e => e.includes('これ以上減ると、破産'));
  W.closeModal(); W.nextDay(); W.runDay();
  const w2 = evs(W).filter(e => e.includes('これ以上減ると、破産'));
  result(w1.length === 1 && w2.length === 1 && !W.G.ended, `15%の日の引けに注意が1回ずつ（1日目 ${w1.length}件・2日目 ${w2.length}件）：${w1[0]}`);
  const N = fresh(2024, 5e6).K; day(N); toMin(N, 30); N.G.player.cash = 5e6 * 0.3; N.runDay();
  result(!evs(N).some(e => e.includes('破産')), '30%のときは注意も出ない');
}

console.log('\n4. 信用の練習中は判定しない');
{
  const { K } = fresh(2024, 5e6); day(K); toMin(K, 30);
  K.practiceStart('K201');
  K.G.player.cash = -1e6; while (K.G.phase === 'open') K.tick();
  const during = !K.G.bankrupt && !K.G.ended;
  K.practiceEnd(true);
  result(during, `練習中に総資産が0以下でも、破産にならない（練習のあとは元の状態に戻る：現金 ${Math.round(K.G.player.cash).toLocaleString()}円）`);
}

console.log('\n5. 全難易度・リアル相場・フリープレイ');
for (const diff of ['easy', 'normal', 'hard']) {
  const { K } = fresh(2024, 5e6, diff); day(K); toMin(K, 30); K.G.player.cash = -1e6; K.runDay();
  result(K.G.bankrupt && K.G.ended, `${diff}：破産する`);
}
{
  const { K } = fresh(2024, 5e6, 'normal', 'free'); day(K); toMin(K, 30);
  for (let i = 0; i < 40; i++) day(K);
  const still = !K.G.ended;
  K.G.player.cash = -1e9; K.runDay();
  result(still && K.G.bankrupt && K.G.ended, '期間無制限のフリープレイ：40日回しても終わらず、破産で終わる');
}
{
  const st = store(), K = load(FILE, st); Object.assign(K.profile(), { xp: 6000, r7: true });
  K.newGame('real', 'normal', 1, 5e6, 'real');
  if (K.G.mode === 'real') { day(K); toMin(K, 30); K.G.player.cash = -1e7; K.runDay(); result(K.G.bankrupt && K.G.ended, 'リアル相場（コロナショック）：破産する'); }
  else console.log('       （リアル相場のデータがないのでとばした）');
}

console.log('\n6. 破産しない通常のゲームは、ステップD2と全日同じ');
if (!PREV) console.log('       （--prev=ステップD2の script.js を渡すと比べます）');
else {
  const run = (file, scen, diff, seed, days) => {
    const { K } = fresh(seed, 5e6, diff, scen, file), out = [];
    for (let d = 0; d < days && !K.G.ended; d++) { K.runDay(); const G = K.G; out.push(hash({ s: G.stocks.concat(G.extra).map(s => [s.code, s.daily.at(-1) && bar(s.daily.at(-1)), s.intraday.map(bar)]), idx: G.market.idxDaily.at(-1), news: G.news.filter(n => n.day === G.dayIndex && !n.xn).map(n => [n.time, n.text]) })); K.closeModal(); if (!K.G.ended) K.nextDay(); }
    return out;
  };
  for (const [scen, diff, seed, days] of [['year', 'normal', 2024, 245], ['storm', 'hard', 777, 60], ['free', 'easy', 99, 120], ['month', 'normal', 12345, 20]]) {
    const a = run(PREV, scen, diff, seed, days), b = run(FILE, scen, diff, seed, days);
    result(a.length === b.length && a.every((x, i) => x === b[i]), `${scen}/${diff}/${seed} ${a.length}日：全銘柄（追加20社を含む）・指数・ニュースが全日同じ`);
  }
}

console.log(fails ? `\n${fails}件の確認が通りませんでした。` : '\nすべての確認が通りました。');
process.exit(fails ? 1 : 0);
