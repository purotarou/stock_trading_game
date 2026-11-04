#!/usr/bin/env python3
"""リアル相場の決算・配当・株主優待のデータを作り、data/events2020.js / data/events2026.js に書き出す。

ゲーム本体からは使わない、手元で実行するためのツール。株価のデータ（data/corona2020*.js / recent*.js）を先に作っておく。

    pip install yfinance pandas
    python3 tools/fetch_events.py --scenario real       # data/events2020.js（const EVENTS2020）。コロナショック版の50社
    python3 tools/fetch_events.py --scenario real2026   # data/events2026.js（const EVENTS2026）。2026年版の50社

中身（銘柄ごと）:
  div  … 配当の実績 [権利落ち日, 1株配当（円・株式分割の調整済み）]。Yahoo Finance（yfinance）。開始前の1年の分も入れる（利回りの表示用）
  earn … 決算短信・業績予想の修正・配当予想の修正の発表 [日付, 時刻, 種類（k = 決算短信 / r = 修正）, 見出し]。
         IR BANK の適時開示の一覧（https://irbank.net/<コード>/ir と各開示のページ）の日時と【速報】の要約から。期間中の分だけ
  perk … 株主優待（PERKS の表。当時の内容を調べて手で書いたもの。金額がはっきりしたものだけ yen に現金相当を入れ、割引券などは 0）
取得した HTML は .cache/irbank/ に保存して使い回す（--refresh で取り直す）。
"""
import argparse, json, re, sys, time, html, math
from datetime import date, timedelta
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
CACHE = ROOT / ".cache" / "irbank"

SCENARIOS = {
    # 株価のデータ（銘柄の一覧と営業日）・出力先・期間（hist_start = 配当の実績を見はじめる日）
    "real": {"files": ["corona2020.js", "corona2020_extra.js", "corona2020_ipo.js"], "var": "EVENTS2020", "out": "events2020.js", "hist_start": "2019-01-01"},
    "real2026": {"files": ["recent.js", "recent_extra.js", "recent_ipo.js"], "var": "EVENTS2026", "out": "events2026.js", "hist_start": "2025-01-01"},
}

