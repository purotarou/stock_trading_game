#!/usr/bin/env node
// 追加銘柄（ランク7・G.extra）のチェック（画面なしで script.js を動かす）
//
//   node tools/check_extra.js                 # 今の script.js を調べる
//   node tools/check_extra.js 変更前.js        # 古いセーブの読み込み（4）を、追加銘柄より前の script.js で作ったセーブで調べる
//
// 1. ON/OFF：同じランク7で、追加銘柄あり・なしの30銘柄（分足・日足）・指数・ニュース（追加銘柄の分を除く）が同じ
// 2. 再現性：同じシードなら追加銘柄も同じ値動き（別のシードなら別の値動き）
// 3. セーブをまたいでも同じ：途中で保存して読み込み直しても、通しで遊んだのと同じ
// 4. 古いセーブ（追加銘柄なし）が読み込めて、30銘柄のまま続けられる
// 5. ランク7の前は30銘柄・後は37銘柄。「R7到達済み」が立つ3か所
// 6. 追加銘柄の売買（現物・信用・空売り・指値）・決算・配当・税・セーブ
// 7. --stepB=（または --stepA=）直前の段階の script.js を渡すと、そこにある銘柄（30銘柄＋その段階の追加銘柄）の値動きが同じか（全日）。
//    同じ相場で、成行の小さな注文（1銘柄100万円分）の約定も同じか
//    倒産しうる銘柄（X717・X718）は、倒産の前兆の前日まで比べる。倒産が回す日数より後になるシードでは、全銘柄の全日を比べる
// 8. 株主優待：現物100株以上だけ・信用の買い建ては対象外・翌朝に入金・課税なし・権利落ち・保存をまたぐ

// 9. 低位株、10. 成行の部分約定、11. 倒産・上場廃止（段階とお知らせ・ストップ安・決済と税・信用の借金・空売り・連勝・途中のセーブ・確率）
// 12. 新規上場（上場前は隠す・乱数を引かない、承認・速報・初値、値幅制限、信用の制限、決算、前倒し、途中のセーブ、分布）、netAsset と旧式の総資産
const path = require('path');
const crypto = require('crypto');
const { load: load0 } = require('./check_random.js');
// 追加銘柄のニュース（ステップE）の効果は切って調べる（xnFx(0)。ニュースは出るが値動き・配当・優待は動かない）。
// ニュースの効果ありの確認は tools/check_xnews.js。ステップE より前の script.js には xnFx がないので、そのまま
const load = (file, storage) => { const K = load0(file, storage); K.xnFx?.(0); return K; };

const FILE = path.join(__dirname, '..', 'script.js');
const args = process.argv.slice(2), flag = n => { const a = args.find(x => x.startsWith(`--${n}=`)); return a && path.resolve(a.slice(n.length + 3)); };
const OLD = args.find(x => !x.startsWith('--')) && path.resolve(args.find(x => !x.startsWith('--')));   // 追加銘柄より前の script.js
const PREV = flag('stepD3') || flag('stepD1') || flag('stepC') || flag('stepB') || flag('stepA'), PREV_NAME = flag('stepD3') ? 'ステップD3' : flag('stepD1') ? 'ステップD1' : flag('stepC') ? 'ステップC' : flag('stepB') ? 'ステップB' : 'ステップA';   // 直前の段階の script.js（そこにある銘柄の値動きが同じかを比べる）
const NX = 20;   // 追加銘柄の数（XDEFS）
const hash = x => crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 16);
const store = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };
const bar = x => [x.o, x.h, x.l, x.c, x.v];

let fails = 0;
function result(ok, msg) { if (!ok) fails++; console.log(`${ok ? '[OK  ]' : '[ズレ]'} ${msg}`); }

// プロフィールを直接書きかえる（xp = 経験値、r7 = R7到達済み、fast = ファストスターター）
function setProfile(K, xp, r7, fast = false) { const p = K.profile(); p.xp = xp; p.r7 = r7; p.fast = fast; }
function start(file, xp, r7, scen, diff, seed, fast, cash) { const K = load(file, store()); setProfile(K, xp, r7, fast); K.newGame(scen, diff, seed, cash); return K; }
const isExtra = (G, code) => G.extra?.some(s => s.code === code);

// 1日分の指紋。main = 30銘柄・指数・その日のニュース（追加銘柄のものを除く）、extra = 追加銘柄
function snap(K) {
  const G = K.G, di = G.dayIndex;
  return {
    main: hash({ s: G.stocks.map(s => [s.code, s.daily.at(-1) && bar(s.daily.at(-1)), s.intraday.map(bar)]), idx: G.market.idxDaily.at(-1), news: G.news.filter(n => n.day === di && !(n.codes || []).some(c => isExtra(G, c))).map(n => [n.time, n.text]) }),
    extra: hash((G.extra || []).map(s => [s.code, s.daily.at(-1) ? bar(s.daily.at(-1)) : null, s.intraday.map(bar)])),   // 上場前の新規上場は日足がない
  };
}
// 開始前の過去チャート（30銘柄と指数 / 追加銘柄）
const histSnap = G => ({ main: hash({ s: G.stocks.map(s => s.daily.map(bar)), idx: G.market.idxDaily }), extra: hash((G.extra || []).map(s => s.daily.map(bar))) });
// days 日ぶん回して、日ごとの指紋を返す（最初の日の朝から）
function play(K, days) {
  const out = [];
  for (let d = 0; d < days && !K.G.ended; d++) {
    K.runDay(); out.push(snap(K)); K.closeModal();
    if (!K.G.ended && d < days - 1) K.nextDay();
  }
  return out;
}
const same = (a, b, k) => a.length === b.length && a.every((x, i) => x[k] === b[i][k]);
const firstDiff = (a, b, k) => a.findIndex((x, i) => x[k] !== b[i]?.[k]);

// ---------- 1. ON/OFF ----------
console.log('1. 追加銘柄あり・なしで、30銘柄・指数・ニュースが同じか（どちらもランク7。なしは xOn(false)）');
const CASES = [['year', 'normal', 2024, 245], ['storm', 'hard', 777, 60], ['free', 'easy', 99, 80], ['month', 'normal', 12345, 20], ['year', 'hard', 5, 120, true]];
for (const [scen, diff, seed, days, fast] of CASES) {
  const A = load(FILE, store()); setProfile(A, 6000, true, fast); A.xOn(false); A.newGame(scen, diff, seed); A.xOn(true);
  const B = start(FILE, 6000, true, scen, diff, seed, fast);
  const n = [A.G.extra.length, B.G.extra.length], hA = histSnap(A.G), hB = histSnap(B.G);
  const a = play(A, days), b = play(B, days), ok = same(a, b, 'main') && hA.main === hB.main;
  result(ok && n[0] === 0 && n[1] === NX, `${scen}/${diff}/${seed}${fast ? '（ファストON・梅山あり）' : ''} ${a.length}日  追加銘柄 ${n[0]}→${n[1]}社  過去60日${hA.main === hB.main ? '同じ' : 'ちがう'}  ${ok ? '全日同じ' : `${firstDiff(a, b, 'main') + 1}日目からズレ`}`);
}

// ---------- 2. 再現性 ----------
console.log('\n2. 追加銘柄の再現性');
{
  const A = start(FILE, 6000, true, 'year', 'normal', 31), B = start(FILE, 6000, true, 'year', 'normal', 31), C = start(FILE, 6000, true, 'year', 'normal', 32);
  const hA = histSnap(A.G), hB = histSnap(B.G);
  const a = play(A, 245), b = play(B, 245), c = play(C, 245);
  result(hA.extra === hB.extra && same(a, b, 'extra'), `同じシード（31）を2回：過去60日と245日分の追加銘柄が${hA.extra === hB.extra && same(a, b, 'extra') ? 'すべて同じ' : 'ちがう'}`);
  result(!same(a, c, 'extra'), `別のシード（32）：追加銘柄の値動きが${same(a, c, 'extra') ? '同じ（おかしい）' : 'ちがう'}`);
  const px = A.G.extra.map(s => `${s.code} ${s.daily[0]?.c ?? '上場前'}→${s.price}`).join('  ');
  console.log(`       1年後の値段（シード31）: ${px}`);
}

