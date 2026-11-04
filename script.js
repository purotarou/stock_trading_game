(() => {
'use strict';
/* ===================== 小道具 ===================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const yen = n => Math.round(n).toLocaleString('ja-JP');
const px = n => (Math.abs(n % 1) > 1e-9 ? n.toLocaleString('ja-JP', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : yen(n));
const sgn = n => (n > 0 ? '+' : n < 0 ? '−' : '±');
const yenS = n => sgn(Math.round(n)) + Math.abs(Math.round(n)).toLocaleString('ja-JP');
const pxS = n => { n = Math.round(n * 10) / 10; return sgn(n) + px(Math.abs(n)); };   // 値段の差（0.1円まで）
const pctS = x => { const v = Math.round(x * 10000) / 100; return sgn(v) + Math.abs(v).toFixed(2) + '%'; };
const cls = x => (x > 1e-9 ? 'up' : x < -1e-9 ? 'down' : 'flat');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const term = (k, label) => `<button class="term" data-term="${esc(k)}">${esc(label || k)}</button>`;
const fmtCap = v => (v >= 1e12 ? (v / 1e12).toFixed(2) + '兆円' : Math.round(v / 1e8).toLocaleString('ja-JP') + '億円');

/* ===================== 乱数（シード付き） ===================== */
const RNG = {
  s: 1, spare: null,
  next() { const a = (this.s = (this.s + 0x6D2B79F5) | 0); let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; },
  normal() { // Box–Muller 法
    if (this.spare !== null) { const v = this.spare; this.spare = null; return v; }
    let u = 0; while (u === 0) u = this.next(); const v = this.next();
    const r = Math.sqrt(-2 * Math.log(u)); this.spare = r * Math.sin(2 * Math.PI * v); return r * Math.cos(2 * Math.PI * v);
  },
  pick(a) { return a[Math.floor(this.next() * a.length)]; },
};
function hash01(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; return (h >>> 0) / 4294967296; }

/* ===================== 定数とデータ ===================== */
const MIN_PER_DAY = 300, DAYS = 245, DT = 1 / (DAYS * MIN_PER_DAY);
const MKT_SIG = 0.17, IDX_BASE = 30000, TAX = 0.20315;
const START_DATE = '2026-04-01';

const SECTORS = {
  tech:   { name: 'テクノロジー', short: 'IT',     sig: .31, ss: .13, beta: 1.3, mu: .10, per: 32, pbr: 5.0, jump: 2 },
  auto:   { name: '自動車・機械', short: '自動車', sig: .23, ss: .10, beta: 1.1, mu: .05, per: 11, pbr: 1.1, jump: 2 },
  bank:   { name: '銀行・金融',   short: '金融',   sig: .21, ss: .10, beta: 1.0, mu: .04, per: 10, pbr: 0.8, jump: 1.5 },
  food:   { name: '食品・日用品', short: '食品',   sig: .14, ss: .06, beta: .6,  mu: .04, per: 22, pbr: 2.2, jump: 1 },
  game:   { name: 'ゲーム・エンタメ', short: 'エンタメ', sig: .32, ss: .13, beta: 1.1, mu: .07, per: 24, pbr: 3.5, jump: 3 },
  growth: { name: '新興グロース', short: '新興',   sig: .50, ss: .17, beta: 1.5, mu: .08, per: 60, pbr: 8.0, jump: 5 },
};
// 社名は実在の企業をもじった架空の会社（値動き・ニュースはすべて作りもの）
// [コード, 社名, 業種, 株価, 発行済株式数(百万株), 配当利回り, 権利確定月, 解放ランク, 値動きの倍率, 紹介]
const DEFS = [
  ['K101','フジツー','tech',5820,180,.008,[3,9],1,1.0,'ITサービスと業務ソフト・クラウドの大手。'],
  ['K102','ソフトパンクG','tech',12400,60,0,[],2,1.25,'AI企業に大きく投資する投資会社。'],
  ['K103','東京エレクトリック','tech',8350,120,.012,[3,9],3,1.2,'半導体の製造装置をつくる。'],
  ['K104','さくらインターネッツ','tech',3260,90,.004,[6,12],3,1.1,'ネット通販向けにサーバーを貸し出す。'],
  ['K105','NTTドコマ','tech',2140,900,.035,[3,9],4,.7,'携帯電話と光回線の通信会社。'],
  ['K201','トヨダ自動車','auto',2480,1500,.028,[3,9],1,1.0,'国内大手の自動車メーカー。輸出が多い。'],
  ['K202','ファヌッグ','auto',4310,140,.018,[3,9],2,1.15,'工場用ロボットの専門メーカー。'],
  ['K203','三ツ菱重工','auto',1865,350,.03,[3,9],3,1.0,'船や発電設備をつくる重工業。'],
  ['K204','パナソミック','auto',3120,260,.022,[3,9],3,1.05,'モーターと家電の電機メーカー。'],
  ['K205','デンゾー','auto',1520,200,.031,[3,9],4,1.0,'自動車の部品を供給する。'],
  ['K301','みずぽFG','bank',1735,2400,.038,[3,9],2,1.0,'全国に支店を持つ大手銀行グループ。'],
  ['K302','SBY証券','bank',920,700,.045,[3,9],2,1.25,'ネット取引で個人投資家に強い証券会社。'],
  ['K303','第一生明HD','bank',2860,500,.034,[3,9],3,.95,'生命保険の大手。'],
  ['K304','三井往友信託','bank',1290,600,.036,[3,9],4,.9,'資産運用と信託の銀行。'],
  ['K305','ほっかい銀行','bank',645,300,.041,[3,9],4,1.1,'北海道の地方銀行。'],
  ['K401','日請食品','food',3840,220,.022,[3,9],1,1.0,'即席めんと冷凍食品の大手。'],
  ['K402','武円薬品','food',5210,300,.027,[3,9],2,1.05,'国内最大級の製薬会社。'],
  ['K403','伊藤囲','food',2470,250,.024,[6,12],3,1.0,'お茶と清涼飲料のメーカー。'],
  ['K404','花玉','food',4630,180,.021,[6,12],3,.95,'洗剤やシャンプーをつくる。'],
  ['K405','三井物算','food',1980,400,.03,[3,9],4,1.1,'資源から食品まで扱う総合商社。'],
  ['K501','任天賞','game',6720,140,.009,[3,9],2,1.0,'人気シリーズを持つゲーム会社。'],
  ['K502','KADOGAWA','game',2350,90,.015,[3,9],2,.95,'漫画・小説の出版とアニメ・ゲームを手がける。'],
  ['K503','東映アニメーショソ','game',1480,160,.012,[6,12],3,1.1,'アニメ映画の制作会社。'],
  ['K504','ミクシー','game',8900,40,.005,[3,9],4,1.2,'スマホゲームの開発会社。'],
  ['K505','エイベッグス','game',1190,120,.018,[3,9],4,1.0,'音楽ライブとアイドル事務所。'],
  ['K601','そーぜいG','growth',742,80,0,[],3,1.1,'新薬を研究する創薬ベンチャー。まだ赤字。'],
  ['K602','iスペーズ','growth',1385,50,0,[],3,1.15,'月面着陸船を開発する宇宙ベンチャー。まだ赤字。'],
  ['K603','ユーグレヌ','growth',456,70,0,[],4,.95,'微細藻類（ミドリムシ）の食品をつくる新興企業。まだ赤字。'],
  ['K604','パワーエッグス','growth',1620,45,0,[],4,1.0,'大型の蓄電池を開発するベンチャー。'],
  ['K605','メルカル','growth',288,120,0,[],4,.9,'フリマアプリを運営。'],
];
// 追加銘柄（ランダム相場）。新しく始めたゲームはランクに関係なく最初から持ち、ランク7になるまで隠す（isOpen。途中でランク7になれば、その場で出る）。G.stocks には入れず G.extra に持ち、
// 乱数は銘柄ごとの専用のもの（s.r）だけを使う。市場・業種の動きは30銘柄で引いた値を読むだけなので、30銘柄・指数・ニュースは変わらない
// shares = 発行済株式数(百万株)、dy = 配当利回り、rec = 権利確定月、sm = 値動きの倍率、kind = 種類（KINDS）
// p = 種類の既定値（KINDS[kind].p）を、この銘柄だけ上書きするもの（loss = 赤字、per = PER の基準値も使える）、perk = 株主優待 { m: 権利確定月, yen: 1回の現金相当（100株以上の現物）, text: 内容 }
// mg = 信用取引の設定 { short: 空売りできるか, rate: 委託保証金率, lend: 貸株料の年率 }（ないものは MARGIN の値）、
// fin = 財務 { na: 純資産(億円), er: 自己資本比率, gc: 継続企業の前提に関する注記 }（表示と、あとの倒産の仕組み用）
// ipo = 新規上場 { from: 前身の銘柄（廃止されたら上場を前倒し）, lo〜hi: 通常の上場日の範囲（営業日目） }。price は使わない（公開価格は ipoPlan）
const XRANK = 7;
// 種類ごとの性格。bm = 業種の市場ベータにかける倍率（暴落・市場ニュースへの感応度）、ssm = 業種の動きと業種ニュースにかける倍率、
// esd = 決算の驚きの大きさ（標準偏差。ないものは新興 .2・それ以外 .06）、liq = 流動性（出来高・板の厚さ）の倍率。ないものは 1
const KINDS = {
  normal: { name: '普通', p: {} },
  growth: { name: '新興', p: {} },
  div:    { name: '高配当', p: { bm: .6, ssm: .8, esd: .03, liq: 1 } },
  cyc:    { name: '景気敏感', p: { bm: 1.25, ssm: 1.4, esd: .10, liq: 1.3 } },
  perk:   { name: '優待', p: { bm: 1, ssm: 1, esd: .06, liq: .6 } },
  penny:  { name: '低位', p: { esd: .12 } },   // 低位株：呼値1円（s.tick1）。流動性・信用の設定は銘柄ごと
  ipo:    { name: '新規', p: { esd: .2, liq: 1.5 } },   // 新規上場：上場日・公開価格・初値は ipoPlan
};
const PERK_LOT = 100, PERK_DROP = 0.5;   // 優待に必要な株数（現物）、権利落ちで下がる分（優待相当額の何割を配当の下げに足すか）
const XDEFS = [
  { code: 'X701', name: 'NEG', sector: 'tech', price: 2650, shares: 270, dy: .012, rec: [3, 9], sm: 1.0, kind: 'normal', desc: '通信機器とITシステムの老舗。' },
  { code: 'X702', name: 'ホンタ技研', sector: 'auto', price: 1580, shares: 1300, dy: .035, rec: [3, 9], sm: 1.05, kind: 'normal', desc: 'バイクと自動車のメーカー。' },
  { code: 'X703', name: '東京海土HD', sector: 'bank', price: 3150, shares: 600, dy: .03, rec: [3, 9], sm: .9, kind: 'normal', desc: '損害保険の大手。' },
  { code: 'X704', name: 'アサビGHD', sector: 'food', price: 2060, shares: 500, dy: .022, rec: [6, 12], sm: .9, kind: 'normal', desc: 'ビールと清涼飲料のメーカー。' },
  { code: 'X705', name: 'バンダイナムゴ', sector: 'game', price: 3420, shares: 650, dy: .016, rec: [3, 9], sm: 1.0, kind: 'normal', desc: 'おもちゃとゲーム・アニメのグッズをつくる。' },
  { code: 'X706', name: 'マネーフォワート', sector: 'growth', price: 4180, shares: 55, dy: 0, rec: [], sm: 1.0, kind: 'growth', desc: '家計簿アプリと会計ソフト。黒字になったばかり。' },
  { code: 'X707', name: 'コナニG', sector: 'game', price: 5240, shares: 135, dy: .012, rec: [3, 9], sm: 1.05, kind: 'normal', desc: 'ゲームとスポーツクラブを運営する。' },
  // ステップB：高配当2・景気敏感4・優待3
  { code: 'X708', name: 'ケイディー通信', sector: 'tech', price: 2720, shares: 2200, dy: .042, rec: [3, 9], sm: .65, kind: 'div', p: { bm: .5 }, desc: '携帯電話とネット回線の大手。配当が安定している。' },
  { code: 'X709', name: 'オリクス', sector: 'bank', price: 2240, shares: 1100, dy: .051, rec: [3, 9], sm: .75, kind: 'div', desc: 'リース・保険・不動産などを手がける金融グループ。配当が手厚い。' },
  { code: 'X710', name: 'コマッツ', sector: 'auto', price: 4050, shares: 950, dy: .03, rec: [3, 9], sm: 1.4, kind: 'cyc', desc: '建設機械の大手。世界の景気で業績が大きく変わる。' },
  { code: 'X711', name: 'ニッポン製鋼', sector: 'auto', price: 2380, shares: 950, dy: .034, rec: [3, 9], sm: 1.3, kind: 'cyc', desc: '鉄をつくる大手。景気と鉄の値段で業績が上下する。' },
  { code: 'X712', name: 'ムラタ電子', sector: 'tech', price: 3860, shares: 640, dy: .022, rec: [3, 9], sm: 1.3, kind: 'cyc', desc: 'スマホや車に使う電子部品の大手。需要の波が大きい。' },
  { code: 'X713', name: '大輪証券G', sector: 'bank', price: 1180, shares: 1400, dy: .026, rec: [3, 9], sm: 1.5, kind: 'cyc', desc: '大手の証券会社。株式相場が良いと儲かる。' },
  { code: 'X714', name: 'ゼンショク', sector: 'food', price: 2980, shares: 150, dy: .009, rec: [3, 9], sm: 1.1, kind: 'perk', perk: { m: [3, 9], yen: 2200, text: '食事券2,200円分' }, desc: '牛丼やファミレスのチェーンを運営。株主優待は食事券。' },
  { code: 'X715', name: 'オリエンタルワールド', sector: 'game', price: 3850, shares: 1800, dy: .006, rec: [3, 9], sm: 1.0, kind: 'perk', perk: { m: [9], yen: 5800, text: 'テーマパーク入場券5,800円分' }, desc: 'テーマパークを運営。株主優待は入場券。' },
  { code: 'X716', name: 'イオソ', sector: 'food', price: 2150, shares: 830, dy: .011, rec: [2, 8], sm: .9, kind: 'perk', perk: { m: [2, 8], yen: 1500, text: '買い物優待1,500円分' }, desc: '全国にスーパーを持つ小売の大手。株主優待は買い物券。' },
  // ステップC：低位株2
  { code: 'X717', name: 'ジャパンディスプレ', sector: 'tech', price: 48, shares: 1500, dy: 0, rec: [], sm: 3.6, kind: 'penny', p: { liq: .3, loss: true }, mg: { short: false, rate: .5 }, fin: { na: -35, er: -.04, gc: true }, desc: 'スマホや車の液晶パネルをつくる。赤字が続き、再建中。' },
  { code: 'X718', name: 'KLub', sector: 'game', price: 88, shares: 600, dy: 0, rec: [], sm: 2.6, kind: 'penny', p: { liq: .4, per: 45 }, mg: { short: true, rate: .5, lend: .03 }, fin: { na: 120, er: .38, gc: false }, desc: 'スマホゲームの開発会社。わずかに黒字。' },
  // ステップD2：新規上場2（X717・X718 の後継枠。倒産しない）
  { code: 'X719', name: 'ペクシャ・テクノロジー', sector: 'growth', price: 0, shares: 32, dy: 0, rec: [], sm: 1.0, kind: 'ipo', p: { per: 80 }, ipo: { from: 'X717', lo: 60, hi: 140 }, desc: 'AIで企業の業務を自動化するソフトをつくる。黒字になったばかり。' },
  { code: 'X720', name: 'カヴァー', sector: 'game', price: 0, shares: 60, dy: 0, rec: [], sm: 1.6, kind: 'ipo', p: { per: 40 }, ipo: { from: 'X718', lo: 120, hi: 200 }, desc: 'VTuber のプロダクションを運営。ライブやグッズで急成長。' },
];
const DIFF = {
  easy:   { name: 'やさしい', cash: 3e6, vol: .7, fee: 0,    tax: false, hint: 'dir',   rank: 1, desc: '初期資金300万円。値動き穏やか。ニュースの影響の向きを表示。' },
  normal: { name: 'ふつう',   cash: 1e6, vol: 1,  fee: 0,    tax: true,  hint: 'stars', rank: 3, desc: '初期資金100万円。税金あり。ニュースは信頼度★だけ表示。' },
  hard:   { name: '本格',     cash: 5e5, vol: 1,  fee: .001, tax: true,  hint: 'none',  rank: 5, desc: '初期資金50万円。手数料0.1%・税金あり・暴落あり。ニュースの影響や信頼度の表示なし。' },
};
const SCEN = {
  month: { name: 'はじめての1か月', days: 20,  rank: 1, mu: .14, desc: '穏やかな上昇相場で売買に慣れよう。', goal: '資産をプラスで終える', clear: (r) => r > 0 },
  storm: { name: '嵐の四半期',     days: 60,  rank: 3, mu: .05, desc: '途中で暴落が起きる。耐えるか、逃げるか。', goal: '指数（NTX225）に勝つ', clear: (r, ir) => r > ir, crash: true },
  year:  { name: '1年チャレンジ',   days: 245, rank: 4, mu: .06, desc: '決算が4回。相場の波を乗りこなそう。', goal: '1年で+10%', clear: (r) => r >= .10 },
  free:  { name: 'フリープレイ',   days: 0,   rank: 1, mu: .06, desc: '期間無制限。初期資金を変更可能。自由に取引しよう。', goal: 'なし', clear: null, free: true },
  // リアル相場チャレンジ専用（相場で「リアル相場チャレンジ」を選んだときだけ一覧に出す）。日数は実データの営業日数
  // 名前・期間の表示は REAL_SETS（リアル相場のデータ表）にまとめてある。キーは REAL_SETS のキーと同じ
  real:  { get name() { return REAL_SETS.real.name; }, get days() { return realDays('real'); }, rank: 5, mu: 0, get desc() { return `${REAL_SETS.real.period}の実際の株価で1年間取引する。`; }, goal: '30銘柄平均に勝つ', clear: (r, ir) => r > ir, real: true },
  real2026: { get name() { return REAL_SETS.real2026.name; }, get days() { return realDays('real2026'); }, rank: 5, mu: 0, get desc() { return `${REAL_SETS.real2026.period}の実際の株価で取引する。`; }, goal: '30銘柄平均に勝つ', clear: (r, ir) => r > ir, real: true, noFree: true },   // noFree: フリープレイの相場の候補に入れない
  // 相場は上のリアル相場のシナリオ（noFree でないもの）からランダムで選ぶ（G.base）。実データが終わったら終了
  realfree: { name: 'フリープレイ', get days() { return REAL ? REAL.dates.length : 0; }, rank: 5, mu: 0, desc: 'どの相場になるかは始まってからのお楽しみ。初期資金も自由に決められる。', goal: 'なし', clear: null, real: true, free: true },
};
// フリープレイで選べる初期資金（円）
const CASH_MIN = 1e4, CASH_MAX = 1e9;
// 信用取引（制度信用）。rate = 委託保証金率、keep = 追証になる維持率、warn = 注意を出す維持率、min = 最低保証金、days = 返済期限（営業日）
// ファストスターター（ランク1のとき、タイトルのロゴを続けて10回押す）で開く5銘柄。ランクが上がれば、ふつうの解放が追い越す
const FAST_CODES = { random: ['K101', 'K201', 'K301', 'K401', 'K501'], real: ['7203', '7974', '9984', '9202', '4661'] };
// 幻の銘柄（ファストスターターのランダム相場だけ）。1株単位・呼値1円・信用取引なし・指数に入らない。専用の乱数で動く
const UME = { code: 'K999', name: '梅山カンパニー', price: 200909, sm: 3, desc: '何をしている会社なのか、社長以外は誰も知らない。株主優待は梅干し1年分（架空）。1株から買える' };
// 朝の「社長の機嫌」のうわさ（当たるのは4回に3回）
const UME_MOOD = {
  good: ['梅山社長、今朝は鼻歌まじりで出社したもよう', '梅山社長、宝くじで3,000円当たったと社内で自慢', '梅山社長の愛犬、今朝はとても元気', '梅山カンパニーの社員食堂、今日はカレーが大盛り無料'],
  bad: ['梅山社長、愛犬の散歩中に転んだもよう', '梅山社長、競馬で大負けしたとのうわさ', '梅山社長、通勤中に靴ひもが3回ほどけたもよう', '梅山カンパニーの社員食堂、カレーが50円値上げ'],
};
// [見出し, 株価への影響]
const UME_NEWS = [
  ['梅山カンパニー、新規事業「梅干し×AI」を発表', .06], ['梅山社長が競馬で大勝ち。株主への還元をほのめかす', .07],
  ['梅山社長がテレビに出演。何の会社かは最後まで分からず', .04], ['梅山カンパニー、社員旅行の行き先を梅の名産地・和歌山に決定', .02],
  ['梅山カンパニー、社名を「UMEYAMA」に変えるか検討。理由は「かっこいいから」', .03], ['梅山カンパニーの公式サイト、背景がすべて梅色に', .02],
  ['梅山カンパニーの本社の場所が判明。ふつうのマンションの一室だった', -.05], ['梅山社長「来期の業績は、梅の出来しだい」', -.03],
  ['梅山カンパニー、決算の発表日を聞かれ「社長の気分しだい」と回答', -.04], ['梅山カンパニーの株主優待「梅干し1年分」、実は1粒だったと判明', -.06],
];
const MARGIN = { rank: 6, rate: 0.3, keep: 0.2, warn: 0.25, min: 3e5, days: 125, buyRate: 0.028, lendRate: 0.011 };
const RANKS = [
  { n: '株デビュー', xp: 0, unlock: '3銘柄・成行注文' },
  { n: '見習いトレーダー', xp: 100, unlock: '10銘柄・指値注文・逆指値注文' },
  { n: '一人前トレーダー', xp: 300, unlock: '20銘柄・板・移動平均線・難易度ふつう・嵐の四半期' },
  { n: '中級トレーダー', xp: 700, unlock: '30銘柄・決算カレンダー・RSI・1年チャレンジ' },
  { n: '上級トレーダー', xp: 1500, unlock: '本格モード・リアル相場チャレンジ' },
  { n: 'プロトレーダー', xp: 3000, unlock: '信用取引' },
  { n: '伝説の相場師', xp: 6000, unlock: `追加の${XDEFS.length}銘柄・称号` },
];
// ランクに上がるまで画面に出さない。ランクが足りないうちは達成にもならない
const MISSIONS = [
  { id: 'buy', t: '株を買ってみよう', xp: 20, rank: 1 },
  { id: 'profit', t: '利益を出して売ろう', xp: 30, rank: 1 },
  { id: 'idle', t: '取引せずに1日を終えよう（待つのも作戦）', xp: 20, rank: 1 },
  { id: 'hold3', t: '同じ株を3日以上持ち続けよう', xp: 20, rank: 1 },
  { id: 'limit', t: '指値注文を約定させよう', xp: 30, rank: 2 },
  { id: 'diverse', t: '3業種以上の株を持って1日を終えよう', xp: 30, rank: 2 },
  { id: 'div', t: '配当を受け取ろう', xp: 40, rank: 4 },
  { id: 'big5', t: '1回の売りで+5%以上の利益を出そう', xp: 30, rank: 2 },
  { id: 'streak3', t: '3回続けて利益で売ろう', xp: 40, rank: 2 },
  { id: 'stop', t: '逆指値で損切りしよう', xp: 40, rank: 2 },
  { id: 'earn', t: '決算発表をまたいで株を持とう', xp: 40, rank: 3 },
  { id: 'crash', t: '暴落を−10%以内で乗り切ろう', xp: 100, rank: 3 },
  { id: 'sec5', t: '5業種以上の株を持って1日を終えよう', xp: 50, rank: 3 },
  { id: 'hold10', t: '10日以上持った株を利益で売ろう', xp: 50, rank: 3 },
  { id: 'plus10', t: '1年チャレンジで総資産+10%を達成しよう', xp: 60, rank: 4 },
  { id: 'beat', t: '20営業日で指数に勝とう', xp: 100, rank: 4 },
  { id: 'day3', t: '1日で総資産を+3%以上増やそう', xp: 60, rank: 4 },
  { id: 'dd10', t: '20営業日目に、最大下落率10%以内でプラスにしよう', xp: 80, rank: 4 },
  { id: 'streak5', t: '5回続けて利益で売ろう', xp: 80, rank: 4 },
  { id: 'hard', t: '本格モードで利益を出して終えよう', xp: 100, rank: 5 },
  { id: 'realbeat', t: 'コロナショックで30銘柄平均に勝とう', xp: 150, rank: 5 },
  { id: 'fee', t: '本格モードで、手数料を利益の10%以下に抑えて終えよう', xp: 100, rank: 5 },
  { id: 'realday', t: 'リアル相場で1日に総資産を+3%以上増やそう', xp: 100, rank: 5 },
  { id: 'plus20', t: '総資産+20%を達成しよう', xp: 100, rank: 5 },
  { id: 'short', t: '空売りで利益を出そう', xp: 100, rank: 6 },
  { id: 'nocall', t: '追証を出さずに信用で利益を出そう', xp: 120, rank: 6 },
  { id: 'both', t: '同じ日に現物と信用の両方で利益を出そう', xp: 100, rank: 6 },
  { id: 'short5', t: '空売りで+5%以上の利益を出そう', xp: 120, rank: 6 },
  { id: 'm3', t: '信用の建玉を3銘柄持って1日を終えよう', xp: 100, rank: 6 },
  { id: 'legend', t: '本格モードで1年チャレンジをクリアしよう', xp: 200, rank: 7 },
];
const KIND = { mkt: '成行', lmt: '指値', stp: '逆指値', force: '強制返済', delist: '上場廃止で決済' };
const TAG = { macro: '経済', fx: '為替', sector: '業種', ind: '企業', rumor: 'うわさ', earn: '決算', big: '速報', world: '社会', deny: '訂正', div: '配当', real: '報道', realReport: '観測', realRumor: 'うわさ' };

/* ニュースのテンプレート（影響は対数リターン） */
const NEWS_MACRO = [
  { t: '中央銀行が利上げを決定', m: -.008, s: { bank: .03, growth: -.03, tech: -.012 } },
  { t: '中央銀行が金融緩和の継続を表明', m: .007, s: { bank: -.015, growth: .02, tech: .008 } },
  { t: '国内の景気指標が市場予想を上回る', m: .01, s: { auto: .008 } },
  { t: '海外市場で株価が大幅安', m: -.016, s: {} },
  { t: '海外市場で株価が上昇、投資家心理が改善', m: .011, s: {} },
  { t: '消費者物価が予想以上に上昇', m: -.006, s: { food: -.012, bank: .01 } },
  { t: '政府が大型の経済対策を発表', m: .012, s: { auto: .01, bank: .005 } },
  { t: '国内の景気指標が市場予想を下回る', m: -.01, s: { auto: -.008 } },
  { t: '経済対策が小規模にとどまり、失望の売り', m: -.009, s: {} },
];
const NEWS_FX = [
  { t: '円安が進行、1ドル={x}円台に', m: .003, s: { auto: .016, food: -.008, tech: .005 }, x: [158, 160, 162] },
  { t: '円高が進行、1ドル={x}円台に', m: -.003, s: { auto: -.016, food: .008, tech: -.005 }, x: [138, 140, 142] },
];
const NEWS_SECTOR = {
  tech: [['生成AI向け半導体の需要が急増', .04], ['IT関連株に割高感、利益確定の売り', -.03]],
  auto: [['新車販売台数が前年比{x}%増', .03], ['部品不足で自動車の生産が停滞', -.035]],
  bank: [['長期金利が上昇、銀行のもうけが増える期待', .025], ['海外の銀行破綻で金融株に売り', -.05]],
  food: [['小麦や油など原材料の価格が下落', .025], ['小麦や油など原材料の価格が高騰', -.025]],
  game: [['新型ゲーム機が予約開始直後に完売', .04], ['大型タイトルの発売延期が相次ぐ', -.03]],
  growth: [['新興市場に個人投資家の資金が流入', .05], ['新興株に利益確定の売りが広がる', -.05]],
};
// 取引できない銘柄のニュースの代わりに流す、社会全体のニュース（表示だけで株価は動かさない）
const WORLD_RATE = 0.2;   // 見えないニュース1件につき、社会のニュースに置き換える割合
const NEWS_WORLD = [
  '全国的に気温が高く、冷たい飲み物やアイスがよく売れている', '週末は各地で行楽日和、観光地は多くの人でにぎわう', '大型の台風が接近、交通機関に乱れが出る見込み',
  '政府が来年度の予算案の編成作業を開始', '国会で新年度の法案の審議が本格化', '主要国の首脳が会談、貿易や安全保障について意見を交わす',
  '最低賃金の引き上げをめぐる議論が進む', '少子高齢化への対策として、新しい支援策が検討される', '人手不足を受け、各地で初任給を引き上げる動き',
  '全国の有効求人倍率は横ばい', '訪日外国人客が増え、都市部のホテルは高い稼働率', '新幹線や空港は連休の帰省客で混雑',
  '大手スーパーで、食料品の値上げに慣れた消費者の節約志向が続く', 'キャッシュレス決済の利用が広がり、現金を使わない店が増加', 'リモートワークを続ける企業が増え、オフィス需要に変化',
  '生成AIを仕事に使う人が増え、研修を始める企業が相次ぐ', '国内でスマートフォンの買い替え期間が長くなっているとの調査', '電気代やガス代の負担軽減策の期限が近づく',
  '大型連休の旅行予約は前年より好調', '都内の新築マンション価格が高い水準で推移', '農産物の収穫が順調、スーパーの店頭に新米が並び始める',
  '大規模な地震を想定した防災訓練が全国で行われる', 'プロスポーツの人気が高まり、観客数が過去最高を更新', '日本人選手が国際大会で優勝、街は祝福ムードに',
  '海外では主要な中央銀行が政策金利の見通しを議論', '原油価格は小幅な動き、産油国の会合に注目が集まる', '海外の景気は緩やかに回復、外需に期待の声',
  '日銀の短観を前に、企業の景況感に関心が集まる', '来週は主要企業の決算発表が本格化する見通し', '年金や医療の制度見直しをめぐり、与野党が論戦',
];
const NEWS_IND = [
  ['{n}が{x}億円の大型受注を獲得', .06], ['{n}の新製品が大ヒット', .07], ['{n}が自社株買いを発表', .04],
  ['{n}が業績予想を上方修正', .08], ['{n}が業績予想を下方修正', -.09], ['{n}で製品の不具合が発覚、回収へ', -.08],
  ['{n}が大手企業と業務提携', .05], ['{n}の社長が突然辞任', -.05], ['{n}が増配を発表', .03],
  ['{n}の主力工場で火災', -.045], ['{n}にアナリストが「買い」の評価', .03], ['{n}にアナリストが「売り」の評価', -.03],
  ['{n}が大口の取引先を失う', -.06],
];
const NEWS_GROWTH = [['{n}の新技術が実証実験で好結果', .16], ['{n}が資金集めのため新株を発行（1株の価値が薄まる）', -.12], ['{n}が大手と共同開発契約', .11], ['{n}の実証実験が失敗、計画を延期', -.15]];
const NEWS_RUMOR = [['観測記事：{n}が大型買収を検討か', .06], ['観測記事：{n}の業績が予想を上回る見通しか', .05], ['観測記事：{n}が事業の一部売却を検討か', -.04], ['ネット掲示板で{n}の不正のうわさ', -.06]];

const GLOSS = {
  '株式': '会社がお金を集めるために発行するもの。株を持つと会社の持ち主の一人になり、配当を受け取ったり、値上がりした株を売って利益を得たりできる。',
  '証券コード': '銘柄ごとに付いている記号。このゲームではK101のような架空のコードを使う。',
  '単元株': '売買できる最小の株数。日本の株は100株単位で取引する。',
  '成行注文': '値段を決めずに「今すぐ買う・売る」注文。すぐ約定するが、思ったより高く買う（安く売る）ことがある。',
  '指値注文': '「この値段以下で買う」「この値段以上で売る」と値段を決める注文。株価がそこまで来ないと約定しない。',
  '逆指値注文': '「ここまで下がったら売る」のように、株価が決めた値段に届いたら成行で注文を出す方法。損切りに使う。',
  '板': '売り注文と買い注文を値段ごとに並べた表。上が売り、下が買い。どの値段にどれだけ注文があるかがわかる。',
  '気配値': '板に並んでいる、売りたい値段と買いたい値段のこと。売りの一番安い値段と買いの一番高い値段が「最良気配」で、取引が成立しやすい。',
  '板が薄い': '板に並んでいる注文の株数が少ないこと。大きな注文を成行で出すと、上（下）の値段まで食い進んで、不利な値段で約定しやすい。',
  '約定': '注文が成立して、売買が実際に決まること。',
  '値幅制限': '1日に株価が動ける範囲。前日の終値をもとに決まり、急な暴騰や暴落を防ぐ。',
  'ストップ高': '値幅制限の上限まで株価が上がった状態。買いたい人が多すぎて、売り注文がほとんどない。',
  'ストップ安': '値幅制限の下限まで株価が下がった状態。売りたい人が多すぎて、買い注文がほとんどない。',
  '呼値': '注文できる値段の刻み。1,000円以下は0.1円、3,000円以下は0.5円、1万円以下は1円、3万円以下は5円刻み（東証の大型株＝TOPIX500の銘柄のルール。それ以外の銘柄はもっと粗く、3,000円以下は1円、5,000円以下は5円刻み）。',
  '出来高': 'その日に売買が成立した株数。多いほど注目されている。',
  'ローソク足': '一定時間の始値・高値・安値・終値を1本で表した図。終値が始値より高いと赤（陽線）、低いと緑（陰線）。',
  '移動平均線': '過去の決まった本数の終値を平均してつないだ線。株価の大きな流れ（トレンド）をつかむのに使う。',
  'PER': '株価収益率。株価が1株あたり利益の何倍かを示す。高いほど将来の成長が期待されている（または割高）。',
  'PBR': '株価純資産倍率。株価が1株あたりの純資産の何倍か。1倍を下回ると割安とされることが多い。',
  '配当': '会社が利益の一部を株主に配るお金。',
  '配当利回り': '株価に対して1年間にもらえる配当の割合。株価2,000円で配当60円なら3%。',
  '権利確定日': 'この日に株を持っていると配当を受け取れる日。このゲームでは月末の最終取引日（リアル相場は実際のとおり、2営業日前の権利付き最終日に持っていればよい）。',
  '権利付き最終日': '配当や株主優待の権利を得るために、株を持っていなければならない最後の日（大引けの時点）。株の受け渡しに2営業日かかるので、権利確定日の2営業日前になる。次の日が権利落ち日。',
  '権利落ち': '権利確定日の翌営業日に、配当の分だけ株価が下がりやすくなること。',
  '新規上場': '会社の株が、はじめて取引所で売買できるようになること（IPO）。上場の前に「上場承認」が発表され、上場日の寄り付きで最初の値段（初値）が決まる。',
  '公開価格': '新規上場の前に、会社が株を売り出した値段。初値はこの値段より高くなることが多いが、下回ること（公募割れ）もある。',
  '初値': '新規上場した株に、はじめてついた値段。人気があると、公開価格の何割も上で決まる。',
  '気配': 'まだ売買が成立していないときに、買いたい人・売りたい人の注文から見込まれる値段。買いが多いと「買い気配」。',
  '監理銘柄': '上場廃止になるおそれがあると、取引所が投資家に注意をうながすために指定する銘柄。売買はふつうにできる。',
  '整理銘柄': '上場廃止が決まった銘柄。上場廃止までの短い期間（このゲームでは5営業日）だけ売買できる。このゲームでは信用の新規建てはできない。',
  '上場廃止': '取引所で売買できなくなること。会社の倒産などで起きる。このゲームでは、最終売買日の終値で、持っている株と信用の建玉を決済する。',
  '低位株': '株価がおおむね100円以下の株。少ないお金で100株買えるが、1円動くだけで数%動くので値動きが荒く、板も薄いことが多い。業績が悪い会社も多いので注意。',
  '株主優待': '株を持っている人に、会社が商品券・食事券・割引券などを贈る、日本独特の仕組み。多くは100株以上を権利確定日に持っていることが条件。このゲームでは現金相当の額を翌朝に受け取れる（課税なし・現物だけ）。',
  '決算': '会社が3か月ごとに業績（売上や利益）を発表すること。株価が大きく動くきっかけになる。',
  '市場予想': 'アナリストたちが予想した業績の平均。決算がこれより良いか悪いかで株価が動く。',
  '材料出尽くし': '良いニュースがすでに株価に織り込まれていて、発表されたとたんに逆に売られること。',
  '時価総額': '株価×発行済株式数。会社の規模を表す。',
  '株価指数': '市場全体の値動きを1つの数字にしたもの。このゲームのNTX225は30社の時価総額から計算する（ランク7で増える追加銘柄は含まない）。',
  '損切り': '損が大きくなる前に株を売って、損を確定させること。小さな損で止めるのが長く続けるコツ。',
  '含み損益': 'まだ売っていない株を、今売ったらいくらの損益になるか。',
  'ボラティリティ': '株価の変動の大きさ。大きいほどよく動き、もうけも損も大きくなりやすい。',
  'スリッページ': '成行注文で、表示されていた値段より不利な値段で約定すること。板が薄い銘柄で起きやすい。',
  '寄り付き': 'その日最初の取引。9:00に、前の晩のニュースを反映して値段が決まる。',
  '大引け': 'その日最後の取引（15:30）。この値段が終値になる。',
  '前場・後場': '午前の取引（9:00〜11:30）が前場、午後の取引（12:30〜15:30）が後場。',
  '分散投資': 'いろいろな業種の株に分けて投資すること。1社の失敗で大きく損をしにくくなる。',
  '最大ドローダウン': '資産が一番高かった時点から、一番大きく減った割合。リスクの大きさを表す。',
  'RSI': '最近の値上がりと値下がりの勢いを0〜100で表す指標。70以上は買われすぎ、30以下は売られすぎの目安。',
  '譲渡益課税': '株を売ってもうけたときにかかる税金。日本では利益の20.315%。1年間の損益を合計して計算する。',
  '手数料': '証券会社に払う売買の手数料。最近は無料の会社も多い。',
  '買付余力': '今すぐ株を買うのに使えるお金。注文中の分は差し引かれる。',
  '特別気配': '買いと売りの注文が大きく偏って、釣り合う値段がなかなか決まらない状態。買いが多すぎると売り注文がなくなり、値段が上がってストップ高になる（売りが多すぎると、買い注文がなくなってストップ安）。このゲームでは、板の売り（ストップ安では買い）の列が空になり、その側の成行注文は約定しない。',
  '信頼度': 'ニュースの確かさ。★3は正式発表。★1〜2は観測記事やうわさで、外れることもある。',
  '信用取引': '証券会社にお金や株を借りて売買すること。保証金の約3.3倍まで取引でき、値下がりで利益を狙う「空売り」もできる。そのぶん損も大きくなりやすい。',
  '空売り': '持っていない株を借りて先に売り、あとで買い戻して返す取引。売った値段より安く買い戻せれば利益になる。株価が上がるほど損が増え、損に上限がない。',
  '建玉': '信用取引で買ったり売ったりして、まだ返済していない株のこと。「たてぎょく」と読む。',
  '返済': '信用取引の建玉を終わらせること。買い建ては売って、売り建ては買い戻して返済する。このときに損益が確定する。',
  '委託保証金': '信用取引のために預けるお金。新しく建てるには建玉の金額の30%が必要で、最低30万円。このゲームでは現金が保証金になる。',
  '新規建て余力': '信用取引で新しく建てられる金額の上限。保証金のうち、今の建玉に必要な分を除いた残りの約3.3倍。',
  '保証金維持率': '建玉の金額に対する保証金（現金＋建玉の評価損益−未精算の金利など）の割合。損が増えると下がり、20%を下回ると追証になる。',
  '追証': '保証金維持率が20%を下回ったときに、保証金を足すよう求められること。このゲームでは翌営業日の引けまでに20%以上に戻さないと、全部の建玉が強制的に返済される。',
  '信用金利・貸株料': '信用取引の費用。買い建てはお金を借りるので金利（年2.8%）、売り建ては株を借りるので貸株料（年1.1%）が、持っている日数に応じてかかる。返済のときにまとめて精算する。',
  '返済期限': '制度信用取引では、建玉は6か月以内に返済する決まり。このゲームでは最初に建てた日から125営業日目の引けで自動的に返済される。',
};

// ヒント画面のQ&A。[質問, 答え, 豆知識（任意。3〜4個に1個くらい）]
const TIPS = [
  { name: '注文のコツ', items: [
    ['最初はどうやって買えばいい？', '最初から全部のお金を1社に使わず、何回かに分けて少しずつ買おう。値下がりしても買い増しで平均の値段を下げられる。'],
    ['成行と指値はどう使い分ける？', '急いでいなければ指値が安心。板の薄い銘柄を成行で大量に買うと、上の売り注文まで食ってしまい高く買うことになる（スリッページ）。'],
    ['寄り付き直後に買っても大丈夫？', '9:00すぐは夜のあいだのニュースが一気に反映されて値段が大きく動く。落ち着くまで待つのも作戦。', '「寄り付き」は、売り手と買い手が「寄り」集まって最初の値段が「付く」ことから来た言葉。'],
  ] },
  { name: '板の見かた', items: [
    ['板はどう読む？', '真ん中が値段、左が売りたい株数、右が買いたい株数。上に行くほど高い売り、下に行くほど安い買いが並ぶ。売りの一番下と買いの一番上が、いま取引が成立しやすい値段。'],
    ['板の数字が小さいとどうなる？', '注文が少ない「薄い板」。大きく買うと上の値段まで食い進んで、思ったより高く買うことになる。そんなときは指値で、板を見ながら値段を決めよう。', '板の売買の注文が多い（厚い）銘柄ほど、大きな注文でも値段が動きにくい。'],
    ['板はどう活用する？', '①薄い板は成行を避けて指値にする。②安く買いたい（高く売りたい）ときは、板の今より下（上）の値段を指値にして待つ。③すぐ買いたい（売りたい）ときは、今の値段以上（以下）の指値にする。④大きな注文は何回かに分ける。板の形だけでは値動きは予想できない。現実の板でも注文は取り消せる（見せかけの注文もある）ので、このゲームの板と同じく、注文を出すときの目安として使おう。'],
    ['板を見るメリットは？', '①注文の前に、成行でいくらで買える（売れる）かがわかる。②指値の値段を、板を見ながら決められる。③薄い板や特別気配のような、いつもと違う状態に先に気づける。板は1分ごとに入れ替わるので、注文を出す直前に見るのがコツ。'],
    ['特別気配（ストップ高・安）のときは？', '買いが多すぎるストップ高では売りの列が、売りが多すぎるストップ安では買いの列が空になり、その側の成行注文は約定しない。ストップ安では売りたくても売れず、逆指値も約定しないことがある。飛びつかず、持ちすぎないのが大切。'],
  ] },
  { name: 'リスクの抑え方', items: [
    ['値下がりしたらどうすればいい？', '買う前に「ここまで下がったら売る」を決めておこう。ランク2からは逆指値注文で自動にできる。'],
    ['1つの会社に集中してもいい？', 'おすすめしない。同じ業種の株は一緒に動きやすいので、業種をまたいで持つと1つのニュースで全部が下がりにくい。'],
    ['負けが続いたときは？', '時間を止めてじっくり考えてもいい。焦って売買を繰り返すと、手数料や税金でじわじわ減っていく。'],
  ] },
  { name: 'ニュースと決算', items: [
    ['ニュースはどこまで信じていい？', '★3は正式発表。★1〜2は観測記事やうわさで外れることもあるので、飛びつきすぎないこと。'],
    ['決算の日は何に気をつける？', '決算カレンダーで発表日を確認しよう。予想を上回っても「材料出尽くし」で下がることがある。'],
    ['配当をもらうにはどうする？', '権利確定日（月末の最終取引日）に株を持っていればもらえる。ただし翌日は権利落ちで株価が下がりやすい。', '日本には、配当とは別に自社の商品や割引券を株主に贈る「株主優待」という独自の文化もある。'],
  ] },
  { name: 'チャートの見方', items: [
    ['チャートはどこを見ればいい？', '5分足だけでなく日足で大きな流れも見よう。チャートはドラッグで動かせて、ホイールやピンチで拡大・縮小できる。ダブルクリックで最新に戻る。'],
    ['赤と緑、どっちが値上がり？', '赤が値上がり、緑が値下がり。日本の株の画面はこの色分けが多い。', 'アメリカでは逆で、値上がりが緑、値下がりが赤になる。'],
    ['移動平均線はどう使う？', '株価が線より上にあれば上がる流れ、下にあれば下がる流れの目安になる。ランク3で表示できるようになる。'],
  ] },
  { name: '信用取引', items: [
    ['空売りはどんなときに使う？', '下がりそうな株を先に売っておき、安くなってから買い戻すときに使う。株価が上がると損が膨らむので、逆指値の買い（ここまで上がったら買い戻す）で損切りを決めておこう。'],
    ['信用取引で気をつけることは？', '保証金の3倍以上まで取引できるぶん、損も速く大きくなる。保有株画面の維持率のゲージが黄色になったら建玉を減らす合図。20%を下回ると追証になる。', '信用取引で買った株は、原則6か月以内に返済しなければならない。そのため6か月後に売りが出やすいと言われる。'],
  ] },
];
const TERM_GROUPS = [
  ['株の基本', ['株式', '証券コード', '単元株', '時価総額', '株価指数', '分散投資', '低位株', '新規上場', '公開価格', '初値', '気配', '監理銘柄', '整理銘柄', '上場廃止']],
  ['注文と取引', ['成行注文', '指値注文', '逆指値注文', '約定', 'スリッページ', '買付余力', '手数料']],
  ['板（気配）', ['板', '気配値', '板が薄い', '特別気配']],
  ['取引時間と値段のルール', ['寄り付き', '大引け', '前場・後場', '値幅制限', 'ストップ高', 'ストップ安', '呼値']],
  ['チャートと指標', ['ローソク足', '出来高', '移動平均線', 'RSI', 'ボラティリティ', 'PER', 'PBR']],
  ['配当・決算・税金', ['配当', '配当利回り', '権利確定日', '権利付き最終日', '権利落ち', '株主優待', '決算', '市場予想', '材料出尽くし', '譲渡益課税']],
  ['損益とリスク', ['損切り', '含み損益', '最大ドローダウン', '信頼度']],
  ['信用取引', ['信用取引', '空売り', '建玉', '返済', '委託保証金', '新規建て余力', '保証金維持率', '追証', '信用金利・貸株料', '返済期限']],
];
// 用語に添える豆知識（全部には付けない）
const TRIVIA = {
  '株式': '世界で最初の株式会社は、1602年にできたオランダ東インド会社と言われている。',
  '証券コード': '日本の証券コードは長く4桁の数字だったが、2024年からは英字の入ったコードも使われ始めた。',
  '株主優待': '株主優待は、海外にはあまりない日本独特の文化。個人投資家に長く持ってもらうために、多くの会社が実施している。',
  '特別気配': '本物の取引所では、特別気配のあいだ、気配の値段を少しずつ動かして、買いと売りの注文が釣り合うのを待つ。値段が一気に飛ばないようにする仕組み。',
  '単元株': '日本の株は2018年に全部の会社で100株単位にそろえられた。それまでは1株や1,000株の会社もあった。',
  '株価指数': '日経平均株価は225社の株価から計算されていて、このゲームのNTX225という名前もそこから来ている。',
  '前場・後場': '東京の取引所には11:30〜12:30の昼休みがある。世界の大きな取引所では珍しい仕組み。',
  '大引け': '東京証券取引所の取引終了は、2024年11月に15:00から15:30へ30分延びた。',
  'ストップ高': 'アメリカの株には、基本的に1日に動ける幅（値幅制限）がない。',
  'ローソク足': '江戸時代の大阪・堂島の米の取引で使われていた記録法がもとになっていると言われる。',
  '譲渡益課税': '20.315%のうち0.315%は、東日本大震災からの復興のための税金。',
  '配当': '配当を出さずに、利益をすべて事業の成長に回す会社もある。新興企業に多い。',
};

const SENSEI_SVG = `<svg viewBox="0 0 64 64" width="72" height="72" aria-hidden="true"><path d="M32 22c-2-6-8-10-15-9 4 2 7 6 9 10M32 22c2-7 8-11 15-10-4 2-7 6-9 10M32 22c0-6 1-11 4-15-3 1-6 6-7 12" fill="#4FA568" stroke="#2F7A45" stroke-width="1.5" stroke-linejoin="round"/><path d="M14 40c0-10 8-17 18-17s18 7 18 17c0 9-8 15-18 15S14 49 14 40z" fill="#FFFFFF" stroke="#6A4D9C" stroke-width="2"/><path d="M15 36c3-8 9-12 17-12s14 4 17 12c-5-3-11-4-17-4s-12 1-17 4z" fill="#8E6CC4"/><circle cx="26" cy="41" r="2.3" fill="#1B2233"/><circle cx="38" cy="41" r="2.3" fill="#1B2233"/><path d="M28 47q4 3 8 0" stroke="#1B2233" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="22" cy="45" r="2.4" fill="#F2A6A0" opacity=".7"/><circle cx="42" cy="45" r="2.4" fill="#F2A6A0" opacity=".7"/><path d="M32 55v6" stroke="#6A4D9C" stroke-width="2" stroke-linecap="round"/></svg>`;

/* ===================== 状態 ===================== */
let G = null;
let profile = loadProfile();
let modalOpen = false, titleOpen = true;
const UI = { acct: 'cash', side: 'buy', type: 'mkt', view: 'trade', hover: null, filter: 'all', geom: null, lastNews: -1, sort: { key: 'none', desc: false }, kind: 'all', vw: null, hcat: 'tip', tut: null };
// チャートの表示範囲。cnt = 見えるローソク足の本数、end = 右端の位置（null なら最新に追従）、yOff = 上下のずらし量（値幅に対する割合）
function resetView() { UI.vw = { '5m': { cnt: 60, end: null }, '1d': { cnt: 60, end: null }, yOff: 0 }; }
resetView();

/* ---------- 音（素材は Aseet フォルダ） ---------- */
const bgm = new Audio('Aseet/kabutore_bgm.mp3'); bgm.loop = true; bgm.volume = 0.4;
// 消音モード：BGM と効果音をまとめて止める。リセットでは消えないよう、プロフィールとは別に保存する
let muted = false; try { muted = localStorage.getItem('kabutore.mute') === '1'; } catch (e) {}
bgm.muted = muted;
function setMuted(m) { muted = m; bgm.muted = m; try { localStorage.setItem('kabutore.mute', m ? '1' : '0'); } catch (e) {} }
// スピーカーの記号（消音中は斜線入り）
const cartIcon = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h3l2.6 12.4a1 1 0 0 0 1 .8h9.7a1 1 0 0 0 1-.8L21 7H6"/><circle cx="9.5" cy="20" r="1.5" fill="currentColor"/><circle cx="17.5" cy="20" r="1.5" fill="currentColor"/></svg>';
const speakerIcon = m => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/>${m ? '<path d="M17 9l5 6M22 9l-5 6"/>' : '<path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>'}</svg>`;
function playBgm() { bgm.play().catch(() => {}); }   // 自動再生がブロックされたら、次のクリックで再生する
function stopBgm() { bgm.pause(); bgm.currentTime = 0; }
// 効果音は元の mp3 を <audio> でそのまま鳴らす。3つを順番に使い、巻き戻しを待たずに連打できるようにする
const seClicks = [0, 1, 2].map(() => { const a = new Audio('Aseet/select_button.mp3'); a.preload = 'auto'; return a; });
let seIdx = 0;
// 鳴らさないボタン：選べない（disabled・カギ付き）、すでに選んでいる、タイトルロゴ
function silentButton(b) {
  return b.disabled || b.getAttribute('aria-disabled') === 'true' || b.getAttribute('aria-pressed') === 'true' || b.getAttribute('aria-current') === 'page' || b.id === 'h-logo' || (b.id === 'h-rank' && UI.view === 'mission');
}
function playClick() {
  if (muted) return;
  const a = seClicks[seIdx++ % seClicks.length];
  // スマホ・タブレットのタイトル画面は BGM が無く目立つので小さめにする
  a.volume = titleOpen && document.documentElement.dataset.device !== 'pc' ? 0.25 : 0.6;
  a.currentTime = 0; a.play().catch(() => {});
}

// r7 = ランク7に到達したことがある（以後の新規のランダム相場に追加銘柄を出す。データのリセットで消える）
function defProfile() { return { xp: 0, missions: {}, tutorial: false, best: {}, fast: false, records: [], points: 0, pbest: {}, owned: {}, skin: '', bgm: '', opts: {}, mseen: {}, r7: false }; }
function loadProfile() { try { const p = JSON.parse(localStorage.getItem('kabutore.profile')); if (p && typeof p.xp === 'number') { const q = Object.assign(defProfile(), p); if (!p.mseen) q.mseen = { ...q.missions }; if (rank(q.xp) >= XRANK) q.r7 = true; return q; } } catch (e) {} return defProfile(); }
function saveProfile() { try { localStorage.setItem('kabutore.profile', JSON.stringify(profile)); } catch (e) { if (isQuota(e)) toast('ブラウザの保存領域がいっぱいで、経験値などを保存できませんでした', 'warn'); } }
function rank(xp = profile.xp) { let r = 1; RANKS.forEach((k, i) => { if (xp >= k.xp) r = i + 1; }); return r; }
// ファストスターター：指値・逆指値・信用取引・リアル相場チャレンジを、ランクに関係なく使える
const isFast = () => !!profile.fast;
const realUnlocked = (r = rank()) => isFast() || r >= SCEN.real.rank;
const scenLock = (S, r) => S.rank > r && !(S.real && isFast());

/* ===================== 日付 ===================== */
function addDays(iso, n) { const t = new Date(iso + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); }
function isWeekday(iso) { const w = new Date(iso + 'T00:00:00Z').getUTCDay(); return w > 0 && w < 6; }
function nextTD(iso) { let d = addDays(iso, 1); while (!isWeekday(d)) d = addDays(d, 1); return d; }
function prevTD(iso) { let d = addDays(iso, -1); while (!isWeekday(d)) d = addDays(d, -1); return d; }
function addTD(iso, n) { let d = iso; for (let i = 0; i < n; i++) d = nextTD(d); return d; }
const WD = '日月火水木金土';
function dateLabel(iso) { const t = new Date(iso + 'T00:00:00Z'); return `${t.getUTCFullYear()}年${t.getUTCMonth() + 1}月${t.getUTCDate()}日（${WD[t.getUTCDay()]}）`; }
function mdLabel(iso) { const t = new Date(iso + 'T00:00:00Z'); return `${t.getUTCMonth() + 1}/${t.getUTCDate()}（${WD[t.getUTCDay()]}）`; }
const monthOf = iso => +iso.slice(5, 7);
function minLabel(m) { const t = m < 150 ? 540 + m : 750 + (m - 150); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; }
function timeLabel() { if (G.phase === 'pre') return `8:${String(G.preMin).padStart(2, '0')}`; if (G.phase === 'closed') return '15:30'; return minLabel(G.minute); }
function phaseLabel() { return G.phase === 'pre' ? '寄り付き前' : G.phase === 'closed' ? '大引け' : G.minute < 150 ? '前場' : '後場'; }

/* ===================== 値段のルール（東証に準拠） ===================== */
// 全銘柄、東証の TOPIX500 構成銘柄の細かい呼値（1,000円以下は0.1円、3,000円以下は0.5円…）。粗い呼値（3,000円以下は1円、5,000円以下は5円…）だと、値動きの小さい銘柄の5分足が横線・十字ばかりになる
const TICKS = [[1000, 0.1], [3000, 0.5], [10000, 1], [30000, 5], [100000, 10], [Infinity, 50]];
function tickSize(p) { for (const [b, t] of TICKS) if (p <= b) return t; }
function roundTick(p) { const t = tickSize(p); return Math.max(t, Math.round(Math.round(p / t) * t * 10) / 10); }   // 0.1円単位の誤差を出さない
// 銘柄ごとの呼値と売買単位（梅山カンパニーは呼値1円・1株単位、低位株は呼値1円・100株単位）
const tickOf = (s, p) => (s.ume || s.tick1 ? 1 : tickSize(p));   // 梅山カンパニーと低位株（tick1）は1円
const roundPx = (s, p) => (s.ume || s.tick1 ? Math.max(1, Math.round(p)) : roundTick(p));
const lot = s => (s.ume ? 1 : 100);
const LIMITS = [[100, 30], [200, 50], [500, 80], [700, 100], [1000, 150], [1500, 300], [2000, 400], [3000, 500], [5000, 700], [7000, 1000], [10000, 1500], [15000, 3000], [20000, 4000], [30000, 5000], [50000, 7000], [70000, 10000], [100000, 15000], [Infinity, 30000]];
function limitWidth(p) { for (const [b, w] of LIMITS) if (p < b) return w; return 30000; }

/* ===================== 銘柄の生成 ===================== */
// R = 使う乱数（追加銘柄は専用のもの）
function makeStock(d, i, R = RNG, o = {}) {   // o = 種類ごとの性格（bm・ssm・esd・liq）。追加銘柄だけ
  const [code, name, sector, price, sharesM, dy, rec, unlock, sm, desc] = d;
  const sec = SECTORS[sector];
  const sig = sec.sig * sm, beta = sec.beta * (0.85 + R.next() * 0.3) * (o.bm ?? 1);
  const idio = Math.sqrt(Math.max(0.05 ** 2, sig * sig - beta * beta * MKT_SIG ** 2 - (sec.ss * (o.ssm ?? 1)) ** 2));   // 業種の揺れは ssm 倍で効くので、その分も引く（全体の揺れが sig になる）
  const per = (o.per ?? sec.per) * (0.8 + R.next() * 0.45);
  const loss = code === 'K601' || code === 'K602' || !!o.loss;
  const eps = loss ? -price * 0.03 * (0.8 + R.next() * 0.5) : price / per;
  return {
    code, name, sector, desc, unlock, rec, shares: sharesM * 1e6, div: Math.round(price * dy),
    sig, beta, idio, mu: sec.mu, kappa: sector === 'growth' ? 0.25 : sector === 'food' ? 1.2 : 0.7,
    jump: sec.jump, jsize: sector === 'growth' ? 0.10 : 0.045,
    price, lp: Math.log(price), prevClose: price, open: price, high: price, low: price, dayVol: 0,
    V: price, h: 1, eps, bps: price / (sec.pbr * (0.8 + R.next() * 0.4)),
    consensus: 0, nextEarn: 6 + ((i * 7) % 54),
    minVol: Math.max(300, sharesM * 1e6 * (sector === 'growth' ? 0.012 : 0.004) / MIN_PER_DAY * (o.liq ?? 1)),
    shock: 0, gap: 0, pend: [], intraday: [], daily: [], pins: [], limUp: price, limDn: price, stop: null,
  };
}
// 追加銘柄（k = XDEFS の何番目か）。乱数はシードと銘柄コードから作る専用のもので、銘柄を足しても既存の銘柄の値動きは変わらない
function makeExtra(x, k, seed) {
  const R = rngOn({ s: (hash01(`${seed}/x/${x.code}`) * 4294967296) | 0, spare: null });
  const o = { ...KINDS[x.kind].p, ...x.p };   // 種類の既定値を、銘柄ごとの p で上書きする
  const ip = x.ipo ? ipoPlan(seed, x) : null;   // 新規上場：公開価格で作る（初期値の抽選は今、値動きの乱数は上場日から）
  const s = makeStock([x.code, x.name, x.sector, ip ? ip.px : x.price, x.shares, x.dy, x.rec, XRANK, x.sm, x.desc], DEFS.length + k, R, o);
  s.consensus = (s.eps / 4) * (1 + s.mu / 4 + R.normal() * 0.02);
  Object.assign(s, { extra: true, kind: x.kind, r: R });
  if (o.ssm != null) s.ssm = o.ssm;
  if (o.esd != null) s.esd = o.esd;
  if (x.perk) s.perk = { ...x.perk };
  if (x.kind === 'penny') s.tick1 = true;   // 呼値1円
  if (x.mg) s.mg = { ...x.mg };
  if (x.fin) s.fin = { ...x.fin };
  s.dl = dlPlan(seed, x.code);   // 倒産・上場廃止の日程（倒産しうる銘柄だけ。ほかは null）
  if (ip) s.ipo = ip;
  return s;
}
// 乱数の状態 { s, spare } に、RNG と同じ関数を付ける（保存すると関数は消えるので、読み込むたびに付け直す）
function rngOn(r) { return Object.assign(r, { next: RNG.next, normal: RNG.normal, pick: RNG.pick }); }
// 30銘柄と追加銘柄（梅山カンパニーは別）。共通の乱数（RNG）を引く処理では使わず、G.stocks だけを回す
const allStocks = () => (G.extra?.length ? G.stocks.concat(G.extra) : G.stocks);

function newGame(scen, diff, seed, cash, mode) {
  RNG.s = seed | 0; RNG.spare = null;
  if (mode === 'real' && !SCEN[scen].real) scen = 'real';
  // リアル相場のフリープレイは、ほかのリアル相場のシナリオから相場を選ぶ（乱数の順番を変えないようにシードで決める）
  const pool = freePool(), base = mode === 'real' ? (SCEN[scen].free ? pool[Math.abs(seed | 0) % pool.length] : scen) : null;
  const real = mode === 'real' && realOK(base);   // リアル相場は、そのシナリオのデータ（data/corona2020.js など）があるときだけ
  if (!real && SCEN[scen].real) scen = 'free';
  if (real) useReal(base);
  const D = DIFF[diff], S = SCEN[scen], cash0 = cash || D.cash;   // cash はフリープレイで選んだ初期資金
  G = {
    v: 1, mode: real ? 'real' : 'random', seed, scen, base: real ? base : null, diff, dayIndex: 0, date: real ? REAL.dates[0] : START_DATE, phase: 'pre', preMin: 0, minute: 0, clock: 0, speed: 1,
    sel: real ? REAL.stocks[0].code : 'K201', chartMode: '5m', mkMu: S.mu,
    market: { hM: 1, shock: 0, secShock: {}, gapM: 0, secGap: {}, idx: IDX_BASE, idxPrev: IDX_BASE, idxOpen: IDX_BASE, idxHigh: IDX_BASE, idxLow: IDX_BASE, idxDaily: [], capBase: 1, crashLeft: 0, crashMin: 0 },
    stocks: real ? REAL.stocks.map(makeRealStock) : DEFS.map((d, i) => makeStock(d, i)), extra: [], news: [], denials: [], newsId: 0, orderSeq: 0,
    player: { cash: cash0, pos: {}, mpos: {}, orders: [], trades: [], sells: [], realizedYear: 0, taxYear: 0, taxTotal: 0, year: real ? +REAL.dates[0].slice(0, 4) : 2026, divTotal: 0, pendingDiv: 0, pendingPerk: 0, perkTotal: 0, hist: [], peak: cash0, maxDD: 0, dayStart: cash0, start: cash0, startIdx: 0, feesTotal: 0 },
    crashDay: -1, crashStart: 0, crashCheck: -1, div5: 0, dlog: [], ended: false, dayXP: 0, dayEvents: [], last: null, mcall: null, mwarn: -1,
  };
  if (!real) {   // 暴落イベントと決算の市場予想はランダム相場だけ
    if (S.crash) G.crashDay = 22 + Math.floor(RNG.next() * 14);
    else if (diff === 'hard' && scen !== 'month' && RNG.next() < 0.7) G.crashDay = 50 + Math.floor(RNG.next() * 150);
    for (const s of G.stocks) s.consensus = (s.eps / 4) * (1 + s.mu / 4 + RNG.normal() * 0.02);
    if (isFast()) G.ume = makeUme(seed);   // G.stocks には入れない（ほかの30銘柄と指数の乱数の順番を変えない）
    if (X_ON) G.extra = XDEFS.map((x, k) => makeExtra(x, k, seed));   // 追加銘柄も G.stocks には入れない。ランク7まで隠す（isOpen）
  }
  if (real && X_ON) G.extra = [...(REAL_XDEF || []), ...REAL_IDEF].map(makeRealExtra);   // リアル相場（2026年版・コロナショック版）の追加18社と新規上場2社。G.stocks には入れない。ランク7まで隠す（isOpen）
  afterLoad();
  if (real) realStart(); else genHistory();
  G.player.startIdx = G.market.idx;
  G.player.hist.push({ d: G.market.idxDaily.at(-1)?.d || prevTD(G.date), a: cash0, idx: G.market.idx });
  startDay(true);
}
function afterLoad() {
  if (G.mode === 'real') useReal(realKeyOf(G));   // 保存データ・練習からの復元でも、そのシナリオのデータに切り替える
  G.extra ||= [];   // 追加銘柄より前のセーブには extra がない（30銘柄のまま続ける。途中から作ると、それまでの日の値動きを再現できない）
  G.dlog ||= [];    // 上場廃止の記録（倒産より前のセーブにはない。日程 s.dl のない銘柄は倒産しない）
  for (const s of G.extra) rngOn(s.r);
  G._map = Object.fromEntries(allStocks().map(s => [s.code, s])); G.player.mpos ||= {};   // 信用取引より前のセーブには mpos がない
  G.player.pendingPerk ||= 0; G.player.perkTotal ||= 0;   // 株主優待より前のセーブにはない
  // 梅山カンパニーの乱数は状態を G.ume.r に持つ（保存すると関数は消えるので、読み込むたびに付け直す）
  if (G.ume) { G._map[G.ume.code] = G.ume; Object.assign(G.ume.r, { next: RNG.next, normal: RNG.normal, pick: RNG.pick }); }
}
const byCode = c => G._map[c];
const sel = () => byCode(G.sel);

/* 開始前60営業日分の過去データ */
function genHistory() {
  const dates = []; let d = START_DATE;
  for (let k = 0; k < 60; k++) { d = prevTD(d); dates.unshift(d); }
  const mk = G.market;
  dates.forEach((date, k) => {
    const Md = G.mkMu / DAYS + MKT_SIG / Math.sqrt(DAYS) * RNG.normal();
    const Sd = {}; for (const key in SECTORS) Sd[key] = SECTORS[key].ss / Math.sqrt(DAYS) * RNG.normal();
    let capO = 0, capC = 0;
    for (const s of G.stocks) { const b = histBar(s, date, k, Md, Sd, RNG); capO += s.shares * b.o; capC += s.shares * b.c; }
    for (const s of G.extra) if (!s.ipo) histBar(s, date, k, Md, Sd, s.r);   // 追加銘柄は指数に入れない。新規上場は過去チャートなし
    if (k === 0) mk.capBase = capO;
    const io = IDX_BASE * capO / mk.capBase, ic = IDX_BASE * capC / mk.capBase;
    mk.idxDaily.push({ d: date, o: io, c: ic, h: Math.max(io, ic) * 1.003, l: Math.min(io, ic) * 0.997 });
  });
  for (const s of G.stocks) histEnd(s, RNG);
  for (const s of G.extra) { if (s.ipo) continue; if (s.tick1) histAnchor(s); histEnd(s, s.r); }   // 新規上場は、上場日まで乱数を引かない
  mk.idx = mk.idxPrev = mk.idxDaily.at(-1).c;
}
/** 過去データの1日分の足（Md = 市場、Sd = 業種の動き。R = 使う乱数） */
function histBar(s, date, k, Md, Sd, R) {
  const pc = s.price, e = s.sig / Math.sqrt(DAYS);
  const o = roundPx(s, pc * Math.exp(R.normal() * e * 0.3));
  const c = roundPx(s, pc * Math.exp(s.beta * Md + Sd[s.sector] + s.idio / Math.sqrt(DAYS) * R.normal()));
  const h = roundPx(s, Math.max(o, c) * Math.exp(Math.abs(R.normal()) * e * 0.5));
  const l = roundPx(s, Math.min(o, c) * Math.exp(-Math.abs(R.normal()) * e * 0.5));
  const b = { d: date, di: k - 60, o, h: Math.max(h, o, c), l: Math.min(l, o, c), c, v: Math.round(s.minVol * MIN_PER_DAY * Math.exp(0.35 * R.normal()) / 100) * 100 };
  s.daily.push(b); s.price = c;
  return b;
}
// 低位株は値動きが荒く、過去60日のあいだに表の値段から大きく離れる（100円を超えたり、1円に近づいたり）ので、
// 過去チャートの形はそのままに、値段全体を伸び縮みさせて、開始時の値段を表の値段（XDEFS の price）にそろえる（乱数は使わない）
function histAnchor(s) {
  const p0 = XDEFS.find(x => x.code === s.code).price, f = p0 / s.price;
  for (const b of s.daily) { b.o = roundPx(s, b.o * f); b.h = roundPx(s, b.h * f); b.l = roundPx(s, b.l * f); b.c = roundPx(s, b.c * f); }
  s.price = p0;
}
function histEnd(s, R) { s.lp = Math.log(s.price); s.prevClose = s.price; s.V = s.price * (0.93 + R.next() * 0.14); }

/* ===================== リアル相場（data/ 以下の実データ） ===================== */
// リアル相場のシナリオごとの情報は、この REAL_SETS に1か所でまとめる（キーは SCEN のキーと同じ）。
// シナリオ名・期間の表示（name / period / year / span）もここだけ。データの期間を延ばしたときは span を直す。
//   data: 株価（CORONA2020 / RECENT。ファイルがなければ null で、そのシナリオは選べない）
//   news: 当時のニュース（NEWS2020 / NEWS2026。なくても動く）
//   rsigUntil: 日中の揺れの目安 rsig を計算する最後の日（この日まで）。なければデータ全期間から計算する
const REAL_SETS = {
  real: {
    file: 'data/corona2020.js', newsFile: 'data/news2020.js', name: 'コロナショック', period: '2020年',
    data: typeof CORONA2020 !== 'undefined' ? CORONA2020 : null, news: typeof NEWS2020 !== 'undefined' ? NEWS2020 : null,
    extra: typeof CORONA2020_EXTRA !== 'undefined' ? CORONA2020_EXTRA : null,   // 追加18社（data/corona2020_extra.js。ランク7のあと新しく始めたコロナショック版だけに出る。なくても動く）
    ipo: typeof CORONA2020_IPO !== 'undefined' ? CORONA2020_IPO : null,   // 新規上場2社（data/corona2020_ipo.js。追加18社と同じ条件で出る。なくても動く）
    events: typeof EVENTS2020 !== 'undefined' ? EVENTS2020 : null, eventsFile: 'data/events2020.js',   // 当時の決算・配当・株主優待（なくても動く）
  },
  real2026: {
    file: 'data/recent.js', newsFile: 'data/news2026.js', year: 2026, span: '1〜10月',
    get name() { return '今年の相場'; }, get period() { return `${this.year}年${this.span}`; },
    data: typeof RECENT !== 'undefined' ? RECENT : null, news: typeof NEWS2026 !== 'undefined' ? NEWS2026 : null,
    extra: typeof RECENT_EXTRA !== 'undefined' ? RECENT_EXTRA : null,   // 追加18社（data/recent_extra.js。ランク7のあと新しく始めた2026年版だけに出る。なくても動く）
    ipo: typeof RECENT_IPO !== 'undefined' ? RECENT_IPO : null,   // 新規上場2社（data/recent_ipo.js。追加18社と同じ条件で出る。なくても動く）
    events: typeof EVENTS2026 !== 'undefined' ? EVENTS2026 : null, eventsFile: 'data/events2026.js',   // 当時の決算・配当・株主優待（なくても動く）
    rsigUntil: '2026-09-30',   // rsig を全期間から計算すると、データを延ばすたびに既存の日の分足・高安・出来高・指数が変わるので、延長前の最終日までで固定している
  },
};
// 株価の数値は選んだシナリオのデータからだけ読む。終値は実データどおり、日中の動き（始値・高値・安値・分足）は
// 「前日終値 → その日の実際の終値」を結ぶ乱数の道筋（ブラウニアン・ブリッジ）で作る
for (const k in REAL_SETS) {
  const S = REAL_SETS[k];
  S.data = S.data?.dates?.length ? S.data : null;
  if (!S.data) continue;
  S.px = Object.fromEntries(S.data.stocks.map(d => [d.code, d.prices]));
  S.hist = S.data.history?.dates?.length ? S.data.history : null;   // 開始前の過去チャート（日足。なくても動く）
  // 実データの業種（東証の業種名）。SECTORS を回すランダム相場の乱数の順番を変えないよう、別の表にしておく
  S.sectors = {};
  for (const d of S.data.stocks) S.sectors[d.sector] ||= { name: d.sector, short: d.sector };
  // 追加18社（リアル相場）。日付が本編・過去分と同じときだけ使う。G.stocks には入れず G.extra に持つ（指数・ニュースは30銘柄のまま）
  const X = S.extra;
  if (X?.stocks?.length && JSON.stringify(X.dates) === JSON.stringify(S.data.dates) && (!X.history || JSON.stringify(X.history.dates) === JSON.stringify(S.hist?.dates))) {
    S.xdef = X.stocks; S.xpx = Object.fromEntries(X.stocks.map(d => [d.code, d.prices])); S.xhist = X.history || null;
    for (const d of X.stocks) S.sectors[d.sector] ||= { name: d.sector, short: d.sector };
  } else S.xdef = null;
  // 新規上場（リアル相場）。日付が本編と同じで、上場日が本編の中にあるものだけ。上場日より前の prices は null
  const I = S.ipo;
  S.idef = I?.stocks?.length && JSON.stringify(I.dates) === JSON.stringify(S.data.dates) ? I.stocks.filter(d => S.data.dates.includes(d.ipo?.date)) : [];
  for (const d of S.idef) { (S.xpx ||= {})[d.code] = d.prices; S.sectors[d.sector] ||= { name: d.sector, short: d.sector }; }
  // 当時の決算・配当・株主優待（tools/fetch_events.py）。初日が本編と同じときだけ使う。株価は動かさない（終値は実データのまま）
  S.ev = S.events?.first === S.data.dates[0] ? realEvents(S.events, S.data.dates) : null;
  S.earnByDay = {};
  for (const c in S.ev || {}) for (const e of S.ev[c].earn) (S.earnByDay[e.di] ||= []).push({ ...e, code: c });
  // 当時の実際のニュース。表示するだけで、株価を動かす genNews / apply 系には一切つながない。
  // date（出来事・発表の日）より後の最初の営業日の寄り付き前に出す（その朝に分かっていたことだけになる）
  S.newsByDay = {};
  if (Array.isArray(S.news)) {
    for (const n of S.news) {
      const di = S.data.dates.findIndex(d => d > n.date);
      if (di >= 0) (S.newsByDay[di] ||= []).push(n);   // 最終営業日より後の出来事は出さない
    }
    // 一覧は新しい順に並ぶので、同じ朝の中では重要なものを後に入れて上に来るようにする
    for (const d in S.newsByDay) S.newsByDay[d].sort((a, b) => (a.importance || 2) - (b.importance || 2));
  }
}
// いま遊んでいる（または遊ぼうとしている）シナリオのデータ。useReal で切り替える
let REAL = null, REAL_KEY = null, REAL_PX = {}, REAL_HIST = null, REAL_SECTORS = {}, REAL_NEWS = {}, REAL_XPX = {}, REAL_XHIST = null, REAL_XDEF = null, REAL_IDEF = [];   // X = 追加18社（REAL_XPX は新規上場の分も持つ）、I = 新規上場
let REAL_EV = null, REAL_EARN = {}, REAL_EV_ON = true;   // 当時の決算・配当・優待（銘柄ごと）、決算の日ごとの一覧、使うか（確認用に切れる）
const realOK = k => !!REAL_SETS[k]?.data;   // そのシナリオのデータがあるか
const anyReal = () => Object.keys(REAL_SETS).some(realOK);
const realDays = k => REAL_SETS[k]?.data?.dates.length || 0;
const freePool = () => Object.keys(SCEN).filter(k => SCEN[k].real && !SCEN[k].free && !SCEN[k].noFree);   // フリープレイの相場の候補
const realKeyOf = g => { const k = g.base || g.scen; return REAL_SETS[k] ? k : 'real'; };   // 保存データのシナリオ（古い保存データは base がない）
function useReal(k) {
  const S = REAL_SETS[k]; if (!S?.data) return false;
  REAL_KEY = k; REAL = S.data; REAL_PX = S.px; REAL_HIST = S.hist; REAL_SECTORS = S.sectors; REAL_NEWS = S.newsByDay; REAL_XPX = S.xpx || {}; REAL_XHIST = S.xhist || null; REAL_XDEF = S.xdef || null; REAL_IDEF = S.idef;
  REAL_EV = S.ev; REAL_EARN = S.earnByDay;
  return true;
}
// 決算・配当・優待のデータを、本編の営業日の番号（di）で引ける形にする。
//   divs: 配当の実績（di = 権利付き最終日 = 権利落ち日の前の営業日。開始前の分は di = -1 で、直近1年の配当の計算にだけ使う）
//   skip: 前年の同じ時期にあった配当がない回（無配など。note は注記）
//   earn: 決算短信・修正の発表。slot = pre（その日の寄り付き前）/ min（場中の m 分）/ close（引けのあと）。休みの日の発表は次の営業日の朝
//   perk: 株主優待（di = 権利付き最終日。lot = 必要な株数、yen = 現金相当（0 は入金なし）、hold = 継続保有の条件（年））
function realEvents(E, D) {
  const at = d => D.indexOf(d), md = d => d.slice(5).split('-').map(Number).join('/');
  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const out = {};
  for (const [code, x] of Object.entries(E.stocks)) {
    const earn = [];
    for (const [d, t, k, text, body] of x.earn) {
      const di = D.findIndex(v => v >= d); if (di < 0) continue;
      const c = toMin(t);
      const slot = D[di] !== d || c < 540 ? 'pre' : c >= 900 ? 'close' : 'min';   // 9:00〜11:30 は前場、12:30〜15:00 は後場の分、昼休みは後場の初め
      const m = slot !== 'min' ? 0 : c < 690 ? c - 540 : c < 750 ? 150 : 150 + c - 750;
      const dir = /赤字転落|赤字拡大|下方修正|減/.test(text) ? -1 : /増|黒字|上方修正|縮小/.test(text) ? 1 : 0;   // チャートのピンの向き
      earn.push({ di, slot, m, time: D[di] !== d ? `${md(d)} ${t}` : t, k, text, body: body || '', dir });
    }
    out[code] = {
      divs: x.div.map(([ex, amt]) => ({ ex, amt, di: at(ex) >= 1 ? at(ex) - 1 : -1 })),
      skip: (x.skip || []).map(([d, note]) => ({ di: at(d), note })).filter(v => v.di >= 0),
      earn,
      perk: (x.perk || []).map(p => ({ ...p, di: at(p.d) })).filter(p => p.di >= 0),
    };
  }
  return out;
}
const realEv = () => REAL_EV_ON && isReal() && REAL_EV;
// 決算の発表をニュースに出す（株価は動かさない）。保有していれば「今日のできごと」にも出す
function realEarn(slot, m) {
  const P = G.player;
  for (const e of REAL_EARN[G.dayIndex] || []) {
    if (e.slot !== slot || (slot === 'min' && e.m !== m)) continue;
    const s = byCode(e.code); if (!s || !live(s)) continue;
    pushNews({ day: G.dayIndex, time: e.time, type: 'earn', stars: 3, codes: [s.code], text: e.text, body: e.body, hint: '', flash: false });
    s.pins.push({ d: G.dayIndex, m: slot === 'pre' ? 0 : slot === 'close' ? MIN_PER_DAY - 1 : m, dir: e.dir }); if (s.pins.length > 160) s.pins.shift();
    if (e.k === 'k' && P.pos[s.code]) { G.dayEvents.push(`保有中の${s.name}が決算を発表：${e.text}`); complete('earn'); }
  }
}
// 権利付き最終日の引け：配当（ランク4から）と株主優待の権利。入金は翌朝（startDay の pendingDiv・pendingPerk）。権利落ちの値下がりは実際の終値に含まれているので、株価は動かさない
function realRights() {
  const P = G.player, di = G.dayIndex, per1 = v => `${+v.toFixed(2)}円`;
  for (const s of allStocks()) {
    const ev = REAL_EV[s.code]; if (!ev || !live(s)) continue;
    const q = P.pos[s.code]?.qty || 0, mp = P.mpos[s.code];
    if (divOn()) {
      for (const v of ev.divs) {
        if (v.di !== di) continue;
        if (q > 0) { P.pendingDiv += q * v.amt; G.dayEvents.push(`${s.name}の権利付き最終日。${q}株×${per1(v.amt)}＝${yen(q * v.amt)}円の配当の権利を得ました（明日入金）`); }
        if (mp?.side === 'buy') { P.pendingDiv += mp.qty * v.amt; G.dayEvents.push(`信用で買い建て中の${s.name}の権利付き最終日。配当と同じ額（${yen(mp.qty * v.amt)}円）を受け取ります（明日入金）`); }
        else if (mp) { P.cash -= mp.qty * v.amt; G.dayEvents.push(`信用で売り建て中の${s.name}の権利付き最終日。配当と同じ額（${yen(mp.qty * v.amt)}円）を支払いました`); }
      }
      for (const k of ev.skip) if (k.di === di && (q > 0 || mp)) G.dayEvents.push(`保有中の${s.name}の権利付き最終日。${k.note || '今回は配当がありません（無配）'}`);
    }
    for (const p of ev.perk) {
      if (p.di !== di) continue;
      const held = P.pos[s.code] ? di - P.pos[s.code].d : 0, what = `${s.name}の権利付き最終日。株主優待（${p.text}）`;   // 今日のできごとは表示のときにエスケープされる
      if (q >= p.lot && p.hold && held < p.hold * DAYS) G.dayEvents.push(`${what}は、${p.hold}年以上持ち続けることが条件のため対象外です`);
      else if (q >= p.lot && p.yen > 0) { P.pendingPerk += p.yen; G.dayEvents.push(`${what}の権利を得ました。現金相当の${yen(p.yen)}円を明日受け取ります`); }
      else if (q >= p.lot) G.dayEvents.push(`${what}の権利を得ました（割引券や引換券などのため、ゲームでは入金しません）`);
      else if (q > 0) G.dayEvents.push(`${what}は${p.lot}株以上が条件のため対象外です（${q}株）`);
      else if (mp?.side === 'buy') G.dayEvents.push(`信用で買い建て中の${s.name}は、株主優待の対象外です。優待がもらえるのは、現物を持っているときだけです`);
    }
  }
}
const realDivYear = s => { const y1 = (+G.date.slice(0, 4) - 1) + G.date.slice(4); return (REAL_EV?.[s.code]?.divs || []).filter(v => v.ex > y1 && v.ex <= G.date).reduce((a, v) => a + v.amt, 0); };   // 直近1年の配当の実績（1株）
const REAL_IDX_BASE = 100;
const dailyKeep = () => (isReal() ? 600 : 320);   // 日足を残す数。リアル相場は過去分（約240日）と1年分が収まるように多めにする
const SEC = k => SECTORS[k] || REAL_SECTORS[k];
const isReal = () => G?.mode === 'real';
const idxName = () => (isReal() ? '30銘柄平均' : 'NTX225');
const realClose = (s, di) => (s.extra ? REAL_XPX : REAL_PX)[s.code][di];
const hasRealNews = () => Object.keys(REAL_NEWS).length > 0;
const NEWS_KEEP_REAL = 800;   // リアル相場で保存・表示するニュースの上限（当時のニュースと50社の決算の1年分が収まる数）
function pushRealNews() {
  const t = G.date.slice(5).split('-').map(Number).join('/') + ' 朝';
  for (const n of REAL_NEWS[G.dayIndex] || []) {
    if (n.codes?.length && !n.codes.some(c => byCode(c))) continue;   // このゲームにない銘柄（追加18社が出ていないゲーム）だけのニュースは出さない
    const type = n.type === 'report' ? 'realReport' : n.type === 'rumor' ? 'realRumor' : 'real';   // 実際の報道 / 観測報道 / 当時の噂
    pushNews({ day: G.dayIndex, time: t, type, stars: 3, codes: (n.codes || []).filter(c => byCode(c)), text: n.headline, body: n.body || '', imp: n.importance || 2, hint: '', flash: false });
  }
}

function makeRealStock(d) {
  const L = d.ipo ? REAL.dates.indexOf(d.ipo.date) : 0;   // 新規上場は上場日から（それより前の prices は null）。開始時の値段は公開価格
  const p0 = d.ipo ? d.ipo.offer : d.prices[0], price = roundTick(p0);
  const until = REAL_SETS[REAL_KEY].rsigUntil, n = until ? REAL.dates.filter(x => x <= until).length : d.prices.length;   // rsig を計算する日数
  let sq = 0; for (let i = L + 1; i < n; i++) sq += Math.log(d.prices[i] / d.prices[i - 1]) ** 2;
  const rsig = Math.sqrt(sq / (n - 1 - L));   // その銘柄の1日の値動きの大きさ（日中の揺れの目安）
  return {
    code: d.code, name: d.name, sector: d.sector, desc: d.ipo ? `${REAL_SETS[REAL_KEY].period}に新規上場（${d.ipo.market}）。上場日の実際の初値と、その後の実際の終値で動きます` : `${REAL_SETS[REAL_KEY].period}の実際の終値で動きます`, unlock: 1, rec: [],
    shares: 1e9 / p0, div: 0,   // 株式数は実データにないので、指数が「30銘柄を同じ金額ずつ持った平均」になるようにする
    sig: rsig * Math.sqrt(DAYS), beta: 1, idio: rsig * Math.sqrt(DAYS), mu: 0, kappa: 0, jump: 0, jsize: 0, rsig, dsig: rsig,
    price, lp: Math.log(price), prevClose: price, open: price, high: price, low: price, dayVol: 0,
    V: price, h: 1, eps: 0, bps: 0, consensus: 0, nextEarn: -1,
    minVol: Math.max(300, 3e9 / p0 / MIN_PER_DAY),
    shock: 0, gap: 0, pend: [], intraday: [], daily: [], pins: [], limUp: price, limDn: price, stop: null,
  };
}
// 追加18社（リアル相場）。ランダム相場の追加銘柄と同じ種類・バッジ・板・流動性・呼値・信用の設定（性格 bm・ssm・esd は使わない）。
// 日中の動きは銘柄ごとの専用乱数（hash01(seed/rx/コード)）で、共通の RNG は引かない。配当・優待は表示だけ（入金も権利落ちもない）
const XREAL_MG = { 6740: { short: false, rate: .5 }, 3323: { short: true, rate: .5, lend: .03 }, 3315: { short: true, rate: .5, lend: .03 } };   // 低位株の信用の設定
const XREAL_PERK = { 2702: '食事券（年2回）', 9861: 'サービス券（年2回、1回あたり2,000円分の目安）', 7550: '食事優待券（年2回、1回あたり1,000円分の目安）' };
const XREAL_LIQ = { 6740: .3, 3323: .4, 3315: .4 };   // 低位株の流動性
function makeRealExtra(d) {
  const s = makeRealStock(d), kind = d.kind || 'normal';
  const liq = XREAL_LIQ[d.code] ?? KINDS[kind]?.p.liq ?? 1;
  s.minVol = Math.max(300, s.minVol * liq);
  Object.assign(s, { extra: true, kind, r: rngOn({ s: (hash01(`${G.seed}/rx/${d.code}`) * 4294967296) | 0, spare: null }) });
  if (kind === 'penny') s.tick1 = true;   // 呼値1円
  if (XREAL_MG[d.code]) s.mg = { ...XREAL_MG[d.code] };
  if (d.div > 0) { s.divShow = d.div; s.divYear = +REAL.dates[0].slice(0, 4) - 1; }   // 表示用の年間配当（開始前の1年の実績）。s.div は 0 のまま＝入金なし
  const perk = REAL_KEY === 'real2026' ? XREAL_PERK[d.code] : d.perk;   // コロナショック版は当時の内容が確認できないので「優待あり」だけ
  if (perk) s.perkShow = perk;
  // 新規上場：上場日・公開価格・初値は実データどおり（ipoPlan の抽選は使わない。前身はない）。上場前は隠し、専用乱数も上場日の寄り付きのあとから引く
  if (d.ipo) { const L = REAL.dates.indexOf(d.ipo.date); s.ipo = { day: L, base: L, ann: L - IPO_ANN, px: d.ipo.offer, open: roundTick(d.ipo.open), early: false, from: null, mkt: d.ipo.market }; }
  return s;
}
// 初日の終値での指数（30銘柄平均）を 100 にする。過去分があれば、過去チャートも同じ基準で作る
function realStart() {
  const mk = G.market; let cap = 0; for (const s of G.stocks) cap += s.shares * s.price;
  mk.capBase = cap * IDX_BASE / REAL_IDX_BASE;
  mk.idx = mk.idxPrev = mk.idxOpen = mk.idxHigh = mk.idxLow = REAL_IDX_BASE;
  if (REAL_HIST) realHistory();
}
// 開始前の過去チャート（data の history）。乱数は使わない。初日の前日終値は過去分の最終日の終値にする
function realHistory() {
  const H = REAL_HIST, mk = G.market, n = H.dates.length;
  for (const s of allStocks()) {
    const x = (s.extra ? REAL_XHIST : H)?.stocks[s.code]; if (!x) continue;   // 過去分が取れなかった銘柄は過去チャートなし
    // 出来高は日ごとの増減だけ実データを使い、大きさはゲーム内の出来高（実際の1割前後）にそろえる
    let sum = 0, cnt = 0; for (const v of x.v) if (v) { sum += v; cnt++; }
    const vk = cnt ? s.minVol * MIN_PER_DAY / (sum / cnt) : 0;
    H.dates.forEach((d, i) => {
      if (x.c[i] == null) return;   // 上場前など値のない日は足を作らない
      s.daily.push({ d, di: i - n, o: roundTick(x.o[i]), h: roundTick(x.h[i]), l: roundTick(x.l[i]), c: roundTick(x.c[i]), v: Math.round((x.v[i] || 0) * vk / 100) * 100 });
    });
    if (s.daily.length) s.prevClose = s.daily.at(-1).c;
  }
  // 指数の過去分も同じ株式数・同じ基準で計算する（高値・安値は各銘柄の高値・安値の合計なので目安）。全銘柄の値がそろう日だけ作る
  const f = IDX_BASE / mk.capBase;
  H.dates.forEach((d, i) => {
    const t = { o: 0, h: 0, l: 0, c: 0 };
    for (const s of G.stocks) { const x = H.stocks[s.code]; if (x?.c[i] == null) return; for (const k in t) t[k] += s.shares * roundTick(x[k][i]); }
    mk.idxDaily.push({ d, o: t.o * f, h: t.h * f, l: t.l * f, c: t.c * f });
  });
  if (mk.idxDaily.length) mk.idx = mk.idxPrev = mk.idxOpen = mk.idxHigh = mk.idxLow = mk.idxDaily.at(-1).c;
}
// 値幅制限は分割調整後の値で計算するので、実際の終値がはみ出す日がある（例：ストップ高の日）。その日は終値まで広げる
function realLimits(s) {
  const c = roundTick(realClose(s, G.dayIndex));
  s.limUp = Math.max(s.limUp, c); s.limDn = Math.min(s.limDn, c);
}
function realOpen(s, R = RNG) {
  const p0 = Math.log(s.prevClose), T = Math.log(realClose(s, G.dayIndex));
  s.dsig = Math.max(s.rsig * 0.7, Math.abs(T - p0) * 0.5);
  setPrice(s, p0 + (T - p0) * 0.35 + s.dsig * 0.3 * R.normal());
}
/** 1分ぶんの動き。残り n 分で実際の終値 T に着くように引き寄せつつ揺らす（最後の1分でちょうど T） */
function realStep(s, im, R = RNG) {
  const n = MIN_PER_DAY - G.minute, T = Math.log(realClose(s, G.dayIndex));
  const eps1 = s.dsig / Math.sqrt(MIN_PER_DAY) * im;
  const r = n <= 1 ? T - s.lp : (T - s.lp) / n + eps1 * Math.sqrt((n - 1) / n) * R.normal();
  return { r, eps1 };
}

/* ===================== 株価エンジン ===================== */
function setPrice(s, lp) {
  lp = clamp(lp, Math.log(s.limDn), Math.log(s.limUp));
  s.lp = lp;
  s.price = clamp(roundPx(s, Math.exp(lp)), s.limDn, s.limUp);
  // 下限が前日終値と同じ（1円の株）ときは、それ以上下がれないだけでストップ安ではない（売買できる）
  s.stop = s.price >= s.limUp ? 'up' : s.price <= s.limDn && s.limDn < s.prevClose ? 'down' : null;
}
function updateIndex(open) {
  const mk = G.market; let cap = 0; for (const s of G.stocks) cap += s.shares * s.price;
  mk.idx = IDX_BASE * cap / mk.capBase;
  if (open) { mk.idxOpen = mk.idxHigh = mk.idxLow = mk.idx; }
  mk.idxHigh = Math.max(mk.idxHigh, mk.idx); mk.idxLow = Math.min(mk.idxLow, mk.idx);
}

/** 1分ごとの更新：r = μΔt + βM + S + σε + κln(V/P)Δt + J + N */
function stepMinute() {
  const m = G.minute, mk = G.market;
  const im = (m < 30 || m >= 270 ? 1.5 : 1) / Math.sqrt(1.25);   // 寄り付き直後と大引け前は荒れる
  if (isReal()) return stepMinuteReal(im);
  const dv = DIFF[G.diff].vol;
  let crash = 0;
  if (mk.crashMin > 0) { crash = mk.crashLeft / mk.crashMin; mk.crashLeft -= crash; mk.crashMin--; }
  const mRand = MKT_SIG * Math.sqrt(mk.hM * DT) * im * dv * RNG.normal();
  mk.dayZ = (mk.dayZ || 0) + mRand;   // GARCH 用：ランダムな部分だけを1日分ためる
  const M = G.mkMu * DT + mRand + mk.shock + crash;
  mk.shock = 0;
  const S = {};
  for (const k in SECTORS) { S[k] = SECTORS[k].ss * Math.sqrt(DT) * im * dv * RNG.normal() + (mk.secShock[k] || 0); mk.secShock[k] = 0; }
  for (const s of G.stocks) stockStep(s, M, S, im, dv, RNG);
  for (const s of G.extra) { if (!live(s)) continue; if (dlStopLow(s)) stopLowStep(s); else { if (s.dl) s.shock += dlDrift(s); stockStep(s, M, S, im, dv, s.r); } }   // 市場・業種の動き（M・S）は読むだけ
  if (G.ume) umeStep(im);
  updateIndex(false);
  processOrders();
  // うわさの否定
  for (const dn of [...G.denials]) if (dn.at <= G.clock) { G.denials.splice(G.denials.indexOf(dn), 1); denyNews(dn); }
  maybeNews();
  if (G.extra.length) xNewsMinute();
}
/** 1銘柄の1分ぶん（M = 市場、S = 業種の動き。R = 使う乱数） */
function stockStep(s, M, S, im, dv, R) {
  const prev = s.price;
  const eps1 = s.idio * Math.sqrt(s.h * DT) * im * dv;
  let e = eps1 * R.normal();
  if (R.next() < s.jump * DT) e += R.normal() * s.jsize;                    // ジャンプ
  s.dayZ = (s.dayZ || 0) + e;
  let r = s.mu * DT + s.beta * M + S[s.sector] * (s.ssm ?? 1) + e + s.kappa * Math.log(s.V / prev) * DT;
  if (s.pend.length) { for (const p of s.pend) { const a = p.left * 0.035; r += a; p.left -= a; } s.pend = s.pend.filter(p => Math.abs(p.left) > 2e-4); }
  r += s.shock; s.shock = 0;
  setPrice(s, s.lp + r);
  minuteBar(s, prev, r, eps1, R);
}
// 倒産のあとのストップ安：値幅の下限に張り付き、買い手がいないので出来高はない（乱数は使わない）。open = 寄り付き
function stopLowStep(s, open) {
  const p = s.limDn; s.lp = Math.log(p); s.price = p; s.stop = 'down'; s.shock = 0; s.pend = [];
  if (open) { s.open = s.high = s.low = p; s.gap = 0; return; }
  s.intraday.push({ o: p, h: p, l: p, c: p, v: 0 }); s.low = Math.min(s.low, p);
}
// リアル相場の1分：実データの終値へ向かうだけ。作りもののニュースは流さない
function stepMinuteReal(im) {
  for (const s of G.stocks.concat(G.extra)) {   // 追加18社は専用乱数 s.r（30銘柄だけが共通の RNG を引く。concat しても順番は同じ）
    if (s.extra && !live(s)) continue;
    const R = s.extra ? s.r : RNG, prev = s.price, { r, eps1 } = realStep(s, im, R);
    setPrice(s, s.lp + r);
    if (G.minute === MIN_PER_DAY - 1) {   // 最後の1分は、丸めの誤差で1刻みずれないよう実データの終値をそのまま使う
      s.price = roundTick(realClose(s, G.dayIndex));
      s.stop = s.price >= s.limUp ? 'up' : s.price <= s.limDn ? 'down' : null;
    }
    minuteBar(s, prev, r, eps1, R);
  }
  updateIndex(false);
  processOrders();
  if (realEv()) realEarn('min', G.minute);   // 場中に発表された当時の決算（株価は動かさない）
}
const WICK1 = 3;   // 低位株（呼値1円）の分足のひげの倍率
/** 1分足（高値・安値・出来高）を記録する。R = 使う乱数（梅山カンパニーだけ専用のもの） */
function minuteBar(s, prev, r, eps1, R = RNG) {
  const late = G.minute >= 270, early = G.minute < 30, L = lot(s);
  const o = prev, c = s.price;
  const ext = Math.abs(R.normal()) * eps1 * 0.6 * prev * (s.tick1 ? WICK1 : 1);   // ひげ。低位株は1円の呼値で横線ばかりにならないよう長くする（指値の約定判定も、この高値・安値を使う）
  const hi = Math.max(o, c, Math.min(s.limUp, roundPx(s, Math.max(o, c) + ext)));
  const lo = Math.min(o, c, Math.max(s.limDn, roundPx(s, Math.min(o, c) - ext)));
  const v = Math.max(L, Math.round(s.minVol * (early || late ? 1.9 : 0.78) * (1 + Math.abs(r) / (eps1 + 1e-9) * 0.25) * Math.exp(0.4 * R.normal()) / L) * L);
  s.intraday.push({ o, h: hi, l: lo, c, v });
  s.high = Math.max(s.high, hi); s.low = Math.min(s.low, lo); s.dayVol += v;
}

/* ===================== 倒産・上場廃止（追加銘柄のうち DL_P の銘柄だけ） ===================== */
// 流れ：前兆（観測記事）F → 監理銘柄 M → 倒産のお知らせ B（その日の寄り付きから k 日ストップ安）→ 整理銘柄 S〜L（5営業日。L = 最終売買日）
//      → L の引けで、保有分と建玉を終値（1円以上）で決済 → D（L の翌営業日）の朝に上場廃止のお知らせ。
// 抽選は hash01 だけで、共通の乱数もその銘柄の専用乱数も使わない。開始から DL_GRACE 営業日は起きない。
// 状態は日数と日程から決まる（dlStage）ので保存しなくてよい。保存するのは日程 s.dl と、決済したあとの旗 s.delisted だけ
const DL_P = { X717: .40, X718: .15 }, DL_GRACE = 20;   // 1年（245営業日）あたりの確率（難易度では変えない）
// 日程。F を渡すと、その日に前兆が始まる日程を作る（forceDelist 用）
function dlPlan(seed, code, F) {
  const h = k => hash01(`${seed}/dl/${code}/${k}`);
  if (F == null) {
    const p = DL_P[code]; if (!p) return null;
    F = DL_GRACE + Math.floor(DAYS * Math.log(1 - h('t')) / Math.log(1 - p));   // 猶予のあと1年以内に始まる確率が、ちょうど p
  }
  const B = F + 5 + Math.floor(h('lead') * 11), M = F + Math.max(2, Math.round((B - F) * 0.6)), k = 2 + Math.floor(h('k') * 3), S = B + 1, L = S + 4;
  return { F, M, B, k, S, L, D: L + 1 };
}
// normal / sign（前兆）/ watch（監理）/ fail（倒産のお知らせの日）/ seiri（整理）/ delisted
function dlStage(s, d = G.dayIndex) {
  const x = s.dl; if (!x) return 'normal';
  if (s.delisted || d >= x.D) return 'delisted';
  return d >= x.S ? 'seiri' : d >= x.B ? 'fail' : d >= x.M ? 'watch' : d >= x.F ? 'sign' : 'normal';
}
// 前兆・監理のあいだの下げの流れ（1分ぶん。前兆は1日 −1.5%、監理は1日 −3%）。乱数は使わない
const DL_DRIFT = { sign: -0.015, watch: -0.03 };
const dlDrift = s => (DL_DRIFT[dlStage(s)] || 0) / MIN_PER_DAY;
const dlStopLow = s => !!s.dl && !s.delisted && G.dayIndex >= s.dl.B && G.dayIndex < s.dl.B + s.dl.k;   // ストップ安に張り付く日
// ゲームのできごとの通知（D2 の後継上場・D3 の破産の判定が受け取る）。今は上場廃止（'delist'）だけ
const GAME_EV = {};
function onGame(ev, f) { (GAME_EV[ev] ||= []).push(f); }
function emitGame(ev, d) { for (const f of GAME_EV[ev] || []) f(d); }
const DL_TEXT = {
  sign: { X717: '観測記事：{n}の資金繰りが悪化か。取引銀行に返済の猶予を求めていると報道', X718: '観測記事：{n}、主力ゲームの不振で手元資金が急減。資金調達を検討と報道' },
  fail: { X717: '【速報】{n}（{c}）が民事再生法の適用を申請。株価はストップ安の売り気配', X718: '【速報】{n}（{c}）が破産手続き開始を申し立て。株価はストップ安の売り気配' },
};
// 朝：その日の段階のお知らせと、値動きの変化（前兆・監理の窓、ストップ安のあとの理論価格）
function dlDay() {
  const P = G.player, d = G.dayIndex, t = '8:00';
  for (const s of G.extra) {
    const x = s.dl; if (!x) continue;
    const N = s.name, C = s.code, has = !!(P.pos[C] || P.mpos[C]), own = m => { if (has) G.dayEvents.push(m); };
    const news = (text, o = {}) => pushNews({ day: d, time: t, type: 'big', stars: 3, codes: [C], text, hint: '', flash: false, ...o });
    if (d === x.D && s.delisted) {
      news(`${N}（${C}）が上場廃止。最終売買日の終値${px(s.dlPx)}円で決済しました`, { flash: true });
      if (G.sel === C) G.sel = unlockedStocks()[0]?.code || G.stocks[0].code;   // 選んでいた銘柄が消えたら、リストの先頭へ
      continue;
    }
    if (s.delisted) continue;
    if (d === x.F) {   // 前兆：観測記事だけは、難易度でヒントの出し方が変わる（ほかの観測記事と同じ）
      s.gap += Math.log(0.92); s.V *= 0.7;
      pushNews({ day: d, time: t, type: 'rumor', stars: 2, codes: [C], text: (DL_TEXT.sign[C] || DL_TEXT.sign.X717).replace('{n}', N), hint: `↓${N}`, flash: false });
      own(`保有中の${N}に、資金繰りの悪化を伝える観測記事が出ました。ほんとうなら、上場廃止になることもあります`);
    }
    if (d === x.M) {
      s.gap += Math.log(0.9); s.V *= 0.7;
      news(`【監理銘柄】東証、${N}（${C}）を監理銘柄（審査中）に指定。上場廃止のおそれ`);
      own(`保有中の${N}が監理銘柄に指定されました。上場廃止になると、最終売買日の終値で強制的に決済されます`);
    }
    if (d === x.B) {
      news((DL_TEXT.fail[C] || DL_TEXT.fail.X717).replace('{n}', N).replace('{c}', C), { flash: true });
      own(`保有中の${N}が倒産しました。今日から数日はストップ安で、売りたくても買い手がいない状態が続きます`);
    }
    if (d === x.B + x.k) s.V = s.prevClose;   // ストップ安が終わったら、その安い値段で取引される（元の値段へは戻ろうとしない）
    if (d === x.S) {
      news(`【整理銘柄】東証、${N}を整理銘柄に指定。最終売買日は${mdLabel(addTD(G.date, x.L - d))}、翌営業日に上場廃止`);
      own(`保有中の${N}が整理銘柄になりました。信用の新規建てはできません。現物の売買と、信用の返済はできます`);
    }
    if (d === x.L) {
      news(`本日は${N}の最終売買日。持っている株と信用の建玉は、本日の終値で決済されます`);
      own(`今日は${N}の最終売買日です。持っている株と信用の建玉は、今日の終値で決済されます`);
    }
  }
}
// 最終売買日の引け：注文の取り消し、保有分と建玉の決済（終値。1円以上）、上場廃止の旗、記録と通知
function delistSettle(s) {
  const P = G.player, C = s.code, x = Math.max(1, s.price);
  const ord = P.orders.filter(o => o.code === C);
  if (ord.length) { P.orders = P.orders.filter(o => o.code !== C); G.dayEvents.push(`${s.name}の注文${ord.length}件を、上場廃止のため取り消しました`); }
  const q = P.pos[C]?.qty;
  if (q) { const avg = P.pos[C].avg; fill(s, 'sell', q, Math.round(x * q), x, 'delist', false); G.dayEvents.push(`${s.name}の上場廃止にともない、${q.toLocaleString()}株を${px(x)}円で決済しました（損益 ${yenS(x * q - avg * q)}円）`); }
  const mp = P.mpos[C];
  if (mp) {
    const n = P.sells.length; mfill(s, mp.side === 'buy' ? 'sell' : 'buy', mp.qty, x * mp.qty, x, 'delist');
    G.dayEvents.push(`${s.name}の上場廃止にともない、信用の${mp.side === 'buy' ? '買い建て' : '売り建て'}${mp.qty.toLocaleString()}株を${px(x)}円で返済しました（損益 ${yenS(P.sells[n]?.pnl || 0)}円）`);
  }
  if (P.cash < 0) G.dayEvents.push(`保証金を超える損が出たため、現金が${yen(-P.cash)}円のマイナス（借金）になりました`);
  s.delisted = true; s.dlPx = x; s.stop = null;
  const e = { type: 'delist', code: C, day: G.dayIndex, date: G.date, px: x, cash: P.cash, asset: netAsset() };   // asset = 決済したあとの総資産（D3 の破産の判定用）
  G.dlog.push(e); emitGame('delist', e);
}
// 注文パネルの注意（倒産・上場廃止と、新規上場の信用の制限・上場日の成行）
function stockWarn(s) {
  const w = [dlWarn(s)];
  if (s.ipo && !s.delisted) {
    if (ipoStage(s) === 'first' && G.phase === 'pre' && UI.type === 'mkt') w.push('上場日の成行は、初値で約定します。初値は気配と大きく違うことがあります。');
    if (UI.acct === 'margin') { const p = mPos(s.code), close = p && p.side !== UI.side; if (!close) w.push(ipoMgMsg(s, UI.side)); }
  }
  return w.filter(Boolean).join(' ');
}
// 最終売買日の前日・当日に、保有・建玉がある銘柄の注意（注文パネル）
function dlWarn(s) {
  if (s.delisted) return `${s.name}は上場廃止になりました（最終売買日の終値${px(s.dlPx)}円で決済）。取引はできません。`;
  const x = s.dl, P = G.player; if (!x) return '';
  const has = P.pos[s.code] || P.mpos[s.code];
  if (G.dayIndex === x.L - 1 && has) return '明日が最終売買日です。保有分と建玉は終値で決済されます。';
  if (G.dayIndex === x.L) return has ? '今日が最終売買日です。保有分と建玉は今日の終値で決済されます。' : '今日が最終売買日です（明日、上場廃止）。';
  if (dlStage(s) === 'seiri') return '整理銘柄です。信用の新規建てはできません。';
  return '';
}

/* ===================== 新規上場（追加銘柄のうち ipo のある銘柄） ===================== */
// 日程は hash01 だけで決める（共通の乱数も専用乱数も使わない）。上場前は隠し、各ループでとばし、専用乱数も引かない。
// 前身（ipo.from）が上場廃止になったら、廃止日の5〜15営業日後に前倒しする（通常の上場日のほうが早ければそのまま）。
// 上場日：8:00 に速報、寄り付き前は気配（公開価格の0.75〜2.3倍）、9:00 に初値が決まり、その日は初値を基準に通常の値幅制限。
// 保存するのは s.ipo だけ（状態は日数から決まる：ipoStage）
const IPO_NEW = 5, IPO_MG_BUY = 5, IPO_MG_SELL = 20, IPO_ANN = 10;   // 「新規上場」の表示の日数、信用買い・空売りができるまでの営業日、承認のお知らせを何営業日前に出すか
function ipoPlan(seed, x) {
  const h = k => hash01(`${seed}/ipo/${x.code}/${k}`);
  const day = x.ipo.lo + Math.floor(h('day') * (x.ipo.hi - x.ipo.lo + 1));
  const px0 = Math.round((1000 + h('px') * 1500) / 10) * 10;   // 公開価格 1,000〜2,500円（10円単位）
  const r = h('up') < 0.8 ? 0.10 + h('r') * 0.70 : -(0.02 + h('r') * 0.13);   // 初値：8割は +10〜+80%、2割は −2〜−15%（公募割れ）
  return { day, base: day, ann: day - IPO_ANN, px: px0, open: roundTick(px0 * (1 + r)), early: false, from: x.ipo.from };
}
const preIpo = s => !!s.ipo && G.dayIndex < s.ipo.day;
const live = s => !s.delisted && !preIpo(s);   // 上場していて、廃止されていない
// none / pre（上場前）/ first（上場日）/ new（上場から5営業日）/ listed
function ipoStage(s, d = G.dayIndex) {
  const x = s.ipo; if (!x) return 'none';
  return d < x.day ? 'pre' : d === x.day ? 'first' : d < x.day + IPO_NEW ? 'new' : 'listed';
}
// 前身の上場廃止を受けて、上場を前倒しする（最終売買日の引けに呼ばれる。廃止日は翌営業日）
function ipoAdvance(e) {
  for (const s of G.extra) {
    const x = s.ipo; if (!x || x.from !== e.code || G.dayIndex >= x.day) continue;
    const day = ipoEarlyDay(G.seed, s.code, e.day + 1);
    if (day >= x.day) continue;
    const told = G.dayIndex >= x.ann;   // 承認のお知らせを、もう出していたか
    Object.assign(x, { day, early: true, ann: Math.max(day - IPO_ANN, G.dayIndex + 1), chg: told });
  }
}
onGame('delist', ipoAdvance);
const ipoEarlyDay = (seed, code, D) => D + 5 + Math.floor(hash01(`${seed}/ipo/${code}/early`) * 11);   // 廃止日 D の5〜15営業日後
// 日程の関数だけで求めた上場日（前身が自然に廃止になる場合の前倒しを含む。分布の集計と確認用）
function ipoSchedule(seed, code) {
  const x = XDEFS.find(d => d.code === code), ip = ipoPlan(seed, x), dp = dlPlan(seed, x.ipo.from);
  const e = dp ? ipoEarlyDay(seed, code, dp.D) : Infinity, early = !!dp && dp.L < ip.day && e < ip.day;
  return { ...ip, day: early ? e : ip.day, early };
}
// 朝：承認（または上場日の変更）のお知らせ、上場日の速報
function ipoDay() {
  const d = G.dayIndex, P = G.player;
  for (const s of G.extra) {
    const x = s.ipo; if (!x) continue;
    const news = (text, o = {}) => pushNews({ day: d, time: '8:00', type: 'big', stars: 3, codes: [s.code], text, hint: '', flash: false, ...o });
    const when = mdLabel(addTD(G.date, x.day - d));
    if (d === x.ann && d < x.day) news(x.chg ? `【上場日の変更】東証、${s.name}の新規上場日を${when}に変更（前倒し）` : `【上場承認】東証、${s.name}の新規上場を承認。上場日は${when}`);
    if (d === x.day) news(`【新規上場】${s.name}（${s.code}）が本日、${x.mkt || '東証グロース'}に新規上場。公開価格${px(x.px)}円${x.early ? `（上場廃止になった${byCode(x.from)?.name || x.from}の後継として、上場を前倒し）` : ''}`, { flash: true });
  }
}
// 上場日の寄り付き：初値で始まり、その日は初値を基準に通常の値幅制限。値動きの乱数はここから引く
function ipoOpen(s) {
  const x = s.ipo, o = x.open, w = limitWidth(o);
  s.limUp = Math.round((o + w) * 10) / 10; s.limDn = Math.max(1, Math.round((o - w) * 10) / 10);
  s.lp = Math.log(o); s.price = s.open = s.high = s.low = o; s.stop = null; s.gap = 0; s.pend = []; s.shock = 0;
  s.V = o; s.h = 2;   // 上場したては値動きが荒い（GARCH の h。日がたつと元に戻る）
  x.date = G.date;
  const r = o / x.px - 1;
  pushNews({ day: G.dayIndex, time: '9:00', type: 'big', stars: 3, codes: [s.code], text: `【初値】${s.name}の初値は${px(o)}円（公開価格比 ${pctS(r)}）${r < 0 ? '。公募割れのスタート' : ''}`, hint: '', flash: Math.abs(r) >= 0.3 });
}
// 上場日の寄り付き前の気配（10分ごとに6段階で、公開価格から初値へ近づく。乱数なし）
function ipoQuote(s) {
  if (ipoStage(s) !== 'first' || G.phase !== 'pre') return null;
  const x = s.ipo, f = Math.min(6, Math.floor(G.preMin / 10) + 1) / 6;
  return { p: roundPx(s, x.px + (x.open - x.px) * f), side: x.open >= x.px ? '買い気配' : '売り気配' };
}
// 信用の新規建ての制限（上場から5営業日は不可、20営業日までは買いだけ）。できるなら ''
function ipoMgMsg(s, side) {
  const x = s.ipo; if (!x) return '';
  const k = G.dayIndex - x.day;
  if (k < IPO_MG_BUY) return `${s.name}は上場から${IPO_MG_BUY}営業日は信用取引ができません（あと${IPO_MG_BUY - k}営業日。現物の売買はできます）。`;
  if (side === 'sell' && k < IPO_MG_SELL) return `${s.name}の空売り（信用の新規売り）は、上場から${IPO_MG_SELL}営業日後からです（あと${IPO_MG_SELL - k}営業日）。`;
  return '';
}

/* ===================== 梅山カンパニー（ファストスターターの幻の銘柄） ===================== */
// ランダム相場だけ。G.stocks には入れず G.ume に持ち、乱数は専用（G.ume.r）なので、ほかの30銘柄・指数・ニュースは変わらない。
// 値動き：日ごとの「社長の機嫌」（−2〜+2）の向きに流れ、公開価格 200,909円へゆっくり戻る。値幅制限に当たりやすいくらい荒い
function makeUme(seed) {
  const p = UME.price, sig = SECTORS.growth.sig * UME.sm;
  return {
    code: UME.code, name: UME.name, sector: 'growth', desc: UME.desc, unlock: 1, rec: [], ume: true,
    listDay: 1 + Math.floor(hash01(seed + 'umeyama') * 4),   // 2〜5日目のどこかの朝に上場する
    shares: 1e6, div: 0, sig, beta: 0, idio: sig, mu: 0, kappa: 0, jump: 0, jsize: 0,
    price: p, lp: Math.log(p), prevClose: p, open: p, high: p, low: p, dayVol: 0,
    V: p, h: 1, eps: -909, bps: 909, consensus: 0, nextEarn: -1, minVol: 15,
    shock: 0, gap: 0, pend: [], intraday: [], daily: [], pins: [], limUp: p, limDn: p, stop: null,
    mood: 0, r: { s: (hash01(seed + 'umeyama/rng') * 4294967296) | 0, spare: null },
  };
}
const umeListed = () => !!G.ume && G.dayIndex >= G.ume.listDay;
// 朝：上場の速報、前日終値と値幅制限、その日の社長の機嫌（ときどき、うわさで分かる）
function umeDay(first) {
  const s = G.ume; if (!umeListed()) return;
  const R = s.r;
  if (G.dayIndex === s.listDay) {
    s.prevClose = UME.price;
    pushNews({ day: G.dayIndex, time: '8:00', type: 'big', stars: 3, codes: [s.code], text: `【速報】${s.name}（${s.code}）が突如上場。公開価格は${px(UME.price)}円。1株から買えるが、何の会社かは誰も知らない`, hint: '', flash: true });
  } else if (!first) s.prevClose = s.price;
  const w = limitWidth(s.prevClose);
  s.limUp = Math.round((s.prevClose + w) * 10) / 10; s.limDn = Math.max(1, Math.round((s.prevClose - w) * 10) / 10);
  s.intraday = []; s.price = s.open = s.high = s.low = s.prevClose; s.lp = Math.log(s.price); s.dayVol = 0; s.stop = null;
  s.mood = Math.floor(R.next() * 5) - 2;
  if (s.mood && R.next() < 0.4) {
    const good = (s.mood > 0) === (R.next() < 0.75);
    pushNews({ day: G.dayIndex, time: '8:00', type: 'rumor', stars: 2, codes: [s.code], text: R.pick(UME_MOOD[good ? 'good' : 'bad']), hint: `${good ? '↑' : '↓'}${s.name}`, flash: false });
  }
}
function umeOpen() {
  const s = G.ume; if (!umeListed()) return;
  setPrice(s, Math.log(s.prevClose) + s.mood * 0.01 + s.sig / Math.sqrt(DAYS) * 0.35 * s.r.normal() + s.gap); s.gap = 0;
  s.open = s.high = s.low = s.price;
}
function umeStep(im) {
  const s = G.ume; if (!umeListed()) return;
  const R = s.r, prev = s.price, eps1 = s.sig / Math.sqrt(DAYS * MIN_PER_DAY) * im;
  let r = (s.mood * 0.012 + 0.04 * Math.log(UME.price / prev)) / MIN_PER_DAY + eps1 * R.normal();
  if (R.next() < 1 / 400) r += R.normal() * 0.05;   // ジャンプ
  if (s.pend.length) { for (const p of s.pend) { const a = p.left * 0.035; r += a; p.left -= a; } s.pend = s.pend.filter(p => Math.abs(p.left) > 2e-4); }
  r += s.shock; s.shock = 0;
  setPrice(s, s.lp + r);
  minuteBar(s, prev, r, eps1, R);
  if (R.next() < 1 / 900) {   // 1日に0.3件くらい
    const [t, imp0] = R.pick(UME_NEWS), imp = imp0 * (0.6 + R.next() * 0.8);
    applyStock(s, imp, 'live', false);
    pushNews({ day: G.dayIndex, time: minLabel(G.minute), type: 'ind', stars: 3, codes: [s.code], text: t, hint: `${arrow(imp)}${s.name}`, flash: Math.abs(imp) >= 0.05 });
  }
}
function umeClose() {
  const s = G.ume; if (!umeListed()) return;
  s.daily.push({ d: G.date, di: G.dayIndex, o: s.open, h: s.high, l: s.low, c: s.price, v: s.dayVol });
  if (s.daily.length > dailyKeep()) s.daily.shift();
}

/* ===================== ニュース ===================== */
// 取引できる銘柄か（r = ランク）。ファストスターターで、ランクで開く銘柄が足りないあいだは FAST_CODES の5銘柄だけ。梅山カンパニーは上場した日から
function isOpen(s, r = rank()) {
  if (s.delisted) return false;   // 上場廃止（データは残す。閲覧だけできる）
  if (preIpo(s)) return false;     // 上場前
  if (s.ume) return umeListed();
  if (xHidden(s, r)) return false;   // 追加銘柄はランク7まで隠す（ファスト ON でも）
  if (isReal()) return !isFast() || r >= SCEN.real.rank || FAST_CODES.real.includes(s.code);
  return s.unlock <= r || (isFast() && FAST_CODES.random.includes(s.code));
}
let X_ON = true;   // 確認用（__kabutore.xOn(false)）：新しいゲームに追加銘柄を作らない
function xHidden(s, r = rank()) { return !!s.extra && r < XRANK; }
function openRank(s) { for (let r = rank(); r <= RANKS.length; r++) if (isOpen(s, r)) return r; return RANKS.length; }
function unlockedStocks() { const r = rank(); return [...allStocks(), ...(G.ume ? [G.ume] : [])].filter(s => isOpen(s, r)); }
// 取引できない銘柄・業種だけの話は見せない（まだ関係がないので）。市場全体や社会のニュースは常に見せる
function newsVisible(n) {
  if (n.codes?.length) return n.codes.some(c => { const s = byCode(c); return s && (isOpen(s) || ((s.delisted || !!s.ipo) && !xHidden(s))); });   // 上場廃止の銘柄の過去のお知らせ、上場前の承認のお知らせも見せる（ランク7まで隠す追加銘柄は除く）
  if (n.sector) return G.stocks.some(s => s.sector === n.sector && isOpen(s));   // 30銘柄だけで決める（追加銘柄で、社会のニュースへの置き換えが変わらないように）
  return true;
}
function worldNews(mode) {
  const n = G.worldN = (G.worldN || 0) + 1;   // 乱数は使わない（相場の乱数の順番を変えない）
  const text = NEWS_WORLD[Math.floor(hash01(`${G.seed}world${n}`) * NEWS_WORLD.length)];
  pushNews({ day: G.dayIndex, time: mode === 'gap' ? '夜間' : minLabel(G.minute), type: 'world', stars: 3, codes: [], sector: null, text, hint: '市場への影響は小さい', flash: false });
}
const newsKeep = () => (isReal() ? NEWS_KEEP_REAL : G.extra?.length ? 200 : 120);
const newsShow = () => (isReal() ? NEWS_KEEP_REAL : G.extra?.length && rank() >= XRANK ? 80 : 50);   // 画面の一覧に出す件数（追加銘柄を隠しているあいだは30銘柄と同じ）
function pushNews(item) {
  // リアル相場は1年分（約200件）の当時のニュースを全部残す。ランダム相場は120件、追加銘柄のある50銘柄のゲームは200件
  item.id = ++G.newsId; G.news.push(item); if (G.news.length > newsKeep()) G.news.shift();
}
function pinFor(s, imp, mode) { s.pins.push({ d: G.dayIndex, m: mode === 'gap' ? 0 : G.minute, dir: Math.sign(imp) }); if (s.pins.length > 160) s.pins.shift(); }
function applyStock(s, imp, mode, real) {
  if (mode === 'gap') s.gap += imp; else { s.shock += 0.6 * imp; s.pend.push({ left: 0.4 * imp }); }
  if (real) s.V *= Math.exp(0.8 * imp);
  pinFor(s, imp, mode);
}
function applySector(k, imp, mode, real) {
  const mk = G.market;
  if (mode === 'gap') mk.secGap[k] = (mk.secGap[k] || 0) + imp;
  else mk.secShock[k] = (mk.secShock[k] || 0) + 0.6 * imp;
  for (const s of allStocks()) if (s.sector === k && live(s)) {
    if (mode !== 'gap') s.pend.push({ left: 0.4 * imp * (s.ssm ?? 1) });
    if (real) s.V *= Math.exp(0.5 * imp);
    if (Math.abs(imp) >= 0.01) pinFor(s, imp, mode);
  }
}
function applyMarket(imp, mode) {
  const mk = G.market;
  if (mode === 'gap') mk.gapM += imp;
  else { mk.shock += 0.6 * imp; for (const s of allStocks()) if (live(s)) s.pend.push({ left: 0.4 * imp * s.beta }); }
}
function arrow(x) { return x > 0 ? '↑' : '↓'; }
// 解放済みの銘柄は2倍出やすい（ニュースが1社に集中しすぎないように）
function pickStockForNews() { const r = rank(); const w = G.stocks.map(s => (s.unlock <= r ? 2 : 1)); let x = RNG.next() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < w.length; i++) { x -= w.at(i); if (x <= 0) return G.stocks.at(i); } return G.stocks.at(-1); }

function genNews(mode, type) {
  if (!type) {
    const x = RNG.next();
    type = x < 0.58 ? 'ind' : x < 0.76 ? 'sector' : x < 0.87 ? 'rumor' : x < 0.95 ? 'macro' : 'fx';
  }
  const sc = 0.6 + RNG.next() * 0.8;
  const time = mode === 'gap' ? '夜間' : minLabel(G.minute);
  const item = { day: G.dayIndex, time, type, stars: 3, codes: [], sector: null, hint: '', flash: false };
  if (type === 'macro' || type === 'fx') {
    const tp = RNG.pick(type === 'macro' ? NEWS_MACRO : NEWS_FX);
    item.text = tp.t.replace('{x}', tp.x ? RNG.pick(tp.x) : '');
    applyMarket(tp.m * sc, mode);
    const hints = [];
    if (Math.abs(tp.m) >= 0.008) hints.push(`${arrow(tp.m)}市場全体`);
    for (const k in tp.s) { applySector(k, tp.s[k] * sc, mode, true); hints.push(`${arrow(tp.s[k])}${SECTORS[k].short}`); }
    item.hint = hints.join(' ');
    item.flash = Math.abs(tp.m) >= 0.015;
  } else if (type === 'sector') {
    const k = pickStockForNews().sector;
    const [t, imp0] = RNG.pick(NEWS_SECTOR[k]); const imp = imp0 * sc * 0.5;
    item.text = t.replace('{x}', 5 + Math.floor(RNG.next() * 12)); item.sector = k;
    item.stars = RNG.next() < 0.8 ? 3 : 2;
    applySector(k, imp, mode, true);
    item.hint = `${arrow(imp)}${SECTORS[k].short}`;
  } else if (type === 'ind' || type === 'rumor') {
    const s = pickStockForNews();
    let tpl, imp;
    if (type === 'rumor') { [tpl, imp] = RNG.pick(NEWS_RUMOR); item.stars = RNG.next() < 0.5 ? 1 : 2; }
    else if (s.sector === 'growth' && RNG.next() < 0.35) { [tpl, imp] = RNG.pick(NEWS_GROWTH); }
    else { [tpl, imp] = RNG.pick(NEWS_IND); }
    imp *= sc * 0.42 * (s.sector === 'growth' ? 1.4 : 1);   // 1社あたり年10件前後なので、1件の影響は控えめに
    const real = item.stars === 3 || RNG.next() < (item.stars === 2 ? 0.75 : 0.45);
    item.text = tpl.replace('{n}', s.name).replace('{x}', 50 + Math.floor(RNG.next() * 40) * 10);
    item.codes = [s.code];
    applyStock(s, imp, mode, real);
    if (!real) G.denials.push({ at: G.clock + 40 + Math.floor(RNG.next() * 160), code: s.code, imp });
    item.hint = `${arrow(imp)}${s.name}`;
    item.flash = Math.abs(imp) >= 0.05;
  }
  if (!newsVisible(item)) {   // 株価への影響はそのまま。見えないニュースの一部だけ、代わりに社会のニュースを流す（多すぎないように）
    if (hash01(`${G.seed}worldp${G.worldK = (G.worldK || 0) + 1}`) < WORLD_RATE) worldNews(mode);
    return item;
  }
  pushNews(item);
  return item;
}
/* ===== 追加銘柄のニュース ===== */
// 追加銘柄（G.extra）の個別ニュース。30銘柄のニュース（maybeNews・genNews）とは別枠で、抽選は hash01 だけ（共通の乱数も専用乱数 s.r も引かない）。
// 銘柄ごと・日ごとに XN_P の確率で1件。キーに銘柄コードが入るので、銘柄を増やしてもほかの銘柄の抽選は変わらない。
// XN_GAP は夜間（寄り付きの窓 s.gap）、残りは場中のある1分（s.shock・s.pend・s.V。genNews と同じ足し方）。
// 出さないのは、上場前と上場日・上場廃止のあと、倒産しうる銘柄の前兆（s.dl.F）の日から先（倒産のお知らせだけにする）。初日も出さない
// XN_MUL = 種類ごとの影響の倍率（新興・低位・新規は大きく、高配当は小さく）。XN_PCUT = 優待のニュースのうち、廃止を選べる日の割合（廃止が出るのは1年チャレンジの1割弱）
const XN_P = 12 / 245, XN_GAP = .35, XN_RUMOR = .15, XN_MUL = { growth: 1.4, penny: 1.4, ipo: 1.4, div: .5 }, XN_PCUT = .06;
let XN_FX = 1;   // 効果の倍率（確認用。0 にすると、ニュースは出るが株価・配当・優待は動かない）
let XN_SKIP = null, XN_FORCE = null;   // 確認用：この銘柄のニュースを出さない / 次の1件をこの変化（dup など）のテンプレートにする
// [文面, 影響の基準値, データの変化]。変化：dup = 増配、dcut = 減配、pup = 優待の拡充、pchg = 優待の内容の変更、pcut = 優待の廃止
const XNEWS = {
  div: [['{n}が増配を発表、年間配当を{x}%引き上げ', .05, 'dup'], ['{n}が減配を発表', -.08, 'dcut'], ['{n}が配当を毎年減らさない方針を表明', .04],
    ['{n}の業績が会社の計画を上回って推移', .04], ['{n}が業績予想を下方修正、配当は据え置き', -.04], ['{n}が自社株買いを発表', .04]],
  cyc: [['{n}が海外の大型案件を{x}億円で受注', .07], ['{n}の受注残高が過去最高に', .05], ['{n}の主力製品の市況が上昇', .05],
    ['{n}の主力製品の市況が悪化、値下がりが続く', -.06], ['{n}が業績予想を上方修正', .08], ['{n}が業績予想を下方修正', -.09], ['{n}が海外工場の稼働を一時停止', -.05]],
  perk: [['{n}が株主優待の拡充を発表（{o}→{p}）', .05, 'pup'], ['{n}が株主優待の内容を変更（{o}→{p}）', -.01, 'pchg'], ['{n}が株主優待の廃止を発表', -.10, 'pcut'],
    ['{n}の既存店の売上高が前年比{y}%増', .03], ['{n}の既存店の売上高が前年比{y}%減', -.03], ['{n}が新しい形の店を出店、客足は好調', .03]],
  penny: [['{n}が第三者割当増資で{z}億円を調達（1株の価値が薄まる）', -.08], ['{n}が新株予約権の発行を発表（1株の価値が薄まる）', -.06], ['{n}が大手企業と資本業務提携', .10],
    ['{n}が新しい事業への参入を発表', .06], ['{n}が業績予想を下方修正', -.09], ['{n}が業績予想を上方修正、赤字幅が縮小', .07]],
  ipo: [['{n}が大口の受注を獲得', .07], ['{n}が大手企業と業務提携', .06], ['{n}が公募増資を発表（1株の価値が薄まる）', -.08],
    ['{n}の月次の売上高が前年比{y}%増', .04], ['{n}が業績予想を上方修正', .08], ['{n}の大株主が保有株の売り出しを発表', -.06]],
};
const XRUMOR = {
  div: [['観測記事：{n}が増配を検討か', .04], ['観測記事：{n}の利益が会社の計画を下回る見通しか', -.04]],
  cyc: [['観測記事：{n}が大型受注を獲得へ', .05], ['観測記事：{n}が減産を検討か', -.05]],
  perk: [['観測記事：{n}が株主優待の拡充を検討か', .04], ['観測記事：{n}が株主優待の見直しを検討か', -.04]],
  penny: [['観測記事：{n}に大手企業が出資を検討か', .07], ['観測記事：{n}が大規模な増資を検討か', -.06]],
  ipo: [['観測記事：{n}が大手企業と提携へ', .05], ['観測記事：{n}の大株主が株の売却を検討か', -.05]],
};
const xh = (s, k) => hash01(`${G.seed}/xn/${s.code}/${G.dayIndex}/${k}`);
const xpick = (s, k, a) => a[Math.min(a.length - 1, Math.floor(xh(s, k) * a.length))];
// 今日ニュースを出せる銘柄か
const xnOK = s => s.code !== XN_SKIP && live(s) && !['pre', 'first'].includes(ipoStage(s)) && !(s.dl && G.dayIndex >= s.dl.F);
// 今日のニュースの予定（null = なし、-1 = 夜間、0〜299 = 場中の分）
function xnPlan(s) { if (G.dayIndex < 1 || xh(s, 'p') >= XN_P) return null; return xh(s, 'g') < XN_GAP ? -1 : Math.floor(xh(s, 'm') * MIN_PER_DAY); }
// 今日がこの銘柄の配当・優待（廃止したものを含む）の権利確定日か（その日は配当・優待を変えるニュースを出さない＝変更は次の権利確定から）
function recDay(s) { if (!lastTradingDayOfMonth(G.date)) return false; const mo = monthOf(G.date); return s.rec.includes(mo) || !!s.perk?.m.includes(mo) || !!s.perkGone?.m.includes(mo); }
// 優待の文面の金額を差し替える（「食事券2,200円分」→「食事券3,300円分」）
const perkText = (t, y) => (/[\d,]+円/.test(t) ? t.replace(/[\d,]+円/, `${yen(y)}円`) : `${t}（${yen(y)}円相当）`);
function xNews(s, mode) {
  const rumor = !XN_FORCE && xh(s, 'r') < XN_RUMOR, pool = s.kind === 'normal' || s.kind === 'growth';
  const rd = recDay(s), sc = 0.6 + xh(s, 'sc') * 0.8, f = 1.1 + Math.floor(xh(s, 'f') * 11) / 100;
  // 選べるテンプレート：配当のない銘柄に配当の話、優待のない銘柄（廃止後）に優待の話は出さない。優待の廃止は1ゲームに1社1回まで。
  // 配当・優待を変える話は1社につき1年（DAYS 営業日）に1回まで（s.xnChg = 最後に変えた日）
  const ok = ([t, , c]) => !(c && (rd || G.dayIndex - (s.xnChg ?? -DAYS) < DAYS)) && !(['dup', 'dcut'].includes(c) && !s.div) && !(['pup', 'pchg', 'pcut'].includes(c) && !s.perk) && !(c === 'pcut' && (G.xnPerkCut || (!XN_FORCE && xh(s, 'pc') >= XN_PCUT))) && !(s.kind === 'perk' && !s.perk && /優待/.test(t));
  let list;
  if (rumor) list = pool ? NEWS_RUMOR.slice(0, 3) : XRUMOR[s.kind];   // 30銘柄と同じうわさ（「不正のうわさ」は除く）
  else if (pool) list = (s.kind === 'growth' && xh(s, 'gw') < 0.35 ? NEWS_GROWTH : NEWS_IND).map(([t, v]) => [t, v, t.includes('増配') ? 'dup' : null]);
  else list = XNEWS[s.kind];
  list = list.filter(x => rumor || ok(x));
  if (!s.perk && s.kind === 'perk' && rumor) list = list.filter(([t]) => !/優待/.test(t)).concat([['観測記事：{n}の業績が会社の計画を上回る見通しか', .04]]);
  if (XN_FORCE) { const f = XNEWS[s.kind].filter(x => x[2] === XN_FORCE && ok(x)); if (f.length) list = f; XN_FORCE = null; }
  const [tpl, base, chg] = xpick(s, 'k', list);
  const imp = base * sc * 0.42 * (XN_MUL[s.kind] || 1) * XN_FX;
  const real = !rumor || xh(s, 'real') < 0.7;
  const P = G.player, held = !!(P.pos[s.code] || P.mpos[s.code]);
  let text = tpl.replace('{n}', s.name).replace('{x}', chg === 'dup' ? Math.round((f - 1) * 100) : 50 + Math.floor(xh(s, 'x') * 40) * 10)
    .replace('{y}', 2 + Math.floor(xh(s, 'y') * 9)).replace('{z}', 5 + Math.floor(xh(s, 'z') * 26));
  // データの変化（効果が0の確認のときは変えない）。反映は次の権利確定から（権利確定日にはこの種類を出さない）
  if (chg && XN_FX) s.xnChg = G.dayIndex;
  if (chg && s.perk) {
    const o = s.perk.text, y = chg === 'pup' ? Math.round(s.perk.yen * 1.5 / 100) * 100 : s.perk.yen;
    const nt = chg === 'pup' ? perkText(o, y) : chg === 'pchg' ? `選べるギフト${yen(y)}円分` : '';
    text = text.replace('{o}', o).replace('{p}', nt);
    if (XN_FX) {
      if (chg === 'pcut') { s.perkGone = { m: s.perk.m, text: o }; s.perk = null; G.xnPerkCut = s.code; if (held) G.dayEvents.push(`保有中の${s.name}が株主優待をやめます。次の権利確定日から、優待は付きません`); }
      else { s.perk = { ...s.perk, yen: y, text: nt }; if (held) G.dayEvents.push(`保有中の${s.name}の株主優待が「${nt}」になります（次の権利確定から）`); }
    }
  } else if (chg && s.div && XN_FX) {
    const old = s.div; s.div = Math.round(s.div * (chg === 'dup' ? f : 0.7) * 10) / 10;
    if (held) G.dayEvents.push(`保有中の${s.name}の年間配当が1株${old}円から${s.div}円になります（次の権利確定から）`);
  }
  const item = { day: G.dayIndex, time: mode === 'gap' ? '夜間' : minLabel(G.minute), type: rumor ? 'rumor' : 'ind', stars: rumor ? 2 : 3, codes: [s.code], sector: null, text, hint: `${arrow(base)}${s.name}`, flash: Math.abs(imp) >= 0.05, xn: true };
  applyStock(s, imp, mode, real);
  if (!real) G.denials.push({ at: G.clock + 40 + Math.floor(xh(s, 'dn') * 160), code: s.code, imp, xn: true });
  pushNews(item);
}
// 夜間の分（startDay）と、場中の分（stepMinute。maybeNews のあと）
function xNewsDay() { for (const s of G.extra) if (xnOK(s) && xnPlan(s) === -1) xNews(s, 'gap'); }
function xNewsMinute() { for (const s of G.extra) if (xnPlan(s) === G.minute && xnOK(s)) xNews(s, 'live'); }
function denyNews(dn) {
  const s = byCode(dn.code); const imp = -0.8 * dn.imp;
  applyStock(s, imp, 'live', false);
  if (isOpen(s)) pushNews({ day: G.dayIndex, time: minLabel(G.minute), type: 'deny', stars: 3, codes: [s.code], text: `${s.name}が一部の報道について「当社が発表したものではない」とコメント`, hint: `${arrow(imp)}${s.name}`, flash: false, ...(dn.xn ? { xn: true } : {}) });
}
// 1日あたりの目安：企業1.5件、業種0.15件、うわさ0.3件、経済0.2件、為替0.06件
const NEWS_RATE = [['ind', 1 / 200], ['sector', 1 / 2000], ['rumor', 1 / 1000], ['macro', 1 / 1500], ['fx', 1 / 5000]];
function maybeNews() {
  let x = RNG.next();
  for (const [type, p] of NEWS_RATE) { if (x < p) { genNews('live', type); return; } x -= p; }
}

/* ===================== 1日の流れ ===================== */
function startDay(first) {
  const P = G.player, mk = G.market;
  G.phase = 'pre'; G.preMin = 0; G.minute = 0; G.dayXP = 0; G.dayEvents = []; G.dayWin = {};
  resetView();   // 日が変わったらチャートは最新の位置に戻す
  UI.acct = 'cash';   // 信用の注文を間違えて出さないよう、毎朝「現物」に戻す
  const y = +G.date.slice(0, 4); if (y !== P.year) { P.year = y; P.realizedYear = 0; P.taxYear = 0; }
  if (!first) { for (const s of allStocks()) if (live(s)) s.prevClose = s.price; mk.idxPrev = mk.idx; }   // 前日の終値を確定
  for (const s of allStocks()) {
    if (!live(s)) continue;   // 上場前と上場廃止の銘柄はとばす
    const w = limitWidth(s.prevClose);
    s.limUp = Math.round((s.prevClose + w) * 10) / 10; s.limDn = Math.max(1, Math.round((s.prevClose - w) * 10) / 10);
    if (s.tick1) { s.limUp = Math.floor(s.prevClose + w); s.limDn = Math.max(1, Math.ceil(s.prevClose - w)); }   // 低位株は境界も1円刻み
    s.intraday = []; s.price = s.open = s.high = s.low = s.prevClose; s.lp = Math.log(s.price); s.dayVol = 0; s.stop = null;
    if (isReal()) realLimits(s);
    if (ipoStage(s) === 'first') { s.limUp = roundPx(s, s.ipo.px * 2.3); s.limDn = roundPx(s, s.ipo.px * 0.75); }   // 上場日：初値が決まるまでの気配は公開価格の0.75〜2.3倍
  }
  mk.idx = mk.idxPrev;
  if (P.pendingDiv > 0) {
    const net = DIFF[G.diff].tax ? P.pendingDiv * (1 - TAX) : P.pendingDiv;
    P.cash += net; P.divTotal += net; P.pendingDiv = 0;
    pushNews({ day: G.dayIndex, time: '8:00', type: 'div', stars: 3, codes: [], text: `配当金 ${yen(net)}円が入金されました（実際の株では約3か月後に入金されます）`, hint: '' });
    complete('div');
  }
  if (P.pendingPerk > 0) {   // 株主優待は現金相当をそのまま入れる（課税なし）
    P.cash += P.pendingPerk; P.perkTotal += P.pendingPerk;
    pushNews({ day: G.dayIndex, time: '8:00', type: 'div', stars: 3, codes: [], text: `株主優待 ${yen(P.pendingPerk)}円相当が入金されました（実際の株では、優待は商品券や食事券などで届きます。ここでは現金相当で入れます）`, hint: '' });
    P.pendingPerk = 0;
  }
  if (!first && !isReal()) {
    const x = RNG.next(), n = x < 0.45 ? 0 : x < 0.85 ? 1 : 2;
    for (let i = 0; i < n; i++) genNews('gap');
    if (G.extra.length) xNewsDay();
  }
  if (isReal()) pushRealNews();
  if (realEv()) realEarn('pre');   // 当時の決算（休みの日や朝の発表）
  if (G.ume) umeDay(first);
  if (G.extra.length) { dlDay(); ipoDay(); }
  if (G.dayIndex === G.crashDay) {
    mk.gapM -= 0.045; mk.hM = Math.max(mk.hM, 4.5); mk.crashLeft = -0.05; mk.crashMin = 220;
    G.crashStart = asset(); G.crashCheck = G.dayIndex + 5;
    pushNews({ day: G.dayIndex, time: '夜間', type: 'big', stars: 3, codes: [], text: '世界的な金融不安が広がり、海外市場で株価が急落。今日は全面安の予想', hint: '↓市場全体', flash: true });
  }
  P.dayStart = asset();
  buildTape();
}

function openMarket() {
  const mk = G.market;
  if (isReal()) for (const s of G.stocks.concat(G.extra)) {
    if (s.extra && !live(s)) continue;   // 上場前の新規上場
    if (ipoStage(s) === 'first') { ipoOpen(s); realLimits(s); s.dsig = Math.max(s.rsig * 0.7, Math.abs(Math.log(realClose(s, G.dayIndex) / s.price)) * 0.5); continue; }   // 上場日は実際の初値で始まる（乱数なし）
    realOpen(s, s.extra ? s.r : RNG); s.open = s.high = s.low = s.price;
  }
  else openGaps();
  G.phase = 'open'; G.minute = 0;
  updateIndex(true);
  for (const o of [...G.player.orders]) if (o.type === 'mkt') { removeOrder(o); marketTrade(byCode(o.code), o.side, o.qty, 'mkt', o.mg); }
  toast('9:00 寄り付き。取引が始まりました');
}
// ランダム相場の寄り付き：夜のあいだのニュースと揺れで窓を開ける
function openGaps() {
  const mk = G.market;
  const gM = mk.gapM + MKT_SIG * Math.sqrt(mk.hM / DAYS) * 0.35 * RNG.normal(); mk.gapM = 0;
  const gS = {}; for (const k in SECTORS) { gS[k] = (mk.secGap[k] || 0) + SECTORS[k].ss / Math.sqrt(DAYS) * 0.3 * RNG.normal(); mk.secGap[k] = 0; }
  for (const s of G.stocks) gapOpen(s, gM, gS, RNG);
  for (const s of G.extra) { if (!live(s)) continue; if (dlStopLow(s)) { stopLowStep(s, true); continue; } if (ipoStage(s) === 'first') { ipoOpen(s); continue; } gapOpen(s, gM, gS, s.r); }   // 窓の市場・業種の分（gM・gS）は読むだけ
  if (G.ume) umeOpen();
}
function gapOpen(s, gM, gS, R) {
  const r = s.beta * gM + gS[s.sector] * (s.ssm ?? 1) + s.idio * Math.sqrt(s.h / DAYS) * 0.35 * R.normal() + s.gap; s.gap = 0;
  setPrice(s, Math.log(s.prevClose) + r);
  s.open = s.high = s.low = s.price;
}
function lunchBreak() {
  const mk = G.market;
  if (!isReal()) {
    mk.shock += MKT_SIG * Math.sqrt(mk.hM / DAYS) * 0.1 * RNG.normal();
    for (const s of G.stocks) s.shock += s.idio * Math.sqrt(s.h / DAYS) * 0.12 * RNG.normal();
    for (const s of G.extra) if (live(s)) s.shock += s.idio * Math.sqrt(s.h / DAYS) * 0.12 * s.r.normal();
  }
  toast('11:30 昼休み。12:30から後場が始まります');
}

function tick() {
  if (G.phase === 'pre') { G.preMin++; if (G.preMin >= 60) openMarket(); return; }
  if (G.phase !== 'open') return;
  stepMinute(); G.minute++; G.clock++;
  marginWatch();
  if (G.minute === 150) lunchBreak();
  if (G.minute >= MIN_PER_DAY) closeMarket();
}

const divOn = () => rank() >= 4;   // 配当はカレンダーと同じランク4から（それまでは配当も権利落ちもない）
function lastTradingDayOfMonth(iso) { return monthOf(nextTD(iso)) !== monthOf(iso); }

const BK_WARN = 0.2;   // 総資産が初期資金のこの割合を切ったら、引けに注意を出す（破産の前ぶれ）
function closeMarket() {
  G.phase = 'closed';
  const mk = G.market, P = G.player, D = DIFF[G.diff];
  const r0 = rank();
  // 日足と、ボラティリティの更新（GARCH型）
  for (const s of allStocks()) {
    if (!live(s)) continue;
    s.daily.push({ d: G.date, di: G.dayIndex, o: s.open, h: s.high, l: s.low, c: s.price, v: s.dayVol });
    if (s.daily.length > dailyKeep()) s.daily.shift();
    const z = (s.dayZ || 0) / (s.idio * D.vol / Math.sqrt(DAYS)); s.dayZ = 0;   // 大きく動いた翌日ほど荒れやすい
    s.h = clamp(0.04 + 0.06 * z * z + 0.90 * s.h, 0.4, 3);
    s.V *= Math.exp(s.mu / DAYS);
  }
  const zM = (mk.dayZ || 0) / (MKT_SIG * D.vol / Math.sqrt(DAYS)); mk.dayZ = 0;
  mk.hM = clamp(0.04 + 0.06 * zM * zM + 0.90 * mk.hM, 0.4, mk.hM > 3 ? 5 : 3);
  if (G.ume) umeClose();
  mk.idxDaily.push({ d: G.date, o: mk.idxOpen, h: mk.idxHigh, l: mk.idxLow, c: mk.idx });
  if (mk.idxDaily.length > dailyKeep()) mk.idxDaily.shift();
  // 最終売買日の銘柄：注文を取り消し、保有分と建玉を終値で決済する（注文の失効より前に、銘柄ごとに知らせる）
  for (const s of G.extra) if (s.dl && !s.delisted && G.dayIndex === s.dl.L) delistSettle(s);
  // 失効
  if (P.orders.length) { G.dayEvents.push(`未約定の注文${P.orders.length}件は、当日限りのため大引けで失効しました`); P.orders = []; }
  // 決算発表（引け後）。追加銘柄は30銘柄のあとに、専用の乱数で
  for (const s of G.stocks) if (s.nextEarn === G.dayIndex) earnings(s, RNG);
  for (const s of G.extra) if (s.nextEarn === G.dayIndex) { if (!live(s) || ipoStage(s) === 'first' || ['fail', 'seiri'].includes(dlStage(s))) s.nextEarn += 60; else earnings(s, s.r); }   // 上場前・上場日と、倒産したあとは決算を出さない
  // リアル相場：引けのあとの当時の決算、権利付き最終日の配当・優待
  if (realEv()) { realEarn('close'); realRights(); }
  // 配当の権利確定
  if (lastTradingDayOfMonth(G.date)) {
    const mo = monthOf(G.date);
    for (const s of allStocks()) {
      if (!live(s)) continue;
      if (s.perkGone?.m.includes(mo) && (P.pos[s.code]?.qty || 0) > 0) G.dayEvents.push(`${s.name}の権利確定日。優待がなくなったため、優待は付きません`);
      const dv = divOn() && s.div && s.rec.includes(mo), pk = s.perk && s.perk.m.includes(mo);
      if (!dv && !pk) continue;
      const per = dv ? s.div / s.rec.length : 0;
      const q = P.pos[s.code]?.qty || 0, mp = P.mpos[s.code];
      if (dv) {
        if (q > 0) { P.pendingDiv += q * per; G.dayEvents.push(`${s.name}の権利確定日。${q}株×${per}円＝${yen(q * per)}円の配当の権利を得ました（明日入金）`); }
        // 信用の建玉は配当と同じ額をやりとりする（買い建ては受け取り、売り建ては支払う）
        if (mp?.side === 'buy') { P.pendingDiv += mp.qty * per; G.dayEvents.push(`信用で買い建て中の${s.name}の権利確定日。配当と同じ額（${yen(mp.qty * per)}円）を受け取ります（明日入金）`); }
        else if (mp) { P.cash -= mp.qty * per; G.dayEvents.push(`信用で売り建て中の${s.name}の権利確定日。配当と同じ額（${yen(mp.qty * per)}円）を支払いました`); }
      }
      // 株主優待：権利確定日の引けに、現物を100株以上持っていれば確定（現金相当を翌朝入金。課税なし）。信用の買い建てには付かない
      if (pk) {
        if (q >= PERK_LOT) { P.pendingPerk += s.perk.yen; G.dayEvents.push(`${s.name}の権利確定日。株主優待（${s.perk.text}）の権利を得ました。現金相当の${yen(s.perk.yen)}円を明日受け取ります`); }
        else if (mp?.side === 'buy') G.dayEvents.push(`信用で買い建て中の${s.name}は、株主優待（${s.perk.text}）の対象外です。優待がもらえるのは、現物を${PERK_LOT}株以上持っているときだけです`);
      }
      const drop = per + (pk ? s.perk.yen / PERK_LOT * PERK_DROP : 0);   // 権利落ち：配当の分に、優待相当額の一部を足す
      s.gap += Math.log(1 - drop / s.price);
      s.V *= 1 - drop / s.price;
    }
  }
  marginDayEnd();
  // 成績
  const a = asset(), dayPnl = a - P.dayStart;
  const movers = unlockedStocks().map(s => ({ s, ch: s.price / s.prevClose - 1 })).sort((x, y) => y.ch - x.ch);
  G.last = { date: G.date, a, dayPnl, dp: dayPnl / P.dayStart, idx: mk.idx, ic: mk.idx / mk.idxPrev - 1, up: movers.filter(x => x.ch > 0).slice(0, 3).map(x => [x.s.name, x.ch]), down: movers.filter(x => x.ch < 0).reverse().slice(0, 3).map(x => [x.s.name, x.ch]) };
  P.hist.push({ d: G.date, a, idx: mk.idx });
  P.peak = Math.max(P.peak, a); P.maxDD = Math.max(P.maxDD, 1 - a / P.peak);
  const held = Object.keys(P.pos);
  if (dayPnl > 0 && held.length) addXP(5, '1日の資産がプラス', true);
  if (held.length) addXP(3, '株を持って1日を終えた', true);
  const secs = new Set(held.map(c => byCode(c).sector));
  if (secs.size >= 3) complete('diverse');
  if (secs.size >= 5) complete('sec5');
  if (secs.size >= 5) { G.div5++; if (G.div5 === 5) addXP(20, '5業種以上に分散して1週間保有'); } else G.div5 = 0;
  if (G.scen === 'year' && a / P.start - 1 >= 0.10) complete('plus10');
  if (a / P.start >= 1.2) complete('plus20');
  if (dayPnl / P.dayStart >= 0.03) { complete('day3'); if (isReal()) complete('realday'); }
  if (!P.trades.some(t => t.d === G.dayIndex)) complete('idle');
  if (held.some(c => G.dayIndex - P.pos[c].d >= 3)) complete('hold3');
  if (Object.keys(P.mpos).length >= 3) complete('m3');
  const done = G.dayIndex + 1;
  if (done === 20 && a / P.start > mk.idx / P.startIdx) complete('beat');
  if (done === 20 && a > P.start && P.maxDD <= 0.10) complete('dd10');
  if (G.crashCheck === G.dayIndex && a >= G.crashStart * 0.9) complete('crash');
  const S = SCEN[G.scen];
  // 破産：引けのあと（追証・強制決済・上場廃止の決済のあと）に総資産が0以下。現金がマイナスなだけでは判定せず、場中も見ない。信用の練習中は判定しない
  if (!UI.practice && a <= 0) { G.bankrupt = true; G.ended = true; G.dayEvents.push('総資産が0円以下になりました。破産です'); }
  else if (!UI.practice && a < P.start * BK_WARN) { const m = `総資産が${yen(a)}円になりました（初めの資金の${Math.max(0, a / P.start * 100).toFixed(0)}%）。これ以上減ると、破産でゲームが終わります`; G.dayEvents.push(m); toast(m, 'warn'); }
  if (!G.bankrupt && S.days && done >= S.days) G.ended = true;
  if (G.ended) {
    const win = a > P.start, hard = G.diff === 'hard';
    if (hard && win) { complete('hard'); if (P.feesTotal <= (a - P.start) * 0.1) complete('fee'); }
    if (G.scen === 'real' && a / P.start > mk.idx / P.startIdx) complete('realbeat');
    if (hard && G.scen === 'year' && a / P.start - 1 >= 0.10) complete('legend');
  }
  G.last.xp = G.dayXP; G.last.events = [...G.dayEvents]; G.last.rankUp = rank() > r0;
  if (G.bankrupt) clearSave(); else saveGame();
  saveProfile();
  render();
  dailyReport();
}

/** 決算発表（引け後）。驚きの分は翌日の寄り付きの窓になる。R = 使う乱数 */
function earnings(s, R) {
  const P = G.player;
  const cons = s.consensus, sd = s.esd ?? (s.sector === 'growth' ? 0.2 : 0.06);
  const act = cons + Math.abs(cons) * R.normal() * sd;
  const sur = (act - cons) / Math.abs(cons);
  const imp = clamp(sur * (s.sector === 'growth' ? 0.4 : 0.6) - 0.005 + R.normal() * 0.01, -0.15, 0.15);
  s.gap += imp; s.V *= Math.exp(imp * 0.8);
  s.eps = s.eps + (act - cons) * 2;
  const word = sur > 0.03 ? `予想を${Math.round(sur * 100)}%上回る` : sur < -0.03 ? `予想を${Math.round(-sur * 100)}%下回る` : 'ほぼ予想通り';
  pushNews({ day: G.dayIndex, time: '15:30', type: 'earn', stars: 3, codes: [s.code], text: `決算：${s.name}の四半期の1株利益は${act.toFixed(1)}円（市場予想${cons.toFixed(1)}円）。${word}`, hint: `明日の寄り付き${arrow(imp)}`, flash: Math.abs(imp) > 0.05 });
  s.pins.push({ d: G.dayIndex + 1, m: 0, dir: Math.sign(imp) });
  if (P.pos[s.code]) { G.dayEvents.push(`保有中の${s.name}が決算を発表（${word}）。明日の寄り付きで株価に反映されます`); complete('earn'); }
  s.consensus = (s.eps / 4) * (1 + s.mu / 4 + R.normal() * 0.02);
  s.nextEarn += 60;
}

function nextDay() {
  G.dayIndex++; G.date = isReal() ? REAL.dates[G.dayIndex] : nextTD(G.date);
  startDay(false);
  if (G.mcall) toast('追証が出ています。今日の引けまでに、保証金維持率を20%以上に戻してください', 'warn');
  saveGame();
  render();
}

/* ===================== 売買 ===================== */
// 総資産 = 現金 ＋ 現物の時価 ＋ 信用の評価損益 − 未精算の費用。翌朝に入金される配当・優待は含めない。画面の総資産・上場廃止の記録（G.dlog）・破産の判定はすべてこれを使う
function netAsset() { const P = G.player; let v = P.cash; for (const c in P.pos) v += P.pos[c].qty * byCode(c).price; if (hasMargin()) { const m = marginStat(); v += m.u - m.cost; } return v; }
const asset = netAsset;
function reservedCash() { return G.player.orders.reduce((a, o) => a + (o.reserve || 0), 0); }
// 信用の建玉があるときは、必要な保証金（建玉の30%。低位株などは銘柄ごとの率）と、評価損・未精算の費用の分は現物の買いに使えない
function availCash() { let v = G.player.cash - reservedCash(); if (hasMargin()) { const m = marginStat(); v -= m.req - Math.min(0, m.u) + m.cost; } return v; }
function availShares(code) { const q = G.player.pos[code]?.qty || 0; return q - G.player.orders.filter(o => o.code === code && o.side === 'sell' && !o.mg).reduce((a, o) => a + o.qty, 0); }
function removeOrder(o) { const i = G.player.orders.indexOf(o); if (i >= 0) G.player.orders.splice(i, 1); }

/** 板（仮想トレーダーの注文）。同じ分の間は同じ形 */
function book(s) {
  const t = tickOf(s, s.price), L = lot(s), key = `${s.code}:${G.dayIndex}:${G.minute}:${G.phase}`;
  const asks = [], bids = [];
  const gap = s.tick1 && hash01(key + 'sp') < 0.35 ? 1 : 0;   // 低位株は、ときどき売りの一番手が1円空く（スプレッド2円）
  for (let k = 0; k < 8; k++) {
    const pa = roundPx(s, s.price + (k + 1 + gap) * t), pb = roundPx(s, s.price - k * t);
    const qa = Math.max(L, Math.round(s.minVol * (0.5 + 2.2 * hash01(key + 'a' + k)) * (1 + k * 0.18) / L) * L);
    const qb = Math.max(L, Math.round(s.minVol * (0.5 + 2.2 * hash01(key + 'b' + k)) * (1 + k * 0.18) / L) * L);
    if (pa <= s.limUp && s.stop !== 'up') asks.push({ p: pa, q: qa });
    if (pb >= s.limDn && s.stop !== 'down') bids.push({ p: pb, q: qb });
  }
  return { asks, bids };
}
// 成行で食える深さ：板の8本の先に、1呼値ずつ（1刻みに minVol 株）WALK_EXT 刻みまで。既存30銘柄は最も浅い銘柄でも
// 約1,850万円分あり（ふつうの初期資金100万円の約18倍）、全額を成行で買っても部分約定にならない。低位株は部分約定になりうる
const WALK_EXT = 8;
/** 成行で板を上から順に食っていく。深さ（WALK_EXT）か値幅制限まで食って足りない分は約定しない（left = 取り消す株数） */
function walk(s, side, qty) {
  const { asks, bids } = book(s); const lv = side === 'buy' ? asks : bids;
  let rem = qty, gross = 0, last = s.price;
  for (const l of lv) { const q = Math.min(rem, l.q); gross += q * l.p; rem -= q; last = l.p; if (!rem) break; }
  for (let k = 0; rem > 0 && k < WALK_EXT; k++) {
    const t = tickOf(s, last), L = lot(s), nx = side === 'buy' ? roundPx(s, last + t) : roundPx(s, last - t);
    if (side === 'buy' ? nx > s.limUp : nx < s.limDn) break;   // ストップ高・安の値段より先には、相手がいない
    last = nx;
    const q = Math.min(rem, Math.max(L, Math.round(s.minVol / L) * L));
    gross += q * last; rem -= q;
  }
  gross = Math.round(gross);   // 値段は0.1円刻み・株数は100株単位なので、代金は1円単位になる
  const filled = qty - rem;
  return { gross, avg: filled ? gross / filled : s.price, last, filled, left: rem };
}

function fill(s, side, qty, gross, avgPx, kind, mg) {
  if (mg) { mfill(s, side, qty, gross, avgPx, kind); return; }
  const P = G.player, D = DIFF[G.diff], dl = kind === 'delist';
  const fee = dl ? 0 : Math.round(gross * D.fee);   // 上場廃止の決済は手数料なし
  if (side === 'buy') {
    P.cash -= gross + fee;
    const p = P.pos[s.code] || { qty: 0, avg: 0 };
    if (!p.qty) p.d = G.dayIndex;   // 持ち始めた日（保有日数のミッション用）
    p.avg = (p.avg * p.qty + gross + fee) / (p.qty + qty); p.qty += qty; P.pos[s.code] = p;
  } else {
    const p = P.pos[s.code]; const cost = p.avg * qty, proceeds = gross - fee, pnl = proceeds - cost;
    P.cash += proceeds; p.qty -= qty; if (p.qty <= 0) delete P.pos[s.code];
    P.sells.push({ code: s.code, name: s.name, pnl, pct: pnl / cost, d: G.date, buyAvg: cost / qty, sellAvg: avgPx, qty, ...(dl ? { dl: true } : {}) });
    realize(pnl);
    if (!dl) sellMissions(pnl, pnl / cost, false, G.dayIndex - p.d, false);   // 上場廃止の決済はミッションに数えない
  }
  P.feesTotal += fee;
  P.trades.push({ code: s.code, side, qty, px: avgPx, d: G.dayIndex, m: G.minute, kind });
  if (P.trades.length > 400) P.trades.shift();
  toast(`${s.name} ${qty.toLocaleString()}株を ${px(avgPx)}円で${side === 'buy' ? '買いました' : '売りました'}（${KIND[kind]}）`);
  if (side === 'buy') complete('buy');
}
// 売り・返済で損益が確定したときのミッション判定（p.d = 持ち始めた日）
function sellMissions(pnl, pct, mg, hold, short) {
  const S = G.player.sells.filter(x => !x.dl), tail = n => S.length >= n && S.slice(-n).every(x => x.pnl > 0);   // 上場廃止の決済は連勝に数えない
  if (pnl > 0) {
    complete('profit');
    if (pct >= 0.05) complete('big5');
    if (hold >= 10) complete('hold10');
    const w = (G.dayWin ||= {}); w[mg ? 'mg' : 'cash'] = true;
    if (w.cash && w.mg) complete('both');
    if (mg && !G.mcallEver) complete('nocall');
    if (short) { complete('short'); if (pct >= 0.05) complete('short5'); }
  }
  if (tail(3)) complete('streak3');
  if (tail(5)) complete('streak5');
}
// 確定した損益を今年の分に足して、税金を精算する（現物と信用の損益は同じ「株式等の譲渡所得」として通算する）
function realize(pnl) {
  const P = G.player; if (!DIFF[G.diff].tax) return;
  P.realizedYear += pnl; const due = Math.max(0, P.realizedYear) * TAX; const delta = due - P.taxYear; P.cash -= delta; P.taxYear = due; P.taxTotal += delta;
}

function marketTrade(s, side, qty, kind, mg) {
  if (side === 'buy' && s.stop === 'up') { toast(`${s.name}はストップ高のため、買い注文が約定しませんでした`, 'warn'); return false; }
  if (side === 'sell' && s.stop === 'down') { toast(`${s.name}はストップ安のため、売り注文が約定しませんでした`, 'warn'); return false; }
  if (!mg && side === 'sell' && qty > availShares(s.code)) { toast('売れる株数が足りません', 'warn'); return false; }
  if (mg) qty = mFit(s, side, qty, q => walk(s, side, q).gross);
  let w = walk(s, side, qty);
  // 板の深さ・値幅制限までで足りない分は取り消す（部分約定）
  const cut = w.left; if (cut) { qty = w.filled; w = walk(s, side, qty); }
  if (!qty) { cancelNotice(`${s.name}の成行の${side === 'buy' ? '買い' : '売り'}は、板に相手がいないため約定せず、${cut.toLocaleString()}株すべてを取り消しました`); return false; }
  let fee = Math.round(w.gross * DIFF[G.diff].fee);
  const me = mg && mCheck(s, side, qty, w.gross);
  if (me) { cancelNotice(`${s.name}の信用の注文を取り消しました。${me}`); return false; }
  // 寄り付きなどで値上がりして足りなくなったら、買える株数まで減らす
  while (!mg && side === 'buy' && qty > lot(s) && w.gross + fee > availCash() + 0.5) { qty -= lot(s); w = walk(s, side, qty); fee = Math.round(w.gross * DIFF[G.diff].fee); }
  if (!mg && side === 'buy' && w.gross + fee > availCash() + 0.5) { cancelNotice(`お金が足りないため、${s.name}の買い注文を取り消しました`); return false; }
  fill(s, side, qty, w.gross, w.avg, kind, mg);
  if (cut) cancelNotice(`${s.name}の成行の${side === 'buy' ? '買い' : '売り'}は、板が薄く${s.stop || w.last === (side === 'buy' ? s.limUp : s.limDn) ? '値幅制限に届いた' : '相手が足りなかった'}ため、${qty.toLocaleString()}株だけ約定し、残りの${cut.toLocaleString()}株は取り消しました`);
  if (w.last !== s.price) {   // マーケットインパクト：自分の大口注文で株価が動く
    setPrice(s, Math.log(s.price + (w.last - s.price) * 0.6));
    s.high = Math.max(s.high, s.price); s.low = Math.min(s.low, s.price);
  }
  return true;
}

function processOrders() {
  const P = G.player;
  for (const o of [...P.orders]) {
    const s = byCode(o.code), c = s.intraday.at(-1); if (!c) continue;
    if (o.type === 'lmt') {
      if (o.side === 'buy' && c.l <= o.price && s.stop !== 'up') { removeOrder(o); lmtFill(s, o, Math.min(o.price, c.o)); }
      else if (o.side === 'sell' && c.h >= o.price && s.stop !== 'down') { removeOrder(o); lmtFill(s, o, Math.max(o.price, c.o)); }
    } else if (o.type === 'stp') {
      if (o.side === 'sell' && c.l <= o.price) {
        removeOrder(o);
        if (marketTrade(s, 'sell', o.qty, 'stp', o.mg)) {
          const last = P.sells.at(-1);
          complete('stop');
          if (last && last.pct < 0 && last.pct >= -0.05) addXP(15, '損失を5%以内に抑えた損切り');
        }
      } else if (o.side === 'buy' && c.h >= o.price) { removeOrder(o); marketTrade(s, 'buy', o.qty, 'stp', o.mg); }
    }
  }
}
// 約定のときに注文を取り消したら、トーストは速く進めていると見逃しやすいので、1日のまとめにも残す
function cancelNotice(msg) { toast(msg, 'warn'); G.dayEvents.push(msg); }
function lmtFill(s, o, p) {
  const qty = o.mg ? mFit(s, o.side, o.qty, q => p * q) : o.qty;
  const me = o.mg && mCheck(s, o.side, qty, p * qty);
  if (me) { cancelNotice(`${s.name}の信用の指値注文を取り消しました。${me}`); return; }
  fill(s, o.side, qty, p * qty, p, 'lmt', o.mg); complete('limit');
}

/* ===================== 信用取引（ランク6） ===================== */
// 制度信用だけ。保証金は現金だけ（持っている株を担保にする「代用」は使わない）。
// 同じ銘柄の買い建てと売り建ては同時に持てず（両建てなし）、反対の売買は返済になる。建玉は銘柄ごとに1つ（建値は平均、期限は最初に建てた日から）
const canMargin = () => isFast() || rank() >= MARGIN.rank;
const mPos = code => G.player.mpos[code];
const hasMargin = () => Object.keys(G.player.mpos).length > 0;
const mPL = (p, s) => (s.price - p.px) * p.qty * (p.side === 'buy' ? 1 : -1);
const mPct = r => (r * 100).toFixed(1) + '%';
// 1営業日ぶんの費用（買い建て = 金利、売り建て = 貸株料）。返済のときにまとめて精算する。逆日歩を足すときはここだけ変える
function marginCostDay(p, s) { return p.qty * p.px * (p.side === 'buy' ? MARGIN.buyRate : mLend(s)) / DAYS; }
// 銘柄ごとの信用の設定（XDEFS の mg。ないものは MARGIN の値）：委託保証金率、貸株料の年率、空売りできるか
const mRate = s => s?.mg?.rate ?? MARGIN.rate;
const mLend = s => s?.mg?.lend ?? MARGIN.lendRate;
const canShort = s => s?.mg?.short !== false;
const DL_NO_MARGIN = s => `${s.name}は整理銘柄のため、信用の新規建てはできません（返済はできます）。`;
const NO_SHORT = s => `${s.name}は空売り（信用の新規売り）ができません。貸借銘柄ではないため、信用では買いだけができます。`;
// n = 建玉の金額の合計、req = 必要な保証金（建玉ごとに銘柄の委託保証金率をかけた合計）、u = 評価損益、cost = 未精算の費用、
// eq = 実質の保証金、ratio = 保証金維持率（建玉がなければ null）
function marginStat() {
  const P = G.player; let n = 0, req = 0, u = 0, cost = 0;
  for (const c in P.mpos) { const p = P.mpos[c], s = byCode(c); n += p.qty * p.px; req += mRate(s) * p.qty * p.px; u += mPL(p, s); cost += p.cost; }
  const eq = P.cash + u - cost;
  return { n, req, u, cost, eq, ratio: n ? eq / n : null };
}
// 値上がりに備えた上乗せ（寄り付き前の成行は窓、逆指値は約定が上の値段になりやすいため）。現物の買いの確保と信用の注文中の新規で使う
const orderBuf = (type, phase) => (type === 'lmt' ? 1 : type === 'stp' ? 1.05 : phase === 'pre' ? 1.1 : 1);
// 新しく建てられる金額（現物の買い注文で確保した現金と、注文中の新規の分を除く。注文中の新規は上乗せ込みで見込み、寄り付きで先の注文が余力不足で消えないようにする）
function marginRoom(s) {   // s = 建てる銘柄（その銘柄の委託保証金率で割る。省略すると標準の30%）
  const m = marginStat(); if (m.eq < MARGIN.min) return 0;
  const pend = G.player.orders.reduce((a, o) => { if (!(o.mg && o.open)) return a; const os = byCode(o.code); return a + mRate(os) * o.qty * (o.price || os.price) * orderBuf(o.type, G.phase); }, 0);
  return Math.max(0, (m.eq - reservedCash() - m.req - pend) / mRate(s));
}
const mLevel = r => (r == null ? '' : r < MARGIN.warn ? 'bad' : r < 0.4 ? 'warn' : 'ok');   // ゲージの色：緑 / 黄 / 赤
function mGauge(r) { return r == null ? 'なし' : `<span class="mgauge" data-lv="${mLevel(r)}" role="img" aria-label="保証金維持率 ${mPct(r)}"><i style="width:${clamp(r, 0, 1) * 100}%"></i></span> <b class="num">${mPct(r)}</b>`; }
function mSideLabel(code, side) { const p = mPos(code); return (p && p.side !== side ? '返済' : '新規') + (side === 'buy' ? '買い' : '売り'); }
// 返済期限の日（最初に建てた日から MARGIN.days 営業日目）
function mDue(p) { const left = MARGIN.days - 1 - (G.dayIndex - p.d); return isReal() ? REAL.dates[Math.min(G.dayIndex + left, REAL.dates.length - 1)] : addTD(G.date, left); }
// 信用の新規が約定するとき、寄り付きの窓などで余力が足りなくなっていたら、建てられる株数まで減らす（現物の買いと同じ。amt = 株数→金額）
function mFit(s, side, qty, amt) {
  const p = mPos(s.code), L = lot(s); if (p && p.side !== side) return qty;
  while (qty > L && amt(qty) > marginRoom(s) + 0.5) qty -= L;
  return qty;
}
// 信用の注文が通るか。だめなら理由を返す（通るときは ''）
function mCheck(s, side, qty, amt) {
  const p = mPos(s.code);
  if (p && p.side !== side) return qty > p.qty ? `返済できるのは${p.qty.toLocaleString()}株までです。` : '';
  if (side === 'sell' && !canShort(s)) return NO_SHORT(s);
  if (dlStage(s) === 'seiri') return DL_NO_MARGIN(s);
  const im = ipoMgMsg(s, side); if (im) return im;   // 新規上場：上場から5営業日は不可、20営業日までは買いだけ
  if (marginStat().eq < MARGIN.min) return `信用で新しく建てるには、保証金（現金＋建玉の評価損益）が${yen(MARGIN.min)}円以上必要です。`;
  if (amt > marginRoom(s) + 0.5) return `新規建て余力が足りません（必要 約${yen(amt)}円／余力 ${yen(marginRoom(s))}円）。`;
  return '';
}
function mfill(s, side, qty, gross, avgPx, kind) {
  const P = G.player, dl = kind === 'delist', fee = dl ? 0 : Math.round(gross * DIFF[G.diff].fee), p = P.mpos[s.code], lab = mSideLabel(s.code, side);
  if (p && p.side !== side) {   // 返済：損益（手数料と金利などを引く）をここで確定する
    const share = p.cost * qty / p.qty, pnl = (p.side === 'buy' ? gross - p.px * qty : p.px * qty - gross) - fee - share;
    P.cash += pnl; p.cost -= share; p.qty -= qty; if (p.qty <= 0) delete P.mpos[s.code];
    P.sells.push({ code: s.code, name: s.name, pnl, pct: pnl / (p.px * qty), d: G.date, buyAvg: p.side === 'buy' ? p.px : avgPx, sellAvg: p.side === 'buy' ? avgPx : p.px, qty, ...(dl ? { dl: true } : {}) });
    realize(pnl);
    if (!dl) sellMissions(pnl, pnl / (p.px * qty), true, G.dayIndex - p.d, p.side === 'sell');
  } else {   // 新規：お金は動かさない。手数料は費用として返済のときに精算する
    const q0 = p ? p.qty : 0;
    P.mpos[s.code] = { side, qty: q0 + qty, px: ((p ? p.px * q0 : 0) + gross) / (q0 + qty), d: p ? p.d : G.dayIndex, cost: (p ? p.cost : 0) + fee };
  }
  P.feesTotal += fee;
  P.trades.push({ code: s.code, side, qty, px: avgPx, d: G.dayIndex, m: G.minute, kind, mg: true });
  if (P.trades.length > 400) P.trades.shift();
  toast(`${s.name} ${qty.toLocaleString()}株を ${px(avgPx)}円で信用の${lab}をしました（${KIND[kind]}）`);
}
// 引けの値段で全部返済する（返済期限・追証の強制決済）
function mSettle(code) { const s = byCode(code), p = mPos(code); mfill(s, p.side === 'buy' ? 'sell' : 'buy', p.qty, s.price * p.qty, s.price, 'force'); }
// 場中：追証の解消（維持率が20%に戻れば、値上がりでの回復でも解消）と、維持率25%割れの注意（1日1回）
function marginWatch() {
  if (!hasMargin()) { G.mcall = null; return; }
  const r = marginStat().ratio;
  if (G.mcall && r >= MARGIN.keep) { G.mcall = null; toast('保証金維持率が20%以上に戻り、追証が解消しました'); }
  else if (r < MARGIN.warn && G.mwarn !== G.dayIndex) { G.mwarn = G.dayIndex; toast(`保証金維持率が${mPct(r)}まで下がりました。20%を下回ったまま引けると追証になります`, 'warn'); }
}
// 引け後：費用の計上、返済期限、追証（発生した翌営業日の引けまでに維持率が20%に戻らなければ全部返済）
function marginDayEnd() {
  const P = G.player;
  for (const c in P.mpos) {
    const p = P.mpos[c]; p.cost += marginCostDay(p, byCode(c));
    if (G.dayIndex - p.d + 1 >= MARGIN.days) { mSettle(c); G.dayEvents.push(`${byCode(c).name}の信用の建玉が返済期限（6か月）を迎えたため、引けの値段で返済しました`); }
  }
  const m = marginStat();
  if (!m.n) { G.mcall = null; return; }
  if (m.ratio >= MARGIN.keep) { if (G.mcall) G.dayEvents.push('保証金維持率が20%以上に戻り、追証が解消しました'); G.mcall = null; return; }
  if (!G.mcall) { G.mcall = { due: G.dayIndex + 1 }; G.mcallEver = true; G.dayEvents.push(`⚠ 追証が発生しました（保証金維持率 ${mPct(m.ratio)}）。明日の引けまでに建玉を返済するか現物株を売って、維持率を20%以上に戻してください（あと約${yen(MARGIN.keep * m.n - m.eq)}円）。戻らなければ全部の建玉が強制的に返済されます`); return; }
  if (G.dayIndex >= G.mcall.due) { for (const c of Object.keys(P.mpos)) mSettle(c); G.mcall = null; G.dayEvents.push('追証が期限までに解消しなかったため、信用の建玉をすべて引けの値段で返済しました（強制決済）'); }
}

/* ===================== 経験値・ミッション ===================== */
function addXP(n, why, quiet) {
  if (UI.practice) return;   // 信用取引の練習中は経験値を増やさない
  const before = rank(); profile.xp += n; if (G) G.dayXP += n;
  if (!quiet) toast(`+${n} XP　${why}`, 'xp');
  const after = rank();
  if (after >= XRANK) profile.r7 = true;
  if (after > before) {
    const R = RANKS[after - 1];
    toast(`ランクアップ！「${R.n}」に昇格。${R.unlock}が使えます${MISSIONS.some(m => m.rank === after) ? '。新しいミッションも追加されました' : ''}`, 'rank');
    if (G) G.dayEvents.push(`ランク${after}「${R.n}」に昇格。${R.unlock}が使えるようになりました`);
    if (G) { buildTypes(); buildFilter(); }
  }
  saveProfile();
}
function complete(id) {
  if (UI.practice) return;
  if (profile.missions[id]) return;
  const m = MISSIONS.find(x => x.id === id); if (!m || m.rank > rank()) return;
  profile.missions[id] = true;
  toast(`ミッション達成：${m.t}（+${m.xp} XP）`, 'mission');
  addXP(m.xp, 'ミッション達成', true);
}

/* ===================== 保存 ===================== */
function saveText() { G.rng = { s: RNG.s, spare: RNG.spare }; return JSON.stringify(G, (k, v) => (k === '_map' ? undefined : k === 'intraday' ? [] : v)); }
const SAVE_WARN = 4e6;   // 保存データがこの文字数を超えたら注意する（ブラウザの保存の上限は約5MB）
let saveWarnAt = '';     // 注意を出した日（1日1回まで）
function saveGame() {
  if (UI.practice) return;   // 練習中の状態は保存しない
  let str;
  try { str = saveText(); localStorage.setItem('kabutore.save', str); }
  catch (e) { if (isQuota(e)) saveNotice('ブラウザの保存領域がいっぱいで、ゲームを保存できませんでした。ほかのサイトのデータを消すか、ゲームを最後まで遊んで終えてください'); return; }
  if (str.length > SAVE_WARN && saveWarnAt !== G.date) { saveWarnAt = G.date; saveNotice(`保存データが大きくなっています（約${(str.length / 1e6).toFixed(1)}MB）。ブラウザの保存の上限（約5MB）を超えると保存できなくなります`); }
}
// 保存の警告：トーストと、1日のまとめの「今日のできごと」に残す（引けのあとは、もう作ったまとめにも足す）
function saveNotice(msg) {
  toast(msg, 'warn');
  if (!G.dayEvents.includes(msg)) G.dayEvents.push(msg);
  if (G.phase === 'closed' && G.last?.date === G.date && !G.last.events.includes(msg)) G.last.events.push(msg);
}
// localStorage の容量オーバーか（ブラウザで名前とコードがちがう）
function isQuota(e) { return e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014); }
// 保存データを続きから遊べるか。使えないものは消さずに出さないだけにする（データファイルを戻せば、また出る）。
// リアル相場は、そのシナリオのデータがあり、保存した日がそのデータの同じ営業日であるときだけ（データが差し替わっていたら株価がずれるので出さない）
function saveUsable(g) {
  if (!g || g.v !== 1 || g.ended || !SCEN[g.scen]) return false;
  if (g.mode !== 'real') return true;
  const S = REAL_SETS[realKeyOf(g)];
  return !!S?.data && g.dayIndex >= 0 && g.dayIndex < S.data.dates.length && S.data.dates[g.dayIndex] === g.date;
}
function loadSave() { try { const g = JSON.parse(localStorage.getItem('kabutore.save')); if (saveUsable(g)) return g; } catch (e) {} return null; }
function clearSave() { try { localStorage.removeItem('kabutore.save'); } catch (e) {} }
function resume(g) {
  G = g; afterLoad();
  if (G.rng) { RNG.s = G.rng.s; RNG.spare = G.rng.spare; }
  if (G.phase === 'closed') nextDay();   // 保存は大引け後なので、翌営業日の朝から再開
  hideTitle(); render();
}

/* ===================== 表示 ===================== */
function palette() {
  const cs = getComputedStyle(document.documentElement), g = n => cs.getPropertyValue(n).trim();
  return { up: g('--up'), down: g('--down'), ink: g('--ink'), muted: g('--muted'), line: g('--line'), accent: g('--accent'), accentSoft: g('--accent-soft'), warn: g('--warn'), panel: g('--panel'), on: g('--on-signal'), num: g('--f-num'), body: g('--f-body') };
}

function buildTape() {
  const items = unlockedStocks().map(s => `<span class="tk" data-code="${s.code}"><b>${esc(s.name)}</b><span class="num tp">${px(s.price)}</span><span class="num tc flat">±0.00%</span></span>`).join('');
  const tp = $('#tape'), n = unlockedStocks().length; tp.innerHTML = `<span>${items}</span><span>${items}</span>`; tp.dataset.n = n;
  // 30銘柄より多いときは、流れる速さが変わらないよう1周の時間を銘柄数に合わせて延ばす（30銘柄までは CSS の 70秒のまま）
  tp.style.animationDuration = n > DEFS.length ? `${(70 * n / DEFS.length).toFixed(1)}s` : '';
  updateTape();
}
function updateTape() {
  for (const el of $$('#tape .tk')) {
    const s = byCode(el.dataset.code); const ch = s.price / s.prevClose - 1;
    el.querySelector('.tp').textContent = px(s.price);
    const c = el.querySelector('.tc'); c.textContent = pctS(ch); c.className = 'num tc ' + cls(ch);
  }
}

function render() {
  if (!G) return;
  // 帯は朝（startDay）に作る。続きから・練習の復元など、朝を通らずに始まったときや、銘柄が増えたときは、ここで作る
  if (!$('#tape .tk') || +$('#tape').dataset.n !== unlockedStocks().length) buildTape();
  const on = unlockedStocks().length; if (UI.openN !== on) { UI.openN = on; buildFilter(); }   // 新規上場・上場廃止で銘柄が増減したら、業種・種類の絞り込みも作り直す
  renderHeader(); updateTape();
  if (UI.view === 'trade') { renderList(); renderChartHead(); drawChart(); renderBoard(); renderOrderPanel(); renderNews(); }
  else if (UI.view === 'hold') renderHold();
  else if (UI.view === 'cal') renderCal();
  else if (UI.view === 'mission') renderMissions();
}

function renderHeader() {
  $('#h-date').textContent = dateLabel(G.date) + `　${SCEN[G.scen].days ? `${Math.min(G.dayIndex + 1, SCEN[G.scen].days)}/${SCEN[G.scen].days}日目` : `${G.dayIndex + 1}日目`}`;
  $('#h-time').textContent = timeLabel();
  $('.exch').textContent = isReal() ? `東証 ${REAL_SETS[REAL_KEY].period}の実データ` : 'NTX ネオ東京証券取引所';
  $('#h-idx-name').textContent = idxName();
  const ph = $('#h-phase'); ph.textContent = phaseLabel(); ph.dataset.phase = G.phase;
  const a = asset(), d = a - G.player.dayStart;
  $('#h-asset').textContent = yen(a) + '円';
  const hd = $('#h-day'); hd.textContent = `${yenS(d)}円（${pctS(d / G.player.dayStart)}）`; hd.className = 'num ' + cls(d);
  const mk = G.market, ic = mk.idx / mk.idxPrev - 1;
  $('#h-idx').innerHTML = `${mk.idx.toLocaleString('ja-JP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span class="${cls(ic)}">${pctS(ic)}</span>`;
  const r = rank(), hr = $('#h-rank'); hr.innerHTML = `<span class="rk">R${r}</span><span class="rk-n">${RANKS[r - 1].n}</span>`; hr.classList.toggle('fast', isFast()); hr.classList.toggle('rank-legend', r >= RANKS.length);   // ファストスターターは金色
  // 信用の建玉があるときは、保有株タブに維持率の色の印を付ける（追証中は赤）
  const mr = hasMargin() ? marginStat().ratio : null, hb = $('.tabbar [data-view="hold"]');
  hb.dataset.mlv = G.mcall ? 'bad' : mLevel(mr);
  hb.setAttribute('aria-label', mr == null ? '保有株' : `保有株（保証金維持率 ${mPct(mr)}${G.mcall ? '・追証' : ''}）`);
  $$('.speed button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.speed === G.speed)));
  $('#skip-btn').textContent = G.phase === 'pre' ? '9:00まで進める' : G.phase === 'open' ? '大引けまで進める' : '1日のまとめを見る';
}

function buildFilter() {
  const r = rank(); const keys = Object.keys(isReal() ? REAL_SECTORS : SECTORS).filter(k => allStocks().some(s => s.sector === k && isOpen(s, r)));
  if (UI.filter !== 'all' && !keys.includes(UI.filter)) UI.filter = 'all';
  $('#sec-filter').innerHTML = `<option value="all">すべての業種</option>` + keys.map(k => `<option value="${k}"${UI.filter === k ? ' selected' : ''}>${SEC(k).name}</option>`).join('');
  fitSelect($('#sec-filter'));
  // 種類の絞り込み：解放されている銘柄に、高配当・景気敏感・優待があるときだけ出す
  const kinds = Object.keys(KIND_BADGE).filter(k => allStocks().some(s => kindOf(s) === k && isOpen(s, r)));
  if (UI.kind !== 'all' && !kinds.includes(UI.kind)) UI.kind = 'all';
  const kf = $('#kind-filter'); kf.hidden = !kinds.length;
  kf.innerHTML = `<option value="all">すべての種類</option>` + kinds.map(k => `<option value="${k}"${UI.kind === k ? ' selected' : ''}>${KINDS[k].name}</option>`).join('');
  if (kinds.length) fitSelect(kf);
}
const DL_BADGE = { watch: ' <b class="kb kb-dl">監理</b>', fail: ' <b class="kb kb-dl">監理</b>', seiri: ' <b class="kb kb-dl">整理</b>' };   // 倒産の途中の銘柄
const kindOf = s => (s.kind === 'perk' && !s.perk && !s.perkShow ? 'normal' : s.kind);   // 表示の種類（優待をやめた銘柄は普通）
const KIND_BADGE = { div: '高配当', cyc: '景気敏感', perk: '優待', penny: '低位', ipo: '新規' };   // 銘柄リストに出す種類のバッジ（普通・新興は出さない）
// 選んでいる文字が入るぎりぎりの幅にする（select は既定だと一番長い選択肢の幅になる）
function fitSelect(el) {
  const cs = getComputedStyle(el), c = fitSelect.c ||= document.createElement('canvas').getContext('2d');
  c.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  el.style.width = Math.ceil(c.measureText(el.options[el.selectedIndex]?.text || '').width + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + 22) + 'px';   // 22 = ▼ の分
}
function renderList() {
  const r = rank(), P = G.player, shown = s => (UI.filter === 'all' || s.sector === UI.filter) && (UI.kind === 'all' || kindOf(s) === UI.kind);
  const sk = UI.sort.key, sv = s => (sk === 'px' ? s.price : s.price / s.prevClose - 1);
  $$('[data-sort]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.sort === sk)));
  const sd = $('#sort-dir'); sd.textContent = UI.sort.desc ? '降順 ▼' : '昇順 ▲'; sd.setAttribute('aria-label', UI.sort.desc ? '降順（クリックで昇順）' : '昇順（クリックで降順）');
  const row = s => {
    const q = ipoQuote(s), ch = (q ? q.p : s.price) / s.prevClose - 1;   // 上場日の寄り付き前は気配（公開価格比）
    return [s.code, s.code === G.sel, {
      n: `${P.pos[s.code] ? '<i class="held" title="保有中"></i>' : ''}${esc(s.name)}`, sm: `${s.code}・${SEC(s.sector).short}${KIND_BADGE[kindOf(s)] ? ` <b class="kb kb-${kindOf(s)}">${KIND_BADGE[kindOf(s)]}</b>` : ''}${DL_BADGE[dlStage(s)] || ''}`,
      px: `${q ? '<em class="stop up">気配</em> ' : s.stop ? `<em class="stop ${s.stop}">${s.stop === 'up' ? 'S高' : 'S安'}</em> ` : ''}${px(q ? q.p : s.price)}`, ch: pctS(ch), cc: cls(ch),
    }];
  };
  // 梅山カンパニーは数に入れず、いちばん下に別枠で出す
  const all = allStocks();   // 標準の並びは、30銘柄のあとに追加銘柄
  const items = all.filter(s => isOpen(s, r) && shown(s)).sort((a, b) => (UI.sort.desc ? -1 : 1) * (sk === 'none' ? all.indexOf(a) - all.indexOf(b) : sv(a) - sv(b))).map(row);
  if (umeListed() && shown(G.ume)) items.push(['sep'], row(G.ume));
  // ボタンも中の span も作り直さず、同じものを使い回して中身と並びだけ直す。押している途中で押した要素が消えると、離したときにクリックにならない
  const box = $('#stock-list'), old = {};
  for (const el of [...box.children]) old[el.dataset.code || 'sep'] = el;
  // 押している間は並びを動かさない（値動きで順位が入れ替わると、離したときに別の銘柄の上になってクリックにならない）。離したら並べ直す
  if (UI.listHold) { const pos = [...box.children].map(el => el.dataset.code || 'sep'); items.sort((a, b) => (pos.indexOf(a[0]) + 1 || 999) - (pos.indexOf(b[0]) + 1 || 999)); }
  items.forEach(([k, sel, d], i) => {
    let el = old[k]; delete old[k];
    if (!el) {
      el = document.createElement(k === 'sep' ? 'div' : 'button');
      if (k === 'sep') { el.className = 'list-sep'; el.textContent = '幻の銘柄'; }
      else { el.dataset.code = k; el.innerHTML = '<span class="r-name"><span class="r-n"></span><small></small></span><span class="r-px num"></span><span class="r-ch num"></span>'; el._p = {}; }
    }
    if (k !== 'sep') {
      const c = 'row' + (sel ? ' sel' : ''); if (el.className !== c) el.className = c;
      if (el.getAttribute('aria-pressed') !== String(sel)) el.setAttribute('aria-pressed', String(sel));
      const set = (q, key, html) => { if (el._p[key] !== html) { el.querySelector(q).innerHTML = html; el._p[key] = html; } };
      set('.r-n', 'n', d.n); set('small', 'sm', d.sm); set('.r-px', 'px', d.px); set('.r-ch', 'ch', d.ch);
      const rc = 'r-ch num ' + d.cc, ce = el.querySelector('.r-ch'); if (ce.className !== rc) ce.className = rc;
    }
    if (box.children[i] !== el) box.insertBefore(el, box.children[i] || null);
  });
  for (const k in old) old[k].remove();
  const locked = all.filter(s => !isOpen(s, r) && !s.delisted && !preIpo(s)), gone = all.filter(s => s.delisted).length;   // 上場廃止の銘柄は、未解放に数えない
  const nr = locked.length ? Math.min(...locked.map(openRank)) : 0;
  $('#list-foot').textContent = (locked.length ? `ほかに${locked.length}銘柄あります。ランク${nr}で${locked.filter(s => isOpen(s, nr)).length}銘柄が解放されます。` : `全${all.length - gone}銘柄が解放されています。`) + (gone ? `（上場廃止 ${gone}銘柄）` : '');
}

function rsi(closes, n = 14) {
  if (closes.length <= n) return null;
  let g = 0, l = 0; for (let i = closes.length - n; i < closes.length; i++) { const d = closes[i] - closes[i - 1]; if (d > 0) g += d; else l -= d; }
  return l === 0 ? 100 : 100 - 100 / (1 + g / l);
}
function renderChartHead() {
  const s = sel(), ch = s.price - s.prevClose, r = rank();
  const ist = ipoStage(s), q = ipoQuote(s);
  $('#c-name').innerHTML = `${esc(s.name)}<span class="code num">${s.code}</span>${s.delisted ? '<em class="dl-chip">上場廃止</em>' : DL_BADGE[dlStage(s)] ? `<em class="dl-chip">${dlStage(s) === 'seiri' ? '整理銘柄' : '監理銘柄'}</em>` : ist === 'first' || ist === 'new' ? `<em class="ipo-chip">新規上場（${G.dayIndex - s.ipo.day + 1}日目）</em>` : ''}`;
  $('#c-meta').innerHTML = `${esc(SEC(s.sector).name)}｜${esc(s.desc)}${s.kind === 'penny' ? `<span class="penny-note">⚠ 1株100円以下の${term('低位株')}。板が薄く、${term('値幅制限')}が広い</span>` : ''}`;
  $('#c-price').innerHTML = q ? `<small>${q.side}</small> ${px(q.p)}<small>円</small>` : `${px(s.price)}<small>円</small>${s.stop ? ` <em class="stop ${s.stop}">${s.stop === 'up' ? 'ストップ高' : 'ストップ安'}</em>` : ''}`;
  const cp = $('#c-chg');
  if (q) { cp.textContent = `公開価格 ${px(s.ipo.px)}円（気配は${pctS(q.p / s.ipo.px - 1)}）。9:00 の寄り付きで初値が決まります`; cp.className = 'num ' + cls(q.p - s.ipo.px); }
  else if (ist === 'first') { cp.textContent = `公開価格比 ${pxS(s.price - s.ipo.px)}円（${pctS(s.price / s.ipo.px - 1)}）・初値 ${px(s.ipo.open)}円`; cp.className = 'num ' + cls(s.price - s.ipo.px); }
  else { cp.textContent = `前日比 ${pxS(ch)}円（${pctS(ch / s.prevClose)}）`; cp.className = 'num ' + cls(ch); }
  $$('[data-cm]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cm === G.chartMode)));
  const f = (k, v, c) => `<div${c ? ` class="${c}"` : ''}><dt>${k}</dt><dd class="num">${v}</dd></div>`;
  const closes = s.daily.map(d => d.c); if (G.phase === 'open') closes.push(s.price);
  const rv = rsi(closes);
  const ev = realEv()?.[s.code];
  if (isReal()) {   // 実データは終値だけなので、株式数・利益にもとづく数字は出さない（配当・優待・決算の日は当時のデータから）
    $('#facts').innerHTML = f(term('出来高'), s.dayVol.toLocaleString('ja-JP') + '株', 'fx-vol') + f(term('値幅制限'), `${px(s.limDn)}〜${px(s.limUp)}`, 'fx-lim')
      + f('始値／高値／安値', G.phase === 'pre' ? '—' : `${px(s.open)}／${px(s.high)}／${px(s.low)}`, 'fx-ohl') + (r >= 4 ? f(term('RSI') + '（14日）', rv == null ? '—' : rv.toFixed(0), 'fx-rsi') : '')
      + (ev ? realFacts(s, ev, f, r)
        : (s.divShow ? f(term('配当利回り'), `${(s.divShow / s.price * 100).toFixed(2)}%（${s.divYear || 2025}年の実績）`, 'fx-div') : '')   // 決算・配当のデータがないときは、追加18社の表示だけ（入金はない）
        + (s.perkShow ? f(term('株主優待'), `${esc(s.perkShow)}（表示だけ。入金はありません）`, 'fx-perk') : ''));
    return;
  }
  // 上下2行に列順で並べる PC・タブレットだけ、CSS の order で PER と配当利回りの位置を入れ替える（スマホの並びは変えない）
  let html = f(term('時価総額'), fmtCap(s.shares * s.price), 'o1 fx-cap')
    + f(term('PER'), s.eps > 0 ? (s.price / s.eps).toFixed(1) + '倍' : '赤字のため—', 'o4 fx-per')
    + f(term('PBR'), s.fin?.na < 0 ? '債務超過のため—' : (s.price / s.bps).toFixed(2) + '倍', 'o3 fx-pbr')
    + (divOn() ? f(term('配当利回り'), s.div ? (s.div / s.price * 100).toFixed(2) + '%' : 'なし', 'o2 fx-div') : '')
    + f(term('出来高'), s.dayVol.toLocaleString('ja-JP') + '株', 'fx-vol')
    + f(term('値幅制限'), `${px(s.limDn)}〜${px(s.limUp)}`, 'fx-lim')
    + f('始値／高値／安値', G.phase === 'pre' ? '—' : `${px(s.open)}／${px(s.high)}／${px(s.low)}`, 'fx-ohl')
    + (s.perk ? f(term('株主優待'), `${esc(s.perk.text)}（年${s.perk.m.length}回・${PERK_LOT}株〜）`, 'fx-perk') : '')
    + (s.ipo ? f(term('新規上場', '上場日') + '・' + term('公開価格'), `${s.ipo.date ? mdLabel(s.ipo.date) : '今日'}・${px(s.ipo.px)}円`, 'fx-ipo') : '');
  if (r >= 4) {
    html += f('次の' + term('決算'), s.ume ? '社長の気分しだい' : mdLabel(addTD(G.date, s.nextEarn - G.dayIndex)) + ` 予想${s.consensus.toFixed(1)}円`, 'fx-earn');
    html += f(term('RSI') + '（14日）', rv == null ? '—' : rv.toFixed(0), 'fx-rsi');
  }
  $('#facts').innerHTML = html;
}

// リアル相場の詳細：配当利回り（直近1年の実績。ランク4から）、株主優待（次の回）、次の決算（ランク4から）
function realFacts(s, ev, f, r) {
  const dv = realDivYear(s), pk = ev.perk.find(p => p.di >= G.dayIndex), ke = ev.earn.find(e => e.k === 'k' && e.di >= G.dayIndex);
  return (divOn() ? f(term('配当利回り'), dv ? `${(dv / s.price * 100).toFixed(2)}%（直近1年の実績 ${+dv.toFixed(2)}円）` : 'なし（直近1年は配当なし）', 'fx-div') : '')
    + (pk ? f(term('株主優待'), `${esc(pk.text)}（${pk.lot}株〜${pk.hold ? `・${pk.hold}年以上の保有` : ''}・${mdLabel(REAL.dates[pk.di])}まで）`, 'fx-perk') : '')
    + (r >= 4 ? f('次の' + term('決算'), ke ? `${mdLabel(REAL.dates[ke.di])}${ke.slot === 'pre' ? ' 朝' : ` ${ke.time}`}` : '—', 'fx-earn') : '');
}

function sma(a, n) { const out = []; let sum = 0; for (let i = 0; i < a.length; i++) { sum += a[i]; if (i >= n) sum -= a[i - n]; out.push(i >= n - 1 ? sum / n : null); } return out; }
// ボリンジャーバンド（ショップ）：n 本の移動平均 ±2σ
function bollinger(a, n) {
  const m = sma(a, n), up = [], lo = [];
  a.forEach((_, i) => { if (m[i] == null) { up.push(null); lo.push(null); return; } let v = 0; for (let j = i - n + 1; j <= i; j++) v += (a[j] - m[i]) ** 2; const sd = Math.sqrt(v / n); up.push(m[i] + 2 * sd); lo.push(m[i] - 2 * sd); });
  return { up, lo };
}
// 平均足（ショップ）：描くときだけ使う。数字の表示や出来高の色は本来のローソク足のまま
function heikin(cs) {
  const out = [];
  cs.forEach((c, i) => { const p = out[i - 1], o = p ? (p.o + p.c) / 2 : (c.o + c.c) / 2, cl = (c.o + c.h + c.l + c.c) / 4; out.push({ o, c: cl, h: Math.max(c.h, o, cl), l: Math.min(c.l, o, cl) }); });
  return out;
}
// 買ったチャートのおまけを足す
function chartExtras(D) {
  if (optOn('bb')) D.bb = bollinger(D.cs.map(c => c.c), 20);
  if (optOn('ha')) D.ha = heikin(D.cs);
  return D;
}
function niceStep(x) { const p = Math.pow(10, Math.floor(Math.log10(x))); const m = x / p; return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p; }

function chartData() {
  const s = sel(), r = rank(), P = G.player;
  if (G.chartMode === '5m') {
    const cs = [];
    for (let i = 0; i < s.intraday.length; i += 5) {
      const g = s.intraday.slice(i, i + 5);
      cs.push({ o: g[0].o, h: Math.max(...g.map(x => x.h)), l: Math.min(...g.map(x => x.l)), c: g.at(-1).c, v: g.reduce((a, x) => a + x.v, 0), lab: minLabel(i) + '〜' });
    }
    const ma = r >= 3 ? [{ v: sma(cs.map(c => c.c), 12), name: '1時間の移動平均' }] : [];
    const pins = s.pins.filter(p => p.d === G.dayIndex).map(p => ({ i: Math.min(59, Math.floor(p.m / 5)), dir: p.dir }));
    const marks = P.trades.filter(t => t.code === s.code && t.d === G.dayIndex).map(t => ({ i: Math.min(59, Math.floor(t.m / 5)), side: t.side }));
    return chartExtras({ cs, total: 60, ma, pins, marks, ref: s.prevClose, mode: '5m' });
  }
  // リアル相場は過去分で年をまたぐので、最初の足と年が変わった足だけ年を付ける
  const lab = (d, prev) => (isReal() && prev?.slice(0, 4) !== d.slice(0, 4) ? d.slice(0, 4) + '/' : '') + mdLabel(d);
  const all = s.daily.map((x, i, a) => ({ ...x, lab: lab(x.d, a[i - 1]?.d) }));
  if (G.phase === 'open' && s.intraday.length) all.push({ o: s.open, h: s.high, l: s.low, c: s.price, v: s.dayVol, lab: lab(G.date, s.daily.at(-1)?.d) + '（今日）', di: G.dayIndex, d: G.date });
  const cs = all, closes = all.map(x => x.c);
  const ma = r >= 3 ? [{ v: sma(closes, 5), name: '5日移動平均' }, { v: sma(closes, 25), name: '25日移動平均' }] : [];
  const idxOf = di => cs.findIndex(c => c.di === di);
  const pins = s.pins.map(p => ({ i: idxOf(p.d), dir: p.dir })).filter(p => p.i >= 0);
  const marks = P.trades.filter(t => t.code === s.code).map(t => ({ i: idxOf(t.d), side: t.side })).filter(m => m.i >= 0);
  return chartExtras({ cs, total: cs.length, ma, pins, marks, ref: null, mode: '1d' });
}

// 見える範囲 [s0, s0 + cnt) を決める。end が null のときは最新のローソク足が右端に来る
function chartView(D) {
  const v = UI.vw[D.mode], N = D.cs.length;
  const maxEnd = Math.max(D.total, 60), cnt = v.cnt = clamp(v.cnt, 10, maxEnd);
  const follow = Math.min(maxEnd, Math.max(N, cnt));
  if (v.end != null && v.end >= follow - 0.5) v.end = null;   // 右端まで戻したら追従を再開
  const end = v.end == null ? follow : v.end = clamp(v.end, Math.min(cnt, maxEnd), maxEnd);
  return { s0: end - cnt, cnt, follow };
}

function drawChart() {
  const cv = $('#chart'); if (!G || UI.view !== 'trade') return;
  const W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
  const C = palette(), D = chartData(), s = sel();
  const padL = 6, padR = 64, padT = 18, padB = 22, pw = W - padL - padR, ph = H - padT - padB;
  const vh = Math.round(ph * 0.18), prH = ph - vh - 8;
  const { s0, cnt, follow } = chartView(D), slotW = pw / cnt, X = i => padL + (i - s0 + 0.5) * slotW;
  const i0 = Math.max(0, Math.floor(s0)), i1 = Math.min(D.cs.length, Math.ceil(s0 + cnt));   // 見えている足 [i0, i1)
  // 縦軸は見えている足に合わせて毎回自動で合わせる（はみ出しそうなら広げ、余裕があれば拡大）
  const K = D.ha || D.cs;   // 描くローソク足（平均足がオンなら平均足）
  let lo = Infinity, hi = -Infinity;
  for (let i = i0; i < i1; i++) { const c = K[i]; lo = Math.min(lo, c.l); hi = Math.max(hi, c.h); }
  [...D.ma, ...(D.bb ? [{ v: D.bb.up }, { v: D.bb.lo }] : [])].forEach(m => { for (let i = i0; i < i1; i++) { const v = m.v[i]; if (v != null) { lo = Math.min(lo, v); hi = Math.max(hi, v); } } });
  if (D.ref) { lo = Math.min(lo, D.ref); hi = Math.max(hi, D.ref); }
  const ordLines = G.player.orders.filter(o => o.code === s.code && o.price && (o.type === 'lmt' || o.type === 'stp'));   // 出している指値・逆指値の価格線
  ordLines.forEach(o => { lo = Math.min(lo, o.price); hi = Math.max(hi, o.price); });
  if (!isFinite(lo)) { lo = s.price * 0.98; hi = s.price * 1.02; }
  if (hi - lo < lo * 0.004) { const m = (hi + lo) / 2; lo = m * 0.997; hi = m * 1.003; }
  const py = (hi - lo) * 0.08; lo -= py; hi += py;
  // 上下にドラッグした分だけずらす。表示の中心はチャート全体（全期間）の安値〜高値の中まで。足が増えて値幅が広がれば動ける範囲も広がる
  let gLo = D.ref || Infinity, gHi = D.ref || -Infinity;
  D.cs.forEach(c => { gLo = Math.min(gLo, c.l); gHi = Math.max(gHi, c.h); });
  if (isFinite(gLo)) { const mid = (hi + lo) / 2; UI.vw.yOff = clamp(UI.vw.yOff, Math.min(0, (gLo - mid) / (hi - lo)), Math.max(0, (gHi - mid) / (hi - lo))); } else UI.vw.yOff = 0;
  const yo = UI.vw.yOff * (hi - lo); lo += yo; hi += yo;
  const Y = v => padT + (hi - v) / (hi - lo) * prH;
  ctx.font = `11px ${C.num}`; ctx.textBaseline = 'middle'; ctx.lineWidth = 1;
  // 目盛り
  const step = sel().tick1 ? Math.max(1, niceStep((hi - lo) / 5)) : niceStep((hi - lo) / 5);   // 低位株（呼値1円）は1円より細かい目盛りを引かない
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) {
    const y = Math.round(Y(v)) + 0.5;
    ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + pw, y); ctx.stroke();
    ctx.fillStyle = C.muted; ctx.textAlign = 'left'; ctx.fillText(step < 1 ? v.toFixed(1) : Math.round(v).toLocaleString('ja-JP'), padL + pw + 6, y);
  }
  // 前日終値
  if (D.ref) {
    const y = Math.round(Y(D.ref)) + 0.5;
    ctx.strokeStyle = C.muted; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + pw, y); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = C.muted; ctx.textAlign = 'right'; ctx.font = `10.5px ${C.body}`; ctx.fillText('前日終値', padL + pw - 4, y - 8); ctx.font = `11px ${C.num}`;
  }
  // 出来高とローソク足（それぞれの枠の外には描かない）
  let vmax = 1; for (let i = i0; i < i1; i++) vmax = Math.max(vmax, D.cs[i].v);
  const vb = padT + prH + 8 + vh;
  const bw = Math.max(1, Math.min(14, slotW * 0.64));
  ctx.save(); ctx.beginPath(); ctx.rect(padL, vb - vh, pw, vh); ctx.clip(); ctx.globalAlpha = 0.32;
  for (let i = i0; i < i1; i++) { const c = D.cs[i], vv = c.v / vmax * vh; ctx.fillStyle = c.c >= c.o ? C.up : C.down; ctx.fillRect(X(i) - bw / 2, vb - vv, bw, vv); }
  ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(padL, 0, pw, padT + prH); ctx.clip();
  // ボリンジャーバンド（ローソク足の下に、帯を薄く塗って上下の線を引く）
  if (D.bb) {
    const seg = [];
    for (let i = Math.max(0, i0 - 1); i < Math.min(K.length, i1 + 1); i++) if (D.bb.up[i] != null) seg.push(i);
    if (seg.length > 1) {
      ctx.fillStyle = C.accentSoft; ctx.beginPath();
      seg.forEach((i, j) => j ? ctx.lineTo(X(i), Y(D.bb.up[i])) : ctx.moveTo(X(i), Y(D.bb.up[i])));
      seg.slice().reverse().forEach(i => ctx.lineTo(X(i), Y(D.bb.lo[i]))); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = C.muted; ctx.setLineDash([3, 3]);
      for (const b of [D.bb.up, D.bb.lo]) { ctx.beginPath(); seg.forEach((i, j) => j ? ctx.lineTo(X(i), Y(b[i])) : ctx.moveTo(X(i), Y(b[i]))); ctx.stroke(); }
      ctx.setLineDash([]);
    }
  }
  K.forEach((c, i) => {
    if (i < i0 || i >= i1) return;
    const col = c.c >= c.o ? C.up : C.down, x = X(i);
    ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(Math.round(x) + 0.5, Y(c.h)); ctx.lineTo(Math.round(x) + 0.5, Y(c.l)); ctx.stroke();
    const y1 = Y(Math.max(c.o, c.c)), y2 = Y(Math.min(c.o, c.c));
    ctx.fillStyle = col; ctx.fillRect(x - bw / 2, y1, bw, Math.max(1, y2 - y1));
  });
  // 移動平均線
  const maCol = [C.accent, C.warn];
  D.ma.forEach((m, k) => {
    ctx.strokeStyle = maCol[k]; ctx.lineWidth = 1.6; ctx.beginPath(); let st = false;
    m.v.forEach((v, i) => { if (v == null || i < i0 - 1 || i > i1) return; const x = X(i), y = Y(v); if (st) ctx.lineTo(x, y); else { ctx.moveTo(x, y); st = true; } });
    ctx.stroke(); ctx.lineWidth = 1;
  });
  // ニュースのピン
  const seen = new Set();
  D.pins.forEach(p => { const key = p.i + ':' + p.dir; if (seen.has(key)) return; seen.add(key); ctx.fillStyle = p.dir > 0 ? C.up : C.down; ctx.beginPath(); ctx.arc(X(p.i), padT - 9 + (p.dir > 0 ? 0 : 0), 3.5, 0, Math.PI * 2); ctx.fill(); });
  // 自分の売買
  D.marks.forEach(m => {
    const c = D.cs[m.i]; if (!c) return; const x = X(m.i); ctx.fillStyle = C.accent; ctx.beginPath();
    if (m.side === 'buy') { const y = Y(c.l) + 6; ctx.moveTo(x, y); ctx.lineTo(x - 5, y + 8); ctx.lineTo(x + 5, y + 8); }
    else { const y = Y(c.h) - 6; ctx.moveTo(x, y); ctx.lineTo(x - 5, y - 8); ctx.lineTo(x + 5, y - 8); }
    ctx.closePath(); ctx.fill();
  });
  ctx.restore();
  // 出している注文（指値・逆指値）の価格線
  ctx.save(); ctx.beginPath(); ctx.rect(padL, padT, pw, prH); ctx.clip(); ctx.font = `10.5px ${C.body}`; ctx.textAlign = 'right';
  ordLines.forEach(o => {
    const y = Math.round(Y(o.price)) + 0.5, t = `${o.mg ? '信用' : ''}${o.side === 'buy' ? '買' : '売'} ${KIND[o.type]} ${px(o.price)}円 ${o.qty.toLocaleString('ja-JP')}株`, w = ctx.measureText(t).width + 10;
    ctx.strokeStyle = C.accent; ctx.lineWidth = 1.2; ctx.setLineDash([7, 4]); ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + pw, y); ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1;
    ctx.fillStyle = C.accent; ctx.fillRect(padL + pw - w, y - 8, w, 16);
    ctx.fillStyle = C.on; ctx.fillText(t, padL + pw - 5, y);
  });
  ctx.restore(); ctx.font = `11px ${C.num}`;
  // 現在値のタグ（範囲外なら上端・下端に寄せる）
  if (D.cs.length) {
    const last = D.cs.at(-1).c, y = clamp(Y(last), padT + 9, padT + prH - 9);
    ctx.fillStyle = s.price >= s.prevClose ? C.up : C.down; ctx.fillRect(padL + pw + 2, y - 9, padR - 4, 18);
    ctx.fillStyle = C.on; ctx.textAlign = 'left'; ctx.fillText(px(last), padL + pw + 6, y);
  }
  // 横軸
  ctx.fillStyle = C.muted; ctx.textAlign = 'center'; ctx.font = `10.5px ${C.num}`;
  const inX = x => x >= padL + 16 && x <= padL + pw - 16;
  if (D.mode === '5m') { const k = 6 * Math.ceil(64 / (6 * slotW)); for (let i = 0; i < 60; i += k) if (inX(X(i))) ctx.fillText(minLabel(i * 5), X(i), H - 8); }
  else if (!isReal()) { const k = Math.max(1, Math.ceil(64 / slotW)); for (let i = D.cs.length - 1; i >= 0; i -= k) if (inX(X(i))) ctx.fillText(D.cs[i].lab.replace(/（.*$/, ''), X(i), H - 8); }
  else {   // リアル相場：いちばん左の目盛りと、年が変わった目盛りだけ年を付け、年の境目に点線を引く
    const k = Math.max(1, Math.ceil(72 / slotW)), at = [];
    for (let i = D.cs.length - 1; i >= 0; i -= k) if (inX(X(i))) at.unshift(i);
    at.forEach((i, j) => {
      const d = D.cs[i].d, y = j === 0 || D.cs[at[j - 1]].d.slice(0, 4) !== d.slice(0, 4);
      const t = (y ? d.slice(0, 4) + '/' : '') + mdLabel(d).replace(/（.*$/, ''), w = ctx.measureText(t).width / 2;
      ctx.fillText(t, clamp(X(i), padL + w, padL + pw - w), H - 8);   // 年付きは長いので、端で切れないよう内側に寄せる
    });
    for (let i = Math.max(1, i0); i < i1; i++) {
      if (D.cs[i].d.slice(0, 4) === D.cs[i - 1].d.slice(0, 4)) continue;
      const x = Math.round(X(i) - slotW / 2) + 0.5;
      ctx.strokeStyle = C.line; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + ph); ctx.stroke(); ctx.setLineDash([]);
      ctx.textAlign = 'left'; ctx.font = `10.5px ${C.body}`; ctx.fillText(D.cs[i].d.slice(0, 4) + '年', x + 4, padT + 8); ctx.textAlign = 'center'; ctx.font = `10.5px ${C.num}`;
    }
  }
  if (D.mode === '5m' && inX(padL + (30 - s0) * slotW)) { const x = padL + (30 - s0) * slotW; ctx.strokeStyle = C.line; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + ph); ctx.stroke(); ctx.setLineDash([]); }
  // カーソル
  if (UI.hover != null && D.cs[UI.hover]) { const x = Math.round(X(UI.hover)) + 0.5; ctx.strokeStyle = C.muted; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + ph); ctx.stroke(); ctx.setLineDash([]); }
  if (!D.cs.length) { ctx.fillStyle = C.muted; ctx.textAlign = 'center'; ctx.font = `13px ${C.body}`; ctx.fillText(G.phase === 'pre' ? '寄り付き前です。9:00から株価が動き始めます。' : 'データがありません', padL + pw / 2, padT + prH / 2); }
  UI.geom = { padL, pw, prH, slotW, s0, cnt, follow, n: D.cs.length, mode: D.mode };
  const c = D.cs[UI.hover ?? D.cs.length - 1];
  $('#ohlc').textContent = c ? `${c.lab}　始${px(c.o)}　高${px(c.h)}　安${px(c.l)}　終${px(c.c)}　出来高${c.v.toLocaleString('ja-JP')}株` : '';
  $('#legend').innerHTML = D.ma.map((m, k) => `<span><i style="background:var(${k ? '--warn' : '--accent'})"></i>${m.name}</span>`).join('')
    + (D.bb ? `<span><i style="background:var(--muted)"></i>ボリンジャーバンド（20本・±2σ）</span>` : '') + (D.ha ? '<span>平均足</span>' : '')
    + `<span><i style="background:var(--up);height:7px;width:7px;border-radius:50%"></i>ニュース</span><span>▲▼ 自分の売買</span>${ordLines.length ? '<span><i style="background:var(--accent);height:2px"></i>出している注文</span>' : ''}<span class="muted">ドラッグで移動・ホイールで拡大縮小</span>`
    + (rank() < 3 ? `<span>移動平均線はランク3で解放</span>` : '');
}

function renderBoard() {
  const el = $('#board');
  if (UI.boardHold) return;   // 押している間は板を作り直さない（押したボタンが消えると、離したときにクリックにならない）。離したあとに描き直す
  $('#b-help').hidden = rank() < 3;
  if (rank() < 3) { el.innerHTML = `<div class="locked"><b>ランク3で解放</b><p>板は、売りたい人と買いたい人の注文が値段ごとに並んだ表です。</p></div>`; return; }
  if (ipoQuote(sel())) { const q = ipoQuote(sel()); el.innerHTML = `<div class="locked"><b>初値決定前（${q.side} ${px(q.p)}円）</b><p>上場日は、寄り付き（9:00）で初値が決まるまで、気配だけが出ます。</p></div>`; return; }
  if (sel().delisted) { el.innerHTML = '<div class="locked"><b>上場廃止</b><p>この銘柄は上場廃止になったため、板はありません。</p></div>'; return; }
  const s = sel(), { asks, bids } = book(s);
  const pre = G.phase === 'pre';
  const btn = p => `<button data-px="${p}">${px(p)}</button>`;
  let rows = asks.slice().reverse().map((a, i, v) => `<tr><td class="q qa${i === v.length - 1 ? ' best' : ''}">${a.q.toLocaleString('ja-JP')}</td><td class="p">${btn(a.p)}</td><td class="q"></td></tr>`).join('');
  if (!asks.length) rows += `<tr><td colspan="3" class="p">売り注文なし（${term('特別気配')}）</td></tr>`;
  rows += bids.map((b, i) => `<tr${i === 0 ? ' class="cur"' : ''}><td class="q"></td><td class="p">${btn(b.p)}</td><td class="q qb">${b.q.toLocaleString('ja-JP')}</td></tr>`).join('');
  if (!bids.length) rows += `<tr><td colspan="3" class="p">買い注文なし（${term('特別気配')}）</td></tr>`;
  el.innerHTML = `<table class="board"><thead><tr><th>売数量</th><th>値段</th><th>買数量</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="board-note">${pre ? '寄り付き前は前日終値のまわりに注文が並んでいます。' : `色付きの行が今の値段。成行で${term('約定')}するときは、上（買い）や下（売り）の注文から順に取引します。`}</p>`;
}

const TYPE_RANK = { mkt: 1, lmt: 2, stp: 2 };
const LOCK_SVG = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="8" rx="1.5" fill="currentColor"/><path d="M5.2 7V5a2.8 2.8 0 0 1 5.6 0v2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
function buildTypes() {
  const r = rank(), need = TYPE_RANK, lock = t => need[t] > r && !isFast();   // ファストスターターは全部使える
  if (lock(UI.type)) UI.type = 'mkt';
  $('#o-types').innerHTML = ['mkt', 'lmt', 'stp'].map(t => lock(t)
    ? `<button data-type="${t}" class="locked" aria-disabled="true" aria-label="${KIND[t]}（ランク${need[t]}で解放）">${LOCK_SVG}<span>${KIND[t]}</span></button>`
    : `<button data-type="${t}" aria-pressed="${UI.type === t}">${KIND[t]}</button>`).join('');
  if (!canMargin()) UI.acct = 'cash';
  $('#o-acct').innerHTML = `<button data-acct="cash" aria-pressed="${UI.acct === 'cash'}">現物</button>` + (canMargin()
    ? `<button data-acct="margin" aria-pressed="${UI.acct === 'margin'}">信用</button>`
    : `<button data-acct="margin" class="locked" aria-disabled="true" aria-label="信用（ランク${MARGIN.rank}で解放）">${LOCK_SVG}<span>信用</span></button>`);
}
function orderEstimate() {
  const s = sel(), D = DIFF[G.diff];
  const L = lot(s), qty = Math.max(0, Math.round((+$('#o-qty').value || 0) / L) * L);
  let p;
  if (UI.type === 'mkt') p = (G.phase === 'open' || UI.tut?.list === BTUT) && qty ? walk(s, UI.side, qty).avg : ipoQuote(s)?.p ?? s.price;   // 板の講座では、寄り付き前でも板から目安を出して見せる。上場日の寄り付き前は気配
  else p = roundPx(s, +$('#o-price').value || s.price);
  const gross = p * qty, fee = Math.round(gross * D.fee);
  return { qty, p, gross, fee };
}
function renderOrderPanel() {
  const s = sel(), P = G.player, D = DIFF[G.diff], L = lot(s);
  // 売買単位（100株 / 梅山カンパニーは1株）が変わったら、株数を1単位に戻す
  if (UI.lot !== L) {
    const q = $('#o-qty'); if (UI.lot) q.value = L; UI.lot = L; q.min = q.step = L;
    $('label[for="o-qty"] .term').textContent = `${L}株単位`; $('#q-minus').setAttribute('aria-label', `${L}株減らす`); $('#q-plus').setAttribute('aria-label', `${L}株増やす`);
  }
  const dw = $('#o-dl'), dwt = stockWarn(s); dw.hidden = !dwt; dw.textContent = dwt; $('#o-submit').disabled = !!s.delisted;   // 倒産・上場廃止・新規上場の注意
  const mg = UI.acct === 'margin', mp = mg && mPos(s.code), close = mp && mp.side !== UI.side;
  const lab = { buy: mg ? mSideLabel(s.code, 'buy') : '買う', sell: mg ? mSideLabel(s.code, 'sell') : '売る' };
  $('#o-name').textContent = s.name; $('#o-cur').textContent = ipoQuote(s) ? `${ipoQuote(s).side} ${px(ipoQuote(s).p)}円` : px(s.price) + '円';
  $$('#o-acct button:not(.locked)').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.acct === UI.acct)));
  $('#m-help').hidden = !mg;
  $$('[data-side]').forEach(b => { b.setAttribute('aria-pressed', String(b.dataset.side === UI.side)); b.textContent = lab[b.dataset.side]; });
  $$('#o-types button:not(.locked)').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.type === UI.type)));
  const pf = $('#o-price-field'); pf.hidden = UI.type === 'mkt';
  $('#o-price-lab').innerHTML = UI.type === 'lmt' ? `${term('指値注文', '指値')}（円）：${UI.side === 'buy' ? 'この値段以下で買う' : 'この値段以上で売る'}` : `${term('逆指値注文', '逆指値')}（円）：${UI.side === 'buy' ? 'ここまで上がったら買う' : 'ここまで下がったら売る'}`;
  const e = orderEstimate(), pos = P.pos[s.code];
  const lines = [
    ['値段の目安', e.qty ? px(Math.round(e.p * 10) / 10) + '円' : '—'],
    ['概算金額', yen(e.gross) + '円'],
  ];
  if (D.fee) lines.push([term('手数料'), yen(e.fee) + '円']);
  if (mg) {   // やさしいでは必要な保証金と余力を出さず、維持率のゲージだけにする
    if (close) lines.push(['返済できる株数', mp.qty.toLocaleString() + '株']);
    else if (UI.side === 'sell' && !canShort(s)) lines.push(['空売り', 'できません（信用は買いだけ）']);
    else if (G.diff !== 'easy') lines.push([`必要な${term('委託保証金', '保証金')}${mRate(s) !== MARGIN.rate ? `（${Math.round(mRate(s) * 100)}%）` : ''}`, yen(e.gross * mRate(s)) + '円'], [term('新規建て余力'), yen(marginRoom(s)) + '円']);
    lines.push([term('建玉'), mp ? `${mp.side === 'buy' ? '買い建て' : '売り建て'} ${mp.qty.toLocaleString()}株（建値 ${px(Math.round(mp.px * 10) / 10)}円）` : 'なし']);
    if (mp) { const pl = mPL(mp, s); lines.push(['評価損益', `<span class="${cls(pl)}">${yenS(pl)}円</span>`]); }
    lines.push([term('保証金維持率', '維持率'), mGauge(marginStat().ratio)]);
  } else {
    if (UI.side === 'buy') lines.push([term('買付余力'), yen(availCash()) + '円']);
    else lines.push(['売れる株数', availShares(s.code).toLocaleString() + '株']);
    lines.push(['保有', pos ? `${pos.qty.toLocaleString()}株（平均 ${px(Math.round(pos.avg * 10) / 10)}円）` : 'なし']);
    if (pos) { const pl = (s.price - pos.avg) * pos.qty; lines.push([term('含み損益'), `<span class="${cls(pl)}">${yenS(pl)}円（${pctS(s.price / pos.avg - 1)}）</span>`]); }
  }
  $('#o-est').innerHTML = lines.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  const sb = $('#o-submit'); sb.className = 'primary ' + UI.side; sb.textContent = mg ? `信用の${lab[UI.side]}の内容を確認` : `${UI.side === 'buy' ? '買い' : '売り'}注文の内容を確認`;
  $('#o-avail').textContent = `現金 ${yen(P.cash)}円`;
  const q = $('#o-quick');
  if (mg && s.ume) q.innerHTML = '';
  else if (mg && !close && UI.side === 'sell' && !canShort(s)) q.innerHTML = '';
  else if (mg) { const n = close ? mp.qty : Math.max(0, Math.floor(marginRoom(s) / (s.price * 1.01) / 100) * 100); q.innerHTML = `<button data-q="${n}">${close ? '全部' : '建てられる最大'} ${n.toLocaleString()}株</button>`; }
  else if (UI.side === 'buy') { const maxQ = Math.max(0, Math.floor(availCash() / (s.price * (1 + D.fee) * 1.01) / L) * L); q.innerHTML = `<button data-q="${maxQ}">買える最大 ${maxQ.toLocaleString()}株</button>`; }
  else { const a = availShares(s.code); q.innerHTML = a ? `<button data-q="${a}">全部 ${a.toLocaleString()}株</button>` + (a >= 2 * L ? `<button data-q="${Math.floor(a / (2 * L)) * L}">半分</button>` : '') : ''; }
  $('#o-list').innerHTML = P.orders.map(o => { const os = byCode(o.code); return `<li><span><b>${esc(os.name)}</b> <span class="${o.side === 'buy' ? 'up' : 'down'}">${o.mg ? '信用' : ''}${o.side === 'buy' ? '買' : '売'}</span></span><span class="num">${o.qty.toLocaleString()}株</span><button data-cancel="${o.id}">取消</button><span class="od">${KIND[o.type]}${o.type !== 'mkt' ? ` ${px(o.price)}円` : '（寄り付きで約定）'}</span></li>`; }).join('') || '<li class="empty">注文はありません</li>';
}

function renderNews() {
  const hint = DIFF[G.diff].hint;
  $('#news-hint').textContent = isReal() ? '日付は報道が届いた朝' : hint === 'dir' ? '矢印は影響の向き' : hint === 'stars' ? '★は情報の確かさ' : '';
  const key = `${G.newsId}|${unlockedStocks().length}`;   // 銘柄が増えたら、それまで隠していたニュースも出す
  if (UI.lastNews === key) return; UI.lastNews = key;
  $('#news').innerHTML = G.news.filter(newsVisible).slice(-newsShow()).reverse().map(n => {
    const sub = [];
    // 当時のニュース（real）は日付を出していて、すべて確かな報道なので、★と「◯日前」は省く
    if (hint === 'stars' && n.type !== 'div' && !n.type.startsWith('real')) sub.push(`<span class="stars" aria-label="信頼度 ${n.stars}">${'★'.repeat(n.stars)}${'☆'.repeat(3 - n.stars)}</span>`);
    if (hint === 'dir' && n.hint) sub.push(`<span>${esc(n.hint)}</span>`);
    if (n.day !== G.dayIndex && !n.type.startsWith('real')) sub.push(`<span>${n.day < G.dayIndex ? (G.dayIndex - n.day) + '日前' : ''}</span>`);
    return `<li><button class="nw${n.imp === 3 ? ' imp3' : ''}" data-news="${n.id}"><span class="nw-time num">${n.time}</span><span class="nw-tag ${n.flash ? 'flash' : 't-' + n.type}">${n.flash ? '速報' : TAG[n.type]}</span><span>${esc(n.text)}</span>${n.body ? `<span class="nw-body">${esc(n.body)}</span>` : ''}${sub.length ? `<span class="nw-sub">${sub.join('')}</span>` : ''}</button></li>`;
  }).join('') || (isReal() ? `<li class="empty">${hasRealNews() ? 'まだニュースはありません。当時の報道が、出来事の翌営業日の朝に届きます。' : `ニュースのデータ（${REAL_SETS[REAL_KEY].newsFile}）がないため、ニュースは流れません。`}</li>` : '<li class="empty">まだニュースはありません。9:00の寄り付きから、ニュースが流れ始めます。</li>');
}

// ×1〜×4 で時間を進めているあいだ、新しいニュースを右下にお知らせする（多いときは新しい2件だけ）。
// 「〜まで進める」で飛ばしたときは出さない（loop からだけ呼ぶ）。since = 進める前の G.newsId
function notifyNews(since) {
  const fresh = G.news.filter(n => n.id > since && newsVisible(n)).slice(-2);
  if (!fresh.length) return;
  const hint = DIFF[G.diff].hint, box = $('#toasts');
  for (const n of fresh) {
    const sub = hint === 'stars' && n.type !== 'div' ? `情報の確かさ <span class="stars" aria-label="信頼度 ${n.stars}">${'★'.repeat(n.stars)}${'☆'.repeat(3 - n.stars)}</span>` : hint === 'dir' && n.hint ? esc(n.hint) : '';
    const t = document.createElement('button'); t.className = 'toast news'; t.dataset.news = n.id;
    t.innerHTML = `<span class="nt-top"><span class="nw-tag ${n.flash ? 'flash' : 't-' + n.type}">${n.flash ? '速報' : TAG[n.type]}</span><span class="num muted small">${n.time}</span></span>${esc(n.text)}${sub ? `<span class="nt-sub">${sub}</span>` : ''}`;
    box.prepend(t);
    setTimeout(() => t.classList.add('out'), 6000); setTimeout(() => t.remove(), 6500);
  }
  while (box.children.length > (window.innerWidth < 700 ? 2 : 3)) box.lastChild.remove();
}

/* ---------- 保有株 ---------- */
const holdDays = p => (G.dayIndex > p.d ? `${G.dayIndex - p.d}日` : '今日から');   // 持ち始めた日（p.d）からの営業日数
function renderHold() {
  const P = G.player, a = asset();
  const rows = Object.entries(P.pos).map(([c, p]) => { const s = byCode(c); const val = p.qty * s.price; return { s, p, val, pl: val - p.avg * p.qty }; }).sort((x, y) => y.val - x.val);
  const stockVal = rows.reduce((t, r) => t + r.val, 0), unreal = rows.reduce((t, r) => t + r.pl, 0);
  const bySec = {}; rows.forEach(r => { bySec[r.s.sector] = (bySec[r.s.sector] || 0) + r.val; });
  const segs = (isReal() ? realSegs(bySec) : Object.entries(bySec).map(([k, v]) => ({ k, v, name: SECTORS[k].short, col: `var(--c-${k})` }))).concat([{ k: 'cash', v: Math.max(0, P.cash), name: '現金', col: 'var(--c-cash)' }]);
  const tot = segs.reduce((t, x) => t + x.v, 0) || 1;
  const ret = a / P.start - 1, iret = G.market.idx / P.startIdx - 1;
  $('#view-hold').innerHTML = `
  <section class="panel"><h2>資産のまとめ</h2>
    <dl class="sum-grid">
      <div><dt>総資産</dt><dd class="num">${yen(a)}円</dd></div>
      <div><dt>はじめから</dt><dd class="num ${cls(ret)}">${pctS(ret)}</dd></div>
      <div><dt>指数（${idxName()}）は</dt><dd class="num ${cls(iret)}">${pctS(iret)}</dd></div>
      <div><dt>現金</dt><dd class="num">${yen(P.cash)}円</dd></div>
      <div><dt>株の評価額</dt><dd class="num">${yen(stockVal)}円</dd></div>
      <div><dt>${term('含み損益')}</dt><dd class="num ${cls(unreal)}">${yenS(unreal)}円</dd></div>
      <div><dt>今年の確定損益</dt><dd class="num ${cls(P.realizedYear)}">${yenS(P.realizedYear)}円</dd></div>
      <div><dt>${term('譲渡益課税', '税金')}（今年）</dt><dd class="num">${yen(P.taxYear)}円</dd></div>
      ${divOn() || P.divTotal ? `<div><dt>受け取った配当（税引後）</dt><dd class="num">${yen(P.divTotal)}円</dd></div>` : ''}
      ${P.perkTotal ? `<div><dt>受け取った${term('株主優待', '優待')}（現金相当）</dt><dd class="num">${yen(P.perkTotal)}円</dd></div>` : ''}
      ${DIFF[G.diff].fee ? `<div><dt>${term('手数料')}の合計</dt><dd class="num">${yen(P.feesTotal)}円</dd></div>` : ''}
      <div><dt>${term('最大ドローダウン')}</dt><dd class="num">${(P.maxDD * 100).toFixed(1)}%</dd></div>
    </dl>
    <h3>資産の内訳（${term('分散投資')}の具合）</h3>
    <div class="alloc">${segs.map(x => `<span style="width:${x.v / tot * 100}%;background:${x.col}" title="${x.name}"></span>`).join('')}</div>
    <div class="alloc-leg">${segs.map(x => `<span><i style="background:${x.col}"></i>${x.name} ${(x.v / tot * 100).toFixed(0)}%</span>`).join('')}</div>
    <h3>資産と指数の動き（スタートを100とする）</h3>
    <canvas id="hist-chart" role="img" aria-label="資産と指数の推移"></canvas>
  </section>
  <section class="panel"><h2>保有株</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>銘柄</th><th class="r">株数</th><th class="r">平均取得単価</th><th class="r">保有日数</th><th class="r">現在値</th><th class="r">評価額</th><th class="r">含み損益</th></tr></thead><tbody>
    ${rows.map(r => `<tr><td>${esc(r.s.name)} <span class="muted">${SEC(r.s.sector).short}</span></td><td class="r num">${r.p.qty.toLocaleString()}</td><td class="r num">${px(Math.round(r.p.avg * 10) / 10)}</td><td class="r num">${holdDays(r.p)}</td><td class="r num">${px(r.s.price)}</td><td class="r num">${yen(r.val)}</td><td class="r num ${cls(r.pl)}">${yenS(r.pl)}（${pctS(r.s.price / r.p.avg - 1)}）</td></tr>`).join('') || '<tr class="empty"><td colspan="6">まだ株を持っていません。取引画面で買ってみよう。</td></tr>'}
  </tbody></table></div></section>
  ${marginSection()}
  <section class="panel"><h2>最近の売買</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>日時</th><th>銘柄</th><th>売買</th><th>種類</th><th class="r">株数</th><th class="r">約定値段</th></tr></thead><tbody>
    ${P.trades.slice(-15).reverse().map(t => `<tr><td class="num">${t.d === G.dayIndex ? '今日' : (G.dayIndex - t.d) + '日前'} ${(t.m >= MIN_PER_DAY ? '15:30' : minLabel(t.m))}</td><td>${byCode(t.code).delisted ? `<button class="golink" data-goto="${t.code}">${esc(byCode(t.code).name)}</button><span class="muted">（上場廃止）</span>` : esc(byCode(t.code).name)}</td><td class="${t.side === 'buy' ? 'up' : 'down'}">${t.mg ? '信用' : ''}${t.side === 'buy' ? '買い' : '売り'}</td><td>${KIND[t.kind]}</td><td class="r num">${t.qty.toLocaleString()}</td><td class="r num">${px(Math.round(t.px * 10) / 10)}</td></tr>`).join('') || '<tr class="empty"><td colspan="6">まだ売買していません。</td></tr>'}
  </tbody></table></div></section>`;
  drawLines($('#hist-chart'), P.hist);
}
// 信用の建玉（ランク6から）。やさしいは維持率のゲージと一覧だけ、ふつう・本格は保証金の内訳と金利なども出す
function marginSection() {
  if (!canMargin() && !hasMargin()) return '';
  const P = G.player, m = marginStat(), easy = G.diff === 'easy';
  const rows = Object.entries(P.mpos).map(([c, p]) => { const s = byCode(c); return { c, s, p, pl: mPL(p, s) }; });
  return `<section class="panel" id="m-sec"><h2>${term('信用取引')}の${term('建玉')}</h2>
    <div class="mrow"><span>${term('保証金維持率')}</span>${mGauge(m.ratio)}<span class="muted small">20%を下回ったまま引けると${term('追証')}</span></div>
    ${G.mcall ? `<div class="warnbox">追証が出ています。${G.dayIndex >= G.mcall.due ? '今日' : '明日'}の引けまでに建玉を返済するか現物株を売って、維持率を20%以上に戻してください（あと約${yen(Math.max(0, MARGIN.keep * m.n - m.eq))}円）。戻らなければ全部の建玉が強制的に返済されます。</div>` : ''}
    ${easy ? '' : `<dl class="sum-grid">
      <div><dt>現金（${term('委託保証金', '保証金')}）</dt><dd class="num">${yen(P.cash)}円</dd></div>
      <div><dt>建玉の評価損益</dt><dd class="num ${cls(m.u)}">${yenS(m.u)}円</dd></div>
      <div><dt>${term('信用金利・貸株料')}（未精算）</dt><dd class="num">${yen(m.cost)}円</dd></div>
      <div><dt>建玉の金額の合計</dt><dd class="num">${yen(m.n)}円</dd></div>
      <div><dt>${term('新規建て余力')}</dt><dd class="num">${yen(marginRoom())}円</dd></div>
    </dl>`}
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>銘柄</th><th>売買</th><th class="r">株数</th><th class="r">建値</th><th class="r">現在値</th><th class="r">評価損益</th>${easy ? '' : '<th class="r">金利など</th>'}<th>${term('返済期限', '期限')}</th><th></th></tr></thead><tbody>
    ${rows.map(r => `<tr><td>${esc(r.s.name)}</td><td class="${r.p.side === 'buy' ? 'up' : 'down'}">${r.p.side === 'buy' ? '買い建て' : '売り建て'}</td><td class="r num">${r.p.qty.toLocaleString()}</td><td class="r num">${px(Math.round(r.p.px * 10) / 10)}</td><td class="r num">${px(r.s.price)}</td><td class="r num ${cls(r.pl)}">${yenS(r.pl)}</td>${easy ? '' : `<td class="r num">${yen(r.p.cost)}</td>`}<td class="num">${mdLabel(mDue(r.p))}</td><td><button class="ghost" data-mclose="${r.c}">返済</button></td></tr>`).join('')
      || `<tr class="empty"><td colspan="${easy ? 8 : 9}">信用の建玉はありません。取引画面の注文で「信用」を選ぶと、新規買い・新規売り（空売り）ができます。</td></tr>`}
  </tbody></table></div></section>`;
}

// リアル相場は業種が15あるので、金額の大きい6業種だけ色を分け、残りは「その他の業種」にまとめる
const ALLOC_COLS = ['tech', 'auto', 'bank', 'food', 'game', 'growth'].map(k => `var(--c-${k})`);
function realSegs(bySec) {
  const e = Object.entries(bySec).sort((x, y) => y[1] - x[1]);
  const top = e.length > ALLOC_COLS.length ? e.slice(0, ALLOC_COLS.length - 1) : e, rest = e.slice(top.length);
  const segs = top.map(([k, v], i) => ({ k, v, name: SEC(k).short, col: ALLOC_COLS[i] }));
  if (rest.length) segs.push({ k: 'other', v: rest.reduce((t, x) => t + x[1], 0), name: `その他の${rest.length}業種`, col: 'var(--c-other)' });
  return segs;
}

function drawLines(cv, hist, rec) {   // rec = 取引成績の記録（G がなくても描ける）
  const W = cv.clientWidth, H = cv.clientHeight; if (!W) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const C = palette(), P = rec ? null : G.player, label = rec ? (rec.real ? '30銘柄平均' : 'NTX225') : idxName();
  const A = rec ? rec.ha.slice() : hist.map(h => h.a / P.start * 100), I = rec ? rec.hi.slice() : hist.map(h => h.idx / P.startIdx * 100);
  if (!rec && G.phase === 'open') { A.push(asset() / P.start * 100); I.push(G.market.idx / P.startIdx * 100); }
  let lo = Math.min(...A, ...I, 100), hi = Math.max(...A, ...I, 100); const pad = Math.max(1, (hi - lo) * 0.1); lo -= pad; hi += pad;
  const padL = 8, padR = 46, padT = 10, padB = 18, pw = W - padL - padR, ph = H - padT - padB;
  const X = i => padL + (A.length < 2 ? pw / 2 : i / (A.length - 1) * pw), Y = v => padT + (hi - v) / (hi - lo) * ph;
  ctx.font = `11px ${C.num}`; ctx.textBaseline = 'middle';
  const st = niceStep((hi - lo) / 4);
  for (let v = Math.ceil(lo / st) * st; v <= hi; v += st) { const y = Math.round(Y(v)) + .5; ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + pw, y); ctx.stroke(); ctx.fillStyle = C.muted; ctx.textAlign = 'left'; ctx.fillText(v.toFixed(st < 1 ? 1 : 0), padL + pw + 6, y); }
  const line = (arr, col, w, dash) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.setLineDash(dash); ctx.beginPath(); arr.forEach((v, i) => i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v))); ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1; };
  line(I, C.muted, 1.5, [4, 3]); line(A, C.accent, 2.2, []);
  ctx.fillStyle = C.accent; ctx.beginPath(); ctx.arc(X(A.length - 1), Y(A.at(-1)), 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.textAlign = 'left'; ctx.font = `11.5px ${C.body}`; ctx.fillStyle = C.accent; ctx.fillText('あなたの資産', padL + 4, padT + 6); ctx.fillStyle = C.muted; ctx.fillText('- - ' + label, padL + 96, padT + 6);
}

/* ---------- 決算・配当 ---------- */
// リアル相場：当時の決算の発表日、配当と株主優待の権利付き最終日。配当の金額は、まだ決まっていない先の分は出さず、前回の実績を出す
function renderCalReal(el) {
  const EV = realEv();
  if (!EV) { el.innerHTML = `<section class="panel"><h2>決算・配当</h2><p class="muted">決算・配当・株主優待のデータ（${REAL_SETS[REAL_KEY].eventsFile}）がないため、このシナリオでは扱いません（tools/fetch_events.py で作成）。</p></section>`; return; }
  const P = G.player, di = G.dayIndex, D = REAL.dates, day = i => `${mdLabel(D[i])}${i === di ? ' 今日' : ''}`;
  const ss = allStocks().filter(s => live(s) && !xHidden(s) && EV[s.code]), own = s => (P.pos[s.code] ? '●' : '');
  const up = ss.flatMap(s => EV[s.code].earn.filter(e => e.k === 'k' && e.di >= di && e.di - di <= 25).map(e => ({ s, e }))).sort((a, b) => a.e.di - b.e.di);
  const divs = ss.map(s => {
    const ev = EV[s.code], next = Math.min(...ev.divs.filter(v => v.di >= di).map(v => v.di), ...ev.skip.filter(v => v.di >= di).map(v => v.di));
    return { s, yr: realDivYear(s), next: isFinite(next) ? next : -1, last: ev.divs.filter(v => v.ex <= G.date).at(-1) };
  }).filter(x => x.yr || x.next >= 0);
  const perks = ss.flatMap(s => EV[s.code].perk.filter(p => p.di >= di).map(p => ({ s, p }))).sort((a, b) => a.p.di - b.p.di);
  el.innerHTML = `<section class="panel"><h2>決算発表の予定（25営業日先まで）</h2><p class="muted small">当時の実際の発表日時です。発表の内容はニュースに出ます。株価は実際の終値のままで、発表への市場の受け止め方は、そのあとの値動きに表れます。</p>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>発表日</th><th>時刻</th><th>銘柄</th><th>業種</th><th>保有</th></tr></thead><tbody>
    ${up.map(({ s, e }) => `<tr><td class="num">${day(e.di)}</td><td class="num">${e.slot === 'pre' ? '朝' : e.time}</td><td>${esc(s.name)}</td><td>${esc(SEC(s.sector).short)}</td><td>${own(s)}</td></tr>`).join('') || '<tr class="empty"><td colspan="5">近い予定はありません。</td></tr>'}
    </tbody></table></div></section>
    ${divOn() ? `<section class="panel"><h2>配当と${term('権利付き最終日')}</h2><p class="muted small">権利付き最終日の大引けに現物を持っていれば、翌朝に配当が入ります（実際の株では約3か月後）。信用の買い建ては配当と同じ額を受け取り、売り建ては支払います。${term('権利落ち')}の値下がりは、実際の終値にすでに含まれています。</p>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>銘柄</th><th class="r">直近1年の配当（1株）</th><th class="r">${term('配当利回り')}</th><th class="r">前回の配当</th><th>次の権利付き最終日（予定）</th><th>保有</th></tr></thead><tbody>
    ${divs.map(x => `<tr><td>${esc(x.s.name)}</td><td class="r num">${+x.yr.toFixed(2)}円</td><td class="r num">${(x.yr / x.s.price * 100).toFixed(2)}%</td><td class="r num">${x.last ? +x.last.amt.toFixed(2) + '円' : '—'}</td><td class="num">${x.next >= 0 ? day(x.next) : '—'}</td><td>${own(x.s)}</td></tr>`).join('') || '<tr class="empty"><td colspan="6">配当のある銘柄はありません。</td></tr>'}
    </tbody></table></div></section>` : ''}
    ${perks.length ? `<section class="panel"><h2>${term('株主優待')}</h2><p class="muted small">権利付き最終日の大引けに、現物を必要な株数以上持っていれば権利が付きます。金額が示されている優待（券の額面・〇円相当・ポイント）だけ、翌朝に現金相当を入れます（課税なし）。割引券・引換券などは入金しません。信用の買い建てには付きません。1年以上の保有が条件の優待は、このゲームの期間では対象外です。</p>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>権利付き最終日</th><th>銘柄</th><th>優待の内容</th><th class="r">必要な株数</th><th class="r">現金相当（1回）</th><th>保有</th></tr></thead><tbody>
    ${perks.map(({ s, p }) => `<tr><td class="num">${day(p.di)}</td><td>${esc(s.name)}</td><td>${esc(p.text)}${p.hold ? `（${p.hold}年以上の保有が条件）` : ''}</td><td class="r num">${p.lot.toLocaleString()}株</td><td class="r num">${p.yen ? yen(p.yen) + '円' : '入金なし'}</td><td>${(P.pos[s.code]?.qty || 0) >= p.lot ? '●' : ''}</td></tr>`).join('')}
    </tbody></table></div></section>` : ''}`;
}
function renderCal() {
  const el = $('#view-cal');
  if (rank() < 4) { el.innerHTML = `<section class="panel"><div class="locked"><b>ランク4で解放</b><p>決算発表の予定日と、配当の権利確定日がわかるカレンダーです。</p></div></section>`; return; }
  if (isReal()) { renderCalReal(el); return; }
  const P = G.player;
  const up = allStocks().filter(s => live(s) && !xHidden(s) && !['fail', 'seiri'].includes(dlStage(s)) && s.nextEarn - G.dayIndex <= 25 && s.nextEarn >= G.dayIndex).sort((a, b) => a.nextEarn - b.nextEarn);
  const divs = allStocks().filter(s => s.div && live(s) && !xHidden(s));
  const perks = allStocks().filter(s => s.perk && !xHidden(s));
  const recDate = (s, months = s.rec) => { let best = null; for (let k = 0; k < 270 && !best; k++) { const d = addTD(G.date, k); if (months.includes(monthOf(d)) && lastTradingDayOfMonth(d)) best = d; } return best; };
  el.innerHTML = `<section class="panel"><h2>決算発表の予定（25営業日先まで）</h2><p class="muted small">決算は大引け後（15:30）に発表され、翌日の寄り付きで株価に反映されます。</p>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>発表日</th><th>銘柄</th><th>業種</th><th class="r">${term('市場予想')}（1株利益）</th><th>保有</th></tr></thead><tbody>
    ${up.map(s => `<tr><td class="num">${mdLabel(addTD(G.date, s.nextEarn - G.dayIndex))}${s.nextEarn === G.dayIndex ? ' 今日' : ''}</td><td>${esc(s.name)}</td><td>${SEC(s.sector).short}</td><td class="r num">${s.consensus.toFixed(1)}円</td><td>${P.pos[s.code] ? '●' : ''}</td></tr>`).join('') || '<tr class="empty"><td colspan="5">近い予定はありません。</td></tr>'}
    </tbody></table></div></section>
    <section class="panel"><h2>配当と${term('権利確定日')}</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>銘柄</th><th class="r">年間配当（1株）</th><th class="r">${term('配当利回り')}</th><th>確定月</th><th>次の権利確定日</th></tr></thead><tbody>
    ${divs.map(s => `<tr><td>${esc(s.name)}</td><td class="r num">${s.div}円</td><td class="r num">${(s.div / s.price * 100).toFixed(2)}%</td><td>${s.rec.map(m => m + '月').join('・')}</td><td class="num">${(d => d ? mdLabel(d) : '—')(recDate(s))}</td></tr>`).join('')}
    </tbody></table></div></section>
    ${perks.length ? `<section class="panel"><h2>${term('株主優待')}</h2><p class="muted small">権利確定日の引けに、現物を${PERK_LOT}株以上持っていれば、翌朝に現金相当の額が入ります（課税なし）。信用の買い建てには付きません。</p>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>銘柄</th><th>優待の内容</th><th class="r">年間（現金相当）</th><th class="r">優待利回り</th><th>確定月</th><th>次の権利確定日</th><th class="r">${PERK_LOT}株の金額</th><th>保有</th></tr></thead><tbody>
    ${perks.map(s => { const yr = s.perk.yen * s.perk.m.length; return `<tr><td>${esc(s.name)}</td><td>${esc(s.perk.text)}</td><td class="r num">${yen(yr)}円</td><td class="r num">${(yr / (s.price * PERK_LOT) * 100).toFixed(2)}%</td><td>${s.perk.m.map(m => m + '月').join('・')}</td><td class="num">${(d => d ? mdLabel(d) : '—')(recDate(s, s.perk.m))}</td><td class="r num">${yen(s.price * PERK_LOT)}円</td><td>${(P.pos[s.code]?.qty || 0) >= PERK_LOT ? '●' : ''}</td></tr>`; }).join('')}
    </tbody></table></div></section>` : ''}`;
}

/* ---------- ミッション ---------- */
function renderMissions() {
  const r = rank(), R = RANKS[r - 1], nx = RANKS[r];
  // 達成したミッションは、はじめて見せるあいだは未達と同じ一覧に出し、この画面を離れたら「完了済み」へ移す
  const open = MISSIONS.filter(m => m.rank <= r), seen = m => profile.missions[m.id] && profile.mseen[m.id];
  const todo = open.filter(m => !seen(m)), fin = open.filter(seen);
  const mItem = m => { const done = profile.missions[m.id]; return `<li><span class="chk ${done ? 'on' : ''}">${done ? '✓' : ''}</span><span>${m.t}</span><span class="xp">+${m.xp} XP</span></li>`; };
  const prog = nx ? (profile.xp - R.xp) / (nx.xp - R.xp) : 1;
  $('#view-mission').innerHTML = `<section class="panel"><div class="rank-card"><div class="rank-big">R${r}</div><div class="rank-name">${R.n}</div>
    <div class="bar"><span style="width:${(prog * 100).toFixed(1)}%"></span></div>
    <div class="muted small">${profile.xp.toLocaleString()} XP${nx ? `　次のランク「${nx.n}」まであと ${(nx.xp - profile.xp).toLocaleString()} XP（解放：${nx.unlock}）` : '　最高ランクです'}</div></div></section>
  <section class="panel"><h2>ミッション</h2><ul class="mlist">${todo.map(mItem).join('')}</ul>
    <h3>ほかにXPがもらえること</h3><ul class="ev"><li>株を持って1日を終える（+3）、1日の資産がプラス（+5）</li><li>逆指値の損切りで、損失を5%以内に抑える（+15）</li><li>5業種以上に分散して1週間（5営業日）保有する（+20）</li></ul></section>
  ${fin.length ? `<section class="panel"><h2>完了済み（${fin.length}/${open.length}）</h2><ul class="mlist done">${fin.map(mItem).join('')}</ul></section>` : ''}
  <section class="panel"><h2>ランクと解放されるもの</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>ランク</th><th>称号</th><th class="r">必要XP</th><th>解放</th></tr></thead><tbody>${RANKS.map((k, i) => `<tr${i + 1 === r ? ' style="background:var(--accent-soft)"' : ''}><td class="num">R${i + 1}</td><td${i === RANKS.length - 1 ? ' data-legend style="user-select:none;-webkit-user-select:none"' : ''}>${k.n}</td><td class="r num">${k.xp.toLocaleString()}</td><td style="white-space:normal">${k.unlock}</td></tr>`).join('')}</tbody></table></div></section>`;
}

/* ---------- ヒント（コツ・用語のQ&A。豆知識は答えに添える） ---------- */
const HINT_TABS = { tip: 'コツ', term: '用語' };
function hintGroups(tab) {
  if (tab === 'tip') return TIPS.map(g => ({ name: g.name, items: g.items.map(([q, a, t]) => ({ q, a, t })) }));
  const used = new Set(TERM_GROUPS.flatMap(g => g[1])), rest = Object.keys(GLOSS).filter(k => !used.has(k));
  return [...TERM_GROUPS, ...(rest.length ? [['その他', rest]] : [])].map(([name, keys]) => ({ name, items: keys.filter(k => GLOSS[k]).map(k => ({ q: `「${k}」とは？`, a: GLOSS[k], t: TRIVIA[k] })) }));
}
function renderHint(q = '') {
  const v = $('#view-hint');
  if (!v.querySelector('#dict-q')) v.innerHTML = `<section class="panel"><h2>ヒント</h2><div class="hint-tabs" role="group" aria-label="ヒントの種類">${Object.entries(HINT_TABS).map(([k, n]) => `<button data-hcat="${k}">${n}</button>`).join('')}</div><input id="dict-q" type="search" placeholder="さがす（例：PER、損切り）" aria-label="ヒントをさがす"><div id="dict-list"></div></section>`;
  $$('[data-hcat]', v).forEach(b => b.setAttribute('aria-pressed', String(!q && b.dataset.hcat === UI.hcat)));
  // 検索中はコツと用語の両方から探して、答えを開いた状態で見せる
  const groups = (q ? ['tip', 'term'] : [UI.hcat]).flatMap(t => hintGroups(t).map(g => ({ ...g, name: q ? `${HINT_TABS[t]}：${g.name}` : g.name })))
    .map(g => ({ ...g, items: g.items.filter(it => !q || it.q.includes(q) || it.a.includes(q) || (it.t || '').includes(q)) })).filter(g => g.items.length);
  $('#dict-list').innerHTML = groups.map(g => `<section class="faq"><h3>${esc(g.name)}</h3>${g.items.map(it => `<details${q ? ' open' : ''}><summary><i class="qa">Q</i><span>${esc(it.q)}</span><i class="pm" aria-hidden="true"></i></summary><div class="ans"><i class="qa">A</i><div><p>${esc(it.a)}</p>${it.t ? `<p class="trivia">豆知識：${esc(it.t)}</p>` : ''}</div></div></details>`).join('')}</section>`).join('') || '<p class="muted">見つかりませんでした。</p>';
}

/* ===================== モーダル・トースト・用語 ===================== */
let modalHandlers = {};
function openModal(html, handlers = {}) {
  $('#modal-card').innerHTML = html; modalHandlers = handlers;
  $('#modal').hidden = false; modalOpen = true; hidePop();
  const f = $('#modal-card').querySelector('.primary') || $('#modal-card').querySelector('button'); if (f) f.focus();
}
function closeModal() { $('#modal').hidden = true; modalOpen = false; stopPreview(); }
function toast(msg, kind = '') {
  const box = $('#toasts'); if (!box || UI.quiet) return;
  const t = document.createElement('div'); t.className = 'toast ' + kind; t.textContent = msg; box.prepend(t);
  while (box.children.length > (window.innerWidth < 700 ? 2 : 3)) box.lastChild.remove();
  setTimeout(() => t.classList.add('out'), 3800); setTimeout(() => t.remove(), 4300);
}
function showTerm(btn) {
  const k = btn.dataset.term, txt = GLOSS[k]; if (!txt) return;
  const pop = $('#pop'); pop.innerHTML = `<b>${esc(k)}</b><p>${esc(txt)}</p>`; pop.hidden = false;
  // 画面に固定（position:fixed）して、見えている幅の中に収める。ページが横にはみ出していても、吹き出しで横スクロールが増えないようにする
  const vw = Math.min(window.innerWidth, document.documentElement.clientWidth || Infinity, window.visualViewport?.width || Infinity);
  const vh = Math.min(window.innerHeight, window.visualViewport?.height || Infinity);
  const r = btn.getBoundingClientRect(), pw = Math.min(300, vw - 32);
  pop.style.width = pw + 'px';
  pop.style.left = clamp(r.left, 16, vw - pw - 16) + 'px';
  const below = r.bottom + 8, h = pop.offsetHeight;
  pop.style.top = (below + h > vh - 70 ? Math.max(16, r.top - h - 8) : below) + 'px';
}
function hidePop() { const p = $('#pop'); if (p.hidden) return; p.hidden = true; tutEvent('termclose'); }

/* ---------- 注文の確認 ---------- */
function buildOrder() {
  const s = sel(), D = DIFF[G.diff], side = UI.side, type = UI.type, mg = UI.acct === 'margin';
  const L = lot(s), qty = Math.round((+$('#o-qty').value || 0) / L) * L;
  if (qty < L) return { err: L === 1 ? '株数は1株以上で入力してください。' : '株数は100株以上、100株単位で入力してください。' };
  if (G.phase === 'closed') return { err: '本日の取引は終了しました。' };
  if (mg && s.ume) return { err: `${s.name}は信用取引の対象外です。社長が株を貸してくれません。` };
  if (s.delisted) return { err: dlWarn(s) };
  if (mg && side === 'sell' && !canShort(s) && mPos(s.code)?.side !== 'buy') return { err: NO_SHORT(s) };
  if (mg && dlStage(s) === 'seiri' && mPos(s.code)?.side !== (side === 'buy' ? 'sell' : 'buy')) return { err: DL_NO_MARGIN(s) };
  if (mg && mPos(s.code)?.side !== (side === 'buy' ? 'sell' : 'buy') && ipoMgMsg(s, side)) return { err: ipoMgMsg(s, side) };
  let price = null;
  if (type !== 'mkt') {
    price = roundPx(s, +$('#o-price').value || 0);
    if (!price) return { err: '値段を入力してください。' };
    if (price > s.limUp || price < s.limDn) return { err: `値段は今日の値幅制限（${px(s.limDn)}〜${px(s.limUp)}円）の中で入力してください。` };
    if (type === 'stp' && side === 'sell' && price >= s.price) return { err: '逆指値の売りは、今の株価より低い値段にします（下がったら売る）。' };
    if (type === 'stp' && side === 'buy' && price <= s.price) return { err: '逆指値の買いは、今の株価より高い値段にします（上がったら買う）。' };
  }
  if (side === 'sell') {
    const av = availShares(s.code);
    if (!mg && qty > av) return { err: av ? `売れるのは${av.toLocaleString()}株までです（注文中の分を除く）。` : 'この銘柄を持っていません。' };
    if (type === 'mkt' && s.stop === 'down' && G.phase === 'open') return { err: 'ストップ安で買い注文がないため、成行の売りは約定しません。' };
  }
  if (side === 'buy' && type === 'mkt' && s.stop === 'up' && G.phase === 'open') return { err: 'ストップ高で売り注文がないため、成行の買いは約定しません。' };
  const wk = type === 'mkt' && G.phase === 'open' ? walk(s, side, qty) : null;
  const est = type === 'mkt' ? (wk ? wk.avg : ipoQuote(s)?.p ?? s.price) : price;   // 上場日の寄り付き前は気配を目安にする
  const gross = est * qty, fee = Math.round(gross * D.fee);
  if (mg) {   // 信用：反対の建玉があれば返済、なければ新規（お金は確保しない）
    const p = mPos(s.code), close = !!p && p.side !== side;
    if (close) {
      const left = p.qty - G.player.orders.filter(x => x.mg && x.code === s.code && x.side === side).reduce((a, x) => a + x.qty, 0);
      if (qty > left) return { err: left > 0 ? `返済できるのは${left.toLocaleString()}株までです（注文中の分を除く）。` : '返済できる建玉がありません（注文中の分を除く）。' };
    } else { const e = mCheck(s, side, qty, gross); if (e) return { err: e }; }
    return { o: { code: s.code, side, type, qty, price, reserve: 0, mg: true, open: !close }, est, gross, fee, close, left: wk?.left || 0 };
  }
  let reserve = 0;
  if (side === 'buy') {
    // 買えるかどうかは画面に出している概算金額で判定する。値上がりに備えた上乗せは、余力の範囲内でだけ確保する
    const need = gross + fee, buf = orderBuf(type, G.phase);
    if (need > availCash() + 0.5) return { err: `お金が足りません（必要 約${yen(need)}円／買付余力 ${yen(availCash())}円）。` };
    reserve = G.phase === 'open' && type === 'mkt' ? 0 : Math.min(need * buf, availCash());
  }
  return { o: { code: s.code, side, type, qty, price, reserve }, est, gross, fee, left: wk?.left || 0 };
}
function confirmOrder() {
  const b = buildOrder(); const msg = $('#o-msg');
  if (b.err) { msg.textContent = b.err; if (UI.tut && UI.tut.list[UI.tut.i].on === 'confirm') tutSay(/お金/.test(b.err) ? 'お金が足りないみたいだから、「−」で株数を減らすか安い銘柄を選んで、もう一度押してみよう。' : b.err); return; }
  msg.textContent = '';
  const s = sel(), o = b.o, a = asset(), P = G.player;
  const warns = [];
  if (o.mg && o.open && o.side === 'sell') warns.push(`${term('空売り')}は、株価が上がるほど損が増え、損に上限がありません。「ここまで上がったら買い戻す」を先に決めておこう。`);
  if (o.side === 'buy' && !o.mg) {
    const after = ((P.pos[s.code]?.qty || 0) + o.qty) * s.price;
    if (after / a > 0.5) warns.push(`この注文で、資産の${Math.round(after / a * 100)}%が${s.name}1社に集中します。1社に偏ると、悪いニュース1つで大きく損をすることがあります（${term('分散投資')}）。`);
  }
  if (o.type === 'mkt' && G.phase === 'open') { const best = o.side === 'buy' ? book(s).asks[0]?.p : book(s).bids[0]?.p; if (best && Math.abs(b.est - best) / best > 0.003) warns.push(`板が薄いため、平均約${px(Math.round(b.est * 10) / 10)}円と、一番良い値段より不利に約定しそうです（${term('スリッページ')}）。`); }
  if (b.left) warns.push(`板が薄いため、いまの板では約${(o.qty - b.left).toLocaleString()}株しか約定しない見込みです。残りの約${b.left.toLocaleString()}株は取り消されます（成行は、板の深さやストップ高・安の値段までしか約定しません）。`);
  if (G.phase === 'pre' && o.type === 'mkt') warns.push('寄り付き前なので、9:00の寄り付きの値段で約定します。');
  const sideW = o.side === 'buy' ? '買い' : '売り', lab = o.mg ? mSideLabel(o.code, o.side) : '';
  openModal(`<h2>${esc(s.name)}を${o.mg ? `信用で${lab}し` : sideW}ますか？</h2>
    <table class="confirm-tbl">
      <tr><th>注文</th><td>${o.mg ? `信用・${KIND[o.type]}の${lab}` : `${KIND[o.type]}の${sideW}`}</td></tr>
      <tr><th>株数</th><td>${o.qty.toLocaleString()}株</td></tr>
      ${o.type !== 'mkt' ? `<tr><th>${o.type === 'lmt' ? '指値' : '逆指値'}</th><td>${px(o.price)}円</td></tr>` : `<tr><th>値段の目安</th><td>${px(Math.round(b.est * 10) / 10)}円</td></tr>`}
      ${o.mg ? `<tr><th>${b.close ? '返済する金額（目安）' : '建玉の金額（目安）'}</th><td>約${yen(b.gross)}円</td></tr>${!b.close && G.diff !== 'easy' ? `<tr><th>必要な${term('委託保証金', '保証金')}</th><td>約${yen(b.gross * mRate(s))}円</td></tr>` : ''}`
        : `<tr><th>${o.side === 'buy' ? 'この注文で使うお金' : '受け取るお金（目安）'}</th><td>約${yen(o.side === 'buy' ? b.gross + b.fee : b.gross - b.fee)}円</td></tr>`}
      ${b.fee ? `<tr><th>手数料</th><td>${yen(b.fee)}円</td></tr>` : ''}
      <tr><th>株価が1%動くと</th><td>±${yen(o.qty * s.price * 0.01)}円</td></tr>
    </table>
    ${warns.map(w => `<div class="warnbox">${w}</div>`).join('')}
    <div class="actions"><button class="ghost" data-act="cancel">やめる</button><button class="primary ${o.side}" data-act="ok">${o.mg ? lab + 'の' : sideW}注文を出す</button></div>`,
  { cancel: closeModal, ok: () => { closeModal(); placeOrder(b.o); render(); tutEvent('order'); } });
  tutEvent('confirm');
}
function placeOrder(o) {
  const s = byCode(o.code); o.id = ++G.orderSeq;
  if (UI.tut?.list === TUT) (UI.tutOrders ||= []).push(o.id);   // チュートリアル中に出した注文（戻るで取り消せるように覚えておく）
  if (G.phase === 'open') {
    if (o.type === 'mkt') { marketTrade(s, o.side, o.qty, 'mkt', o.mg); return; }
    if (o.type === 'lmt' && ((o.side === 'buy' && o.price >= s.price) || (o.side === 'sell' && o.price <= s.price))) {
      if (marketTrade(s, o.side, o.qty, 'lmt', o.mg)) complete('limit'); return;
    }
  }
  G.player.orders.push(o);
  toast(G.phase === 'pre' && o.type === 'mkt' ? '注文を受け付けました。9:00の寄り付きで約定します' : `${KIND[o.type]}注文を受け付けました（当日限り）`);
}

/* ---------- 日次・最終レポート ---------- */
function dailyReport() {
  const L = G.last, S = SCEN[G.scen], r = rank(), nx = RANKS[r];
  const li = arr => arr.map(([n, c]) => `<li><span>${esc(n)}</span><span class="num ${cls(c)}">${pctS(c)}</span></li>`).join('') || '<li><span class="muted">なし</span></li>';
  openModal(`<h2>${dateLabel(L.date)}の取引終了</h2>
    <p class="muted small">${S.name}　${S.days ? `${G.dayIndex + 1}/${S.days}日目` : `${G.dayIndex + 1}日目`}</p>
    <dl class="rep-grid"><div><dt>総資産</dt><dd>${yen(L.a)}円</dd></div><div><dt>今日の損益</dt><dd class="${cls(L.dayPnl)}">${yenS(L.dayPnl)}円<br><small>${pctS(L.dp)}</small></dd></div><div><dt>${idxName()}</dt><dd>${L.idx.toLocaleString('ja-JP', { maximumFractionDigits: 0 })}<br><small class="${cls(L.ic)}">${pctS(L.ic)}</small></dd></div></dl>
    <div class="movers"><div><h3>値上がり</h3><ul>${li(L.up)}</ul></div><div><h3>値下がり</h3><ul>${li(L.down)}</ul></div></div>
    ${L.events.length ? `<h3>今日のできごと</h3><ul class="ev">${L.events.map(e => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}
    <h3>経験値</h3><p>今日 +${L.xp} XP　／　ランク${r}「${RANKS[r - 1].n}」${nx ? `（次まであと${(nx.xp - profile.xp).toLocaleString()} XP）` : ''}</p>
    <div class="actions"><button class="primary" data-act="next">${G.bankrupt ? '結果を見る' : G.ended ? 'シナリオの結果を見る' : '翌営業日へ'}</button></div>`,
  { next: () => { closeModal(); if (G.ended) finalReport(); else nextDay(); } });
}
// 最後まで遊んだゲームの記録（新しい順。RECORD_MAX 件まで）
const RECORD_MAX = 100;
// 資産と指数の推移（開始=100 の割合）。長いゲームは 120 点までに間引く（最後の点は必ず残す）
function histOf(P) {
  const n = P.hist.length, step = Math.max(1, Math.ceil(n / 120)), idx = [];
  for (let i = 0; i < n; i += step) idx.push(i);
  if (idx.at(-1) !== n - 1) idx.push(n - 1);
  const r2 = v => Math.round(v * 100) / 100;
  return { ha: idx.map(i => r2(P.hist[i].a / P.start * 100)), hi: idx.map(i => r2(P.hist[i].idx / P.startIdx * 100)) };
}
function addRecord(rec) {
  if (UI.practice) return;
  profile.records = [rec].concat(profile.records || []).slice(0, RECORD_MAX);
}
const REC_SORTS = { at: ['日付', x => x.at], r: ['損益率', x => x.r], stars: ['星', x => x.stars], asset: ['最終資産', x => x.asset] };
let recSort = { key: 'at', desc: true };
function showRecords() {
  const f = REC_SORTS[recSort.key][1], sg = recSort.desc ? -1 : 1;
  const L = (profile.records || []).slice().sort((a, b) => sg * (f(a) - f(b)) || b.at - a.at), n = L.length;
  const recName = x => { const S = SCEN[x.scen], D = DIFF[x.diff], d = new Date(x.at); return `${d.getMonth() + 1}/${d.getDate()} ${esc(S ? S.name : x.scen)}・${esc(D ? D.name : x.diff)}${x.fast ? ' ⚡' : ''}`; };
  const starsOf = x => `<span class="rec-stars" aria-label="星${x.stars}つ">${'★'.repeat(x.stars)}${'☆'.repeat(3 - x.stars)}</span>`;
  const row = (x, i) => `<li><button class="rec-row" data-act="rec" data-i="${i}">${starsOf(x)}<span class="rec-main">${recName(x)}<small class="muted">${x.bankrupt ? '破産　' : x.clear ? '' : '未達　'}${yen(x.asset)}円　指数 ${pctS(x.ir)}${x.pt != null ? `　+${x.pt} pt` : ''}${x.sells ? `　売${x.sells}回(勝${x.wins})` : ''}</small></span><span class="num ${cls(x.r)}">${pctS(x.r)}</span></button></li>`;
  // 1件の詳細（結果画面と同じグラフ）
  const detail = x => {
    openModal(`<h2>取引成績</h2><p class="muted small" style="text-align:center">${recName(x)}${x.real ? '' : `　相場の番号 ${x.seed}`}</p>
      <div class="stars-big" aria-label="星${x.stars}つ">${'★'.repeat(x.stars)}${'☆'.repeat(3 - x.stars)}</div>
      <p style="text-align:center">${x.bankrupt ? '破産（総資産が0円以下）' : x.clear ? 'クリア！' : 'クリアならず'}</p>
      <dl class="rep-grid"><div><dt>最終資産</dt><dd>${yen(x.asset)}円</dd></div><div><dt>あなた</dt><dd class="${cls(x.r)}">${pctS(x.r)}</dd></div><div><dt>指数</dt><dd class="${cls(x.ir)}">${pctS(x.ir)}</dd></div></dl>
      ${x.ha ? '<canvas id="final-chart" role="img" aria-label="資産と指数の推移"></canvas>' : ''}
      <p class="muted small">売却${x.sells || 0}回（利益が出たのは${x.wins || 0}回）${x.pt != null ? `　獲得ポイント +${x.pt} pt` : ''}</p>
      <div class="actions"><button class="primary" data-act="back">戻る</button></div>`, { back: showRecords });
    if (x.ha) requestAnimationFrame(() => drawLines($('#final-chart'), null, x));
  };
  const bestR = n ? Math.max(...L.map(x => x.r)) : 0, sells = L.reduce((t, x) => t + (x.sells || 0), 0), wins = L.reduce((t, x) => t + (x.wins || 0), 0);
  openModal(`<h2>取引成績</h2>` + (n ? `<dl class="rep-grid"><div><dt>プレイ回数</dt><dd>${n}回</dd></div><div><dt>最高の損益率</dt><dd class="${cls(bestR)}">${pctS(bestR)}</dd></div><div><dt>売却の勝率</dt><dd>${sells ? Math.round(wins / sells * 100) + '%' : '―'}</dd></div></dl>
    <div class="rec-sort" role="group" aria-label="並べ替え">${Object.entries(REC_SORTS).map(([k, [nm]]) => `<button class="ghost" data-act="sort" data-k="${k}" aria-pressed="${recSort.key === k}">${nm}</button>`).join('')}<button class="ghost" data-act="dir" aria-label="${recSort.desc ? '降順' : '昇順'}">${recSort.desc ? '降順 ▼' : '昇順 ▲'}</button></div>
    <ul class="ev rec-list">${L.map(row).join('')}</ul><p class="muted small">押すと、最終結果のグラフが見られます。最後まで遊んだゲームだけを、新しい順に最大${RECORD_MAX}件まで残します。</p>` : '<p class="muted">まだ取引成績がありません。シナリオを最後まで遊ぶと、ここに残ります。</p>') +
    `<div class="actions"><button class="primary" data-act="close">閉じる</button></div>`, { close: closeModal, rec: b => detail(L[+b.dataset.i]), sort: b => { recSort.key = b.dataset.k; showRecords(); }, dir: () => { recSort.desc = !recSort.desc; showRecords(); } });
}
/* ===== ショップ ===== */
// 最後まで遊んだゲームにポイントを付け、ショップでスタイルやチャートのおまけと交換する。株価と乱数には触れない
// ポイント = (クリア20 + ★1つ10 | クリアならず5) + 指数に勝つ15 + 5回以上売って勝率6割10。難易度と遊んだ日数で倍率。1回 PT_CAP まで
const PT_CAP = 300, PT_DIFF = { easy: 1, normal: 1.5, hard: 2 };
const ptLen = days => days >= 200 ? 2.5 : days >= 50 ? 1.5 : 1;
function gamePoints(x, days) {
  let p = x.clear ? 20 + 10 * x.stars : 5;
  if (x.r > x.ir) p += 15;
  if (x.sells >= 5 && x.wins / x.sells >= 0.6) p += 10;
  return Math.min(PT_CAP, Math.round(p * (PT_DIFF[x.diff] || 1) * ptLen(days)));
}
// 同じ相場をくり返して稼げないように、相場ごとの最高点を覚えておき、上回った分だけ払う。
// リアル相場は終値が番号で変わらないので、番号を入れず相場（G.base）と難易度で数える
const ptKey = () => isReal() ? `real:${G.base}|${G.diff}` : `${G.scen}|${G.diff}|${G.seed}`;
function payPoints(rec) {
  if (UI.practice) return null;
  const pts = gamePoints(rec, G.player.hist.length), k = ptKey(), prev = profile.pbest[k] || 0, got = Math.max(0, pts - prev);
  if (got) { profile.pbest[k] = pts; profile.points += got; }
  return { pts, got, prev };
}
// skin = スタイル（<html data-skin>。色は style.css の末尾）、opt = チャートのおまけ（買ったあとオン・オフできる）
const SHOP = [
  { id: 'skin-fuji', kind: 'skin', skin: 'fuji', name: 'パープル', price: 150, desc: '上品で落ち着いた紫色です。' },
  { id: 'skin-sora', kind: 'skin', skin: 'sora', name: 'ティール', price: 150, desc: '海のような、すっきりした青緑色です。' },
  { id: 'skin-moegi', kind: 'skin', skin: 'moegi', name: 'グリーン', price: 150, desc: '若葉のような、明るくさわやかな緑色です。' },
  { id: 'skin-peach', kind: 'skin', skin: 'peach', name: 'ピーチ', price: 150, desc: '桃の花のような、やわらかいピンク色です。' },
  { id: 'skin-yellow', kind: 'skin', skin: 'yellow', name: 'イエロー', price: 150, desc: 'ひまわりのような、明るくあざやかな黄色です。' },
  { id: 'skin-red', kind: 'skin', skin: 'red', name: 'レッド', price: 150, desc: 'りんごのような、あざやかな赤色です。' },
  { id: 'skin-sumi', kind: 'skin', skin: 'sumi', name: 'モノクロ', price: 150, desc: '色を抑えた、落ち着いた墨色です。' },
  { id: 'skin-black', kind: 'skin', skin: 'black', name: 'ブラック', price: 150, desc: '背景まで真っ黒の、引きしまった黒です。' },
  { id: 'bgm2', kind: 'bgm', file: 'Aseet/kabutore_bgm2.mp3', name: 'Bright Noon Brew', price: 200, desc: '昼の光のような、明るくのびやかなBGMです。' },
  { id: 'bgm3', kind: 'bgm', file: 'Aseet/kabutore_bgm3.mp3', name: 'Market Warmth', price: 200, desc: '市場のにぎわいのような、あたたかいBGMです。' },
  { id: 'bb', kind: 'opt', name: 'ボリンジャーバンド', price: 300, desc: 'チャートに、20本の移動平均の上下±2σの帯を引きます。値動きの広がりが見えます。' },
  { id: 'ha', kind: 'opt', name: '平均足', price: 400, desc: 'ローソク足を平均足で描きます。上げ・下げの流れが続いているかが見やすくなります（数字の表示は本来の値のまま）。' },
];
const SKIN_BASE = { id: '', kind: 'skin', skin: '', name: 'ブルー', price: 0, desc: 'はじめからの、くっきりした青色です。' };
const BGM_BASE = { id: 'bgm-base', kind: 'bgm', file: 'Aseet/kabutore_bgm.mp3', name: 'Sunny Afternoon Brew', price: 0, desc: 'はじめからある、午後の日ざしのようなBGMです。' };
const owns = id => !id || id === BGM_BASE.id || !!profile.owned[id];
const optOn = id => owns(id) && !!profile.opts[id];
function applySkin() { const k = SHOP.some(x => x.skin === profile.skin && owns(x.id)) ? profile.skin : ''; if (k) document.documentElement.dataset.skin = k; else delete document.documentElement.dataset.skin; }
// 使うBGM。持っていないものは初期のBGMに戻す。ゲーム中に切り替わったときは、流れていれば続けて鳴らす
function applyBgm() {
  const x = SHOP.find(y => y.kind === 'bgm' && y.id === profile.bgm && owns(y.id)) || BGM_BASE;
  if (bgm.getAttribute('src') === x.file) return;
  const playing = !bgm.paused;
  bgm.src = x.file;
  if (playing) playBgm();
}
// 試聴：BGM とは別の <audio> で鳴らす。ひとつだけ鳴らし、もう一度押すか、ショップを閉じる・買う・使うで止める
const bgmPrev = new Audio(); let prevId = '';
// 再生ボタン（三角だけ）。鳴っているあいだは四角（停止）
const playBtn = (id, on = false) => `<button class="shop-play" data-act="prev" data-id="${id}" aria-label="${on ? '試聴を止める' : '試聴する'}"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">${on ? '<rect x="6" y="6" width="12" height="12" rx="1.5"/>' : '<path d="M8 5v14l11-7z"/>'}</svg></button>`;
const noteIcon = '<svg class="shop-note" viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M9 3v11.3A3.5 3.5 0 1 0 11 17.5V8h7V3z"/></svg>';
const resetPlayBtns = () => document.querySelectorAll('[data-act=prev]').forEach(e => e.replaceWith(Object.assign(document.createElement('div'), { innerHTML: playBtn(e.dataset.id) }).firstChild));
function stopPreview() { bgmPrev.pause(); prevId = ''; }
bgmPrev.addEventListener('ended', () => { prevId = ''; resetPlayBtns(); });
let shopAll = false;   // スタイルを全部出しているか
function showShop() {
  stopPreview();
  const pt = profile.points;
  const item = x => {
    const have = owns(x.id), skin = x.kind === 'skin';
    let btn;
    if (!have) btn = pt >= x.price ? `<button class="primary" data-act="buy" data-id="${x.id}">${x.price} pt で買う</button>` : `<button class="ghost" disabled>${x.price} pt（あと${x.price - pt}）</button>`;
    else if (x.kind === 'bgm') btn = (profile.bgm || BGM_BASE.id) === x.id ? '<span class="shop-on">使用中</span>' : `<button class="ghost" data-act="use" data-id="${x.id}">使う</button>`;
    else if (x.kind === 'skin') btn = (profile.skin || '') === x.skin ? '<span class="shop-on">使用中</span>' : `<button class="ghost" data-act="use" data-id="${x.id}">使う</button>`;
    else btn = `<button class="ghost shop-toggle${optOn(x.id) ? ' on' : ''}" data-act="opt" data-id="${x.id}" role="switch" aria-checked="${optOn(x.id)}">${optOn(x.id) ? 'オン' : 'オフ'}</button>`;
    if (x.kind === 'bgm') btn = playBtn(x.id) + `<span class="shop-act">${btn}</span>`;
    return `<li class="shop-item${x.kind === 'bgm' ? ' shop-bgm' : ''}">${x.kind === 'bgm' ? noteIcon : ''}<div class="shop-main">${skin ? `<span class="shop-head"><i class="shop-sw" data-skin-sw="${x.skin || 'base'}"></i><b>${x.name}</b></span>` : `<b>${x.name}</b>`}<small class="muted">${x.desc}</small></div><div class="shop-btn">${btn}</div></li>`;
  };
  const byId = id => id === BGM_BASE.id ? BGM_BASE : id ? SHOP.find(x => x.id === id) : SKIN_BASE;
  const skins = [SKIN_BASE, ...SHOP.filter(x => x.kind === 'skin')];
  openModal(`<h2>ショップ</h2><p class="pt-bal">所持ポイント <b class="num">${pt.toLocaleString()} pt</b></p>
    <h3>スタイル</h3><ul class="shop-list shop-grid${shopAll ? '' : ' fold'}">${skins.map(item).join('')}</ul>
    <div class="shop-more"><button class="ghost" data-act="all" aria-expanded="${shopAll}">${shopAll ? 'たたむ' : `すべて表示（${skins.length}個）`}</button></div>
    <h3>チャート</h3><ul class="shop-list">${SHOP.filter(x => x.kind === 'opt').map(item).join('')}</ul>
    <h3>BGM</h3><ul class="shop-list">${[BGM_BASE, ...SHOP.filter(x => x.kind === 'bgm')].map(item).join('')}</ul>
    <p class="muted small">ポイントは、シナリオを最後まで遊ぶともらえます。クリアで20 pt＋★1つにつき10 pt（クリアならずは5 pt）、指数に勝つと＋15 pt、5回以上売って6割以上利益が出ると＋10 pt。難易度（ふつう×1.5・本格×2）と遊んだ日数（50日以上×1.5・200日以上×2.5）で増えます（1回${PT_CAP} ptまで）。同じ相場をもう一度遊んだときは、その相場の最高点を上回った分だけもらえます。データのリセットで、ポイントと買ったものも消えます。</p>
    <div class="actions"><button class="primary" data-act="close">閉じる</button></div>`,
  { prev: b => {
      const x = byId(b.dataset.id); if (!x || x.kind !== 'bgm') return;
      const was = prevId; stopPreview();
      resetPlayBtns();
      if (was === x.id) return;
      bgmPrev.src = x.file; bgmPrev.muted = muted; bgmPrev.volume = 0.4; bgmPrev.currentTime = 0; prevId = x.id;
      const nb = document.querySelector(`[data-act=prev][data-id="${x.id}"]`); if (nb) nb.outerHTML = playBtn(x.id, true);
      bgmPrev.play().catch(() => {});
    },
    all: () => { shopAll = !shopAll; showShop(); },
    close: () => { closeModal(); const t = $('#t-pt'); if (t) t.textContent = `${profile.points.toLocaleString()} pt`; },
    buy: b => { const x = byId(b.dataset.id); if (!x || owns(x.id) || profile.points < x.price) return; profile.points -= x.price; profile.owned[x.id] = true; if (x.kind === 'skin') profile.skin = x.skin; else if (x.kind === 'bgm') profile.bgm = x.id; else profile.opts[x.id] = true; saveProfile(); applySkin(); applyBgm(); toast(`${x.name}を買いました`); showShop(); },
    use: b => { const x = byId(b.dataset.id); if (!x || !owns(x.id)) return; if (x.kind === 'bgm') { profile.bgm = x.id === BGM_BASE.id ? '' : x.id; applyBgm(); } else { profile.skin = x.skin; applySkin(); } saveProfile(); showShop(); },
    opt: b => { const x = byId(b.dataset.id); if (!x || !owns(x.id)) return; profile.opts[x.id] = !profile.opts[x.id]; saveProfile(); showShop(); } });
  // たたんでいるときは、2段目の真ん中あたりで見えなくする（見えない分のボタンは押せないようにする）
  const grid = $('#modal-card .shop-grid.fold'), its = grid ? [...grid.children] : [];
  const r2 = its.find(x => x.offsetTop > (its[0]?.offsetTop ?? 0));
  if (r2) {
    const top = grid.getBoundingClientRect().top, cut = r2.getBoundingClientRect().top - top + r2.offsetHeight / 2;
    grid.style.maxHeight = cut + 'px';
    its.forEach(x => { if (x.getBoundingClientRect().top - top >= cut) x.inert = true; });
  } else if (grid) grid.classList.remove('fold');
}
function finalReport() {
  const P = G.player, S = SCEN[G.scen], a = asset();
  const r = a / P.start - 1, ir = G.market.idx / P.startIdx - 1;
  const bk = !!G.bankrupt, clear = !bk && (S.clear ? S.clear(r, ir) : true);
  let stars = 0; if (clear) { stars = 1; if (P.maxDD < 0.15) stars = 2; if (P.maxDD < 0.08 && r - ir >= 0.05) stars = 3; }
  profile.best[G.scen] = Math.max(profile.best[G.scen] || 0, stars);
  const rec = { ...histOf(P), scen: G.scen, diff: G.diff, seed: G.seed, real: isReal(), fast: isFast(), at: Date.now(), ...(bk ? { bankrupt: true } : {}), start: P.start, asset: a, r, ir, stars, clear, sells: P.sells.length, wins: P.sells.filter(x => x.pnl > 0).length };
  const pay = bk ? null : payPoints(rec);   // 破産はポイントなし
  if (bk) rec.pt = 0;
  if (pay) rec.pt = pay.got;   // 取引成績にも、このゲームでもらったポイントを残す
  addRecord(rec);
  saveProfile();
  const sells = P.sells.slice();
  const best = sells.length ? sells.reduce((x, y) => (y.pnl > x.pnl ? y : x)) : null;
  const worst = sells.length ? sells.reduce((x, y) => (y.pnl < x.pnl ? y : x)) : null;
  const adv = [];
  if (best && best.pnl > 0) adv.push(`一番うまくいった取引は${best.name}${best.dl ? '（上場廃止）' : ''}（${yenS(best.pnl)}円、${pctS(best.pct)}）。そのとき出ていたニュースをチャートのピンで見直してみよう。`);
  if (worst && worst.pnl < 0) {
    const cut = worst.buyAvg * worst.qty * 0.05;
    adv.push(`一番損した取引は${worst.name}${worst.dl ? '（上場廃止で決済）' : ''}（${yenS(worst.pnl)}円、${pctS(worst.pct)}）。` + (worst.pct < -0.05 ? `−5%で${term('損切り')}していれば、損は約${yen(cut)}円で済み、約${yen(-worst.pnl - cut)}円減らせました。` : '損を小さく抑えられています。'));
  }
  if (!sells.length) adv.push('一度も株を売りませんでした。利益や損失は、売って初めて確定します。');
  if (bk) adv.unshift(...bankruptCauses(P));
  if (!bk) adv.push(`指数（${idxName()}）を買って持っていただけなら ${pctS(ir)}。あなたは ${pctS(r)}。${r > ir ? '指数に勝ちました。これは本物の投資でも簡単ではありません。' : '指数に勝つのは、プロでも難しいことです。'}`);
  adv.push(`${term('最大ドローダウン')}は${(Math.min(1, P.maxDD) * 100).toFixed(1)}%でした。${P.maxDD > 0.15 ? '大きく減った時期がありました。1社への集中を減らすと、落ち込みを小さくできます。' : 'リスクをうまく抑えられています。'}`);
  G.ended = true; clearSave();
  openModal(`<h2>${S.name}　${bk ? '破産' : '結果'}</h2>
    <div class="stars-big" aria-label="星${stars}つ">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
    <p style="text-align:center">${bk ? '総資産が0円以下になり、ゲームが終わりました' : `${clear ? 'クリア！' : 'クリアならず'}　目標：${S.goal}`}</p>
    ${bk ? '<p class="pt-get"><b class="num">+0 pt</b>　破産のときは、ポイントはもらえません</p>' : ''}
    ${pay ? `<p class="pt-get"><b class="num">+${pay.got} pt</b>　所持 ${profile.points.toLocaleString()} pt${pay.prev ? `<small class="muted">${pay.got ? `この相場の前の最高 ${pay.prev} pt → ${pay.pts} pt。上回った分だけもらえます` : `この相場の最高 ${pay.prev} pt を超えなかったので、今回は 0 pt です（今回 ${pay.pts} pt）`}</small>` : ''}</p>` : ''}
    <dl class="rep-grid"><div><dt>最終資産</dt><dd>${yen(a)}円</dd></div><div><dt>あなた</dt><dd class="${cls(r)}">${pctS(r)}</dd></div><div><dt>指数</dt><dd class="${cls(ir)}">${pctS(ir)}</dd></div></dl>
    <div class="sensei result-sensei">${SENSEI_SVG}<div><b class="who">カブ先生</b><div class="bubble">${esc(senseiAdvice({ r, ir, clear, stars, P, bk }))}</div></div></div>
    <canvas id="final-chart" role="img" aria-label="資産と指数の推移"></canvas>
    <h3>振り返り</h3><ul class="ev">${adv.map(x => `<li>${x}</li>`).join('')}</ul>
    <p class="muted small">${isReal() ? `株価は${REAL_SETS[REAL_KEY].period}の実際の終値です（日中の動きはゲームが作ったもの）。過去の値動きは将来を保証しません。` : 'このゲームの株価と企業はすべて架空です。'}実際の投資では、元本を割り込む（損をする）可能性があります。</p>
    <div class="actions"><button class="primary" data-act="title">タイトルへ</button></div>`,
  { title: () => { closeModal(); showTitle(); } });
  requestAnimationFrame(() => drawLines($('#final-chart'), P.hist));
}

/* ---------- チュートリアル（カブ先生が案内。言われた操作をすると次へ進む） ---------- */
// at = 光らせる場所、on = 次へ進む操作（tutEvent の名前）、ok = 値の条件、btn = ボタンで進む、done = 満たしたら自動で進む、back = 対象が消えたら戻る番号
const TUT = [
  { t: 'やあ、カブ先生だよ！これから1か月、ボクと一緒に株の売り買いを覚えていこう。', btn: 'よろしく！' },
  { t: 'まずは銘柄リストから、気になる会社をタップしてみよう。', at: '#stock-list', on: 'select', view: 'trade' },
  { t: '「日足」を押すと、これまでの毎日の値動きが見られるよ。', at: '[data-cm="1d"]', on: 'cm', ok: v => v === '1d', view: 'trade' },
  { t: '赤い足は値上がり、緑は値下がりの日で、チャートはドラッグで動かせるからやってみよう。', at: '.chart-wrap', on: 'drag', view: 'trade' },
  { t: '点線の付いた言葉はタップすると意味が出るから、押して読んだら画面のどこかをタップして閉じよう。', at: '.a-order .lab .term', on: 'termclose', view: 'trade' },
  { t: '株は100株単位で買うから、「＋」か「−」で株数を決めよう。', at: '.stepper', on: 'qty', view: 'trade' },
  { t: '株数を決めたら、このボタンで注文の内容を確認しよう。', at: '#o-submit', on: 'confirm', view: 'trade' },
  { t: '使うお金を確かめたら「注文を出す」を押そう、朝の注文は9:00の取引開始で約定するよ。', at: '#modal-card [data-act="ok"]', on: 'order', back: 6 },
  { t: '上の「×1」を押すと時間が進み、×2や×4なら早送りできるよ。', at: '.speed', on: 'speed', ok: v => v > 0 },
  { t: '待たなくても、「9:00まで進める」を押せば一気に取引開始まで進めるよ。', at: '#skip-btn', on: 'skip' },
  { t: '買えたね！ニュースが出ると株価が動き、★が多いほど確かな情報だよ。', at: '.a-news', btn: 'なるほど', view: 'trade', enter: () => { G.speed = 0; renderHeader(); } },
  { t: '上の総資産が増えればキミの勝ちで、今日の損益もここでわかるよ。', at: '.stats', btn: 'わかった' },
  { t: '下の「保有株」を押して、買った株がいま得か損かを見てみよう。', at: '[data-view="hold"]', on: 'view', ok: v => v === 'hold' },
  { t: '確認できたら「取引」に戻ろう。', at: '[data-view="trade"]', on: 'view', ok: v => v === 'trade' },
  { t: '売るときは「売る」に切り替えて、買うときと同じ手順で注文するよ。', at: '[data-side="sell"]', on: 'side', ok: v => v === 'sell', view: 'trade' },
  { t: 'カギの付いた注文はランクが上がると使えるから、押して条件を見てみよう。', at: '#o-types .locked', on: 'locked', view: 'trade', done: () => !$('#o-types .locked') },
  { t: '「ミッション」をこなすと経験値がたまってランクが上がるよ、のぞいてみよう。', at: '[data-view="mission"]', on: 'view', ok: v => v === 'mission' },
  { t: '「決算・配当」では、株価が大きく動く決算の日と配当の予定がわかるよ。', at: '[data-view="cal"]', on: 'view', ok: v => v === 'cal' },
  { t: '困ったときは「ヒント」でコツや用語を調べられるよ。', at: '[data-view="hint"]', on: 'view', ok: v => v === 'hint' },
  { t: '1日の終わりにはまとめが出るから、それを見ながら1か月がんばろう、いってらっしゃい！', btn: 'はじめる！', enter: () => switchView('trade') },
];
// 信用取引のミニ講座（注文パネルの「？」から）。むずかしい言葉は使わず、操作しながら進む（on = 進む操作、btn = ボタンで進む）。
// 後半は練習用のお金で本当に売り買いし、終わったとき・スキップしたときに練習の前の状態へ戻す（practiceStart / practiceEnd）
const MTUT = [
  { t: '信用取引を、いっしょに覚えよう！', btn: 'おねがい！', view: 'trade' },
  { t: '信用取引は、証券会社からお金や株を借りて、売り買いするしくみだよ。', btn: 'ふむふむ' },
  { t: '借りられるから、預けたお金の約3倍の金額まで取引できるんだ。たとえば9万円で、30万円分の株を買えるよ。', btn: 'すごい！' },
  { t: 'そのかわり、もうけも損も、約3倍になるよ。ここが大事！', btn: 'きをつける' },
  { t: '信用取引は、「始める」と「終わらせる」の2回で1セットだよ。始めるのを「新規」、終わらせるのを「返済」というんだ。', btn: 'うん' },
  { t: '終わらせるまでは、もうけも損も、まだ決まっていないよ。', btn: 'そっか' },
  { t: '上がりそうな株は、「買い」から始めるよ。買って、あとで売って終わらせるんだ。', btn: 'なるほど' },
  { t: '下がりそうな株は、「売り」から始められるよ。先に売って、あとで買い戻して終わらせるんだ。これを「空売り」というよ。', btn: 'へえ！' },
  { t: '損が大きくなると、「お金を足してね」と言われることもあるよ。くわしくは、練習のなかで見ていこうね。', btn: 'わかった' },
  { id: 'ps', pstart: true, t: 'では、練習用のお金で、実際にやってみよう。終わったら全部元に戻るから安心してね。', btn: 'はじめる', enter: () => practiceStart() },
  { t: 'ここが「信用」になっていると、信用取引だよ。「現物」は、ふつうの売り買いだよ。', at: '#o-acct', btn: 'わかった' },
  { t: '「新規買い」を押そう。さっきの「買いから始める」だよ。', enter: () => { UI.side = 'sell'; renderOrderPanel(); }, at: '.a-order .side', on: 'side', ok: v => v === 'buy' },
  { t: '株数は100株にしておいたよ。', at: '.stepper', btn: 'OK', enter: () => { $('#o-qty').value = 100; renderOrderPanel(); } },
  { t: 'ここの「概算金額」が、この注文で売り買いする金額だよ。預けるお金は、その約3割で足りるんだ。', at: '#o-est', btn: 'ふむふむ' },
  { id: 'c1', t: '「確認」ボタンを押そう。', at: '#o-submit', on: 'confirm' },
  { t: '「新規買いの注文を出す」を押そう。', at: '#modal-card [data-act="ok"]', on: 'order', backTo: 'c1' },
  { id: 'lv1', t: '買えたね！「建玉」に、信用で買った株が出ているよ。', at: '#o-est', btn: 'やった！' },
  { t: '「評価損益」は、いま終わらせたら出る、もうけや損だよ。', at: '#o-est', btn: 'ふむふむ' },
  { t: '「維持率」は、預けたお金の余裕メーターだよ。バーが短いほど危ないよ。', at: '#o-est', btn: 'うん' },
  { t: 'では、値段が上がったとするね。', btn: '上がれ！' },
  { id: 'lv2', t: 'もうけが出たね！でも、終わらせるまでは、まだ決まっていないよ。', at: '#o-est', btn: 'そっか', enter: () => practiceMove('up', 1.04) },
  { t: '右のボタンが「返済売り」に変わったね。「返済」は、信用取引を終わらせることだよ。', at: '.a-order .side', btn: 'うん' },
  { t: '「返済売り」を押そう。買った株を売って、終わらせるよ。', enter: () => { UI.side = 'buy'; renderOrderPanel(); }, at: '.a-order .side', on: 'side', ok: v => v === 'sell' },
  { t: '株数は、持っている100株にしておいたよ。', at: '.stepper', btn: 'OK', enter: () => { $('#o-qty').value = 100; renderOrderPanel(); } },
  { id: 'c2', t: '「確認」ボタンを押そう。', at: '#o-submit', on: 'confirm' },
  { t: '「返済売りの注文を出す」を押そう。', at: '#modal-card [data-act="ok"]', on: 'order', backTo: 'c2' },
  { id: 'lv3', t: '終わらせたね！もうけが現金に入ったよ。', at: '.a-order .p-head', btn: 'やった！' },
  { t: '次は反対。「新規売り」を押そう。持っていない株を借りて、先に売るよ。これを「空売り」というんだ。', enter: () => { UI.side = 'buy'; renderOrderPanel(); }, at: '.a-order .side', on: 'side', ok: v => v === 'sell' },
  { t: '株数は100株にしておいたよ。', at: '.stepper', btn: 'OK', enter: () => { $('#o-qty').value = 100; renderOrderPanel(); } },
  { id: 'c3', t: '「確認」ボタンを押そう。', at: '#o-submit', on: 'confirm' },
  { t: '「新規売りの注文を出す」を押そう。', at: '#modal-card [data-act="ok"]', on: 'order', backTo: 'c3' },
  { id: 'lv4', t: '売れたね！「建玉」が「売り建て」になったよ。', at: '#o-est', btn: 'やった！' },
  { t: '空売りは、値段が下がるともうけになるよ。下がったとするね。', btn: '下がれ！' },
  { id: 'lv5', t: 'もうけが出たね！反対に上がると、上がった分だけ損になるよ。', at: '#o-est', btn: 'なるほど', enter: () => practiceMove('down', 0.96) },
  { t: '終わらせるのは、「保有株」からもできるよ。押してみよう。', at: '[data-view="hold"]', on: 'view', ok: v => v === 'hold' },
  { t: 'ここに、信用で持っている株の一覧が出るよ。', at: '#m-sec', btn: 'ふむふむ' },
  { t: '余裕メーターの縦の線（20%の目印）より短いまま1日が終わると、「お金を足してね」と言われるよ。これを「追証」というんだ。', at: '#m-sec .mrow', btn: 'こわい…' },
  { t: '次の日の終わりまでに、余裕メーターを20%以上に戻せないと、信用で持っている株が全部、自動で終わらされちゃうよ。ふつうに買った株は、そのままだよ。', at: '#m-sec .mrow', btn: 'きをつける' },
  { t: '余裕メーターを20%以上に戻すには、信用の株を一部終わらせて減らすか、ふつうの株を売ってお金を増やすよ。', at: '#m-sec .mrow', btn: 'なるほど' },
  { t: '「期限」は6か月後。過ぎると自動で終わるよ。借りているあいだは、少しずつ利息もかかるよ。', at: '#m-sec .tbl-wrap', btn: 'わかった' },
  { t: '「返済」を押そう。終わらせる注文を、自動で用意してくれるよ。', at: '#m-sec [data-mclose]', on: 'mclose' },
  { t: '「返済買い」が選ばれたね。借りた株を買い戻して返す注文だよ。', at: '.a-order .side', btn: 'うん' },
  { t: '空売りは、上がるほど損が増えるよ。「逆指値」なら「ここまで上がったら買い戻す」と決めておけるよ。', at: '#o-types', btn: 'べんり！' },
  { id: 'c4', t: '「確認」ボタンを押そう。', at: '#o-submit', on: 'confirm' },
  { t: '「返済買いの注文を出す」を押そう。', at: '#modal-card [data-act="ok"]', on: 'order', backTo: 'c4' },
  { id: 'lv6', t: '終わらせたね！これで、買いと売りの両方を体験できたよ。', at: '.a-order .p-head', btn: 'やった！' },
  { t: '信用はたくさん取引できるぶん、損も大きくなるよ。最初は少しの株数から始めよう。', at: '#o-acct', btn: 'わかった' },
  { t: '練習はおしまい！お金や株は元に戻すね。わからなくなったら「？」を押してね。', btn: 'ありがとう！' },
];
// 板（気配）のミニ講座（板の「？」から）。売買はしない。also = 光らせる場所を増やす（各要素は、まとめて1つの枠で囲うセレクタの配列）
const BTUT = [
  { t: '板（気配）を、いっしょに見てみよう！', btn: 'おねがい！', view: 'trade' },
  { t: '板は、「この値段で売りたい」「この値段で買いたい」という注文を、値段ごとに並べた表だよ。', at: '.a-board', btn: 'ふむふむ' },
  { t: '真ん中が「値段」。左が「売りたい株数」、右が「買いたい株数」だよ。', at: '.board thead', btn: 'うん' },
  { t: '上のほうは、売りたい人の注文。今の値段より高い値段で待っているよ。上に行くほど高くなるんだ。', at: '.board td.qa', btn: 'なるほど' },
  { t: '下のほうは、買いたい人の注文。今の値段以下で待っているよ。下に行くほど安くなるんだ。', at: '.board td.qb', btn: 'へえ！' },
  { t: '色がついた行が、今の値段だよ。売りの一番下と、買いの一番上が、いま取引が成立しやすい値段（最良気配）なんだ。', at: '.board tr.cur', btn: 'わかった' },
  { t: '「成行」で買うと、売りの一番安いところから順に買っていくよ。そこの株数が足りないと、次に高い値段へ進むんだ。', at: '.board td.qa.best', btn: 'ふむふむ' },
  { t: '数字が小さい（注文が少ない）板を「薄い板」というよ。たくさん買うと、高い値段まで進んでしまうから気をつけてね。', at: '.board', btn: 'きをつける' },
  { t: '板の数字は、1分ごとに入れ替わるんだ。値段が動くと、色がついた行も上下に動くよ。だから、注文を出す直前に板を見るのがコツだよ。', at: '.board', btn: 'なるほど' },
  { t: '次は、板の使い道を試そう。まず、100株を成行で買うとするよ。「値段の目安」は、今の値段とほとんど同じだよね。', at: '#o-cur', also: [['#o-est dt:first-of-type', '#o-est dd:first-of-type']], btn: 'うん',
    enter: () => { UI.type = 'mkt'; UI.side = 'buy'; $('#o-qty').value = lot(sel()); renderOrderPanel(); } },
  { t: '株数を大きくしたよ。「値段の目安」が高くなったね。売りの注文を、安いほうから順に食べていくからだよ。板を見ると、注文の前に「いくらで買えるか」がわかるんだ。', at: '#o-cur', also: [['#o-est dt:first-of-type', '#o-est dd:first-of-type']], btn: 'へえ！',
    enter: () => { const s = sel(), L = lot(s); $('#o-qty').value = Math.max(L, Math.round(s.minVol * 40 / L) * L); renderOrderPanel(); } },
  { t: '板が薄いときは、「成行」より「指値」がおすすめ。成行の確認画面にも、「板が薄いよ」と注意が出るんだ。', at: '.board', btn: 'ふむふむ' },
  { t: '板の値段を押すと、「指値」の値段に入るよ。色がついた行の値段を押してみよう。', at: '.board tr.cur button', on: 'px' },
  { t: '注文のところに、押した値段が入ったよ。「この値段で買いたい」を、板を見ながら決められるんだ。', at: '#o-price-field', btn: 'べんり！' },
  { t: '安く買いたいときは、今の値段より下の値段を押して指値にしよう。値段が下がってくるまで待つよ。ただし、下がらなければ買えないし、注文はその日だけだよ。', at: '.board td.qb', btn: 'なるほど' },
  { t: 'すぐ買いたいときは、今の値段以上の指値にするとすぐ買えるよ。売るときは反対で、高く売りたいなら今より上、すぐ売りたいなら今の値段以下にするんだ。', at: '.board td.qa.best', btn: 'へえ！' },
  { t: 'たくさん買う（売る）ときは、1回で全部ではなく、何回かに分けよう。大きな注文は、自分の注文で値段が動いてしまうことがあるよ。', btn: 'わかった' },
  { t: 'ただし、板の形だけで、これから上がるか下がるかはわからないよ。現実の板でも、注文は直前に取り消せるから、見せかけの注文もあるんだ。このゲームの板も同じで、注文を出すときの目安にしようね。', at: '.board', btn: 'はーい' },
  { t: '板の使い方はここまで。ところで、板を見ていると、売りか買いのどちらかの列が、まるごと空っぽになることがあるんだ。', at: '.board', btn: 'えっ？' },
  { t: 'それが「特別気配」だよ。買いたい人と売りたい人が大きく偏って、釣り合う値段がなかなか決まらない状態のことなんだ。どうして起きるのか、見ていこう。', at: '.board', btn: 'ふむふむ' },
  { t: 'たとえば、買いたい人がものすごく多いと、売りの注文がなくなって、値段がどんどん上がるよ。1日に動ける上限（値幅制限）まで来た状態が「ストップ高」だよ。', at: '#c-price', btn: 'ふむふむ' },
  { t: 'ストップ高になると、板の売りの列が空っぽになって、「売り注文なし（特別気配）」と出るよ。反対に、売りたい人が多すぎるストップ安では、買いの列が空っぽになるんだ。', at: '.board-note', btn: 'なるほど' },
  { t: '空っぽの側には相手がいないから、取引が成立しないよ。ストップ高では成行の買い、ストップ安では成行の売りが、約定しなくなるんだ。', at: '.board-note', btn: 'こわい…' },
  { t: 'ストップ安のときは、売りたくても売れないよ。「ここまで下がったら売る」の逆指値も、約定しないことがあるんだ。前の日までに、持ちすぎないようにしよう。', btn: 'きをつける' },
  { t: 'ストップ高や安は、銘柄リストの「S高」「S安」と、チャートの値段のところで見つけられるよ。飛びつく前に、板も見ようね。', at: '#c-price', btn: 'わかった' },
  { t: 'ストップ高や安のような変化も、板を見ていれば先に気づけるよ。ここまでの話をまとめると、板を見るメリットは3つあるんだ。', btn: 'まとめて！' },
  { t: 'メリット①。注文を出す前に、「いくらで・どれだけ買える（売れる）か」がわかるよ。', at: '.board', btn: 'ふむふむ' },
  { t: 'メリット②。指値の値段を、板を見ながら決められるよ。すぐ買いたいのか、安く買いたいのかで、使い分けよう。', at: '#o-price-field', btn: 'うん', enter: () => { UI.type = 'lmt'; renderOrderPanel(); } },
  { t: 'メリット③。薄い板や、特別気配（ストップ高・安）のような、いつもと違う状態に先に気づけるよ。', at: '.board', btn: 'なるほど' },
  { t: 'おしまい！わからなくなったら、また「？」を押してね。', btn: 'ありがとう！' },
];
// 銘柄の数字（チャートの下の枠）のミニ講座（銘柄名の横の「？」から）。売買はしない。skip = 今は出ない数字の説明は飛ばす
const FTUT = [
  { t: 'チャートの下の枠にある数字を、いっしょに見てみよう！どれも「この株を買っていいか」を考えるヒントになるよ。', at: '.facts', btn: 'おねがい！', view: 'trade' },
  { t: '「時価総額」は、会社の大きさだよ。株の値段 × 発行している株の数で決まるんだ。大きい会社は、値動きが比べてゆるやかなことが多いよ。', at: '.facts .fx-cap', btn: 'ふむふむ', skip: () => isReal() },
  { t: '「配当利回り」は、1年にもらえる配当が、いまの株の値段の何%かを表すよ。たとえば3%なら、10万円ぶん持っていると年に約3,000円もらえる計算だよ。高いほどおトクに見えるけど、株価が下がって高くなっているだけのこともあるから注意してね。', at: '.facts .fx-div', btn: 'なるほど', skip: () => isReal() || !divOn() },
  { t: '「PBR」は、株の値段が、会社の持っている財産（純資産）の何倍かを表すよ。1倍なら、財産とちょうど同じ値段。1倍より小さいと「割安」と言われるけど、あまり儲かっていない会社だから安いこともあるんだ。', at: '.facts .fx-pbr', btn: 'わかった', skip: () => isReal() },
  { t: '「PER」は、株の値段が、1株あたりの利益の何倍かを表すよ。10倍なら、いまの利益が続くと、10年で元が取れるイメージ。低いと割安、高いと「これから伸びる」と期待されているサインだよ。赤字の会社は計算できないので「—」になるんだ。', at: '.facts .fx-per', btn: 'へえ！', skip: () => isReal() },
  { t: 'PBRもPERも、業種によって普通の高さがちがうよ。同じ業種の銘柄どうしで比べるのがコツ。安いから買い、と決めつけないでね。', at: '.facts', btn: 'きをつける', skip: () => isReal() },
  { t: '「出来高」は、今日これまでに売り買いされた株の数だよ。多いほど人気があって、売りたいときに売りやすい。少ないと「薄い」状態で、成行で注文すると値段が動きやすいよ。板の数字とあわせて見よう。', at: '.facts .fx-vol', btn: 'ふむふむ' },
  { t: '値段が大きく動いたとき、出来高も増えていれば、たくさんの人が参加した動きなので信頼しやすいよ。出来高が少ないのに動いたときは、一時的かもしれないね。', at: '.facts .fx-vol', btn: 'なるほど' },
  { t: '「値幅制限」は、今日1日で動ける値段の範囲だよ。上の端まで来るとストップ高、下の端ならストップ安。会社が急に大きなニュースを出したときの、動きすぎ防止なんだ。', at: '.facts .fx-lim', btn: 'わかった' },
  { t: '「始値／高値／安値」は、今日の最初の値段・いちばん高かった値段・いちばん安かった値段だよ。取引が始まる前は「—」。いまの値段が、今日の高いほうか安いほうかがわかるよ。', at: '.facts .fx-ohl', btn: 'ふむふむ' },
  { t: '「次の決算」は、会社が成績を発表する日と、予想されている1株あたりの利益だよ。発表で予想より良いか悪いかで、株が大きく動くから、持ちこしには注意しようね。', at: '.facts .fx-earn', btn: 'きをつける', skip: () => isReal() || rank() < 4 },
  { t: '「RSI」は、最近の14日間で、買われすぎか売られすぎかを0〜100で表すよ。70以上だと買われすぎ（下がるかも）、30以下だと売られすぎ（上がるかも）の目安。ただし、強い上昇のときは70以上のまま上がり続けることもあるよ。', at: '.facts .fx-rsi', btn: 'ふむふむ', skip: () => rank() < 4 },
  { t: 'どの数字も、1つだけで決めないのがコツだよ。たとえば「PERが低い」「出来高が多い」「ニュースも良い」と重なったら、前向きに考えやすいよ。数字は、過去と今の目安で、未来を約束するものではないんだ。', at: '.facts', btn: 'わかった' },
  { t: 'おしまい！わからなくなったら、銘柄名の横の「？」を押してね。', btn: 'ありがとう！' },
];
MTUT.forEach(st => { if (st.backTo) st.back = MTUT.findIndex(x => x.id === st.backTo); });
// 戻るで前のステップに行っても、対象のある画面が開くように、光らせる場所から画面を決める
const tutViewOf = at => (/^#m-sec/.test(at) ? 'hold' : /^(#stock-list|\.facts|\[data-cm|\.chart-wrap|\.a-order|\.a-news|\.a-board|#c-price|#o-|\.stepper|#modal-card)/.test(at) ? 'trade' : null);
for (const L of [TUT, MTUT, BTUT, FTUT]) L.forEach(st => { if (st.at && !st.view && st.on !== 'view') st.view = tutViewOf(st.at) || undefined; });
MTUT.find(st => st.on === 'view' && st.ok('hold')).view = 'trade';
// 練習を始める：いまの状態を丸ごと覚えておき、練習しやすいように取引中・練習用のお金100万円以上・建玉と注文なしにする
function practiceStart(code) {
  if (UI.practice) return;
  // 梅山カンパニーは信用取引できず、低位株などは空売りや保証金率がちがう（講座の「約3倍」と合わない）ので、ほかの銘柄で練習する
  if ((code || G.sel) === UME.code || byCode(code || G.sel)?.mg || byCode(code || G.sel)?.ipo) code = G.stocks.find(s => isOpen(s)).code;   // 新規上場も、信用の制限があるので別の銘柄で
  UI.practice = { lvl: 0, code: code || G.sel, g: JSON.stringify(G, (k, v) => (k === '_map' ? undefined : v)), rng: { s: RNG.s, spare: RNG.spare }, ui: { acct: UI.acct, side: UI.side, type: UI.type, qty: $('#o-qty').value } };
  const P = G.player;
  if (G.phase !== 'open') { G.phase = 'open'; if (!sel().intraday.length) for (const s of allStocks()) s.open = s.high = s.low = s.price; }
  P.cash = Math.max(P.cash, 1e6); P.mpos = {}; P.orders = []; G.mcall = null;
  G.sel = UI.practice.code; UI.acct = 'margin'; UI.side = 'buy'; UI.type = 'mkt'; buildTypes(); render();
}
// 練習の途中経過（戻るで前のステップに行ったとき、その時点の状態を作り直す）：
// 0 = 始めたとき、1 = 新規買い、2 = 値上がり、3 = 返済売り、4 = 新規売り、5 = 値下がり、6 = 返済買い のあと
const practiceLv = j => { let L = 0; ['lv1', 'lv2', 'lv3', 'lv4', 'lv5', 'lv6'].forEach((id, k) => { if (j >= MTUT.findIndex(x => x.id === id)) L = k + 1; }); return L; };
function practiceMove(key, f) {   // 値段を f 倍にする（同じ key は1回だけ）
  const pr = UI.practice; if (!pr || pr[key]) return; pr[key] = true;
  const s = byCode(pr.code); setPrice(s, s.lp + Math.log(f)); s.high = Math.max(s.high, s.price); s.low = Math.min(s.low, s.price); render();
}
function practiceTo(L) {
  const code = UI.practice.code, o = (side, open) => ({ code, side, type: 'mkt', qty: 100, price: null, reserve: 0, mg: true, open });
  const steps = [() => placeOrder(o('buy', true)), () => practiceMove('up', 1.04), () => placeOrder(o('sell', false)), () => placeOrder(o('sell', true)), () => practiceMove('down', 0.96), () => placeOrder(o('buy', false))];
  practiceEnd(true); practiceStart(code);
  UI.quiet = true; steps.slice(0, L).forEach(f => f());
  UI.quiet = false; UI.practice.lvl = L; render();
}
// 練習の前の状態に戻す（練習していなければ何もしない）
function practiceEnd(quiet) {
  const pr = UI.practice; if (!pr) return;
  UI.practice = null;
  G = JSON.parse(pr.g); afterLoad(); RNG.s = pr.rng.s; RNG.spare = pr.rng.spare;
  Object.assign(UI, { acct: pr.ui.acct, side: pr.ui.side, type: pr.ui.type }); $('#o-qty').value = pr.ui.qty; $('#o-msg').textContent = '';
  if (modalOpen) closeModal();
  UI.lastNews = -1; buildTypes(); render();
  if (!quiet) toast('練習の前の状態に戻しました');
}
function startMarginLesson() { if (UI.tut) return; UI.tutSpeed = G.speed; G.speed = 0; renderHeader(); tutGo(0, MTUT); }
function startBoardLesson() {
  if (UI.tut) return;
  UI.btut = { type: UI.type, side: UI.side, qty: $('#o-qty').value, price: $('#o-price').value };   // 講座で注文欄を変えるので、終わったら元に戻す
  UI.tutSpeed = G.speed; G.speed = 0; renderHeader(); tutGo(0, BTUT);
}
function startFactsLesson() { if (UI.tut) return; UI.tutSpeed = G.speed; G.speed = 0; renderHeader(); tutGo(0, FTUT); }
function startTutorial() { if (modalOpen) closeModal(); G.speed = 0; renderHeader(); tutGo(0, TUT); }
function tutGo(i, list = UI.tut?.list || TUT) {
  if (i >= list.length) { endTutorial(); return; }
  if (list[i].skip?.()) { tutGo(i + 1, list); return; }   // 今は成り立たないステップは飛ばす
  UI.tut = { i, list };
  const st = list[i];
  if (UI.practice && list === MTUT) UI.practice.lvl = practiceLv(i);
  if (st.view && UI.view !== st.view) switchView(st.view);
  st.enter?.();
  const box = $('#coach'); box.hidden = false;
  box.innerHTML = `<div class="sensei">${SENSEI_SVG}<div><b class="who">カブ先生</b><div class="bubble">${esc(st.t)}</div></div></div>
    <div class="coach-foot"><span class="muted small num">${i + 1} / ${list.length}</span><span>${tutPrev(i, list) >= 0 ? '<button class="ghost" data-tut="back">戻る</button> ' : ''}<button class="ghost" data-tut="skip">スキップ</button>${st.btn ? ` <button class="primary" data-tut="next">${esc(st.btn)}</button>` : ' <span class="coach-gap" aria-hidden="true"></span>'}</span></div>`;
  const el = st.at && $(st.at);
  box.classList.remove('top'); tutCenter(el, box);
  tutPlace();
}
// 戻る：1つ前のステップへ。確認画面が開いていないと成り立たないステップや、もう条件を満たしているステップは飛ばす
const tutSkipBack = st => (st.at && st.at.includes('#modal-card') && !modalOpen) || !!(st.done && st.done()) || !!(st.skip && st.skip());
function tutPrev(i, list) { let j = i - 1; while (j >= 0 && tutSkipBack(list[j])) j--; return j; }
function tutBack() {
  const T = UI.tut; if (!T) return;
  const j = tutPrev(T.i, T.list); if (j < 0) return;
  if (modalOpen && T.list[T.i].at?.includes('#modal-card')) closeModal();   // 注文の確認画面は閉じる（注文は出さない）
  if (T.list === MTUT && UI.practice) {   // 練習：始める前なら全部元に戻し、途中なら、その時点の状態に作り直す
    if (j < MTUT.findIndex(x => x.pstart)) practiceEnd(true);
    else if (practiceLv(j) < UI.practice.lvl) practiceTo(practiceLv(j));
  }
  if (T.list === TUT && T.i >= 8 && j <= 6 && UI.tutOrders?.length) {   // 最初の注文より前に戻るときは、チュートリアルで出した未約定の注文を取り消す
    G.player.orders = G.player.orders.filter(o => !UI.tutOrders.includes(o.id)); UI.tutOrders = []; render();
  }
  tutGo(j);
}
function endTutorial() {
  const first = !UI.tut || UI.tut.list === TUT;   // 信用のミニ講座では、はじめてのチュートリアルの記録は変えず、速さも元に戻す
  UI.tut = null; $('#coach').hidden = true; $('#tut-ring').hidden = true; $$('.tut-ring2').forEach(d => { d.hidden = true; });
  if (UI.btut) { UI.type = UI.btut.type; UI.side = UI.btut.side; $('#o-qty').value = UI.btut.qty; $('#o-price').value = UI.btut.price; UI.btut = null; buildTypes(); renderOrderPanel(); }
  practiceEnd();   // スキップしたときも、練習の前の状態に戻す
  if (first) { profile.tutorial = true; saveProfile(); }
  if (G) { G.speed = first ? 1 : UI.tutSpeed ?? 1; renderHeader(); }
}
// 光らせる場所を、上の見出し（固定）と吹き出しのあいだの真ん中に、すぐに持ってくる。画面に固定されたもの（確認画面・見出し・タブバー）は動かさない
function tutCenter(el, box) {
  if (!el || el.closest('#modal, .tabbar, .hdr')) return;
  // 表の中の対象（「返済」ボタンなど）は、スマホだと表が横に切れて見えないので、表の中も横に動かして真ん中に持ってくる
  const wrap = el.closest('.tbl-wrap');
  if (wrap && wrap !== el) { const e = el.getBoundingClientRect(), w = wrap.getBoundingClientRect(); wrap.scrollLeft += e.left + e.width / 2 - (w.left + w.width / 2); }
  // 吹き出しは下に出す前提で、見出しの下から吹き出しの上までを「見える場所」とする（吹き出しが上に出ていても、そこを基準にしない）
  const top = $('.hdr')?.getBoundingClientRect().bottom || 0;
  const bottom = innerHeight - parseFloat(getComputedStyle(box).bottom || 72) - box.offsetHeight - 8;
  const r = el.getBoundingClientRect(), room = Math.max(120, bottom - top);
  const dy = r.height > room - 24 ? r.top - top - 12 : r.top + r.height / 2 - (top + room / 2);
  if (Math.abs(dy) > 4) window.scrollTo({ top: window.scrollY + dy, behavior: 'instant' });
}
function tutSay(t) { const b = $('#coach .bubble'); if (b) b.textContent = t; }
function tutEvent(name, v) {
  const st = UI.tut && UI.tut.list[UI.tut.i];
  if (st && st.on === name && (!st.ok || st.ok(v))) tutGo(UI.tut.i + 1);
}
// 毎フレーム、光らせる枠を対象に合わせ、吹き出しを対象と重ならない側（上か下）に置く
// 2つ目以降の光る枠（st.also）。各要素のセレクタに合う要素を、まとめて1つの枠で囲う
function tutExtraRings(st) {
  const sets = st.also || [];
  while ($$('.tut-ring2').length < sets.length) { const d = document.createElement('div'); d.className = 'tut-ring2'; document.body.append(d); }
  $$('.tut-ring2').forEach((d, k) => {
    const rs = (sets[k] || []).map(q => $(q)?.getBoundingClientRect()).filter(r => r && r.width);
    d.hidden = !rs.length; if (!rs.length) return;
    const l = Math.min(...rs.map(r => r.left)), t = Math.min(...rs.map(r => r.top)), rr = Math.max(...rs.map(r => r.right)), b = Math.max(...rs.map(r => r.bottom));
    Object.assign(d.style, { left: l - 6 + 'px', top: t - 6 + 'px', width: rr - l + 12 + 'px', height: b - t + 12 + 'px' });
  });
}
function tutPlace() {
  if (!UI.tut) return;
  const st = UI.tut.list[UI.tut.i];
  if (st.done && st.done()) { tutGo(UI.tut.i + 1); return; }
  const el = st.at && $(st.at), ring = $('#tut-ring'), box = $('#coach');
  tutExtraRings(st);
  if (!el && st.back != null) { tutGo(st.back); return; }
  const r = el?.getBoundingClientRect();
  if (!r || !r.width) { ring.hidden = true; box.classList.remove('top'); return; }
  ring.hidden = false;
  Object.assign(ring.style, { left: r.left - 6 + 'px', top: r.top - 6 + 'px', width: r.width + 12 + 'px', height: r.height + 12 + 'px' });
  box.classList.toggle('top', r.top + r.height / 2 > innerHeight / 2);
}

/* ---------- リザルトのカブ先生（ひとことアドバイス） ---------- */
// 破産の原因（事実だけを伝える）
function bankruptCauses(P) {
  const L = [], dlLoss = P.sells.filter(x => x.dl && x.pnl < 0), loss = dlLoss.reduce((t, x) => t + x.pnl, 0);
  const failed = [...new Set(Object.keys(P.pos).concat(Object.keys(P.mpos)))].map(c => byCode(c)).filter(s => s.dl && ['fail', 'seiri'].includes(dlStage(s)));
  if (P.cash < 0 || Object.keys(P.mpos).length) L.push(`信用取引の損が、預けた保証金を超えていました。信用取引は、預けたお金より大きな損になることがあり、その分は借金として残ります。`);
  if (failed.length) L.push(`倒産した${failed.map(s => s.name).join('・')}を持っていました。倒産した株は、ストップ安が続いて売れないまま値打ちがほとんどなくなります。`);
  if (dlLoss.length) L.push(`上場廃止で決済した損失が合計${yenS(loss)}円ありました（${dlLoss.map(x => x.name).join('・')}）。上場廃止になる株は、最後の売買日の終値で決済されます。ほとんど値打ちがなくなっていることが多く、持ち続けると大きな損になります。`);
  if (!L.length) L.push('総資産が0円以下になりました。信用取引を使うと、元の資金を超える損になることがあります。');
  return L;
}
function senseiAdvice({ r, ir, clear, stars, P, bk }) {
  if (bk) {
    const cs = P.cash < 0 || Object.keys(P.mpos).length > 0, dl = P.sells.some(x => x.dl && x.pnl < 0) || Object.keys(P.pos).concat(Object.keys(P.mpos)).some(c => ['fail', 'seiri'].includes(dlStage(byCode(c))));
    if (cs && dl) return '信用取引の損と、上場廃止で決済した損が重なって、総資産が0円以下になったよ。信用取引の建玉は、買う前に「どこまで損してよいか」を決めておこう。';
    if (cs) return '信用取引の損が、預けたお金を超えて借金になったよ。信用取引は元手より大きな損になることがあるから、建てる株数を控えめにして、損切りの線を先に決めておこう。';
    if (dl) return '上場廃止で決済した損が大きくて、総資産が0円以下になったよ。赤字や「継続企業の注記」が出た会社は、1社に集中しないで、早めに様子を見直そう。';
    return '総資産が0円以下になって、ゲームが終わったよ。次は1回の取引を小さくして、損切りの線を先に決めておこう。';
  }
  if (!P.trades.length) return '今回は一度も売買しなかったね、次は少しの株数からでいいので買ってみよう！';
  if (stars === 3) return '文句なしの満点だ、損を小さく抑えながら指数にも勝つなんてプロ顔負けだよ！';
  if (P.maxDD > 0.2) return '途中で資産が大きく減った時期があったから、次は1社に集中せず業種を分けて持ってみよう。';
  if (!P.sells.length) return '買ったまま一度も売らなかったね、利益は売って初めて確定するから売り時も考えてみよう。';
  const worst = P.sells.reduce((x, y) => (y.pct < x.pct ? y : x));
  if (worst.pct < -0.1) return `${worst.name}で${pctS(worst.pct)}の損が出たから、次は「ここまで下がったら売る」を先に決めておこう。`;
  if (clear && r > ir) return '目標クリア、しかも指数に勝てたね、この調子で次のシナリオにも挑戦しよう！';
  if (clear) return `目標クリアおめでとう、次は指数（${idxName()}）に勝つことを目指してみよう！`;
  return 'おしかったね、ニュースの★と決算の日を意識すると、もっと良い場面で売り買いできるよ。';
}

/* ---------- タイトル ---------- */
const pick = { mode: 'random', scen: 'month', diff: 'easy' };
// シナリオが遊べるか（データがあるか）。フリープレイは、相場の候補のどれかのデータがあれば遊べる
const scenAvail = k => !SCEN[k].real || (SCEN[k].free ? freePool().some(realOK) : realOK(k));
const scenOff = (k, r) => scenLock(SCEN[k], r) || !scenAvail(k);
const scenMissingFile = k => REAL_SETS[SCEN[k].free ? freePool()[0] : k].file;
// リアル相場の注意書き。選んだシナリオの期間に合わせ、ニュースがあるかどうかで文を切り替える
function realDisclaimer(k) {
  const rs = REAL_SETS[SCEN[k].free ? freePool()[0] : k];
  const news = rs && Object.keys(rs.newsByDay || {}).length > 0;
  const ev = rs?.ev ? '決算は当時の発表日時に、実際の数字を要約したニュースとして出ます。配当と株主優待は当時の実績どおり、権利付き最終日に持っていれば翌朝に入ります（優待は金額が示されているものだけ）。どちらも株価は動かしません。' : '決算・配当は出ません。';
  return `リアル相場チャレンジの終値は、${rs?.period}の実際の株価（株式分割を反映した値。配当は反映していません）です。始値・高値・安値・日中の動き・板・出来高は、終値をもとにゲームが作ったもので、実際とは異なります。${ev}${news ? 'ニュースは実際の報道を要約したもので、出来事の翌営業日の朝に表示されます（表示するだけで、株価は動かしません）。' : 'ニュースは出ません。'}実データは Yahoo Finance から個人利用の範囲で取得したもので、このモードは配布しないでください。過去の値動きは将来の値動きを保証しません。`;
}
function showTitle() {
  practiceEnd(true); if (UI.view === 'mission') markMissionsSeen();
  if (UI.tut) { UI.tut = null; $('#coach').hidden = true; $('#tut-ring').hidden = true; $$('.tut-ring2').forEach(d => { d.hidden = true; }); }
  stopBgm(); titleOpen = true; const el = $('#title'); el.hidden = false; const r = rank(), save = loadSave();
  const realLock = !realUnlocked(r);
  if (!anyReal() || realLock) pick.mode = 'random';
  const real = pick.mode === 'real';
  if (scenOff(pick.scen, r) || !!SCEN[pick.scen].real !== real) pick.scen = real ? (Object.keys(SCEN).find(k => SCEN[k].real && !scenOff(k, r)) || 'real') : 'month'; if (DIFF[pick.diff].rank > r) pick.diff = 'easy';
  const modes = [['random', 'ランダム相場', `架空の${profile.r7 ? 30 + XDEFS.length : 30}社。シードごとに毎回ちがう相場になる。`], ['real', 'リアル相場チャレンジ', anyReal() ? (profile.r7 ? '実在の50社。過去の現実の相場になる。' : '実在の30銘柄。過去の現実の相場になる。ランク7で、追加の銘柄が出る。') : `${Object.values(REAL_SETS).map(S => S.file).join(' か ')} がないため遊べません（tools/fetch_prices.py で作成）。`]];
  el.innerHTML = `<div class="title-card">
    <div class="hero"><div><p class="tagline">ほんものと同じルールで、失敗しても痛くない株デビュー</p><h1 id="t-logo">カブトレ<span class="bang">！</span></h1>
      <p>${real ? '過去の東京証券取引所の株価で、実在の30社を売買して、資産を増やそう。' : `架空の取引所「NTX」で、実在の企業をもじった${profile.r7 ? DEFS.length + XDEFS.length : 30}社を売買して、資産を増やそう。`}100株単位、成行と指値、板、ストップ高・安、決算、配当、税金まで本物と同じ。</p></div>
      <div class="prof${isFast() ? ' fast' : ''}${r >= RANKS.length ? ' rank-legend' : ''}"><b>ランク${r}「${RANKS[r - 1].n}」</b>${profile.xp.toLocaleString()} XP　<span id="t-pt">${profile.points.toLocaleString()} pt</span></div></div>
    <div class="setup">
      <div><h2>相場</h2><div class="choices modes">${modes.map(([k, n, d]) => `<button class="choice" data-mode="${k}" aria-pressed="${pick.mode === k}" ${k === 'real' && (!anyReal() || realLock) ? 'disabled' : ''}><b>${n}</b><span>${d}</span>${k === 'real' && anyReal() && realLock ? `<em>ランク${SCEN.real.rank}で解放</em>` : ''}</button>`).join('')}</div>
      <h2>シナリオ</h2><div class="choices">${Object.entries(SCEN).filter(([, S]) => !!S.real === real).map(([k, S]) => { const lock = scenLock(S, r), miss = !scenAvail(k), b = profile.best[k]; return `<button class="choice" data-scen="${k}" aria-pressed="${pick.scen === k}" ${lock || miss ? 'disabled' : ''}><b>${S.name}</b><span>${S.desc}${S.days && !S.free ? `（${S.days}営業日）` : ''}　目標：${S.goal}</span><em class="${b ? 'best' : ''}">${lock ? `ランク${S.rank}で解放` : miss ? `${scenMissingFile(k)} がありません` : b != null ? '★'.repeat(b) + '☆'.repeat(3 - b) : ''}</em></button>`; }).join('')}</div></div>
      <div><h2>難易度</h2><div class="choices">${Object.entries(DIFF).map(([k, D]) => { const lock = D.rank > r; return `<button class="choice" data-diff="${k}" aria-pressed="${pick.diff === k}" ${lock ? 'disabled' : ''}><b>${D.name}</b><span>${D.desc}</span><em>${lock ? `ランク${D.rank}で解放` : ''}</em></button>`; }).join('')}</div>
        <div class="seed-row" id="cash-row" ${SCEN[pick.scen].free ? '' : 'hidden'}><label for="cash">初期資金</label><input id="cash" class="num" type="number" min="${CASH_MIN}" max="${CASH_MAX}" step="10000" placeholder="${DIFF[pick.diff].cash}"><span>円（1万〜10億円。フリープレイのみ）</span></div>
        <div class="seed-row"><label for="seed">相場の番号（シード）</label><input id="seed" class="num" type="number" placeholder="おまかせ"><span>${real ? '終値は実データどおり。番号で変わるのは日中の動きだけです' : '同じ番号なら、友達と同じ相場で勝負できます'}</span></div></div>
    </div>
    <div class="go"><button class="primary" id="go-new">はじめる</button>${save ? `<button class="ghost" id="go-cont">続きから（${esc(SCEN[save.scen].name)}・${mdLabel(save.date)}）</button>` : ''}<button class="ghost" id="go-shop" aria-label="ショップ" title="ショップ">${cartIcon}</button><button class="ghost" id="go-rec">取引成績</button></div>
    <p class="disclaimer">${real ? realDisclaimer(pick.scen) : `このゲームに出てくる会社・株価・ニュースはすべて架空です。社名は実在の企業をもじったパロディで、実在の企業とは関係ありません。ゲームの値動きは作りものなので、本物の株価の予想には使えません。実際の投資では、元本を割り込む（損をする）可能性があります。`}</p>
  </div>`;
  el.onclick = e => {
    if (e.target.closest('#t-logo')) { fastTap(); return; }
    const sc = e.target.closest('[data-scen]'), df = e.target.closest('[data-diff]'), md = e.target.closest('[data-mode]');
    if (md && !md.disabled && md.dataset.mode !== pick.mode) { const sv = $('#seed').value; pick.mode = md.dataset.mode; showTitle(); $('#seed').value = sv; return; }
    if (sc && !sc.disabled) { pick.scen = sc.dataset.scen; $$('[data-scen]', el).forEach(b => b.setAttribute('aria-pressed', String(b === sc))); $('#cash-row').hidden = !SCEN[pick.scen].free; if (SCEN[pick.scen].real) $('.disclaimer').textContent = realDisclaimer(pick.scen); }
    if (df && !df.disabled) { pick.diff = df.dataset.diff; $$('[data-diff]', el).forEach(b => b.setAttribute('aria-pressed', String(b === df))); $('#cash').placeholder = DIFF[pick.diff].cash; }
    if (e.target.closest('#go-new')) {
      const sv = $('#seed').value; const seed = sv ? (+sv | 0) : Math.floor(Math.random() * 1e9);
      const cv = +$('#cash').value, cash = SCEN[pick.scen].free && cv ? clamp(Math.round(cv / 1000) * 1000, CASH_MIN, CASH_MAX) : 0;
      newGame(pick.scen, pick.diff, seed, cash, pick.mode); hideTitle(); UI.lastNews = -1; buildTypes(); buildFilter(); switchView('trade'); render();
      if (G.scen === 'month' && !profile.tutorial) startTutorial(); else toast(!isReal() ? `相場の番号は ${seed} です` : G.base !== G.scen ? `今回の相場は「${SCEN[G.base].name}」。${dateLabel(G.date)}から、実際の株価で取引します` : `${dateLabel(G.date)}から、実際の株価で取引します`);
    }
    if (e.target.closest('#go-rec')) { showRecords(); return; }
    if (e.target.closest('#go-shop')) { shopAll = false; showShop(); return; }
    if (e.target.closest('#go-cont')) { const g = loadSave(); if (g) { UI.lastNews = -1; resume(g); buildTypes(); buildFilter(); switchView('trade'); render(); } }
  };
}
// タイトル画面で、ランク1のときにロゴを1.5秒以内の間隔で続けて10回押すと、ファストスターターモードになる（ランクが上がっても続く）
let fastTaps = 0, fastTapAt = 0;
function fastTap() {
  if (rank() !== 1 || isFast()) { fastTaps = 0; return; }
  const now = performance.now(); fastTaps = now - fastTapAt < 1500 ? fastTaps + 1 : 1; fastTapAt = now;
  if (fastTaps < 10) return;
  fastTaps = 0;
  profile.fast = true; saveProfile();
  const sv = $('#seed').value, cv = $('#cash').value; showTitle(); $('#seed').value = sv; $('#cash').value = cv;
  playClick(); toast('⚡ファストスターターモードになりました', 'rank');
}
// ミッション画面の「ランクと解放されるもの」で、ゲーム内の時刻が9:00のときに「伝説の相場師」を続けて10回タップすると、最高ランク（全機能解放）になる
let legendTaps = 0, legendTapAt = 0;
function legendTap() {
  if (!G || timeLabel() !== '9:00') { legendTaps = 0; return; }
  const now = performance.now(); legendTaps = now - legendTapAt < 1500 ? legendTaps + 1 : 1; legendTapAt = now;
  if (legendTaps < 10) return;
  legendTaps = 0;
  if (rank() === RANKS.length) { toast('すでに全機能が解放されています'); return; }
  profile.xp = RANKS.at(-1).xp; profile.r7 = true;
  profile.points = Math.max(profile.points, SHOP.filter(x => !owns(x.id)).reduce((t, x) => t + x.price, 0));   // ショップの品物を全部買えるだけ渡す
  saveProfile();
  buildTypes(); buildFilter(); render();
  toast(`ランク${RANKS.length}「${RANKS.at(-1).n}」になりました。全機能が解放されています。ショップの品物も全部買えるポイントを渡しました`, 'rank');
}
// 経験値・ランク・ミッション・最高記録・チュートリアル・ポイント・ショップで買ったもの・進行中のセーブをすべて消して、最初からにする
function confirmReset(all) {
  openModal(`<h2>${all ? '全解放をリセットしますか？' : 'データをリセットしますか？'}</h2><p>${all ? `いまは全機能が解放されています（ランク${RANKS.length}）。リセットすると解放はすべて元に戻り、` : ''}経験値・ランク・ミッション・最高記録・取引成績・ポイントとショップで買ったもの・進行中のゲームがすべて消え、ランク1からやり直しになります。元には戻せません。</p>
    <div class="actions"><button class="ghost" data-act="cancel">やめる</button><button class="primary" data-act="ok">リセットする</button></div>`,
  { cancel: closeModal, ok: () => { closeModal(); profile = defProfile(); saveProfile(); applySkin(); applyBgm(); clearSave(); pick.mode = 'random'; showTitle(); toast('リセットしました。ランク1からスタートです'); } });
}
function hideTitle() { titleOpen = false; $('#title').hidden = true; playBgm(); }

function markMissionsSeen() {   // ミッション画面を離れたら、見せた達成済みを完了済みへ移す
  let ch = false; for (const id in profile.missions) if (!profile.mseen[id]) { profile.mseen[id] = true; ch = true; }
  if (ch) saveProfile();
}
function switchView(v) {
  if (UI.view === 'mission' && v !== 'mission') markMissionsSeen();
  UI.view = v;
  for (const k of ['trade', 'hold', 'cal', 'mission', 'hint']) $('#view-' + k).hidden = k !== v;
  $$('.tabbar button').forEach(b => { if (b.dataset.view === v) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  if (v === 'hint') renderHint($('#dict-q')?.value || '');
  UI.lastNews = -1; render(); window.scrollTo(0, 0);
  tutEvent('view', v);   // 画面を描いてスクロールを戻したあとで知らせる（次のステップが、描き終わった画面の中央に枠を出せるように）
}

/* ===================== 操作 ===================== */
// f > 1 で縮小（たくさん表示）、f < 1 で拡大。ax（キャンバス上のx座標）の位置を動かさずに拡大縮小する
function zoomChart(f, ax) {
  const g = UI.geom; if (!g) return; const v = UI.vw[g.mode];
  const cnt = clamp(g.cnt * f, 10, Math.max(g.n, 60));
  if (v.end == null || ax == null) { v.cnt = cnt; if (v.end != null) v.end = g.s0 + g.cnt - (g.cnt - cnt) / 2; return; }
  const at = clamp((ax - g.padL) / g.pw, 0, 1), i = g.s0 + at * g.cnt;
  v.cnt = cnt; v.end = i - at * cnt + cnt;
}
function runUntil(cond) { let n = 0; while (!cond() && n++ < 400 && G.phase !== 'closed') tick(); render(); }
function selectStock(code, scroll) {
  if (byCode(code)?.delisted) G.chartMode = '1d';   // 上場廃止の銘柄は閲覧だけ（今日の分足はないので日足で見せる）
  G.sel = code; UI.acct = 'cash'; UI.hover = null; UI.vw.yOff = 0; $('#o-msg').textContent = ''; $('#o-price').value = ''; render();
  if (scroll && window.innerWidth < 700 && !UI.tut) $('.a-chart').scrollIntoView({ behavior: 'smooth' });
  tutEvent('select');
}
function bindUI() {
  document.addEventListener('pointerdown', () => { if (!titleOpen && bgm.paused) playBgm(); });
  // タッチ・マウスは押した瞬間に鳴らす。キーボード操作（pointerdown が無い click）は click で鳴らす
  // タッチは指を離した時に鳴らす（押した瞬間に鳴らすと、リストのスクロールでも鳴ってしまう）。動いた・スクロールになった（pointercancel）ときは鳴らさない
  let sePressedAt = 0, touchBtn = null, touchAt = null;
  document.addEventListener('pointerdown', e => {
    const b = e.target.closest('button'); touchBtn = null;
    if (!b) return;
    sePressedAt = performance.now();
    if (b.closest('#stock-list')) UI.listHold = true;
    if (b.closest('#board')) UI.boardHold = true;
    if (e.pointerType === 'touch') { touchBtn = b; touchAt = [e.clientX, e.clientY]; } else if (!silentButton(b)) playClick();
  }, true);
  document.addEventListener('pointermove', e => { if (touchBtn && Math.hypot(e.clientX - touchAt[0], e.clientY - touchAt[1]) > 8) touchBtn = null; }, true);
  const listRelease = () => {
    if (UI.listHold) { UI.listHold = false; if (G && UI.view === 'trade') renderList(); }
    if (UI.boardHold) { UI.boardHold = false; if (G && UI.view === 'trade') renderBoard(); }
  };
  document.addEventListener('pointercancel', () => { touchBtn = null; listRelease(); }, true);
  document.addEventListener('pointerup', e => setTimeout(listRelease, e.pointerType === 'touch' ? 400 : 0), true);   // click のあとに並べ直す。iOS のタッチは離してから click が遅れて来ることがあり、すぐ作り直すと押したボタンが消えて反応しない
  document.addEventListener('pointerup', e => { const b = touchBtn; touchBtn = null; if (b && e.target.closest('button') === b) { sePressedAt = performance.now(); if (!silentButton(b)) playClick(); } }, true);
  document.addEventListener('click', e => { const b = e.target.closest('button'); if (b && performance.now() - sePressedAt > 1000 && !silentButton(b)) playClick(); }, true);
  document.addEventListener('click', e => {
    const t = e.target.closest('.term'); if (t) { e.preventDefault(); e.stopPropagation(); showTerm(t); return; }
    hidePop();
    const tb = e.target.closest('[data-tut]'); if (tb) { if (tb.dataset.tut === 'skip') endTutorial(); else if (tb.dataset.tut === 'back') tutBack(); else tutGo(UI.tut.i + 1); return; }
    const act = e.target.closest('#modal [data-act]'); if (act && modalHandlers[act.dataset.act]) { modalHandlers[act.dataset.act](act); return; }   // タイトル画面の記録もここで閉じる
    if (!G || titleOpen) return;
    if (modalOpen) return;
    const sp = e.target.closest('[data-speed]'); if (sp) { G.speed = +sp.dataset.speed; renderHeader(); tutEvent('speed', G.speed); return; }
    if (e.target.closest('#skip-btn')) { if (G.phase === 'pre') { runUntil(() => G.phase === 'open'); tutEvent('skip'); } else if (G.phase === 'open') runUntil(() => G.phase === 'closed'); else dailyReport(); return; }
    const row = e.target.closest('.row[data-code]'); if (row) { selectStock(row.dataset.code, true); return; }
    const nav = e.target.closest('[data-nav]'); if (nav) {   // チャートの左右の三角：銘柄リストに見えている順で、前・次の銘柄へ（端はぐるっと回る）
      const codes = $$('#stock-list .row').map(b => b.dataset.code), i = codes.indexOf(G.sel);
      if (codes.length > 1) selectStock(codes[(i + (nav.dataset.nav === 'next' ? 1 : codes.length - 1) + (i < 0 ? 1 : 0)) % codes.length], false);
      return;
    }
    const zm = e.target.closest('[data-zoom]'); if (zm) { if (zm.dataset.zoom === 'latest') { UI.vw[G.chartMode].end = null; UI.vw.yOff = 0; } else zoomChart(zm.dataset.zoom === 'in' ? 1 / 1.4 : 1.4); drawChart(); return; }
    const cm = e.target.closest('[data-cm]'); if (cm) { G.chartMode = cm.dataset.cm; UI.hover = null; renderChartHead(); drawChart(); tutEvent('cm', G.chartMode); return; }
    if (e.target.closest('#m-help')) { startMarginLesson(); return; }
    if (e.target.closest('#b-help')) { startBoardLesson(); return; }
    if (e.target.closest('#f-help')) { startFactsLesson(); return; }
    const ac = e.target.closest('[data-acct]');
    if (ac && ac.classList.contains('locked')) { const R = RANKS[MARGIN.rank - 1]; toast(`🔒 信用取引はランク${MARGIN.rank}「${R.n}」（${R.xp.toLocaleString()} XP）で解放されます。あと${(R.xp - profile.xp).toLocaleString()} XP`); return; }
    if (ac) { UI.acct = ac.dataset.acct; $('#o-msg').textContent = ''; renderOrderPanel(); return; }
    // 保有株画面の「返済」：取引画面で、その銘柄の返済の注文を用意する
    const mc = e.target.closest('[data-mclose]'); if (mc) { const p = mPos(mc.dataset.mclose); if (p) { G.sel = mc.dataset.mclose; UI.acct = 'margin'; UI.side = p.side === 'buy' ? 'sell' : 'buy'; $('#o-qty').value = p.qty; $('#o-msg').textContent = ''; switchView('trade'); tutEvent('mclose'); } return; }
    const sd = e.target.closest('[data-side]'); if (sd) { UI.side = sd.dataset.side; renderOrderPanel(); tutEvent('side', UI.side); return; }
    const ty = e.target.closest('[data-type]');
    if (ty && ty.classList.contains('locked')) { const n = TYPE_RANK[ty.dataset.type], R = RANKS[n - 1]; toast(`🔒 ${KIND[ty.dataset.type]}はランク${n}「${R.n}」（${R.xp.toLocaleString()} XP）で解放されます。あと${(R.xp - profile.xp).toLocaleString()} XP。ミッションをこなしてXPを集めよう`); tutEvent('locked'); return; }
    if (ty && !ty.disabled) { UI.type = ty.dataset.type; if (UI.type !== 'mkt' && !$('#o-price').value) $('#o-price').value = sel().price; renderOrderPanel(); return; }
    if (e.target.closest('#q-minus')) { const q = $('#o-qty'), L = lot(sel()); q.value = Math.max(L, (+q.value || L) - L); renderOrderPanel(); tutEvent('qty'); return; }
    if (e.target.closest('#q-plus')) { const q = $('#o-qty'), L = lot(sel()); q.value = (+q.value || 0) + L; renderOrderPanel(); tutEvent('qty'); return; }
    const qk = e.target.closest('[data-q]'); if (qk) { $('#o-qty').value = Math.max(lot(sel()), +qk.dataset.q); renderOrderPanel(); tutEvent('qty'); return; }
    const bp = e.target.closest('[data-px]'); if (bp) { if (UI.type === 'mkt') UI.type = 'lmt'; $('#o-price').value = bp.dataset.px; renderOrderPanel(); if (!UI.tut) { const o = $('.a-order'); o.style.scrollMarginTop = (($('.hdr')?.getBoundingClientRect().bottom || 0) + 12) + 'px'; o.scrollIntoView({ behavior: 'smooth', block: 'start' }); } tutEvent('px'); return; }
    if (e.target.closest('#o-submit')) { confirmOrder(); return; }
    const cc = e.target.closest('[data-cancel]'); if (cc) { const o = G.player.orders.find(x => x.id === +cc.dataset.cancel); if (o) { removeOrder(o); toast('注文を取り消しました'); render(); } return; }
    const gt = e.target.closest('[data-goto]'); if (gt) { selectStock(gt.dataset.goto); switchView('trade'); return; }   // 取引履歴の、上場廃止の銘柄（閲覧だけ）
    const nw = e.target.closest('[data-news]'); if (nw) {
      const n = G.news.find(x => x.id === +nw.dataset.news); if (!n) return;
      let code = n.codes[0]; if (!code && n.sector) code = unlockedStocks().find(s => s.sector === n.sector)?.code;
      if (code && preIpo(byCode(code))) toast(`${byCode(code).name}は、${mdLabel(addTD(G.date, byCode(code).ipo.day - G.dayIndex))}に上場します`);
      else if (code && (isOpen(byCode(code)) || byCode(code).delisted)) { selectStock(code); if (UI.view !== 'trade') switchView('trade'); } else if (code) toast(`${byCode(code).name}はランク${openRank(byCode(code))}で取引できるようになります`);
      return;
    }
    if (e.target.closest('[data-legend]')) { legendTap(); return; }
    const hc = e.target.closest('[data-hcat]'); if (hc) { UI.hcat = hc.dataset.hcat; renderHint($('#dict-q').value.trim()); return; }
    const tv = e.target.closest('[data-view]'); if (tv) { switchView(tv.dataset.view); return; }
    if (e.target.closest('#h-rank')) { switchView('mission'); return; }
    if (e.target.closest('#h-logo')) { showTitle(); return; }
    if (e.target.closest('#menu-btn')) {
      const all = rank() === RANKS.length;   // 全機能が解放されているときは、リセットの表示を変える
      openModal(`<button class="ghost sq-btn corner-btn" data-act="mute" aria-label="${muted ? '消音を解除' : '消音にする'}">${speakerIcon(muted)}</button><h2>メニュー</h2><p class="muted small">進行は1日の終わりごとに自動で保存されます。相場の番号：${G.seed}</p>
        <div class="actions" style="justify-content:flex-start"><button class="ghost" data-act="tut">カブ先生の説明をもう一度見る</button><button class="ghost" data-act="reset">${all ? '全解放をリセット' : 'データをリセット'}</button>${isFast() ? '<button class="ghost" data-act="unfast">ファストスターターを解除</button>' : ''}</div>
        <div class="actions" style="justify-content:space-between"><button class="ghost" data-act="title">タイトルに戻る</button><button class="primary" data-act="close">ゲームに戻る</button></div>`,
      { close: closeModal, mute: () => { setMuted(!muted); const b = $('#modal-card [data-act="mute"]'); b.innerHTML = speakerIcon(muted); b.setAttribute('aria-label', muted ? '消音を解除' : '消音にする'); }, tut: () => { closeModal(); startTutorial(); }, title: () => { closeModal(); showTitle(); }, reset: () => confirmReset(all), unfast: () => {
        // 解除すると、銘柄・注文・信用取引はランクどおりに戻る（持っている株と建玉はそのまま）
        closeModal(); profile.fast = false; saveProfile();
        if (!isOpen(sel())) G.sel = unlockedStocks()[0].code;
        buildTypes(); buildFilter(); render(); toast('ファストスターターモードを解除しました');
      } });
    }
  });
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal' && $('#modal-card [data-act="cancel"], #modal-card [data-act="close"]')) closeModal(); });
  window.addEventListener('scroll', hidePop, { passive: true });   // 用語の吹き出しは画面に固定しているので、スクロールしたら閉じる
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { hidePop(); if (modalOpen && $('#modal-card [data-act="cancel"], #modal-card [data-act="close"]')) closeModal(); } });
  $('#sec-filter').addEventListener('change', e => { UI.filter = e.target.value; fitSelect(e.target); renderList(); });
  $('#kind-filter').addEventListener('change', e => { UI.kind = e.target.value; fitSelect(e.target); renderList(); });
  $('#sort-bar').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.id === 'sort-dir') UI.sort.desc = !UI.sort.desc; else if (b.dataset.sort !== UI.sort.key) { UI.sort.key = b.dataset.sort; UI.sort.desc = b.dataset.sort !== 'none'; }   // 標準は昇順（銘柄の並び順）、値段・騰落率は降順から
    renderList();
  });
  $('#o-qty').addEventListener('input', () => { renderOrderPanel(); tutEvent('qty'); });
  $('#o-price').addEventListener('input', () => renderOrderPanel());
  document.addEventListener('input', e => { if (e.target.id === 'dict-q') renderHint(e.target.value.trim()); });
  // チャート：ドラッグで上下左右に移動、ホイール・ピンチ・＋−ボタンで拡大縮小、ダブルクリックで最新に戻す
  const cv = $('#chart'), ptrs = new Map(); let pinch = 0, dragged = 0;
  const relX = e => e.clientX - cv.getBoundingClientRect().left;
  cv.addEventListener('pointerdown', e => { if (!G) return; if (e.isPrimary) { ptrs.clear(); pinch = 0; }   // 前のタッチが残っていると2本指扱い（＝拡大縮小）になるので消す
    cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); cv.classList.add('dragging'); UI.hover = null; if (ptrs.size === 2) { const [a, b] = ptrs.values(); pinch = Math.hypot(a.x - b.x, a.y - b.y); } });
  cv.addEventListener('pointermove', e => {
    const g = UI.geom; if (!g) return;
    const p = ptrs.get(e.pointerId);
    if (!p) { const i = Math.floor(g.s0 + (relX(e) - g.padL) / g.slotW); UI.hover = i >= 0 && i < g.n ? i : null; drawChart(); return; }
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (ptrs.size === 2) { const [a, b] = ptrs.values(), d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch && d) zoomChart(pinch / d); pinch = d; drawChart(); return; }
    const v = UI.vw[g.mode]; v.end = g.s0 + g.cnt - dx / g.slotW; UI.vw.yOff += dy / g.prH; dragged += Math.abs(dx) + Math.abs(dy); drawChart();
  });
  const up = e => { ptrs.delete(e.pointerId); pinch = 0; if (!ptrs.size) { cv.classList.remove('dragging'); if (dragged > 20) tutEvent('drag'); dragged = 0; } };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('lostpointercapture', up);
  cv.addEventListener('pointerleave', () => { if (!ptrs.size) { UI.hover = null; drawChart(); } });
  cv.addEventListener('wheel', e => {
    const g = UI.geom; if (!g) return; e.preventDefault();
    // 横向きのスクロール（トラックパッドの左右など）は移動、縦向きとピンチは拡大縮小
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && !e.ctrlKey) { UI.vw[g.mode].end = g.s0 + g.cnt + e.deltaX / g.slotW; drawChart(); return; }
    zoomChart(Math.exp(e.deltaY * 0.002), relX(e)); drawChart();
  }, { passive: false });
  cv.addEventListener('gesturestart', e => e.preventDefault());   // iPad の Safari で、チャート上のピンチがページの拡大にならないように
  cv.addEventListener('dblclick', () => { if (!G) return; UI.vw[G.chartMode].end = null; UI.vw.yOff = 0; drawChart(); });
  new ResizeObserver(() => { if (G && UI.view === 'trade') drawChart(); }).observe($('.chart-wrap'));
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => G && render());
}

/* ===================== ループ ===================== */
let lastTs = 0, acc = 0;
function loop(ts) {
  tutPlace();
  const dt = lastTs ? Math.min(ts - lastTs, 1000) : 0; lastTs = ts;
  if (G && !titleOpen && !modalOpen && G.phase !== 'closed' && G.speed > 0) {
    acc += dt * G.speed; let n = 0; const since = G.newsId;
    while (acc >= 1000 && n < 20) { acc -= 1000; tick(); n++; if (G.phase === 'closed' || modalOpen) { acc = 0; break; } }
    if (n) { render(); notifyNews(since); }
  } else acc = 0;
  requestAnimationFrame(loop);
}

function start(data) {
  applySkin(); applyBgm(); bindUI();
  let resumed = false;
  if (data && data.save) { try { const g = JSON.parse(data.save); if (saveUsable(g)) { UI.view = data.view || 'trade'; resume(g); buildTypes(); buildFilter(); switchView(UI.view); resumed = true; } } catch (e) {} }
  if (!resumed) showTitle();
  requestAnimationFrame(loop);
}
window.claude?.hot?.snapshot?.(() => (G && !titleOpen && !G.ended ? { save: JSON.stringify(G, (k, v) => (k === '_map' ? undefined : v)), view: UI.view } : {}));
window.__kabutore = { get G() { return G; }, xOn: v => (X_ON = !!v), newGame, tick, asset, rank, profile: () => profile, runDay: () => { while (G.phase !== 'closed') tick(); }, nextDay, closeModal, saveText, resume: str => resume(JSON.parse(str)), placeOrder, addXP, legendTap, render, switchView, book, availCash, marginStat, marginRoom: c => marginRoom(c && G._map[c]), dlPlan, dlStage: c => dlStage(G._map[c]), dlWarn: c => dlWarn(G._map[c]), unlockedCodes: () => unlockedStocks().map(s => s.code), sellMissions, onGame,
  // 動作確認用：code の銘柄（追加銘柄）で、days 営業日後の朝に前兆が始まるように日程を作り直す。戻り値は新しい日程
  finalReport, practiceStart, practiceEnd, xnFx: v => (XN_FX = v), xnSkip: c => (XN_SKIP = c), xnForce(c, chg) { XN_FORCE = chg; xNews(G._map[c], G.phase === 'open' ? 'live' : 'gap'); render(); }, xnPlan: c => xnPlan(G._map[c]), xnOK: c => xnOK(G._map[c]), ipoStage: c => ipoStage(G._map[c]), ipoSchedule, netAsset, assetOld: () => { const P = G.player; let v = P.cash; for (const c in P.pos) v += P.pos[c].qty * G._map[c].price; if (Object.keys(P.mpos).length) { const m = marginStat(); v += m.u - m.cost; } return v; },
  // 動作確認用：新規上場の銘柄を、days 営業日後に上場するように日程を作り直す（承認のお知らせは翌朝）。戻り値は s.ipo
  // 確認用：リアル相場の当時の決算・配当・優待を切る（false で、値動き・ニュースが入れる前と同じになる）。realEvents: 今のシナリオの決算・配当・優待のデータ
  realEv: v => (REAL_EV_ON = v), realEvents: () => REAL_EV,
  forceList(code, days = 1) { const s = G?._map[code]; if (!s?.ipo || !preIpo(s) || days < 1) return null; Object.assign(s.ipo, { day: G.dayIndex + days, ann: G.dayIndex + 1, chg: false }); render(); return s.ipo; },
  forceDelist(code, days = 1) { const s = G?._map[code]; if (!s?.extra || s.delisted || days < 1) return null; s.dl = dlPlan(G.seed, code, G.dayIndex + days); render(); return s.dl; } };
if (window.claude?.hot?.ready) window.claude.hot.ready(start); else start(window.claude?.hot?.data ?? {});
})();
