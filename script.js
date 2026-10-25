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
const DIFF = {
  easy:   { name: 'やさしい', cash: 3e6, vol: .7, fee: 0,    tax: false, hint: 'dir',   rank: 1, desc: '初期資金300万円。値動き穏やか。ニュースの影響の向きを表示。' },
  normal: { name: 'ふつう',   cash: 1e6, vol: 1,  fee: 0,    tax: true,  hint: 'stars', rank: 1, desc: '初期資金100万円。税金あり。ニュースは信頼度★だけ表示。' },
  hard:   { name: '本格',     cash: 5e5, vol: 1,  fee: .001, tax: true,  hint: 'none',  rank: 5, desc: '初期資金50万円。手数料0.1%・税金あり・暴落あり。ヒントなし。' },
};
const SCEN = {
  month: { name: 'はじめての1か月', days: 20,  rank: 1, mu: .14, desc: '穏やかな上昇相場で売買に慣れよう。', goal: '資産をプラスで終える', clear: (r) => r > 0 },
  storm: { name: '嵐の四半期',     days: 60,  rank: 3, mu: .05, desc: '途中で暴落が起きる。耐えるか、逃げるか。', goal: '指数（NTX225）に勝つ', clear: (r, ir) => r > ir, crash: true },
  year:  { name: '1年チャレンジ',   days: 245, rank: 4, mu: .06, desc: '決算が4回。相場の波を乗りこなそう。', goal: '1年で+10%', clear: (r) => r >= .10 },
  free:  { name: 'フリープレイ',   days: 0,   rank: 1, mu: .06, desc: '期間無制限。自由に取引しよう。', goal: 'なし', clear: null },
  // リアル相場チャレンジ専用（タイトルのシナリオ一覧には出さない）。日数は実データの営業日数
  real:  { name: 'リアル相場チャレンジ 2020', get days() { return REAL ? REAL.dates.length : 0; }, rank: 1, mu: 0, desc: '2020年の実際の株価で1年間取引する。コロナ・ショックを乗り越えよう。', goal: '30銘柄平均に勝つ', clear: (r, ir) => r > ir, real: true },
};
const RANKS = [
  { n: '株デビュー', xp: 0, unlock: '3銘柄・成行注文' },
  { n: '見習いトレーダー', xp: 100, unlock: '10銘柄・指値注文・板' },
  { n: '一人前トレーダー', xp: 300, unlock: '20銘柄・逆指値注文・移動平均線・嵐の四半期' },
  { n: '中級トレーダー', xp: 700, unlock: '全30銘柄・決算カレンダー・RSI・1年チャレンジ' },
  { n: '上級トレーダー', xp: 1500, unlock: '本格モード' },
  { n: 'プロトレーダー', xp: 3000, unlock: '称号（信用取引は次のアップデートで追加予定）' },
  { n: '伝説の相場師', xp: 6000, unlock: '称号' },
];
const MISSIONS = [
  { id: 'buy', t: '株を買ってみよう', xp: 20 },
  { id: 'profit', t: '利益を出して売ろう', xp: 30 },
  { id: 'diverse', t: '3業種以上の株を持って1日を終えよう', xp: 30 },
  { id: 'limit', t: '指値注文を約定させよう', xp: 30, rank: 2 },
  { id: 'div', t: '配当を受け取ろう', xp: 40 },
  { id: 'earn', t: '決算発表をまたいで株を持とう', xp: 40 },
  { id: 'stop', t: '逆指値で損切りしよう', xp: 40, rank: 3 },
  { id: 'plus10', t: '総資産+10%を達成しよう', xp: 60 },
  { id: 'beat', t: '20営業日で指数に勝とう', xp: 100 },
  { id: 'crash', t: '暴落を−10%以内で乗り切ろう', xp: 100 },
];
const KIND = { mkt: '成行', lmt: '指値', stp: '逆指値' };
const TAG = { macro: '経済', fx: '為替', sector: '業種', ind: '企業', rumor: 'うわさ', earn: '決算', big: '速報', deny: '訂正', div: '配当', real: '報道', realReport: '観測', realRumor: 'うわさ' };

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
  '約定': '注文が成立して、売買が実際に決まること。',
  '値幅制限': '1日に株価が動ける範囲。前日の終値をもとに決まり、急な暴騰や暴落を防ぐ。',
  'ストップ高': '値幅制限の上限まで株価が上がった状態。買いたい人が多すぎて、売り注文がほとんどない。',
  'ストップ安': '値幅制限の下限まで株価が下がった状態。売りたい人が多すぎて、買い注文がほとんどない。',
  '呼値': '注文できる値段の刻み。3,000円以下の株は1円、5,000円以下は5円、30,000円以下は10円刻み。',
  '出来高': 'その日に売買が成立した株数。多いほど注目されている。',
  'ローソク足': '一定時間の始値・高値・安値・終値を1本で表した図。終値が始値より高いと赤（陽線）、低いと緑（陰線）。',
  '移動平均線': '過去の決まった本数の終値を平均してつないだ線。株価の大きな流れ（トレンド）をつかむのに使う。',
  'PER': '株価収益率。株価が1株あたり利益の何倍かを示す。高いほど将来の成長が期待されている（または割高）。',
  'PBR': '株価純資産倍率。株価が1株あたりの純資産の何倍か。1倍を下回ると割安とされることが多い。',
  '配当': '会社が利益の一部を株主に配るお金。',
  '配当利回り': '株価に対して1年間にもらえる配当の割合。株価2,000円で配当60円なら3%。',
  '権利確定日': 'この日に株を持っていると配当を受け取れる日。このゲームでは月末の最終取引日。',
  '権利落ち': '権利確定日の翌営業日に、配当の分だけ株価が下がりやすくなること。',
  '決算': '会社が3か月ごとに業績（売上や利益）を発表すること。株価が大きく動くきっかけになる。',
  '市場予想': 'アナリストたちが予想した業績の平均。決算がこれより良いか悪いかで株価が動く。',
  '材料出尽くし': '良いニュースがすでに株価に織り込まれていて、発表されたとたんに逆に売られること。',
  '時価総額': '株価×発行済株式数。会社の規模を表す。',
  '株価指数': '市場全体の値動きを1つの数字にしたもの。このゲームのNTX225は全30社の時価総額から計算する。',
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
  '特別気配': '買いと売りのバランスが大きく崩れて、取引がすぐに成立しない状態。',
  '信頼度': 'ニュースの確かさ。★3は正式発表。★1〜2は観測記事やうわさで、外れることもある。',
};

// ヒント画面のQ&A。[質問, 答え, 豆知識（任意。3〜4個に1個くらい）]
const TIPS = [
  { name: '注文のコツ', items: [
    ['最初はどうやって買えばいい？', '最初から全部のお金を1社に使わず、何回かに分けて少しずつ買おう。値下がりしても買い増しで平均の値段を下げられる。'],
    ['成行と指値はどう使い分ける？', '急いでいなければ指値が安心。板の薄い銘柄を成行で大量に買うと、上の売り注文まで食ってしまい高く買うことになる（スリッページ）。'],
    ['寄り付き直後に買っても大丈夫？', '9:00すぐは夜のあいだのニュースが一気に反映されて値段が大きく動く。落ち着くまで待つのも作戦。', '「寄り付き」は、売り手と買い手が「寄り」集まって最初の値段が「付く」ことから来た言葉。'],
  ] },
  { name: 'リスクの抑え方', items: [
    ['値下がりしたらどうすればいい？', '買う前に「ここまで下がったら売る」を決めておこう。ランク3からは逆指値注文で自動にできる。'],
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
];
const TERM_GROUPS = [
  ['株の基本', ['株式', '証券コード', '単元株', '時価総額', '株価指数', '分散投資']],
  ['注文と取引', ['成行注文', '指値注文', '逆指値注文', '板', '約定', 'スリッページ', '特別気配', '買付余力', '手数料']],
  ['取引時間と値段のルール', ['寄り付き', '大引け', '前場・後場', '値幅制限', 'ストップ高', 'ストップ安', '呼値']],
  ['チャートと指標', ['ローソク足', '出来高', '移動平均線', 'RSI', 'ボラティリティ', 'PER', 'PBR']],
  ['配当・決算・税金', ['配当', '配当利回り', '権利確定日', '権利落ち', '決算', '市場予想', '材料出尽くし', '譲渡益課税']],
  ['損益とリスク', ['損切り', '含み損益', '最大ドローダウン', '信頼度']],
];
// 用語に添える豆知識（全部には付けない）
const TRIVIA = {
  '株式': '世界で最初の株式会社は、1602年にできたオランダ東インド会社と言われている。',
  '証券コード': '日本の証券コードは長く4桁の数字だったが、2024年からは英字の入ったコードも使われ始めた。',
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
const UI = { side: 'buy', type: 'mkt', view: 'trade', hover: null, filter: 'all', geom: null, lastNews: -1, vw: null, hcat: 'tip', tut: null };
// チャートの表示範囲。cnt = 見えるローソク足の本数、end = 右端の位置（null なら最新に追従）、yOff = 上下のずらし量（値幅に対する割合）
function resetView() { UI.vw = { '5m': { cnt: 60, end: null }, '1d': { cnt: 60, end: null }, yOff: 0 }; }
resetView();

/* ---------- 音（素材は Aseet フォルダ） ---------- */
const bgm = new Audio('Aseet/kabutore_game_bgm.mp3'); bgm.loop = true; bgm.volume = 0.4;
function playBgm() { bgm.play().catch(() => {}); }   // 自動再生がブロックされたら、次のクリックで再生する
function stopBgm() { bgm.pause(); bgm.currentTime = 0; }
// 効果音は元の mp3 を <audio> でそのまま鳴らす。3つを順番に使い、巻き戻しを待たずに連打できるようにする
const seClicks = [0, 1, 2].map(() => { const a = new Audio('Aseet/select_button.mp3'); a.preload = 'auto'; return a; });
let seIdx = 0;
function playClick() {
  const a = seClicks[seIdx++ % seClicks.length];
  // スマホ・タブレットのタイトル画面は BGM が無く目立つので小さめにする
  a.volume = titleOpen && document.documentElement.dataset.device !== 'pc' ? 0.25 : 0.6;
  a.currentTime = 0; a.play().catch(() => {});
}

function defProfile() { return { xp: 0, missions: {}, tutorial: false, best: {} }; }
function loadProfile() { try { const p = JSON.parse(localStorage.getItem('kabutore.profile')); if (p && typeof p.xp === 'number') return Object.assign(defProfile(), p); } catch (e) {} return defProfile(); }
function saveProfile() { try { localStorage.setItem('kabutore.profile', JSON.stringify(profile)); } catch (e) {} }
function rank(xp = profile.xp) { let r = 1; RANKS.forEach((k, i) => { if (xp >= k.xp) r = i + 1; }); return r; }

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
function tickSize(p) { return p <= 3000 ? 1 : p <= 5000 ? 5 : p <= 30000 ? 10 : p <= 50000 ? 50 : 100; }
function roundTick(p) { const t = tickSize(p); return Math.max(1, Math.round(p / t) * t); }
const LIMITS = [[100, 30], [200, 50], [500, 80], [700, 100], [1000, 150], [1500, 300], [2000, 400], [3000, 500], [5000, 700], [7000, 1000], [10000, 1500], [15000, 3000], [20000, 4000], [30000, 5000], [50000, 7000], [70000, 10000], [100000, 15000], [Infinity, 30000]];
function limitWidth(p) { for (const [b, w] of LIMITS) if (p < b) return w; return 30000; }

/* ===================== 銘柄の生成 ===================== */
function makeStock(d, i) {
  const [code, name, sector, price, sharesM, dy, rec, unlock, sm, desc] = d;
  const sec = SECTORS[sector];
  const sig = sec.sig * sm, beta = sec.beta * (0.85 + RNG.next() * 0.3);
  const idio = Math.sqrt(Math.max(0.05 ** 2, sig * sig - beta * beta * MKT_SIG ** 2 - sec.ss ** 2));
  const per = sec.per * (0.8 + RNG.next() * 0.45);
  const loss = code === 'K601' || code === 'K602';
  const eps = loss ? -price * 0.03 * (0.8 + RNG.next() * 0.5) : price / per;
  return {
    code, name, sector, desc, unlock, rec, shares: sharesM * 1e6, div: Math.round(price * dy),
    sig, beta, idio, mu: sec.mu, kappa: sector === 'growth' ? 0.25 : sector === 'food' ? 1.2 : 0.7,
    jump: sec.jump, jsize: sector === 'growth' ? 0.10 : 0.045,
    price, lp: Math.log(price), prevClose: price, open: price, high: price, low: price, dayVol: 0,
    V: price, h: 1, eps, bps: price / (sec.pbr * (0.8 + RNG.next() * 0.4)),
    consensus: 0, nextEarn: 6 + ((i * 7) % 54),
    minVol: Math.max(300, sharesM * 1e6 * (sector === 'growth' ? 0.012 : 0.004) / MIN_PER_DAY),
    shock: 0, gap: 0, pend: [], intraday: [], daily: [], pins: [], limUp: price, limDn: price, stop: null,
  };
}

function newGame(scen, diff, seed, cash, mode) {
  RNG.s = seed | 0; RNG.spare = null;
  const real = mode === 'real' && !!REAL;   // リアル相場は data/corona2020.js があるときだけ
  if (real) scen = 'real';
  const D = DIFF[diff], S = SCEN[scen], cash0 = cash || D.cash;   // cash はフリープレイで選んだ初期資金
  G = {
    v: 1, mode: real ? 'real' : 'random', seed, scen, diff, dayIndex: 0, date: real ? REAL.dates[0] : START_DATE, phase: 'pre', preMin: 0, minute: 0, clock: 0, speed: 1,
    sel: real ? REAL.stocks[0].code : 'K201', chartMode: '5m', mkMu: S.mu,
    market: { hM: 1, shock: 0, secShock: {}, gapM: 0, secGap: {}, idx: IDX_BASE, idxPrev: IDX_BASE, idxOpen: IDX_BASE, idxHigh: IDX_BASE, idxLow: IDX_BASE, idxDaily: [], capBase: 1, crashLeft: 0, crashMin: 0 },
    stocks: real ? REAL.stocks.map(makeRealStock) : DEFS.map(makeStock), news: [], denials: [], newsId: 0, orderSeq: 0,
    player: { cash: cash0, pos: {}, orders: [], trades: [], sells: [], realizedYear: 0, taxYear: 0, taxTotal: 0, year: real ? +REAL.dates[0].slice(0, 4) : 2026, divTotal: 0, pendingDiv: 0, hist: [], peak: cash0, maxDD: 0, dayStart: cash0, start: cash0, startIdx: 0, feesTotal: 0 },
    crashDay: -1, crashStart: 0, crashCheck: -1, div5: 0, ended: false, dayXP: 0, dayEvents: [], last: null,
  };
  if (!real) {   // 暴落イベントと決算の市場予想はランダム相場だけ
    if (S.crash) G.crashDay = 22 + Math.floor(RNG.next() * 14);
    else if (diff === 'hard' && scen !== 'month' && RNG.next() < 0.7) G.crashDay = 50 + Math.floor(RNG.next() * 150);
    for (const s of G.stocks) s.consensus = (s.eps / 4) * (1 + s.mu / 4 + RNG.normal() * 0.02);
  }
  afterLoad();
  if (real) realStart(); else genHistory();
  G.player.startIdx = G.market.idx;
  G.player.hist.push({ d: prevTD(G.date), a: cash0, idx: G.market.idx });
  startDay(true);
}
function afterLoad() { G._map = Object.fromEntries(G.stocks.map(s => [s.code, s])); }
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
    for (const s of G.stocks) {
      const pc = s.price, e = s.sig / Math.sqrt(DAYS);
      const o = roundTick(pc * Math.exp(RNG.normal() * e * 0.3));
      const c = roundTick(pc * Math.exp(s.beta * Md + Sd[s.sector] + s.idio / Math.sqrt(DAYS) * RNG.normal()));
      const h = roundTick(Math.max(o, c) * Math.exp(Math.abs(RNG.normal()) * e * 0.5));
      const l = roundTick(Math.min(o, c) * Math.exp(-Math.abs(RNG.normal()) * e * 0.5));
      s.daily.push({ d: date, di: k - 60, o, h: Math.max(h, o, c), l: Math.min(l, o, c), c, v: Math.round(s.minVol * MIN_PER_DAY * Math.exp(0.35 * RNG.normal()) / 100) * 100 });
      capO += s.shares * o; capC += s.shares * c; s.price = c;
    }
    if (k === 0) mk.capBase = capO;
    const io = IDX_BASE * capO / mk.capBase, ic = IDX_BASE * capC / mk.capBase;
    mk.idxDaily.push({ d: date, o: io, c: ic, h: Math.max(io, ic) * 1.003, l: Math.min(io, ic) * 0.997 });
  });
  for (const s of G.stocks) { s.lp = Math.log(s.price); s.prevClose = s.price; s.V = s.price * (0.93 + RNG.next() * 0.14); }
  mk.idx = mk.idxPrev = mk.idxDaily.at(-1).c;
}