// ---------- 3. セーブをまたいだ再現性 ----------
console.log('\n3. 途中で保存・読み込みしても、通しで遊んだのと同じか');
{
  const A = start(FILE, 6000, true, 'year', 'normal', 2024);
  play(A, 40);
  const text = A.saveText();
  A.nextDay(); const a = play(A, 40);
  const B = load(FILE, store()); setProfile(B, 6000, true);
  B.resume(text);   // 引けのあとに保存したので、翌営業日の朝から始まる
  const b = play(B, 40);
  result(same(a, b, 'main') && same(a, b, 'extra'), `41〜80日目：30銘柄 ${same(a, b, 'main') ? '同じ' : 'ズレ'}、追加銘柄 ${same(a, b, 'extra') ? '同じ' : 'ズレ'}（保存 ${(text.length / 1e3).toFixed(0)}KB）`);
}

// ---------- 4. 古いセーブ ----------
console.log('\n4. 追加銘柄より前のセーブ（30銘柄）の読み込み');
{
  let text, ref = null, prof = null;
  if (OLD) {   // 変更前の script.js で遊んで保存したもの。続きも変更前の script.js で遊び、同じになるかを見る
    const st = store(), L = load(OLD, st);
    L.newGame('year', 'normal', 2024); play(L, 10);
    text = st.getItem('kabutore.save'); prof = JSON.stringify(L.profile());   // ランクでニュースの選び方が変わるので、経験値もそろえる
    L.nextDay(); ref = play(L, 10);
  } else {     // 変更前のファイルがないときは、今のセーブから extra を消したもので代わりにする
    const A = start(FILE, 0, false, 'year', 'normal', 2024); play(A, 10);
    const g = JSON.parse(A.saveText()); delete g.extra; text = JSON.stringify(g); prof = JSON.stringify(A.profile());
  }
  const K = load(FILE, store()); Object.assign(K.profile(), JSON.parse(prof), { r7: true });   // R7到達済みでも、続きは30銘柄のまま
  let err = null, b = [];
  try { K.resume(text); b = play(K, 10); } catch (e) { err = e; }
  result(!err && K.G.extra.length === 0 && K.G.stocks.length === 30, `読み込んで10日進める：${err ? 'エラー ' + err.message : `30銘柄・追加銘柄${K.G.extra.length}社`}${OLD ? '' : '（変更前の script.js を渡すと、本物の古いセーブで調べます）'}`);
  if (ref) result(same(ref, b, 'main'), `変更前の script.js で続けたのと${same(ref, b, 'main') ? '同じ値動き' : `${firstDiff(ref, b, 'main') + 1}日目からちがう`}`);
}

// ---------- 5. ランクと銘柄数 ----------
console.log('\n5. ランク7の前と後の銘柄数（追加銘柄はいつも持ち、ランク7まで隠す）、「R7到達済み」の立ち方');
{
  const count = K => Object.keys(K.G._map).length, shown = K => K.unlockedCodes().filter(c => K.G.extra.some(s => s.code === c)).length;
  const A = start(FILE, 3000, false, 'free', 'normal', 1);
  result(count(A) === 30 + NX && A.G.extra.length === NX && shown(A) === 0, `ランク6の新規ゲーム：${count(A)}銘柄を持ち、追加銘柄の表示 ${shown(A)}社`);
  const B = start(FILE, 6000, true, 'free', 'normal', 1);
  result(count(B) === 30 + NX && B.G.extra.length === NX && shown(B) > 0, `ランク7の新規ゲーム：${count(B)}銘柄（30＋追加${B.G.extra.length}）、追加銘柄の表示 ${shown(B)}社（新規上場は上場まで隠す）`);
  A.addXP(3000, 'テスト');
  result(shown(A) === shown(B), `ランク6のゲームの途中でランク7に上がる → 追加銘柄の表示 ${shown(A)}社`);
  const C = load(FILE, store()); setProfile(C, 3000, false); C.newGame('real', 'normal', 1, 0, 'real');
  if (C.G.mode === 'real') { const n0 = shown(C); C.addXP(3000, 'テスト'); result(C.G.extra.length > 0 && n0 === 0 && shown(C) > 0, `ランク6のリアル相場：追加銘柄 ${C.G.extra.length}社を持ち、表示 ${n0}社 → ランク7で ${shown(C)}社`); }
  // (a) 読み込んだプロフィールがすでにR7以上
  const st = store(); st.setItem('kabutore.profile', JSON.stringify({ xp: 6500, missions: {} }));
  const D = load(FILE, st);
  result(D.profile().r7 === true, `R7以上のプロフィールを読み込む → r7 = ${D.profile().r7}`);
  // (b) 経験値でR7に上がる
  const E = start(FILE, 5990, false, 'free', 'normal', 1); E.addXP(20, 'テスト');
  result(E.profile().r7 === true && E.rank() === 7, `経験値でランク7に上がる → r7 = ${E.profile().r7}`);
  // (c) 伝説の相場師（9:00にロゴを10回）
  const F = start(FILE, 0, false, 'free', 'normal', 1);
  while (F.G.phase === 'pre') F.tick();
  for (let i = 0; i < 10; i++) F.legendTap();
  result(F.profile().r7 === true && F.rank() === 7, `legendTap → r7 = ${F.profile().r7}、ランク${F.rank()}`);
  // データのリセットで消える（defProfile に r7: false）
  const G0 = load(FILE, store());
  result(G0.profile().r7 === false, `初めてのプロフィール → r7 = ${G0.profile().r7}`);
}

// ---------- 6. 売買・決算・配当・税・セーブ ----------
console.log('\n6. 追加銘柄の売買・決算・配当・税・セーブ');
{
  // 初期資金は500万円（現物を買っても、信用の保証金が足りなくならないように）
  const K = start(FILE, 6000, true, 'year', 'normal', 2024, false, 5e6), G = () => K.G, P = () => K.G.player;
  const byCode = c => K.G._map[c];
  const toMinute = m => { while (G().phase === 'pre') K.tick(); while (G().phase === 'open' && G().minute < m) K.tick(); };
  const order = o => K.placeOrder({ type: 'mkt', qty: 100, price: null, reserve: 0, mg: false, ...o });
  const earnSeen = new Set();   // ニュースは120件までしか残らないので、毎日数える
  const nextMorning = () => { K.runDay(); for (const n of K.G.news) if (n.type === 'earn' && isExtra(K.G, n.codes[0])) earnSeen.add(n.codes[0]); K.closeModal(); K.nextDay(); };
  // 1日目：現物買い（X702 と X704）、信用の新規買い（X701）、空売り（X705）、指値の買い（X703。すぐには約定しない値段）
  toMinute(10);
  order({ code: 'X702', side: 'buy', qty: 300 }); order({ code: 'X704', side: 'buy' });
  order({ code: 'X701', side: 'buy', mg: true, open: true }); order({ code: 'X705', side: 'sell', mg: true, open: true });
  const lp = Math.floor(byCode('X703').price * 0.997); order({ code: 'X703', side: 'buy', type: 'lmt', price: lp, reserve: lp * 100 });
  const held = Object.keys(P().pos).sort().join(','), mp = Object.entries(P().mpos).map(([c, p]) => `${c}${p.side === 'buy' ? '買' : '売'}`).sort().join(',');
  result(held === 'X702,X704' && mp === 'X701買,X705売', `成行の約定：現物 ${held} ／ 信用 ${mp}`);
  const lmt = () => P().trades.some(t => t.code === 'X703' && t.kind === 'lmt');
  const ord = P().orders.some(o => o.code === 'X703');
  K.runDay(); K.closeModal();
  result(lmt() || !ord || P().orders.length === 0, `指値（${lp}円）：${lmt() ? '約定' : '約定せず大引けで失効'}（注文中 ${ord ? 'あり' : 'なし'} → 引けのあと ${P().orders.length}件）`);
  K.nextDay();
  // 決算：最初の60営業日のうちに、追加銘柄の7社とも決算を発表する
  for (let d = 1; d < 62; d++) nextMorning();
  // 倒産した銘柄は、倒産のお知らせのあとは決算を出さない（このシードでは X717 が前兆29日目・倒産35日目）
  const failed = K.G.extra.filter(s => s.dl && s.dl.B <= K.G.dayIndex).map(s => s.code), pre = K.G.extra.filter(s => s.ipo && s.ipo.day >= K.G.dayIndex - 1).map(s => s.code);
  const want = NX - failed.filter(c => !earnSeen.has(c)).length - pre.length;   // 上場前の新規上場は、まだ決算を出さない
  const earned = earnSeen.size, inCal = K.G.extra.every(s => s.nextEarn > K.G.dayIndex);
  result(earned === want && failed.every(c => !earnSeen.has(c) || K.G.news.filter(n => n.type === 'earn' && n.codes[0] === c).every(n => n.day < K.G._map[c].dl.B)) && inCal,
    `決算のお知らせ：追加銘柄 ${earned}/${NX}社${failed.length ? `（倒産した ${failed.join('・')} は、倒産のあと決算を出さない）` : ''}${pre.length ? `（上場前の ${pre.join('・')} は対象外）` : ''}（次の決算日も先に進んでいる：${inCal}）`);
  // 売り（現物 X704）・返済（信用 X701・X705）で、損益と税
  toMinute(5);
  const before = P().sells.length;
  order({ code: 'X704', side: 'sell' }); order({ code: 'X701', side: 'sell', mg: true, open: false }); order({ code: 'X705', side: 'buy', mg: true, open: false });
  const sold = P().sells.slice(before);
  const taxOk = Math.abs(P().taxYear - Math.max(0, P().realizedYear) * 0.20315) < 1e-6;
  result(sold.length === 3 && !Object.keys(P().mpos).length && taxOk, `売り・返済 ${sold.length}件（${sold.map(x => `${x.code} ${Math.round(x.pnl).toLocaleString()}円`).join(' / ')}）、今年の確定損益 ${Math.round(P().realizedYear).toLocaleString()}円、税 ${Math.round(P().taxYear).toLocaleString()}円（20.315%と一致：${taxOk}）`);
  K.runDay(); K.closeModal(); K.nextDay();
  // 配当：X702（3月・9月）を9月末の権利確定日まで持つ
  const div0 = P().divTotal;
  while (!(K.G.date >= '2026-10-02') && !K.G.ended) nextMorning();
  const ev = P().divTotal > div0;
  result(ev && P().pos.X702?.qty === 300, `配当：X702 を300株持って9月末をまたぐ → 受け取った配当（税引後。指値で買った X703 の分を含む） ${Math.round(P().divTotal - div0).toLocaleString()}円（X702 は1株 ${byCode('X702').div / 2}円）`);
  // セーブ・読み込み：保有・資産・追加銘柄が残る
  K.runDay(); K.closeModal();
  const text = K.saveText(), a0 = K.asset();
  const R = load(FILE, store()); setProfile(R, 6000, true); R.resume(text);
  const a1 = R.G.player.cash + Object.entries(R.G.player.pos).reduce((t, [c, p]) => t + p.qty * R.G._map[c].price, 0);
  result(R.G.extra.length === NX && R.G.player.pos.X702?.qty === 300 && Math.abs(a1 - a0) < 1e-6, `保存して読み込む：追加銘柄 ${R.G.extra.length}社、X702 ${R.G.player.pos.X702?.qty}株、資産 ${Math.round(a0).toLocaleString()} → ${Math.round(a1).toLocaleString()}円`);
}

