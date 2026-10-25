# カブトレ！ (kabutore)

初心者向けの本格株取引シミュレーションゲーム。ライブラリなし・ビルドなし。`index.html` / `style.css` / `script.js` の3ファイル構成。ブラウザで `index.html` を直接開けば動く。

## 動かし方
- `index.html` をブラウザで開く（または VS Code の Live Server 拡張 / `npx serve .`）
- 構文チェック: `node --check script.js`
- ランダム相場が変わっていないかの確認: `git show HEAD:script.js > /tmp/before.js && node tools/check_random.js /tmp/before.js script.js`（シナリオ×難易度×シードごとに値動き・ニュースの指紋を比べる。すべて [OK] なら同じ）
- リアル相場が変わっていないかの確認: 変更前の script.js を `data/` が隣にあるフォルダに置き（例: `mkdir /tmp/b && git show HEAD:script.js > /tmp/b/script.js && cp -R data /tmp/b/`）、`node tools/check_real.js /tmp/b/script.js script.js`（シード42・7で全営業日を回し、日ごとの分足・日足・指数・ニュースを比べる。初日が変わったときは差の中身も出す）
- セーブは localStorage（`kabutore.profile` = 経験値・ランク、`kabutore.save` = 進行中の1日の終わり時点）

## ファイル構成（目印コメント `/* ===== ... ===== */` で検索）
- `index.html`: `<title>`・フォント読み込み・`<body>` の骨格（パネルの入れ物やボタンなど静的なDOM）のみ。`style.css` と `script.js` を読み込む
- `Aseet/`: 素材（アイコン = ファビコン、BGM = ゲーム中のみ再生・タイトルでは停止、ボタン効果音）。パスは `Aseet/...` で参照
- `style.css`: 先頭の `:root` にトークン（`--up` 赤 / `--down` 緑 = 日本式配色、ライト/ダーク両対応）
- `script.js`: データ表 SECTORS, DEFS（実在企業をもじった架空30社, 6業種, 架空取引所NTX, 指数NTX225）, DIFF, SCEN, RANKS, MISSIONS, GLOSS, TIPS, TERM_GROUPS, TRIVIA
- 乱数: シード付き mulberry32 + Box–Muller。同じシード = 同じ相場
- リアル相場チャレンジ: `data/corona2020.js`（`const CORONA2020`、`tools/fetch_prices.py` で作る。git には入れない・配布しない）があるときだけ選べる。`G.mode = 'random' | 'real'`、`SCEN.real`。終値は実データどおり、日中は前日終値→実際の終値のブラウニアン・ブリッジ（`realOpen` / `realStep`）。作りもののニュース・決算・配当・暴落は出さない。当時の実際のニュースは `data/news2020.js`（`const NEWS2020`、git に入れる。なくても動く）から、date より後の最初の営業日の寄り付き前に表示だけする（`pushRealNews` → `pushNews`。genNews / apply 系にはつながないので株価は不変）。各ニュースは type（fact = 報道 / report = 観測 / rumor = 当時実際に出回った噂）と importance（3 は全体の1〜2割）を持つ。リアル相場ではニュースを `NEWS_KEEP_REAL` 件まで保存・表示する（1年分が収まる）。業種は東証の業種名で `REAL_SECTORS`（`SECTORS` に混ぜるとランダム相場の乱数の順番が変わるので分けている。表示は `SEC(k)`）。指数は30銘柄を同額ずつ持った平均（2020-01-06 の終値=100、`idxName()`）
- リアル相場の過去チャート: `CORONA2020.history`（2019年の日足 OHLCV。`python3 tools/fetch_prices.py --history` で 2020年分には触れずにファイル末尾へ足す。なくても動く）から `realHistory` が `s.daily`（di は負）と `idxDaily` を作る。乱数は使わない。初日の前日終値 = 2019-12-30 の終値。出来高は日ごとの増減だけ実データで、大きさはゲーム内の出来高（`minVol × MIN_PER_DAY`）にそろえる。日足を残す数は `dailyKeep()`（リアル600 / ランダム320）。日足チャートの日付は、リアル相場だけ最初と年が変わったところに年を付け、年の境目に点線
- 株価エンジン: 1ゲーム分ごとに `r = μΔt + β·M + S_sector + e (+jump) + κ·ln(V/P)Δt + news`。日次ボラは GARCH 風 `h = clamp(0.04+0.06z²+0.90h, 0.4, 3)`、寄り・引けは 1.5 倍（正規化）
- 取引ルール: 100株単位、呼値、値幅制限、S高/S安、前場/後場/昼休み、成行(板を食う)/指値/逆指値、税 20.315%、本格モード手数料 0.1%、配当と権利落ち、四半期決算
- 画面: チャート（自前 Canvas のローソク足 + 出来高 + 移動平均 + ニュースピン + 自分の売買）、板、注文パネル、保有、カレンダー、ミッション、ヒント（Q&A形式。TIPS = コツ、GLOSS を TERM_GROUPS で分類 = 用語、TRIVIA = 答えに添える豆知識）
- 端末別レイアウト: `index.html` 先頭の小さなスクリプトが `<html data-device="pc|tablet|phone">` を付ける（タッチ端末かつ画面の短辺600px未満、または幅700px以下 = phone / それ以外のタッチ端末、または幅1120px以下 = tablet）。スマホ・タブレット専用の見た目は `style.css` 末尾の `[data-device=...]` だけに書き、PC の表示は変えない。見出し＋流れる銘柄（`.hdr`）は全端末で上部に固定。×1〜×4 で進めている間は全端末で新着ニュースを右下にポップアップ（`notifyNews`。loop からだけ呼ぶので「〜まで進める」では出ない）
- カブ先生: 出すのはチュートリアル（TUT。「はじめての1か月」の初回のみ。操作すると `tutEvent` で次へ進む）とリザルト画面（`senseiAdvice`）だけ
- 効果音: ボタンを押すと鳴る。選べない（disabled / aria-disabled）・選択中（aria-pressed / aria-current）・ロゴのボタンでは鳴らさない（`silentButton`）
- ロゴ: 見出しのロゴ（`#h-logo`）でタイトルへ戻る。タイトルのロゴ（`#t-logo`）を1.5秒以内の間隔で10回タップすると R7（全機能解放）。≡ メニューのリセット（経験値・セーブを全消去）は常に出し、R7 のときは「全解放をリセット」、それ以外は「データをリセット」と表示
- リアル相場チャレンジはランク5で解放（`SCEN.real.rank`）。シナリオは「コロナショック」（`real`）と「フリープレイ」（`realfree`）。フリープレイの相場は `free` でないリアル相場のシナリオから、シードの剰余で選ぶ（`G.base`。乱数は使わない）
- フリープレイの初期資金は `CASH_MIN`〜`CASH_MAX`（1万〜10億円）
- デバッグ: `window.__kabutore`（G, newGame(scen, diff, seed, cash, mode), tick, asset, rank, profile, runDay, nextDay, closeModal）

## 調整済みの重要定数（むやみに変えない）
- `MKT_SIG=0.17`、`NEWS_RATE`（ニュース頻度）。年率ボラの目安: 食品 約22% / 自動車・銀行 約32% / 新興 約67%
- 変更したら 1 年分を画面なしで回し（`runDay` を繰り返す）、上の数字とズレていないか確認する

## 未実装（次の候補）
信用取引・空売り（ランク6の解放予定）、OCO/IFD注文、NISAモード、歴史再現モード、2営業日の受渡

## 方針
- 日本語UI。用語は GLOSS に追加して点線ツールチップで解説
- 外部ライブラリは入れない。必要になったら先にユーザーに相談
- 日本式: 上昇=赤、下落=緑