# 株主優待（当時の内容）。{シナリオ: {コード: [(権利確定日, 必要な株数, 1回の現金相当, 継続保有の条件（年）, 内容), ...]}}
# 現金相当は、会社が金額を示しているもの（券の額面・「〇円相当」・ポイント）だけ。割引券・割引カード・運賃の割引・金額の示されていない
# 引換券や商品（マクドナルドの食事券、ディズニーのパスポートなど）は 0（表示だけ）。継続保有の条件が1年以上のものは、ゲームの期間（1年未満）では満たせない。
# 期間の外の権利確定日は書かない。出典は各社の適時開示・株主優待のページ、証券会社の優待情報（各行の上）
PERKS = {
    "real": {
        # ANA https://www.ana.co.jp/ja/jp/promotion/shareholderbenefits/
        "9202": [("2020-03-31", 100, 0, 0, "株主優待番号ご案内書1枚（ANA国内線の片道1区間が50%割引）とグループ優待券"), ("2020-09-30", 100, 0, 0, "株主優待番号ご案内書1枚（ANA国内線の片道1区間が50%割引）とグループ優待券")],
        # JAL https://www.kabuyutai.com/kobetu/jal.html（100〜199株は3月だけ）
        "9201": [("2020-03-31", 100, 0, 0, "株主割引券1枚（JAL国内線の片道1区間が50%割引）")],
        # オリエンタルランド https://www.kabuyutai.com/blog/2020/4661.html（100〜399株は3月の年1回）
        "4661": [("2020-03-31", 100, 0, 0, "東京ディズニーランド・シーの株主用1デーパスポート1枚")],
        # JR東日本 https://www2.jpx.co.jp/disc/90200/140120200204456701.pdf
        "9020": [("2020-03-31", 100, 0, 0, "株主優待割引券1枚（JR東日本の運賃・料金が4割引）")],
        # 東急 https://www.kabuyutai.com/kobetu/tokyu.html
        "9005": [("2020-03-31", 100, 0, 0, "株主ご優待券（東急グループの施設の割引券など）"), ("2020-09-30", 100, 0, 0, "株主ご優待券（東急グループの施設の割引券など）")],
        # HIS https://www.kabuyutai.com/kobetu/ryokou/his.html
        "9603": [("2020-04-30", 100, 0, 0, "旅行の割引券など"), ("2020-10-31", 100, 0, 0, "旅行の割引券など")],
        # 三越伊勢丹 https://www.kabuyutai.com/kobetu/imhds.html
        "3099": [("2020-03-31", 100, 0, 0, "株主優待カード（三越・伊勢丹などでの買い物が10%割引）"), ("2020-09-30", 100, 0, 0, "株主優待カード（三越・伊勢丹などでの買い物が10%割引）")],
        # 高島屋 https://www.kabuyutai.com/kobetu/takashimaya.html
        "8233": [("2020-02-29", 100, 0, 0, "株主優待カード（高島屋での買い物が10%割引）"), ("2020-08-31", 100, 0, 0, "株主優待カード（高島屋での買い物が10%割引）")],
        # すかいらーく https://www2.jpx.co.jp/disc/31970/140120200908490322.pdf（2020年12月末から減額）
        "3197": [("2020-06-30", 100, 3000, 0, "株主様ご優待カード3,000円分（ガスト・バーミヤンなどで使える）"), ("2020-12-31", 100, 2000, 0, "株主様ご優待カード2,000円分（2020年9月の制度変更で3,000円から減額）")],
        # 資生堂 https://corp.shiseido.com/jp/ir/investors/pdf/preferential_20200331_2.pdf（1年超の保有）
        "4911": [("2020-12-31", 100, 0, 1, "資生堂グループの商品セットから1つ（または寄付）")],
        # 藤田観光 https://finance.yahoo.co.jp/quote/9722.t/incentive
        "9722": [("2020-06-30", 100, 0, 0, "株主様ご優待券（ホテル椿山荘東京・ワシントンホテルなどの宿泊・飲食の割引）"), ("2020-12-31", 100, 0, 0, "株主様ご優待券（ホテル椿山荘東京・ワシントンホテルなどの宿泊・飲食の割引）")],
        # 神戸物産 https://www2.jpx.co.jp/disc/30380/140120190924400140.pdf（3年未満）
        "3038": [("2020-10-31", 100, 1000, 0, "業務スーパー商品券1,000円分（3年以上の保有なら3,000円分）")],
        # ニトリ https://www2.jpx.co.jp/disc/98430/140120150113004704.pdf
        "9843": [("2020-02-20", 100, 0, 0, "株主様お買物優待券5枚（1枚で買い物が10%割引）")],
        # マネックスグループ https://www2.jpx.co.jp/disc/86980/140120250210568759.pdf（2025年の変更前の条件）
        "8698": [("2020-03-31", 100, 0, 0, "マネックスポイント（マネックス証券に預け、期間内に取引した株主だけ。このゲームでは対象外）"), ("2020-09-30", 100, 0, 0, "マネックスポイント（マネックス証券に預け、期間内に取引した株主だけ。このゲームでは対象外）")],
        # SBIホールディングス https://www2.jpx.co.jp/disc/84730/140120200131454709.pdf
        "8473": [("2020-03-31", 100, 2000, 0, "暗号資産XRP 2,000円相当、またはサプリメントなどの商品から選ぶ")],
        # KDDI https://www.moneypost.jp/255146/3/
        "9433": [("2020-03-31", 100, 3000, 0, "au WALLET Market のカタログギフト3,000円相当（5年以上の保有なら5,000円相当）")],
        # 日本郵船 https://yutai-guide.daiwair.co.jp/stock/detail/9101
        "9101": [("2020-03-31", 100, 0, 0, "飛鳥クルーズの割引券")],
        # 商船三井 https://www.kabuyutai.com/kobetu/mol.html
        "9104": [("2020-03-31", 100, 0, 0, "クルーズの割引券2枚"), ("2020-09-30", 100, 0, 0, "クルーズの割引券2枚")],
        # JT https://matsunosuke.jp/jt-yuutai/（2019年12月から年1回・1年以上の保有）
        "2914": [("2020-12-31", 100, 2500, 1, "自社グループ商品（レトルトご飯・カップ麺など）2,500円相当、または寄付")],
        # 日本マクドナルド https://www2.jpx.co.jp/disc/27020/140120231219505300.pdf（2023年12月の変更前は保有期間の条件なし）
        "2702": [("2020-06-30", 100, 0, 0, "優待食事券1冊（バーガー・サイドメニュー・ドリンクの引換券が各6枚）"), ("2020-12-31", 100, 0, 0, "優待食事券1冊（バーガー・サイドメニュー・ドリンクの引換券が各6枚）")],
        # 吉野家 https://www.kabuyutai.com/kobetu/shoku/yoshinoya.html（2021年の変更前は300円券10枚）
        "9861": [("2020-02-29", 100, 3000, 0, "株主ご優待券300円×10枚（3,000円分）"), ("2020-08-31", 100, 3000, 0, "株主ご優待券300円×10枚（3,000円分）")],
        # ゼンショー https://www.kabuyutai.com/kobetu/shoku/zensho.html
        "7550": [("2020-03-31", 100, 1000, 0, "食事券500円×2枚（1,000円分。すき家・はま寿司などで使える）"), ("2020-09-30", 100, 1000, 0, "食事券500円×2枚（1,000円分。すき家・はま寿司などで使える）")],
    },
    "real2026": {
        # ANA https://downshifters.net/wp-content/uploads/2026/04/ana_20260430.pdf
        "9202": [("2026-03-31", 100, 0, 0, "株主優待番号ご案内書1枚（ANA国内線の片道1区間が50%割引）とグループ優待券"), ("2026-09-30", 100, 0, 0, "株主優待番号ご案内書1枚（ANA国内線の片道1区間が50%割引）とグループ優待券")],
        # JAL https://www.kabuyutai.com/kobetu/jal.html（100〜199株は3月だけ。2026年9月からの e JALポイントは翌3月までの保有が条件）
        "9201": [("2026-03-31", 100, 0, 0, "株主割引券1枚（JAL国内線の片道1区間が50%割引）と旅行商品の割引"), ("2026-09-30", 100, 0, 0, "e JALポイント1,000ポイント（翌年3月末まで持ち続けることが条件。このゲームでは確かめられないので対象外）")],
        # オリエンタルランド https://advance.quote.nomura.co.jp/meigara/nomura2/users/yutai/yutai_d.asp?RCODE=4661（通常は500株以上。2026年9月は特別優待）
        "4661": [("2026-03-31", 500, 0, 0, "株主用1デーパスポート1枚"), ("2026-09-30", 100, 0, 0, "特別優待（上場30周年）：株主用1デーパスポート1枚")],
        # JR東日本 https://www.jreast.co.jp/company/ir/information/treat02/（2026年から100株で株主サービス券。運賃の割引券は300株以上）
        "9020": [("2026-03-31", 100, 0, 0, "株主サービス券（NewDays 5%割引・ホテルや駅レンタカーの割引など）")],
        # 東急 https://www.kabuyutai.com/kobetu/tokyu.html
        "9005": [("2026-03-31", 100, 0, 0, "株主優待乗車証（きっぷ式）2枚と株主ご優待券"), ("2026-09-30", 100, 0, 0, "株主優待乗車証（きっぷ式）2枚と株主ご優待券")],
        # HIS https://money-lifehack.com/article/12794
        "9603": [("2026-04-30", 100, 0, 0, "旅行割引券2,000円分（買い物の金額に応じて使える割引券）とラグーナテンボスの割引券"), ("2026-10-31", 100, 0, 0, "旅行割引券2,000円分（買い物の金額に応じて使える割引券）とラグーナテンボスの割引券")],
        # 三越伊勢丹 https://www.kabuyutai.com/kobetu/imhds.html
        "3099": [("2026-03-31", 100, 0, 0, "株主優待カード（三越・伊勢丹などでの買い物が10%割引）"), ("2026-09-30", 100, 0, 0, "株主優待カード（三越・伊勢丹などでの買い物が10%割引）")],
        # 高島屋 https://www.kabuyutai.com/kobetu/takashimaya.html
        "8233": [("2026-02-28", 100, 0, 0, "株主優待カード（高島屋での買い物が10%割引。利用限度額15万円）"), ("2026-08-31", 100, 0, 0, "株主優待カード（高島屋での買い物が10%割引。利用限度額15万円）")],
        # すかいらーく https://www.kabuyutai.com/kobetu/skylark.html
        "3197": [("2026-06-30", 100, 2000, 0, "株主優待チケット（電子式）2,000円分（ガスト・バーミヤンなどで使える）")],
        # 藤田観光 https://finance.yahoo.co.jp/quote/9722.t/incentive
        "9722": [("2026-06-30", 100, 0, 0, "株主様ご優待券（ホテル椿山荘東京・ワシントンホテルなどの宿泊・飲食の割引）")],
        # トヨタ自動車 https://advance.quote.nomura.co.jp/meigara/nomura2/users/yutai/yutai_d.asp?RCODE=7203（1年未満は500円）
        "7203": [("2026-03-31", 100, 500, 0, "TOYOTA Wallet 残高500円分（1年以上の保有なら1,000円分）")],
        # サイバーエージェント https://gamebiz.jp/news/363326
        "4751": [("2026-09-30", 100, 0, 0, "ABEMAプレミアムの3か月無料クーポン")],
        # 神戸物産 https://www2.jpx.co.jp/disc/30380/140120250611586997.pdf（3年未満）
        "3038": [("2026-10-31", 100, 1000, 0, "Gyomucaカード1,000円分（3年以上の保有なら3,000円分）")],
        # ニトリ https://downshifters.net/wp-content/uploads/2025/07/nitorihd20250715.pdf（株式分割後は500株以上）
        "9843": [("2026-03-31", 500, 0, 0, "株主様お買物優待券5枚（1枚で買い物が10%割引）")],
        # マネックスグループ https://www2.jpx.co.jp/disc/86980/140120250210568759.pdf（100〜999株は100ポイント）
        "8698": [("2026-03-31", 100, 100, 0, "マネックスポイント100ポイント（1ポイント1円相当）"), ("2026-09-30", 100, 100, 0, "マネックスポイント100ポイント（1ポイント1円相当）")],
        # SBIホールディングス https://advance.quote.nomura.co.jp/meigara/nomura2/users/yutai/yutai_d.asp?RCODE=8473
        "8473": [("2026-03-31", 100, 2000, 0, "暗号資産XRP 2,000円相当、または商品セットから選ぶ")],
        # KDDI https://advance.quote.nomura.co.jp/meigara/nomura2/users/yutai/yutai_d.asp?RCODE=9433（株式分割後は200株以上・1年以上の保有）
        "9433": [("2026-03-31", 200, 2000, 1, "Pontaポイントなどから選ぶ特典2,000円相当")],
        # 日本郵船 https://yutai-guide.daiwair.co.jp/stock/detail/9101
        "9101": [("2026-03-31", 100, 0, 0, "飛鳥クルーズの10%割引券4枚")],
        # 商船三井 https://www.kabuyutai.com/kobetu/mol.html
        "9104": [("2026-03-31", 100, 0, 0, "クルーズの割引券2枚"), ("2026-09-30", 100, 0, 0, "クルーズの割引券2枚とフェリーの割引券1枚")],
        # 日本マクドナルド https://www2.jpx.co.jp/disc/27020/140120231219505300.pdf（3回連続で名簿に載る＝1年以上の保有）
        "2702": [("2026-06-30", 100, 0, 1, "優待食事券1冊（バーガー・サイドメニュー・ドリンクの引換券が各6枚）")],
        # 吉野家 https://www.kabuyutai.com/kobetu/shoku/yoshinoya.html
        "9861": [("2026-02-28", 100, 2000, 0, "株主ご優待券500円×4枚（2,000円分）"), ("2026-08-31", 100, 2000, 0, "株主ご優待券500円×4枚（2,000円分）")],
        # ゼンショー https://www.kabuyutai.com/kobetu/shoku/zensho.html
        "7550": [("2026-03-31", 100, 1000, 0, "食事券500円×2枚（1,000円分。すき家・はま寿司などで使える）"), ("2026-09-30", 100, 1000, 0, "食事券500円×2枚（1,000円分。すき家・はま寿司などで使える）")],
        # 三井不動産 https://advance.quote.nomura.co.jp/meigara/nomura2/users/yutai/yutai_d.asp?RCODE=8801（2026年3月から1年以上の保有）
        "8801": [("2026-03-31", 100, 1000, 1, "三井ショッピングパークポイント1,000ポイント")],
        # テルモ https://yutai-guide.daiwair.co.jp/stock/detail/4543
        "4543": [("2026-03-31", 100, 0, 0, "自社製品の優待割引販売（2年以上の保有で1,000円分のクーポン）"), ("2026-09-30", 100, 0, 0, "自社製品の優待割引販売（2年以上の保有で1,000円分のクーポン）")],
        # セコム https://advance.quote.nomura.co.jp/meigara/nomura2/users/yutai/yutai_d.asp?RCODE=9735
        "9735": [("2026-03-31", 100, 3000, 0, "防災備蓄品3,000円相当")],
        # 積水ハウス https://yutai-guide.daiwair.co.jp/stock/detail/1928
        "1928": [("2026-01-31", 1000, 0, 0, "魚沼産コシヒカリ（新米）5kg")],
    },
}