// ---------- 7. 直前の段階との比較 ----------
if (PREV) {
  const K0 = start(PREV, 6000, true, 'free', 'normal', 1), keep = new Set(K0.G.stocks.concat(K0.G.extra || []).map(s => s.code));
  console.log(`\n7. ${PREV_NAME}完了時点にある${keep.size}銘柄が、${PREV_NAME}完了時点と同じか`);
  // cut = { コード: その日からあとは比べない日 }（倒産の前兆の日。今の script.js の日程）
  // 直前の段階にすでに倒産の仕組みがあれば、倒産する銘柄も全日比べる（ステップD1 以降）
  const prevDl = typeof load(PREV, store()).dlPlan === 'function';
  const KP = load(FILE, store()), cutOf = seed => (prevDl ? {} : Object.fromEntries(['X717', 'X718'].map(c => [c, KP.dlPlan(seed, c)?.F ?? Infinity])));
  const snapP = (K, cut = {}) => {
    const G = K.G, di = G.dayIndex, on = c => keep.has(c) && !(cut[c] <= di), all = G.stocks.concat(G.extra || []).filter(s => on(s.code));
    return hash({ s: all.map(s => [s.code, s.daily.at(-1) && bar(s.daily.at(-1)), s.intraday.map(bar)]), idx: G.market.idxDaily.at(-1), news: G.news.filter(n => n.day === di && !n.xn && !(n.codes || []).some(c => !on(c) && c[0] === 'X')).map(n => [n.time, n.text]) });   // 追加銘柄のニュース（xn。ステップE）は比べない
  };
  const histP = K => hash(K.G.stocks.concat(K.G.extra || []).filter(s => keep.has(s.code)).map(s => s.daily.map(bar)));
  const run = (file, scen, diff, seed, days) => { const K = start(file, 6000, true, scen, diff, seed), cut = cutOf(seed); const h = histP(K), out = []; for (let d = 0; d < days && !K.G.ended; d++) { K.runDay(); out.push(snapP(K, cut)); K.closeModal(); if (!K.G.ended) K.nextDay(); } return { h, out, n: K.G.extra.length }; };
  // 倒産が回す日数より後になるシード（全銘柄の全日を比べる）を2つ
  const safe = []; for (let s = 1; safe.length < 2; s++) { if (KP.dlPlan(s, 'X717').F > 300 && KP.dlPlan(s, 'X718').F > 300) safe.push(s); }
  for (const [scen, diff, seed, days] of [['year', 'normal', safe[0], 245], ['year', 'hard', safe[1], 245], ['year', 'normal', 2024, 245], ['storm', 'hard', 777, 60], ['free', 'easy', 99, 80], ['month', 'normal', 12345, 20]]) {
    const a = run(PREV, scen, diff, seed, days), b = run(FILE, scen, diff, seed, days), c = cutOf(seed);
    const ok = a.h === b.h && a.out.length === b.out.length && a.out.every((x, i) => x === b.out[i]);
    const note = prevDl ? (safe.includes(seed) ? '倒産なし' : '倒産する銘柄も含めて全銘柄') : safe.includes(seed) ? '倒産なし・全銘柄' : `X717 は${c.X717 < days ? `${c.X717}日目まで` : '全日'}・X718 は${c.X718 < days ? `${c.X718}日目まで` : '全日'}`;
    result(ok, `${scen}/${diff}/${seed} ${a.out.length}日  追加銘柄 ${a.n}→${b.n}社  過去60日${a.h === b.h ? '同じ' : 'ちがう'}  ${ok ? '全日同じ' : `${a.out.findIndex((x, i) => x !== b.out[i]) + 1}日目からズレ`}（${note}）`);
  }
  // 成行の小さな注文：どの銘柄も100万円分を成行で買い、あとで成行で売る。約定（株数・値段）と、その後の値動きが同じ
  const trade = file => {
    const K = start(file, 6000, true, 'year', 'normal', 2024, false, 1e8), G = () => K.G;
    const toMin = m => { while (G().phase === 'pre') K.tick(); while (G().phase === 'open' && G().minute < m) K.tick(); };
    const codes = G().stocks.concat(G().extra).map(s => s.code).filter(c => keep.has(c));
    for (let d = 0; d < 3; d++) {
      toMin(30); for (const c of codes) { const s = G()._map[c]; K.placeOrder({ code: c, side: 'buy', type: 'mkt', qty: Math.max(100, Math.floor(1e6 / s.price / 100) * 100), price: null, reserve: 0, mg: false }); }
      toMin(120); for (const c of codes) { const q = G().player.pos[c]?.qty; if (q) K.placeOrder({ code: c, side: 'sell', type: 'mkt', qty: q, price: null, reserve: 0, mg: false }); }
      K.runDay(); K.closeModal(); K.nextDay();
    }
    return { t: G().player.trades.filter(x => keep.has(x.code)).map(x => [x.code, x.side, x.qty, x.px, x.d, x.m]), cut: G().player.trades.length, ev: snapP(K) };
  };
  const a = trade(PREV), b = trade(FILE), same2 = JSON.stringify(a.t) === JSON.stringify(b.t);
  result(same2 && a.ev === b.ev, `成行の小さな注文（${keep.size}銘柄×100万円分の買いと売り×3日＝${a.t.length}件）：約定 ${same2 ? 'すべて同じ' : 'ちがう'}、その後の値動き ${a.ev === b.ev ? '同じ' : 'ちがう'}`);
}