/* ===================== リアル相場（data/corona2020.js の実データ） ===================== */
// 株価の数値は CORONA2020 からだけ読む。終値は実データどおり、日中の動き（始値・高値・安値・分足）は
// 「前日終値 → その日の実際の終値」を結ぶ乱数の道筋（ブラウニアン・ブリッジ）で作る
const REAL = typeof CORONA2020 !== 'undefined' && CORONA2020.dates?.length ? CORONA2020 : null;
const REAL_PX = REAL ? Object.fromEntries(REAL.stocks.map(d => [d.code, d.prices])) : {};
const REAL_IDX_BASE = 100;
// 実データの業種（東証の業種名）。SECTORS を回すランダム相場の乱数の順番を変えないよう、別の表にしておく
const REAL_SECTORS = {};
if (REAL) for (const d of REAL.stocks) REAL_SECTORS[d.sector] ||= { name: d.sector, short: d.sector };
const SEC = k => SECTORS[k] || REAL_SECTORS[k];
const isReal = () => G?.mode === 'real';
const idxName = () => (isReal() ? '30銘柄平均' : 'NTX225');
const realClose = (s, di) => REAL_PX[s.code][di];
// 当時の実際のニュース（data/news2020.js。なくても動く）。表示するだけで、株価を動かす genNews / apply 系には一切つながない。
// date（出来事・発表の日）より後の最初の営業日の寄り付き前に出す（その朝に分かっていたことだけになる）
const REAL_NEWS = {};
if (REAL && typeof NEWS2020 !== 'undefined' && Array.isArray(NEWS2020)) {
  for (const n of NEWS2020) {
    const di = REAL.dates.findIndex(d => d > n.date);
    if (di >= 0) (REAL_NEWS[di] ||= []).push(n);   // 最終営業日より後の出来事は出さない
  }
  // 一覧は新しい順に並ぶので、同じ朝の中では重要なものを後に入れて上に来るようにする
  for (const k in REAL_NEWS) REAL_NEWS[k].sort((a, b) => (a.importance || 2) - (b.importance || 2));
}
const hasRealNews = () => Object.keys(REAL_NEWS).length > 0;
const NEWS_KEEP_REAL = 400;   // リアル相場で保存・表示するニュースの上限（1年分が収まる数）
function pushRealNews() {
  const t = G.date.slice(5).split('-').map(Number).join('/') + ' 朝';
  for (const n of REAL_NEWS[G.dayIndex] || []) {
    const type = n.type === 'report' ? 'realReport' : n.type === 'rumor' ? 'realRumor' : 'real';   // 実際の報道 / 観測報道 / 当時の噂
    pushNews({ day: G.dayIndex, time: t, type, stars: 3, codes: (n.codes || []).filter(c => REAL_PX[c]), text: n.headline, body: n.body || '', imp: n.importance || 2, hint: '', flash: false });
  }
}

function makeRealStock(d) {
  const p0 = d.prices[0], price = roundTick(p0);
  let sq = 0; for (let i = 1; i < d.prices.length; i++) sq += Math.log(d.prices[i] / d.prices[i - 1]) ** 2;
  const rsig = Math.sqrt(sq / (d.prices.length - 1));   // その銘柄の1日の値動きの大きさ（日中の揺れの目安）
  return {
    code: d.code, name: d.name, sector: d.sector, desc: '2020年の実際の終値で動きます', unlock: 1, rec: [],
    shares: 1e9 / p0, div: 0,   // 株式数は実データにないので、指数が「30銘柄を同じ金額ずつ持った平均」になるようにする
    sig: rsig * Math.sqrt(DAYS), beta: 1, idio: rsig * Math.sqrt(DAYS), mu: 0, kappa: 0, jump: 0, jsize: 0, rsig, dsig: rsig,
    price, lp: Math.log(price), prevClose: price, open: price, high: price, low: price, dayVol: 0,
    V: price, h: 1, eps: 0, bps: 0, consensus: 0, nextEarn: -1,
    minVol: Math.max(300, 3e9 / p0 / MIN_PER_DAY),
    shock: 0, gap: 0, pend: [], intraday: [], daily: [], pins: [], limUp: price, limDn: price, stop: null,
  };
}
// 開始時の指数（30銘柄平均）を 100 にする。過去のチャートはない
function realStart() {
  const mk = G.market; let cap = 0; for (const s of G.stocks) cap += s.shares * s.price;
  mk.capBase = cap * IDX_BASE / REAL_IDX_BASE;
  mk.idx = mk.idxPrev = mk.idxOpen = mk.idxHigh = mk.idxLow = REAL_IDX_BASE;
}
// 値幅制限は分割調整後の値で計算するので、実際の終値がはみ出す日がある（例：ストップ高の日）。その日は終値まで広げる
function realLimits(s) {
  const c = roundTick(realClose(s, G.dayIndex));
  s.limUp = Math.max(s.limUp, c); s.limDn = Math.min(s.limDn, c);
}
function realOpen(s) {
  const p0 = Math.log(s.prevClose), T = Math.log(realClose(s, G.dayIndex));
  s.dsig = Math.max(s.rsig * 0.7, Math.abs(T - p0) * 0.5);
  setPrice(s, p0 + (T - p0) * 0.35 + s.dsig * 0.3 * RNG.normal());
}
/** 1分ぶんの動き。残り n 分で実際の終値 T に着くように引き寄せつつ揺らす（最後の1分でちょうど T） */
function realStep(s, im) {
  const n = MIN_PER_DAY - G.minute, T = Math.log(realClose(s, G.dayIndex));
  const eps1 = s.dsig / Math.sqrt(MIN_PER_DAY) * im;
  const r = n <= 1 ? T - s.lp : (T - s.lp) / n + eps1 * Math.sqrt((n - 1) / n) * RNG.normal();
  return { r, eps1 };
}

/* ===================== 株価エンジン ===================== */
function setPrice(s, lp) {
  lp = clamp(lp, Math.log(s.limDn), Math.log(s.limUp));
  s.lp = lp;
  s.price = clamp(roundTick(Math.exp(lp)), s.limDn, s.limUp);
  s.stop = s.price >= s.limUp ? 'up' : s.price <= s.limDn ? 'down' : null;
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
  for (const s of G.stocks) {
    const prev = s.price;
    const eps1 = s.idio * Math.sqrt(s.h * DT) * im * dv;
    let e = eps1 * RNG.normal();
    if (RNG.next() < s.jump * DT) e += RNG.normal() * s.jsize;                    // ジャンプ
    s.dayZ = (s.dayZ || 0) + e;
    let r = s.mu * DT + s.beta * M + S[s.sector] + e + s.kappa * Math.log(s.V / prev) * DT;
    if (s.pend.length) { for (const p of s.pend) { const a = p.left * 0.035; r += a; p.left -= a; } s.pend = s.pend.filter(p => Math.abs(p.left) > 2e-4); }
    r += s.shock; s.shock = 0;
    setPrice(s, s.lp + r);
    minuteBar(s, prev, r, eps1);
  }
  updateIndex(false);
  processOrders();
  // うわさの否定
  for (const dn of [...G.denials]) if (dn.at <= G.clock) { G.denials.splice(G.denials.indexOf(dn), 1); denyNews(dn); }
  maybeNews();
}
// リアル相場の1分：実データの終値へ向かうだけ。作りもののニュースは流さない
function stepMinuteReal(im) {
  for (const s of G.stocks) {
    const prev = s.price, { r, eps1 } = realStep(s, im);
    setPrice(s, s.lp + r);
    if (G.minute === MIN_PER_DAY - 1) {   // 最後の1分は、丸めの誤差で1刻みずれないよう実データの終値をそのまま使う
      s.price = roundTick(realClose(s, G.dayIndex));
      s.stop = s.price >= s.limUp ? 'up' : s.price <= s.limDn ? 'down' : null;
    }
    minuteBar(s, prev, r, eps1);
  }
  updateIndex(false);
  processOrders();
}
/** 1分足（高値・安値・出来高）を記録する */
function minuteBar(s, prev, r, eps1) {
  const late = G.minute >= 270, early = G.minute < 30;
  const o = prev, c = s.price;
  const ext = Math.abs(RNG.normal()) * eps1 * 0.6 * prev;
  const hi = Math.max(o, c, Math.min(s.limUp, roundTick(Math.max(o, c) + ext)));
  const lo = Math.min(o, c, Math.max(s.limDn, roundTick(Math.min(o, c) - ext)));
  const v = Math.max(100, Math.round(s.minVol * (early || late ? 1.9 : 0.78) * (1 + Math.abs(r) / (eps1 + 1e-9) * 0.25) * Math.exp(0.4 * RNG.normal()) / 100) * 100);
  s.intraday.push({ o, h: hi, l: lo, c, v });
  s.high = Math.max(s.high, hi); s.low = Math.min(s.low, lo); s.dayVol += v;
}

