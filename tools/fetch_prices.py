#!/usr/bin/env python3
"""2020年の実在銘柄の株価を Yahoo Finance (yfinance) から取得し、data/corona2020.js に書き出す。

ゲーム本体からは使わない、手元で1回だけ実行するためのツール。

    pip install yfinance pandas
    python3 tools/fetch_prices.py

使う価格は Close（株式分割のみ反映・配当は反映しない）に固定している。
"""

import json
import sys
import time
from pathlib import Path

try:
    import pandas as pd
    import yfinance as yf
except ImportError:
    sys.exit("yfinance / pandas が見つかりません。先に `pip install yfinance pandas` を実行してください。")

START = "2020-01-01"
END = "2021-01-01"  # yfinance の end は「その日を含まない」ので翌年1/1を指定
OUT = Path(__file__).resolve().parent.parent / "data" / "corona2020.js"
RETRIES = 3
PRICE_COLUMN = "Close"  # auto_adjust=False のときの Close = 分割のみ反映。Adj Close は使わない

STOCKS = [
    ("9202", "ANAホールディングス", "空運"),
    ("9201", "日本航空", "空運"),
    ("4661", "オリエンタルランド", "サービス"),
    ("9020", "JR東日本", "陸運"),
    ("9005", "東急", "陸運"),
    ("9603", "エイチ・アイ・エス", "サービス"),
    ("3099", "三越伊勢丹HD", "小売"),
    ("8233", "高島屋", "小売"),
    ("3197", "すかいらーくHD", "小売"),
    ("4911", "資生堂", "化学"),
    ("9722", "藤田観光", "サービス"),
    ("8306", "三菱UFJフィナンシャル・グループ", "銀行"),
    ("7203", "トヨタ自動車", "輸送用機器"),
    ("7974", "任天堂", "その他製品"),
    ("6758", "ソニーグループ", "電気機器"),
    ("2413", "エムスリー", "サービス"),
    ("4751", "サイバーエージェント", "サービス"),
    ("9984", "ソフトバンクグループ", "情報・通信"),
    ("4689", "LINEヤフー(当時Zホールディングス)", "情報・通信"),
    ("3038", "神戸物産", "卸売"),
    ("9843", "ニトリホールディングス", "小売"),
    ("8698", "マネックスグループ", "証券"),
    ("8473", "SBIホールディングス", "証券"),
    ("9433", "KDDI", "情報・通信"),
    ("4519", "中外製薬", "医薬品"),
    ("8035", "東京エレクトロン", "電気機器"),
    ("6857", "アドバンテスト", "電気機器"),
    ("5401", "日本製鉄", "鉄鋼"),
    ("9101", "日本郵船", "海運"),
    ("9104", "商船三井", "海運"),
]


def fetch_one(code):
    """1銘柄の終値を {"YYYY-MM-DD": 値} で返す。取れなければ例外。"""
    last_err = None
    for attempt in range(1, RETRIES + 1):
        try:
            df = yf.Ticker(code + ".T").history(start=START, end=END, auto_adjust=False, actions=False)
            if df is None or df.empty or PRICE_COLUMN not in df.columns:
                raise ValueError("データが空です（上場廃止・コード違い・通信制限の可能性）")
            # auto_adjust=True だと Adj Close 列が消え、Close が配当調整済みになる。
            # Adj Close 列があること = 調整が掛かっていない Close が返っている証拠。
            if "Adj Close" not in df.columns:
                raise RuntimeError("auto_adjust=False が効いていません（Close が配当調整済みの恐れ）。yfinance を確認してください")
            s = df[PRICE_COLUMN].dropna()
            if s.empty:
                raise ValueError("終値がすべて欠損しています")
            return {ts.strftime("%Y-%m-%d"): float(v) for ts, v in s.items()}
        except Exception as e:  # yfinance は色々な例外を投げるので全部拾って再試行
            last_err = e
            if attempt < RETRIES:
                time.sleep(2 * attempt)
    raise RuntimeError(str(last_err))


def fill_gaps(dates, series):
    """dates に合わせた価格リストと、埋めた日の一覧 [(日付, 理由)] を返す。"""
    prices, filled = [], []
    prev = None
    for d in dates:
        v = series.get(d)
        if v is None:
            if prev is not None:
                v = prev
                filled.append((d, "前日の値で補完"))
            else:
                filled.append((d, "先頭の欠損のため最初の取得値で補完"))
        prices.append(v)
        if v is not None:
            prev = v
    # 先頭が欠けていた場合は、最初に取れた値でさかのぼって埋める
    first = next(v for v in prices if v is not None)
    prices = [first if v is None else v for v in prices]
    return prices, filled


def round_price(v):
    r = round(v, 2)
    return int(r) if r == int(r) else r


def write_js(dates, stocks):
    OUT.parent.mkdir(parents=True, exist_ok=True)
    dump = lambda x: json.dumps(x, ensure_ascii=False, separators=(",", ":"))
    lines = [
        "// tools/fetch_prices.py で自動生成。手で編集しない。",
        "// 出典: Yahoo Finance（yfinance 経由）。個人利用の範囲で使うこと。",
        "const CORONA2020 = {",
        "  dates: " + dump(dates) + ",",
        "  stocks: [",
    ]
    for s in stocks:
        lines.append(
            "    { code: %s, name: %s, sector: %s, prices: %s },"
            % (dump(s["code"]), dump(s["name"]), dump(s["sector"]), dump(s["prices"]))
        )
    lines += ["  ]", "};", ""]
    OUT.write_text("\n".join(lines), encoding="utf-8")


def width(s):
    """全角を2文字として数えた表示幅。"""
    return sum(2 if ord(c) > 0x7F else 1 for c in s)


