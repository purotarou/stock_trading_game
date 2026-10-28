#!/usr/bin/env python3
"""実在銘柄の株価を Yahoo Finance (yfinance) から取得し、data/ 以下の .js に書き出す。

ゲーム本体からは使わない、手元で1回だけ実行するためのツール。--scenario で何を作るかを必ず指定する。

    pip install yfinance pandas
    python3 tools/fetch_prices.py --scenario corona2020   # data/corona2020.js（const CORONA2020）。2020年
    python3 tools/fetch_prices.py --scenario recent       # data/recent.js（const RECENT）。2026-01-01 〜 2026-09-30

使う価格は Close（株式分割のみ反映・配当は反映しない）に固定している。

    python3 tools/fetch_prices.py --scenario corona2020 --history

は、開始前の過去チャート用に 2019年の日足（始値・高値・安値・終値・出来高）だけを取得し、
今ある data/corona2020.js の末尾に CORONA2020.history として足す（2020年の dates / stocks / prices には触れない）。
--history なしで実行したときも、本編のあとに過去分を取得して一緒に書き出す。
シナリオごとの期間・出力先・変数名・銘柄名の上書き・検証の期待値は SCENARIOS にまとめてある。
"""

import argparse
import hashlib
import json
import re
import sys
import time
from datetime import date, timedelta
from pathlib import Path

try:
    import pandas as pd
    import yfinance as yf
except ImportError:
    sys.exit("yfinance / pandas が見つかりません。先に `pip install yfinance pandas` を実行してください。")

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
CORONA_FILE = DATA_DIR / "corona2020.js"
# start / end は yfinance に渡す値。end は「その日を含まない」ので、最終日の翌日を指定する。
# last は本編の最終日（これより後の日は捨てる）。hist_last は過去分の最終日（含める）。
# expect_* は検証の期待値。食い違っても止まらず警告を出す。
SCENARIOS = {
    "corona2020": {
        "var": "CORONA2020",
        "out": CORONA_FILE,
        "start": "2020-01-01", "end": "2021-01-01", "last": "2020-12-31",
        "hist_start": "2019-01-01", "hist_last": "2019-12-31",
        "expect_first": "2020-01-06", "expect_last": "2020-12-30",
        "expect_hist_first": "2019-01-04", "expect_hist_last": "2019-12-30",
        "names": {},
        "nintendo_check": True,  # 任天堂 2020-12-30 = 6583円 / 年間最安値が3月、の検証はこのシナリオだけ
    },
    "recent": {
        "var": "RECENT",
        "out": DATA_DIR / "recent.js",
        "start": "2026-01-01", "end": "2026-10-01", "last": "2026-09-30",
        "hist_start": "2025-01-01", "hist_last": "2025-12-31",
        "expect_first": "2026-01-05", "expect_last": "2026-09-30",
        "expect_hist_first": "2025-01-06", "expect_hist_last": "2025-12-30",
        "names": {"4689": "LINEヤフー"},
        "nintendo_check": False,
    },
}

# main() が選ばれたシナリオの値で上書きする（use_scenario）
SCEN = None
VAR = START = END = LAST = HIST_START = HIST_LAST = HIST_MARK = None
OUT = None
RETRIES = 3
PRICE_COLUMN = "Close"  # auto_adjust=False のときの Close = 分割のみ反映。Adj Close は使わない
OHLCV = ["Open", "High", "Low", "Close", "Volume"]