# IR BANK に【速報】の要約がない決算短信の見出しと本文（各社の決算短信の1ページ目「連結経営成績（累計）」から手で書いたもの）。
# 日本基準は経常利益、IFRS は税引前利益（ないときは親会社の所有者に帰属する利益）。％は前年同期比。キーは (コード, 発表日)
EARN_MANUAL = {
    ("4661", "2020-01-30"): ("オリエンタルランド、3Q経常4.6%減の1023億5800万円で着地", "オリエンタルランド、第3四半期の経常利益は4.6%減の1023億5800万円で着地"),
    ("8306", "2020-11-13"): ("三菱UFJ FG、2Q経常25.4%減の5902億5400万円で着地", "三菱UFJ FG、中間の経常利益は25.4%減の5902億5400万円で着地"),
    ("9984", "2020-08-11"): ("ソフトバンクG、1Q税引前利益50.9%減の8330億4700万円で着地", "ソフトバンクG、第1四半期の税引前利益は50.9%減の8330億4700万円、親会社の所有者に帰属する四半期利益は11.9%増の1兆2557億1200万円"),
    ("9984", "2020-11-09"): ("ソフトバンクG、2Q税引前利益22.9%増の1兆4414億7200万円で着地", "ソフトバンクG、中間の税引前利益は22.9%増の1兆4414億7200万円、親会社の所有者に帰属する四半期利益は346.7%増の1兆8832億1100万円"),
    ("4689", "2020-10-30"): ("Zホールディングス、2Q税引前利益14.8%増の867億4800万円で着地", "Zホールディングス、中間の税引前利益は14.8%増の867億4800万円、親会社の所有者に帰属する四半期利益は10.4%減の458億3700万円"),
    ("9433", "2020-07-31"): ("KDDI、1Q税引前利益14.0%増の2899億2700万円で着地", "KDDI、第1四半期の税引前利益は14.0%増の2899億2700万円で着地"),
    ("9433", "2020-10-30"): ("KDDI、2Q税引前利益6.9%増の5883億8500万円で着地", "KDDI、中間の税引前利益は6.9%増の5883億8500万円で着地"),
    ("8058", "2020-11-05"): ("三菱商事、2Q税引前利益59.7%減の1434億7700万円で着地", "三菱商事、中間の税引前利益は59.7%減の1434億7700万円、親会社の所有者に帰属する四半期利益は64.2%減の866億8700万円"),
    ("9861", "2020-01-10"): ("吉野家HD、3Q経常33億5100万円で黒字転換", "吉野家HD、第3四半期の経常利益は黒字転換の33億5100万円で着地"),
    ("4053", "2020-08-14"): ("Sun Asterisk、上場後初の決算。2Q累計の経常利益は5億6400万円", "Sun Asterisk、中間の経常利益は5億6400万円（前年同期は連結の数値なし）"),
    ("4053", "2020-11-11"): ("Sun Asterisk、3Q経常7億2100万円で着地", "Sun Asterisk、第3四半期の経常利益は7億2100万円で着地（前年同期は連結の数値なし）"),
    ("1375", "2020-11-05"): ("雪国まいたけ、上場後初の決算。2Q税引前利益22.6%増の30億1900万円", "雪国まいたけ、中間の税引前利益は22.6%増の30億1900万円で着地"),
    ("8473", "2026-07-31"): ("SBIHD、1Q税引前利益149.9%増の2258億1400万円で着地", "SBIHD、第1四半期の税引前利益は149.9%増の2258億1400万円、親会社の所有者に帰属する四半期利益は75.0%増の1480億6500万円"),
    ("4004", "2026-05-13"): ("レゾナックHD、1Q最終利益74.6%増の152億8300万円で着地", "レゾナックHD、第1四半期の親会社の所有者に帰属する四半期利益は74.6%増の152億8300万円、コア営業利益は126.4%増の336億1600万円"),
    ("9348", "2026-02-10"): ("ispace、3Q経常は-62億4000万円で赤字幅が縮小", "ispace、第3四半期の経常損益は62億4000万円の赤字（前年同期は67億7900万円の赤字）"),
    ("9348", "2026-05-15"): ("ispace、通期経常-81億4100万円で赤字幅が縮小", "ispace、通期の経常損益は81億4100万円の赤字（前期は113億3400万円の赤字）"),
    ("9348", "2026-08-07"): ("ispace、1Q経常は-63億3500万円で赤字拡大", "ispace、第1四半期の経常損益は63億3500万円の赤字（前年同期は28億7800万円の赤字）"),
    ("581A", "2026-07-14"): ("GO、上場後初の決算。通期経常145.2%増の64億5700万円", "GO、通期の経常利益は145.2%増の64億5700万円で着地"),
    ("581A", "2026-10-15"): ("GO、1Q経常30億2300万円で着地", "GO、第1四半期の経常利益は30億2300万円で着地（前年同期は四半期の数値なし）"),
    ("593A", "2026-08-14"): ("ティアフォー、上場後初の決算。3Q累計の経常損益は-40億8700万円", "ティアフォー、第3四半期累計の経常損益は40億8700万円の赤字（前年同期は四半期の数値なし）"),
}

