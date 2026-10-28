# カブトレ！ (kabutore)

初心者向けの本格株取引シミュレーションゲーム。ライブラリなし・ビルドなし。`index.html` / `style.css` / `script.js` の3ファイル構成。ブラウザで `index.html` を直接開けば動く。

## 動かし方
- `index.html` をブラウザで開く（または VS Code の Live Server 拡張 / `npx serve .`）
- 構文チェック: `node --check script.js`
- ランダム相場が変わっていないかの確認: `git show HEAD:script.js > /tmp/before.js && node tools/check_random.js /tmp/before.js script.js`（シナリオ×難易度×シードごとに値動き・ニュースの指紋を比べる。すべて [OK] なら同じ。`check_random.js` はデータファイル `corona2020.js` / `recent.js` / `news2020.js` / `news2026.js` もあれば読み込む）
- リアル相場が変わっていないかの確認: 変更前の script.js を `data/` が隣にあるフォルダに置き（例: `mkdir /tmp/b && git show HEAD:script.js > /tmp/b/script.js && cp -R data /tmp/b/`）、`node tools/check_real.js /tmp/b/script.js script.js`（シード42・7で全営業日を回し、日ごとの分足・日足・指数・ニュースを比べる。初日が変わったときは差の中身も出す）
- 株価データの取得: `python3 tools/fetch_prices.py --scenario <名前>`（`--scenario` は必須。付けないと使い方を出して終わる。`pip install yfinance pandas` が要る）。シナリオの期間・出力先・変数名・銘柄名の上書き・検証の期待値は `tools/fetch_prices.py` の `SCENARIOS` に集めてある。`corona2020` → `data/corona2020.js`（`CORONA2020`、2020年）、`recent` → `data/recent.js`（`RECENT`、本編 2026-01-01〜2026-09-30・過去分 2025年、4689 は「LINEヤフー」）。`--history` を足すと過去チャートだけを取り直して末尾に差し替える。recent.js も corona2020.js と同じ構造（`{ dates, stocks, history }`）で、git には入れない・配布しない。`recent` の実行では corona2020.js に触れず、最後に前後の SHA-256 を表示する。ゲームはどちらのデータも読む（下の「リアル相場チャレンジ」）
- セーブは localStorage（`kabutore.profile` = 経験値・ランク、`kabutore.save` = 進行中の1日の終わり時点）