// ---------- 8. 株主優待 ----------
console.log('\n8. 株主優待');
{
  const PD = '2026-08-31';   // X716（2・8月）の権利確定日（8月の最終営業日）
  const fresh = () => start(FILE, 6000, true, 'year', 'normal', 2024, false, 5e6);
  const toDate = (K, d) => { while (K.G.date < d) { K.runDay(); K.closeModal(); K.nextDay(); } };
  const toMin = (K, m) => { while (K.G.phase === 'pre') K.tick(); while (K.G.phase === 'open' && K.G.minute < m) K.tick(); };
  const buy = (K, o) => K.placeOrder({ type: 'mkt', qty: 100, price: null, reserve: 0, mg: false, ...o });
  const perkMsg = (K, code) => K.G.dayEvents.concat(K.G.last?.events || []).some(e => e.includes('株主優待') && e.includes(K.G._map[code].name));

  // (a) 現物200株：確定 → 翌朝に1,500円（株数に関係なく1回分）。課税なし
  const A = fresh(); toDate(A, PD); toMin(A, 10); buy(A, { code: 'X716', side: 'buy', qty: 200 });
  A.runDay();
  const P = A.G.player, s = A.G._map.X716, per = s.div / s.rec.length;
  result(P.pendingPerk === 1500 && perkMsg(A, 'X716') && P.perkTotal === 0, `(a) 現物200株で確定：pendingPerk = ${P.pendingPerk}円、お知らせ ${perkMsg(A, 'X716') ? 'あり' : 'なし'}、入金はまだ（perkTotal = ${P.perkTotal}）`);
  // 権利落ち：決算のない日なら、gap は配当の分＋優待相当額の半分の下げと同じ（決算の日は別の窓が足されるのでとばす）
  if (s.nextEarn - 60 !== A.G.dayIndex && s.nextEarn !== A.G.dayIndex) {
    const exp = Math.log(1 - (per + 1500 / 100 * 0.5) / s.price);
    result(Math.abs(s.gap - exp) < 1e-12, `(a) 権利落ちの下げ：gap = ${s.gap.toFixed(6)}（期待 ${exp.toFixed(6)}。配当${per}円＋優待${1500 / 100 * 0.5}円）`);
  } else console.log('       （この日は決算なので、権利落ちの式の確認はとばしました）');
  const tax0 = P.taxYear, real0 = P.realizedYear, cash0 = P.cash, exp = P.pendingDiv * (1 - 0.20315) + P.pendingPerk;
  A.closeModal(); A.nextDay();
  result(Math.abs(P.cash - cash0 - exp) < 1e-6 && P.perkTotal === 1500 && P.pendingPerk === 0 && P.taxYear === tax0 && P.realizedYear === real0, `(a) 翌朝の入金：現金 +${Math.round(P.cash - cash0).toLocaleString()}円（配当の税引後 ${Math.round(exp - 1500).toLocaleString()}円＋優待 1,500円）、perkTotal = ${P.perkTotal}、税の累計は変わらず`);

  // (b) 保存して読み込んでも、翌朝に入金される（確定した日の引けで保存）
  const B = fresh(); toDate(B, PD); toMin(B, 10); buy(B, { code: 'X716', side: 'buy', qty: 100 }); B.runDay();
  const text = B.saveText(), R = load(FILE, store()); setProfile(R, 6000, true); R.resume(text);
  result(R.G.player.perkTotal === 1500 && R.G.player.pendingPerk === 0, `(b) 確定した日の引けで保存→読み込み：翌朝に優待が入る（perkTotal = ${R.G.player.perkTotal}）`);

  // (c) 信用の買い建てだけ：優待は付かず、注意が出る。配当調整金は今までどおり
  const C = fresh(); toDate(C, PD); toMin(C, 10); buy(C, { code: 'X716', side: 'buy', qty: 200, mg: true, open: true }); C.runDay();
  const pc = C.G.player, noteC = C.G.dayEvents.concat(C.G.last.events).some(e => e.includes('対象外') && e.includes('株主優待'));
  result(pc.pendingPerk === 0 && noteC && pc.pendingDiv > 0, `(c) 信用の買い建てのみ：pendingPerk = ${pc.pendingPerk}、「対象外」の注意 ${noteC ? 'あり' : 'なし'}、配当調整金 ${Math.round(pc.pendingDiv)}円`);

  // (d) 確定日の引けまでに売ると付かない
  const D = fresh(); toDate(D, PD); toMin(D, 10); buy(D, { code: 'X716', side: 'buy', qty: 100 }); toMin(D, 100); buy(D, { code: 'X716', side: 'sell', qty: 100 }); D.runDay();
  result(D.G.player.pendingPerk === 0 && !perkMsg(D, 'X716'), `(d) 確定日の途中で売る：pendingPerk = ${D.G.player.pendingPerk}`);

  // (e) 確定月でない日・優待のない銘柄・年1回の銘柄
  const E = fresh(); toDate(E, '2026-09-30'); toMin(E, 10); buy(E, { code: 'X715', side: 'buy' }); buy(E, { code: 'X714', side: 'buy' }); buy(E, { code: 'X704', side: 'buy' }); E.runDay();
  result(E.G.player.pendingPerk === 5800 + 2200, `(e) 9月末：X715（年1回・9月）5,800円 ＋ X714（3・9月）2,200円 ＝ ${E.G.player.pendingPerk}円（優待のない X704 は対象外）`);
  E.closeModal(); E.nextDay();
  result(E.G.player.perkTotal === 8000, `(e) 翌朝：perkTotal = ${E.G.player.perkTotal}円`);
}