# 前年の同じ時期に配当があったのに、今年の実績がない回（無配）の注記。ないものは「今回は配当がありません（無配）」。キーは (コード, 前年の権利落ち日 + 1年)
# 任天堂の2026年9月の中間配当は、11月の決算発表で金額が決まる（https://kabuyoho.jp/reportDps?bcode=7974）ので、無配ではない
DIV_NOTE = {
    ("7974", "2026-09-29"): "中間配当の金額は11月の決算発表で決まるため、このゲームの期間中は入金されません（無配ではありません）",
    ("9603", "2026-04-28"): "会社の予想どおり、中間配当はありません（期末だけの配当）",
}

UA = {"User-Agent":"Mozilla/5.0 (kabutore personal study tool)"}


def get(url, cache_name, refresh=False):
    CACHE.mkdir(parents=True, exist_ok=True)
    f = CACHE / cache_name
    if f.exists() and not refresh:
        return f.read_text(encoding="utf-8")
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                text = r.read().decode("utf-8")
            f.write_text(text, encoding="utf-8")
            time.sleep(1.5)   # 連続アクセスを控えめに
            return text
        except Exception as e:
            err = e
            time.sleep(3 * (attempt + 1))
    raise RuntimeError("%s を取得できません: %s" % (url, err))


def read_stocks(files):
    """株価のデータから、銘柄（コード・社名・上場日）と本編の営業日を読む。"""
    stocks, dates = [], None
    for name in files:
        f = DATA / name
        if not f.exists():
            print("  [情報] %s がないので、その銘柄はとばします" % name)
            continue
        main = f.read_text(encoding="utf-8").split("// 開始前の過去チャート")[0]
        ds = json.loads(re.search(r"^  dates: (\[.*?\]),$", main, re.M).group(1))
        dates = dates or ds
        for m in re.finditer(r'\{ code: "(\w+)", name: "([^"]*)"(.*?), prices: ', main):
            ipo = re.search(r'"date":"([\d-]+)"', m.group(3))
            if m.group(1) not in [s["code"] for s in stocks]:
                stocks.append({"code": m.group(1), "name": m.group(2), "from": ipo.group(1) if ipo else None})
    return stocks, dates