def pad(s, n):
    return s + " " * max(0, n - width(s))


def verify(dates, stocks, failed, fill_report):
    """取得後の自動検証。結果を OK / 警告 で表示する。"""
    warnings = 0

    def result(ok, msg):
        nonlocal warnings
        if not ok:
            warnings += 1
        print("  [%s] %s" % ("OK  " if ok else "警告", msg))

    print("\n=== 検証 ===")
    result(dates[0] == "2020-01-06", "初日: %s（期待 2020-01-06）" % dates[0])
    result(dates[-1] == "2020-12-30", "最終日: %s（期待 2020-12-30）" % dates[-1])

    bad = [s["code"] for s in stocks if len(s["prices"]) != len(dates)]
    result(not bad, "全銘柄で prices の長さ = dates（%d日）%s" % (len(dates), "" if not bad else " 不一致: " + ", ".join(bad)))

    if failed:
        result(False, "取得失敗 %d銘柄: %s" % (len(failed), ", ".join("%s %s" % (c, n) for c, n, _ in failed)))
    else:
        result(True, "取得失敗: なし")

    counts = {}
    for code, name, _, _ in fill_report:
        counts.setdefault((code, name), 0)
        counts[(code, name)] += 1
    if counts:
        print("  [情報] 前日の値で補完した銘柄:")
        for (code, name), n in counts.items():
            print("         %s %s  %d日" % (code, pad(name, 34), n))
    else:
        print("  [OK  ] 補完した銘柄: なし")

    nintendo = next((s for s in stocks if s["code"] == "7974"), None)
    if nintendo is None:
        result(False, "任天堂(7974)が取得できていないため、任天堂の検証をスキップ")
    else:
        p = nintendo["prices"]
        if "2020-12-30" in dates:
            v = p[dates.index("2020-12-30")]
            result(abs(v - 6583) <= 1, "任天堂 2020-12-30 終値: %s 円（期待 6583 ±1）" % v)
        else:
            result(False, "任天堂 2020-12-30 が dates にありません")
        lo = min(p)
        lo_date = dates[p.index(lo)]
        result(lo_date.startswith("2020-03"), "任天堂 年間最安値: %s 円 / %s（3月のはず）" % (lo, lo_date))

    jumps = []
    for s in stocks:
        p = s["prices"]
        for i in range(1, len(p)):
            ch = (p[i] / p[i - 1] - 1) * 100
            if abs(ch) > 30:
                jumps.append((s["code"], s["name"], dates[i], p[i - 1], p[i], ch))
    if jumps:
        result(False, "前日比 ±30%% 超の日が %d件（株式分割の調整ミスの疑い）:" % len(jumps))
        for code, name, d, a, b, ch in jumps:
            print("         %s %s  %s  %s → %s (%+.1f%%)" % (code, pad(name, 34), d, a, b, ch))
    else:
        result(True, "前日比 ±30% 超の日: なし")

    print("\n検証結果: %s" % ("すべて OK" if warnings == 0 else "警告 %d件（上を確認してください）" % warnings))


def main():
    print("取得列: %s（株式分割のみ反映・配当は反映しない / auto_adjust=False）" % PRICE_COLUMN)
    raw, failed = {}, []
    for i, (code, name, _) in enumerate(STOCKS, 1):
        print("[%2d/%d] %s %s ... " % (i, len(STOCKS), code, name), end="", flush=True)
        try:
            raw[code] = fetch_one(code)
            print("%d日分" % len(raw[code]))
        except Exception as e:
            failed.append((code, name, str(e)))
            print("失敗")
        time.sleep(0.5)  # 連続アクセスを控えめに

    if not raw:
        sys.exit("1銘柄も取得できませんでした。ネットワークや yfinance のバージョンを確認してください。")

    # 取引日 = 取得できた銘柄のどれかに値がある日（東証の営業日にほぼ一致）
    dates = sorted(set().union(*[set(s) for s in raw.values()]))

    stocks, fill_report = [], []
    for code, name, sector in STOCKS:
        if code not in raw:
            continue
        prices, filled = fill_gaps(dates, raw[code])
        assert len(prices) == len(dates)
        stocks.append({"code": code, "name": name, "sector": sector,
                       "prices": [round_price(v) for v in prices]})
        for d, why in filled:
            fill_report.append((code, name, d, why))

    write_js(dates, stocks)
    print("\n書き出し: %s（%d銘柄 × %d日, %s 〜 %s）" % (OUT, len(stocks), len(dates), dates[0], dates[-1]))

    print("\n=== 欠損の補完 ===")
    if fill_report:
        for code, name, d, why in fill_report:
            print("  %s %s  %s  %s" % (code, pad(name, 34), d, why))
    else:
        print("  なし")

    print("\n=== 取得できなかった銘柄 ===")
    if failed:
        for code, name, err in failed:
            print("  %s %s  %s" % (code, pad(name, 34), err))
    else:
        print("  なし")

    print("\n=== 年間サマリー ===")
    print("  %s %s %10s %10s %10s %10s %8s" % ("コード", pad("銘柄", 34), "初日終値", "最高値", "最安値", "年末終値", "騰落率"))
    for s in stocks:
        p = s["prices"]
        hi, lo = max(p), min(p)
        chg = (p[-1] / p[0] - 1) * 100
        print("  %-6s %s %10s %10s %10s %10s %+7.1f%%  (高 %s / 安 %s)" % (
            s["code"], pad(s["name"], 34), p[0], hi, lo, p[-1], chg,
            dates[p.index(hi)], dates[p.index(lo)]))
    print("\n※ 騰落率は「最初の取引日の終値 → 最後の取引日の終値」で計算しています。")

    verify(dates, stocks, failed, fill_report)


if __name__ == "__main__":
    main()