// ---------- 9. 低位株（X717・X718） ----------
console.log('\n9. 低位株：呼値1円・値幅制限・板・成行・指値・信用');
{
  const fresh = (cash = 5e6) => start(FILE, 6000, true, 'year', 'normal', 2024, false, cash);
  const toMin = (K, m) => { while (K.G.phase === 'pre') K.tick(); while (K.G.phase === 'open' && K.G.minute < m) K.tick(); };
  const day = K => { K.runDay(); K.closeModal(); K.nextDay(); };
  const ord = (K, o) => K.placeOrder({ type: 'mkt', qty: 100, price: null, reserve: 0, mg: false, ...o });
  const isInt = v => Number.isInteger(v);
  const evs = K => K.G.dayEvents.concat(K.G.last?.events || []);

  // (a) 呼値1円：過去60日と5日分の日足・分足、板の値段が、すべて整数。スプレッドは1〜2円
  const A = fresh(); for (let d = 0; d < 5; d++) day(A);
  toMin(A, 100);
  const pen = ['X717', 'X718'].map(c => A.G._map[c]);
  const allInt = pen.every(s => s.daily.every(b => [b.o, b.h, b.l, b.c].every(isInt)) && s.intraday.every(b => [b.o, b.h, b.l, b.c].every(isInt)));
  let spreads = new Set(), bookInt = true;
  for (let m = 100; m < 160; m++) { for (const s of pen) { const b = A.book(s); if (b.asks[0] && b.bids[0]) spreads.add(b.asks[0].p - b.bids[0].p); bookInt &&= b.asks.concat(b.bids).every(l => isInt(l.p)); } A.tick(); }
  result(allInt && bookInt && [...spreads].every(x => x === 1 || x === 2) && spreads.size === 2, `(a) 日足・分足・板の値段がすべて整数：${allInt && bookInt}、スプレッド ${[...spreads].sort().join('円・')}円`);
  // (b) 値幅制限：前日終値 ± 30円（下限1円）の整数
  const width = p => (p < 100 ? 30 : p < 200 ? 50 : p < 500 ? 80 : 100);   // script.js の LIMITS（500円未満まで）
  const limOk = pen.every(s => s.limUp === s.prevClose + width(s.prevClose) && s.limDn === Math.max(1, s.prevClose - width(s.prevClose)));
  result(limOk, `(b) 値幅制限（100円未満は±30円、100〜200円は±50円。下限1円）：${pen.map(s => `${s.code} 前日${s.prevClose}円 → ${s.limDn}〜${s.limUp}円`).join('、')}`);
  // 開始時の値段は表の値段（過去チャートの値段をそろえている）
  const P0 = fresh(); result(P0.G._map.X717.prevClose === 48 && P0.G._map.X718.prevClose === 88, `(b) 開始時の前日終値：X717 ${P0.G._map.X717.prevClose}円・X718 ${P0.G._map.X718.prevClose}円（表の値段）`);
  // (c) ストップ高：買いの板が消え、成行の買いは約定しない
  const s7 = A.G._map.X718; s7.shock = 5; A.tick();
  const n0 = A.G.player.trades.length; ord(A, { code: 'X718', side: 'buy' });
  result(s7.stop === 'up' && s7.price === s7.limUp && A.book(s7).asks.length === 0 && A.G.player.trades.length === n0, `(c) ストップ高（${s7.price}円）：売りの板 ${A.book(s7).asks.length}本、成行の買いは約定せず`);
  // (d) 成行と指値：約定の値段は整数
  const D = fresh(); day(D); toMin(D, 30);
  ord(D, { code: 'X717', side: 'buy', qty: 1000 }); ord(D, { code: 'X718', side: 'buy', qty: 1000 });
  const lp = D.G._map.X718.price - 1; ord(D, { code: 'X718', side: 'buy', type: 'lmt', price: lp, reserve: lp * 100 });
  D.runDay();
  const tr = D.G.player.trades, lm = tr.find(x => x.kind === 'lmt');
  result(tr.every(x => isInt(x.px)) && D.G.player.orders.length === 0, `(d) 成行 ${tr.filter(x => x.kind === 'mkt').map(x => `${x.code} ${x.px}円`).join('・')}、指値（${lp}円）${lm ? `約定 ${lm.px}円` : '約定せず大引けで失効'}`);
  D.closeModal(); D.nextDay();

  // (e) 信用の可否：X717 は空売り不可（新規売りは弾かれる）・買い建てと返済は通る
  const E = fresh(); day(E); toMin(E, 30);
  ord(E, { code: 'X717', side: 'sell', qty: 1000, mg: true, open: true });
  const noShort = !E.G.player.mpos.X717 && evs(E).some(e => e.includes('空売り') && e.includes('ジャパンディスプレ'));
  ord(E, { code: 'X717', side: 'buy', qty: 1000, mg: true, open: true });
  const bought = E.G.player.mpos.X717?.side === 'buy';
  ord(E, { code: 'X717', side: 'sell', qty: 1000, mg: true, open: false });
  result(noShort && bought && !E.G.player.mpos.X717, `(e) X717：新規売りは弾かれる ${noShort}、新規買い ${bought}、返済売り ${!E.G.player.mpos.X717}`);
  // (f) 保証金率50%：必要な保証金が建玉の50%、余力は50%で割る（30%の銘柄より少なく建てられる）
  ord(E, { code: 'X718', side: 'buy', qty: 10000, mg: true, open: true });
  const p8 = E.G.player.mpos.X718, m = E.marginStat(), r8 = E.marginRoom('X718'), r1 = E.marginRoom('X701');
  result(Math.abs(m.req - 0.5 * p8.qty * p8.px) < 1e-6 && Math.abs(r8 * 0.5 - r1 * 0.3) < 1e-3, `(f) X718 ${p8.qty}株：必要な保証金 ${Math.round(m.req).toLocaleString()}円（建玉の50%）、新規建て余力 X718 ${Math.round(r8).toLocaleString()}円 ／ 30%の銘柄 ${Math.round(r1).toLocaleString()}円`);
  // (g) 貸株料：X718 の売り建ては年3%、普通の銘柄は年1.1%
  const Gk = fresh(); day(Gk); toMin(Gk, 30);
  ord(Gk, { code: 'X718', side: 'sell', qty: 10000, mg: true, open: true }); ord(Gk, { code: 'X701', side: 'sell', qty: 100, mg: true, open: true });
  const q8 = Gk.G.player.mpos.X718, q1 = Gk.G.player.mpos.X701; Gk.runDay();
  const e8 = q8.qty * q8.px * 0.03 / 245, e1 = q1.qty * q1.px * 0.011 / 245;
  result(Math.abs(q8.cost - e8) < 1e-9 && Math.abs(q1.cost - e1) < 1e-9, `(g) 1日の貸株料：X718 ${q8.cost.toFixed(2)}円（建玉×3%÷245）、X701 ${q1.cost.toFixed(2)}円（×1.1%÷245）`);
  // (h) 追証と強制決済：現金40万円で X717 を建てられるだけ買い、ストップ安に張り付かせる → 追証 → 翌日の引けで強制決済
  const H = fresh(4e5); day(H); toMin(H, 30);
  const n717 = Math.floor(H.marginRoom('X717') / (H.G._map.X717.price * 1.05) / 100) * 100;
  ord(H, { code: 'X717', side: 'buy', qty: n717, mg: true, open: true });
  const has = H.G.player.mpos.X717?.qty;
  toMin(H, 299); H.G._map.X717.shock = -5; H.runDay();
  const call = !!H.G.mcall, ratio = H.marginStat().ratio;
  H.closeModal(); H.nextDay(); toMin(H, 299); H.G._map.X717.shock = -5; H.runDay();
  const settled = !H.G.player.mpos.X717 && evs(H).some(e => e.includes('強制決済'));
  result(has > 0 && call && settled, `(h) X717 ${has.toLocaleString()}株を信用買い → ストップ安で維持率 ${(ratio * 100).toFixed(1)}%・追証 ${call} → 翌日の引けで強制決済 ${settled}`);
}

// ---------- 10. 成行が板の深さを超えるとき（部分約定） ----------
console.log('\n10. 成行の部分約定と取り消し');
{
  const fresh = () => start(FILE, 6000, true, 'year', 'normal', 2024, false, 1e9);
  const toMin = (K, m) => { while (K.G.phase === 'pre') K.tick(); while (K.G.phase === 'open' && K.G.minute < m) K.tick(); };
  const ord = (K, o) => K.placeOrder({ type: 'mkt', price: null, reserve: 0, mg: false, ...o });
  const cutMsg = K => K.G.dayEvents.filter(e => e.includes('取り消しました') && e.includes('成行'));
  // (a) 30銘柄は、ふつうの初期資金（100万円）の全額を成行で買っても、全量が約定する
  const A = fresh(); toMin(A, 30);
  let full = 0, tried = 0; for (const s of A.G.stocks) { const q = Math.floor(1e6 / s.price / 100) * 100; if (!q) continue; tried++; const n = A.G.player.trades.length; ord(A, { code: s.code, side: 'buy', qty: q }); if (A.G.player.trades.at(-1)?.qty === q && A.G.player.trades.length === n + 1) full++; }
  result(full === tried && !cutMsg(A).length, `(a) 30銘柄に100万円分ずつ成行の買い（100株で100万円を超える${30 - tried}銘柄を除く）：全量約定 ${full}/${tried}、取り消し ${cutMsg(A).length}件`);
  // (b) 低位株の大きな買い：板の深さまで約定し、残りを取り消してお知らせ
  const B = fresh(); toMin(B, 30);
  const s7 = B.G._map.X717, depth = B.book(s7).asks.reduce((a, l) => a + l.q, 0);
  ord(B, { code: 'X717', side: 'buy', qty: 2000000 });
  const tb = B.G.player.trades.at(-1), mb = cutMsg(B);
  result(tb && tb.qty < 2000000 && tb.qty > depth && mb.length === 1, `(b) X717 に200万株の成行の買い：${tb.qty.toLocaleString()}株だけ約定（板の8本 ${depth.toLocaleString()}株＋その先8呼値）、平均 ${tb.px.toFixed(2)}円。お知らせ「${mb[0]}」`);
  // (c) 売りの側：X718 の大きな空売りも同じ
  ord(B, { code: 'X718', side: 'sell', qty: 2000000, mg: true, open: true });
  const tc = B.G.player.trades.at(-1), mc = cutMsg(B);
  result(tc.code === 'X718' && tc.side === 'sell' && tc.qty < 2000000 && mc.length === 2, `(c) X718 に200万株の成行の空売り：${tc.qty.toLocaleString()}株だけ約定、残りを取り消し（お知らせ ${mc.length - 1}件）`);
  // (d) ストップ高・安の値段に着いたら、残りは取り消す（値幅制限の値段より先では約定しない）
  const C = fresh(); toMin(C, 60);
  const s8 = C.G._map.X718; s8.price = s8.limUp - 2; s8.lp = Math.log(s8.price); s8.stop = null;
  ord(C, { code: 'X718', side: 'buy', qty: 2000000 });
  const td = C.G.player.trades.at(-1), md = cutMsg(C);
  const s5 = C.G._map.K605; s5.price = Math.round((s5.limDn + 0.3) * 10) / 10; s5.lp = Math.log(s5.price); s5.stop = null;
  ord(C, { code: 'K605', side: 'sell', qty: 2000000, mg: true, open: true });
  const te = C.G.player.trades.at(-1), me = cutMsg(C);
  result(td.qty < 2000000 && md.length === 1 && md[0].includes('値幅制限') && s8.price <= s8.limUp && te.code === 'K605' && te.qty < 2000000 && me.length === 2 && me[1].includes('値幅制限'),
    `(d) ストップ高の手前（X718 ${s8.limUp - 2}円）で200万株買い → ${td.qty.toLocaleString()}株（上限 ${s8.limUp}円まで）、ストップ安の手前（K605）で200万株空売り → ${te.qty.toLocaleString()}株。どちらも「値幅制限に届いた」で残りを取り消し`);
}