# ---- 決算（IR BANK） ----
DT = re.compile(r"<dt[^>]*>(\d{4}/\d\d/\d\d)</dt>")
DD = re.compile(r"<dd[^>]*>(.*?)</dd>", re.S)
ITEM = re.compile(r'<a[^>]*title="[^"|]*\| (.*?)（(\d{4}/\d\d/\d\d) (\d\d:\d\d)提出）"[^>]*href="/[\w]+/\d+"[^>]*>')
SUMMARY = re.compile(r'<a class="co_sm"[^>]*?title="([^"]*)"[^>]*>(.*?)</a>', re.S)


def tidy(s):
    """タグを外し、日本語の前後の空白を詰める（「経常 8.64%減 の」→「経常8.64%減の」。「ANA HD」のような英字どうしの空白は残す）。"""
    s = html.unescape(re.sub(r"<[^>]+>", "", s)).strip()
    s = re.sub(r"^[0-9A-Z]{4}(?:\s|&ensp;| )+", "", s)   # 先頭のコードを外す（「8233 髙島屋、…」→「髙島屋、…」）
    return re.sub(r"\s+", lambda m: " " if re.match(r"[\x21-\x7e]\s+[\x21-\x7e]", s[m.start() - 1: m.end() + 1]) else "", s)


def irbank_events(code, refresh):
    """適時開示の一覧から、決算短信・業績予想や配当予想の修正を [(日付, 時刻, 種類, 見出し, 本文, 開示のタイトル)] で返す。
    見出しは【速報】の短い要約、本文は長い要約（ないときは空）。"""
    top = get("https://irbank.net/%s/ir" % code, "%s_ir.html" % code, refresh)
    m = re.search(r'href="(/%s/\d{10,})"' % code, top)
    if not m:
        raise RuntimeError("開示へのリンクが見つかりません")
    page = get("https://irbank.net" + m.group(1), "%s_list.html" % code, refresh)   # 各開示のページには、その会社の開示の全履歴（【速報】の要約つき）が並ぶ
    out = []
    # このページ自身の開示は、一覧ではリンクなしで載る（要約もない）ので、上の【日時】【名称】【速報】から読む
    info = re.search(r'<dl id="info".*?</dl>', page, re.S)
    own = None
    if info:
        when = re.search(r"【日時】</dt><dd>(\d{4})年(\d+)月(\d+)日 (\d+)時(\d+)分", info.group(0))
        name = re.search(r"【名称】</dt><dd>(.*?)</dd>", info.group(0))
        sm = re.search(r'【速報】</dt><dd>.*?<a title="([^"]*)"[^>]*>(.*?)</a>', info.group(0), re.S)
        if when and name:
            y, mo, d, h, mi = when.groups()
            own = "%s-%02d-%02d" % (y, int(mo), int(d)), "%02d:%02d" % (int(h), int(mi)), html.unescape(name.group(1)), sm
    if own and "訂正" not in own[2]:
        summary, body = (tidy(own[3].group(2)), tidy(own[3].group(1))) if own[3] else ("", "")
        if "決算短信" in own[2]:
            out.append((own[0], own[1], "k", summary, body, own[2]))
        elif summary and ("修正" in own[2] or "修正" in summary):
            out.append((own[0], own[1], "r", summary, body, own[2]))
    for dm in DT.finditer(page):
        nxt = DT.search(page, dm.end())
        block = page[dm.end(): nxt.start() if nxt else len(page)]
        for dd in DD.findall(block):
            it = ITEM.search(dd)
            if not it:
                continue
            title, d, t = html.unescape(it.group(1)), it.group(2).replace("/", "-"), it.group(3)
            sm = SUMMARY.search(dd)
            summary, body = (tidy(sm.group(2)), tidy(sm.group(1))) if sm else ("", "")
            if "訂正" in title:   # 訂正のお知らせ（「過年度の決算短信等の訂正に関するお知らせ」なども）
                continue
            if "決算短信" in title:
                out.append((d, t, "k", summary, body, title))
            elif summary and ("修正" in title or "修正" in summary):
                out.append((d, t, "r", summary, body, title))
    # 同じ期の決算短信が何本もあるとき（期中レビュー完了後の再提出、日本基準と IFRS・米国基準の併載、三菱UFJ の「中間決算短信(連結)」など）は1件にする。
    # 日時はいちばん早いもの、見出しは【速報】のあるもの
    keep, seen = [], {}
    for e in sorted(out, key=lambda e: (e[0], e[1])):
        p = period(e[5]) if e[2] == "k" else None
        if p and p in seen:
            first = seen[p]
            if not first[3] and e[3]:
                keep[keep.index(first)] = seen[p] = (first[0], first[1], "k", e[3], e[4], first[5])
            continue
        if p:
            seen[p] = e
        keep.append(e)
    return keep


