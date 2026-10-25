# カブトレ！ (kabutore)

初心者向けの本格株取引シミュレーションゲーム。ライブラリなし・ビルドなし。`index.html` / `style.css` / `script.js` の3ファイル構成。ブラウザで `index.html` を直接開けば動く。

## 動かし方
- `index.html` をブラウザで開く（または VS Code の Live Server 拡張 / `npx serve .`）
- 構文チェック: `node --check script.js`
- セーブは localStorage（`kabutore.profile` = 経験値・ランク、`kabutore.save` = 進行中の1日の終わり時点）

## ファイル構成（目印コメント `/* ===== ... ===== */` で検索）
- `index.html`: `<title>`・フォント読み込み・`<body>` の骨格（パネルの入れ物やボタンなど静的なDOM）のみ。`style.css` と `script.js` を読み込む
- `Aseet/`: 素材（アイコン = ファビコン、BGM = ゲーム中のみ再生・タイトルでは停止、ボタン効果音）。パスは `Aseet/...` で参照
- `style.css`: 先頭の `:root` にトークン（`--up` 赤 / `--down` 緑 = 日本式配色、ライト/ダーク両対応）
- `script.js`: データ表 SECTORS, DEFS（実在企業をもじった架空30社, 6業種, 架空取引所NTX, 指数NTX225）, DIFF, SCEN, RANKS, MISSIONS, GLOSS, TIPS, TERM_GROUPS, TRIVIA
- 乱数: シード付き mulberry32 + Box–Muller。同じシード = 同じ相場
- 株価エンジン: 1ゲーム分ごとに `r = μΔt + β·M + S_sector + e (+jump) + κ·ln(V/P)Δt + news`。日次ボラは GARCH 風 `h = clamp(0.04+0.06z²+0.90h, 0.4, 3)`、寄り・引けは 1.5 倍（正規化）
- 取引ルール: 100株単位、呼値、値幅制限、S高/S安、前場/後場/昼休み、成行(板を食う)/指値/逆指値、税 20.315%、本格モード手数料 0.1%、配当と権利落ち、四半期決算
- 画面: チャート（自前 Canvas のローソク足 + 出来高 + 移動平均 + ニュースピン + 自分の売買）、板、注文パネル、保有、カレンダー、ミッション、ヒント（Q&A形式。TIPS = コツ、GLOSS を TERM_GROUPS で分類 = 用語、TRIVIA = 答えに添える豆知識）
- 端末別レイアウト: `index.html` 先頭の小さなスクリプトが `<html data-device="pc|tablet|phone">` を付ける（タッチ端末かつ画面の短辺600px未満、または幅700px以下 = phone / それ以外のタッチ端末、または幅1120px以下 = tablet）。スマホ・タブレット専用の見た目は `style.css` 末尾の `[data-device=...]` だけに書き、PC の表示は変えない。スマホ・タブレットでは見出し＋流れる銘柄（`.hdr`）を上部に固定し。×1〜×4 で進めている間は全端末で新着ニュースを右下にポップアップ（`notifyNews`。loop からだけ呼ぶので「〜まで進める」では出ない）
- カブ先生: 出すのはチュートリアル（TUT。「はじめての1か月」の初回のみ。操作すると `tutEvent` で次へ進む）とリザルト画面（`senseiAdvice`）だけ
- デバッグ: `window.__kabutore`（G, newGame, tick, asset, rank, profile, runDay, nextDay, closeModal）

## 調整済みの重要定数（むやみに変えない）
- `MKT_SIG=0.17`、`NEWS_RATE`（ニュース頻度）。年率ボラの目安: 食品 約22% / 自動車・銀行 約32% / 新興 約67%
- 変更したら 1 年分を画面なしで回し（`runDay` を繰り返す）、上の数字とズレていないか確認する

## 未実装（次の候補）
信用取引・空売り（ランク6の解放予定）、OCO/IFD注文、NISAモード、歴史再現モード、2営業日の受渡

## 方針
- 日本語UI。用語は GLOSS に追加して点線ツールチップで解説
- 外部ライブラリは入れない。必要になったら先にユーザーに相談
- 日本式: 上昇=赤、下落=緑