// ---------- 11. 倒産・上場廃止 ----------
console.log('\n11. 倒産・上場廃止（X717・X718）');
{
  const KP = load(FILE, store());
  const fresh = (seed, cash = 5e6, diff = 'normal') => start(FILE, 6000, true, 'year', diff, seed, false, cash);
  const toMin = (K, m) => { while (K.G.phase === 'pre') K.tick(); while (K.G.phase === 'open' && K.G.minute < m) K.tick(); };
  const ord = (K, o) => K.placeOrder({ type: 'mkt', qty: 100, price: null, reserve: 0, mg: false, ...o });
  const day = K => { K.runDay(); K.closeModal(); K.nextDay(); };
  const evs = K => K.G.dayEvents.concat(K.G.last?.events || []);
  let seed = 0; for (let s = 1; !seed; s++) { const q = KP.dlPlan(s, 'X717'); if (q.F <= 40) seed = s; }
  const p = KP.dlPlan(seed, 'X717');

  // (a) 段階とお知らせ。公式の発表（監理・倒産・整理・最終売買日・廃止）は全難易度で出る
  for (const diff of ['normal', 'easy', 'hard']) {
    const A = fresh(seed, 5e6, diff), s7 = () => A.G._map.X717, newsOf = {};
    let stopOk = true, stops = 0;
    while (A.G.dayIndex <= p.D) {
      const d = A.G.dayIndex; A.runDay();
      newsOf[d] = A.G.news.filter(n => n.day === d && n.codes.includes('X717')).map(n => n.text);
      if (d >= p.B && d < p.B + p.k) { stops++; const b = s7().daily.at(-1); if (!(b.c === s7().limDn && b.v === 0)) stopOk = false; }
      A.closeModal(); A.nextDay();
    }
    const has = (d, w) => (newsOf[d] || []).some(x => x.includes(w));
    const all = has(p.F, '観測記事') && has(p.M, '監理銘柄') && has(p.B, '民事再生') && has(p.S, '整理銘柄') && has(p.L, '最終売買日') && has(p.D, '上場廃止');
    const after = s7().delisted && !A.unlockedCodes().includes('X717') && !!A.G._map.X717 && s7().daily.at(-1).di === p.L && A.dlStage('X717') === 'delisted';
    result(all && stopOk && stops === p.k && after, `(a) ${diff}・シード${seed}：前兆${p.F}・監理${p.M}・倒産${p.B}（ストップ安${p.k}日：終値＝値幅の下限・出来高0）・整理${p.S}〜${p.L}・廃止${p.D}日目のお知らせ ${all}、廃止後はリストの外で日足は最終売買日まで ${after}`);
  }

  // (b) 現物と信用の買い建てを持ったまま最終売買日へ（forceDelist）。整理期間は信用の新規不可・現物は売買できる。注文は取り消し
  const B = fresh(2024); day(B); toMin(B, 30);
  ord(B, { code: 'X717', side: 'buy', qty: 10000 }); ord(B, { code: 'X717', side: 'buy', qty: 10000, mg: true, open: true });
  const avg = B.G.player.pos.X717.avg, mpx = B.G.player.mpos.X717.px, plan = B.forceDelist('X717', 2);
  B.runDay(); B.closeModal(); B.nextDay();
  const rz0 = B.G.player.realizedYear;
  while (B.G.dayIndex < plan.L) {
    if (B.G.dayIndex === plan.L - 1) B.G.sel = 'X717';
    const w = B.G.dayIndex === plan.L - 1 ? B.dlWarn('X717') : null; if (w != null) var warnPrev = w;
    day(B);
  }
  toMin(B, 30);
  const mq0 = B.G.player.mpos.X717.qty;
  ord(B, { code: 'X717', side: 'buy', qty: 1000, mg: true, open: true });
  const noNew = B.G.player.mpos.X717.qty === mq0 && evs(B).some(e => e.includes('整理銘柄のため'));
  const q0 = B.G.player.pos.X717.qty; ord(B, { code: 'X717', side: 'buy', qty: 100 }); const bought = B.G.player.pos.X717.qty === q0 + 100;
  ord(B, { code: 'X717', side: 'sell', qty: 100 }); const sold = B.G.player.pos.X717.qty === q0;
  const avgL = B.G.player.pos.X717.avg;   // 決済の直前の平均取得単価（整理期間に買い足した分を含む）
  B.placeOrder({ code: 'X717', side: 'sell', type: 'lmt', qty: 1000, price: B.G._map.X717.limUp, reserve: 0, mg: false });
  B.runDay();
  const P = B.G.player, s7 = B.G._map.X717, dlS = P.sells.filter(x => x.dl), cls = s7.dlPx;
  const cashPnl = (cls - avgL) * q0, dlCash = dlS.find(x => Math.abs(x.buyAvg - avgL) < 1e-9);
  const taxOk = Math.abs(P.taxYear - Math.max(0, P.realizedYear) * 0.20315) < 1e-6;
  result(warnPrev?.includes('明日が最終売買日'), `(b) 最終売買日の前日の注文パネルの注意：「${warnPrev}」`);
  result(noNew && bought && sold, `(b) 整理期間：信用の新規は弾かれる ${noNew}、現物の買い ${bought}・売り ${sold}`);
  result(!P.pos.X717 && !P.mpos.X717 && dlS.length === 2 && Math.abs(dlCash.pnl - cashPnl) < 1e-6 && P.orders.length === 0 && evs(B).some(e => e.includes('注文1件を、上場廃止のため取り消しました')) && taxOk,
    `(b) 終値${cls}円で決済：現物 ${q0.toLocaleString()}株 ${Math.round(dlCash.pnl).toLocaleString()}円（平均 ${avgL.toFixed(1)}円）・信用の買い建て ${Math.round(dlS.find(x => x !== dlCash).pnl).toLocaleString()}円（建値 ${mpx.toFixed(1)}円）、今年の確定損益 ${Math.round(rz0).toLocaleString()} → ${Math.round(P.realizedYear).toLocaleString()}円・税 ${Math.round(P.taxYear).toLocaleString()}円（式どおり ${taxOk}）、指値の取り消し`);
  // (c) 連勝のミッションは、廃止の決済を数えない（勝ち・勝ち・廃止の負け・勝ち → 3連勝）
  const prof = B.profile(); delete prof.missions.streak3;
  P.sells.push({ code: 'K101', name: 'test', pnl: 1, pct: .01, d: B.G.date, qty: 100 });
  const keepS = P.sells; P.sells = [{ pnl: 1 }, { pnl: 1 }, ...dlS, { pnl: 1 }]; B.sellMissions(1, .01, false, 1, false); P.sells = keepS;
  result(prof.missions.streak3 === true, `(c) 勝ち・勝ち・廃止の決済（負け）・勝ち → 3連勝のミッション ${prof.missions.streak3 ? '達成' : '未達成'}`);
  // (d) 選んでいた銘柄は、廃止の朝にリストの先頭へ。廃止の記録（D3 用：決済したあとの総資産）
  const aAfter = B.asset(); B.closeModal(); B.nextDay();
  const log = B.G.dlog.at(-1);
  result(B.G.sel !== 'X717' && log?.code === 'X717' && Math.abs(log.asset - aAfter) < 1e-6, `(d) 廃止の朝：選択中の銘柄 X717 → ${B.G.sel}、記録 ${JSON.stringify({ code: log.code, day: log.day, px: log.px, asset: Math.round(log.asset) })}`);

  // (e) 信用の買い建てで保証金を超える損 → 現金がマイナス（借金）のまま残る。建玉がなくなるので追証は解除、買付余力はマイナス
  const C = fresh(2024, 4e5); day(C); toMin(C, 30);
  const n717 = Math.floor(C.marginRoom('X717') / (C.G._map.X717.price * 1.05) / 100) * 100;
  ord(C, { code: 'X717', side: 'buy', qty: n717, mg: true, open: true });
  const cp = C.forceDelist('X717', 1); C.runDay(); C.closeModal(); C.nextDay();
  while (C.G.dayIndex < cp.L) day(C);
  C.runDay();
  const PC = C.G.player;
  result(PC.cash < 0 && !C.G.mcall && C.availCash() < 0 && evs(C).some(e => e.includes('借金')) && Math.abs(C.G.dlog.at(-1).asset - C.asset()) < 1e-6,
    `(e) 現金40万円で X717 を ${n717.toLocaleString()}株信用買い → 廃止で現金 ${Math.round(PC.cash).toLocaleString()}円（借金）、追証 ${C.G.mcall ? 'あり' : 'なし'}、買付余力 ${Math.round(C.availCash()).toLocaleString()}円、記録の総資産 ${Math.round(C.G.dlog.at(-1).asset).toLocaleString()}円`);
  // (f) 空売り（X718）は、同じ値段で買い戻して利益
  const D = fresh(2024); day(D); toMin(D, 30);
  ord(D, { code: 'X718', side: 'sell', qty: 10000, mg: true, open: true });
  const dpx = D.G.player.mpos.X718.px, dp = D.forceDelist('X718', 1); D.runDay(); D.closeModal(); D.nextDay();
  while (D.G.dayIndex < dp.L) day(D);
  D.runDay();
  const ds = D.G.player.sells.find(x => x.dl && x.code === 'X718');
  result(ds && ds.pnl > 0 && !D.G.player.mpos.X718 && D.G.dlog.at(-1).code === 'X718', `(f) X718 を ${dpx}円で1万株空売り → 廃止の終値 ${D.G._map.X718.dlPx}円で買い戻し、利益 ${Math.round(ds?.pnl || 0).toLocaleString()}円（X718 は「破産」の文面）`);

  // (g) 倒産の途中（前兆・監理・整理）で保存して読み込んでも、通しで遊んだのと同じ。(h) 同じシードを2回でも同じ
  const chain = saveDays => {
    let K = fresh(seed); day(K); toMin(K, 30); ord(K, { code: 'X717', side: 'buy', qty: 1000 }); ord(K, { code: 'X717', side: 'buy', qty: 1000, mg: true, open: true });
    K.runDay(); K.closeModal(); K.nextDay();
    while (K.G.dayIndex <= p.D + 1) {
      const d = K.G.dayIndex; K.runDay();
      if (saveDays.includes(d)) { const txt = K.saveText(); K = load(FILE, store()); setProfile(K, 6000, true); K.resume(txt); continue; }   // resume は翌営業日の朝から
      K.closeModal(); K.nextDay();
    }
    const G = K.G;
    return hash({ x: G._map.X717.daily.map(bar), all: G.stocks.concat(G.extra).map(s => s.daily.at(-1)?.c), cash: G.player.cash, sells: G.player.sells, news: G.news.map(n => n.text), dlog: G.dlog, sel: G.sel });
  };
  const h0 = chain([]), h1 = chain([]), hs = chain([p.F, p.M, p.S + 1]);
  result(h0 === h1, `(h) 同じシード（${seed}）を2回：${h0 === h1 ? '同じ' : 'ちがう'}`);
  result(h0 === hs, `(g) 前兆（${p.F}日目）・監理（${p.M}）・整理（${p.S + 1}）の引けで保存→読み込み：最後まで ${h0 === hs ? '同じ' : 'ちがう'}`);

  // (i) 確率：抽選の日程（猶予のあと1年以内に前兆が始まる割合）と、1年チャレンジ（245日）で廃止まで進む割合
  const N = 20000;
  for (const [c, want] of [['X717', .40], ['X718', .15]]) {
    let a = 0, b = 0; for (let s = 1; s <= N; s++) { const q = KP.dlPlan(s, c); if (q.F - 20 < 245) a++; if (q.L <= 244) b++; }
    result(Math.abs(a / N - want) < 0.015, `(i) ${c}：猶予のあと1年以内に前兆 ${(a / N * 100).toFixed(1)}%（目安 ${want * 100}%）、1年チャレンジで廃止まで ${(b / N * 100).toFixed(1)}%（${N.toLocaleString()}シード）`);
  }
  // 日程と実際の動きが一致するか（1年チャレンジを最後まで、廃止まで進むシードと進まないシード）
  const pick = (c, yes) => { for (let s = 1; ; s++) { const q = KP.dlPlan(s, c), o = KP.dlPlan(s, c === 'X717' ? 'X718' : 'X717'); if ((q.L <= 244) === yes && o.L > 244) return s; } };
  const sims = [['X717', pick('X717', true)], ['X717', pick('X717', false)], ['X718', pick('X718', true)]];
  const match = sims.map(([c, s]) => { const K = fresh(s); while (!K.G.ended) { K.runDay(); K.closeModal(); if (!K.G.ended) K.nextDay(); } return [c, s, KP.dlPlan(s, c).L <= 244, !!K.G._map[c].delisted]; });
  result(match.every(([, , a, b]) => a === b), `(i) 1年チャレンジを最後まで：${match.map(([c, s, a, b]) => `${c}・シード${s} 日程 ${a ? '廃止' : 'なし'}／実際 ${b ? '廃止' : 'なし'}`).join('、')}`);
}