def period(title):
    """決算短信のタイトルから、どの期の何四半期か（年, 月, 四半期）。中間 = 第2四半期、なし = 通期。読めなければ None。"""
    m = re.search(r"(\d{4}|平成\d+|令和\d+)年(\d+)月期\s*(?:\()?(第(\d)四半期|中間)?", title)
    if not m:
        return None
    y = m.group(1)
    y = int(y) if y.isdigit() else int(y[2:]) + (1988 if y.startswith("平成") else 2018)
    q = int(m.group(4)) if m.group(4) else 2 if m.group(3) else 4
    return (y, int(m.group(2)), q)


def kessan_text(name, title):
    """【速報】がない決算短信の見出し（タイトルから期を取る）。"""
    m = re.search(r"((?:\d{4}|令和\d+|平成\d+)年\d+月期)(.*?)決算短信", title)
    q = (m.group(1) + m.group(2).replace("(", "（").replace(")", "）")).strip() if m else ""
    return "%s、%s決算を発表" % (name, q)


# ---- 配当（yfinance） ----
def dividends(code, start, last):
    import yfinance as yf
    t = yf.Ticker(code + ".T")
    dv = [(str(i.date()), float(v)) for i, v in t.dividends.items()]
    dv = [x for x in dv if x[0] <= last]
    sp = {str(i.date()): float(v) for i, v in t.splits.items()}
    close = None
    out, prev = [], None   # prev = 前回の配当の利回り（配当 ÷ その日の終値。終値は分割の調整済み）
    since = str(int(start[:4]) - 2) + "-01-01"   # 利回りの比較は、開始の2年前から（それより前の配当は見ない）
    for d, v in dv:
        if d < since:
            continue
        if close is None:
            h = t.history(start=since, end=last, auto_adjust=False, actions=False)
            close = {str(i.date()): float(c) for i, c in h["Close"].items()}
        px = close.get(d) or next((close[x] for x in sorted(close) if x >= d), None)
        # 株式分割の日と同じ権利落ち日の配当は、分割の調整が掛かっていないことがある（日本製鉄 2025-09-29 など）。
        # 利回りが前回より分割の比率の平方根を超えて大きいときだけ、分割の比率で割る（増配で伸びただけのものは割らない）
        if d in sp and sp[d] > 1 and prev and px and (v / px) / prev > math.sqrt(sp[d]):
            print("     [補正] %s の配当 %s を株式分割（1:%g）で %s に" % (d, v, sp[d], round(v / sp[d], 3)))
            v = v / sp[d]
        if px:
            prev = v / px
        if start <= d:
            out.append([d, round(v, 3)])
    return out


