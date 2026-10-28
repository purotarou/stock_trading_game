// リアル相場チャレンジ「今年の相場」で流す、2026年の実際のニュース（表示専用。株価には影響しない）
// date = 出来事・発表があった日。画面には date より後の最初の営業日の寄り付き前に出る。
// importance: 3 = その日の株価が大きく動きうる / 2 = 決算など通常 / 1 = 補足
// type: "fact" = 実際の出来事 / "report" = 発表前の観測報道 / "rumor" = 当時実際に出回った噂
// 見出し・本文は報道や公式発表を要約して書き直したもの。各ニュースの上に出典（2つ以上）を残す。
// 期間は 2026-01-05 〜 2026-09-30。米国の発表は米国の日付で書く（日本では翌日の未明になる）。
const NEWS2026 = [

  /* ===================== 経済・市場 ===================== */

  // https://www.sakigake.jp/news/article/20260105CO0077/
  // https://indexes.nikkei.co.jp/atoz/2026/02/202601.html
  { date: "2026-01-05", headline: "大発会の日経平均は1,493円高の5万1,832円。大発会としては過去最大の上げ幅",
    body: "前週の米国株高を受けて、AI・半導体関連や輸出関連の銘柄が買われた。", codes: [], importance: 2, type: "fact" },

  // https://www.nomura.co.jp/wealthstyle/article/0575/
  // https://moneiro.jp/media/article/long-term-interest-rates-rise
  { date: "2026-01-20", headline: "長期金利（新発10年国債の利回り）が一時2.38%に上昇。約27年ぶりの高さ",
    body: "財政の悪化への警戒から国債が売られた（国債の値段が下がると、利回りは上がる）。", codes: [], importance: 2, type: "fact" },

  // https://www.am.mufg.jp/report/special/special_260123.pdf
  // https://www.smd-am.co.jp/market/ichikawa/2026/01/irepo260126_2/
  { date: "2026-01-23", headline: "日銀が政策金利を0.75%に据え置き。1人の委員は1%への利上げを提案",
    body: "あわせて公表した経済・物価の見通し（展望リポート）では、2026年度の成長率と物価の見通しを引き上げた。", codes: [], importance: 2, type: "fact" },

  // https://www.oanda.jp/lab-education/?p=106888
  // https://www.smd-am.co.jp/market/ichikawa/2026/01/irepo260129/
  { date: "2026-01-28", headline: "米FRBが政策金利を3.50〜3.75%に据え置き",
    body: "日本時間29日未明の発表。2人の参加者は利下げを主張して反対した。", codes: [], importance: 2, type: "fact" },

  // https://media.paypay-sec.co.jp/cat2/mj260209_1
  // https://www.sbbit.jp/article/refers/180480
  { date: "2026-02-09", headline: "衆院選の翌日、日経平均は2,110円高の5万6,363円で最高値を更新",
    body: "衆院選で自民党が議席を大きく伸ばし、前週末の米国株高もあって買いが広がった。上げ幅は歴代5位。", codes: [], importance: 3, type: "fact" },

  // https://www.dir.co.jp/report/research/economics/japan/20260216_025582.pdf
  // https://media.monex.co.jp/articles/-/28795
  { date: "2026-02-16", headline: "10〜12月期のGDP速報は実質で年率0.2%増。民間の予想（1%台半ば）を下回る",
    body: "2四半期ぶりのプラス成長。", codes: [], importance: 2, type: "fact" },

  // https://www.sakigake.jp/news/article/20260303CO0091/
  // https://tbladvisory.com/20260303nk/
  { date: "2026-03-03", headline: "3日の日経平均は1,778円安の5万6,279円。中東での戦闘の長期化を警戒",
    body: "米国とイスラエルによるイラン攻撃のあと原油価格が上がり、企業の負担が増えるとの見方が広がった。今年最大の下げ幅。", codes: [], importance: 3, type: "fact" },

  // https://media.monex.co.jp/articles/-/28931
  // https://www.dir.co.jp/report/research/economics/usa/20260309_025619.html
  { date: "2026-03-06", headline: "米国の2月の雇用統計で、就業者数が前月より9.2万人減少。予想は5.5万人増",
    body: "失業率は4.4%に上がった。", codes: [], importance: 2, type: "fact" },

  // https://media.paypay-sec.co.jp/cat2/mj260309_1
  // https://tbladvisory.com/20260309nk/
  { date: "2026-03-09", headline: "9日の日経平均は2,892円安の5万2,728円。下落率は5.2%",
    body: "中東情勢の長期化への懸念から原油先物が急騰し、前週末の米雇用統計の弱さも重なった。", codes: [], importance: 3, type: "fact" },

  // https://www.bk.mufg.jp/report/whatsnew/MUFG-FOCUSUSAJ-03-18-2026.pdf
  // https://www.newsquawk.com/headlines/fomc-statement-rates-held-between-350-375-in-11-1-vote-miran-dissents
  { date: "2026-03-18", headline: "米FRBが政策金利の据え置きを決定。2会合連続",
    body: "日本時間19日未明の発表。中東情勢などで先行きの不確実性が高いとした。", codes: [], importance: 2, type: "fact" },

  // https://www.am.mufg.jp/report/special/special_260319_2.pdf
  // https://www.nri.com/jp/media/column/kiuchi/20260319_2.html
  { date: "2026-03-19", headline: "日銀が政策金利0.75%を据え置き。中東情勢と原油高の影響を見極める",
    body: "1人の委員が1%への利上げを提案し、否決された。", codes: [], importance: 2, type: "fact" },

  // https://indexes.nikkei.co.jp/atoz/2026/04/202603.html
  // https://tbladvisory.com/20260331nk/
  { date: "2026-03-31", headline: "3月の日経平均は月間で7,786円（13.23%）の下落。月末は5万1,063円",
    body: "4カ月ぶりの月間の下落。", codes: [], importance: 2, type: "fact" },

  // https://tbladvisory.com/20260408nk/
  // https://indexes.nikkei.co.jp/atoz/2026/05/202604.html
  { date: "2026-04-08", headline: "米国とイランの停戦合意を受け、8日の日経平均は2,878円高の5万6,308円",
    body: "中東情勢への警戒が和らぎ、原油価格が下がった。", codes: [], importance: 3, type: "fact" },

  // https://www.sakigake.jp/news/article/20260427CO0081/
  // https://www.oanda.jp/lab-education/market_news/mn_1011278_202604271759/
  { date: "2026-04-27", headline: "日経平均の終値が初めて6万円台に。27日は821円高の6万537円",
    body: "取引時間中に初めて6万円を超えたのは23日。", codes: [], importance: 2, type: "fact" },

  // https://www.sakigake.jp/news/article/20260428CO0076/
  // https://www.dir.co.jp/report/research/capital-mkt/securities/20260507_025743.html
  { date: "2026-04-28", headline: "日銀が政策金利0.75%を据え置き。3人の委員が1%への利上げを提案",
    body: "植田総裁は、物価が見通しより上振れするリスクの方が大きいとの見方を示した。", codes: [], importance: 2, type: "fact" },

  // https://www.mufgamericas.com/sites/default/files/document/mufgamericas_com/2026-05/MUFG-FOCUSUSAJ-04-29-2026.pdf
  // https://www.am.mufg.jp/report/special/special_260430.pdf
  { date: "2026-04-29", headline: "米FRBが3会合連続で政策金利を据え置き",
    body: "日本時間30日未明の発表。", codes: [], importance: 1, type: "fact" },

  // https://www.nri.com/jp/media/column/kiuchi/20260501.html
  // https://www.j-cast.com/2026/05/01514325.html
  { date: "2026-04-30", headline: "円相場が夜に急騰。1ドル160円台から一時155円台半ばへ",
    body: "この日、財務相と財務官が円安をけん制する発言をしていた。市場では、政府・日銀が円買い介入をしたとの見方が出ている。", codes: [], importance: 2, type: "fact" },

  // https://www.sakigake.jp/news/article/20260519CO0039/
  // https://dxmagazine.jp/?p=206385
  { date: "2026-05-19", headline: "1〜3月期のGDP速報は実質で年率2.1%増。民間の予想を上回る",
    body: "成長率に対する外需（輸出から輸入を引いたもの）の寄与は0.3ポイント、内需は0.2ポイント。", codes: [], importance: 2, type: "fact" },

  // https://www.sakigake.jp/news/article/20260523CO0028/
  // https://www.sbbit.jp/article/fj/185484
  { date: "2026-05-22", headline: "ウォーシュ氏が米FRBの議長に就任",
    body: "パウエル氏の後任。ホワイトハウスで宣誓した。", codes: [], importance: 2, type: "fact" },

  // https://www.sakigake.jp/news/article/20260529CO0155/
  // https://fx.minkabu.jp/news/368613
  { date: "2026-05-29", headline: "財務省が、4月28日〜5月27日の為替介入額は11兆7,349億円と発表。月の額として過去最大",
    body: "円買い・ドル売りの介入。", codes: [], importance: 2, type: "fact" },

  // https://www.oanda.jp/lab-education/market_news/kn_2026061001001718/
  // https://www.nri.com/jp/media/column/kiuchi/20260611.html
  { date: "2026-06-10", headline: "日銀が、植田総裁は入院のため15〜16日の金融政策決定会合を欠席する見通しと発表",
    body: "", codes: [], importance: 2, type: "fact" },

  // https://www.am.mufg.jp/report/special/special_260616.pdf
  // https://www.nomura.co.jp/wealthstyle/article/0768/
  { date: "2026-06-16", headline: "日銀が政策金利を1.0%程度に引き上げ。1995年以来、31年ぶりの水準",
    body: "原油高で物価が目標を超えて上がるリスクに対応する。総裁が欠席する中での利上げで、議長は副総裁が務めた。1人の委員が反対した。", codes: [], importance: 3, type: "fact" },

  // https://www.bk.mufg.jp/report/whatsnew/MUFG-FOCUSUSAJ-06-17-2026.pdf
  // https://www.dir.co.jp/report/research/economics/usa/20260618_025844.html
  { date: "2026-06-17", headline: "米FRBがウォーシュ議長のもとで初の会合。政策金利は据え置き",
    body: "日本時間18日未明の発表。全会一致で、4会合連続の据え置き。", codes: [], importance: 2, type: "fact" },

  // https://kumanichi.com/articles/2006682
  // https://indexes.nikkei.co.jp/atoz/2026/07/202606.html
  { date: "2026-06-25", headline: "25日の日経平均は3,191円高の7万2,366円で最高値を更新",
    body: "米半導体大手の好決算を受けてAI関連に買いが広がった。原油先物価格は下落した。", codes: [], importance: 2, type: "fact" },

  // https://kumanichi.com/articles/2007146
  // https://limo.media/articles/-/130643
  { date: "2026-06-26", headline: "26日の日経平均は3,005円安の6万9,360円。下げ幅は史上3番目",
    body: "前日の大幅高の反動に加え、米オープンAIが株式上場の先送りを検討していると報じられ、AI・半導体関連が売られた。", codes: ["9984", "8035", "6857"], importance: 3, type: "fact" },

  // https://www.sakigake.jp/news/article/20260717CO0082/
  // https://tbladvisory.com/test-20260717nk/
  { date: "2026-07-17", headline: "17日の日経平均は2,694円安の6万4,141円。2日間で4,600円超の下落",
    body: "前日に続き、半導体・AI関連が売られた。下げ幅は歴代5位。", codes: [], importance: 3, type: "fact" },

  // https://kumanichi.com/articles/2015952
  // https://tbladvisory.com/20260721nk/
  { date: "2026-07-21", headline: "21日の日経平均は2,091円高の6万6,232円。前週の急落の反動で買い戻し",
    body: "", codes: [], importance: 2, type: "fact" },

  // https://kumanichi.com/articles/2020078
  // https://www.oanda.jp/lab-education/market_news/2026_07_31_usdjpy/
  { date: "2026-07-30", headline: "円相場が夜に急騰し、一時1ドル157円台に。政府・日銀の介入との見方",
    body: "円は対ドルで5円近く上がった。", codes: [], importance: 2, type: "fact" },

  // https://www.kumanichi.com/articles/2020206
  // https://www.am.mufg.jp/report/special/special_260731.pdf
  { date: "2026-07-31", headline: "日銀が政策金利1.0%を据え置き。6月の利上げの影響を見極める",
    body: "1人の委員は1.25%への利上げを提案した。", codes: [], importance: 2, type: "fact" },

  // https://www.sakigake.jp/news/article/20260731CO0127/
  // https://tbladvisory.com/20260731nk/
  { date: "2026-07-31", headline: "31日の日経平均は2,494円高の6万4,362円",
    body: "前日に東京エレクトロンが業績予想を引き上げ、半導体関連に買いが広がった。", codes: ["8035"], importance: 2, type: "fact" },

  // https://kumanichi.com/articles/2021098
  // https://www.nri.com/jp/media/column/kiuchi/20260803_2.html
  { date: "2026-08-03", headline: "財務省が、米国と協調して円買い介入をしたと公表。日米の協調介入は15年ぶり",
    body: "介入は米国時間の7月31日。片山財務相は、円の過度な変動に対処したと説明した。円は7月下旬に一時1ドル164円に迫っていた。", codes: [], importance: 3, type: "fact" },

  // https://kumanichi.com/articles/2025911
  // https://www.apir.or.jp/uploads/research/日本経済月次_No.173_2026_August.pdf
  { date: "2026-08-17", headline: "4〜6月期のGDP速報は実質で年率1.1%増。3四半期連続のプラスだが、予想を下回る",
    body: "個人消費は8四半期ぶりのマイナス。", codes: [], importance: 2, type: "fact" },

  // https://kumanichi.com/articles/2026359
  // https://tbladvisory.com/20260818nk/
  { date: "2026-08-18", headline: "18日の日経平均は1,759円安の6万7,460円。米国とイランの和平交渉の停滞を警戒",
    body: "原油先物と長期金利が上がった。国内の長期金利は約30年ぶりの高さ。", codes: [], importance: 2, type: "fact" },

  // https://www.sakigake.jp/news/article/20260828CO0221/
  // https://www.nippon.com/en/news/yjj2026082801031/
  { date: "2026-08-28", headline: "財務省が、7月30日〜8月26日の為替介入額は15兆3,993億円と発表。月の額として過去最大",
    body: "4〜5月の分と合わせ、今年の介入額は27兆1,342億円になった。", codes: [], importance: 2, type: "fact" },

  // https://www.dlri.co.jp/report/macro/665852.html
  // https://www.nomura.co.jp/wealthstyle/article/0883/
  { date: "2026-09-16", headline: "米FRBが約3年ぶりに利上げ。政策金利を0.25%上げて3.75〜4.00%に",
    body: "日本時間17日未明の発表。全会一致で決めた。", codes: [], importance: 3, type: "fact" },

  // https://kumanichi.com/articles/2037289
  // https://www.smd-am.co.jp/market/ichikawa/2026/09/irepo260924/
  { date: "2026-09-18", headline: "日銀が政策金利を1.25%程度に引き上げ。前回の利上げから3カ月",
    body: "2人の委員が反対した。", codes: [], importance: 3, type: "fact" },

  /* ===================== 政策・社会の出来事 ===================== */

  // https://www.nishimura.com/sites/default/files/newsletters/file/china_competition_law_international_trade_260120_ja.pdf
  // https://www.gtlaw.com/ja/insights/2026/2/china-imposes-escalated-export-controls-on-dual-use-items-to-japan
  { date: "2026-01-06", headline: "中国商務省が、軍事用途などに向けた日本へのデュアルユース（軍民両用）品の輸出を禁止すると発表",
    body: "即日実施。", codes: [], importance: 2, type: "fact" },

  // https://www.sakigake.jp/news/article/20260119CO0108/
  // https://www.nomura.co.jp/wealthstyle/article/0575/
  { date: "2026-01-19", headline: "高市首相が、23日に衆院を解散し、2月8日に投開票すると表明",
    body: "あわせて、食料品の消費税を2年間に限ってゼロにすることを検討すると述べた。", codes: [], importance: 2, type: "fact" },

  // https://nk.jiho.jp/article/204965
  // https://www.sakigake.jp/news/article/20260119CO0108/
  { date: "2026-01-23", headline: "通常国会の召集日に衆院が解散。27日公示、2月8日投開票",
    body: "", codes: [], importance: 1, type: "fact" },

  // https://www.nippon.com/ja/japan-data/h02703/
  // https://media.paypay-sec.co.jp/cat2/mj260209_1
  { date: "2026-02-08", headline: "衆院選の投開票。自民党が単独で定数465の3分の2を超える議席を獲得",
    body: "", codes: [], importance: 3, type: "fact" },

  // https://www.sakigake.jp/news/article/20260218CO0016/
  // https://www.kaiketsu-j.com/compliance/20761/
  { date: "2026-02-18", headline: "特別国会で高市氏が首相に指名され、第2次高市内閣が発足",
    body: "会期は7月17日までの150日間。", codes: [], importance: 1, type: "fact" },

  // https://kumanichi.com/articles/1959811
  // https://www.gtlaw.com/ja/insights/2026/2/supreme-court-invalidates-trump-administrations-ieepa-tariffs
  { date: "2026-02-20", headline: "米連邦最高裁が、国際緊急経済権限法（IEEPA）にもとづく関税は違法と判断",
    body: "判断は6対3。相互関税などが根拠を失った。トランプ政権は同日、別の法律にもとづく10%の関税を打ち出した。", codes: [], importance: 2, type: "fact" },

  // https://www.asiae.co.kr/en/article/2026022414004590234
  // https://www.jetro.go.jp/ext_images/world/us_tariff/pdf/01_20260302.pdf
  { date: "2026-02-24", headline: "米国が通商法122条にもとづく10%の追加関税を発動",
    body: "最長150日間の一時的な措置。", codes: [], importance: 1, type: "fact" },

  // https://www.anzen.mofa.go.jp/info/pcwideareaspecificinfo_2026C017.html
  // https://www.kantei.go.jp/jp/tyoukanpress/202603/1_a.html
  { date: "2026-02-28", headline: "イスラエル国防相がイランへの攻撃を、米大統領がイランへの軍事攻撃の開始を発表",
    body: "いずれも2月28日（現地時間）の発表。外務省は、周辺地域の在留邦人に注意を呼びかけた。", codes: [], importance: 3, type: "fact" },

  // https://www.kantei.go.jp/jp/tyoukanpress/202603/1_a.html
  // https://www.mofa.go.jp/mofaj/press/danwa/pageit_000001_02766.html
  { date: "2026-03-01", headline: "政府が国家安全保障会議（NSC）の4大臣会合を開き、中東情勢への対応を協議",
    body: "邦人の保護と、海路・空路の状況の把握を続けるとした。", codes: [], importance: 1, type: "fact" },

  // https://www.meti.go.jp/press/2025/03/20260316005/20260316005.html
  // https://www.logi-today.com/920695
  { date: "2026-03-16", headline: "経済産業省が、国家備蓄石油を当面1カ月分放出すると決定",
    body: "民間の備蓄義務量も15日分引き下げる。", codes: [], importance: 2, type: "fact" },

  // https://www.chibanippo.co.jp/newspack/20260320/1587808
  // https://kumanichi.com/articles/1991565
  { date: "2026-03-19", headline: "高市首相がホワイトハウスでトランプ大統領と会談",
    body: "イラン情勢の沈静化に向けて意思疎通を続けることなどを確認した。", codes: [], importance: 1, type: "fact" },

  // https://www.nippon.com/ja/japan-data/h02747/
  // https://www.jil.go.jp/kokunai/topics/mm/20260327d.html
  { date: "2026-03-23", headline: "連合の春闘第1回回答集計、賃上げ率は5.26%。3年連続で5%超",
    body: "前年の同じ時期を0.20ポイント下回った。中小の組合は5.05%。", codes: [], importance: 2, type: "fact" },

  // https://www.sakigake.jp/news/article/20260408CO0014/
  // https://www.jetro.go.jp/biznews/2026/04/eeced133258bbca3.html
  { date: "2026-04-07", headline: "米国とイランが2週間の停戦で合意。パキスタンが仲介",
    body: "トランプ大統領は、イランがホルムズ海峡を開放することを条件に、攻撃を2週間停止すると表明した。", codes: [], importance: 3, type: "fact" },

  // https://www.sakigake.jp/news/article/20260407CO0102/
  // https://hojyokin-portal.jp/news/198
  { date: "2026-04-07", headline: "2026年度予算が成立。一般会計は過去最大の122兆3,092億円",
    body: "衆院選の影響で審議入りが遅れ、成立が4月にずれ込むのは11年ぶり。", codes: [], importance: 2, type: "fact" },

  // https://www.sakigake.jp/news/article/20260410CO0053/
  // https://www.malaymail.com/amp/news/money/2026/04/10/japan-to-release-20-days-of-oil-reserves-to-steady-supply-amid-middle-east-tensions/215764
  { date: "2026-04-10", headline: "高市首相が、国家備蓄石油の約20日分を5月上旬以降に追加で放出する方針を表明",
    body: "", codes: [], importance: 1, type: "fact" },

  // https://www.sakigake.jp/news/article/20260412CO0029/
  // https://www.afpbb.com/articles/-/3630928
  { date: "2026-04-12", headline: "パキスタンでの米国とイランの対面協議は合意に至らず",
    body: "協議は11日から続いた。ホルムズ海峡や核開発をめぐって意見が分かれた。", codes: [], importance: 2, type: "fact" },

  // https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/geppo/nengai25/dl/gaikyouR7houdou.pdf
  // https://www.nippon.com/ja/japan-data/h02802/
  { date: "2026-06-03", headline: "2025年の出生数は67万1,236人で過去最少。合計特殊出生率は1.14で過去最低",
    body: "厚生労働省の人口動態統計（概数）。出生数の減少は10年連続。", codes: [], importance: 1, type: "fact" },

  // https://www.sakigake.jp/news/article/20260605CO0167/
  // https://www.tokyo-sports.co.jp/articles/-/390716
  { date: "2026-06-05", headline: "3兆1,135億円の2026年度補正予算が成立。ガソリン補助を続け、7〜9月の電気・ガス代を抑える",
    body: "中東情勢による家計への打撃を和らげる。財源は全額を赤字国債でまかなう。", codes: [], importance: 2, type: "fact" },

  // https://www.sakigake.jp/news/article/20260618CO0023/
  // https://kumanichi.com/articles/2002857
  { date: "2026-06-17", headline: "米国とイランが、戦闘の終結に向けた覚書に署名し、発効",
    body: "最終的な合意は60日以内を目指す。", codes: [], importance: 3, type: "fact" },

  // https://www.sakigake.jp/news/article/20260617CO0146/
  // https://www.cnn.co.jp/world/35248982.html
  { date: "2026-06-17", headline: "フランスでのG7サミットが閉幕。ロシアへの制裁の強化で合意",
    body: "包括的な首脳宣言は2年続けて見送り、分野ごとの共同文書を採択した。", codes: [], importance: 1, type: "fact" },

  // https://www.afpbb.com/articles/fp/3643354
  // https://www.smd-am.co.jp/market/ichikawa/2026/07/irepo260714.pdf
  { date: "2026-07-07", headline: "米中央軍が、ホルムズ海峡で商船を攻撃したとしてイランへの攻撃を再開したと発表",
    body: "", codes: [], importance: 2, type: "fact" },

  // https://kumanichi.com/articles/2012796
  // https://www.smd-am.co.jp/market/ichikawa/2026/07/irepo260714.pdf
  { date: "2026-07-12", headline: "イラン革命防衛隊が、ホルムズ海峡を封鎖すると表明",
    body: "", codes: [], importance: 3, type: "fact" },

  // https://www.keidanren.or.jp/journal/times/2026/0917_03.html
  // https://www.tkfd.or.jp/research/detail.php?id=5034
  { date: "2026-07-21", headline: "政府が「骨太の方針2026」を閣議決定",
    body: "財政の目標の中心を、基礎的財政収支（プライマリーバランス）の黒字化から、債務残高の対GDP比の安定的な低下に移した。", codes: [], importance: 1, type: "fact" },

  // https://kumanichi.com/articles/2018869
  // https://www.nippon.com/ja/japan-data/h02856/
  { date: "2026-07-28", headline: "最低賃金の目安が決まる。全国平均で55円上げて1,176円",
    body: "上げ幅は4.9%。前年度の目安（63円）は下回った。", codes: [], importance: 2, type: "fact" },

  // https://kumanichi.com/articles/2022226
  // https://news.ksb.co.jp/ann/article/16936630
  { date: "2026-08-05", headline: "政府が、飲食料品の消費税率を2027年4月から2年間1%に引き下げる基本方針を閣議決定",
    body: "", codes: [], importance: 2, type: "fact" },

  // https://kumanichi.com/articles/2035729
  // https://gentosha-go.com/articles/-/81843
  { date: "2026-09-15", headline: "政府が、飲食料品の消費税率を2027年4月から2年間1%に引き下げる大綱を閣議決定",
    body: "1%分に相当する「就業者負担軽減支援金」を導入することも盛り込んだ。", codes: [], importance: 2, type: "fact" },

  // https://kumanichi.com/articles/2036690
  // https://www.sakigake.jp/news/article/20260917CO0073/
  { date: "2026-09-17", headline: "第2次高市改造内閣が発足。連立を組む日本維新の会から初めて閣僚を起用",
    body: "木原官房長官らは留任した。", codes: [], importance: 1, type: "fact" },

  // https://kumanichi.com/articles/2038455
  // https://www.kab.co.jp/news/article/16908224
  { date: "2026-09-22", headline: "高市首相がニューヨークでトランプ大統領と会談",
    body: "国連総会に合わせた会談。経済安全保障での連携を確認した。", codes: [], importance: 1, type: "fact" },

  // https://kumanichi.com/articles/2038933
  // https://news.web.nhk/newsweb/na/nd-20260924de52091
  { date: "2026-09-24", headline: "中国の習近平国家主席が国賓として訪米し、ホワイトハウスでトランプ大統領と会談",
    body: "AIのリスクをめぐる対話の枠組みの設置や、中国による米国産石炭の輸入で合意した。", codes: [], importance: 2, type: "fact" },

  /* ===================== 暮らし・スポーツ・天気・災害 ===================== */
  // 海外で行われた大会は、現地の日付で書く

  // https://www.sakigake.jp/news/article/20260223CO0024/
  // https://www.nippon.com/ja/japan-data/h02678/
  { date: "2026-02-22", headline: "ミラノ・コルティナ冬季五輪が閉幕。日本のメダルは金5、銀7、銅12の計24個で冬季最多",
    body: "これまでの最多は前回の北京大会の18個。", codes: [], importance: 2, type: "fact" },

  // https://www.tv-tokyo.co.jp/sports/articles/2026/03/041345.html
  // https://www.baseballchannel.jp/wbc/250844/
  { date: "2026-03-14", headline: "WBCの準々決勝で、日本はベネズエラに5対8で敗れる",
    body: "日本時間15日の試合。", codes: [], importance: 1, type: "fact" },

  // https://www.sakigake.jp/news/article/20260315CO0076/
  // https://www.nippon.com/ja/japan-data/h02727/
  { date: "2026-03-15", headline: "ミラノ・コルティナ冬季パラリンピックが閉幕。日本のメダルは銀3、銅1の計4個",
    body: "", codes: [], importance: 1, type: "fact" },

  // https://kumanichi.com/articles/1970457
  // https://weathernews.jp/news/202603/180056/
  { date: "2026-03-19", headline: "気象庁が、東京都心で桜（ソメイヨシノ）が開花したと発表。平年より5日早い",
    body: "", codes: [], importance: 1, type: "fact" },

  // https://www.mext.go.jp/a_menu/sports/syokuiku/kyu-lighten.html
  // https://news.mynavi.jp/article/20260116-3982082/
  { date: "2026-04-01", headline: "公立小学校の給食費の負担を国が軽減する制度が始まる",
    body: "国が自治体に給食の食材費を支援する。保護者の手続きは不要。", codes: [], importance: 1, type: "fact" },

  // https://weathernews.jp/news/202604/200221/
  // https://scienceportal.jst.go.jp/newsflash/20260421_n01/
  // https://www.jma.go.jp/jma/press/2604/20b/nceq202604201920.html
  { date: "2026-04-20", headline: "三陸沖でM7.7の地震。青森県階上町で震度5強、津波警報も",
    body: "気象庁は同日夜、「北海道・三陸沖後発地震注意情報」を発表し、北海道から千葉県までの沿岸などに1週間の注意を呼びかけた。", codes: [], importance: 2, type: "fact" },

  // https://www.data.jma.go.jp/yoho/data/hibiten/2026/2606.pdf
  // https://www.sakigake.jp/news/article/20260603CO0036/
  { date: "2026-06-03", headline: "台風6号が和歌山県南部に上陸。県内の川に、新しい防災情報で初の「レベル5」氾濫特別警報",
    body: "", codes: [], importance: 2, type: "fact" },

  // https://www.data.jma.go.jp/eqev/data/kyoshin/jishin/2606250730_iwate-oki/index.html
  // https://www.static.jishin.go.jp/resource/seismicity_annual/major_act/2026/20260625_off-iwate_01.pdf
  { date: "2026-06-25", headline: "岩手県沖でM7.2の地震。青森県階上町で震度6強",
    body: "午前7時30分ごろ発生。震源の深さは44キロ。", codes: [], importance: 2, type: "fact" },

  // https://kumanichi.com/articles/2006969
  // https://www.jleague.jp/news/article/34306/
  { date: "2026-06-25", headline: "サッカーW杯で、日本がスウェーデンと1対1で引き分け、1次リーグF組2位で決勝トーナメントへ",
    body: "日本時間26日の試合。3大会続けての決勝トーナメント進出。", codes: [], importance: 1, type: "fact" },

  // https://www.tv-tokyo.co.jp/sports/smp/articles/2026/06/042064.html
  // https://www.kanaloco.jp/news/social/article-1284811.html
  { date: "2026-06-29", headline: "サッカーW杯の決勝トーナメント1回戦で、日本はブラジルに1対2で敗れる",
    body: "日本時間30日の試合。", codes: [], importance: 1, type: "fact" },

  // https://www.nippon.com/ja/japan-data/h02828/
  // https://www.nippon.com/ja/news/yjj2026063000362/
  { date: "2026-06-30", headline: "帝国データバンクの調べで、7月に値上げされる飲食料品は2,566品目",
    body: "前年の同じ月より21.9%多い。帝国データバンクは、中東情勢による原材料や包装資材の値上がりを主な要因に挙げた。", codes: [], importance: 1, type: "fact" },

  // https://www.kumanichi.com/articles/2015624
  // https://weathernews.jp/news/202607/180171/
  { date: "2026-07-20", headline: "気象庁が、東海と関東甲信が梅雨明けしたとみられると発表。平年より1日遅い",
    body: "", codes: [], importance: 1, type: "fact" },

  // https://kumanichi.com/articles/2016790
  // https://www.nippon.com/ja/japan-data/h02863/
  { date: "2026-07-23", headline: "浜松市天竜区で気温41.1度。今年の国内最高",
    body: "", codes: [], importance: 1, type: "fact" },

  // https://kumanichi.com/articles/2018596
  // https://www.j-cast.com/2026/07/28516704.html
  { date: "2026-07-28", headline: "熊本県熊本地方でM7.1の地震。宇城市、氷川町などで震度7",
    body: "午後4時27分ごろ発生。有明海・八代海に津波注意報（同日夕方に解除）。気象庁は、今後1週間程度、特に2〜3日は最大震度7程度の地震に注意するよう呼びかけた。", codes: [], importance: 3, type: "fact" },

  // https://news.mynavi.jp/article/20260731-4760168/
  // https://news.livedoor.com/article/detail/31957592/
  { date: "2026-07-31", headline: "帝国データバンクの調べで、8月に値上げされる飲食料品は2,311品目。前年の同じ月の8割増",
    body: "", codes: [], importance: 1, type: "fact" },

  // https://kumanichi.com/articles/2027810
  // https://www.baseballchannel.jp/etc/284990/
  { date: "2026-08-22", headline: "夏の全国高校野球選手権の決勝で、智弁和歌山が健大高崎を4対3で破り、5年ぶり4度目の優勝",
    body: "", codes: [], importance: 1, type: "fact" },

  // https://www.nippon.com/ja/japan-data/h02891/
  // https://weather-jwa.jp/?p=16259
  { date: "2026-09-01", headline: "今年の夏（6〜8月）の全国の平均気温は平年より1.02度高く、統計開始以来5番目の高さ",
    body: "最高気温が40度以上の「酷暑日」を観測した地点は延べ36地点で、最多。", codes: [], importance: 1, type: "fact" },

  // https://www.data.jma.go.jp/yoho/data/hibiten/2026/2601.pdf
  // https://weathernews.jp/news/202601/230116/
  { date: "2026-01-25", headline: "気象庁が、石川県と鳥取県に「顕著な大雪に関する気象情報」を発表",
    body: "24日には福井県にも発表した。強い冬型の気圧配置で、日本海側を中心に大雪となった。", codes: [], importance: 1, type: "fact" },

  // https://kumanichi.com/articles/2017947
  // https://www.daily.co.jp/general/2026/07/26/0020635874.shtml
  { date: "2026-07-26", headline: "大相撲名古屋場所の千秋楽。関脇安青錦が三つどもえの優勝決定戦を制し、3度目の優勝",
    body: "12勝3敗。1場所での大関復帰も決めている。", codes: [], importance: 1, type: "fact" },

  // https://kumanichi.com/articles/2024417
  // https://weathernews.jp/news/202608/120021/
  { date: "2026-08-11", headline: "台風15号が茨城県に上陸。茨城県への台風の上陸は、1951年の統計開始以来初めて",
    body: "", codes: [], importance: 1, type: "fact" },

  // https://www.data.jma.go.jp/stats/data/bosai/report/2026/20260916/20260916.html
  // https://www.chiba.jrc.or.jp/information/saigai/files/20260821_ooame_01.pdf
  { date: "2026-08-14", headline: "千葉県で13日夕方から線状降水帯が発生し、記録的な大雨。千葉市中央区の24時間雨量は367.0ミリ",
    body: "気象庁は記録的短時間大雨情報を相次いで発表した。", codes: [], importance: 2, type: "fact" },

  // https://kumanichi.com/articles/2040175
  // https://www.kanaloco.jp/news/social/article-1307728.html
  { date: "2026-09-27", headline: "大相撲秋場所の千秋楽。横綱大の里が大関安青錦との相星決戦を制し、6度目の優勝",
    body: "12勝3敗。", codes: [], importance: 1, type: "fact" },

  /* ===================== 業界ニュース ===================== */

  // https://www.logi-today.com/917532
  // https://www.logi-today.com/918032
  // https://www.arabnews.jp/article/middle-east/article_171342/
  { date: "2026-03-01", headline: "日本の海運大手3社が、ホルムズ海峡の通航を停止。関係する船に安全な海域での待機を指示",
    body: "世界の海運大手も、海峡の通航の停止を相次いで発表している。", codes: ["9101", "9104"], importance: 2, type: "fact" },

  // https://www.yakuji.co.jp/?p=131064
  // https://nk.jiho.jp/article/300360
  { date: "2026-03-05", headline: "厚生労働省が4月の薬価改定を告示。薬剤費ベースで4.02%の引き下げ",
    body: "医療費ベースでは0.86%の引き下げ。", codes: ["4519"], importance: 1, type: "fact" },

  // https://www.cas.go.jp/jp/seisaku/chyutoujyousei/dai1/pdf/siryou3.pdf
  // https://www.logi-today.com/920692
  { date: "2026-03-23", headline: "政府の資料で、ペルシャ湾内にとどまる日本関係の船は45隻",
    body: "運航会社を通じて毎日、乗組員の安否を確認している。", codes: ["9101", "9104"], importance: 1, type: "fact" },

  // https://www.sakigake.jp/news/article/20260422CO0143/
  // https://www.sbbit.jp/article/refers/185102
  { date: "2026-04-22", headline: "日本鉄鋼連盟の発表で、2025年度の国内の粗鋼生産量は8,033万トン。1968年度以来の低い水準",
    body: "前年度より3.2%少なく、4年続けての減少。", codes: ["5401"], importance: 1, type: "fact" },

  // https://www.aviationwire.jp/?p=345391
  // https://www.travelvoice.jp/20260613-159963
  { date: "2026-06-12", headline: "日本航空と全日空が、7〜8月発券分の国際線の燃油サーチャージを引き上げると発表",
    body: "欧米線の往復は13万円で、5〜6月発券分より1万8,000円高い。政府の航空燃料への補助を反映した額。", codes: ["9202", "9201"], importance: 1, type: "fact" },

  // https://www.watch.impress.co.jp/docs/news/2117986.html
  // https://allabout.co.jp/gm/gc/517528/
  { date: "2026-06-16", headline: "3メガバンクが、8月3日から普通預金金利を0.4%に引き上げると発表",
    body: "同じ日の日銀の利上げを受けた改定。", codes: ["8306"], importance: 1, type: "fact" },

  // https://www.oanda.jp/lab-education/market_news/kn_2026070101001517/
  // https://newswitch.jp/p/49628
  { date: "2026-07-01", headline: "1〜6月の国内の新車販売は238万7,189台。前年同期比1.8%増で、2年続けての増加",
    body: "", codes: ["7203"], importance: 1, type: "fact" },

  // https://www.seaj.or.jp/statistics/709771113451.pdf
  // https://newswitch.jp/p/49303
  { date: "2026-08-21", headline: "日本半導体製造装置協会の発表で、7月の日本製半導体製造装置の販売高は前年同月比35.4%増",
    body: "3カ月移動平均で5,562億円。", codes: ["8035", "6857"], importance: 1, type: "fact" },

  // https://www.jfnet.or.jp/wp/wp-content/uploads/2026/08/getujidata-2026-7.pdf
  // https://news.nissyoku.co.jp/archives/company/japan-food-service-association
  { date: "2026-08-25", headline: "日本フードサービス協会の調べで、7月の外食の売上高は前年同月比6.8%増",
    body: "客数が3.2%増、客単価が3.5%増。", codes: ["3197"], importance: 1, type: "fact" },

  // https://www.travelvoice.jp/20260916-160529
  // https://www.nippon.com/ja/japan-data/h02895/
  { date: "2026-09-16", headline: "8月の訪日客は309万8,900人で、前年同月比9.6%減。中国からは59.0%減",
    body: "日本政府観光局の推計。韓国、マレーシアなど14の市場では8月として過去最多。", codes: ["9202", "9201", "9603"], importance: 2, type: "fact" },

  /* ===================== 企業ニュース（1）：9202〜4911 ===================== */
  // 決算の数字は会社の決算短信・決算資料のとおり。純利益は親会社株主（所有者）に帰属する利益

  // https://www.aviationwire.jp/?p=342771
  // https://www.oanda.jp/lab-education/market_news/kn_2026043001002269/
  { date: "2026-04-30", headline: "ANAホールディングスの3月期決算は、純利益が10.5%増の1,690億円で過去最高",
    body: "今期（2027年3月期）の純利益は43.2%減の960億円を見込む。会社は、航空燃料の値上がりの影響を見込んでいる。", codes: ["9202"], importance: 2, type: "fact" },

  // https://www.aviationwire.jp/?p=342741
  // https://press.jal.co.jp/ja/items/uploads/6f00ebf4a680fb75958235e79e9ac09cf4ef1f96.pdf
  { date: "2026-04-30", headline: "日本航空の3月期決算は、純利益が28.6%増の1,376億円。売上収益は2兆125億円",
    body: "今期の純利益は20.1%減の1,100億円を見込む。", codes: ["9201"], importance: 2, type: "fact" },

  // https://prtimes.jp/main/html/rd/p/000001542.000030684.html
  // https://www.aviationwire.jp/?p=348339
  { date: "2026-08-03", headline: "日本航空の4〜6月期は、売上収益が11.2%増の5,237億円で第1四半期として最高。EBITは72.1%減の127億円",
    body: "会社は、燃油の値上がりと円安を減益の要因に挙げた。通期の予想は変えていない。", codes: ["9201"], importance: 2, type: "fact" },

  // https://www.olc.co.jp/ja/news/news_olc/auto_20260428513084/pdfFile.pdf
  // https://scouter.monex.co.jp/news/detail/4661_20260428_act_20260428_160009_1
  { date: "2026-04-28", headline: "オリエンタルランドが3月期決算を発表。今期の営業利益は4.5%減の1,608億円を見込む",
    body: "今期の売上高は増収の7,243億円、純利益は6.6%減の1,138億円の予想。", codes: ["4661"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/46610/081220260729501736_tse-qcedjpsm-46610-20260730346610-ixbrl.htm
  // https://scouter.monex.co.jp/news/detail/4661_20260730_act_20260730_160011_2
  { date: "2026-07-30", headline: "オリエンタルランドの4〜6月期は、売上高10.4%増の1,807億円、営業利益23.1%増の477億円",
    body: "第1四半期として過去最高の利益。通期の予想は変えていない。", codes: ["4661"], importance: 2, type: "fact" },

  // https://www.jreast.co.jp/press/2025/20260212_ho02.pdf
  { date: "2026-03-14", headline: "JR東日本が運賃改定を実施",
    body: "2024年12月に申請していた値上げ。", codes: ["9020"], importance: 1, type: "fact" },

  // https://kumanichi.com/articles/1986631
  // https://s.minkabu.jp/stock/9020/settlement
  { date: "2026-04-30", headline: "JR東日本の3月期決算は、売上高が6.8%増の3兆846億円で過去最高。純利益は10.5%増の2,478億円",
    body: "今期の純利益は2.9%増の2,550億円を見込む。年間配当は74円から84円に増やす予定。", codes: ["9020"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/90050/081220260526549152_tse-acedjpsm-90050-20260527390050-ixbrl.htm
  // https://finance.matsui.co.jp/stock/9005/settlement/index
  { date: "2026-05-12", headline: "東急の3月期決算は、経常利益が7.8%増の1,161億円",
    body: "今期の経常利益は4.1%減の1,114億円を見込む。", codes: ["9005"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/90050/081220260804507688_tse-qcedjpsm-90050-20260807390050-ixbrl.htm
  // https://scouter.monex.co.jp/news/detail/9005_20260807_act_20260807_113011_3
  { date: "2026-08-07", headline: "東急の4〜6月期は、経常利益が6.2%減の333億円",
    body: "通期の予想は変えていない。", codes: ["9005"], importance: 1, type: "fact" },

  // https://www2.jpx.co.jp/disc/96030/081220260612569274_tse-scedjpsy-96030-20260612396030-ixbrl.htm
  // https://finance.matsui.co.jp/news/586643/index
  { date: "2026-06-12", headline: "エイチ・アイ・エスが通期の業績予想を下方修正。最終損益は90億円の黒字から10億円の赤字に",
    body: "上期の決算と同時の発表。売上高の予想は4,200億円から3,950億円に、営業利益の予想は140億円から120億円に引き下げた。", codes: ["9603"], importance: 3, type: "fact" },

  // https://scouter.monex.co.jp/news/detail/3099_20260206_act_20260206_130012_2
  // https://finance.yahoo.co.jp/quote/3099.T/ai-topics
  { date: "2026-02-06", headline: "三越伊勢丹HDが通期の業績予想を上方修正。期末配当の増額と自社株買い・消却も発表",
    body: "4〜12月期の決算と同時の発表。", codes: ["3099"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/30990/081220260512526674_tse-acedjpsm-30990-20260513330990-ixbrl.htm
  // https://honichi.com/news/2026/05/21/mitsukosi-isetan-202603-04/
  { date: "2026-05-13", headline: "三越伊勢丹HDの3月期決算は、売上高5,456億円、営業利益800億円",
    body: "", codes: ["3099"], importance: 2, type: "fact" },

  // https://www.fashionsnap.com/article/2026-08-14/mihd-202703-1q/
  // https://finance.yahoo.co.jp/quote/3099.T/ai-topics
  { date: "2026-08-13", headline: "三越伊勢丹HDが今期の業績予想を上方修正",
    body: "4〜6月期の決算と同時の発表。会社は、国内の百貨店の売上が好調なことを理由に挙げた。", codes: ["3099"], importance: 2, type: "fact" },

  // https://www.sbbit.jp/article/refers/184418
  // https://www2.jpx.co.jp/disc/82330/081220260410501983_tse-acedjpsm-82330-20260414382330-ixbrl.htm
  { date: "2026-04-14", headline: "高島屋の2月期決算は、純損益が81億円の赤字。転換社債の買い入れ消却で712億円の特別損失",
    body: "営業利益は6.9%減の535億円。今期（2027年2月期）の純利益は380億円、年間配当は40円を見込む。", codes: ["8233"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/82330/081220260624579151_tse-qcedjpsm-82330-20260630382330-ixbrl.htm
  // https://www.takashimaya.co.jp/base/corp/topics/260703a.pdf
  { date: "2026-06-30", headline: "高島屋の3〜5月期は、営業利益が26.4%増の159億円",
    body: "営業収益は6.4%増の1,196億円。", codes: ["8233"], importance: 1, type: "fact" },

  // https://f-p.jp/media/?p=23326
  // https://disclosure2dl.edinet-fsa.go.jp/searchdocument/pdf/S100XI5S.pdf
  { date: "2026-01-06", headline: "高島屋が、2028年満期の転換社債（CB）を額面約600億円分買い入れ、2月20日にすべて消却すると発表",
    body: "3〜11月期の決算と同時の発表。通期の予想は変えていない。", codes: ["8233"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/31970/081220260213559441_tse-acedifsm-31970-20260213331970-ixbrl.htm
  // https://scouter.monex.co.jp/news/detail/3197_20260213_act_20260213_113017_4
  { date: "2026-02-13", headline: "すかいらーくHDの12月期決算は、売上収益が14.1%増の4,578億円、営業利益が23.9%増の299億円",
    body: "", codes: ["3197"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/31970/081220260813518978_tse-scedifsy-31970-20260813331970-ixbrl.htm
  // https://s.kabutan.jp/news/k202608130006/
  { date: "2026-08-13", headline: "すかいらーくHDが通期の業績予想を上方修正。純利益の予想は195億円から205億円に",
    body: "1〜6月期の決算と同時の発表。年間配当の予想も26円から27円に増やした。", codes: ["3197"], importance: 2, type: "fact" },

  // https://www.oanda.jp/lab-education/?p=107946
  // https://www.fashionsnap.com/article/2026-02-10/shiseido-2025-report/
  { date: "2026-02-10", headline: "資生堂の12月期決算は、純損益が406億円の赤字",
    body: "今期（2026年12月期）の税引前利益は600億円を見込む。", codes: ["4911"], importance: 2, type: "fact" },

  // https://corp.shiseido.com/jp/ir/pdf/ir20260512_277.pdf
  // https://scouter.monex.co.jp/news/detail/4911_20260512_act_20260512_153104_7
  { date: "2026-05-12", headline: "資生堂の1〜3月期は、売上高が1.6%増の2,320億円、純利益は84億円",
    body: "通期の予想は変えていない。", codes: ["4911"], importance: 1, type: "fact" },

  // https://corp.shiseido.com/jp/ir/pdf/ir20260805_293.pdf
  // https://s.kabutan.jp/news/k202608050112/
  { date: "2026-08-05", headline: "資生堂の1〜6月期は、純利益が前年同期の3.1倍の296億円",
    body: "通期の予想は変えていない。", codes: ["4911"], importance: 2, type: "fact" },

  /* ===================== 企業ニュース（2）：8306〜9843 ===================== */

  // https://www2.jpx.co.jp/disc/72030/081220260730503849_tse-qcedifsm-72030-20260804372030-ixbrl.htm
  // https://monoist.itmedia.co.jp/mn/articles/2608/05/news048.html
  { date: "2026-08-04", headline: "トヨタ自動車が今期の業績予想を上方修正。営業利益は3兆円から3兆4,000億円に",
    body: "4〜6月期の決算と同時の発表。想定する為替レートを1ドル160円に見直した。4〜6月期の営業利益は8.8%減の1兆634億円。", codes: ["7203"], importance: 3, type: "fact" },

  // https://www.nintendo.co.jp/ir/pdf/2026/260203.pdf
  // https://gamebiz.jp/news/420325
  { date: "2026-02-03", headline: "任天堂の4〜12月期は、売上高が99.3%増の1兆9,058億円、営業利益が21.3%増の3,003億円",
    body: "通期の予想は変えていない。", codes: ["7974"], importance: 2, type: "fact" },

  // https://automaton-media.com/articles/newsjp/20260508-441819/
  // https://pc.watch.impress.co.jp/docs/news/2107301.html
  { date: "2026-05-08", headline: "任天堂が、国内のNintendo Switch 2（日本語・国内専用）を5月25日から4万9,980円から5万9,980円に値上げすると発表",
    body: "Nintendo Switchも値上げする。米国・カナダ・欧州のSwitch 2は9月1日から新しい価格になる。", codes: ["7974"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/79740/081220260501517030_tse-acedjpsm-79740-20260508379740-ixbrl.htm
  // https://gamebiz.jp/news/425575
  { date: "2026-05-08", headline: "任天堂の3月期決算は、売上高が98.6%増の2兆3,130億円、営業利益が27.5%増の3,601億円",
    body: "Nintendo Switch 2の販売台数は1,986万台。今期はSwitch 2を1,650万台、純利益は26.9%減の3,100億円と見込む。", codes: ["7974"], importance: 2, type: "fact" },

  // https://www.nintendo.co.jp/ir/pdf/2026/260806.pdf
  // https://www.gamebusiness.jp/article/2026/08/06/27633.html
  { date: "2026-08-06", headline: "任天堂の4〜6月期は、売上高が9.5%減の5,178億円、営業利益が150.5%増の1,425億円",
    body: "Nintendo Switch 2の販売台数は382万台。通期の予想は変えていない。", codes: ["7974"], importance: 2, type: "fact" },

  // https://gamebiz.jp/news/425542
  // https://www.sbbit.jp/article/cont1/185323
  // https://scouter.monex.co.jp/news/detail/6758_20260508_act_20260508_120011_1
  { date: "2026-05-08", headline: "ソニーグループの3月期決算は、営業利益が13.4%増の1兆4,475億円で過去最高。5,000億円を上限とする自社株買いも発表",
    body: "今期の営業利益は10.5%増の1兆6,000億円を見込む。", codes: ["6758"], importance: 2, type: "fact" },

  // https://gamebiz.jp/news/430305
  // https://www.newsweekjapan.jp/articles/-/329974
  { date: "2026-07-31", headline: "ソニーグループが今期の業績予想を上方修正。営業利益は1兆6,000億円から1兆7,200億円に",
    body: "4〜6月期の決算と同時の発表。4〜6月期の営業利益は40.2%増の4,764億円。純利益の予想も1兆2,100億円に引き上げた。", codes: ["6758"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/24130/081220260424510153_tse-acedifsm-24130-20260424510153-ixbrl.htm
  // https://minkabu.jp/stock/2413/settlement
  { date: "2026-05-01", headline: "エムスリーの3月期決算は、売上高3,513億円、営業利益735億円",
    body: "今期は売上高4,000億円、営業利益800億円を見込む。", codes: ["2413"], importance: 2, type: "fact" },

  // https://s.kabutan.jp/news/k202608060187/
  // https://www2.jpx.co.jp/disc/24130/081220260805510334_tse-qcedifsm-24130-20260805510334-ixbrl.htm
  { date: "2026-08-06", headline: "エムスリーの4〜6月期は、売上収益が4.5%増の901億円、営業利益が8.6%減の181億円",
    body: "純利益は23.4%減の91億円。", codes: ["2413"], importance: 2, type: "fact" },

  // https://www.oanda.jp/lab-education/?p=115983
  // https://www2.jpx.co.jp/disc/99840/081220260515538975_tse-acedifsm-99840-20260515399840-ixbrl.htm
  { date: "2026-05-13", headline: "ソフトバンクグループの3月期決算は、純利益が5兆22億円。日本企業で初めて5兆円を超える",
    body: "米オープンAIへの投資の評価益が大きく増えた。", codes: ["9984"], importance: 2, type: "fact" },

  // https://kumanichi.com/articles/2022688
  // https://www.nikkan.co.jp/articles/view/00788708
  { date: "2026-08-06", headline: "ソフトバンクグループの4〜6月期は、純利益が17.7%減の3,473億円",
    body: "売上高は10.9%増の2兆195億円。", codes: ["9984"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/46890/081220260507518938_tse-acedifsm-46890-20260508346890-ixbrl.htm
  { date: "2026-05-08", headline: "LINEヤフーが3月期決算を発表。今期は売上収益10.0%増の2兆2,400億円、調整後EBITDA17.8%増の5,850億円を見込む",
    body: "年間配当は7.30円から11円に増やす予想。", codes: ["4689"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/46890/081220260724598934_tse-qcedifsm-46890-20260803346890-ixbrl.htm
  // https://scouter.monex.co.jp/news/detail/4689_20260803_act_20260803_153013_2
  { date: "2026-08-03", headline: "LINEヤフーの4〜6月期は、売上収益が13.1%増の5,540億円、営業利益が6.4%増の1,012億円",
    body: "売上収益と調整後EBITDAは、第1四半期として過去最高。", codes: ["4689"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/98430/081220260514532526_tse-acedifsm-98430-20260514398430-ixbrl.htm
  { date: "2026-05-14", headline: "ニトリホールディングスの3月期決算は、売上収益9,122億円、営業利益1,255億円",
    body: "", codes: ["9843"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/98430/081220260625580125_tse-qcedifsm-98430-20260807398430-ixbrl.htm
  // https://scouter.monex.co.jp/news/detail/9843_20260807_act_20260807_153020_1
  { date: "2026-08-07", headline: "ニトリホールディングスの4〜6月期は、売上収益が2.3%減の2,263億円、営業利益が1.1%減の365億円",
    body: "通期の予想は変えていない。", codes: ["9843"], importance: 1, type: "fact" },

  /* ===================== 企業ニュース（3）：9722・8698〜9104 ===================== */

  // https://s.kabutan.jp/news/k202608060164/
  // https://www2.jpx.co.jp/disc/97220/081220260805509428_tse-scedjpsy-97220-20260806397220-ixbrl.htm
  { date: "2026-08-06", headline: "藤田観光が通期の業績予想を上方修正。経常利益の予想は116億円から128億円に",
    body: "1〜6月期の決算と同時の発表。", codes: ["9722"], importance: 2, type: "fact" },

  // https://www.watch.impress.co.jp/docs/news/2107994.html
  // https://www.businessinsider.jp/article/2605-kddi-coincheck-web3-finance-partnership/
  { date: "2026-05-12", headline: "KDDIが、コインチェックを傘下に持つCoincheck Group N.V.に約102億円を出資すると発表",
    body: "発行済み普通株式の14.9%を取得する。コインチェックとの業務提携も結ぶ。", codes: ["9433", "8698"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/45190/081220260129540977_tse-acedifsm-45190-20260129345190-ixbrl.htm
  { date: "2026-01-29", headline: "中外製薬が12月期決算を発表。今期はCore営業利益7.5%増の6,700億円を見込む",
    body: "今期の売上収益は6.9%増の1兆3,450億円の予想。", codes: ["4519"], importance: 2, type: "fact" },

  // https://kabuyoho-sls-disclose.ifis.co.jp/232/140120260423509684.pdf
  { date: "2026-04-24", headline: "中外製薬の1〜3月期は、売上収益が23.9%増の3,217億円、Core営業利益が24.4%増の1,633億円",
    body: "", codes: ["4519"], importance: 2, type: "fact" },

  // https://s.kabutan.jp/news/k202607300117/
  // https://scouter.monex.co.jp/news/detail/8035_20260730_act_20260730_160006_1
  { date: "2026-07-30", headline: "東京エレクトロンの4〜6月期は、売上高33.3%増の7,324億円、純利益39.5%増の1,643億円。4〜9月期の予想を上方修正",
    body: "4〜9月期の経常利益の予想は4,370億円から4,640億円に。中間配当の予想も増やした。", codes: ["8035"], importance: 2, type: "fact" },

  // https://scouter.monex.co.jp/news/detail/6857_20260729_act_20260729_153012_6
  // https://www.gyokaidigest.com/companies/advantest/report/2027-Q1
  { date: "2026-07-29", headline: "アドバンテストが通期の業績予想を上方修正。純利益の予想は4,655億円から6,600億円に",
    body: "4〜6月期の決算と同時の発表。売上高の予想は1兆7,140億円に引き上げた。4〜6月期の純利益は93.8%増の1,748億円。", codes: ["6857"], importance: 3, type: "fact" },

  // https://www.oanda.jp/lab-education/market_news/kn_2026020501001247/
  // https://www.newsweekjapan.jp/articles/-/322251
  { date: "2026-02-05", headline: "日本製鉄が3月期の業績予想を下方修正。純損益は600億円の赤字から700億円の赤字に",
    body: "4〜12月期の決算と同時の発表。", codes: ["5401"], importance: 2, type: "fact" },

  // https://kabukiso.com/column/news/2026/nipponsteel_202603q4.html
  // https://www.oanda.jp/lab-education/?p=108993
  { date: "2026-05-13", headline: "日本製鉄の3月期決算は、純利益が171億円。今期の純利益は2,200億円を見込む",
    body: "今期はUSスチールの利益の貢献を見込む。", codes: ["5401"], importance: 2, type: "fact" },

  // https://www.hokkaido-np.co.jp/article/1348011/
  // https://www.newsweekjapan.jp/articles/-/330326
  { date: "2026-08-04", headline: "日本製鉄が今期の業績予想を上方修正。純利益は2,200億円から2,900億円に",
    body: "4〜6月期の決算と同時の発表。4〜6月期の純利益は752億円。", codes: ["5401"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/91010/081220260508520390_tse-acedjpsm-91010-20260511391010-ixbrl.htm
  { date: "2026-05-11", headline: "日本郵船の3月期決算は、売上高が6.4%減の2兆4,236億円、経常利益が57.0%減の2,111億円",
    body: "", codes: ["9101"], importance: 2, type: "fact" },

  // https://www.nyk.com/ir/news/2026/__icsFiles/afieldfile/2026/07/30/20260730jpn.pdf
  // https://scouter.monex.co.jp/news/detail/9101_20260730_ann_20260730_153022_4
  { date: "2026-07-30", headline: "日本郵船が今期の業績予想を上方修正。経常利益は1,850億円から2,500億円に",
    body: "", codes: ["9101"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/91010/081220260804508407_tse-qcedjpsm-91010-20260805391010-ixbrl.htm
  { date: "2026-08-05", headline: "日本郵船の4〜6月期は、経常利益が27.3%増の712億円",
    body: "", codes: ["9101"], importance: 1, type: "fact" },

  /* ===================== 観測報道（正式な発表の前に実際にあった報道） ===================== */
  // 報道があった日付で入れる。報じられた内容は確定した事実ではない

  // https://www.sakigake.jp/news/article/20260409CO0063/
  // https://www.oanda.jp/lab-education/?p=113245
  { date: "2026-04-09", headline: "政府が5月にも行う石油備蓄の追加放出を、国家備蓄の20日分程度で検討していると共同通信が報じる",
    body: "", codes: [], importance: 1, type: "report" },

  // https://www.sakigake.jp/news/article/20260416CO0012/
  // https://www.fptrendy.com/2026/04/16/us-iran-truce-extension-iran-port-blockade-talks/
  { date: "2026-04-15", headline: "米国とイランが、期限の近い2週間の停戦の2週間延長を検討していると米メディアが報じる",
    body: "", codes: [], importance: 1, type: "report" },

  // https://www.sakigake.jp/news/article/20260514CO0065/
  // https://www.oanda.jp/lab-education/?p=116073
  { date: "2026-05-14", headline: "政府が2026年度補正予算案の編成の検討に入ったと共同通信が報じる",
    body: "中東情勢を受けたガソリンや電気・ガス代の負担を和らげる家計支援が目的とされる。", codes: [], importance: 2, type: "report" },

  // https://www.sakigake.jp/news/article/20260521CO0174/
  // https://www.oanda.jp/lab-education/?p=116709
  { date: "2026-05-21", headline: "政府が補正予算案の規模を3兆円程度とする方向で調整に入ったと共同通信が報じる",
    body: "", codes: [], importance: 1, type: "report" },

  // https://kumanichi.com/articles/1995060
  // https://www.oanda.jp/lab-education/?p=116975
  { date: "2026-05-25", headline: "飲食料品の消費税を、ゼロではなく1%に下げる案が政府内で有力になっていると共同通信が報じる",
    body: "レジの改修にかかる期間が短く、早く実施できるためとされる。", codes: [], importance: 2, type: "report" },

  // https://www.sakigake.jp/news/article/20260529CO0189/
  // https://www.oanda.jp/lab-education/market_news/kn_2026052901002199/
  { date: "2026-05-29", headline: "政府が、飲食料品の消費税1%への引き下げを2027年4月の実施を軸に検討していると共同通信が報じる",
    body: "期間は2年間に限るとされる。", codes: [], importance: 1, type: "report" },

  // https://www.sakigake.jp/news/article/20260615CO0071/
  // https://kumanichi.com/articles/2002727
  { date: "2026-06-15", headline: "日銀が16日の会合で政策金利を1.0%程度に引き上げる見通しと共同通信が報じる",
    body: "", codes: [], importance: 2, type: "report" },

  // https://kumanichi.com/articles/2005895
  // https://www.sakigake.jp/news/article/20260623CO0124/
  { date: "2026-06-23", headline: "飲食料品の消費税1%案について、政府・与党が月内の決着に向けて調整していると共同通信が報じる",
    body: "", codes: [], importance: 1, type: "report" },

  // https://kumanichi.com/articles/2026257
  // https://www.sakigake.jp/news/article/20260818CO0048/
  { date: "2026-08-18", headline: "米中首脳が9月24日に会談する方向と米メディアが報じる",
    body: "", codes: [], importance: 1, type: "report" },

  /* ===================== 当時実際に出回った噂と、その公式な否定・注意喚起 ===================== */
  // 噂の date は、出回っていたことを資料で確認できる最初の日付

  // https://www.logi-today.com/926403
  // https://www.sbbit.jp/article/refers/185001
  // https://fortune.com/2026/03/23/toilet-paper-panic-japan-shortages-iran-war-covid-19
  { date: "2026-03-18", headline: "中東情勢の影響でトイレットペーパーが品薄になるという情報がSNSで広がる",
    body: "", codes: [], importance: 2, type: "rumor" },

  // https://www.logi-today.com/926403
  // https://www.advertimes.com/?p=540403
  { date: "2026-03-18", headline: "日本家庭紙工業会が、国内に流通するトイレットペーパーの97%は国内生産で、中東情勢による供給への影響はないと発表",
    body: "", codes: [], importance: 1, type: "fact" },

  // https://www.meti.go.jp/press/2025/03/20260319005/20260319005.html
  // https://fortune.com/2026/03/23/toilet-paper-panic-japan-shortages-iran-war-covid-19
  { date: "2026-03-19", headline: "経済産業省が、トイレットペーパーの原料はほとんど中東に依存せず、生産への直接的な影響はないとして、正確な情報にもとづく冷静な判断を呼びかけ",
    body: "", codes: [], importance: 1, type: "fact" },
];