/* ===================== ニュース ===================== */
function unlockedStocks() { const r = rank(); return G.stocks.filter(s => s.unlock <= r); }
function pushNews(item) {
  // リアル相場は1年分（約200件）の当時のニュースを全部残す。ランダム相場は今までどおり120件
  item.id = ++G.newsId; G.news.push(item); if (G.news.length > (isReal() ? NEWS_KEEP_REAL : 120)) G.news.shift();
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
  for (const s of G.stocks) if (s.sector === k) {
    if (mode !== 'gap') s.pend.push({ left: 0.4 * imp });
    if (real) s.V *= Math.exp(0.5 * imp);
    if (Math.abs(imp) >= 0.01) pinFor(s, imp, mode);
  }
}
function applyMarket(imp, mode) {
  const mk = G.market;
  if (mode === 'gap') mk.gapM += imp;
  else { mk.shock += 0.6 * imp; for (const s of G.stocks) s.pend.push({ left: 0.4 * imp * s.beta }); }
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
  pushNews(item);
  return item;
}
function denyNews(dn) {
  const s = byCode(dn.code); const imp = -0.8 * dn.imp;
  applyStock(s, imp, 'live', false);
  pushNews({ day: G.dayIndex, time: minLabel(G.minute), type: 'deny', stars: 3, codes: [s.code], text: `${s.name}が一部の報道について「当社が発表したものではない」とコメント`, hint: `${arrow(imp)}${s.name}`, flash: false });
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
  G.phase = 'pre'; G.preMin = 0; G.minute = 0; G.dayXP = 0; G.dayEvents = [];
  resetView();   // 日が変わったらチャートは最新の位置に戻す
  const y = +G.date.slice(0, 4); if (y !== P.year) { P.year = y; P.realizedYear = 0; P.taxYear = 0; }
  if (!first) { for (const s of G.stocks) s.prevClose = s.price; mk.idxPrev = mk.idx; }   // 前日の終値を確定
  for (const s of G.stocks) {
    const w = limitWidth(s.prevClose);
    s.limUp = s.prevClose + w; s.limDn = Math.max(1, s.prevClose - w);
    s.intraday = []; s.price = s.open = s.high = s.low = s.prevClose; s.lp = Math.log(s.price); s.dayVol = 0; s.stop = null;
    if (isReal()) realLimits(s);
  }
  mk.idx = mk.idxPrev;
  if (P.pendingDiv > 0) {
    const net = DIFF[G.diff].tax ? P.pendingDiv * (1 - TAX) : P.pendingDiv;
    P.cash += net; P.divTotal += net; P.pendingDiv = 0;
    pushNews({ day: G.dayIndex, time: '8:00', type: 'div', stars: 3, codes: [], text: `配当金 ${yen(net)}円が入金されました（実際の株では約3か月後に入金されます）`, hint: '' });
    complete('div');
  }
  if (!first && !isReal()) {
    const x = RNG.next(), n = x < 0.45 ? 0 : x < 0.85 ? 1 : 2;
    for (let i = 0; i < n; i++) genNews('gap');
  }
  if (isReal()) pushRealNews();
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
  if (isReal()) for (const s of G.stocks) { realOpen(s); s.open = s.high = s.low = s.price; }
  else openGaps();
  G.phase = 'open'; G.minute = 0;
  updateIndex(true);
  for (const o of [...G.player.orders]) if (o.type === 'mkt') { removeOrder(o); marketTrade(byCode(o.code), o.side, o.qty, 'mkt'); }
  toast('9:00 寄り付き。取引が始まりました');
}
// ランダム相場の寄り付き：夜のあいだのニュースと揺れで窓を開ける
function openGaps() {
  const mk = G.market;
  const gM = mk.gapM + MKT_SIG * Math.sqrt(mk.hM / DAYS) * 0.35 * RNG.normal(); mk.gapM = 0;
  const gS = {}; for (const k in SECTORS) { gS[k] = (mk.secGap[k] || 0) + SECTORS[k].ss / Math.sqrt(DAYS) * 0.3 * RNG.normal(); mk.secGap[k] = 0; }
  for (const s of G.stocks) {
    const r = s.beta * gM + gS[s.sector] + s.idio * Math.sqrt(s.h / DAYS) * 0.35 * RNG.normal() + s.gap; s.gap = 0;
    setPrice(s, Math.log(s.prevClose) + r);
    s.open = s.high = s.low = s.price;
  }
}
function lunchBreak() {
  const mk = G.market;
  if (!isReal()) {
    mk.shock += MKT_SIG * Math.sqrt(mk.hM / DAYS) * 0.1 * RNG.normal();
    for (const s of G.stocks) s.shock += s.idio * Math.sqrt(s.h / DAYS) * 0.12 * RNG.normal();
  }
  toast('11:30 昼休み。12:30から後場が始まります');
}

function tick() {
  if (G.phase === 'pre') { G.preMin++; if (G.preMin >= 60) openMarket(); return; }
  if (G.phase !== 'open') return;
  stepMinute(); G.minute++; G.clock++;
  if (G.minute === 150) lunchBreak();
  if (G.minute >= MIN_PER_DAY) closeMarket();
}

function lastTradingDayOfMonth(iso) { return monthOf(nextTD(iso)) !== monthOf(iso); }

function closeMarket() {
  G.phase = 'closed';
  const mk = G.market, P = G.player, D = DIFF[G.diff];
  const r0 = rank();
  // 日足と、ボラティリティの更新（GARCH型）
  for (const s of G.stocks) {
    s.daily.push({ d: G.date, di: G.dayIndex, o: s.open, h: s.high, l: s.low, c: s.price, v: s.dayVol });
    if (s.daily.length > 320) s.daily.shift();
    const z = (s.dayZ || 0) / (s.idio * D.vol / Math.sqrt(DAYS)); s.dayZ = 0;   // 大きく動いた翌日ほど荒れやすい
    s.h = clamp(0.04 + 0.06 * z * z + 0.90 * s.h, 0.4, 3);
    s.V *= Math.exp(s.mu / DAYS);
  }
  const zM = (mk.dayZ || 0) / (MKT_SIG * D.vol / Math.sqrt(DAYS)); mk.dayZ = 0;
  mk.hM = clamp(0.04 + 0.06 * zM * zM + 0.90 * mk.hM, 0.4, mk.hM > 3 ? 5 : 3);
  mk.idxDaily.push({ d: G.date, o: mk.idxOpen, h: mk.idxHigh, l: mk.idxLow, c: mk.idx });
  if (mk.idxDaily.length > 320) mk.idxDaily.shift();
  // 失効
  if (P.orders.length) { G.dayEvents.push(`未約定の注文${P.orders.length}件は、当日限りのため大引けで失効しました`); P.orders = []; }
  // 決算発表（引け後）
  for (const s of G.stocks) {
    if (s.nextEarn !== G.dayIndex) continue;
    const cons = s.consensus, sd = s.sector === 'growth' ? 0.2 : 0.06;
    const act = cons + Math.abs(cons) * RNG.normal() * sd;
    const sur = (act - cons) / Math.abs(cons);
    const imp = clamp(sur * (s.sector === 'growth' ? 0.4 : 0.6) - 0.005 + RNG.normal() * 0.01, -0.15, 0.15);
    s.gap += imp; s.V *= Math.exp(imp * 0.8);
    s.eps = s.eps + (act - cons) * 2;
    const word = sur > 0.03 ? `予想を${Math.round(sur * 100)}%上回る` : sur < -0.03 ? `予想を${Math.round(-sur * 100)}%下回る` : 'ほぼ予想通り';
    pushNews({ day: G.dayIndex, time: '15:30', type: 'earn', stars: 3, codes: [s.code], text: `決算：${s.name}の四半期の1株利益は${act.toFixed(1)}円（市場予想${cons.toFixed(1)}円）。${word}`, hint: `明日の寄り付き${arrow(imp)}`, flash: Math.abs(imp) > 0.05 });
    s.pins.push({ d: G.dayIndex + 1, m: 0, dir: Math.sign(imp) });
    if (P.pos[s.code]) { G.dayEvents.push(`保有中の${s.name}が決算を発表（${word}）。明日の寄り付きで株価に反映されます`); complete('earn'); }
    s.consensus = (s.eps / 4) * (1 + s.mu / 4 + RNG.normal() * 0.02);
    s.nextEarn += 60;
  }
  // 配当の権利確定
  if (lastTradingDayOfMonth(G.date)) {
    const mo = monthOf(G.date);
    for (const s of G.stocks) {
      if (!s.div || !s.rec.includes(mo)) continue;
      const per = s.div / s.rec.length;
      const q = P.pos[s.code]?.qty || 0;
      if (q > 0) { P.pendingDiv += q * per; G.dayEvents.push(`${s.name}の権利確定日。${q}株×${per}円＝${yen(q * per)}円の配当の権利を得ました（明日入金）`); }
      s.gap += Math.log(1 - per / s.price);   // 権利落ち
      s.V *= 1 - per / s.price;
    }
  }
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
  if (secs.size >= 5) { G.div5++; if (G.div5 === 5) addXP(20, '5業種以上に分散して1週間保有'); } else G.div5 = 0;
  if (a / P.start - 1 >= 0.10) complete('plus10');
  const done = G.dayIndex + 1;
  if (done === 20 && a / P.start > mk.idx / P.startIdx) complete('beat');
  if (G.crashCheck === G.dayIndex && a >= G.crashStart * 0.9) complete('crash');
  const S = SCEN[G.scen];
  if (S.days && done >= S.days) G.ended = true;
  G.last.xp = G.dayXP; G.last.events = [...G.dayEvents]; G.last.rankUp = rank() > r0;
  saveGame();
  saveProfile();
  render();
  dailyReport();
}

function nextDay() {
  G.dayIndex++; G.date = isReal() ? REAL.dates[G.dayIndex] : nextTD(G.date);
  startDay(false);
  saveGame();
  render();
}

/* ===================== 売買 ===================== */
function asset() { const P = G.player; let v = P.cash; for (const c in P.pos) v += P.pos[c].qty * byCode(c).price; return v; }
function reservedCash() { return G.player.orders.reduce((a, o) => a + (o.reserve || 0), 0); }
function availCash() { return G.player.cash - reservedCash(); }
function availShares(code) { const q = G.player.pos[code]?.qty || 0; return q - G.player.orders.filter(o => o.code === code && o.side === 'sell').reduce((a, o) => a + o.qty, 0); }
function removeOrder(o) { const i = G.player.orders.indexOf(o); if (i >= 0) G.player.orders.splice(i, 1); }

/** 板（仮想トレーダーの注文）。同じ分の間は同じ形 */
function book(s) {
  const t = tickSize(s.price), key = `${s.code}:${G.dayIndex}:${G.minute}:${G.phase}`;
  const asks = [], bids = [];
  for (let k = 0; k < 8; k++) {
    const pa = roundTick(s.price + (k + 1) * t), pb = roundTick(s.price - k * t);
    const qa = Math.max(100, Math.round(s.minVol * (0.5 + 2.2 * hash01(key + 'a' + k)) * (1 + k * 0.18) / 100) * 100);
    const qb = Math.max(100, Math.round(s.minVol * (0.5 + 2.2 * hash01(key + 'b' + k)) * (1 + k * 0.18) / 100) * 100);
    if (pa <= s.limUp && s.stop !== 'up') asks.push({ p: pa, q: qa });
    if (pb >= s.limDn && s.stop !== 'down') bids.push({ p: pb, q: qb });
  }
  return { asks, bids };
}
/** 成行で板を上から順に食っていく */
function walk(s, side, qty) {
  const { asks, bids } = book(s); const lv = side === 'buy' ? asks : bids;
  let rem = qty, gross = 0, last = s.price;
  for (const l of lv) { const q = Math.min(rem, l.q); gross += q * l.p; rem -= q; last = l.p; if (!rem) break; }
  let guard = 0;
  while (rem > 0 && guard++ < 1000) {
    const t = tickSize(last);
    last = side === 'buy' ? Math.min(s.limUp, last + t) : Math.max(s.limDn, last - t);
    const q = Math.min(rem, Math.max(100, Math.round(s.minVol / 100) * 100));
    gross += q * last; rem -= q;
  }
  return { gross, avg: gross / qty, last };
}

