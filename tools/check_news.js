// 当時のニュースの検査: node tools/check_news.js <2020|2026> [断片ファイル ...]
// 断片ファイルは「配列の要素だけ」のファイル。なければ data/news20XX.js 本体を検査する。
const fs = require('fs');
const path = require('path');
const yr = process.argv[2];
const files = process.argv.slice(3);
const cfg = { 2020: ['news2020', 'NEWS2020', 'corona2020', 'CORONA2020', 'corona2020_extra', 'CORONA2020_EXTRA', 'corona2020_ipo', 'CORONA2020_IPO'],
              2026: ['news2026', 'NEWS2026', 'recent', 'RECENT', 'recent_extra', 'RECENT_EXTRA', 'recent_ipo', 'RECENT_IPO'] }[yr];
if (!cfg) { console.log('usage: check_news.js 2020|2026 [files]'); process.exit(1); }
const D = p => path.join(__dirname, '..', 'data', p + '.js');
const ld = (f, v) => new Function(fs.readFileSync(D(f), 'utf8') + ';return ' + v)();
const base = ld(cfg[2], cfg[3]), ex = ld(cfg[4], cfg[5]), ipo = ld(cfg[6], cfg[7]);
const dates = base.dates, first = dates[0], last = dates[dates.length - 1];
const codes = new Set([base, ex, ipo].flatMap(o => (o.stocks || []).map(x => x.code)));
const existing = ld(cfg[0], cfg[1]);
const exKey = new Set(existing.map(n => n.date + '|' + n.headline));
let bad = 0;
const err = (n, m) => { bad++; console.log('[NG]', n.date, (n.headline || '').slice(0, 30), m); };
function check(src, label) {
  const lines = src.split('\n');
  let urls = 0, arr = [];
  const body = src.replace(/^\s*\/\/.*$/gm, '');
  try { arr = new Function('return [' + body + ']')(); } catch (e) { console.log('[NG] 構文', label, e.message); bad++; return; }
  // 出典: 各 { date の直前の連続した // http 行を数える
  const srcCount = []; let c = 0;
  for (const l of lines) {
    if (/^\s*\/\/\s*https?:/.test(l)) c++;
    else if (/^\s*\{\s*date:/.test(l)) { srcCount.push(c); c = 0; }
    else if (l.trim() === '') c = 0;
  }
  const seen = new Set();
  arr.forEach((n, i) => {
    if (!/^20\d\d-\d\d-\d\d$/.test(n.date) || (label !== 'main' && n.date < first) || n.date >= last) err(n, '日付が範囲外 ' + n.date);
    if (!n.headline) err(n, '見出しなし');
    if (!Array.isArray(n.codes) || (!n.codes.length && label !== 'main') || n.codes.some(k => !codes.has(k))) err(n, 'コード不正 ' + JSON.stringify(n.codes));
    if (![1, 2, 3].includes(n.importance)) err(n, 'importance');
    if (!['fact', 'report', 'rumor'].includes(n.type)) err(n, 'type');
    if (srcCount[i] !== undefined && srcCount[i] < 2 && label !== 'main') err(n, '出典が2つ未満');
    const k = n.date + '|' + n.headline;
    if (seen.has(k) || (label !== 'main' && exKey.has(k))) err(n, '重複');
    seen.add(k);
  });
  console.log(label, arr.length + '件');
  return arr;
}
if (files.length) {
  const all = [];
  files.forEach(f => { const a = check(fs.readFileSync(f, 'utf8'), path.basename(f)); if (a) all.push(...a); });
  const cnt = {}; all.forEach(n => n.codes.forEach(k => cnt[k] = (cnt[k] || 0) + 1));
  console.log('銘柄別', JSON.stringify(cnt));
  const i3 = all.filter(n => n.importance === 3).length;
  console.log('importance3 =', i3, '/', all.length);
} else {
  const s = fs.readFileSync(D(cfg[0]), 'utf8');
  check(s.slice(s.indexOf('[') + 1, s.lastIndexOf('];')), 'main');
}
console.log(bad ? bad + '件の問題' : '[OK]');
process.exit(bad ? 1 : 0);