BASE_STOCKS = [
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
STOCKS = BASE_STOCKS


def use_scenario(name):
    """選ばれたシナリオの期間・出力先・変数名・銘柄名を、このファイルの定数に反映する。"""
    global SCEN, VAR, START, END, LAST, HIST_START, HIST_LAST, HIST_MARK, OUT, STOCKS
    SCEN = SCENARIOS[name]
    VAR, OUT = SCEN["var"], SCEN["out"]
    START, END, LAST = SCEN["start"], SCEN["end"], SCEN["last"]
    HIST_START, HIST_LAST = SCEN["hist_start"], SCEN["hist_last"]
    HIST_MARK = VAR + ".history = "
    STOCKS = [(c, SCEN["names"].get(c, n), s) for c, n, s in BASE_STOCKS]
    # corona2020.js を別シナリオの出力先にしてしまう設定ミスの防止
    if name != "corona2020" and OUT.resolve() == CORONA_FILE.resolve():
        sys.exit("シナリオ %s の出力先が %s になっています。corona2020.js には書き込めません。" % (name, CORONA_FILE))


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest() if path.exists() else None


def fetch_one(code, start=None, end=None, ohlcv=False):
    """1銘柄の終値を {"YYYY-MM-DD": 値} で返す（ohlcv=True なら {"YYYY-MM-DD": (始値, 高値, 安値, 終値, 出来高)}）。取れなければ例外。"""
    start, end = start or START, end or END
    last_err = None
    for attempt in range(1, RETRIES + 1):
        try:
            df = yf.Ticker(code + ".T").history(start=start, end=end, auto_adjust=False, actions=False)
            if df is None or df.empty or PRICE_COLUMN not in df.columns:
                raise ValueError("データが空です（上場廃止・コード違い・通信制限の可能性）")
            # auto_adjust=True だと Adj Close 列が消え、Close が配当調整済みになる。
            # Adj Close 列があること = 調整が掛かっていない Close が返っている証拠。
            if "Adj Close" not in df.columns:
                raise RuntimeError("auto_adjust=False が効いていません（Close が配当調整済みの恐れ）。yfinance を確認してください")
            if ohlcv:
                df = df.dropna(subset=["Open", "High", "Low", "Close"])
                if df.empty:
                    raise ValueError("日足がすべて欠損しています")
                vol = df["Volume"] if "Volume" in df.columns else pd.Series(0, index=df.index)
                return {ts.strftime("%Y-%m-%d"): (float(r.Open), float(r.High), float(r.Low), float(r.Close), 0 if pd.isna(v) else int(v))
                        for (ts, r), v in zip(df.iterrows(), vol)}
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


def fill_ohlcv(dates, series):
    """過去分の日足を dates に合わせる。途中の欠損は前日の終値で平らな足（出来高0）にし、
    最初に値が取れた日より前（上場前など）は補完せず null のままにする。"""
    o, h, l, c, v, filled = [], [], [], [], [], []
    prev = None
    for d in dates:
        x = series.get(d)
        if x is None and prev is not None:
            x = (prev, prev, prev, prev, 0)
            filled.append((d, "前日の終値で平らな足（出来高0）に補完"))
        elif x is None:
            filled.append((d, "最初の取得日より前のため補完しない（null）"))
        for arr, k in ((o, 0), (h, 1), (l, 2), (c, 3)):
            arr.append(None if x is None else round_price(x[k]))
        v.append(None if x is None else x[4])
        if x is not None:
            prev = x[3]
    return {"o": o, "h": h, "l": l, "c": c, "v": v}, filled


def history_js(hist):
    dump = lambda x: json.dumps(x, ensure_ascii=False, separators=(",", ":"))
    lines = [
        "// 開始前の過去チャート（%s年の日足。始値・高値・安値・終値・出来高。株式分割のみ反映・配当は反映しない）" % hist["dates"][0][:4],
        HIST_MARK + "{",
        "  dates: " + dump(hist["dates"]) + ",",
        "  stocks: {",
    ]
    for code, s in hist["stocks"].items():
        lines.append("    %s: { o: %s, h: %s, l: %s, c: %s, v: %s }," % (dump(code), dump(s["o"]), dump(s["h"]), dump(s["l"]), dump(s["c"]), dump(s["v"])))
    lines += ["  }", "};", ""]
    return "\n".join(lines)


def write_history(hist):
    """今ある出力ファイルの末尾の過去分だけを差し替える（本編の文字列はそのまま残す）。"""
    text = OUT.read_text(encoding="utf-8")
    cut = text.find("// 開始前の過去チャート")
    if cut >= 0:
        text = text[:cut]
    OUT.write_text(text + history_js(hist), encoding="utf-8")


def read_js_closes():
    """今ある出力ファイルから、各銘柄の本編の最初の終値と dates を読む（検証用）。"""
    text = OUT.read_text(encoding="utf-8")
    dates = json.loads(re.search(r"^  dates: (\[.*?\]),$", text, re.M).group(1))
    first = {}
    for m in re.finditer(r'\{ code: "(\w+)", .*?, prices: \[([^,\]]+)', text):
        first[m.group(1)] = float(m.group(2))
    return dates, first


def write_js(dates, stocks):
    OUT.parent.mkdir(parents=True, exist_ok=True)
    dump = lambda x: json.dumps(x, ensure_ascii=False, separators=(",", ":"))
    lines = [
        "// tools/fetch_prices.py で自動生成。手で編集しない。",
        "// 出典: Yahoo Finance（yfinance 経由）。個人利用の範囲で使うこと。",
        "const %s = {" % VAR,
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


def fetch_history(cmp_date):
    """過去分の日足を取得して検証し、書き出す形 {dates, stocks: {code: {o,h,l,c,v}}} で返す。
    cmp_date（本編の初日）の始値・終値との比較用に、その日まで取得する（書き出すのは hist_last までだけ）。"""
    fetch_end = (date.fromisoformat(cmp_date) + timedelta(days=1)).isoformat()
    print("\n=== 過去チャート（%s 〜 %s の日足）の取得 ===" % (HIST_START, HIST_LAST))
    raw, failed = {}, []
    for i, (code, name, _) in enumerate(STOCKS, 1):
        print("[%2d/%d] %s %s ... " % (i, len(STOCKS), code, name), end="", flush=True)
        try:
            raw[code] = fetch_one(code, HIST_START, fetch_end, ohlcv=True)
            print("%d日分" % sum(1 for d in raw[code] if d <= HIST_LAST))
        except Exception as e:
            failed.append((code, name, str(e)))
            print("失敗")
        time.sleep(0.5)
    if not raw:
        sys.exit("過去分を1銘柄も取得できませんでした。ネットワークや yfinance のバージョンを確認してください。")

    dates = sorted(set().union(*[{d for d in s if d <= HIST_LAST} for s in raw.values()]))
    stocks, fill_report = {}, []
    for code, name, _ in STOCKS:
        if code not in raw:
            continue
        stocks[code], filled = fill_ohlcv(dates, raw[code])
        for d, why in filled:
            fill_report.append((code, name, d, why))
    hist = {"dates": dates, "stocks": stocks}
    verify_history(hist, raw, failed, fill_report, cmp_date)
    return hist


def verify_history(hist, raw, failed, fill_report, cmp_date):
    warnings = 0

    def result(ok, msg):
        nonlocal warnings
        if not ok:
            warnings += 1
        print("  [%s] %s" % ("OK  " if ok else "警告", msg))

    dates, stocks = hist["dates"], hist["stocks"]
    names = {c: n for c, n, _ in STOCKS}
    print("\n=== 過去分の検証 ===")
    result(dates[0] == SCEN["expect_hist_first"], "初日: %s（期待 %s = 大発会）" % (dates[0], SCEN["expect_hist_first"]))
    result(dates[-1] == SCEN["expect_hist_last"], "最終日: %s（期待 %s = 大納会）" % (dates[-1], SCEN["expect_hist_last"]))
    print("  [情報] 日数: %d日" % len(dates))
    bad = [c for c, s in stocks.items() if any(len(s[k]) != len(dates) for k in "ohlcv")]
    result(not bad, "全銘柄で日数が同じ（%d日）%s" % (len(dates), "" if not bad else " 不一致: " + ", ".join(bad)))
    if failed:
        result(False, "取得失敗 %d銘柄: %s（その銘柄は過去チャートなし）" % (len(failed), ", ".join("%s %s" % (c, n) for c, n, _ in failed)))
    else:
        result(True, "取得失敗: なし")
    counts = {}
    for code, name, _, why in fill_report:
        counts.setdefault((code, name, why), 0)
        counts[(code, name, why)] += 1
    if counts:
        print("  [情報] 補完した銘柄:")
        for (code, name, why), n in counts.items():
            print("         %s %s  %d日  %s" % (code, pad(name, 34), n, why))
    else:
        print("  [OK  ] 補完した銘柄: なし")

    novol = [c for c, s in stocks.items() if not any(s["v"])]
    result(not novol, "出来高: %s" % ("全銘柄で取得" if not novol else "取れなかった銘柄 " + ", ".join(novol)))
    badbar = [(c, dates[i]) for c, s in stocks.items() for i in range(len(dates))
              if s["c"][i] is not None and not (s["l"][i] <= min(s["o"][i], s["c"][i]) and s["h"][i] >= max(s["o"][i], s["c"][i]))]
    result(not badbar, "高値 ≧ 始値・終値 ≧ 安値: %s" % ("すべて成立" if not badbar else "%d件 不成立 例 %s" % (len(badbar), badbar[:3])))

    jumps = []
    for code, s in stocks.items():
        c = s["c"]
        for i in range(1, len(c)):
            if c[i] is None or c[i - 1] is None:
                continue
            ch = (c[i] / c[i - 1] - 1) * 100
            if abs(ch) > 30:
                jumps.append((code, names[code], dates[i], c[i - 1], c[i], ch))
    if jumps:
        result(False, "前日比 ±30%% 超の日が %d件（株式分割の調整ミスの疑い）:" % len(jumps))
        for code, name, d, a, b, ch in jumps:
            print("         %s %s  %s  %s → %s (%+.1f%%)" % (code, pad(name, 34), d, a, b, ch))
    else:
        result(True, "前日比 ±30% 超の日: なし")

    # 過去分の最終日 → 本編の初日。始値・終値は取得し直した値、「データ」は出力ファイルの初日の終値
    js_first = read_js_closes()[1] if OUT.exists() else {}
    md = lambda d: "%d/%d" % (int(d[5:7]), int(d[8:10]))
    lastl, cmpl = md(dates[-1]), md(cmp_date)
    print("\n  過去分の最終日（%s）の終値と、%s の比較（±10%% を超えたら警告）" % (dates[-1], cmp_date))
    print("  %s %s %10s %10s %8s %10s %8s %10s" % ("コード", pad("銘柄", 34), lastl + "終値", cmpl + "始値", "差", cmpl + "終値", "差", "データ"))
    far = []
    for code, s in stocks.items():
        last = s["c"][-1]
        x = raw[code].get(cmp_date)
        if last is None or x is None:
            far.append(code)
            print("  %-6s %s  比較できません（%s または %s の値がない）" % (code, pad(names[code], 34), lastl, cmpl))
            continue
        go, gc = (x[0] / last - 1) * 100, (x[3] / last - 1) * 100
        js = js_first.get(code)
        mismatch = js is not None and abs(js - round_price(x[3])) > 0.011
        if abs(go) > 10 or abs(gc) > 10 or mismatch:
            far.append(code)
        print("  %-6s %s %10s %10s %+7.1f%% %10s %+7.1f%% %10s%s" % (
            code, pad(names[code], 34), last, round_price(x[0]), go, round_price(x[3]), gc,
            "—" if js is None else js, "  ← 取得し直した終値と違う（分割調整の基準ずれの恐れ）" if mismatch else ""))
    result(not far, "%s 終値と %s の始値・終値の差がすべて ±10%% 以内、かつ %s 終値がデータと一致%s" % (lastl, cmpl, cmpl, "" if not far else "（要確認: " + ", ".join(far) + "）"))
    print("\n過去分の検証結果: %s" % ("すべて OK" if warnings == 0 else "警告 %d件（上を確認してください）" % warnings))


def verify(dates, stocks, failed, fill_report):
    """取得後の自動検証。結果を OK / 警告 で表示する。"""
    warnings = 0

    def result(ok, msg):
        nonlocal warnings
        if not ok:
            warnings += 1
        print("  [%s] %s" % ("OK  " if ok else "警告", msg))

    print("\n=== 検証 ===")
    result(dates[0] == SCEN["expect_first"], "初日: %s（期待 %s）" % (dates[0], SCEN["expect_first"]))
    result(dates[-1] == SCEN["expect_last"], "最終日: %s（期待 %s）" % (dates[-1], SCEN["expect_last"]))
    print("  [情報] 日数: %d日" % len(dates))

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

    nintendo = next((s for s in stocks if s["code"] == "7974"), None) if SCEN["nintendo_check"] else None
    if not SCEN["nintendo_check"]:
        pass
    elif nintendo is None:
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


def parse_args():
    ap = argparse.ArgumentParser(
        description="実在銘柄の株価を取得して data/ 以下の .js に書き出す。作るものは --scenario で必ず指定する。",
        epilog="例:\n  python3 tools/fetch_prices.py --scenario recent\n  python3 tools/fetch_prices.py --scenario recent --history",
        formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--scenario", required=True, choices=list(SCENARIOS),
                    help="; ".join("%s = %s（%s 〜 %s → %s）" % (k, v["var"], v["start"], v["last"], v["out"].name) for k, v in SCENARIOS.items()))
    ap.add_argument("--history", action="store_true",
                    help="過去チャートだけを取得して、今ある出力ファイルの末尾に足す（本編には触れない）")
    if len(sys.argv) == 1:  # 引数なしでは実行せず、使い方を出す
        ap.print_help()
        sys.exit(2)
    return ap.parse_args()


def main():
    args = parse_args()
    use_scenario(args.scenario)
    corona_before = sha256(CORONA_FILE)
    try:
        run(args)
    finally:
        report_corona_hash(args.scenario, corona_before)


def report_corona_hash(scenario, before):
    after = sha256(CORONA_FILE)
    if scenario == "corona2020":
        return
    print("\ncorona2020.js の SHA-256: 実行前 %s / 実行後 %s → %s" % (
        before, after, "変更なし" if before == after else "★ 変わっています（要確認）"))


def run(args):
    if args.history:
        if not OUT.exists():
            sys.exit("%s がありません。先に --history なしで本編を作ってください。" % OUT)
        cmp_date = read_js_closes()[0][0]
        hist = fetch_history(cmp_date)
        write_history(hist)
        print("\n書き出し: %s の末尾に過去分（%d銘柄 × %d日, %s 〜 %s）" % (OUT, len(hist["stocks"]), len(hist["dates"]), hist["dates"][0], hist["dates"][-1]))
        return

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
    # 最終日より後の日は捨てる（end の指定ミスや日付のずれで 10月以降が混ざらないように）
    dates = sorted(d for d in set().union(*[set(s) for s in raw.values()]) if d <= LAST)

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

    print("\n=== 騰落率の一覧（%s 〜 %s） ===" % (dates[0], dates[-1]))
    print("  %s %s %10s %10s %10s %10s %8s" % ("コード", pad("銘柄", 34), "初日終値", "最高値", "最安値", "最終日終値", "騰落率"))
    for s in stocks:
        p = s["prices"]
        hi, lo = max(p), min(p)
        chg = (p[-1] / p[0] - 1) * 100
        print("  %-6s %s %10s %10s %10s %10s %+7.1f%%  (高 %s / 安 %s)" % (
            s["code"], pad(s["name"], 34), p[0], hi, lo, p[-1], chg,
            dates[p.index(hi)], dates[p.index(lo)]))
    print("\n※ 騰落率は「最初の取引日の終値 → 最後の取引日の終値」で計算しています。")

    verify(dates, stocks, failed, fill_report)

    hist = fetch_history(dates[0])
    write_history(hist)
    print("\n書き出し: %s の末尾に過去分（%d銘柄 × %d日）" % (OUT, len(hist["stocks"]), len(hist["dates"])))


if __name__ == "__main__":
    main()