function fill(s, side, qty, gross, avgPx, kind) {
  const P = G.player, D = DIFF[G.diff];
  const fee = Math.round(gross * D.fee);
  if (side === 'buy') {
    P.cash -= gross + fee;
    const p = P.pos[s.code] || { qty: 0, avg: 0 };
    p.avg = (p.avg * p.qty + gross + fee) / (p.qty + qty); p.qty += qty; P.pos[s.code] = p;
  } else {
    const p = P.pos[s.code]; const cost = p.avg * qty, proceeds = gross - fee, pnl = proceeds - cost;
    P.cash += proceeds; p.qty -= qty; if (p.qty <= 0) delete P.pos[s.code];
    P.sells.push({ code: s.code, name: s.name, pnl, pct: pnl / cost, d: G.date, buyAvg: cost / qty, sellAvg: avgPx, qty });
    if (D.tax) { P.realizedYear += pnl; const due = Math.max(0, P.realizedYear) * TAX; const delta = due - P.taxYear; P.cash -= delta; P.taxYear = due; P.taxTotal += delta; }
    if (pnl > 0) complete('profit');
  }
  P.feesTotal += fee;
  P.trades.push({ code: s.code, side, qty, px: avgPx, d: G.dayIndex, m: G.minute, kind });
  if (P.trades.length > 400) P.trades.shift();
  toast(`${s.name} ${qty.toLocaleString()}株を ${px(avgPx)}円で${side === 'buy' ? '買いました' : '売りました'}（${KIND[kind]}）`);
  if (side === 'buy') complete('buy');
}

function marketTrade(s, side, qty, kind) {
  if (side === 'buy' && s.stop === 'up') { toast(`${s.name}はストップ高のため、買い注文が約定しませんでした`, 'warn'); return false; }
  if (side === 'sell' && s.stop === 'down') { toast(`${s.name}はストップ安のため、売り注文が約定しませんでした`, 'warn'); return false; }
  let w = walk(s, side, qty), fee = Math.round(w.gross * DIFF[G.diff].fee);
  // 寄り付きなどで値上がりして足りなくなったら、買える株数まで減らす
  while (side === 'buy' && qty > 100 && w.gross + fee > availCash() + 0.5) { qty -= 100; w = walk(s, side, qty); fee = Math.round(w.gross * DIFF[G.diff].fee); }
  if (side === 'buy' && w.gross + fee > availCash() + 0.5) { toast(`お金が足りないため、${s.name}の買い注文を取り消しました`, 'warn'); return false; }
  if (side === 'sell' && qty > availShares(s.code)) { toast('売れる株数が足りません', 'warn'); return false; }
  fill(s, side, qty, w.gross, w.avg, kind);
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
      if (o.side === 'buy' && c.l <= o.price && s.stop !== 'up') { removeOrder(o); const p = Math.min(o.price, c.o); fill(s, 'buy', o.qty, p * o.qty, p, 'lmt'); complete('limit'); }
      else if (o.side === 'sell' && c.h >= o.price && s.stop !== 'down') { removeOrder(o); const p = Math.max(o.price, c.o); fill(s, 'sell', o.qty, p * o.qty, p, 'lmt'); complete('limit'); }
    } else if (o.type === 'stp') {
      if (o.side === 'sell' && c.l <= o.price) {
        removeOrder(o);
        if (marketTrade(s, 'sell', o.qty, 'stp')) {
          const last = P.sells.at(-1);
          complete('stop');
          if (last && last.pct < 0 && last.pct >= -0.05) addXP(15, '損失を5%以内に抑えた損切り');
        }
      } else if (o.side === 'buy' && c.h >= o.price) { removeOrder(o); marketTrade(s, 'buy', o.qty, 'stp'); }
    }
  }
}

/* ===================== 経験値・ミッション ===================== */
function addXP(n, why, quiet) {
  const before = rank(); profile.xp += n; if (G) G.dayXP += n;
  if (!quiet) toast(`+${n} XP　${why}`, 'xp');
  const after = rank();
  if (after > before) {
    const R = RANKS[after - 1];
    toast(`ランクアップ！「${R.n}」に昇格。${R.unlock}が使えます`, 'rank');
    if (G) G.dayEvents.push(`ランク${after}「${R.n}」に昇格。${R.unlock}が使えるようになりました`);
    if (G) { buildTypes(); buildFilter(); }
  }
  saveProfile();
}
function complete(id) {
  if (profile.missions[id]) return;
  const m = MISSIONS.find(x => x.id === id); if (!m) return;
  profile.missions[id] = true;
  toast(`ミッション達成：${m.t}（+${m.xp} XP）`, 'mission');
  addXP(m.xp, 'ミッション達成', true);
}

/* ===================== 保存 ===================== */
function saveGame() {
  try {
    G.rng = { s: RNG.s, spare: RNG.spare };
    localStorage.setItem('kabutore.save', JSON.stringify(G, (k, v) => (k === '_map' ? undefined : k === 'intraday' ? [] : v)));
  } catch (e) {}
}
function loadSave() { try { const g = JSON.parse(localStorage.getItem('kabutore.save')); if (g && g.v === 1 && !g.ended && (g.mode !== 'real' || REAL)) return g; } catch (e) {} return null; }
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
  return { up: g('--up'), down: g('--down'), ink: g('--ink'), muted: g('--muted'), line: g('--line'), accent: g('--accent'), warn: g('--warn'), panel: g('--panel'), on: g('--on-signal'), num: g('--f-num'), body: g('--f-body') };
}

function buildTape() {
  const items = unlockedStocks().map(s => `<span class="tk" data-code="${s.code}"><b>${esc(s.name)}</b><span class="num tp">${yen(s.price)}</span><span class="num tc flat">±0.00%</span></span>`).join('');
  $('#tape').innerHTML = `<span>${items}</span><span>${items}</span>`;
  updateTape();
}
function updateTape() {
  for (const el of $$('#tape .tk')) {
    const s = byCode(el.dataset.code); const ch = s.price / s.prevClose - 1;
    el.querySelector('.tp').textContent = yen(s.price);
    const c = el.querySelector('.tc'); c.textContent = pctS(ch); c.className = 'num tc ' + cls(ch);
  }
}

function render() {
  if (!G) return;
  renderHeader(); updateTape();
  if (UI.view === 'trade') { renderList(); renderChartHead(); drawChart(); renderBoard(); renderOrderPanel(); renderNews(); }
  else if (UI.view === 'hold') renderHold();
  else if (UI.view === 'cal') renderCal();
  else if (UI.view === 'mission') renderMissions();
}

function renderHeader() {
  $('#h-date').textContent = dateLabel(G.date) + `　${SCEN[G.scen].days ? `${Math.min(G.dayIndex + 1, SCEN[G.scen].days)}/${SCEN[G.scen].days}日目` : `${G.dayIndex + 1}日目`}`;
  $('#h-time').textContent = timeLabel();
  $('.exch').textContent = isReal() ? '東証 2020年の実データ' : 'NTX ネオ東京証券取引所';
  $('#h-idx-name').textContent = idxName();
  const ph = $('#h-phase'); ph.textContent = phaseLabel(); ph.dataset.phase = G.phase;
  const a = asset(), d = a - G.player.dayStart;
  $('#h-asset').textContent = yen(a) + '円';
  const hd = $('#h-day'); hd.textContent = `${yenS(d)}円（${pctS(d / G.player.dayStart)}）`; hd.className = 'num ' + cls(d);
  const mk = G.market, ic = mk.idx / mk.idxPrev - 1;
  $('#h-idx').innerHTML = `${mk.idx.toLocaleString('ja-JP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span class="${cls(ic)}">${pctS(ic)}</span>`;
  const r = rank(); $('#h-rank').innerHTML = `<span class="rk">R${r}</span>${RANKS[r - 1].n}`;
  $$('.speed button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.speed === G.speed)));
  $('#skip-btn').textContent = G.phase === 'pre' ? '9:00まで進める' : G.phase === 'open' ? '大引けまで進める' : '1日のまとめを見る';
}

function buildFilter() {
  const r = rank(); const keys = Object.keys(isReal() ? REAL_SECTORS : SECTORS).filter(k => G.stocks.some(s => s.sector === k && s.unlock <= r));
  if (UI.filter !== 'all' && !keys.includes(UI.filter)) UI.filter = 'all';
  $('#sec-filter').innerHTML = `<option value="all">すべての業種</option>` + keys.map(k => `<option value="${k}"${UI.filter === k ? ' selected' : ''}>${SEC(k).name}</option>`).join('');
}
function renderList() {
  const r = rank(), P = G.player;
  const items = G.stocks.filter(s => s.unlock <= r && (UI.filter === 'all' || s.sector === UI.filter));
  $('#stock-list').innerHTML = items.map(s => {
    const ch = s.price / s.prevClose - 1;
    return `<button class="row${s.code === G.sel ? ' sel' : ''}" data-code="${s.code}" aria-pressed="${s.code === G.sel}">
      <span class="r-name"><span>${P.pos[s.code] ? '<i class="held" title="保有中"></i>' : ''}${esc(s.name)}</span><small>${s.code}・${SEC(s.sector).short}</small></span>
      <span class="r-px num">${s.stop ? `<em class="stop ${s.stop}">${s.stop === 'up' ? 'S高' : 'S安'}</em> ` : ''}${yen(s.price)}</span>
      <span class="r-ch num ${cls(ch)}">${pctS(ch)}</span></button>`;
  }).join('');
  const locked = G.stocks.filter(s => s.unlock > r).length;
  $('#list-foot').textContent = locked ? `ほかに${locked}銘柄あります。ランク${r + 1}で${G.stocks.filter(s => s.unlock === r + 1).length}銘柄が解放されます。` : '全30銘柄が解放されています。';
}

function rsi(closes, n = 14) {
  if (closes.length <= n) return null;
  let g = 0, l = 0; for (let i = closes.length - n; i < closes.length; i++) { const d = closes[i] - closes[i - 1]; if (d > 0) g += d; else l -= d; }
  return l === 0 ? 100 : 100 - 100 / (1 + g / l);
}
function renderChartHead() {
  const s = sel(), ch = s.price - s.prevClose, r = rank();
  $('#c-name').innerHTML = `${esc(s.name)}<span class="code num">${s.code}</span>`;
  $('#c-meta').textContent = `${SEC(s.sector).name}｜${s.desc}`;
  $('#c-price').innerHTML = `${yen(s.price)}<small>円</small>${s.stop ? ` <em class="stop ${s.stop}">${s.stop === 'up' ? 'ストップ高' : 'ストップ安'}</em>` : ''}`;
  const cp = $('#c-chg'); cp.textContent = `前日比 ${yenS(ch)}円（${pctS(ch / s.prevClose)}）`; cp.className = 'num ' + cls(ch);
  $$('[data-cm]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cm === G.chartMode)));
  const f = (k, v) => `<div><dt>${k}</dt><dd class="num">${v}</dd></div>`;
  const closes = s.daily.map(d => d.c); if (G.phase === 'open') closes.push(s.price);
  const rv = rsi(closes);
  if (isReal()) {   // 実データは終値だけなので、株式数・利益・配当にもとづく数字は出さない
    $('#facts').innerHTML = f(term('出来高'), s.dayVol.toLocaleString('ja-JP') + '株') + f(term('値幅制限'), `${yen(s.limDn)}〜${yen(s.limUp)}`)
      + f('始値／高値／安値', G.phase === 'pre' ? '—' : `${yen(s.open)}／${yen(s.high)}／${yen(s.low)}`) + (r >= 4 ? f(term('RSI') + '（14日）', rv == null ? '—' : rv.toFixed(0)) : '');
    return;
  }
  let html = f(term('時価総額'), fmtCap(s.shares * s.price))
    + f(term('PER'), s.eps > 0 ? (s.price / s.eps).toFixed(1) + '倍' : '赤字のため—')
    + f(term('PBR'), (s.price / s.bps).toFixed(2) + '倍')
    + f(term('配当利回り'), s.div ? (s.div / s.price * 100).toFixed(2) + '%' : 'なし')
    + f(term('出来高'), s.dayVol.toLocaleString('ja-JP') + '株')
    + f(term('値幅制限'), `${yen(s.limDn)}〜${yen(s.limUp)}`)
    + f('始値／高値／安値', G.phase === 'pre' ? '—' : `${yen(s.open)}／${yen(s.high)}／${yen(s.low)}`);
  if (r >= 4) {
    html += f('次の' + term('決算'), mdLabel(addTD(G.date, s.nextEarn - G.dayIndex)) + ` 予想${s.consensus.toFixed(1)}円`);
    html += f(term('RSI') + '（14日）', rv == null ? '—' : rv.toFixed(0));
  }
  $('#facts').innerHTML = html;
}

function sma(a, n) { const out = []; let sum = 0; for (let i = 0; i < a.length; i++) { sum += a[i]; if (i >= n) sum -= a[i - n]; out.push(i >= n - 1 ? sum / n : null); } return out; }
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
    return { cs, total: 60, ma, pins, marks, ref: s.prevClose, mode: '5m' };
  }
  const all = s.daily.map(x => ({ ...x, lab: mdLabel(x.d) }));
  if (G.phase === 'open' && s.intraday.length) all.push({ o: s.open, h: s.high, l: s.low, c: s.price, v: s.dayVol, lab: mdLabel(G.date) + '（今日）', di: G.dayIndex });
  const cs = all, closes = all.map(x => x.c);
  const ma = r >= 3 ? [{ v: sma(closes, 5), name: '5日移動平均' }, { v: sma(closes, 25), name: '25日移動平均' }] : [];
  const idxOf = di => cs.findIndex(c => c.di === di);
  const pins = s.pins.map(p => ({ i: idxOf(p.d), dir: p.dir })).filter(p => p.i >= 0);
  const marks = P.trades.filter(t => t.code === s.code).map(t => ({ i: idxOf(t.d), side: t.side })).filter(m => m.i >= 0);
  return { cs, total: cs.length, ma, pins, marks, ref: null, mode: '1d' };
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
  let lo = Infinity, hi = -Infinity;
  for (let i = i0; i < i1; i++) { const c = D.cs[i]; lo = Math.min(lo, c.l); hi = Math.max(hi, c.h); }
  D.ma.forEach(m => { for (let i = i0; i < i1; i++) { const v = m.v[i]; if (v != null) { lo = Math.min(lo, v); hi = Math.max(hi, v); } } });
  if (D.ref) { lo = Math.min(lo, D.ref); hi = Math.max(hi, D.ref); }
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
  const step = niceStep((hi - lo) / 5);
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
  D.cs.forEach((c, i) => {
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
  // 現在値のタグ（範囲外なら上端・下端に寄せる）
  if (D.cs.length) {
    const last = D.cs.at(-1).c, y = clamp(Y(last), padT + 9, padT + prH - 9);
    ctx.fillStyle = s.price >= s.prevClose ? C.up : C.down; ctx.fillRect(padL + pw + 2, y - 9, padR - 4, 18);
    ctx.fillStyle = C.on; ctx.textAlign = 'left'; ctx.fillText(Math.round(last).toLocaleString('ja-JP'), padL + pw + 6, y);
  }
  // 横軸
  ctx.fillStyle = C.muted; ctx.textAlign = 'center'; ctx.font = `10.5px ${C.num}`;
  const inX = x => x >= padL + 16 && x <= padL + pw - 16;
  if (D.mode === '5m') { const k = 6 * Math.ceil(64 / (6 * slotW)); for (let i = 0; i < 60; i += k) if (inX(X(i))) ctx.fillText(minLabel(i * 5), X(i), H - 8); }
  else { const k = Math.max(1, Math.ceil(64 / slotW)); for (let i = D.cs.length - 1; i >= 0; i -= k) if (inX(X(i))) ctx.fillText(D.cs[i].lab.replace(/（.*$/, ''), X(i), H - 8); }
  if (D.mode === '5m' && inX(padL + (30 - s0) * slotW)) { const x = padL + (30 - s0) * slotW; ctx.strokeStyle = C.line; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + ph); ctx.stroke(); ctx.setLineDash([]); }
  // カーソル
  if (UI.hover != null && D.cs[UI.hover]) { const x = Math.round(X(UI.hover)) + 0.5; ctx.strokeStyle = C.muted; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + ph); ctx.stroke(); ctx.setLineDash([]); }
  if (!D.cs.length) { ctx.fillStyle = C.muted; ctx.textAlign = 'center'; ctx.font = `13px ${C.body}`; ctx.fillText(G.phase === 'pre' ? '寄り付き前です。9:00から株価が動き始めます。' : 'データがありません', padL + pw / 2, padT + prH / 2); }
  UI.geom = { padL, pw, prH, slotW, s0, cnt, follow, n: D.cs.length, mode: D.mode };
  const c = D.cs[UI.hover ?? D.cs.length - 1];
  $('#ohlc').textContent = c ? `${c.lab}　始${yen(c.o)}　高${yen(c.h)}　安${yen(c.l)}　終${yen(c.c)}　出来高${c.v.toLocaleString('ja-JP')}株` : '';
  $('#legend').innerHTML = D.ma.map((m, k) => `<span><i style="background:var(${k ? '--warn' : '--accent'})"></i>${m.name}</span>`).join('')
    + `<span><i style="background:var(--up);height:7px;width:7px;border-radius:50%"></i>ニュース</span><span>▲▼ 自分の売買</span><span class="muted">ドラッグで移動・ホイールで拡大縮小</span>`
    + (rank() < 3 ? `<span>移動平均線はランク3で解放</span>` : '');
}