## ファイル構成（目印コメント `/* ===== ... ===== */` で検索）
- `index.html`: `<title>`・フォント読み込み・`<body>` の骨格（パネルの入れ物やボタンなど静的なDOM）のみ。`style.css` と `script.js` を読み込む
- `Aseet/`: 素材（アイコン = ファビコン、BGM = ゲーム中のみ再生・タイトルでは停止、ボタン効果音）。パスは `Aseet/...` で参照
- `style.css`: 先頭の `:root` にトークン（`--up` 赤 / `--down` 緑 = 日本式配色、ライト/ダーク両対応）
- `script.js`: データ表 SECTORS, DEFS（実在企業をもじった架空30社, 6業種, 架空取引所NTX, 指数NTX225）, DIFF, SCEN, RANKS, MISSIONS, GLOSS, TIPS, TERM_GROUPS, TRIVIA
- 乱数: シード付き mulberry32 + Box–Muller。同じシード = 同じ相場
- リアル相場チャレンジ: シナリオごとにデータファイルがあるものだけ選べる。`data/corona2020.js`（`const CORONA2020` → `SCEN.real`「コロナショック」）と `data/recent.js`（`const RECENT` → `SCEN.real2026`「今年の相場」）。どちらも `python3 tools/fetch_prices.py --scenario ...` で作る。git には入れない・配布しない。ないシナリオはタイトルで無効になり「data/xxx.js がありません」と出る（エラーにはならない）。シナリオの情報は `script.js` の `REAL_SETS`（キーは `SCEN` と同じ。`data` / `news` / `file` / `newsFile` / `name` / `period`）に集めてあり、シナリオ名・期間の表示（2026 は `year` と `span`。データの期間を延ばしたら `span` を直す）もここだけ。遊ぶシナリオは `useReal(キー)` で `REAL` / `REAL_PX` / `REAL_HIST` / `REAL_SECTORS` / `REAL_NEWS` に切り替える（`newGame` と `afterLoad`。保存データ・練習からの復元もここを通る）。`G.mode = 'random' | 'real'`、リアル相場のデータのキーは `G.base`（古い保存データは `base` がなければ `scen`）。タイトルの注意書き（`realDisclaimer`）は選んだシナリオの期間に合わせ、ニュースがあるかで文を切り替える。終値は実データどおり、日中は前日終値→実際の終値のブラウニアン・ブリッジ（`realOpen` / `realStep`）。作りもののニュース・決算・配当・暴落は出さない。当時の実際のニュースはシナリオごとの `data/news2020.js`（`const NEWS2020`）・`data/news2026.js`（`const NEWS2026`。まだない。あとで足せる）から（git に入れる。なくても動く。ニュース欄が空のときは、ないファイル名を出す）、date より後の最初の営業日の寄り付き前に表示だけする（`pushRealNews` → `pushNews`。genNews / apply 系にはつながないので株価は不変）。各ニュースは type（fact = 報道 / report = 観測 / rumor = 当時実際に出回った噂）と importance（3 は全体の1〜2割）を持つ。リアル相場ではニュースを `NEWS_KEEP_REAL` 件まで保存・表示する（1年分が収まる）。業種は東証の業種名で `REAL_SECTORS`（`SECTORS` に混ぜるとランダム相場の乱数の順番が変わるので分けている。表示は `SEC(k)`）。指数は30銘柄を同額ずつ持った平均（各シナリオの初日の終値=100、`idxName()`）
- リアル相場の過去チャート: 各データの `history`（2020版は2019年・2026版は2025年の日足 OHLCV。`python3 tools/fetch_prices.py --scenario <名前> --history` で本編には触れずにファイル末尾へ足す。なくても動く）から `realHistory` が `s.daily`（di は負）と `idxDaily` を作る。乱数は使わない。初日の前日終値 = 過去分の最終日の終値（2020版は 2019-12-30、2026版は 2025-12-30）。出来高は日ごとの増減だけ実データで、大きさはゲーム内の出来高（`minVol × MIN_PER_DAY`）にそろえる。日足を残す数は `dailyKeep()`（リアル600 / ランダム320）。日足チャートの日付は、リアル相場だけ最初と年が変わったところに年を付け、年の境目に点線
- 株価エンジン: 1ゲーム分ごとに `r = μΔt + β·M + S_sector + e (+jump) + κ·ln(V/P)Δt + news`。日次ボラは GARCH 風 `h = clamp(0.04+0.06z²+0.90h, 0.4, 3)`、寄り・引けは 1.5 倍（正規化）
- 取引ルール: 100株単位、呼値、値幅制限、S高/S安、前場/後場/昼休み、成行(板を食う)/指値/逆指値、税 20.315%、本格モード手数料 0.1%、配当と権利落ち、四半期決算
- 画面: チャート（自前 Canvas のローソク足 + 出来高 + 移動平均 + ニュースピン + 自分の売買）、板、注文パネル、保有、カレンダー、ミッション、ヒント（Q&A形式。TIPS = コツ、GLOSS を TERM_GROUPS で分類 = 用語、TRIVIA = 答えに添える豆知識）
- 端末別レイアウト: `index.html` 先頭の小さなスクリプトが `<html data-device="pc|tablet|phone">` を付ける（タッチ端末かつ画面の短辺600px未満、または幅700px以下 = phone / それ以外のタッチ端末、または幅1120px以下 = tablet）。スマホ・タブレット専用の見た目は `style.css` 末尾の `[data-device=...]` だけに書き、PC の表示は変えない。見出し＋流れる銘柄（`.hdr`）は全端末で上部に固定。×1〜×4 で進めている間は全端末で新着ニュースを右下にポップアップ（`notifyNews`。loop からだけ呼ぶので「〜まで進める」では出ない）
- カブ先生: 出すのはチュートリアル（TUT。「はじめての1か月」の初回のみ。操作すると `tutEvent` で次へ進む）とリザルト画面（`senseiAdvice`）だけ
- 効果音: ボタンを押すと鳴る。選べない（disabled / aria-disabled）・選択中（aria-pressed / aria-current）・ロゴのボタン・見出しのランク表示（`#h-rank`。ミッション画面を開いているときだけ）では鳴らさない（`silentButton`）
- ロゴ: 見出しのロゴ（`#h-logo`）でタイトルへ戻る。ミッション画面の「ランクと解放されるもの」で、ゲーム内の時刻が9:00のときに「伝説の相場師」（`[data-legend]`）を1.5秒以内の間隔で10回タップすると R7（全機能解放。`legendTap`）。≡ メニューのリセット（経験値・セーブを全消去）は常に出し、R7 のときは「全解放をリセット」、それ以外は「データをリセット」と表示
- リアル相場チャレンジはランク5で解放（`SCEN.real.rank`）。シナリオは「コロナショック」（`real`）、「今年の相場」（`real2026`）、「フリープレイ」（`realfree`）。フリープレイの相場は `free` でも `noFree` でもないリアル相場のシナリオ（`freePool()`）から、シードの剰余で選ぶ（`G.base`。乱数は使わない）。`real2026` は `noFree` で、フリープレイの候補に入れていない（今のフリープレイの動きを変えないため。入れるときは `noFree` を外す）
- 保存データ（`kabutore.save`）が続きから使えるかは `saveUsable`：`SCEN` にあるシナリオで、リアル相場ならそのデータがあり、`date` がそのデータの `dayIndex` 番目の営業日と同じときだけ。使えないものは消さずに「続きから」を出さないだけ（データを戻せばまた出る）。保存は1つだけで、別のシナリオを始めると上書きされる
- ミッション（`MISSIONS`）はすべて `rank` を持ち、そのランクに上がるまで画面に出さず、達成にもならない（`complete` が弾く）。リアル相場の `realbeat`（コロナショックで30銘柄平均に勝つ）は `G.scen === 'real'` 専用で、2026 用のミッションはない。判定は `sellMissions`（売り・返済）、`runDay` の日終わり・終了時、`G.dayWin` / `G.mcallEver` / 持ち始めた日 `pos[].d` を使う。株価と乱数には触れない
- 難易度「ふつう」はランク2で解放（`DIFF.normal.rank`）。初期選択は「やさしい」
- フリープレイの初期資金は `CASH_MIN`〜`CASH_MAX`（1万〜10億円）
- デバッグ: `window.__kabutore`（G, newGame(scen, diff, seed, cash, mode), tick, asset, rank, profile, runDay, nextDay, closeModal）

