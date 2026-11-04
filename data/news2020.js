// リアル相場チャレンジで流す、2020年の実際のニュース（表示専用。株価には影響しない）
// date = 出来事・発表があった日。画面には date より後の最初の営業日の寄り付き前に出る。
// importance: 3 = その日の株価が大きく動きうる / 2 = 決算など通常 / 1 = 補足
// type: "fact" = 実際の出来事 / "report" = 発表前の観測報道 / "rumor" = 当時実際に出回った噂
// 見出し・本文は報道や公式発表を要約して書き直したもの。各ニュースの上に出典（2つ以上）を残す。
const NEWS2020 = [

  /* ===================== 市場全体 ===================== */

  // https://www.mhlw.go.jp/stf/newpage_09241.html
  // https://honichi.com/news/2020/01/31/coronavirustimeseries/
  { date: "2020-01-30", headline: "WHOが新型コロナウイルスの流行を「国際的に懸念される公衆衛生上の緊急事態」と宣言",
    body: "中国・武漢市から広がった感染について、WHOの緊急委員会が判断した（日本時間31日未明）。", codes: [], importance: 2, type: "fact" },

  // https://tbladvisory.com/20200225nikkei/
  // https://s.kabutan.jp/news/n202002250702
  { date: "2020-02-25", headline: "25日の日経平均は781円安の2万2,605円。一時1,000円を超える下げ",
    body: "欧州や中東への感染拡大が警戒され、前日の欧米市場が大きく下げた。", codes: [], importance: 3, type: "fact" },

  // https://www.jp-toushin.japanpost.jp/news/detail/marketreport20200309.pdf
  // https://s.kabutan.jp/news/n202003090664
  { date: "2020-03-09", headline: "9日の日経平均は前日比約5%安の1万9,698円。原油安と円高が重荷に",
    body: "下げ幅は1,050円。欧米での感染拡大に加え、原油価格の急落と急速な円高が重なった。", codes: [], importance: 3, type: "fact" },

  // https://scienceportal.jst.go.jp/newsflash/20200312_01
  // https://www.newsweekjapan.jp/articles/-/37103
  { date: "2020-03-11", headline: "WHOが新型コロナを「パンデミック（世界的な大流行）」と表明",
    body: "WHOがパンデミックと表現するのは2009年の新型インフルエンザ以来（日本時間12日未明）。", codes: [], importance: 3, type: "fact" },

  // https://s.kabutan.jp/news/n202003130736
  // https://indexes.nikkei.co.jp/atoz/2020/04/202003.html
  { date: "2020-03-13", headline: "13日の日経平均は1,128円安の1万7,431円。下落率は6%超",
    body: "前日の米国株の急落を受けた。", codes: [], importance: 3, type: "fact" },

  // https://president.jp/articles/-/33835
  // https://www.nri.com/jp/media/column/kiuchi/20200316_3.html
  { date: "2020-03-16", headline: "日銀が会合を前倒しして追加の金融緩和を決定。ETFの買い入れ上限を年12兆円に倍増",
    body: "社債・CPの買い入れ枠の拡大や、企業の資金繰りを支える新しい資金供給も決めた。マイナス金利の深掘りは見送った。", codes: [], importance: 3, type: "fact" },

  // https://s.kabutan.jp/news/n202003190908
  // https://indexes.nikkei.co.jp/atoz/2020/04/202003.html
  { date: "2020-03-19", headline: "19日の日経平均は173円安の1万6,552円。年初来安値を更新",
    body: "1月20日に付けた今年の高値（2万4,083円）からの下落率は3割を超えた。", codes: [], importance: 2, type: "fact" },

  // https://www.cnn.co.jp/showbiz/35151301.html
  // https://www.aviationwire.jp/?p=198801
  { date: "2020-03-24", headline: "東京五輪・パラリンピックの延期が決定。1年程度延期し、遅くとも2021年夏までに開催",
    body: "安倍首相とIOCのバッハ会長が電話会談で合意した（24日夜）。", codes: [], importance: 3, type: "fact" },

  // https://tbladvisory.com/20200325nikkei/
  // https://s.kabutan.jp/news/n202003250738
  { date: "2020-03-25", headline: "25日の日経平均は1,454円高の1万9,546円。上昇率は8%",
    body: "米国の大型経済対策をめぐり、与野党が合意したと伝わった。", codes: [], importance: 2, type: "fact" },

  // https://www.businessinsider.jp/article/212859/
  // https://www.mhlw.go.jp/content/10900000/001131553.pdf
  { date: "2020-04-07", headline: "政府が東京など7都府県に緊急事態宣言を発出",
    body: "対象は東京・神奈川・埼玉・千葉・大阪・兵庫・福岡。外出の自粛などが求められる。", codes: [], importance: 3, type: "fact" },

  // https://www.city.nagoya.jp/kenkofukushi/eisei/1015269/1015388/1015392/1015403.html
  // https://www.bunka.go.jp/koho_hodo_oshirase/sonota_oshirase/2020041602.html
  { date: "2020-04-16", headline: "緊急事態宣言の対象を全国に拡大。期間は5月6日まで",
    body: "北海道・愛知・京都など13都道府県は、特に重点的に対策を進める「特定警戒都道府県」とされた。", codes: [], importance: 2, type: "fact" },

  // https://www.boj.or.jp/mopo/mpmdeci/state_2020/k200427a.htm
  // https://www.dlri.co.jp/pdf/macro/2020/kuma200427BOJ.pdf
  { date: "2020-04-27", headline: "日銀が金融緩和の強化を決定。国債をさらに積極的に買い入れる方針",
    body: "CP・社債の追加の買い入れ枠を、それぞれ1兆円から7.5兆円に増やした。", codes: [], importance: 2, type: "fact" },

  // https://www.nippon.com/ja/japan-data/h00733/
  // https://www.timeout.jp/tokyo/ja/ニュース/緊急事態宣言を全国で解除-052620
  { date: "2020-05-25", headline: "緊急事態宣言を全国で解除。残っていた首都圏の1都3県と北海道も解除",
    body: "4月7日の発出から49日目での全面解除。", codes: [], importance: 3, type: "fact" },

  // https://honichi.com/news/2020/08/28/abeinterview
  // https://www.businessinsider.jp/article/219291/
  { date: "2020-08-28", headline: "安倍首相が辞任の意向を表明。持病の悪化を理由に",
    body: "28日夕方の記者会見で、潰瘍性大腸炎の再発が確認されたと説明した。", codes: [], importance: 3, type: "fact" },

  // https://seijiyama.jp/article/news/nws20200916.html
  // https://www.businessinsider.jp/article/220202/
  { date: "2020-09-16", headline: "菅義偉氏が第99代首相に選出され、菅内閣が発足",
    body: "安倍首相の辞任を受けた交代。", codes: [], importance: 2, type: "fact" },

  // https://www.businessinsider.jp/article/223759/
  // https://media.monex.co.jp/articles/-/15421
  { date: "2020-11-07", headline: "米大統領選で、米主要メディアが民主党のバイデン氏の当選確実を報道",
    body: "激戦州のペンシルベニアを制し、当選に必要な選挙人270人を上回った（現地時間7日）。トランプ大統領は敗北を認めていない。", codes: [], importance: 3, type: "fact" },

  // https://s.kabutan.jp/news/n202011090906
  // https://limo.media/articles/-/20233
  { date: "2020-11-09", headline: "9日の日経平均は514円高の2万4,839円。約29年ぶりの高値",
    body: "米大統領選の結果がほぼ固まり、先行きの不透明感が和らいだ。5営業日続けて上昇。", codes: [], importance: 2, type: "fact" },

  // https://www.cnn.co.jp/business/35162182.html
  // https://www.newsweekjapan.jp/articles/-/41293?page=2
  { date: "2020-11-09", headline: "米ファイザーが、開発中の新型コロナワクチンで90%を超える予防効果が確認されたと発表",
    body: "独ビオンテックとの共同開発。4万3,000人あまりが参加した臨床試験の中間分析の結果。", codes: [], importance: 3, type: "fact" },

  // https://forbesjapan.com/articles/detail/38582
  // https://www.yakuji.co.jp/entry83339.html
  { date: "2020-12-02", headline: "英国が米ファイザーなどの新型コロナワクチンの緊急使用を承認",
    body: "翌週から英国全土で接種が始まる見通し。", codes: [], importance: 2, type: "fact" },

  // https://www.watch.impress.co.jp/docs/news/1295145.html
  // https://www.travelvoice.jp/20201214-147729
  { date: "2020-12-14", headline: "政府が「Go To トラベル」を12月28日から1月11日まで全国で一時停止すると表明",
    body: "国内の新規感染者が12日に初めて3,000人を超えたことを受けた。", codes: ["9202", "9201", "9603", "9722"], importance: 3, type: "fact" },

  /* ===================== 任天堂（7974） ===================== */

  // https://www.gamebusiness.jp/article/2020/01/30/16681.html
  // https://www.gamespark.jp/article/2020/01/30/96399.html
  { date: "2020-01-30", headline: "任天堂の4〜12月期決算は営業利益2,629億円（前年同期比19.5%増）",
    body: "Nintendo Switchの販売は1,774万台。12月には中国での販売も始まった。", codes: ["7974"], importance: 2, type: "fact" },

  // https://www.famitsu.com/news/202003/14194418.html
  // https://dengekionline.com/articles/29824/
  { date: "2020-03-20", headline: "任天堂がNintendo Switch用ソフト「あつまれ どうぶつの森」を発売",
    body: "「どうぶつの森」シリーズの完全新作は約6年ぶり。", codes: ["7974"], importance: 2, type: "fact" },

  // https://www.gamespark.jp/article/2020/05/07/98876.html
  // https://www.gamebusiness.jp/article/2020/05/07/17065.html
  // https://www.gamebusiness.jp/article/2020/08/06/17447.html （今期予想の数字）
  // https://www.sbbit.jp/article/refers/46191 （今期予想の数字）
  { date: "2020-05-07", headline: "任天堂の前期決算は営業利益3,523億円（41.1%増）。今期は営業利益3,000億円（約15%減）の見通し",
    body: "今期の売上高は1兆2,000億円（8.3%減）を見込む。", codes: ["7974"], importance: 2, type: "fact" },

  // https://www.nintendo.co.jp/ir/pdf/2020/200806.pdf
  // https://gigazine.net/news/20200807-nintendo-21q1
  { date: "2020-08-06", headline: "任天堂の4〜6月期決算は営業利益1,447億円で、前年同期の約5.3倍",
    body: "売上高は3,581億円（108.1%増）。「あつまれ どうぶつの森」はこの3か月で1,063万本を販売した。", codes: ["7974"], importance: 2, type: "fact" },

  // https://www.sbbit.jp/article/refers/46191
  // https://s.kabutan.jp/stocks/7974/news/k202011050202/
  { date: "2020-11-05", headline: "任天堂が今期の業績予想を上方修正。営業利益は3,000億円から4,500億円に",
    body: "4〜9月期の営業利益は2,914億円で前年同期の約3倍。年間配当の予想も840円から1,260円に引き上げた。", codes: ["7974"], importance: 3, type: "fact" },

  /* ===================== ANAホールディングス（9202） ===================== */

  // https://www.aviationwire.jp/?p=201080
  // https://www.newsweekjapan.jp/articles/-/38107
  { date: "2020-04-20", headline: "ANAホールディングスが前期の業績予想を下方修正。純利益は940億円から270億円に",
    body: "新型コロナによる入国制限や国内の移動自粛で、旅客が大きく減った。", codes: ["9202"], importance: 2, type: "fact" },

  // https://www.aviationwire.jp/?p=201636
  // https://techxplore.com/news/2020-04-japan-ana-net-profit-virus.html
  { date: "2020-04-28", headline: "ANAホールディングスの前期決算は純利益276億円（75%減）。今期の業績予想は公表を見送り",
    body: "今期の見通しは、新型コロナの影響が見通せないとして出さなかった。", codes: ["9202"], importance: 2, type: "fact" },

  // https://www.aviationwire.jp/?p=207708
  // https://travel.watch.impress.co.jp/docs/news/1268143.html
  { date: "2020-07-29", headline: "ANAホールディングスの4〜6月期決算は1,088億円の最終赤字",
    body: "売上高は前年同期比75.7%減の1,216億円。国際線の旅客収入は9割超減った。今期の業績予想は未定のまま。", codes: ["9202"], importance: 2, type: "fact" },

  // https://www.aviationwire.jp/archives/213851
  // https://www.sbbit.jp/article/refers/45571
  { date: "2020-10-27", headline: "ANAホールディングスが今期は5,100億円の最終赤字になる見通しを発表。4,000億円の劣後ローンも契約",
    body: "劣後ローンは、返済の順番が後になる代わりに、一部を資本とみなせる借り入れ。4〜9月期決算と同時に発表した。", codes: ["9202"], importance: 3, type: "fact" },

  // https://www.aviationwire.jp/archives/215783
  // https://www.travelvoice.jp/20201127-147618
  { date: "2020-11-27", headline: "ANAホールディングスが公募増資などで最大約3,321億円を調達すると発表",
    body: "新株を最大1億4,000万株発行する。財務基盤を強めるためと説明した。", codes: ["9202"], importance: 3, type: "fact" },

  /* ===================== 東京エレクトロン（8035） ===================== */

  // https://s.kabutan.jp/stocks/8035/news/k202006180007/
  // https://www.j-cast.com/2020/07/08389678.html?p=all
  { date: "2020-06-18", headline: "東京エレクトロンが未定だった今期の業績予想を公表。売上高は1兆2,800億円（13.5%増）の見通し",
    body: "年間配当は660円（72円の増配）の予定。", codes: ["8035"], importance: 2, type: "fact" },

  // https://finance.logmi.jp/articles/375831 （決算説明会 7/28）
  // https://www.asset-alive.com/news/?mode=show&seq=37978
  // https://www.tel.com/ir/library/fs/hq95qj00000007ck-att/yuho58q1.pdf （第1四半期報告書）
  { date: "2020-07-28", headline: "東京エレクトロンの4〜6月期決算は売上高3,148億円、経常利益は約750億円（68.4%増）",
    body: "半導体製造装置の売上高は53.3%増の3,037億円。通期の予想は6月18日の公表から変えていない。", codes: ["8035"], importance: 2, type: "fact" },

  // https://www.sbbit.jp/article/refers/45787
  // https://www.asset-alive.com/news/?mode=show&seq=38889
  { date: "2020-10-29", headline: "東京エレクトロンが今期の利益予想を2,750億円から2,810億円に上方修正",
    body: "4〜9月期決算と同時に発表した。", codes: ["8035"], importance: 2, type: "fact" },

  /* ===================== グループ1：空運・陸運・旅行・レジャー ===================== */

  /* ---------- 日本航空（9201） ---------- */

  // https://www.aviationwire.jp/archives/201736/print/
  // https://travel.watch.impress.co.jp/docs/news/1250439.html
  { date: "2020-04-30", headline: "日本航空の前期決算は純利益534億円（64.5%減）",
    body: "1〜3月期は2012年の再上場後で初めての赤字になった。", codes: ["9201"], importance: 2, type: "fact" },

  // https://www.aviationwire.jp/?p=208147
  // https://www.newsweekjapan.jp/articles/-/163963
  { date: "2020-08-03", headline: "日本航空の4〜6月期決算は937億円の最終赤字",
    body: "国内線・国際線とも旅客が急減した。四半期の最終赤字としては2009年に次ぐ規模。", codes: ["9201"], importance: 2, type: "fact" },

  // https://www.aviationwire.jp/?p=214230
  // https://www.sbbit.jp/article/refers/45899
  { date: "2020-10-30", headline: "日本航空が今期は2,400億〜2,700億円の最終赤字になる見通しを発表",
    body: "これまで未定としていた通期予想を初めて示した。4〜9月期は1,612億円の最終赤字。", codes: ["9201"], importance: 2, type: "fact" },

  // https://www.travelvoice.jp/20201106-147484
  // https://www.aviationwire.jp/?p=215293
  { date: "2020-11-06", headline: "日本航空が公募増資などで最大1,680億円を調達すると発表",
    body: "公募増資は2012年の再上場後で初めて。新しい機体の導入などに充てる。", codes: ["9201"], importance: 2, type: "fact" },

  /* ---------- JR東日本（9020） ---------- */

  // https://www.watch.impress.co.jp/docs/news/1274779.html
  // https://www.timeout.jp/tokyo/ja/ニュース/首都圏で終電繰り上げへ-2021年春からを予定-090420
  { date: "2020-09-03", headline: "JR東日本が、2021年春から首都圏の終電を30分程度繰り上げると発表",
    body: "深夜の利用が大きく減ったことと、夜間の保守作業の時間を確保するため。", codes: ["9020"], importance: 1, type: "fact" },

  // https://www2.infomart.co.jp/web/jp/images/upload/852/140120200916493583_9432122.pdf （会社の開示資料）
  // https://tetsudo-ch.com/10731223.html
  { date: "2020-09-16", headline: "JR東日本が今期は4,180億円の最終赤字になる見通しを発表",
    body: "これまで未定としていた通期予想を公表した。年間配当は1株100円（前期は165円）の予定。", codes: ["9020"], importance: 3, type: "fact" },

  /* ---------- オリエンタルランド（4661） ---------- */

  // https://www.bcnretail.com/market/detail/20200228_160143.html
  // https://www.travelvoice.jp/20200228-145559
  { date: "2020-02-28", headline: "オリエンタルランドが、東京ディズニーランドとディズニーシーを2月29日から3月15日まで臨時休園すると発表",
    body: "新型コロナの感染拡大を防ぐため。長期の休園は2011年の東日本大震災の直後以来。", codes: ["4661"], importance: 3, type: "fact" },

  // https://www.travelvoice.jp/20200623-146464
  // https://travel.watch.impress.co.jp/docs/news/1260790.html
  { date: "2020-06-23", headline: "オリエンタルランドが、東京ディズニーランドとディズニーシーを7月1日に再開すると発表",
    body: "当面は入園者数を通常の半分以下に抑え、チケットは日付指定のオンライン販売にする。", codes: ["4661"], importance: 2, type: "fact" },

  // https://www.travelvoice.jp/20200731-146746
  // https://www.businessinsider.jp/article/217662/
  { date: "2020-07-30", headline: "オリエンタルランドの4〜6月期決算は約250億円の最終赤字",
    body: "臨時休園で売上高は前年同期比94.9%減の61億円。休園中の固定費を特別損失に計上した。", codes: ["4661"], importance: 2, type: "fact" },

  // https://toyokeizai.net/articles/-/385710
  // https://www.sbbit.jp/article/refers/45798
  { date: "2020-10-29", headline: "オリエンタルランドが、今期は最終赤字になる見通しを発表",
    body: "臨時休園と、再開後の入園者数の制限が続いた。", codes: ["4661"], importance: 2, type: "fact" },

  /* ---------- エイチ・アイ・エス（9603） ---------- */

  // https://www.traicy.com/?p=145892
  // https://www.travelvoice.jp/20200303-145570
  { date: "2020-03-03", headline: "エイチ・アイ・エスが、新型コロナの影響で今期の業績予想を下方修正",
    body: "11〜1月期の決算と同時に発表した。", codes: ["9603"], importance: 2, type: "fact" },

  // https://www.sbbit.jp/article/refers/49082
  // https://www.travelvoice.jp/20201211-147724
  { date: "2020-12-11", headline: "エイチ・アイ・エスの10月期決算は250億円の最終赤字。通期の赤字は2002年の上場後で初めて",
    body: "国内店舗の統廃合を進めた。今期の業績予想は未定とした。", codes: ["9603"], importance: 2, type: "fact" },

  /* ---------- 藤田観光（9722） ---------- */

  // https://www2.infomart.co.jp/web/jp/images/upload/672/010120200212462850_8385509.pdf （決算短信）
  { date: "2020-02-14", headline: "藤田観光の2019年12月期決算は2億8,500万円の最終赤字（前期は5億5,600万円の黒字）",
    body: "売上高は689億円（0.5%減）。", codes: ["9722"], importance: 1, type: "fact" },

  /* ===================== グループ2：小売・消費 ===================== */

  /* ---------- 三越伊勢丹HD（3099） ---------- */

  // https://www.businessinsider.jp/article/212659/
  // https://toyokeizai.net/articles/-/349371
  { date: "2020-05-11", headline: "三越伊勢丹HDの前期決算は111億円の最終赤字。今期の業績予想は公表を見送り",
    body: "店舗の時短営業や臨時休業が響いた。今期の見通しは新型コロナの影響で立たないとした。", codes: ["3099"], importance: 2, type: "fact" },

  /* ---------- 高島屋（8233） ---------- */

  // https://www.sbbit.jp/article/refers/50327
  // https://www.tsr-net.co.jp/data/detail/1190365_1527.html
  { date: "2020-12-25", headline: "高島屋の3〜11月期決算は243億円の最終赤字",
    body: "前年同期は164億円の黒字。臨時休業と訪日客の減少が響いた。", codes: ["8233"], importance: 2, type: "fact" },

  /* ---------- すかいらーくHD（3197） ---------- */

  // https://www2.infomart.co.jp/web/jp/images/upload/744/010120200521420616_8809694.pdf （決算短信）
  { date: "2020-05-21", headline: "すかいらーくHDの1〜3月期決算は営業利益4,000万円（99.3%減）",
    body: "売上収益は867億円（7.6%減）。", codes: ["3197"], importance: 2, type: "fact" },

  // https://www.watch.impress.co.jp/docs/news/1254805.html
  // https://www.businessinsider.jp/post-229612
  { date: "2020-05-26", headline: "すかいらーくHDが、7月1日からグループ全店で深夜営業をやめると発表",
    body: "ガスト、ジョナサン、バーミヤンなど約2,600店で、原則23時30分までの営業にする。", codes: ["3197"], importance: 1, type: "fact" },

  // https://www.sbbit.jp/article/refers/46854
  // https://www.tsr-net.co.jp/data/detail/1190269_1527.html
  { date: "2020-11-12", headline: "すかいらーくHDが今期は150億円の最終赤字になる見通しを発表。約200店を閉店へ",
    body: "閉店は2021年末までに進め、新規出店を差し引くと約120店の減少。雇用は維持するとした。", codes: ["3197"], importance: 2, type: "fact" },

  /* ---------- ニトリHD（9843） ---------- */

  // https://www.sbbit.jp/article/refers/45789
  // https://www.bcnretail.com/market/detail/20201101_197496.html
  { date: "2020-10-29", headline: "ニトリHDが、ホームセンターの島忠に1株5,500円でTOB（株式公開買い付け）を行うと発表",
    body: "島忠には、DCMホールディングスが1株4,200円でTOBを進めていた。", codes: ["9843"], importance: 2, type: "fact" },

  // https://www.sbbit.jp/article/refers/46925
  // https://www.sbbit.jp/article/refers/46927
  { date: "2020-11-13", headline: "島忠が、ニトリHDのTOBに賛同すると表明",
    body: "先に賛同していたDCMホールディングスのTOBより、価格がニトリのほうが高かった。", codes: ["9843"], importance: 2, type: "fact" },

  /* ---------- 神戸物産（3038） ---------- */

  // https://www2.jpx.co.jp/disc/30380/140120201214434521.pdf （会社の開示資料）
  { date: "2020-12-14", headline: "神戸物産が中期経営計画の目標を上方修正",
    body: "10月期は主力の業務スーパー事業が大きく伸び、売上高と各利益が過去最高になったため。", codes: ["3038"], importance: 2, type: "fact" },

  /* ---------- 資生堂（4911） ---------- */

  // https://corp.shiseido.com/jp/ir/pdf/ir20200806_717.pdf （会社の開示資料。5/12 に通期予想を未定にしたことの記載）
  { date: "2020-05-12", headline: "資生堂が、今期の業績予想を「未定」に変更",
    body: "", codes: ["4911"], importance: 2, type: "fact" },

  // https://corp.shiseido.com/jp/ir/pdf/ir20200806_717.pdf （会社の開示資料）
  { date: "2020-08-06", headline: "資生堂の1〜6月期決算は228億円の最終赤字。今期は220億円の最終赤字の見通し",
    body: "売上高は1,909億円（34.4%減）。未定としていた通期予想を改めて示した。", codes: ["4911"], importance: 2, type: "fact" },

  // https://www.sbbit.jp/article/refers/46616
  // https://www.fashionsnap.com/article/2020-11-10/shiseido-202012-03/
  { date: "2020-11-10", headline: "資生堂が今期の最終損益予想を下方修正。赤字幅は220億円から300億円に",
    body: "国内の消費の落ち込みが想定より大きく、欧米での移動制限で市場の回復も遅れた。", codes: ["4911"], importance: 2, type: "fact" },

  /* ===================== グループ3：銀行・証券・通信 ===================== */

  /* ---------- 三菱UFJフィナンシャル・グループ（8306） ---------- */

  // https://www.mufg.jp/dam/pressrelease/2020/pdf/news-20200204-001_ja.pdf （会社の開示資料）
  { date: "2020-02-04", headline: "三菱UFJが前期の純利益目標を9,000億円から7,500億円に下方修正",
    body: "インドネシアのバンクダナモンに関するのれんを一括で償却するため。", codes: ["8306"], importance: 2, type: "fact" },

  // https://www.mufg.jp/dam/pressrelease/2020/pdf/news-20201113-001_ja.pdf （会社の開示資料。5/15 に公表した目標の記載）
  // https://www.sbbit.jp/article/refers/46990
  { date: "2020-05-15", headline: "三菱UFJが前期決算を発表。今期の純利益目標は5,500億円",
    body: "", codes: ["8306"], importance: 2, type: "fact" },

  // https://www.mufg.jp/dam/pressrelease/2020/pdf/news-20201113-001_ja.pdf （会社の開示資料）
  // https://www.sbbit.jp/article/refers/46958
  { date: "2020-11-13", headline: "三菱UFJが今期の純利益目標を5,500億円から6,000億円に上方修正",
    body: "上期の実績が堅調だったため。与信関係費用の見通しは4,500億円から5,000億円に引き上げた。", codes: ["8306"], importance: 2, type: "fact" },

  /* ---------- KDDI（9433） ---------- */

  // https://www.bcnretail.com/market/detail/20201028_196735.html
  // https://www.soumu.go.jp/main_content/000716724.pdf （総務省の資料）
  { date: "2020-10-28", headline: "KDDIが、UQ mobileで月20GB・月額3,980円の新料金プランを発表",
    body: "2021年2月以降に提供する。同じ日にソフトバンクも20GBの新プランを発表した。", codes: ["9433"], importance: 2, type: "fact" },

  /* ---------- Zホールディングス（4689） ---------- */

  // https://www.itmedia.co.jp/news/article/2007/31/1200731139/
  // https://www.businessinsider.jp/article/217700/
  { date: "2020-07-31", headline: "Zホールディングスの4〜6月期決算は営業利益506億円（40.0%増）",
    body: "売上収益は2,738億円（14.8%増）。ZOZOの連結子会社化が寄与し、巣ごもり消費でネット通販も伸びた。", codes: ["4689"], importance: 2, type: "fact" },

  /* ===================== グループ4：情報・通信・電機・ネット ===================== */

  /* ---------- ソフトバンクグループ（9984） ---------- */

  // https://group.softbank/ja-JP/news/press/20200323 （会社の発表。3/13 の自社株買いの記載）
  { date: "2020-03-13", headline: "ソフトバンクグループが5,000億円の自社株買いを発表", body: "", codes: ["9984"], importance: 2, type: "fact" },

  // https://group.softbank/ja-JP/news/press/20200323 （会社の発表）
  // https://gamebiz.jp/news/262818
  { date: "2020-03-23", headline: "ソフトバンクグループが最大4.5兆円の保有資産を売却・資金化し、最大2兆円の自社株買いを行うと発表",
    body: "3月13日発表分と合わせた自社株買いは2.5兆円で、発行済み株式の45%にあたる。負債の削減にも充てる。", codes: ["9984"], importance: 3, type: "fact" },

  // https://www.businessinsider.jp/article/213067/
  // https://www.bcnretail.com/market/detail/20200518_173850.html
  { date: "2020-05-18", headline: "ソフトバンクグループの前期決算は9,616億円の最終赤字",
    body: "", codes: ["9984"], importance: 2, type: "fact" },

  // https://www.bcnretail.com/market/detail/20200914_190742.html
  // https://gendai.media/articles/-/75832
  { date: "2020-09-14", headline: "ソフトバンクグループが、英半導体設計のアームを米エヌビディアに最大400億ドルで売却すると発表",
    body: "現金とエヌビディア株で受け取る。2016年に約320億ドルで買収していた。", codes: ["9984"], importance: 3, type: "fact" },

  /* ---------- ソニー（6758） ---------- */

  // https://www.bcnretail.com/topics_detail9/20200519_173920.html
  // https://www.businessinsider.jp/article/213156/
  { date: "2020-05-19", headline: "ソニーが、上場子会社のソニーフィナンシャルHDを約4,000億円で完全子会社化すると発表",
    body: "1株2,600円でTOBを行う。2021年4月に社名を「ソニーグループ」に変える方針も示した。", codes: ["6758"], importance: 2, type: "fact" },

  // https://www.gamespark.jp/article/2020/09/17/102234.html
  // https://www.famitsu.com/news/202009/17205925.html
  { date: "2020-09-17", headline: "ソニーが、PlayStation 5を11月12日に発売すると発表。通常版は49,980円（税別）",
    body: "デジタル・エディションは39,980円（税別）。予約は9月18日から。", codes: ["6758"], importance: 2, type: "fact" },

  // https://www.sbbit.jp/article/refers/45743
  // https://www.asset-alive.com/news/?mode=show&seq=38868
  { date: "2020-10-28", headline: "ソニーが今期の営業利益予想を6,200億円から7,000億円に上方修正",
    body: "ゲーム分野の営業利益予想を2,400億円から3,000億円に引き上げた。", codes: ["6758"], importance: 2, type: "fact" },

  /* ---------- アドバンテスト（6857） ---------- */

  // https://www.sbbit.jp/article/refers/45785
  // https://www3.advantest.com/ja/investors/ir-library/pdf/J_BIZ_201029_note.pdf （会社の決算説明資料）
  { date: "2020-10-29", headline: "アドバンテストが今期の営業利益予想を450億円から525億円に上方修正",
    body: "4〜9月期の営業利益は309億円（5.9%減）。メモリー向けの試験装置の需要が堅調とみている。", codes: ["6857"], importance: 2, type: "fact" },

  /* ---------- サイバーエージェント（4751） ---------- */

  // https://gamebiz.jp/news/280021
  // https://www.businessinsider.jp/article/223150/
  { date: "2020-10-28", headline: "サイバーエージェントの9月期決算は営業利益338億円（9.9%増）",
    body: "ゲームとネット広告が堅調だった。「ABEMA」の赤字は縮小した。", codes: ["4751"], importance: 2, type: "fact" },

  /* ===================== グループ5：自動車・医薬品・鉄鋼・海運 ===================== */

  /* ---------- トヨタ自動車（7203） ---------- */

  // https://car.watch.impress.co.jp/docs/news/1251884.html
  // https://www.businessinsider.jp/article/212707/
  { date: "2020-05-12", headline: "トヨタ自動車が、今期の営業利益は5,000億円（約80%減）になる見通しを発表",
    body: "新型コロナの影響を織り込んだ。前期の決算と同時に発表した。", codes: ["7203"], importance: 3, type: "fact" },

  // https://www.sbbit.jp/article/refers/46302
  // https://monoist.itmedia.co.jp/mn/articles/2011/09/news036.html
  { date: "2020-11-06", headline: "トヨタ自動車が今期の営業利益予想を5,000億円から1兆3,000億円に上方修正",
    body: "新型コロナで落ち込んだ販売が急回復している。4〜9月期の営業利益は5,199億円。", codes: ["7203"], importance: 3, type: "fact" },

  /* ---------- 中外製薬（4519） ---------- */

  // https://www2.jpx.co.jp/disc/45190/140120200121448495.pdf （会社の開示資料）
  // https://nk.jiho.jp/article/153551
  { date: "2020-01-21", headline: "中外製薬が、1株を3株に分割すると発表",
    body: "効力発生日は7月1日。投資単位あたりの金額を下げて、株を買いやすくするため。", codes: ["4519"], importance: 1, type: "fact" },

  // https://www2.jpx.co.jp/disc/45190/140120200130453218.pdf （決算短信）
  // https://nk.jiho.jp/article/153551
  { date: "2020-01-30", headline: "中外製薬の2019年12月期決算は純利益1,575億円（70.4%増）",
    body: "", codes: ["4519"], importance: 2, type: "fact" },

  // https://nk.jiho.jp/article/150543
  // https://www.yakuji.co.jp/?p=78829
  { date: "2020-04-08", headline: "中外製薬が、関節リウマチなどの薬「アクテムラ」で、重症の新型コロナ肺炎を対象にした国内の臨床試験を行うと発表",
    body: "承認の取得を目指す第3相試験。親会社のロシュは海外で同様の試験を進めている。", codes: ["4519"], importance: 2, type: "fact" },

  /* ---------- 日本製鉄（5401） ---------- */

  // https://monoist.itmedia.co.jp/mn/spv/2002/10/news036.html
  // https://www.city.kure.lg.jp/uploaded/attachment/60589.pdf （呉市の資料）
  { date: "2020-02-07", headline: "日本製鉄が、減損などで約4,900億円の損失を計上する見通しと、呉製鉄所の全設備を休止する計画を発表",
    body: "製造業向けの鉄鋼需要の減少と、原料価格の高止まりが重なった。", codes: ["5401"], importance: 3, type: "fact" },

  /* ===================== 経済・市場（追加） ===================== */

  // https://www.newsweekjapan.jp/articles/-/36005?page=2
  // https://www.businessinsider.jp/article/205394/
  { date: "2020-01-03", headline: "米軍がイラクでイラン革命防衛隊のソレイマニ司令官を殺害したと発表",
    body: "トランプ大統領の命令によるものと米国防総省が説明した。中東情勢の緊張が高まっている。", codes: [], importance: 2, type: "fact" },

  // https://www.jcp.or.jp/akahata/aik19/2020-01-09/2020010901_01_1.html
  // https://www.businessinsider.jp/article/205394/
  { date: "2020-01-08", headline: "イランがイラクの米軍駐留基地に弾道ミサイルを発射",
    body: "ソレイマニ司令官殺害への報復と位置づけた。", codes: [], importance: 2, type: "fact" },

  // https://www.pictet.co.jp/investment-information/market/today/20200116.html
  // https://www.smd-am.co.jp/market/ichikawa/2020/01/irepo200116/
  { date: "2020-01-15", headline: "米中が貿易協議の「第1段階」の合意文書に署名",
    body: "中国は2年間で米国の製品やサービスの購入を約2,000億ドル増やす。米国は一部の追加関税を引き下げる。", codes: [], importance: 2, type: "fact" },

  // https://www.newsweekjapan.jp/articles/-/36600?display=b
  // https://www.dlri.co.jp/pdf/macro/2019/shin200217.pdf
  { date: "2020-02-17", headline: "2019年10〜12月期の実質GDPは年率6.3%減。5四半期ぶりのマイナス",
    body: "消費税率引き上げ後の個人消費の落ち込みや台風が影響した。", codes: [], importance: 2, type: "fact" },

  // https://www.dlri.co.jp/pdf/macro/2019/katsu200316EMFOMC202003.pdf
  // https://www.pictet.co.jp/investment-information/market/today/20200316.html
  { date: "2020-03-03", headline: "米連邦準備制度理事会（FRB）が緊急に0.5%の利下げ",
    body: "定例会合を待たずに決めた。新型コロナの経済への影響に対応する。", codes: [], importance: 2, type: "fact" },

  // https://media.monex.co.jp/articles/-/13864
  // https://www.newsweekjapan.jp/articles/-/37921
  { date: "2020-03-06", headline: "OPECとロシアなどの追加減産の協議がまとまらず",
    body: "ロシアが追加減産案に応じなかった。サウジアラビアは増産の姿勢を示していると伝えられた。", codes: [], importance: 2, type: "fact" },

  // https://www.gaitame.com/media/entry/2020/03/10/101015
  // https://media.monex.co.jp/articles/-/13619
  { date: "2020-03-09", headline: "9日のNYダウは2,013ドル安。取引が一時止まる「サーキットブレーカー」が発動",
    body: "原油価格の急落が重なった。", codes: [], importance: 2, type: "fact" },

  // https://zai.diamond.jp/articles/-/337822?page=2
  // https://toyokeizai.net/articles/-/337525
  { date: "2020-03-12", headline: "12日のNYダウは2,352ドル安。下げ幅は過去最大",
    body: "米国株は取引開始直後に一時取引が止まった。", codes: [], importance: 2, type: "fact" },

  // https://www.pictet.co.jp/investment-information/market/today/20200316.html
  // https://www.jp-toushin.japanpost.jp/news/detail/marketreport20200317.pdf
  { date: "2020-03-15", headline: "FRBが政策金利を1%下げてゼロ金利に。7,000億ドルの国債などの買い入れも決定",
    body: "日銀や欧州中央銀行など6つの中央銀行が、ドルの資金供給を協調して行うことも発表された。", codes: [], importance: 3, type: "fact" },

  // https://gentosha-go.com/articles/-/26079
  // https://www.kabutore.biz/shisu/sisurank.html?sisu=nydaw
  { date: "2020-03-16", headline: "16日のNYダウは2,997ドル安の2万188ドル。下げ幅は過去最大を更新",
    body: "取引開始直後に、取引が一時止まる措置が発動された。", codes: [], importance: 3, type: "fact" },

  // https://www.bloomberg.com/news/articles/2020-03-23/fed-signals-unlimited-qe-adds-aid-for-companies-municipalities
  // https://think.ing.com/snaps/fed-whatever-it-takes
  { date: "2020-03-23", headline: "FRBが国債などの買い入れの上限をなくすと発表",
    body: "企業や自治体の資金繰りを支える新しい仕組みも設けた。", codes: [], importance: 2, type: "fact" },

  // https://www.law360.com/articles/1257839/trump-signs-2t-covid-19-relief-bill-into-law
  // https://bc.edu/content/ccc/regulatory-radar/corporate-citizenship-CARES-act-signed-into-law.html
  { date: "2020-03-27", headline: "米国で約2.2兆ドルの経済対策法が成立",
    body: "個人への現金給付、失業給付の拡充、中小企業への融資などを盛り込んだ。", codes: [], importance: 2, type: "fact" },

  // https://www.smd-am.co.jp/market/daily/marketreport/2020/04/news200402jp/
  // https://www.bk.mufg.jp/report/ecoinf2020/report_jp_20200401.pdf
  { date: "2020-04-01", headline: "日銀短観（3月調査）で、大企業製造業の景況感がマイナス8。7年ぶりのマイナス",
    body: "新型コロナで部品の供給網が乱れた。宿泊・飲食サービスの景況感も大きく悪化した。", codes: [], importance: 2, type: "fact" },

  // https://www.cnn.co.jp/business/35153492.html
  // https://www.pictet.co.jp/investment-information/market/today/202005111.html
  { date: "2020-04-03", headline: "米国の3月の雇用者数は70万1,000人減。失業率は4.4%に上昇", body: "", codes: [], importance: 2, type: "fact" },

  // https://www.moneypost.jp/653299/2/
  // https://www.nri.com/jp/media/column/kiuchi/20201208_2.html
  { date: "2020-04-07", headline: "政府が事業規模約108兆円の緊急経済対策を閣議決定",
    body: "財政支出は39.5兆円。これまでの対策の分も含む。", codes: [], importance: 2, type: "fact" },

  // https://www.newsweekjapan.jp/articles/-/159453
  // https://media.moneyforward.com/articles/4499
  { date: "2020-04-12", headline: "OPECプラスが、5〜6月に日量970万バレルの減産を行うことで合意", body: "", codes: [], importance: 2, type: "fact" },

  // https://www.pictet.co.jp/investment-information/market/today/20200421.html
  // https://www.newsweekjapan.jp/articles/-/38133
  { date: "2020-04-20", headline: "米原油先物（WTI）の5月物が1バレル＝マイナス37.63ドルで取引を終える。マイナスは初めて",
    body: "需要が急減し、原油を保管する場所が足りなくなっている。", codes: [], importance: 3, type: "fact" },

  // https://www.cnn.co.jp/business/35153492.html
  // https://www.smd-am.co.jp/market/daily/marketreport/2020/05/news200511us/
  { date: "2020-05-08", headline: "米国の4月の雇用者数は2,050万人減。失業率は14.7%で戦後最悪",
    body: "雇用者数の減少幅は、統計が始まった1939年以降で最大。", codes: [], importance: 3, type: "fact" },

  // https://www.dir.co.jp/report/research/economics/japan/20200518_021538.html
  // https://www.cnn.co.jp/business/35154000.html
  { date: "2020-05-18", headline: "1〜3月期の実質GDPは年率3.4%減。2四半期連続のマイナス",
    body: "外出の自粛などで個人消費が落ち込み、輸出も減った。", codes: [], importance: 2, type: "fact" },

  // https://www.dlri.co.jp/pdf/macro/2020/kuma200522BOJ.pdf
  // https://www.nri.com/jp/media/column/kiuchi/20200522_3.html
  { date: "2020-05-22", headline: "日銀が臨時会合を開き、中小企業向けの融資を支える新しい資金供給の仕組みを決定",
    body: "金融機関の無利子・無担保融資などを、金利ゼロ%の資金で後押しする。", codes: [], importance: 2, type: "fact" },

  // https://www.nri.com/jp/media/column/kiuchi/20200527_2.html
  // https://www.smd-am.co.jp/market/ichikawa/2020/05/irepo200528/
  { date: "2020-05-27", headline: "政府が一般会計31.9兆円の第2次補正予算案を閣議決定",
    body: "第1次補正と合わせた事業規模は約234兆円。", codes: [], importance: 2, type: "fact" },

  // https://www.afpbb.com/articles/-/3286850
  // https://www.nri.com/jp/media/column/kiuchi/20200608.html
  { date: "2020-06-05", headline: "米国の5月の雇用者数は約250万人増。失業率は13.3%に低下",
    body: "市場では雇用者数の減少が予想されていた。", codes: [], importance: 2, type: "fact" },

  // https://www.smd-am.co.jp/market/daily/marketreport/2020/06/news200611us/
  // https://www.bk.mufg.jp/report/ecostw2020/MUFG-FOCUSUSAJ-W-06-10-2020.pdf
  { date: "2020-06-10", headline: "FRBがゼロ金利を据え置き。参加者の多くは2022年末までゼロ金利が続くと予想",
    body: "", codes: [], importance: 2, type: "fact" },

  // https://www.smd-am.co.jp/market/takumori/explain/2020/202006tankan
  // https://www.murc.jp:443/wp-content/uploads/2020/07/tankan_res_2006.pdf
  { date: "2020-07-01", headline: "日銀短観（6月調査）で、大企業製造業の景況感がマイナス34。前回から26ポイント悪化",
    body: "悪化幅はリーマン・ショック期に次ぐ大きさ。非製造業も2011年以来のマイナスになった。", codes: [], importance: 2, type: "fact" },

  // https://www.nippon.com/ja/japan-data/h00796/
  // https://data-max.co.jp/article/37149
  { date: "2020-08-17", headline: "4〜6月期の実質GDPは年率27.8%減。戦後最大の落ち込み",
    body: "個人消費は前期比8.2%減。外食や旅行などのサービス消費が大きく減った。", codes: [], importance: 3, type: "fact" },

  // https://www.dir.co.jp/report/research/economics/usa/20200828_021730.html
  // https://www.pictet.co.jp/Individual/Report/markets/headline/20200828
  { date: "2020-08-27", headline: "FRBのパウエル議長が、平均で2%の物価上昇を目指す新しい枠組みを表明",
    body: "物価上昇率が2%を下回る期間が続いた後は、2%を超える期間も容認する。", codes: [], importance: 2, type: "fact" },

  // https://media.rakuten-sec.net/articles/-/50199
  // https://www.jpx.co.jp/corporate/news/press-conference/nlsgeu000004zjwb-att/20201001JP.pdf （日本取引所グループの会見資料）
  { date: "2020-10-01", headline: "東京証券取引所でシステム障害。全銘柄の売買を終日停止",
    body: "売買システムの機器の故障が原因。終日止まるのは、取引がシステム化された1999年以降で初めて。", codes: [], importance: 3, type: "fact" },

  // https://www.smd-am.co.jp/market/takumori/explain/2020/202009tankan/
  // https://www.dlri.co.jp/pdf/macro/2020/kuma200914ET.pdf
  { date: "2020-10-01", headline: "日銀短観（9月調査）で、大企業製造業の景況感がマイナス27。11期ぶりに改善", body: "", codes: [], importance: 2, type: "fact" },

  // https://www.sbbit.jp/article/refers/47035
  // https://www.dir.co.jp/report/research/economics/japan/20201116_021896.html
  { date: "2020-11-16", headline: "7〜9月期の実質GDPは年率21.4%増。4四半期ぶりのプラス",
    body: "伸び率は比較できる1980年以降で最大。緊急事態宣言の解除や特別定額給付金で個人消費が増えた。", codes: [], importance: 3, type: "fact" },

  // https://www.cnn.co.jp/business/35162881.html
  // https://www.sbbit.jp/article/refers/47744
  { date: "2020-11-24", headline: "NYダウが史上初めて3万ドル台で取引を終える",
    body: "バイデン次期大統領への政権移行の手続きが始まり、政治の先行きの不透明感が和らいだ。", codes: [], importance: 2, type: "fact" },

  // https://www.nri.com/jp/media/column/kiuchi/20201208_2.html
  // https://www.kansaidoyukai.or.jp/wp-content/uploads/2020/12/74f26a2b0842ae30914d08dc537d268f.pdf
  { date: "2020-12-08", headline: "政府が事業規模73.6兆円の追加経済対策を閣議決定",
    body: "財政支出は約40兆円。感染拡大の防止策や、経済構造の転換に向けた投資などを盛り込んだ。", codes: [], importance: 2, type: "fact" },

  // https://www.smd-am.co.jp/market/takumori/explain/2020/202012tankan/
  // https://www.bk.mufg.jp/report/ecoinf2020/report_jp_20201214.pdf
  { date: "2020-12-14", headline: "日銀短観（12月調査）で、大企業製造業の景況感がマイナス10。前回から17ポイント改善", body: "", codes: [], importance: 2, type: "fact" },

  // https://www.boj.or.jp/mopo/mpmdeci/state_2020/k201218a.htm （日銀の公表文）
  // https://www.sbbit.jp/article/refers/49667
  { date: "2020-12-18", headline: "日銀が企業の資金繰り支援策の期限を2021年9月末まで半年延長。緩和策の点検も決定",
    body: "点検の結果は2021年3月の会合をめどに公表する。", codes: [], importance: 2, type: "fact" },

  // https://www.cnn.co.jp/usa/35164243.html
  // https://www.jetro.go.jp/biznews/2020/12/ffa66267abc2dd4a.html
  { date: "2020-12-21", headline: "米議会が約9,000億ドルの追加の新型コロナ経済対策を可決",
    body: "1人600ドルの現金給付や、失業給付の上乗せを盛り込んだ。", codes: [], importance: 2, type: "fact" },

  // https://www.sbbit.jp/article/refers/50371
  // https://indexes.nikkei.co.jp/atoz/2021/01/202012.html
  { date: "2020-12-29", headline: "29日の日経平均は714円高の2万7,568円。1990年8月以来の高い水準", body: "", codes: [], importance: 2, type: "fact" },

  /* ===================== 感染症・政策（追加） ===================== */

  // https://www.jprime.jp/articles/-/18244
  // https://www.pref.miyazaki.lg.jp/documents/50429/50429_20200419102206-1.pdf （宮崎県の資料の年表）
  { date: "2020-01-16", headline: "国内で初めて新型コロナウイルスの感染者を確認",
    body: "中国・武漢市に滞在していた神奈川県在住の人。厚生労働省が発表した。", codes: [], importance: 2, type: "fact" },

  // https://www.jprime.jp/articles/-/18244
  // https://emr.gecer.mie-u.ac.jp/2020/wp-content/uploads/2020/10/emr-c02-4_chronology.pdf
  { date: "2020-01-23", headline: "中国が感染拡大を防ぐため武漢市を封鎖", body: "", codes: [], importance: 2, type: "fact" },

  // https://www.afpbb.com/articles/amp/3266170
  // https://www.cnn.co.jp/usa/35150719.html
  { date: "2020-01-31", headline: "米国が、過去2週間に中国に滞在した外国人の入国を一時禁止すると発表",
    body: "米政府は公衆衛生上の緊急事態も宣言した。", codes: [], importance: 2, type: "fact" },

  // https://www.mhlw.go.jp/stf/newpage_09276.html （厚生労働省の発表）
  // https://www.daily.co.jp/gossip/2020/02/06/0013093165.shtml
  { date: "2020-02-05", headline: "横浜港のクルーズ船で10人の感染を確認。乗客は原則14日間、船内で待機",
    body: "乗客・乗員は約3,700人。", codes: [], importance: 2, type: "fact" },

  // https://president.jp/articles/-/33248
  // https://www.businessinsider.jp/article/208526/
  { date: "2020-02-26", headline: "安倍首相が、全国的なスポーツ・文化イベントの2週間の中止・延期・縮小を要請", body: "", codes: [], importance: 2, type: "fact" },

  // https://www.businessinsider.jp/article/208526/
  // https://president.jp/articles/-/33549
  { date: "2020-02-27", headline: "安倍首相が、全国の小中高校などに3月2日から春休みまでの臨時休校を要請", body: "", codes: [], importance: 3, type: "fact" },

  // https://www.aviationwire.jp/?p=197434
  // https://www.travelvoice.jp/20200305-145608
  { date: "2020-03-05", headline: "政府が中国・韓国からの入国者に、指定場所での14日間の待機を求めると発表",
    body: "発給済みのビザの効力も停止し、到着空港は成田と関西に限る。3月9日から。", codes: [], importance: 2, type: "fact" },

  // https://www.cnn.co.jp/usa/35150719.html
  // https://www.afpbb.com/articles/-/3272924
  { date: "2020-03-11", headline: "トランプ米大統領が、英国を除く欧州からの入国を30日間停止すると発表",
    body: "米国民などは対象外。13日から実施する。", codes: [], importance: 2, type: "fact" },

  // https://www.businessinsider.jp/article/209417/
  // https://www.nri.com/jp/media/column/kiuchi/20200317.html
  { date: "2020-03-13", headline: "改正特別措置法が成立。新型コロナで首相が緊急事態を宣言できるように",
    body: "14日に施行。宣言が出ると、知事は外出自粛や休校などを要請できる。", codes: [], importance: 2, type: "fact" },

  // https://www.newsweekjapan.jp/articles/-/37110
  // https://www.gizmodo.jp/article/trumps-covid-19-speech-was-full-of-lies/
  { date: "2020-03-13", headline: "トランプ米大統領が国家非常事態を宣言",
    body: "連邦政府の約500億ドルの資金を対策に使えるようになる。", codes: [], importance: 2, type: "fact" },

  // https://honichi.com/news/2020/03/25/tokyocovid19/
  // https://www.newsweekjapan.jp/articles/-/37441
  { date: "2020-03-25", headline: "東京都の小池知事が、週末の不要不急の外出を控えるよう都民に要請",
    body: "都内の1日の感染確認は41人で、それまでで最多。", codes: [], importance: 2, type: "fact" },

  // https://www.ryutsuu.biz/government/m040249.html
  // https://www.cnn.co.jp/world/35151843.html
  { date: "2020-04-01", headline: "安倍首相が、全世帯に布マスクを2枚ずつ配る方針を表明", body: "", codes: [], importance: 1, type: "fact" },

  // https://www.cnn.co.jp/world/35159796.html
  // https://scienceportal.jst.go.jp/newsflash/20200331_02/
  { date: "2020-04-02", headline: "世界の新型コロナの感染者が100万人を超える（米ジョンズ・ホプキンス大学の集計）", body: "", codes: [], importance: 2, type: "fact" },

  // https://www.newsweekjapan.jp/articles/-/38011
  // https://www.jcp.or.jp/akahata/aik20/2020-04-16/2020041601_01_1.html
  { date: "2020-04-16", headline: "安倍首相が、全国民に1人10万円を一律に給付する方向で検討すると表明",
    body: "所得の減った世帯に30万円を給付する当初の案を改める。", codes: [], importance: 2, type: "fact" },

  // https://www.nippon.com/ja/japan-data/h00724/
  // https://www.businessinsider.jp/article/212859/
  { date: "2020-05-04", headline: "政府が緊急事態宣言を5月31日まで延長。対象は全国のまま", body: "", codes: [], importance: 2, type: "fact" },

  // https://www.nippon.com/ja/japan-data/h00724/
  // https://honichi.com/news/2020/05/13/coronavirusprefdiff/
  { date: "2020-05-14", headline: "政府が39県で緊急事態宣言を解除",
    body: "北海道・東京・神奈川・千葉・埼玉・大阪・兵庫・京都の8都道府県は継続。", codes: [], importance: 2, type: "fact" },

  // https://www.businessinsider.jp/article/214071/
  // https://www.timeout.jp/tokyo/ja/ニュース/東京都で再び感染者が急増-東京アラート-発令へ-060320
  { date: "2020-06-02", headline: "東京都が、感染の再拡大を警戒する「東京アラート」を初めて出す",
    body: "都内の新規感染は34人。都庁とレインボーブリッジを赤くライトアップした。", codes: [], importance: 1, type: "fact" },

  // https://honichi.com/news/2020/06/19/movebeyondpref
  // https://travel.watch.impress.co.jp/docs/news/1260042.html
  { date: "2020-06-18", headline: "安倍首相が、19日から都道府県をまたぐ移動の自粛を全面的に解除すると表明", body: "", codes: [], importance: 2, type: "fact" },

  // https://www.mhlw.go.jp/content/000646563.pdf （厚生労働省の資料）
  // https://honichi.com/news/2020/06/19/movebeyondpref
  { date: "2020-06-19", headline: "厚生労働省が、感染者との接触を知らせるスマートフォン用アプリ「COCOA」を公開", body: "", codes: [], importance: 1, type: "fact" },

  // https://scienceportal.jst.go.jp/newsflash/20200629_01/
  // https://www.kobe-np.co.jp/news/sougou/202006/sp/0013464199.shtml?pg=amp
  { date: "2020-06-28", headline: "世界の新型コロナの感染者が1,000万人を超える", body: "", codes: [], importance: 2, type: "fact" },

  // https://www.businessinsider.jp/article/221220/
  // https://www.j-cast.com/2020/09/11394151.html?p=all
  { date: "2020-07-22", headline: "観光支援策「Go To トラベル」が始まる。東京都発着の旅行は対象外",
    body: "宿泊は1人1泊あたり2万円相当まで支援する。", codes: [], importance: 2, type: "fact" },

  // https://www.j-cast.com/kaisha/2020/11/18399186.html
  // https://www.nippon.com/ja/japan-data/h00870
  { date: "2020-07-29", headline: "国内の1日の新規感染者が初めて1,000人を超える", body: "", codes: [], importance: 2, type: "fact" },

  // https://honichi.com/news/2020/09/11/gototokyo
  // https://www.j-cast.com/2020/09/11394151.html?p=all
  { date: "2020-09-11", headline: "赤羽国土交通相が、10月1日から東京都発着の旅行も「Go To トラベル」の対象にすると表明",
    body: "都内の新規感染者が減少傾向にあるため。", codes: [], importance: 2, type: "fact" },

  // https://www.jmedj.co.jp/journal/paper/detail.php?id=15910
  // https://www.carenet.com/news/general/carenet/51195
  { date: "2020-11-16", headline: "米モデルナが、開発中の新型コロナワクチンで94.5%の有効性が示されたと発表",
    body: "最終段階の臨床試験の中間解析の結果。", codes: [], importance: 2, type: "fact" },

  // https://www.j-cast.com/kaisha/2020/11/18399186.html
  // https://www.nippon.com/ja/japan-data/h00934/
  { date: "2020-11-18", headline: "国内の1日の新規感染者が初めて2,000人を超える。過去最多", body: "", codes: [], importance: 2, type: "fact" },

  // https://www.cnn.co.jp/world/35163546.html
  // https://www.afpbb.com/articles/amp/3320250
  { date: "2020-12-08", headline: "英国で新型コロナワクチンの接種が始まる",
    body: "米ファイザーなどが開発したワクチン。最終段階の臨床試験を経たワクチンの接種は世界で初めて。", codes: [], importance: 2, type: "fact" },

  // https://www.afpbb.com/articles/amp/3321315
  // https://www.newsweekjapan.jp/articles/-/41728
  { date: "2020-12-14", headline: "米国で新型コロナワクチンの接種が始まる",
    body: "まず医療従事者や介護施設の入所者に接種する。", codes: [], importance: 2, type: "fact" },

  // https://www.travelvoice.jp/20201227-147850
  // https://www.aviationwire.jp/?p=218010
  { date: "2020-12-26", headline: "政府が、全ての国・地域からの外国人の新規入国を12月28日から1月末まで止めると発表",
    body: "英国で広がる変異ウイルスの流入を防ぐため。", codes: [], importance: 2, type: "fact" },

  // https://www.mhlw.go.jp/stf/newpage_15819.html （厚生労働省の発表）
  { date: "2020-12-28", headline: "厚生労働省が、空港の検疫で英国や南アフリカで報告された変異ウイルスの感染者を確認したと発表", body: "", codes: [], importance: 2, type: "fact" },

  /* ===================== 暮らし・スポーツ・天気・災害 ===================== */

  // https://www.inter-edu.com/article/?p=23400
  // https://allabout.co.jp/gm/gc/67788/
  { date: "2020-01-19", headline: "最後の大学入試センター試験が終わる。2021年からは大学入学共通テストに",
    body: "1990年から31回続いた。", codes: [], importance: 1, type: "fact" },

  // https://www.daily.co.jp/gossip/2020/02/18/0013125352.shtml
  // https://www.bcnretail.com/market/detail/20200217_158560.html
  { date: "2020-02-17", headline: "東京マラソンが一般参加を取りやめ、エリート選手だけで行うと発表",
    body: "一般参加の中止は大会史上初めて。約3万8,000人が対象。", codes: [], importance: 1, type: "fact" },

  // https://www.bcnretail.com/market/detail/20200311_161796.html
  // https://number.bunshun.jp/articles/-/842980
  { date: "2020-03-11", headline: "春の選抜高校野球大会の中止が決定。中止は史上初めて", body: "", codes: [], importance: 1, type: "fact" },

  // https://jp.weathernews.com/wp-content/uploads/2020/03/20200317.pdf
  // https://www.data.jma.go.jp/tokyo/shosai/news/pdf/2023/sakurakaika2023.pdf （気象庁の資料）
  { date: "2020-03-14", headline: "東京で桜（ソメイヨシノ）が開花。統計開始以来、最も早い", body: "", codes: [], importance: 1, type: "fact" },

  // https://www.daily.co.jp/baseball/2020/05/21/0013358626.shtml
  // https://times.abema.tv/articles/-/7054681
  { date: "2020-05-20", headline: "夏の全国高校野球選手権大会と地方大会の中止が決定。戦後初めて",
    body: "春夏連続の中止は史上初めて。", codes: [], importance: 1, type: "fact" },

  // https://npb.jp/news/detail/20200525_01.html （日本野球機構の発表）
  // https://www.daily.co.jp/baseball/2020/05/25/0013369911.shtml
  { date: "2020-05-25", headline: "プロ野球が6月19日に無観客で開幕すると決定",
    body: "当初の予定より約3か月遅れ。試合数は143から120に減らす。", codes: [], importance: 1, type: "fact" },

  // https://www.nippon.com/ja/japan-data/h00751/
  // https://www.daily.co.jp/baseball/2020/05/25/0013369911.shtml
  { date: "2020-06-19", headline: "プロ野球が無観客で開幕", body: "", codes: [], importance: 1, type: "fact" },

  // https://eetimes.itmedia.co.jp/ee/articles/2006/23/news074.html
  // https://news.mynavi.jp/article/20200623-1062874/
  { date: "2020-06-22", headline: "スーパーコンピューター「富岳」が計算速度の世界ランキングで1位に",
    body: "日本のスパコンの1位は9年ぶり。ほかの3部門でも1位になった。", codes: [], importance: 1, type: "fact" },

  // https://www.city.hiroshima.lg.jp/site/recycle/155686.html （広島市の案内）
  // https://www.pref.wakayama.lg.jp/prefg/031800/no_plasticbag.html （和歌山県の案内）
  { date: "2020-06-30", headline: "7月1日から全国の小売店でレジ袋が有料に", body: "プラスチックごみの削減のため。", codes: [], importance: 1, type: "fact" },

  // https://www.fdma.go.jp/relocation/e-college/cat63/cat38/cat27/127.html （消防庁の資料）
  // https://www.pref.kumamoto.jp/soshiki/7/50924.html （熊本県の資料）
  { date: "2020-07-04", headline: "熊本県と鹿児島県に大雨特別警報。熊本県の球磨川が氾濫",
    body: "線状降水帯による記録的な大雨。気象庁は最大級の警戒を呼びかけた。", codes: [], importance: 2, type: "fact" },

  // https://seijiyama.jp/article/news/el20200706-1.html
  // https://www.businessinsider.jp/article/216036/
  { date: "2020-07-05", headline: "東京都知事選で現職の小池百合子氏が再選", body: "投票率は55.00%。", codes: [], importance: 1, type: "fact" },

  // https://www.data.jma.go.jp/fcd/yoho/data/hibiten/2020/202007.pdf （気象庁の資料）
  // https://www.pref.gifu.lg.jp/uploaded/attachment/203323.pdf （岐阜県の資料）
  { date: "2020-07-08", headline: "岐阜県と長野県に大雨特別警報",
    body: "気象庁は一連の大雨を「令和2年7月豪雨」と名付けた。", codes: [], importance: 2, type: "fact" },

  // https://www.kanaloco.jp/news/social/article-268247.html
  // https://www.nikkan-gendai.com/articles/view/sports/280771
  { date: "2020-07-10", headline: "プロスポーツなどのイベントで観客の受け入れが始まる。上限は5,000人", body: "", codes: [], importance: 1, type: "fact" },

  // https://www.kobe-np.co.jp/news/sougou/202007/sp/0013516653.shtml?pg=amp
  // https://www.nippon.com/ja/japan-topics/g00897/
  { date: "2020-07-16", headline: "将棋の藤井聡太七段が棋聖のタイトルを獲得。17歳で史上最年少のタイトル保持者に", body: "", codes: [], importance: 1, type: "fact" },

  // https://www.data.jma.go.jp/obd/stats/data/stat/tenko2020jja_besshi.pdf （気象庁の資料）
  { date: "2020-08-01", headline: "関東甲信と東海が梅雨明け。平年より11日遅い",
    body: "7月は梅雨前線の影響で、東日本・西日本の各地で長く大雨が続いた。", codes: [], importance: 1, type: "fact" },

  // https://www.nippon.com/ja/japan-data/h00792/
  // https://www.city.hamamatsu.shizuoka.jp/documents/168252/0901.pdf （浜松市の資料）
  { date: "2020-08-17", headline: "静岡県浜松市で41.1度を観測。国内の観測史上最高に並ぶ", body: "", codes: [], importance: 1, type: "fact" },

  // https://gigazine.net/news/20200820-souta-fujii-oui
  // https://www.jprime.jp/articles/-/34528
  { date: "2020-08-20", headline: "藤井聡太棋聖が王位も獲得。18歳1か月で史上最年少の二冠", body: "", codes: [], importance: 1, type: "fact" },

  // https://www.watch.impress.co.jp/docs/news/1274486.html
  // https://www.qsr.mlit.go.jp/press_release/r2/bousai2020090402.html （九州地方整備局の発表）
  { date: "2020-09-04", headline: "気象庁が、台風10号が特別警報級の勢力で6〜7日に九州・沖縄に近づくおそれがあると発表",
    body: "大雨・暴風・高潮などへの最大級の警戒と、早めの避難の検討を呼びかけた。", codes: [], importance: 2, type: "fact" },

  // https://www.data.jma.go.jp/obd/stats/data/bosai/report/2020/20200910/jyun_sokuji20200904-0907.pdf （気象庁の資料）
  // https://www.meti.go.jp/shingikai/enecho/denryoku_gas/denryoku_gas/resilience_wg/pdf/012_03_00.pdf （経済産業省の資料）
  { date: "2020-09-07", headline: "台風10号が九州の西を北上。長崎市野母崎で最大瞬間風速59.4メートルを観測",
    body: "九州を中心に広い範囲で停電した。", codes: [], importance: 2, type: "fact" },

  // https://www.arabnews.jp/article/japan/article_22265/
  // https://npb.jp/m/news/detail/20200912_01.html （日本野球機構の発表）
  { date: "2020-09-11", headline: "政府の分科会が、19日から大規模イベントの観客の上限を収容定員の50%まで広げる案を了承", body: "", codes: [], importance: 1, type: "fact" },

  // https://www.daily.co.jp/gossip/2020/10/27/0013815832.shtml
  // https://eiga.com/news/20201029/8/
  { date: "2020-10-26", headline: "映画「劇場版『鬼滅の刃』無限列車編」の興行収入が公開10日間で100億円を超える。史上最速",
    body: "これまでの最速は「千と千尋の神隠し」の公開25日目だった。", codes: [], importance: 1, type: "fact" },

  // https://www.businessinsider.jp/article/223361/
  // https://gendai.media/articles/-/73914
  { date: "2020-11-01", headline: "「大阪都構想」の住民投票で反対が多数",
    body: "反対50.63%、賛成49.37%。大阪市は存続する。", codes: [], importance: 1, type: "fact" },

  // https://www.daily.co.jp/gossip/2020/12/01/0013905656.shtml
  // https://www.oricon.co.jp/news/2178158/full/
  { date: "2020-12-01", headline: "新語・流行語大賞の年間大賞に「3密」", body: "", codes: [], importance: 1, type: "fact" },

  // https://www.isas.jaxa.jp/topics/002401.html （JAXAの発表）
  // https://scienceportal.jst.go.jp/stories/20201207_g01/
  { date: "2020-12-06", headline: "探査機「はやぶさ2」のカプセルをオーストラリアで回収",
    body: "小惑星リュウグウの試料が入っていれば、小惑星の試料の持ち帰りは初代「はやぶさ」に続いて2度目。", codes: [], importance: 1, type: "fact" },

  // https://www.fdma.go.jp/publication/hakusho/r3/topics1/63935.html （消防白書）
  // https://trafficnews.jp/post/103029
  { date: "2020-12-17", headline: "大雪で関越自動車道に多くの車が立ち往生",
    body: "新潟県と群馬県の県境付近。自衛隊が災害派遣され、除雪や物資の支援にあたった。", codes: [], importance: 1, type: "fact" },

  /* ===================== 業界ニュース ===================== */

  // https://www.soumu.go.jp/johotsusintokei/whitepaper/ja/r02/html/nd112310.html （総務省の白書）
  // https://www.gizmodo.jp/2020/03/docomo-5g-hodai.html
  { date: "2020-03-25", headline: "国内で第5世代移動通信（5G）の商用サービスが始まる",
    body: "携帯大手3社が3月中に相次いで開始する。", codes: [], importance: 1, type: "fact" },

  // https://www.bcnretail.com/market/detail/20200512_172995.html
  // https://www.jreast.co.jp/sendai/upload-images/2020/05/20200507.pdf （JR東日本の資料）
  { date: "2020-05-12", headline: "大型連休中の新幹線などの利用者は、JR各社で前年より9割以上減少", body: "", codes: [], importance: 2, type: "fact" },

  // https://www.jetro.go.jp/biznews/2020/05/53b8c315344725c7.html
  // https://president.jp/articles/-/36128
  { date: "2020-05-15", headline: "米商務省が中国ファーウェイへの輸出規制を強化。米国の技術を使った海外製の半導体も対象に", body: "", codes: [], importance: 2, type: "fact" },

  // https://www.travelvoice.jp/20200520-146210
  // https://www.aviationwire.jp/?p=202805
  { date: "2020-05-20", headline: "4月の訪日外国人は2,900人。前年同月比99.9%減で統計開始以来最少",
    body: "日本政府観光局の推計。統計は1964年から。", codes: [], importance: 2, type: "fact" },

  // https://media.moneyforward.com/articles/5574
  // https://media.monex.co.jp/articles/-/15547
  { date: "2020-05-20", headline: "地方銀行やバス会社の統合を独占禁止法の対象外にする特例法が成立",
    body: "10年間の時限措置。金融庁などが統合計画を審査する。", codes: [], importance: 1, type: "fact" },

  // https://www.super.or.jp/wp/wp-content/uploads/2020/05/tokei-20200521hhc.pdf （スーパーマーケット3団体の資料）
  // https://www.tsr-net.co.jp/data/detail/1189877_1527.html
  { date: "2020-05-21", headline: "4月のスーパーの既存店売上高は前年同月比10.7%増。調査開始以来最大の伸び",
    body: "外出の自粛で、家で食べるための食品がよく売れた。", codes: [], importance: 1, type: "fact" },

  // https://www.depart.or.jp/store_sale/files/2020.04zenkokup.pdf （日本百貨店協会の資料）
  // https://yamatogokoro.jp/inboundnews/pickup/38543/
  { date: "2020-05-22", headline: "4月の全国百貨店売上高は前年同月比72.8%減。1965年の統計開始以来最大の減少",
    body: "多くの店舗が臨時休業した。", codes: [], importance: 2, type: "fact" },

  // https://news.nissyoku.co.jp/news/okayasu20200526082813058
  // https://www.meti.go.jp/statistics/toppage/report/minikeizai/pdf/h2amini140j.pdf （経済産業省の資料）
  { date: "2020-05-26", headline: "4月の外食産業の売上高は前年同月比39.6%減。過去最大の落ち込み",
    body: "休業や営業時間の短縮が広がった。", codes: [], importance: 2, type: "fact" },

  // https://www.newsweekjapan.jp/headlines/business/2020/05/277824.php
  // https://monoist.itmedia.co.jp/mn/spv/2006/25/news053.html
  { date: "2020-05-28", headline: "自動車大手8社の4月の世界生産は前年同月比60.5%減",
    body: "北米などの工場が止まった。国内生産は46.7%減。", codes: [], importance: 2, type: "fact" },

  // https://newswitch.jp/p/22472
  // https://www.newsweekjapan.jp/articles/-/159214
  { date: "2020-06-01", headline: "5月の新車販売台数は前年同月比44.9%減。5月としては過去最低",
    body: "軽自動車は52.7%減で、統計開始以来最大の減少率。", codes: [], importance: 2, type: "fact" },

  // https://www.seaj.or.jp/file/july2020forecast_press_japanese.pdf （日本半導体製造装置協会の資料）
  { date: "2020-07-02", headline: "日本半導体製造装置協会が、2020年度の日本製半導体製造装置の販売高を7.0%増の2兆2,181億円と予測",
    body: "データセンター向けの需要が強く、年度後半からはメモリー向けの投資の回復を見込む。", codes: [], importance: 1, type: "fact" },

  // https://www.nikkan.co.jp/articles/view/00565586
  // https://www.newsweekjapan.jp/articles/-/159283
  { date: "2020-07-22", headline: "6月の国内の粗鋼生産量は前年同月比36.3%減",
    body: "自動車向けなどの需要が落ち込み、休止する高炉が相次いだ。", codes: [], importance: 1, type: "fact" },

  // https://www.jetro.go.jp/biznews/2020/08/db11f70ed90e7875.html
  // https://search.sbisec.co.jp/v2/popwin/info/fund/report/fund_shiryou200929_07.pdf
  { date: "2020-08-17", headline: "米商務省がファーウェイへの輸出規制をさらに強化。米国の技術を使った半導体全般が対象に", body: "", codes: [], importance: 2, type: "fact" },

  // https://env.go.jp/content/000046063.pdf （環境省の資料。所信表明演説の抜粋）
  // https://greens.gr.jp/uploads/2020/10/ronsetsu20201029.pdf
  { date: "2020-10-26", headline: "菅首相が所信表明演説で、2050年までに温室効果ガスの排出を実質ゼロにすると宣言", body: "", codes: [], importance: 2, type: "fact" },

  // https://iphone-mania.jp/news-325085/
  // https://news.mynavi.jp/article/mobile_business-78/
  { date: "2020-10-27", headline: "総務省が、携帯電話の乗り換えをしやすくし料金の競争を促す「アクション・プラン」を公表",
    body: "乗り換え手数料の原則無料化などを盛り込んだ。", codes: [], importance: 2, type: "fact" },

  // https://media.monex.co.jp/articles/-/15531
  // https://www.timeout.jp/tokyo/ja/ニュース/営業は22時まで-東京都が飲食店とカラオケに時間短縮を再要請-112520
  { date: "2020-11-25", headline: "東京都が、酒類を出す飲食店などに11月28日から午後10時までの時短営業を要請",
    body: "期間は12月17日まで。全期間応じた事業者には協力金40万円を支給する。", codes: [], importance: 2, type: "fact" },

  // https://eetimes.itmedia.co.jp/ee/spv/2012/04/news025.html
  // https://www.eenewseurope.com/en/semiconductor-market-predicted-to-rebound-next-year/
  { date: "2020-12-01", headline: "世界半導体市場統計（WSTS）が、2020年の世界の半導体市場を5.1%増、2021年を8.4%増と予測", body: "", codes: [], importance: 1, type: "fact" },

  // https://www.businessinsider.jp/article/225452/
  // https://www.bcnretail.com/topics_detail8/20201203_202594.html
  { date: "2020-12-03", headline: "NTTドコモが、月20GBで月額2,980円（税別）の新料金プラン「ahamo」を発表",
    body: "2021年3月に提供を始める。KDDIやソフトバンクが10月に出した20GBプランより安い。", codes: [], importance: 2, type: "fact" },

  // https://sp.m.jiji.com/english/show/9414
  // https://bestcarweb.jp/?p=231925
  { date: "2020-12-25", headline: "政府が「グリーン成長戦略」を公表。2030年代半ばまでに乗用車の新車販売を電動車だけにする目標",
    body: "洋上風力や水素など重点14分野の工程表をつくった。", codes: [], importance: 2, type: "fact" },

  /* ===================== 企業ニュース（追加） ===================== */

  // https://autoc-one.jp/news/5005928/
  // https://zaikei.co.jp/article/20200108/547519.html
  { date: "2020-01-06", headline: "トヨタ自動車が、静岡県裾野市の工場跡地に実証実験の街「Woven City」をつくると発表",
    body: "米国の展示会「CES」で発表した。自動運転やロボット、AIなどを試す。2021年初めに着工する予定。", codes: ["7203"], importance: 1, type: "fact" },

  // https://www2.jpx.co.jp/disc/30990/140120200407490836.pdf （会社の開示資料）
  // https://netshop.impress.co.jp/node/7481
  { date: "2020-04-07", headline: "三越伊勢丹HDが、首都圏の百貨店6店などを8日から臨時休業すると発表",
    body: "緊急事態宣言が解除されるまで。食品売り場も休む。", codes: ["3099"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/47510/140120200421497084.pdf （決算短信）
  // https://gamebiz.jp/news/265497
  { date: "2020-04-22", headline: "サイバーエージェントの10〜3月期決算は営業利益124億円（45.3%増）",
    body: "ネット広告とゲームが伸びた。通期の営業利益予想は280億〜320億円のまま。", codes: ["4751"], importance: 2, type: "fact" },

  // https://www.nipponsteel.com/ir/library/pdf/20200508_300.pdf （決算短信）
  // https://monoist.itmedia.co.jp/mn/articles/2005/11/news049.html
  { date: "2020-05-08", headline: "日本製鉄の前期決算は4,315億円の最終赤字",
    body: "2月に見込んだ設備の減損損失などを計上した。", codes: ["5401"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/24130/140120200514415166.pdf （決算短信）
  { date: "2020-05-14", headline: "エムスリーの前期決算は税引前利益346億円で、前の期の309億円から増加",
    body: "売上収益は1,310億円。", codes: ["2413"], importance: 2, type: "fact" },

  // https://news.kddi.com/kddi/corporate/english/ir-news/2020/07/31/4565.html （会社の発表）
  { date: "2020-07-31", headline: "KDDIの4〜6月期決算は営業利益2,907億円（13.7%増）", body: "", codes: ["9433"], importance: 2, type: "fact" },

  /* ===================== 企業ニュース：追加18社（ランク7のあとに始めた「コロナショック」だけに出る銘柄） ===================== */
  // 決算の数字は会社の決算短信・開示資料のとおり。純利益は親会社株主（所有者）に帰属する利益

  // https://www2.jpx.co.jp/disc/67400/140120200326485215.pdf （会社の開示資料）
  // https://www2.jpx.co.jp/disc/67400/140120200131455325.pdf （会社の開示資料）
  { date: "2020-03-26", headline: "ジャパンディスプレイに、いちごトラストから優先株の払い込み（504億円）。いちごが筆頭株主に",
    body: "INCJ（旧産業革新機構）からの借り換えも同じ日に終えた。", codes: ["6740"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/67400/140120200413493325.pdf （会社の開示資料）
  // https://www2.jpx.co.jp/disc/67400/140120200413493294.pdf （会社の開示資料）
  { date: "2020-04-14", headline: "ジャパンディスプレイが、遅れていた4〜12月期の四半期報告書を提出。不適切な会計処理を受けて過去の決算を訂正",
    body: "元従業員の通知をきっかけに、外部の専門家を含む委員会が調べていた。", codes: ["6740"], importance: 2, type: "fact" },

  // https://monoist.itmedia.co.jp/mn/articles/2008/31/news053.html
  // https://www.newsweekjapan.jp/articles/-/40175
  { date: "2020-08-28", headline: "ジャパンディスプレイが、生産を止めていた白山工場（石川県）をシャープに譲渡すると発表",
    body: "土地・建物などの譲渡額は約412億円。売却で得たお金は、大口顧客からの前受金の返済に充てる。", codes: ["6740"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/33150/140120200502404449.pdf （決算短信）
  // https://www2.jpx.co.jp/disc/33150/140120201104415221.pdf （決算短信）
  { date: "2020-05-22", headline: "日本コークス工業の3月期決算は、売上高が11.4%減の1,074億円、純利益は99.1%減の2,800万円",
    body: "営業利益は75.9%減の16億円。年間配当は1円（前の期は3円）。", codes: ["3315"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/39940/140120200114446293.pdf （決算短信）
  // https://www2.infomart.co.jp/web/jp/images/upload/645/010120200114446293_8249114.pdf
  { date: "2020-01-14", headline: "マネーフォワードの11月期決算は、売上高が55.8%増の71億円、純損失は25億円",
    body: "前の期の純損失は8億円。", codes: ["3994"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/39940/140120200122449198.pdf （会社の開示資料）
  // https://www2.jpx.co.jp/disc/39940/140120200122449194.pdf （会社の開示資料）
  { date: "2020-01-22", headline: "マネーフォワードが、海外の投資家向けに110万株の新株を発行すると発表",
    body: "手取りは約46億円の見込み。スマートキャンプの買収や、インドネシアの会社への出資に使う。", codes: ["3994"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/29140/140120200205458256.pdf （決算短信）
  // https://www2.jpx.co.jp/disc/29140/140120200428401137.pdf （決算短信）
  { date: "2020-02-06", headline: "日本たばこ産業（JT）の12月期決算は、売上収益が1.8%減の2兆1,756億円、純利益は9.7%減の3,482億円",
    body: "年間配当は154円（前の期は150円）。今期も154円を予定する。", codes: ["2914"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/29140/140120200428401137.pdf （決算短信）
  // https://www2.jpx.co.jp/disc/29140/140120201028410029.pdf （決算短信）
  { date: "2020-04-30", headline: "JTの1〜3月期は、営業利益が29.4%減の1,290億円、純利益は28.5%減の864億円",
    body: "売上収益は2.8%増の5,196億円。通期の予想は変えていない。", codes: ["2914"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/29140/140120201028410029.pdf （決算短信）
  // https://www2.jpx.co.jp/disc/29140/140120210208458789.pdf （決算短信）
  { date: "2020-10-30", headline: "JTの1〜9月期は、売上収益が2.5%減の1兆5,921億円、純利益は18.4%減の2,579億円",
    body: "通期の予想を見直し、売上収益は2兆700億円、純利益は3,100億円とした。年間配当は154円の予定のまま。", codes: ["2914"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/80580/140120200507405804.pdf （決算短信）
  // https://www2.jpx.co.jp/disc/80580/140120200507406057.pdf （会社の開示資料）
  { date: "2020-05-08", headline: "三菱商事の3月期決算は、純利益が9.4%減の5,354億円。年間配当は132円",
    body: "今期の業績予想は、新型コロナの影響が見通せないとして未定。配当は134円を予定する。", codes: ["8058"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/80580/140120200812480958.pdf （決算短信）
  // https://m.uk.investing.com/news/coronavirus/mitsubishi-corp-forecasts-28-billion-hit-to-annual-profit-from-covid19-2188438?ampMode=1
  { date: "2020-08-13", headline: "三菱商事の4〜6月期は、純利益が77.3%減の367億円",
    body: "収益は32.3%減の2兆6,674億円。", codes: ["8058"], importance: 2, type: "fact" },

  // https://www.businessinsider.jp/article/229811/
  // https://media.rakuten-sec.net/articles/-/39759
  { date: "2020-08-30", headline: "米投資家バフェット氏のバークシャー・ハサウェイが、三菱商事など大手商社5社の株をそれぞれ5%超持っていると発表",
    body: "対象は伊藤忠商事・三菱商事・三井物産・住友商事・丸紅。約12か月かけて買い進めた（日本では31日の朝に伝わった）。", codes: ["8058"], importance: 3, type: "fact" },

  // https://www2.jpx.co.jp/disc/54110/140120200326484895.pdf （会社の開示資料）
  // https://www.nikkan.co.jp/articles/view/00568749
  { date: "2020-03-27", headline: "JFEホールディングスが、京浜地区（川崎市）の高炉を2023年度をめどに休止すると発表",
    body: "高炉を8基から7基に減らし、粗鋼の生産能力を約13%減らす。2019年度の決算で約2,200億円の減損損失を計上する。", codes: ["5411"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/54110/140120200511409318.pdf （決算短信）
  // https://www.steelorbis.com/steel-news/latest-news/jfe-reports-net-loss-for-fiscal-year-2019-20-1145686.htm
  { date: "2020-05-12", headline: "JFEホールディングスの3月期決算は、1,977億円の最終赤字",
    body: "高炉休止などにともなう減損損失がかさんだ。期末配当は0円（年間は中間の20円だけ）。", codes: ["5411"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/58030/140120200401488523.pdf （決算短信）
  // https://www2.jpx.co.jp/disc/58030/140120200629454639.pdf （決算短信）
  { date: "2020-06-10", headline: "フジクラの3月期決算は、385億円の最終赤字",
    body: "売上高は5.4%減の6,723億円、営業利益は87.9%減の33億円。期末配当は0円（年間は中間の5円だけ）。", codes: ["5803"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/58030/140120200910491177.pdf （決算短信）
  // https://www2.jpx.co.jp/disc/58030/140120201030413467.pdf （会社の開示資料）
  { date: "2020-11-02", headline: "フジクラの4〜9月期は、売上高が12.5%減の3,005億円、営業利益は54.3%増の89億円",
    body: "未定としていた今期の配当は、中間・期末とも0円（無配）とした。", codes: ["5803"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/63050/140120200528428251.pdf （決算短信）
  // https://irbank.net/E01585/S100HBVW/pl
  { date: "2020-05-28", headline: "日立建機の3月期決算は、売上収益が9.9%減の9,313億円、純利益は39.9%減の412億円",
    body: "", codes: ["6305"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/63050/140120200727466879.pdf （決算短信）
  // https://www2.jpx.co.jp/disc/63050/140120201027409186.pdf （決算短信）
  { date: "2020-07-27", headline: "日立建機の4〜6月期は、売上収益が27.5%減の1,702億円、純利益は98.5%減の2億円",
    body: "調整後営業利益は87.2%減の29億円。", codes: ["6305"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/80150/140120200428401853.pdf （決算短信）
  // https://www2.jpx.co.jp/disc/80150/140120200729469365.pdf （決算短信）
  { date: "2020-04-30", headline: "豊田通商の3月期決算は、純利益が2.2%増の1,356億円。期末配当は予想の60円から50円に",
    body: "年間配当は110円。今期の業績予想と配当は未定。", codes: ["8015"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/80150/140120200729469365.pdf （決算短信）
  // https://www.kabutore.biz/kessan/yotei_kobetsu.html?code=8015&p=2
  { date: "2020-07-31", headline: "豊田通商の4〜6月期は、収益が29.3%減の1兆1,940億円、純利益は75.9%減の134億円", body: "", codes: ["8015"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/27020/140120200212462758.pdf （決算短信）
  // https://www2.jpx.co.jp/disc/27020/140120200213463214.pdf （会社の開示資料）
  { date: "2020-02-13", headline: "日本マクドナルドHDの12月期決算は、営業利益が11.9%増の280億円。全店売上高は5,490億円で過去最高",
    body: "既存店の売上高は4.5%増。純利益は税率の変更などで23.0%減の169億円。年間配当は33円。", codes: ["2702"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/27020/140120200811479833.pdf （決算短信）
  // https://finance.logmi.jp/375685
  { date: "2020-08-12", headline: "日本マクドナルドHDの1〜6月期は、売上高が2.0%増の1,392億円、営業利益は0.7%増の148億円",
    body: "純利益は4.9%減の92億円。", codes: ["2702"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/98610/140120200727467346.pdf （決算短信）
  // https://www.ryutsuu.biz/accounts/m072912.html
  { date: "2020-07-28", headline: "吉野家HDの3〜5月期は、売上高が24.8%減の397億円、純損失は41億円。国内外で最大150店を閉める計画",
    body: "4〜5月は国内の約1,000店が休業や時短営業をした。中間配当は0円の予定。", codes: ["9861"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/98610/140120201009401627.pdf （決算短信）
  // https://sp.m.jiji.com/english/show/7819
  { date: "2020-10-09", headline: "吉野家HDの3〜8月期は、売上高が23.4%減の820億円、純損失は57億円",
    body: "不採算店の閉店などで特別損失を計上した。中間配当は0円。", codes: ["9861"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/75500/140120200805475778.pdf （決算短信）
  // https://www2.jpx.co.jp/disc/75500/140120201110420149.pdf （決算短信）
  { date: "2020-08-07", headline: "ゼンショーHDの4〜6月期は、売上高が16.3%減の1,284億円、純損失は64億円",
    body: "営業損失は80億円。未定としていた今期の配当は年20円の予定とした。", codes: ["7550"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/75500/140120201110420149.pdf （決算短信）
  // https://www.tsr-net.co.jp/data/detail/1190275_1527.html
  { date: "2020-11-13", headline: "ゼンショーHDの4〜9月期は、売上高が10.0%減の2,880億円、純損失は19億円",
    body: "営業損失は5億円まで縮んだ。", codes: ["7550"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/87660/140120200518417926.pdf （決算短信）
  // https://www2.jpx.co.jp/disc/87660/140120200518417931.pdf （会社の開示資料）
  { date: "2020-05-20", headline: "東京海上HDの3月期決算は、純利益が5.4%減の2,597億円",
    body: "今期の利益計画は、新型コロナの影響が算定できないとして未定とした。", codes: ["8766"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/88010/140120201126428777.pdf （会社の開示資料）
  // https://www.sbbit.jp/article/refers/48032
  // https://www.watch.impress.co.jp/docs/news/1291838.html
  { date: "2020-11-27", headline: "三井不動産が、東京ドームを1株1,300円で買収すると発表。総額は約1,205億円",
    body: "全株を取得したあと、20%を読売新聞グループ本社に譲る。東京ドームは賛同を表明した。", codes: ["8801"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/45430/140120200518417045.pdf （決算資料）
  // https://www2.jpx.co.jp/disc/45430/140120200424499110.pdf （会社の開示資料）
  { date: "2020-05-18", headline: "テルモの3月期決算は、売上収益が5%増の6,289億円、当期利益は7%増の852億円",
    body: "移動制限で決算業務が遅れ、発表を14日から延ばした。今期の業績予想は未定。", codes: ["4543"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/45430/140120200806475928.pdf （会社の開示資料）
  // https://www2.jpx.co.jp/disc/45430/140120200806475915.pdf （決算資料）
  { date: "2020-08-06", headline: "テルモが今期の業績予想を公表。売上収益は6,000億円、純利益は650億円",
    body: "前の期は売上収益6,289億円、純利益852億円。心臓血管の分野で新型コロナの影響が比較的大きい。", codes: ["4543"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/97350/140120200511408689.pdf （決算短信）
  // https://kigyolog.com/company.php?id=709
  { date: "2020-05-12", headline: "セコムの3月期決算は、売上高が4.6%増の1兆601億円、純利益は3.2%減の891億円",
    body: "年間配当は170円（前の期は165円）。今期も170円を予定する。", codes: ["9735"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/97350/140120201106417512.pdf （決算短信）
  // https://www2.jpx.co.jp/disc/97350/140120210204455910.pdf （決算短信）
  { date: "2020-11-09", headline: "セコムの4〜9月期は、売上高が2.5%減の4,912億円、純利益は25.4%減の324億円", body: "", codes: ["9735"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/44520/140120200203456459.pdf （決算短信）
  // https://www.asset-alive.com/news/?mode=show&seq=36209
  { date: "2020-02-04", headline: "花王の12月期決算は、営業利益が1.9%増の2,117億円で7期連続の最高益",
    body: "売上高は0.4%減の1兆5,022億円。年間配当は130円（前の期は120円）で、今期は140円を予定する。", codes: ["4452"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/44520/140120200727467177.pdf （決算短信）
  // https://www2.jpx.co.jp/disc/44520/140120210203454348.pdf （決算短信）
  { date: "2020-07-29", headline: "花王の1〜6月期は、売上高が7.5%減の6,672億円、純利益は11.7%減の506億円",
    body: "通期の予想を見直し、売上高は1兆4,300億円、営業利益は1,900億円とした。年間配当は140円の予定のまま。", codes: ["4452"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/65010/140120200526424476.pdf （決算短信）
  // https://www2.jpx.co.jp/disc/65010/140120210428402517.pdf （決算短信）
  { date: "2020-05-29", headline: "日立製作所の3月期決算は、売上収益が7.5%減の8兆7,673億円、純利益は60.6%減の876億円", body: "", codes: ["6501"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/65010/140120200701456462.pdf （会社の開示資料）
  // https://monoist.itmedia.co.jp/mn/articles/2007/02/news084.html
  { date: "2020-07-01", headline: "日立製作所が、スイスABBの送配電（パワーグリッド）事業の買収を完了",
    body: "新会社の80.1%を持つ。「日立ABBパワーグリッド」として営業を始めた。", codes: ["6501"], importance: 2, type: "fact" },

  // https://www.hitachi.co.jp/New/cnews/month/2020/09/0916.pdf （会社の発表）
  // https://www.jetro.go.jp/biznews/2020/09/54148aade4ad35f8.html
  { date: "2020-09-16", headline: "日立製作所が、英国での原発建設計画から撤退すると発表",
    body: "2019年1月から凍結していた。新型コロナで投資環境が厳しくなったことなどを理由に挙げた。", codes: ["6501"], importance: 2, type: "fact" },

  /* ----- 追加18社の補強と新規上場2社（Sun Asterisk・雪国まいたけ） ----- */

  /* ===== 新規上場：Sun Asterisk（4053） ===== */

  // https://thebridge.jp/2020/06/sun-asterisk-files-for-ipo
  // https://diamond.jp/articles/-/241652
  { date: "2020-06-26", headline: "Sun Asteriskが東証マザーズへの上場を承認される。上場予定は7月31日",
    body: "デジタル・クリエイティブスタジオ事業を営む。公募205万株、売出215万株で、主幹事は大和証券。", codes: ["4053"], importance: 2, type: "fact" },

  // https://www.traders.co.jp/ipo/4053
  // https://www.ipokiso.com/company/2020/sun-asterisk.html
  { date: "2020-07-13", headline: "Sun Asteriskの公開価格の仮条件は630〜700円",
    body: "ブックビルディングは7月14日から20日まで。", codes: ["4053"], importance: 1, type: "fact" },

  // https://www.traders.co.jp/ipo/4053
  // https://www.ipokiso.com/company/2020/sun-asterisk.html
  { date: "2020-07-21", headline: "Sun Asteriskの公開価格が700円に決まる。仮条件の上限",
    body: "上場日は7月31日。", codes: ["4053"], importance: 1, type: "fact" },

  // https://www.traders.co.jp/ipo/4053
  // https://www.ipokiso.com/company/2020/sun-asterisk.html
  { date: "2020-07-31", headline: "Sun Asteriskが東証マザーズに上場。初値は公開価格700円の約7割高い1,209円",
    body: "初値は公開価格を509円（72.7%）上回った。", codes: ["4053"], importance: 3, type: "fact" },

  // https://www2.jpx.co.jp/disc/40530/140120200812480879.pdf （決算短信）
  // https://www2.jpx.co.jp/disc/40530/140120201110420341.pdf （決算短信）
  { date: "2020-08-14", headline: "Sun Asteriskの1〜6月期は、売上高が27億円、営業利益は5億5,000万円",
    body: "上場後はじめての決算。通期の予想（売上高51億円、営業利益7億円）は据え置いた。", codes: ["4053"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/40530/140120201110420341.pdf （決算短信）
  // https://www2.jpx.co.jp/disc/40530/140120200812480879.pdf （決算短信）
  { date: "2020-11-11", headline: "Sun Asteriskの1〜9月期は、売上高が40億円、営業利益は6億9,400万円",
    body: "純利益は6億4,900万円。", codes: ["4053"], importance: 1, type: "fact" },

  /* ===== 新規上場：雪国まいたけ（1375） ===== */

  // https://diamond.jp/zai/articles/-/246020
  // https://gendai.media/articles/-/75697
  { date: "2020-08-14", headline: "雪国まいたけが東証1部への上場を承認される。上場予定は9月17日",
    body: "2015年にベインキャピタルのTOBで上場廃止となっており、約5年ぶりの再上場。ベインキャピタルが保有株を売り出す。", codes: ["1375"], importance: 2, type: "fact" },

  // https://www.traders.co.jp/ipo/1375
  // https://diamond.jp/zai/articles/-/246020
  { date: "2020-09-01", headline: "雪国まいたけの公開価格の仮条件は2,000〜2,400円",
    body: "想定価格は2,330円だった。", codes: ["1375"], importance: 1, type: "fact" },

  // https://www.traders.co.jp/ipo/1375
  // https://www.ipokiso.com/company/2020/maitake.html
  { date: "2020-09-09", headline: "雪国まいたけの公開価格が2,200円に決まる。仮条件の上限には届かず",
    body: "上場日は9月17日。", codes: ["1375"], importance: 1, type: "fact" },

  // https://diamond.jp/zai/articles/-/246020
  // https://www.ipokiso.com/company/2020/maitake.html
  { date: "2020-09-17", headline: "雪国まいたけが東証1部に上場。初値は公開価格2,200円を下回る2,100円",
    body: "公開価格を4.5%下回る公募割れの初値だった。", codes: ["1375"], importance: 3, type: "fact" },

  // https://www2.jpx.co.jp/disc/13750/140120200915492876.pdf （会社の開示資料）
  // https://gendai.media/articles/-/75697
  { date: "2020-09-17", headline: "雪国まいたけが今期の予想を公表。売上収益356億円、営業利益83億円",
    body: "上場にあわせて開示した。営業利益は前の期より24.4%増える見込み。", codes: ["1375"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/13750/140120201104415753.pdf （決算説明資料）
  // https://www2.jpx.co.jp/disc/13750/140120200915492876.pdf （会社の開示資料）
  { date: "2020-11-05", headline: "雪国まいたけの4〜9月期は、売上収益が4.3%増の150億円、営業利益は19.2%増の33億円",
    body: "上場後はじめての決算。家庭での調理が増え、きのこの需要が伸びた。", codes: ["1375"], importance: 2, type: "fact" },

  /* ===== 既存の補強 ===== */

  // https://www2.jpx.co.jp/disc/33150/140120200319481578.pdf （会社の開示資料）
  // https://www2.jpx.co.jp/disc/33150/140120200502404449.pdf （決算短信）
  { date: "2020-03-24", headline: "日本コークス工業が、3月期の期末配当予想を1円とすると発表",
    body: "前の期は3円。業績の見通しを踏まえた。", codes: ["3315"], importance: 1, type: "fact" },

  // https://www2.jpx.co.jp/disc/33150/140120201016404937.pdf （会社の開示資料）
  // https://www2.jpx.co.jp/disc/33150/140120201104415221.pdf （会社の開示資料）
  { date: "2020-10-19", headline: "日本コークス工業が、4〜9月期の営業利益予想を11億円から14億円に上方修正",
    body: "コークスの市況が堅調だった。売上高の予想は440億円から410億円に下げた。", codes: ["3315"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/33150/140120201221437004.pdf （会社の開示資料）
  // https://www2.jpx.co.jp/disc/33150/140120201104415221.pdf （会社の開示資料）
  { date: "2020-12-25", headline: "日本コークス工業が、今期の営業利益予想を43億円から57億円に上方修正。期末配当は3円に",
    body: "コスト削減に加え、コークスの市況が上がった。純利益の予想は19億円から29億円。", codes: ["3315"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/39940/140120200730470544.pdf （会社の開示資料）
  // https://edinetdb.jp/company/E33390/history
  { date: "2020-07-31", headline: "マネーフォワードが、入金消込システムのアール・アンド・エー・シーを子会社にすると発表",
    body: "「V-ONE クラウド」などを提供する会社。中堅規模以上の企業向けの商品を強める。", codes: ["3994"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/54110/140120200811480076.pdf （会社の開示資料）
  // https://www.newsweekjapan.jp/articles/-/164595
  { date: "2020-08-12", headline: "JFEホールディングスが今期の予想を公表。事業損益は1,000億円の赤字、中間配当は見送り",
    body: "新型コロナの影響が読めないとして未定にしていた。通期の売上収益は3兆1,700億円の見通し。", codes: ["5411"], importance: 3, type: "fact" },

  // https://www2.jpx.co.jp/disc/58030/140120200204456923.pdf （会社の開示資料）
  // https://www2.jpx.co.jp/disc/58030/140120200408490998.pdf （会社の開示資料）
  { date: "2020-02-05", headline: "フジクラが3月期の予想を下方修正。営業利益は155億円から80億円、純損益は75億円の赤字に",
    body: "光関連製品の競争の激化などによる。期末配当は5円から2.5円に引き下げる。", codes: ["5803"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/58030/140120200408490998.pdf （会社の開示資料）
  // https://www2.jpx.co.jp/disc/58030/140120200525423444.pdf （会社の開示資料）
  { date: "2020-05-25", headline: "フジクラが3月期の純損益予想を330億円の赤字に引き下げ。減損損失114億円を計上へ",
    body: "光ファイバの製造設備などの減損と、繰延税金資産の取り崩しによる。決算発表は再び延期した。", codes: ["5803"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/58030/140120200729468935.pdf （会社の開示資料）
  // https://www2.jpx.co.jp/disc/58030/140120201030413467.pdf （会社の開示資料）
  { date: "2020-08-03", headline: "フジクラが4〜9月期の予想を公表。営業利益10億円、純損益は65億円の赤字",
    body: "新型コロナの影響で未定にしていた。売上高の予想は2,900億円。", codes: ["5803"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/87660/140120200107443768.pdf （会社の開示資料）
  // https://www.insurancejournal.com/news/international/2020/01/07/553737.htm
  { date: "2020-01-07", headline: "東京海上HDが、ブラジルで保険の合弁会社を設立すると発表。出資額は約395億円",
    body: "国営のカイシャ銀行系の保険会社と組み、住宅ローンに付ける保険などを扱う。東京海上側の議決権は50.01%。", codes: ["8766"], importance: 2, type: "fact" },

  // https://www2.jpx.co.jp/disc/87660/140120201117425745.pdf （会社の開示資料）
  // https://www2.jpx.co.jp/disc/87660/140120201117425744.pdf （会社の開示資料）
  { date: "2020-11-19", headline: "東京海上HDが、500億円の株主還元を決定。一時的な配当と自己株式の取得",
    body: "一時的な配当は1株35円（総額244億円）、自己株式の取得は256億円が上限。中間配当は普通配当と合わせて135円。", codes: ["8766"], importance: 2, type: "fact" },

  // https://www.watch.impress.co.jp/docs/news/1248135.html
  // https://www.bcnretail.com/market/detail/20200420_168590.html
  { date: "2020-04-20", headline: "日本マクドナルドが、13都道府県の約1,910店で店内客席の利用を終日中止",
    body: "政府の「特定警戒都道府県」が対象で、5月6日までの予定。持ち帰り・ドライブスルー・デリバリーは続ける。", codes: ["2702"], importance: 2, type: "fact" },

  // https://digitalpr.jp/r/38695
  // https://mdpr.jp/news/detail/2050584
  { date: "2020-04-28", headline: "日本マクドナルドが、全国約2,900店で店内客席の利用を終日中止すると発表",
    body: "4月29日から5月6日までの予定。持ち帰り・ドライブスルー・デリバリーは続ける。", codes: ["2702"], importance: 3, type: "fact" },

  // https://www.yakuji.co.jp/?p=78697
  // https://www.yakuji.co.jp/?p=78543
  { date: "2020-04-13", headline: "テルモの血液成分分離装置が、新型コロナ患者向けに米FDAの緊急使用許諾を取得",
    body: "吸着カートリッジと組み合わせ、集中治療室で呼吸不全の18歳以上の患者に使う。治療機器としては初めて。", codes: ["4543"], importance: 3, type: "fact" },

  // https://toyokeizai.net/articles/-/352470
  // https://newswitch.jp/image/21781
  { date: "2020-05-26", headline: "テルモが、人工肺（ECMO）の生産能力を平時の約3倍に引き上げたと明らかに",
    body: "国内シェアは7割。1月に部材の調達から増産に着手し、装置本体の体制は3月に整った。", codes: ["4543"], importance: 2, type: "fact" },

  // https://newswitch.jp/p/21816
  // https://newswitch.jp/p/21926
  { date: "2020-04-09", headline: "花王が、4月下旬から消毒液を増産すると発表。生産量は前年の20倍以上に",
    body: "和歌山工場など国内4工場で生産する。まず医療機関や介護施設に供給する。", codes: ["4452"], importance: 2, type: "fact" },

  // https://www.kao.com/jp/newsroom/news/release/2020/20201001-001/
  // https://www.nikkei.com/article/DGXLRSP541055_R01C20A0000000/
  { date: "2020-10-01", headline: "花王の衛生科学研究センターが、専門家向けに新型コロナの感染防止情報の発信を開始",
    body: "感染の仕組みや環境表面の除染方法などを、論文などの知見に基づいて紹介する。", codes: ["4452"], importance: 1, type: "fact" },

  // https://jidounten-lab.com/u_35710
  // https://www.hitachicm.com/global/news-list_en/20-08-19e （会社の発表。ページは開けず、検索結果の要旨で確認）
  { date: "2020-08-19", headline: "日立建機が、自律運転の建設機械向けシステムの基盤「ZCORE」を開発",
    body: "油圧ショベルやダンプトラックなどに載せ、認識・判断・実行を機械側で行えるようにする。", codes: ["6305"], importance: 1, type: "fact" },

  // https://www.toyota-tsusho.com/press/detail/200401_004594.html
  // https://eetimes.itmedia.co.jp/ee/articles/2004/14/news056.html
  { date: "2020-04-01", headline: "豊田通商グループのネクスティ エレクトロニクスが、キャッツのODM事業を譲り受けることで基本合意。新会社を設立",
    body: "新会社はネクスティエンジニアリングサービス（資本金1億円）。設計や生産の受託を手がける。", codes: ["8015"], importance: 1, type: "fact" },

  // https://www.toyota-tsusho.com/press/detail/201027_004701.html
  // https://www.nttdata.com/global/ja/news/release/2020/102700
  { date: "2020-10-27", headline: "豊田通商など7社が、貿易のデジタル化を進める「TradeWaltz」の運営会社に共同出資",
    body: "NTTデータ、三菱商事、東京海上日動、三菱UFJ銀行、兼松、損保ジャパンとの7社。ブロックチェーンを使う。", codes: ["8015"], importance: 1, type: "fact" },

  // https://www.toyota-tsusho.com/press/detail/201223_004731.html
  // https://www.toyota-tsusho.com/press/2020/
  { date: "2020-12-23", headline: "豊田通商が、医療用アプリを手がけるアルムと業務提携",
    body: "アプリ「Join」で、インドの病院とガーナ・ナイジェリアのクリニックを結び、遠隔診療などに使う。", codes: ["8015"], importance: 1, type: "fact" },

  // https://www.bcnretail.com/market/detail/20200309_161701.html
  // https://macaro-ni.jp/87652?page=2
  { date: "2020-03-09", headline: "吉野家が、3月10日から31日まで、テイクアウトの牛丼並盛を税込300円に値下げ",
    body: "新型コロナによる臨時休校を受けた措置。通常は税込380円。", codes: ["9861"], importance: 1, type: "fact" },

  // https://www.watch.impress.co.jp/docs/news/1248494.html
  // https://weekly.ascii.jp/elem/000/004/010/4010270/
  { date: "2020-04-21", headline: "吉野家が、4月23日からテイクアウト限定の「ファミリーセット」を販売",
    body: "牛丼並盛3人前が1,350円、4人前が1,800円（税抜）。持ち帰りの販売が全体の6割を超えたことを受けた。", codes: ["9861"], importance: 1, type: "fact" },

  // https://www.bcnretail.com/market/detail/20201019_195694.html
  // https://www.bcnretail.com/market/detail/20201026_196635.html
  { date: "2020-10-19", headline: "ゼンショーHDが、すき家・はま寿司など全業態で「Go To Eat」の食事券に参加",
    body: "購入額に25%が上乗せされる食事券。ココスは10月26日から使える。", codes: ["7550"], importance: 1, type: "fact" },

  // https://www.kabutore.biz/genzaikabuka/enkaku.html?code=7550
  // https://ja.wikipedia.org/wiki/ココスジャパン
  { date: "2020-02-18", headline: "ココスジャパンがジャスダックを上場廃止。ゼンショーグループの完全子会社に",
    body: "株式交換によるもので、効力の発生は2月20日。", codes: ["7550"], importance: 1, type: "fact" },

  // https://www.ryutsuu.biz/strategy/m052727.html
  // https://digitalpr.jp/r/37064
  { date: "2020-05-27", headline: "三井不動産が、延期していた施設の開業日を発表。ららぽーと豊洲は5月29日にリニューアル",
    body: "ららぽーと豊洲3は6月1日、三井アウトレットパーク 横浜ベイサイドは6月4日に開業する。", codes: ["8801"], importance: 1, type: "fact" },

  // https://media.monex.co.jp/articles/-/15266
  // https://www2.jpx.co.jp/disc/89510/140120201009401770.pdf （投資法人側の開示。ページは開けず、検索結果の要旨で確認）
  { date: "2020-10-09", headline: "三井不動産が、新宿三井ビルディングを日本ビルファンド投資法人に1,700億円で譲渡",
    body: "引き渡しは2021年1月の予定。東京駅近くのグラントウキョウサウスタワーの一部（470億円）も同時に譲渡する。", codes: ["8801"], importance: 2, type: "fact" },

  // https://www.sbbit.jp/article/refers/49415
  // https://www.sbbit.jp/article/refers/48811
  { date: "2020-12-16", headline: "三井不動産が、東京ドームのTOBで、大株主オアシスと保有株の全株を応募する契約を結んだと発表",
    body: "買い付け価格は1株1,300円。オアシスは東京ドームの約1割を持つ香港の投資ファンド。", codes: ["8801"], importance: 2, type: "fact" },

  // https://www.nihon-ma.co.jp/news/20200514_9735-8/
  // https://www2.jpx.co.jp/disc/70580/140120200514414390.pdf （共栄セキュリティーサービスの開示。ページは開けず、検索結果の要旨で確認）
  { date: "2020-05-14", headline: "セコムが、警備会社の共栄セキュリティーサービスと業務・資本提携。株式の2.99%を取得",
    body: "施設警備に強い共栄の人的警備と、セコムのシステムや技術を組み合わせる。", codes: ["9735"], importance: 1, type: "fact" },

  // https://www.nihon-ma.co.jp/news/20201026_8928-4/
  // https://maonline.jp/news/summary20201031
  { date: "2020-10-26", headline: "セコムが、マンション分譲のセコムホームライフの全株式を穴吹興産に譲渡する契約を結ぶ",
    body: "譲渡日は12月22日の予定。取得価額は非公表。", codes: ["9735"], importance: 1, type: "fact" },

  /* ===================== 観測報道（発表前に実際にあった報道） ===================== */

  // https://www.sbbit.jp/article/refers/45073
  // https://forbesjapan.com/articles/detail/37769
  { date: "2020-10-20", headline: "ニトリHDが、ホームセンターの島忠の買収を検討していると報じられる",
    body: "島忠にはDCMホールディングスがTOBを実施している。", codes: ["9843"], importance: 2, type: "report" },

  // https://www.sbbit.jp/article/refers/47565
  // https://www.sbbit.jp/article/refers/47645
  { date: "2020-11-20", headline: "ANAホールディングスが、2,000億円規模の公募増資を最終調整していると報じられる",
    body: "関係者の話として伝えられた。", codes: ["9202"], importance: 2, type: "report" },

  /* ===================== 当時実際に出回った噂と、その公式な否定 ===================== */
  // 噂（type: "rumor"）には、真偽を書かない。公式な否定は別の事実（type: "fact"）として、否定された日付で入れる。

  // https://ryukyushimpo.jp/news/entry-1082817.html
  // https://president.jp/articles/-/33600
  { date: "2020-02-28", headline: "「トイレットペーパーはマスクと同じ原料で、中国からの輸入が止まると品薄になる」という話がネットで広がる",
    body: "", codes: [], importance: 2, type: "rumor" },

  // https://www.logi-today.com/369156
  // https://www.j-cast.com/2020/03/05381403.html?p=all
  { date: "2020-02-28", headline: "日本家庭紙工業会が、国内のトイレットペーパーは98%が国内生産で、供給と在庫は十分と発表",
    body: "原材料の調達も中国に頼っていないと説明した。", codes: [], importance: 2, type: "fact" },

  // https://seijiyama.jp/article/news/nws20200401.html
  // https://gendai.media/articles/-/71476
  { date: "2020-03-28", headline: "「首相が近く会見し、4月1日から都市封鎖（ロックダウン）を発表する」という話がSNSで広がる",
    body: "", codes: [], importance: 2, type: "rumor" },

  // https://seijiyama.jp/article/news/nws20200401.html
  // https://www.ryutsuu.biz/government/m033056.html
  { date: "2020-03-30", headline: "菅官房長官が会見で、4月1日に緊急事態宣言を出し都市封鎖するという情報を否定", body: "", codes: [], importance: 2, type: "fact" },
];