function renderBoard() {
  const el = $('#board');
  if (rank() < 2) { el.innerHTML = `<div class="locked"><b>ランク2で解放</b><p>板は、売りたい人と買いたい人の注文が値段ごとに並んだ表です。</p></div>`; return; }
  const s = sel(), { asks, bids } = book(s);
  const pre = G.phase === 'pre';
  const btn = p => `<button data-px="${p}">${yen(p)}</button>`;
  let rows = asks.slice().reverse().map(a => `<tr><td class="q qa">${a.q.toLocaleString('ja-JP')}</td><td class="p">${btn(a.p)}</td><td class="q"></td></tr>`).join('');
  if (!asks.length) rows += `<tr><td colspan="3" class="p">売り注文なし（${term('特別気配')}）</td></tr>`;
  rows += bids.map((b, i) => `<tr${i === 0 ? ' class="cur"' : ''}><td class="q"></td><td class="p">${btn(b.p)}</td><td class="q qb">${b.q.toLocaleString('ja-JP')}</td></tr>`).join('');
  if (!bids.length) rows += `<tr><td colspan="3" class="p">買い注文なし（${term('特別気配')}）</td></tr>`;
  el.innerHTML = `<table class="board"><thead><tr><th>売数量</th><th>値段</th><th>買数量</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="board-note">${pre ? '寄り付き前は前日終値のまわりに注文が並んでいます。' : `色付きの行が今の値段。成行で${term('約定')}するときは、上（買い）や下（売り）の注文から順に取引します。`}</p>`;
}

const TYPE_RANK = { mkt: 1, lmt: 2, stp: 3 };
const LOCK_SVG = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="8" rx="1.5" fill="currentColor"/><path d="M5.2 7V5a2.8 2.8 0 0 1 5.6 0v2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
function buildTypes() {
  const r = rank(), need = TYPE_RANK;
  if (need[UI.type] > r) UI.type = 'mkt';
  $('#o-types').innerHTML = ['mkt', 'lmt', 'stp'].map(t => need[t] > r
    ? `<button data-type="${t}" class="locked" aria-disabled="true" aria-label="${KIND[t]}（ランク${need[t]}で解放）">${LOCK_SVG}<span>${KIND[t]}</span></button>`
    : `<button data-type="${t}" aria-pressed="${UI.type === t}">${KIND[t]}</button>`).join('');
}
function orderEstimate() {
  const s = sel(), D = DIFF[G.diff];
  const qty = Math.max(0, Math.round((+$('#o-qty').value || 0) / 100) * 100);
  let p;
  if (UI.type === 'mkt') p = G.phase === 'open' && qty ? walk(s, UI.side, qty).avg : s.price;
  else p = roundTick(+$('#o-price').value || s.price);
  const gross = p * qty, fee = Math.round(gross * D.fee);
  return { qty, p, gross, fee };
}
function renderOrderPanel() {
  const s = sel(), P = G.player, D = DIFF[G.diff];
  $('#o-name').textContent = s.name; $('#o-cur').textContent = yen(s.price) + '円';
  $$('[data-side]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.side === UI.side)));
  $$('#o-types button:not(.locked)').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.type === UI.type)));
  const pf = $('#o-price-field'); pf.hidden = UI.type === 'mkt';
  $('#o-price-lab').innerHTML = UI.type === 'lmt' ? `${term('指値注文', '指値')}（円）：${UI.side === 'buy' ? 'この値段以下で買う' : 'この値段以上で売る'}` : `${term('逆指値注文', '逆指値')}（円）：${UI.side === 'buy' ? 'ここまで上がったら買う' : 'ここまで下がったら売る'}`;
  const e = orderEstimate(), pos = P.pos[s.code];
  const lines = [
    ['値段の目安', e.qty ? px(Math.round(e.p * 10) / 10) + '円' : '—'],
    ['概算金額', yen(e.gross) + '円'],
  ];
  if (D.fee) lines.push([term('手数料'), yen(e.fee) + '円']);
  if (UI.side === 'buy') lines.push([term('買付余力'), yen(availCash()) + '円']);
  else lines.push(['売れる株数', availShares(s.code).toLocaleString() + '株']);
  lines.push(['保有', pos ? `${pos.qty.toLocaleString()}株（平均 ${px(Math.round(pos.avg * 10) / 10)}円）` : 'なし']);
  if (pos) { const pl = (s.price - pos.avg) * pos.qty; lines.push([term('含み損益'), `<span class="${cls(pl)}">${yenS(pl)}円（${pctS(s.price / pos.avg - 1)}）</span>`]); }
  $('#o-est').innerHTML = lines.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  const sb = $('#o-submit'); sb.className = 'primary ' + UI.side; sb.textContent = `${UI.side === 'buy' ? '買い' : '売り'}注文の内容を確認`;
  $('#o-avail').textContent = `現金 ${yen(P.cash)}円`;
  const q = $('#o-quick');
  if (UI.side === 'buy') { const maxQ = Math.max(0, Math.floor(availCash() / (s.price * (1 + D.fee) * 1.01) / 100) * 100); q.innerHTML = `<button data-q="${maxQ}">買える最大 ${maxQ.toLocaleString()}株</button>`; }
  else { const a = availShares(s.code); q.innerHTML = a ? `<button data-q="${a}">全部 ${a.toLocaleString()}株</button>` + (a >= 200 ? `<button data-q="${Math.floor(a / 200) * 100}">半分</button>` : '') : ''; }
  $('#o-list').innerHTML = P.orders.map(o => { const os = byCode(o.code); return `<li><span><b>${esc(os.name)}</b> <span class="${o.side === 'buy' ? 'up' : 'down'}">${o.side === 'buy' ? '買' : '売'}</span></span><span class="num">${o.qty.toLocaleString()}株</span><button data-cancel="${o.id}">取消</button><span class="od">${KIND[o.type]}${o.type !== 'mkt' ? ` ${yen(o.price)}円` : '（寄り付きで約定）'}</span></li>`; }).join('') || '<li class="empty">注文はありません</li>';
}

function renderNews() {
  const hint = DIFF[G.diff].hint;
  $('#news-hint').textContent = isReal() ? '日付は報道が届いた朝' : hint === 'dir' ? '矢印は影響の向き' : hint === 'stars' ? '★は情報の確かさ' : '';
  if (UI.lastNews === G.newsId) return; UI.lastNews = G.newsId;
  $('#news').innerHTML = G.news.slice(isReal() ? -NEWS_KEEP_REAL : -50).reverse().map(n => {
    const sub = [];
    // 当時のニュース（real）は日付を出していて、すべて確かな報道なので、★と「◯日前」は省く
    if (hint === 'stars' && n.type !== 'div' && !n.type.startsWith('real')) sub.push(`<span class="stars" aria-label="信頼度 ${n.stars}">${'★'.repeat(n.stars)}${'☆'.repeat(3 - n.stars)}</span>`);
    if (hint === 'dir' && n.hint) sub.push(`<span>${esc(n.hint)}</span>`);
    if (n.day !== G.dayIndex && !n.type.startsWith('real')) sub.push(`<span>${n.day < G.dayIndex ? (G.dayIndex - n.day) + '日前' : ''}</span>`);
    return `<li><button class="nw${n.imp === 3 ? ' imp3' : ''}" data-news="${n.id}"><span class="nw-time num">${n.time}</span><span class="nw-tag ${n.flash ? 'flash' : 't-' + n.type}">${n.flash ? '速報' : TAG[n.type]}</span><span>${esc(n.text)}</span>${n.body ? `<span class="nw-body">${esc(n.body)}</span>` : ''}${sub.length ? `<span class="nw-sub">${sub.join('')}</span>` : ''}</button></li>`;
  }).join('') || (isReal() ? `<li class="empty">${hasRealNews() ? 'まだニュースはありません。当時の報道が、出来事の翌営業日の朝に届きます。' : 'ニュースのデータ（data/news2020.js）がないため、ニュースは流れません。'}</li>` : '<li class="empty">まだニュースはありません。9:00の寄り付きから、ニュースが流れ始めます。</li>');
}