def div_skips(dv, dates, code):
    """前年の同じ時期（±45日）に配当があったのに、今年の実績がない回。[権利付き最終日, 注記]。
    予定の権利落ち日 = 前年の権利落ち日の1年後（以降の最初の営業日）、権利付き最終日はその前の営業日。"""
    out = []
    for ex, _ in dv:
        p = "%d%s" % (int(ex[:4]) + 1, ex[4:])
        if p <= dates[0] or p > dates[-1]:
            continue
        lo, hi = str(date.fromisoformat(p) - timedelta(days=45)), str(date.fromisoformat(p) + timedelta(days=45))
        if any(lo <= e <= hi for e, _ in dv):
            continue
        if int(ex[8:]) >= 24:   # 月末が権利確定日（ほとんどの会社）：その月の最終営業日の2営業日前
            k = max(i for i, d in enumerate(dates) if d[:7] == p[:7]) - 2
        else:                   # 月の途中が権利確定日（ニトリの20日など）：予定の権利落ち日の前の営業日
            k = next(i for i, d in enumerate(dates) if d >= p) - 1
        out.append([dates[k], DIV_NOTE.get((code, p), "")])
    return out


def perk_rounds(rows, dates, code, name, warn):
    """優待の表を、権利付き最終日（この日の引けに持っていれば権利が付く）つきの形にする。
    権利確定日が休みなら直前の営業日を権利確定日とし、その2営業日前が権利付き最終日（株の受け渡しは2営業日後）。"""
    out = []
    for rec, lot, yen, hold, text in rows:
        r = [d for d in dates if d <= rec]
        if not r or dates.index(r[-1]) < 2 or (rec > dates[-1] and rec[:7] != dates[-1][:7]):   # データの最終日より後の月の権利確定日は入れない
            warn.append("%s %s: 優待の権利確定日 %s が期間の外" % (code, name, rec))
            continue
        out.append({"d": dates[dates.index(r[-1]) - 2], "rec": rec, "lot": lot, "yen": yen, "hold": hold, "text": text})
    return out or None