## 調整済みの重要定数（むやみに変えない）
- `MKT_SIG=0.17`、`NEWS_RATE`（ニュース頻度）。年率ボラの目安: 食品 約22% / 自動車・銀行 約32% / 新興 約67%
- 変更したら 1 年分を画面なしで回し（`runDay` を繰り返す）、上の数字とズレていないか確認する

## 信用取引（ランク6）
仕様は `SPEC_margin.md`。目印は `/* ===== 信用取引（ランク6） ===== */`、定数は `MARGIN`。建玉は `G.player.mpos`、注文と売買記録は `mg: true` で現物と区別する。保証金は現金だけ・両建てなし・損益は `realize()` で現物と通算。株価と乱数には触れない

## ファストスターターモード
- ランク1のとき、タイトル画面のロゴ（`#t-logo`）を1.5秒以内の間隔で10回押すと ON（`fastTap`）。`profile.fast` に保存し、ランクが上がっても続く。≡ メニューの「ファストスターターを解除」かデータのリセットで OFF
- 解放：指値・逆指値（`buildTypes`）、信用取引（`canMargin`）、リアル相場チャレンジ（`realUnlocked` / `scenLock`）。ランク表示（`#h-rank`・タイトルの `.prof`）は蛍光グリーン #00FF00（`--fast`。ライトモードのタイトルの文字だけ読みやすい濃さの `--fast-text`）
- 銘柄：ランクで開く銘柄が足りないあいだは `FAST_CODES` の5銘柄だけ（ランダム・リアルとも）。判定は `isOpen(s, r)`、次に開くランクは `openRank(s)`
- 幻の銘柄「梅山カンパニー」（`UME`、K999）：ファスト ON で始めたランダム相場だけ。`G.stocks` には入れず `G.ume` に持つ（指数に入らない・30銘柄の乱数の順番を変えない）。乱数は専用（`G.ume.r`。`afterLoad` で関数を付け直す）。2〜5日目の朝に上場（`hash01(seed + 'umeyama')`）。1株単位・呼値1円（`lot` / `tickOf` / `roundPx`）、信用取引不可。値動きは「社長の機嫌」（`mood`）と公開価格 200,909円への戻り。`umeDay` / `umeOpen` / `umeStep` / `umeClose`
- ファスト OFF のときは `check_random.js` / `check_real.js` がすべて [OK]。ファスト ON でも30銘柄と指数の値動きは OFF と同じ

## 未実装（次の候補）
OCO/IFD注文、NISAモード、歴史再現モード、2営業日の受渡、信用の逆日歩・一般信用

## 方針
- 日本語UI。用語は GLOSS に追加して点線ツールチップで解説
- 外部ライブラリは入れない。必要になったら先にユーザーに相談
- 日本式: 上昇=赤、下落=緑