// ×1〜×4 で時間を進めているあいだ、新しいニュースを右下にお知らせする（多いときは新しい2件だけ）。
// 「〜まで進める」で飛ばしたときは出さない（loop からだけ呼ぶ）。since = 進める前の G.newsId
function notifyNews(since) {
  const fresh = G.news.filter(n => n.id > since).slice(-2);
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
      <div><dt>受け取った配当（税引後）</dt><dd class="num">${yen(P.divTotal)}円</dd></div>
      ${DIFF[G.diff].fee ? `<div><dt>${term('手数料')}の合計</dt><dd class="num">${yen(P.feesTotal)}円</dd></div>` : ''}
      <div><dt>${term('最大ドローダウン')}</dt><dd class="num">${(P.maxDD * 100).toFixed(1)}%</dd></div>
    </dl>
    <h3>資産の内訳（${term('分散投資')}の具合）</h3>
    <div class="alloc">${segs.map(x => `<span style="width:${x.v / tot * 100}%;background:${x.col}" title="${x.name}"></span>`).join('')}</div>
    <div class="alloc-leg">${segs.map(x => `<span><i style="background:${x.col}"></i>${x.name} ${(x.v / tot * 100).toFixed(0)}%</span>`).join('')}</div>
    <h3>資産と指数の動き（スタートを100とする）</h3>
    <canvas id="hist-chart" role="img" aria-label="資産と指数の推移"></canvas>
  </section>
  <section class="panel"><h2>保有株</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>銘柄</th><th class="r">株数</th><th class="r">平均取得単価</th><th class="r">現在値</th><th class="r">評価額</th><th class="r">含み損益</th></tr></thead><tbody>
    ${rows.map(r => `<tr><td>${esc(r.s.name)} <span class="muted">${SEC(r.s.sector).short}</span></td><td class="r num">${r.p.qty.toLocaleString()}</td><td class="r num">${px(Math.round(r.p.avg * 10) / 10)}</td><td class="r num">${yen(r.s.price)}</td><td class="r num">${yen(r.val)}</td><td class="r num ${cls(r.pl)}">${yenS(r.pl)}（${pctS(r.s.price / r.p.avg - 1)}）</td></tr>`).join('') || '<tr class="empty"><td colspan="6">まだ株を持っていません。取引画面で買ってみよう。</td></tr>'}
  </tbody></table></div></section>
  <section class="panel"><h2>最近の売買</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>日時</th><th>銘柄</th><th>売買</th><th>種類</th><th class="r">株数</th><th class="r">約定値段</th></tr></thead><tbody>
    ${P.trades.slice(-15).reverse().map(t => `<tr><td class="num">${t.d === G.dayIndex ? '今日' : (G.dayIndex - t.d) + '日前'} ${minLabel(t.m)}</td><td>${esc(byCode(t.code).name)}</td><td class="${t.side === 'buy' ? 'up' : 'down'}">${t.side === 'buy' ? '買い' : '売り'}</td><td>${KIND[t.kind]}</td><td class="r num">${t.qty.toLocaleString()}</td><td class="r num">${px(Math.round(t.px * 10) / 10)}</td></tr>`).join('') || '<tr class="empty"><td colspan="6">まだ売買していません。</td></tr>'}
  </tbody></table></div></section>`;
  drawLines($('#hist-chart'), P.hist);
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

function drawLines(cv, hist) {
  const W = cv.clientWidth, H = cv.clientHeight; if (!W) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const C = palette(), P = G.player;
  const A = hist.map(h => h.a / P.start * 100), I = hist.map(h => h.idx / P.startIdx * 100);
  if (G.phase === 'open') { A.push(asset() / P.start * 100); I.push(G.market.idx / P.startIdx * 100); }
  let lo = Math.min(...A, ...I, 100), hi = Math.max(...A, ...I, 100); const pad = Math.max(1, (hi - lo) * 0.1); lo -= pad; hi += pad;
  const padL = 8, padR = 46, padT = 10, padB = 18, pw = W - padL - padR, ph = H - padT - padB;
  const X = i => padL + (A.length < 2 ? pw / 2 : i / (A.length - 1) * pw), Y = v => padT + (hi - v) / (hi - lo) * ph;
  ctx.font = `11px ${C.num}`; ctx.textBaseline = 'middle';
  const st = niceStep((hi - lo) / 4);
  for (let v = Math.ceil(lo / st) * st; v <= hi; v += st) { const y = Math.round(Y(v)) + .5; ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + pw, y); ctx.stroke(); ctx.fillStyle = C.muted; ctx.textAlign = 'left'; ctx.fillText(v.toFixed(st < 1 ? 1 : 0), padL + pw + 6, y); }
  const line = (arr, col, w, dash) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.setLineDash(dash); ctx.beginPath(); arr.forEach((v, i) => i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v))); ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1; };
  line(I, C.muted, 1.5, [4, 3]); line(A, C.accent, 2.2, []);
  ctx.fillStyle = C.accent; ctx.beginPath(); ctx.arc(X(A.length - 1), Y(A.at(-1)), 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.textAlign = 'left'; ctx.font = `11.5px ${C.body}`; ctx.fillStyle = C.accent; ctx.fillText('あなたの資産', padL + 4, padT + 6); ctx.fillStyle = C.muted; ctx.fillText('- - ' + idxName(), padL + 96, padT + 6);
}

/* ---------- 決算・配当 ---------- */
function renderCal() {
  const el = $('#view-cal');
  if (rank() < 4) { el.innerHTML = `<section class="panel"><div class="locked"><b>ランク4で解放</b><p>決算発表の予定日と、配当の権利確定日がわかるカレンダーです。</p></div></section>`; return; }
  if (isReal()) { el.innerHTML = `<section class="panel"><h2>決算・配当</h2><p class="muted">リアル相場チャレンジでは、決算と配当は扱いません（実データは毎日の終値だけで、決算や配当による値動きはすでに終値に含まれています）。</p></section>`; return; }
  const P = G.player;
  const up = G.stocks.filter(s => s.nextEarn - G.dayIndex <= 25 && s.nextEarn >= G.dayIndex).sort((a, b) => a.nextEarn - b.nextEarn);
  const divs = G.stocks.filter(s => s.div);
  const recDate = s => { let best = null; for (let k = 0; k < 270 && !best; k++) { const d = addTD(G.date, k); if (s.rec.includes(monthOf(d)) && lastTradingDayOfMonth(d)) best = d; } return best; };
  el.innerHTML = `<section class="panel"><h2>決算発表の予定（25営業日先まで）</h2><p class="muted small">決算は大引け後（15:30）に発表され、翌日の寄り付きで株価に反映されます。</p>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>発表日</th><th>銘柄</th><th>業種</th><th class="r">${term('市場予想')}（1株利益）</th><th>保有</th></tr></thead><tbody>
    ${up.map(s => `<tr><td class="num">${mdLabel(addTD(G.date, s.nextEarn - G.dayIndex))}${s.nextEarn === G.dayIndex ? ' 今日' : ''}</td><td>${esc(s.name)}</td><td>${SEC(s.sector).short}</td><td class="r num">${s.consensus.toFixed(1)}円</td><td>${P.pos[s.code] ? '●' : ''}</td></tr>`).join('') || '<tr class="empty"><td colspan="5">近い予定はありません。</td></tr>'}
    </tbody></table></div></section>
    <section class="panel"><h2>配当と${term('権利確定日')}</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>銘柄</th><th class="r">年間配当（1株）</th><th class="r">${term('配当利回り')}</th><th>確定月</th><th>次の権利確定日</th></tr></thead><tbody>
    ${divs.map(s => `<tr><td>${esc(s.name)}</td><td class="r num">${s.div}円</td><td class="r num">${(s.div / s.price * 100).toFixed(2)}%</td><td>${s.rec.map(m => m + '月').join('・')}</td><td class="num">${(d => d ? mdLabel(d) : '—')(recDate(s))}</td></tr>`).join('')}
    </tbody></table></div></section>`;
}

/* ---------- ミッション ---------- */
function renderMissions() {
  const r = rank(), R = RANKS[r - 1], nx = RANKS[r];
  const prog = nx ? (profile.xp - R.xp) / (nx.xp - R.xp) : 1;
  $('#view-mission').innerHTML = `<section class="panel"><div class="rank-card"><div class="rank-big">R${r}</div><div class="rank-name">${R.n}</div>
    <div class="bar"><span style="width:${(prog * 100).toFixed(1)}%"></span></div>
    <div class="muted small">${profile.xp.toLocaleString()} XP${nx ? `　次のランク「${nx.n}」まであと ${(nx.xp - profile.xp).toLocaleString()} XP（解放：${nx.unlock}）` : '　最高ランクです'}</div></div></section>
  <section class="panel"><h2>ミッション</h2><ul class="mlist">${MISSIONS.map(m => { const done = profile.missions[m.id], lock = m.rank && m.rank > r; return `<li class="${lock ? 'lock' : ''}"><span class="chk ${done ? 'on' : ''}">${done ? '✓' : ''}</span><span>${m.t}${lock ? `<span class="muted small">（ランク${m.rank}で挑戦可能）</span>` : ''}</span><span class="xp">+${m.xp} XP</span></li>`; }).join('')}</ul>
    <h3>ほかにXPがもらえること</h3><ul class="ev"><li>株を持って1日を終える（+3）、1日の資産がプラス（+5）</li><li>逆指値の損切りで、損失を5%以内に抑える（+15）</li><li>5業種以上に分散して1週間（5営業日）保有する（+20）</li></ul></section>
  <section class="panel"><h2>ランクと解放されるもの</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>ランク</th><th>称号</th><th class="r">必要XP</th><th>解放</th></tr></thead><tbody>${RANKS.map((k, i) => `<tr${i + 1 === r ? ' style="background:var(--accent-soft)"' : ''}><td class="num">R${i + 1}</td><td>${k.n}</td><td class="r num">${k.xp.toLocaleString()}</td><td style="white-space:normal">${k.unlock}</td></tr>`).join('')}</tbody></table></div></section>`;
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
function closeModal() { $('#modal').hidden = true; modalOpen = false; }
function toast(msg, kind = '') {
  const box = $('#toasts'); if (!box) return;
  const t = document.createElement('div'); t.className = 'toast ' + kind; t.textContent = msg; box.prepend(t);
  while (box.children.length > (window.innerWidth < 700 ? 2 : 3)) box.lastChild.remove();
  setTimeout(() => t.classList.add('out'), 3800); setTimeout(() => t.remove(), 4300);
}
function showTerm(btn) {
  const k = btn.dataset.term, txt = GLOSS[k]; if (!txt) return;
  const pop = $('#pop'); pop.innerHTML = `<b>${esc(k)}</b><p>${esc(txt)}</p>`; pop.hidden = false;
  const r = btn.getBoundingClientRect(), pw = Math.min(300, window.innerWidth - 32);
  pop.style.width = pw + 'px';
  pop.style.left = Math.max(16, Math.min(r.left, window.innerWidth - pw - 16)) + window.scrollX + 'px';
  const below = r.bottom + 8, h = pop.offsetHeight;
  pop.style.top = (below + h > window.innerHeight - 70 ? r.top - h - 8 : below) + window.scrollY + 'px';
}
function hidePop() { const p = $('#pop'); if (p.hidden) return; p.hidden = true; tutEvent('termclose'); }

/* ---------- 注文の確認 ---------- */
function buildOrder() {
  const s = sel(), D = DIFF[G.diff], side = UI.side, type = UI.type;
  const qty = Math.round((+$('#o-qty').value || 0) / 100) * 100;
  if (qty < 100) return { err: '株数は100株以上、100株単位で入力してください。' };
  if (G.phase === 'closed') return { err: '本日の取引は終了しました。' };
  let price = null;
  if (type !== 'mkt') {
    price = roundTick(+$('#o-price').value || 0);
    if (!price) return { err: '値段を入力してください。' };
    if (price > s.limUp || price < s.limDn) return { err: `値段は今日の値幅制限（${yen(s.limDn)}〜${yen(s.limUp)}円）の中で入力してください。` };
    if (type === 'stp' && side === 'sell' && price >= s.price) return { err: '逆指値の売りは、今の株価より低い値段にします（下がったら売る）。' };
    if (type === 'stp' && side === 'buy' && price <= s.price) return { err: '逆指値の買いは、今の株価より高い値段にします（上がったら買う）。' };
  }
  if (side === 'sell') {
    const av = availShares(s.code);
    if (qty > av) return { err: av ? `売れるのは${av.toLocaleString()}株までです（注文中の分を除く）。` : 'この銘柄を持っていません。' };
    if (type === 'mkt' && s.stop === 'down' && G.phase === 'open') return { err: 'ストップ安で買い注文がないため、成行の売りは約定しません。' };
  }
  if (side === 'buy' && type === 'mkt' && s.stop === 'up' && G.phase === 'open') return { err: 'ストップ高で売り注文がないため、成行の買いは約定しません。' };
  const est = type === 'mkt' ? (G.phase === 'open' ? walk(s, side, qty).avg : s.price) : price;
  const gross = est * qty, fee = Math.round(gross * D.fee);
  let reserve = 0;
  if (side === 'buy') {
    // 買えるかどうかは画面に出している概算金額で判定する。値上がりに備えた上乗せは、余力の範囲内でだけ確保する
    const need = gross + fee, buf = type === 'lmt' ? 1 : type === 'stp' ? 1.05 : G.phase === 'pre' ? 1.1 : 1;
    if (need > availCash() + 0.5) return { err: `お金が足りません（必要 約${yen(need)}円／買付余力 ${yen(availCash())}円）。` };
    reserve = G.phase === 'open' && type === 'mkt' ? 0 : Math.min(need * buf, availCash());
  }
  return { o: { code: s.code, side, type, qty, price, reserve }, est, gross, fee };
}
function confirmOrder() {
  const b = buildOrder(); const msg = $('#o-msg');
  if (b.err) { msg.textContent = b.err; if (UI.tut && TUT[UI.tut.i].on === 'confirm') tutSay(/お金/.test(b.err) ? 'お金が足りないみたいだから、「−」で株数を減らすか安い銘柄を選んで、もう一度押してみよう。' : b.err); return; }
  msg.textContent = '';
  const s = sel(), o = b.o, a = asset(), P = G.player;
  const warns = [];
  if (o.side === 'buy') {
    const after = ((P.pos[s.code]?.qty || 0) + o.qty) * s.price;
    if (after / a > 0.5) warns.push(`この注文で、資産の${Math.round(after / a * 100)}%が${s.name}1社に集中します。1社に偏ると、悪いニュース1つで大きく損をすることがあります（${term('分散投資')}）。`);
  }
  if (o.type === 'mkt' && G.phase === 'open') { const best = o.side === 'buy' ? book(s).asks[0]?.p : book(s).bids[0]?.p; if (best && Math.abs(b.est - best) / best > 0.003) warns.push(`板が薄いため、平均約${px(Math.round(b.est * 10) / 10)}円と、一番良い値段より不利に約定しそうです（${term('スリッページ')}）。`); }
  if (G.phase === 'pre' && o.type === 'mkt') warns.push('寄り付き前なので、9:00の寄り付きの値段で約定します。');
  const sideW = o.side === 'buy' ? '買い' : '売り';
  openModal(`<h2>${esc(s.name)}を${sideW}ますか？</h2>
    <table class="confirm-tbl">
      <tr><th>注文</th><td>${KIND[o.type]}の${sideW}</td></tr>
      <tr><th>株数</th><td>${o.qty.toLocaleString()}株</td></tr>
      ${o.type !== 'mkt' ? `<tr><th>${o.type === 'lmt' ? '指値' : '逆指値'}</th><td>${yen(o.price)}円</td></tr>` : `<tr><th>値段の目安</th><td>${px(Math.round(b.est * 10) / 10)}円</td></tr>`}
      <tr><th>${o.side === 'buy' ? 'この注文で使うお金' : '受け取るお金（目安）'}</th><td>約${yen(o.side === 'buy' ? b.gross + b.fee : b.gross - b.fee)}円</td></tr>
      ${b.fee ? `<tr><th>手数料</th><td>${yen(b.fee)}円</td></tr>` : ''}
      <tr><th>株価が1%動くと</th><td>±${yen(o.qty * s.price * 0.01)}円</td></tr>
    </table>
    ${warns.map(w => `<div class="warnbox">${w}</div>`).join('')}
    <div class="actions"><button class="ghost" data-act="cancel">やめる</button><button class="primary ${o.side}" data-act="ok">${sideW}注文を出す</button></div>`,
  { cancel: closeModal, ok: () => { closeModal(); placeOrder(b.o); render(); tutEvent('order'); } });
  tutEvent('confirm');
}
function placeOrder(o) {
  const s = byCode(o.code); o.id = ++G.orderSeq;
  if (G.phase === 'open') {
    if (o.type === 'mkt') { marketTrade(s, o.side, o.qty, 'mkt'); return; }
    if (o.type === 'lmt' && ((o.side === 'buy' && o.price >= s.price) || (o.side === 'sell' && o.price <= s.price))) {
      if (marketTrade(s, o.side, o.qty, 'lmt')) complete('limit'); return;
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
    <div class="actions"><button class="primary" data-act="next">${G.ended ? 'シナリオの結果を見る' : '翌営業日へ'}</button></div>`,
  { next: () => { closeModal(); if (G.ended) finalReport(); else nextDay(); } });
}
function finalReport() {
  const P = G.player, S = SCEN[G.scen], a = asset();
  const r = a / P.start - 1, ir = G.market.idx / P.startIdx - 1;
  const clear = S.clear ? S.clear(r, ir) : true;
  let stars = 0; if (clear) { stars = 1; if (P.maxDD < 0.15) stars = 2; if (P.maxDD < 0.08 && r - ir >= 0.05) stars = 3; }
  profile.best[G.scen] = Math.max(profile.best[G.scen] || 0, stars); saveProfile();
  const sells = P.sells.slice();
  const best = sells.length ? sells.reduce((x, y) => (y.pnl > x.pnl ? y : x)) : null;
  const worst = sells.length ? sells.reduce((x, y) => (y.pnl < x.pnl ? y : x)) : null;
  const adv = [];
  if (best && best.pnl > 0) adv.push(`一番うまくいった取引は${best.name}（${yenS(best.pnl)}円、${pctS(best.pct)}）。そのとき出ていたニュースをチャートのピンで見直してみよう。`);
  if (worst && worst.pnl < 0) {
    const cut = worst.buyAvg * worst.qty * 0.05;
    adv.push(`一番損した取引は${worst.name}（${yenS(worst.pnl)}円、${pctS(worst.pct)}）。` + (worst.pct < -0.05 ? `−5%で${term('損切り')}していれば、損は約${yen(cut)}円で済み、約${yen(-worst.pnl - cut)}円減らせました。` : '損を小さく抑えられています。'));
  }
  if (!sells.length) adv.push('一度も株を売りませんでした。利益や損失は、売って初めて確定します。');
  adv.push(`指数（${idxName()}）を買って持っていただけなら ${pctS(ir)}。あなたは ${pctS(r)}。${r > ir ? '指数に勝ちました。これは本物の投資でも簡単ではありません。' : '指数に勝つのは、プロでも難しいことです。'}`);
  adv.push(`${term('最大ドローダウン')}は${(P.maxDD * 100).toFixed(1)}%でした。${P.maxDD > 0.15 ? '大きく減った時期がありました。1社への集中を減らすと、落ち込みを小さくできます。' : 'リスクをうまく抑えられています。'}`);
  G.ended = true; clearSave();
  openModal(`<h2>${S.name}　結果</h2>
    <div class="stars-big" aria-label="星${stars}つ">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
    <p style="text-align:center">${clear ? 'クリア！' : 'クリアならず'}　目標：${S.goal}</p>
    <dl class="rep-grid"><div><dt>最終資産</dt><dd>${yen(a)}円</dd></div><div><dt>あなた</dt><dd class="${cls(r)}">${pctS(r)}</dd></div><div><dt>指数</dt><dd class="${cls(ir)}">${pctS(ir)}</dd></div></dl>
    <div class="sensei result-sensei">${SENSEI_SVG}<div><b class="who">カブ先生</b><div class="bubble">${esc(senseiAdvice({ r, ir, clear, stars, P }))}</div></div></div>
    <canvas id="final-chart" role="img" aria-label="資産と指数の推移"></canvas>
    <h3>振り返り</h3><ul class="ev">${adv.map(x => `<li>${x}</li>`).join('')}</ul>
    <p class="muted small">${isReal() ? '株価は2020年の実際の終値です（日中の動きはゲームが作ったもの）。過去の値動きは将来を保証しません。' : 'このゲームの株価と企業はすべて架空です。'}実際の投資では、元本を割り込む（損をする）可能性があります。</p>
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
function startTutorial() { if (modalOpen) closeModal(); G.speed = 0; renderHeader(); tutGo(0); }
function tutGo(i) {
  if (i >= TUT.length) { endTutorial(); return; }
  UI.tut = { i };
  const st = TUT[i];
  if (st.view && UI.view !== st.view) switchView(st.view);
  st.enter?.();
  const box = $('#coach'); box.hidden = false;
  box.innerHTML = `<div class="sensei">${SENSEI_SVG}<div><b class="who">カブ先生</b><div class="bubble">${esc(st.t)}</div></div></div>
    <div class="coach-foot"><span class="muted small num">${i + 1} / ${TUT.length}</span><span><button class="ghost" data-tut="skip">スキップ</button>${st.btn ? ` <button class="primary" data-tut="next">${esc(st.btn)}</button>` : ''}</span></div>`;
  const el = st.at && $(st.at);
  if (el) { const r = el.getBoundingClientRect(); if (r.top < 70 || r.bottom > innerHeight - 90) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  tutPlace();
}
function endTutorial() {
  UI.tut = null; $('#coach').hidden = true; $('#tut-ring').hidden = true;
  profile.tutorial = true; saveProfile();
  if (G) { G.speed = 1; renderHeader(); }
}
function tutSay(t) { const b = $('#coach .bubble'); if (b) b.textContent = t; }
function tutEvent(name, v) {
  const st = UI.tut && TUT[UI.tut.i];
  if (st && st.on === name && (!st.ok || st.ok(v))) tutGo(UI.tut.i + 1);
}
// 毎フレーム、光らせる枠を対象に合わせ、吹き出しを対象と重ならない側（上か下）に置く
function tutPlace() {
  if (!UI.tut) return;
  const st = TUT[UI.tut.i];
  if (st.done && st.done()) { tutGo(UI.tut.i + 1); return; }
  const el = st.at && $(st.at), ring = $('#tut-ring'), box = $('#coach');
  if (!el && st.back != null) { tutGo(st.back); return; }
  const r = el?.getBoundingClientRect();
  if (!r || !r.width) { ring.hidden = true; box.classList.remove('top'); return; }
  ring.hidden = false;
  Object.assign(ring.style, { left: r.left - 6 + 'px', top: r.top - 6 + 'px', width: r.width + 12 + 'px', height: r.height + 12 + 'px' });
  box.classList.toggle('top', r.top + r.height / 2 > innerHeight / 2);
}

/* ---------- リザルトのカブ先生（ひとことアドバイス） ---------- */
function senseiAdvice({ r, ir, clear, stars, P }) {
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
const pick = { mode: 'random', scen: 'month', diff: 'normal' };
function showTitle() {
  stopBgm(); titleOpen = true; const el = $('#title'); el.hidden = false; const r = rank(), save = loadSave();
  if (SCEN[pick.scen].rank > r || SCEN[pick.scen].real) pick.scen = 'month'; if (DIFF[pick.diff].rank > r) pick.diff = 'normal';
  if (!REAL) pick.mode = 'random';
  const real = pick.mode === 'real', RS = SCEN.real, rb = profile.best.real;
  const modes = [['random', 'ランダム相場', '架空の30社。シードごとに毎回ちがう相場になる。'], ['real', 'リアル相場チャレンジ', REAL ? `2020年の実在30銘柄の実際の終値で遊ぶ（${REAL.dates[0].replace(/-/g, '/')}〜${REAL.dates.at(-1).replace(/-/g, '/')}）。` : 'data/corona2020.js がないため遊べません（tools/fetch_prices.py で作成）。']];
  el.innerHTML = `<div class="title-card">
    <div class="hero"><div><p class="tagline">ほんものと同じルールで、失敗しても痛くない株デビュー</p><h1>カブトレ<span class="bang">！</span></h1>
      <p>${real ? '2020年の東証の実際の株価で、実在の30社を売買して、資産を増やそう。' : '架空の取引所「NTX」で、実在の企業をもじった30社を売買して、資産を増やそう。'}100株単位、成行と指値、板、ストップ高・安、決算、配当、税金まで本物と同じ。</p></div>
      <div class="prof"><b>ランク${r}「${RANKS[r - 1].n}」</b>${profile.xp.toLocaleString()} XP</div></div>
    <div class="setup">
      <div><h2>相場</h2><div class="choices modes">${modes.map(([k, n, d]) => `<button class="choice" data-mode="${k}" aria-pressed="${pick.mode === k}" ${k === 'real' && !REAL ? 'disabled' : ''}><b>${n}</b><span>${d}</span></button>`).join('')}</div>
      <h2>シナリオ</h2><div class="choices">${real ? `<button class="choice" aria-pressed="true"><b>${RS.name}</b><span>${RS.desc}（${RS.days}営業日）　目標：${RS.goal}</span><em class="${rb ? 'best' : ''}">${rb != null ? '★'.repeat(rb) + '☆'.repeat(3 - rb) : ''}</em></button>` : Object.entries(SCEN).filter(([, S]) => !S.real).map(([k, S]) => { const lock = S.rank > r, b = profile.best[k]; return `<button class="choice" data-scen="${k}" aria-pressed="${pick.scen === k}" ${lock ? 'disabled' : ''}><b>${S.name}</b><span>${S.desc}${S.days ? `（${S.days}営業日）` : ''}　目標：${S.goal}</span><em class="${b ? 'best' : ''}">${lock ? `ランク${S.rank}で解放` : b != null ? '★'.repeat(b) + '☆'.repeat(3 - b) : ''}</em></button>`; }).join('')}</div></div>
      <div><h2>難易度</h2><div class="choices">${Object.entries(DIFF).map(([k, D]) => { const lock = D.rank > r; return `<button class="choice" data-diff="${k}" aria-pressed="${pick.diff === k}" ${lock ? 'disabled' : ''}><b>${D.name}</b><span>${D.desc}</span><em>${lock ? `ランク${D.rank}で解放` : ''}</em></button>`; }).join('')}</div>
        <div class="seed-row" id="cash-row" ${pick.scen === 'free' && !real ? '' : 'hidden'}><label for="cash">初期資金</label><input id="cash" class="num" type="number" min="100000" max="100000000" step="100000" placeholder="${DIFF[pick.diff].cash}"><span>円（10万〜1億円。フリープレイのみ）</span></div>
        <div class="seed-row"><label for="seed">相場の番号（シード）</label><input id="seed" class="num" type="number" placeholder="おまかせ"><span>${real ? '終値は実データどおり。番号で変わるのは日中の動きだけです' : '同じ番号なら、友達と同じ相場で勝負できます'}</span></div></div>
    </div>
    <div class="go"><button class="primary" id="go-new">はじめる</button>${save ? `<button class="ghost" id="go-cont">続きから（${esc(SCEN[save.scen].name)}・${mdLabel(save.date)}）</button>` : ''}</div>
    <p class="disclaimer">${real ? 'リアル相場チャレンジの終値は、2020年の実際の株価（株式分割を反映した値。配当は反映していません）です。始値・高値・安値・日中の動き・板・出来高は、終値をもとにゲームが作ったもので、実際とは異なります。決算・配当・ニュースは出ません。実データは Yahoo Finance から個人利用の範囲で取得したもので、このモードは配布しないでください。過去の値動きは将来の値動きを保証しません。' : `このゲームに出てくる会社・株価・ニュースはすべて架空です。社名は実在の企業をもじったパロディで、実在の企業とは関係ありません。ゲームの値動きは作りものなので、本物の株価の予想には使えません。実際の投資では、元本を割り込む（損をする）可能性があります。`}</p>
  </div>`;
  el.onclick = e => {
    const sc = e.target.closest('[data-scen]'), df = e.target.closest('[data-diff]'), md = e.target.closest('[data-mode]');
    if (md && !md.disabled && md.dataset.mode !== pick.mode) { const sv = $('#seed').value; pick.mode = md.dataset.mode; showTitle(); $('#seed').value = sv; return; }
    if (sc && !sc.disabled) { pick.scen = sc.dataset.scen; $$('[data-scen]', el).forEach(b => b.setAttribute('aria-pressed', String(b === sc))); $('#cash-row').hidden = pick.scen !== 'free' || pick.mode === 'real'; }
    if (df && !df.disabled) { pick.diff = df.dataset.diff; $$('[data-diff]', el).forEach(b => b.setAttribute('aria-pressed', String(b === df))); $('#cash').placeholder = DIFF[pick.diff].cash; }
    if (e.target.closest('#go-new')) {
      const sv = $('#seed').value; const seed = sv ? (+sv | 0) : Math.floor(Math.random() * 1e9);
      const cv = +$('#cash').value, cash = pick.scen === 'free' && pick.mode !== 'real' && cv ? clamp(Math.round(cv / 1000) * 1000, 1e5, 1e8) : 0;
      newGame(pick.scen, pick.diff, seed, cash, pick.mode); hideTitle(); UI.lastNews = -1; buildTypes(); buildFilter(); switchView('trade'); render();
      if (G.scen === 'month' && !profile.tutorial) startTutorial(); else toast(isReal() ? '2020年1月6日から、実際の株価で取引します' : `相場の番号は ${seed} です`);
    }
    if (e.target.closest('#go-cont')) { const g = loadSave(); if (g) { UI.lastNews = -1; resume(g); buildTypes(); buildFilter(); switchView('trade'); render(); } }
  };
}
function hideTitle() { titleOpen = false; $('#title').hidden = true; playBgm(); }

function switchView(v) {
  UI.view = v;
  for (const k of ['trade', 'hold', 'cal', 'mission', 'hint']) $('#view-' + k).hidden = k !== v;
  $$('.tabbar button').forEach(b => { if (b.dataset.view === v) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  if (v === 'hint') renderHint($('#dict-q')?.value || '');
  tutEvent('view', v);
  UI.lastNews = -1; render(); window.scrollTo(0, 0);
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
function bindUI() {
  document.addEventListener('pointerdown', () => { if (!titleOpen && bgm.paused) playBgm(); });
  // タッチ・マウスは押した瞬間に鳴らす。キーボード操作（pointerdown が無い click）は click で鳴らす
  let sePressedAt = 0;
  document.addEventListener('pointerdown', e => { if (e.target.closest('button')) { sePressedAt = performance.now(); playClick(); } }, true);
  document.addEventListener('click', e => { if (e.target.closest('button') && performance.now() - sePressedAt > 1000) playClick(); }, true);
  document.addEventListener('click', e => {
    const t = e.target.closest('.term'); if (t) { e.preventDefault(); e.stopPropagation(); showTerm(t); return; }
    hidePop();
    const tb = e.target.closest('[data-tut]'); if (tb) { if (tb.dataset.tut === 'skip') endTutorial(); else tutGo(UI.tut.i + 1); return; }
    if (!G || titleOpen) return;
    const act = e.target.closest('#modal [data-act]'); if (act && modalHandlers[act.dataset.act]) { modalHandlers[act.dataset.act](act); return; }
    if (modalOpen) return;
    const sp = e.target.closest('[data-speed]'); if (sp) { G.speed = +sp.dataset.speed; renderHeader(); tutEvent('speed', G.speed); return; }
    if (e.target.closest('#skip-btn')) { if (G.phase === 'pre') { runUntil(() => G.phase === 'open'); tutEvent('skip'); } else if (G.phase === 'open') runUntil(() => G.phase === 'closed'); else dailyReport(); return; }
    const row = e.target.closest('.row[data-code]'); if (row) { G.sel = row.dataset.code; UI.hover = null; UI.vw.yOff = 0; $('#o-msg').textContent = ''; $('#o-price').value = ''; render(); if (window.innerWidth < 700 && !UI.tut) $('.a-chart').scrollIntoView({ behavior: 'smooth' }); tutEvent('select'); return; }
    const zm = e.target.closest('[data-zoom]'); if (zm) { if (zm.dataset.zoom === 'latest') { UI.vw[G.chartMode].end = null; UI.vw.yOff = 0; } else zoomChart(zm.dataset.zoom === 'in' ? 1 / 1.4 : 1.4); drawChart(); return; }
    const cm = e.target.closest('[data-cm]'); if (cm) { G.chartMode = cm.dataset.cm; UI.hover = null; renderChartHead(); drawChart(); tutEvent('cm', G.chartMode); return; }
    const sd = e.target.closest('[data-side]'); if (sd) { UI.side = sd.dataset.side; renderOrderPanel(); tutEvent('side', UI.side); return; }
    const ty = e.target.closest('[data-type]');
    if (ty && ty.classList.contains('locked')) { const n = TYPE_RANK[ty.dataset.type], R = RANKS[n - 1]; toast(`🔒 ${KIND[ty.dataset.type]}はランク${n}「${R.n}」（${R.xp.toLocaleString()} XP）で解放されます。あと${(R.xp - profile.xp).toLocaleString()} XP。ミッションをこなしてXPを集めよう`); tutEvent('locked'); return; }
    if (ty && !ty.disabled) { UI.type = ty.dataset.type; if (UI.type !== 'mkt' && !$('#o-price').value) $('#o-price').value = sel().price; renderOrderPanel(); return; }
    if (e.target.closest('#q-minus')) { const q = $('#o-qty'); q.value = Math.max(100, (+q.value || 100) - 100); renderOrderPanel(); tutEvent('qty'); return; }
    if (e.target.closest('#q-plus')) { const q = $('#o-qty'); q.value = (+q.value || 0) + 100; renderOrderPanel(); tutEvent('qty'); return; }
    const qk = e.target.closest('[data-q]'); if (qk) { $('#o-qty').value = Math.max(100, +qk.dataset.q); renderOrderPanel(); tutEvent('qty'); return; }
    const bp = e.target.closest('[data-px]'); if (bp) { if (UI.type === 'mkt') UI.type = 'lmt'; $('#o-price').value = bp.dataset.px; renderOrderPanel(); return; }
    if (e.target.closest('#o-submit')) { confirmOrder(); return; }
    const cc = e.target.closest('[data-cancel]'); if (cc) { const o = G.player.orders.find(x => x.id === +cc.dataset.cancel); if (o) { removeOrder(o); toast('注文を取り消しました'); render(); } return; }
    const nw = e.target.closest('[data-news]'); if (nw) {
      const n = G.news.find(x => x.id === +nw.dataset.news); if (!n) return;
      let code = n.codes[0]; if (!code && n.sector) code = unlockedStocks().find(s => s.sector === n.sector)?.code;
      if (code && byCode(code).unlock <= rank()) { G.sel = code; if (UI.view !== 'trade') switchView('trade'); else render(); } else if (code) toast(`${byCode(code).name}はランク${byCode(code).unlock}で取引できるようになります`);
      return;
    }
    const hc = e.target.closest('[data-hcat]'); if (hc) { UI.hcat = hc.dataset.hcat; renderHint($('#dict-q').value.trim()); return; }
    const tv = e.target.closest('[data-view]'); if (tv) { switchView(tv.dataset.view); return; }
    if (e.target.closest('#h-rank')) { switchView('mission'); return; }
    if (e.target.closest('#menu-btn')) {
      openModal(`<h2>メニュー</h2><p class="muted small">進行は1日の終わりごとに自動で保存されます。相場の番号：${G.seed}</p>
        <div class="actions" style="justify-content:flex-start"><button class="ghost" data-act="tut">カブ先生の説明をもう一度見る</button><button class="ghost" data-act="title">タイトルに戻る</button><button class="primary" data-act="close">ゲームに戻る</button></div>`,
      { close: closeModal, tut: () => { closeModal(); startTutorial(); }, title: () => { closeModal(); showTitle(); } });
    }
  });
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal' && $('#modal-card [data-act="cancel"], #modal-card [data-act="close"]')) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { hidePop(); if (modalOpen && $('#modal-card [data-act="cancel"], #modal-card [data-act="close"]')) closeModal(); } });
  $('#sec-filter').addEventListener('change', e => { UI.filter = e.target.value; renderList(); });
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
  bindUI();
  let resumed = false;
  if (data && data.save) { try { const g = JSON.parse(data.save); if (g && g.v === 1) { UI.view = data.view || 'trade'; resume(g); buildTypes(); buildFilter(); switchView(UI.view); resumed = true; } } catch (e) {} }
  if (!resumed) showTitle();
  requestAnimationFrame(loop);
}
window.claude?.hot?.snapshot?.(() => (G && !titleOpen && !G.ended ? { save: JSON.stringify(G, (k, v) => (k === '_map' ? undefined : v)), view: UI.view } : {}));
window.__kabutore = { get G() { return G; }, newGame, tick, asset, rank, profile: () => profile, runDay: () => { while (G.phase !== 'closed') tick(); }, nextDay, closeModal };
if (window.claude?.hot?.ready) window.claude.hot.ready(start); else start(window.claude?.hot?.data ?? {});
})();