// ---------- 12. 新規上場（X719・X720） ----------
console.log('\n12. 新規上場（X719・X720）');
{
  const KP = load(FILE, store());
  const fresh = (seed, cash = 5e6) => start(FILE, 6000, true, 'year', 'normal', seed, false, cash);
  const toMin = (K, m) => { while (K.G.phase === 'pre') K.tick(); while (K.G.phase === 'open' && K.G.minute < m) K.tick(); };
  const ord = (K, o) => K.placeOrder({ type: 'mkt', qty: 100, price: null, reserve: 0, mg: false, ...o });
  const day = K => { K.runDay(); K.closeModal(); K.nextDay(); };
  const evs = K => K.G.dayEvents.concat(K.G.last?.events || []);
  const width = p => { for (const [b, w] of [[100, 30], [200, 50], [500, 80], [700, 100], [1000, 150], [1500, 300], [2000, 400], [3000, 500], [5000, 700], [7000, 1000], [10000, 1500]]) if (p < b) return w; return 3000; };

  // (a) 通常の上場日（X719、シード3 ＝ 前身の X717 は倒産しない）
  const seed = 3, A = fresh(seed), s = () => A.G._map.X719, x = s().ipo, r0 = s().r.s;
  while (A.G.dayIndex < x.day - 1) day(A);
  A.runDay();   // 上場の前日の引け
  const preOk = r0 === s().r.s && s().daily.length === 0 && !A.unlockedCodes().includes('X719') && A.unlockedCodes().length === 48;
  A.closeModal(); A.nextDay();   // 上場日の朝
  const pre = [s().limDn, s().limUp];
  toMin(A, 0);
  const op = { price: s().price, lim: [s().limDn, s().limUp] };
  A.runDay();
  const nw = A.G.news.filter(n => n.codes.includes('X719')).map(n => [n.day, n.time, n.text]);
  const annOk = nw.some(([d, , t]) => d === x.day - 10 && t.includes('上場承認')) && nw.some(([d, tm, t]) => d === x.day && tm === '8:00' && t.includes('新規上場') && !t.includes('後継')) && nw.some(([d, tm, t]) => d === x.day && tm === '9:00' && t.includes('初値'));
  result(preOk, `(a) シード${seed}：X719 の上場日 ${x.day}日目（前倒しなし）。上場の前日まで、リストに出ず（48銘柄）日足0本、専用乱数は1つも引かない`);
  result(annOk && !nw.some(([d, , t]) => t.includes('決算') && d <= x.day), `(a) お知らせ：承認 ${x.day - 10}日目、速報 ${x.day}日目 8:00、初値 9:00（前身の話は出ない）。上場日までに決算は出ない`);
  result(op.price === x.open && Math.abs(pre[1] - x.px * 2.3) <= 1 && Math.abs(pre[0] - x.px * 0.75) <= 1 && op.lim[0] === Math.max(1, x.open - width(x.open)) && op.lim[1] === x.open + width(x.open),
    `(a) 公開価格 ${x.px}円・初値 ${x.open}円（${((x.open / x.px - 1) * 100).toFixed(1)}%）。寄り付き前の気配の範囲 ${pre[0]}〜${pre[1]}円（0.75〜2.3倍）、初値のあとは ${op.lim[0]}〜${op.lim[1]}円（初値±${width(x.open)}円）`);
  A.closeModal(); A.nextDay();
  const w2 = width(s().prevClose);
  result(s().limUp === s().prevClose + w2 && A.ipoStage('X719') === 'new', `(a) 2日目：前日終値 ${s().prevClose}円 → 値幅 ±${w2}円（通常）。「新規上場（N日目）」の表示の期間`);
  // (b) 信用の制限
  const res = {};
  for (const k of [1, 4, 5, 19, 20]) {
    while (A.G.dayIndex < x.day + k) day(A);
    toMin(A, 30);
    const b0 = !!A.G.player.mpos.X719; ord(A, { code: 'X719', side: 'buy', mg: true, open: true }); const buyOk = !b0 && !!A.G.player.mpos.X719;
    if (A.G.player.mpos.X719) ord(A, { code: 'X719', side: 'sell', mg: true, open: false });   // すぐ返済（返済はいつでもできる）
    const back = !A.G.player.mpos.X719;
    ord(A, { code: 'X719', side: 'sell', mg: true, open: true }); const sellOk = A.G.player.mpos.X719?.side === 'sell';
    if (sellOk) ord(A, { code: 'X719', side: 'buy', mg: true, open: false });
    res[k] = [buyOk, sellOk, back, evs(A).some(e => e.includes('上場から'))];
    A.runDay(); A.closeModal(); A.nextDay();
  }
  const mgOk = !res[1][0] && !res[1][1] && !res[4][0] && res[5][0] && !res[5][1] && res[19][0] && !res[19][1] && res[20][0] && res[20][1] && res[1][3] && Object.values(res).every(r => r[2]);
  result(mgOk, `(b) 信用の新規：上場から ${Object.entries(res).map(([k, [b, se]]) => `${k}営業日目 買い${b ? '○' : '×'}・売り${se ? '○' : '×'}`).join('、')}（不可のときは理由を出す。返済はいつでもできる）`);
  // (c) 決算は上場日より後だけ
  while (A.G.dayIndex < x.day + 70) day(A);
  const earn = A.G.news.filter(n => n.type === 'earn' && n.codes[0] === 'X719');
  result(earn.length >= 1 && earn.every(n => n.day > x.day), `(c) X719 の決算：${earn.map(n => n.day + '日目').join('・')}（上場日 ${x.day}日目より後だけ）`);

  // (d) 前倒し（forceDelist）。前身の廃止日の5〜15営業日後。承認は前倒しが決まった翌朝（10営業日を切るとき）
  const D = fresh(seed); day(D);
  const dp = D.forceDelist('X717', 1), x9 = D.G._map.X719.ipo, base9 = x9.base;
  while (D.G.dayIndex <= dp.L) day(D);
  const off = x9.day - (dp.L + 1);
  while (D.G.dayIndex <= x9.day) day(D);
  const dn = D.G.news.filter(n => n.codes.includes('X719'));
  const annDay = Math.max(x9.day - 10, dp.L + 1);
  const early = x9.early && off >= 5 && off <= 15 && x9.day < base9 && dn.some(n => n.text.includes('上場承認') && n.day === annDay) && dn.some(n => n.text.includes('後継として') && n.day === x9.day) && D.unlockedCodes().includes('X719');
  result(early, `(d) X717 を ${dp.L + 1}日目に廃止 → X719 の上場日 ${base9}日目 → ${x9.day}日目（廃止日の${off}営業日後）。承認 ${annDay}日目、速報に「後継として前倒し」`);
  const E = fresh(seed); const x20 = E.G._map.X720.ipo;
  while (E.G.dayIndex < x20.day + 1) day(E);
  const ep = E.forceDelist('X718', 1), d20 = x20.day;
  while (E.G.dayIndex <= ep.L) day(E);
  result(x20.day === d20 && !x20.early, `(d) X720 が ${d20}日目に上場したあとで X718 が ${ep.L + 1}日目に廃止 → 前倒しなし`);
  const F = fresh(seed); day(F); const fp = F.forceDelist('X718', 1), y20 = F.G._map.X720.ipo;
  while (F.G.dayIndex <= fp.L) day(F);
  result(y20.early && y20.day - (fp.L + 1) >= 5 && y20.day - (fp.L + 1) <= 15, `(d) X718 を ${fp.L + 1}日目に廃止 → X720 の上場日 ${y20.base}日目 → ${y20.day}日目`);
  // 自然に倒産するシードで、日程の関数（ipoSchedule）と実際の上場日が一致する
  let ns = 0; for (let sd = 1; !ns; sd++) { const q = KP.ipoSchedule(sd, 'X719'); if (q.early && q.day < 120) ns = sd; }
  const NSd = fresh(ns), q = KP.ipoSchedule(ns, 'X719');
  while (NSd.G.dayIndex <= q.day) day(NSd);
  result(NSd.G._map.X719.ipo.day === q.day && NSd.G._map.X719.ipo.early && NSd.G._map.X719.daily.length > 0, `(d) シード${ns}（X717 が自然に倒産）：X719 の上場日 ${q.base} → ${NSd.G._map.X719.ipo.day}日目（日程の関数では ${q.day}日目）`);

  // (e) 途中のセーブと、同じシードを2回
  const chain = (sd, saveDays, force) => {
    let K = fresh(sd); day(K); if (force) K.forceDelist('X717', 1);
    while (K.G.dayIndex <= K.G._map.X719.ipo.day + 6) {
      const d = K.G.dayIndex; K.runDay();
      if (saveDays.includes(d)) { const txt = K.saveText(); K = load(FILE, store()); setProfile(K, 6000, true); K.resume(txt); continue; }
      K.closeModal(); K.nextDay();
    }
    const G = K.G, y = G._map.X719;
    return hash({ y: y.daily.map(bar), ipo: y.ipo, all: G.stocks.concat(G.extra).map(s => s.daily.at(-1)?.c ?? null), news: G.news.map(n => n.text), cash: G.player.cash });
  };
  const xd = x.day;
  const h0 = chain(seed, []), h1 = chain(seed, []), hs = chain(seed, [xd - 5, xd - 1, xd, xd + 4]);
  result(h0 === h1, `(e) 同じシード（${seed}）を2回：${h0 === h1 ? '同じ' : 'ちがう'}`);
  result(h0 === hs, `(e) 上場の5日前・前日（上場日の朝から再開）・上場日・上場から5営業日目の引けで保存→読み込み：最後まで ${h0 === hs ? '同じ' : 'ちがう'}`);
  const K0 = fresh(seed); day(K0); const fq = K0.forceDelist('X717', 1);
  const f0 = chain(seed, [], true), fs = chain(seed, [fq.L, fq.L + 3], true);
  result(f0 === fs, `(e) 前倒しが決まった日（前身の最終売買日 ${fq.L}日目）と、その3日後の引けで保存→読み込み：最後まで ${f0 === fs ? '同じ' : 'ちがう'}`);

  // (f) netAsset() と、まとめる前の式の総資産が完全に同じ
  const N = fresh(2024); let same = 0, total = 0;
  for (let d = 0; d < 30; d++) {
    toMin(N, 60);
    if (d % 3 === 0) { ord(N, { code: 'X702', side: 'buy', qty: 300 }); ord(N, { code: 'K201', side: 'buy', qty: 200, mg: true, open: true }); ord(N, { code: 'X705', side: 'sell', qty: 100, mg: true, open: true }); }
    for (let m = 0; m < 5; m++) { toMin(N, 60 + m * 40); total++; if (N.netAsset() === N.assetOld()) same++; }
    N.runDay(); total++; if (N.netAsset() === N.assetOld()) same++; N.closeModal(); N.nextDay();
  }
  result(same === total, `(f) netAsset() と旧式の総資産：${same}/${total} 回で完全に一致（現物・信用の買い建て・売り建てあり）`);

  // (g) 分布（2万シード、日程の関数 ipoSchedule）
  const NS = 20000;
  for (const [c, lo, hi] of [['X719', 60, 140], ['X720', 120, 200]]) {
    const days = [], baseIn = { n: 0 }; let adv = 0, inYear = 0, up = 0, rsum = 0, minB = 1e9, maxB = 0, advInYear = 0;
    for (let sd = 1; sd <= NS; sd++) {
      const q = KP.ipoSchedule(sd, c); days.push(q.day); minB = Math.min(minB, q.base); maxB = Math.max(maxB, q.base);
      if (q.early) adv++; if (q.day <= 244) { inYear++; if (q.early) advInYear++; }
      if (q.open >= q.px) up++; rsum += q.open / q.px;
    }
    days.sort((a, b) => a - b);
    const pct = v => (v / NS * 100).toFixed(1) + '%';
    result(minB === lo && maxB === hi && Math.abs(up / NS - 0.8) < 0.015,
      `(g) ${c}：通常の上場日 ${minB}〜${maxB}日目、実際の上場日の中央値 ${days[NS / 2]}日目（10%点 ${days[NS / 10]}・90%点 ${days[NS * 9 / 10]}）。前倒し ${pct(adv)}。1年チャレンジ（245日）で上場まで進む ${pct(inYear)}（うち前倒し ${pct(advInYear)}）。初値 上がり ${pct(up)}・公募割れ ${pct(NS - up)}、平均 公開価格の${(rsum / NS).toFixed(3)}倍`);
  }
}

console.log(fails ? `\n${fails}件の確認が通りませんでした。` : '\nすべての確認が通りました。');
process.exit(fails ? 1 : 0);