def main():
    ap = argparse.ArgumentParser(description="リアル相場の決算・配当・株主優待のデータを作る")
    ap.add_argument("--scenario", required=True, choices=list(SCENARIOS))
    ap.add_argument("--refresh", action="store_true", help="IR BANK の HTML を取り直す（使い回さない）")
    args = ap.parse_args()
    S = SCENARIOS[args.scenario]
    stocks, dates = read_stocks(S["files"])
    if not dates:
        sys.exit("株価のデータがありません")
    first, last = dates[0], dates[-1]
    print("期間: %s 〜 %s（%d銘柄）" % (first, last, len(stocks)))
    res, warn = {}, []
    for i, s in enumerate(stocks, 1):
        code, name = s["code"], s["name"]
        print("[%2d/%d] %s %s" % (i, len(stocks), code, name))
        dv = dividends(code, S["hist_start"], last)
        ev = []
        try:
            for d, t, k, summary, body, title in irbank_events(code, args.refresh):
                if not (first <= d <= last) or (s["from"] and d < s["from"]):
                    continue
                if k == "k" and not summary and (code, d) in EARN_MANUAL:
                    summary, body = EARN_MANUAL[code, d]
                elif k == "k" and not summary:
                    warn.append("%s %s: %s の決算短信に要約がない（EARN_MANUAL に足す）" % (code, name, d))
                ev.append([d, t, k, summary or kessan_text(re.sub(r"\(当時.*?\)", "", name), title), body if body != summary else ""])
        except Exception as e:
            warn.append("%s %s: 決算を取得できません（%s）" % (code, name, e))
        ev.sort()
        nk = sum(1 for e in ev if e[2] == "k")
        print("     配当 %d件（期間中 %d）・決算短信 %d件・修正 %d件" % (len(dv), sum(1 for d in dv if d[0] >= first), nk, len(ev) - nk))
        if nk == 0:
            warn.append("%s %s: 期間中の決算短信がない" % (code, name))
        res[code] = {"div": dv, "skip": div_skips(dv, dates, code), "earn": ev, "perk": perk_rounds(PERKS[args.scenario].get(code, []), dates, code, name, warn)}
        for d, note in res[code]["skip"]:
            print("     [無配] %s（権利付き最終日）%s" % (d, note or ""))
    out = DATA / S["out"]
    dump = lambda x: json.dumps(x, ensure_ascii=False, separators=(",", ":"))
    lines = ["// tools/fetch_events.py で自動生成。手で編集しない（優待は tools/fetch_events.py の PERKS を直す）。",
             "// 出典: 配当 = Yahoo Finance（yfinance 経由）、決算 = IR BANK の適時開示の一覧と【速報】の要約、優待 = 各社の資料（PERKS の出典）。個人利用の範囲で使うこと。",
             "const %s = {" % S["var"], "  first: %s, last: %s," % (dump(first), dump(last)), "  stocks: {"]
    for code, r in res.items():
        lines.append("    %s: { div: %s, skip: %s, earn: %s, perk: %s }," % (dump(code), dump(r["div"]), dump(r["skip"]), dump(r["earn"]), dump(r["perk"])))
    lines += ["  }", "};", ""]
    out.write_text("\n".join(lines), encoding="utf-8")
    print("\n書き出し: %s（%d銘柄）" % (out, len(res)))
    for w in warn:
        print("  [警告] " + w)


if __name__ == "__main__":
    main()
