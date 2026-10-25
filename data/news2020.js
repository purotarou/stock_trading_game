// リアル相場チャレンジで流す、2020年の実際のニュース（表示専用。株価には影響しない）
// date = 出来事・発表があった日。画面には date より後の最初の営業日の寄り付き前に出る。
// importance: 3 = その日の株価が大きく動きうる / 2 = 決算など通常 / 1 = 補足
// 見出し・本文は報道や公式発表を要約して書き直したもの。各ニュースの上に出典（2つ以上）を残す。
const NEWS2020 = [

  /* ===================== 市場全体 ===================== */

  // https://www.mhlw.go.jp/stf/newpage_09241.html
  // https://honichi.com/news/2020/01/31/coronavirustimeseries/
  { date: "2020-01-30", headline: "WHOが新型コロナウイルスの流行を「国際的に懸念される公衆衛生上の緊急事態」と宣言",
    body: "中国・武漢市から広がった感染について、WHOの緊急委員会が判断した（日本時間31日未明）。", codes: [], importance: 2 },

  // https://tbladvisory.com/20200225nikkei/
  // https://s.kabutan.jp/news/n202002250702
  { date: "2020-02-25", headline: "25日の日経平均は781円安の2万2,605円。一時1,000円を超える下げ",
    body: "欧州や中東への感染拡大が警戒され、前日の欧米市場が大きく下げた。", codes: [], importance: 3 },

  // https://www.jp-toushin.japanpost.jp/news/detail/marketreport20200309.pdf
  // https://s.kabutan.jp/news/n202003090664
  { date: "2020-03-09", headline: "9日の日経平均は前日比約5%安の1万9,698円。原油安と円高が重荷に",
    body: "下げ幅は1,050円。欧米での感染拡大に加え、原油価格の急落と急速な円高が重なった。", codes: [], importance: 3 },

  // https://scienceportal.jst.go.jp/newsflash/20200312_01
  // https://www.newsweekjapan.jp/articles/-/37103
  { date: "2020-03-11", headline: "WHOが新型コロナを「パンデミック（世界的な大流行）」と表明",
    body: "WHOがパンデミックと表現するのは2009年の新型インフルエンザ以来（日本時間12日未明）。", codes: [], importance: 3 },

  // https://s.kabutan.jp/news/n202003130736
  // https://indexes.nikkei.co.jp/atoz/2020/04/202003.html
  { date: "2020-03-13", headline: "13日の日経平均は1,128円安の1万7,431円。下落率は6%超",
    body: "前日の米国株の急落を受けた。", codes: [], importance: 3 },

  // https://president.jp/articles/-/33835
  // https://www.nri.com/jp/media/column/kiuchi/20200316_3.html
  { date: "2020-03-16", headline: "日銀が会合を前倒しして追加の金融緩和を決定。ETFの買い入れ上限を年12兆円に倍増",
    body: "社債・CPの買い入れ枠の拡大や、企業の資金繰りを支える新しい資金供給も決めた。マイナス金利の深掘りは見送った。", codes: [], importance: 3 },

  // https://s.kabutan.jp/news/n202003190908
  // https://indexes.nikkei.co.jp/atoz/2020/04/202003.html
  { date: "2020-03-19", headline: "19日の日経平均は173円安の1万6,552円。年初来安値を更新",
    body: "1月20日に付けた今年の高値（2万4,083円）からの下落率は3割を超えた。", codes: [], importance: 2 },

  // https://www.cnn.co.jp/showbiz/35151301.html
  // https://www.aviationwire.jp/?p=198801
  { date: "2020-03-24", headline: "東京五輪・パラリンピックの延期が決定。1年程度延期し、遅くとも2021年夏までに開催",
    body: "安倍首相とIOCのバッハ会長が電話会談で合意した（24日夜）。", codes: [], importance: 3 },

  // https://tbladvisory.com/20200325nikkei/
  // https://s.kabutan.jp/news/n202003250738
  { date: "2020-03-25", headline: "25日の日経平均は1,454円高の1万9,546円。上昇率は8%",
    body: "米国の大型経済対策をめぐり、与野党が合意したと伝わった。", codes: [], importance: 2 },

  // https://www.businessinsider.jp/article/212859/
  // https://www.mhlw.go.jp/content/10900000/001131553.pdf
  { date: "2020-04-07", headline: "政府が東京など7都府県に緊急事態宣言を発出",
    body: "対象は東京・神奈川・埼玉・千葉・大阪・兵庫・福岡。外出の自粛などが求められる。", codes: [], importance: 3 },

  // https://www.city.nagoya.jp/kenkofukushi/eisei/1015269/1015388/1015392/1015403.html
  // https://www.bunka.go.jp/koho_hodo_oshirase/sonota_oshirase/2020041602.html
  { date: "2020-04-16", headline: "緊急事態宣言の対象を全国に拡大。期間は5月6日まで",
    body: "北海道・愛知・京都など13都道府県は、特に重点的に対策を進める「特定警戒都道府県」とされた。", codes: [], importance: 2 },

  // https://www.boj.or.jp/mopo/mpmdeci/state_2020/k200427a.htm
  // https://www.dlri.co.jp/pdf/macro/2020/kuma200427BOJ.pdf
  { date: "2020-04-27", headline: "日銀が金融緩和の強化を決定。国債をさらに積極的に買い入れる方針",
    body: "CP・社債の追加の買い入れ枠を、それぞれ1兆円から7.5兆円に増やした。", codes: [], importance: 2 },

  // https://www.nippon.com/ja/japan-data/h00733/
  // https://www.timeout.jp/tokyo/ja/ニュース/緊急事態宣言を全国で解除-052620
  { date: "2020-05-25", headline: "緊急事態宣言を全国で解除。残っていた首都圏の1都3県と北海道も解除",
    body: "4月7日の発出から49日目での全面解除。", codes: [], importance: 3 },

  // https://honichi.com/news/2020/08/28/abeinterview
  // https://www.businessinsider.jp/article/219291/
  { date: "2020-08-28", headline: "安倍首相が辞任の意向を表明。持病の悪化を理由に",
    body: "28日夕方の記者会見で、潰瘍性大腸炎の再発が確認されたと説明した。", codes: [], importance: 3 },

  // https://seijiyama.jp/article/news/nws20200916.html
  // https://www.businessinsider.jp/article/220202/
  { date: "2020-09-16", headline: "菅義偉氏が第99代首相に選出され、菅内閣が発足",
    body: "安倍首相の辞任を受けた交代。", codes: [], importance: 2 },

  // https://www.businessinsider.jp/article/223759/
  // https://media.monex.co.jp/articles/-/15421
  { date: "2020-11-07", headline: "米大統領選で、米主要メディアが民主党のバイデン氏の当選確実を報道",
    body: "激戦州のペンシルベニアを制し、当選に必要な選挙人270人を上回った（現地時間7日）。トランプ大統領は敗北を認めていない。", codes: [], importance: 3 },

  // https://s.kabutan.jp/news/n202011090906
  // https://limo.media/articles/-/20233
  { date: "2020-11-09", headline: "9日の日経平均は514円高の2万4,839円。約29年ぶりの高値",
    body: "米大統領選の結果がほぼ固まり、先行きの不透明感が和らいだ。5営業日続けて上昇。", codes: [], importance: 2 },

  // https://www.cnn.co.jp/business/35162182.html
  // https://www.newsweekjapan.jp/articles/-/41293?page=2
  { date: "2020-11-09", headline: "米ファイザーが、開発中の新型コロナワクチンで90%を超える予防効果が確認されたと発表",
    body: "独ビオンテックとの共同開発。4万3,000人あまりが参加した臨床試験の中間分析の結果。", codes: [], importance: 3 },

  // https://forbesjapan.com/articles/detail/38582
  // https://www.yakuji.co.jp/entry83339.html
  { date: "2020-12-02", headline: "英国が米ファイザーなどの新型コロナワクチンの緊急使用を承認",
    body: "翌週から英国全土で接種が始まる見通し。", codes: [], importance: 2 },

  // https://www.watch.impress.co.jp/docs/news/1295145.html
  // https://www.travelvoice.jp/20201214-147729
  { date: "2020-12-14", headline: "政府が「Go To トラベル」を12月28日から1月11日まで全国で一時停止すると表明",
    body: "国内の新規感染者が12日に初めて3,000人を超えたことを受けた。", codes: ["9202", "9201", "9603", "9722"], importance: 3 },

  /* ===================== 任天堂（7974） ===================== */

  // https://www.gamebusiness.jp/article/2020/01/30/16681.html
  // https://www.gamespark.jp/article/2020/01/30/96399.html
  { date: "2020-01-30", headline: "任天堂の4〜12月期決算は営業利益2,629億円（前年同期比19.5%増）",
    body: "Nintendo Switchの販売は1,774万台。12月には中国での販売も始まった。", codes: ["7974"], importance: 2 },

  // https://www.famitsu.com/news/202003/14194418.html
  // https://dengekionline.com/articles/29824/
  { date: "2020-03-20", headline: "任天堂がNintendo Switch用ソフト「あつまれ どうぶつの森」を発売",
    body: "「どうぶつの森」シリーズの完全新作は約6年ぶり。", codes: ["7974"], importance: 2 },

  // https://www.gamespark.jp/article/2020/05/07/98876.html
  // https://www.gamebusiness.jp/article/2020/05/07/17065.html
  // https://www.gamebusiness.jp/article/2020/08/06/17447.html （今期予想の数字）
  // https://www.sbbit.jp/article/refers/46191 （今期予想の数字）
  { date: "2020-05-07", headline: "任天堂の前期決算は営業利益3,523億円（41.1%増）。今期は営業利益3,000億円（約15%減）の見通し",
    body: "今期の売上高は1兆2,000億円（8.3%減）を見込む。", codes: ["7974"], importance: 3 },

  // https://www.nintendo.co.jp/ir/pdf/2020/200806.pdf
  // https://gigazine.net/news/20200807-nintendo-21q1
  { date: "2020-08-06", headline: "任天堂の4〜6月期決算は営業利益1,447億円で、前年同期の約5.3倍",
    body: "売上高は3,581億円（108.1%増）。「あつまれ どうぶつの森」はこの3か月で1,063万本を販売した。", codes: ["7974"], importance: 3 },

  // https://www.sbbit.jp/article/refers/46191
  // https://s.kabutan.jp/stocks/7974/news/k202011050202/
  { date: "2020-11-05", headline: "任天堂が今期の業績予想を上方修正。営業利益は3,000億円から4,500億円に",
    body: "4〜9月期の営業利益は2,914億円で前年同期の約3倍。年間配当の予想も840円から1,260円に引き上げた。", codes: ["7974"], importance: 3 },

  /* ===================== ANAホールディングス（9202） ===================== */

  // https://www.aviationwire.jp/?p=201080
  // https://www.newsweekjapan.jp/articles/-/38107
  { date: "2020-04-20", headline: "ANAホールディングスが前期の業績予想を下方修正。純利益は940億円から270億円に",
    body: "新型コロナによる入国制限や国内の移動自粛で、旅客が大きく減った。", codes: ["9202"], importance: 2 },

  // https://www.aviationwire.jp/?p=201636
  // https://techxplore.com/news/2020-04-japan-ana-net-profit-virus.html
  { date: "2020-04-28", headline: "ANAホールディングスの前期決算は純利益276億円（75%減）。今期の業績予想は公表を見送り",
    body: "今期の見通しは、新型コロナの影響が見通せないとして出さなかった。", codes: ["9202"], importance: 2 },

  // https://www.aviationwire.jp/?p=207708
  // https://travel.watch.impress.co.jp/docs/news/1268143.html
  { date: "2020-07-29", headline: "ANAホールディングスの4〜6月期決算は1,088億円の最終赤字",
    body: "売上高は前年同期比75.7%減の1,216億円。国際線の旅客収入は9割超減った。今期の業績予想は未定のまま。", codes: ["9202"], importance: 2 },

  // https://www.aviationwire.jp/archives/213851
  // https://www.sbbit.jp/article/refers/45571
  { date: "2020-10-27", headline: "ANAホールディングスが今期は5,100億円の最終赤字になる見通しを発表。4,000億円の劣後ローンも契約",
    body: "劣後ローンは、返済の順番が後になる代わりに、一部を資本とみなせる借り入れ。4〜9月期決算と同時に発表した。", codes: ["9202"], importance: 3 },

  // https://www.aviationwire.jp/archives/215783
  // https://www.travelvoice.jp/20201127-147618
  { date: "2020-11-27", headline: "ANAホールディングスが公募増資などで最大約3,321億円を調達すると発表",
    body: "新株を最大1億4,000万株発行する。財務基盤を強めるためと説明した。", codes: ["9202"], importance: 3 },

  /* ===================== 東京エレクトロン（8035） ===================== */

  // https://s.kabutan.jp/stocks/8035/news/k202006180007/
  // https://www.j-cast.com/2020/07/08389678.html?p=all
  { date: "2020-06-18", headline: "東京エレクトロンが未定だった今期の業績予想を公表。売上高は1兆2,800億円（13.5%増）の見通し",
    body: "年間配当は660円（72円の増配）の予定。", codes: ["8035"], importance: 3 },

  // https://finance.logmi.jp/articles/375831 （決算説明会 7/28）
  // https://www.asset-alive.com/news/?mode=show&seq=37978
  // https://www.tel.com/ir/library/fs/hq95qj00000007ck-att/yuho58q1.pdf （第1四半期報告書）
  { date: "2020-07-28", headline: "東京エレクトロンの4〜6月期決算は売上高3,148億円、経常利益は約750億円（68.4%増）",
    body: "半導体製造装置の売上高は53.3%増の3,037億円。通期の予想は6月18日の公表から変えていない。", codes: ["8035"], importance: 2 },

  // https://www.sbbit.jp/article/refers/45787
  // https://www.asset-alive.com/news/?mode=show&seq=38889
  { date: "2020-10-29", headline: "東京エレクトロンが今期の利益予想を2,750億円から2,810億円に上方修正",
    body: "4〜9月期決算と同時に発表した。", codes: ["8035"], importance: 2 },

  /* ===================== グループ1：空運・陸運・旅行・レジャー ===================== */

  /* ---------- 日本航空（9201） ---------- */

  // https://www.aviationwire.jp/archives/201736/print/
  // https://travel.watch.impress.co.jp/docs/news/1250439.html
  { date: "2020-04-30", headline: "日本航空の前期決算は純利益534億円（64.5%減）",
    body: "1〜3月期は2012年の再上場後で初めての赤字になった。", codes: ["9201"], importance: 2 },

  // https://www.aviationwire.jp/?p=208147
  // https://www.newsweekjapan.jp/articles/-/163963
  { date: "2020-08-03", headline: "日本航空の4〜6月期決算は937億円の最終赤字",
    body: "国内線・国際線とも旅客が急減した。四半期の最終赤字としては2009年に次ぐ規模。", codes: ["9201"], importance: 2 },

  // https://www.aviationwire.jp/?p=214230
  // https://www.sbbit.jp/article/refers/45899
  { date: "2020-10-30", headline: "日本航空が今期は2,400億〜2,700億円の最終赤字になる見通しを発表",
    body: "これまで未定としていた通期予想を初めて示した。4〜9月期は1,612億円の最終赤字。", codes: ["9201"], importance: 3 },

  // https://www.travelvoice.jp/20201106-147484
  // https://www.aviationwire.jp/?p=215293
  { date: "2020-11-06", headline: "日本航空が公募増資などで最大1,680億円を調達すると発表",
    body: "公募増資は2012年の再上場後で初めて。新しい機体の導入などに充てる。", codes: ["9201"], importance: 3 },

  /* ---------- JR東日本（9020） ---------- */

  // https://www.watch.impress.co.jp/docs/news/1274779.html
  // https://www.timeout.jp/tokyo/ja/ニュース/首都圏で終電繰り上げへ-2021年春からを予定-090420
  { date: "2020-09-03", headline: "JR東日本が、2021年春から首都圏の終電を30分程度繰り上げると発表",
    body: "深夜の利用が大きく減ったことと、夜間の保守作業の時間を確保するため。", codes: ["9020"], importance: 1 },

  // https://www2.infomart.co.jp/web/jp/images/upload/852/140120200916493583_9432122.pdf （会社の開示資料）
  // https://tetsudo-ch.com/10731223.html
  { date: "2020-09-16", headline: "JR東日本が今期は4,180億円の最終赤字になる見通しを発表",
    body: "これまで未定としていた通期予想を公表した。年間配当は1株100円（前期は165円）の予定。", codes: ["9020"], importance: 3 },

  /* ---------- オリエンタルランド（4661） ---------- */

  // https://www.bcnretail.com/market/detail/20200228_160143.html
  // https://www.travelvoice.jp/20200228-145559
  { date: "2020-02-28", headline: "オリエンタルランドが、東京ディズニーランドとディズニーシーを2月29日から3月15日まで臨時休園すると発表",
    body: "新型コロナの感染拡大を防ぐため。長期の休園は2011年の東日本大震災の直後以来。", codes: ["4661"], importance: 3 },

  // https://www.travelvoice.jp/20200623-146464
  // https://travel.watch.impress.co.jp/docs/news/1260790.html
  { date: "2020-06-23", headline: "オリエンタルランドが、東京ディズニーランドとディズニーシーを7月1日に再開すると発表",
    body: "当面は入園者数を通常の半分以下に抑え、チケットは日付指定のオンライン販売にする。", codes: ["4661"], importance: 2 },

  // https://www.travelvoice.jp/20200731-146746
  // https://www.businessinsider.jp/article/217662/
  { date: "2020-07-30", headline: "オリエンタルランドの4〜6月期決算は約250億円の最終赤字",
    body: "臨時休園で売上高は前年同期比94.9%減の61億円。休園中の固定費を特別損失に計上した。", codes: ["4661"], importance: 2 },

  // https://toyokeizai.net/articles/-/385710
  // https://www.sbbit.jp/article/refers/45798
  { date: "2020-10-29", headline: "オリエンタルランドが、今期は最終赤字になる見通しを発表",
    body: "臨時休園と、再開後の入園者数の制限が続いた。", codes: ["4661"], importance: 3 },

  /* ---------- エイチ・アイ・エス（9603） ---------- */

  // https://www.traicy.com/?p=145892
  // https://www.travelvoice.jp/20200303-145570
  { date: "2020-03-03", headline: "エイチ・アイ・エスが、新型コロナの影響で今期の業績予想を下方修正",
    body: "11〜1月期の決算と同時に発表した。", codes: ["9603"], importance: 2 },

  // https://www.sbbit.jp/article/refers/49082
  // https://www.travelvoice.jp/20201211-147724
  { date: "2020-12-11", headline: "エイチ・アイ・エスの10月期決算は250億円の最終赤字。通期の赤字は2002年の上場後で初めて",
    body: "国内店舗の統廃合を進めた。今期の業績予想は未定とした。", codes: ["9603"], importance: 2 },

  /* ---------- 藤田観光（9722） ---------- */

  // https://www2.infomart.co.jp/web/jp/images/upload/672/010120200212462850_8385509.pdf （決算短信）
  { date: "2020-02-14", headline: "藤田観光の2019年12月期決算は2億8,500万円の最終赤字（前期は5億5,600万円の黒字）",
    body: "売上高は689億円（0.5%減）。", codes: ["9722"], importance: 1 },

  /* ===================== グループ2：小売・消費 ===================== */

  /* ---------- 三越伊勢丹HD（3099） ---------- */

  // https://www.businessinsider.jp/article/212659/
  // https://toyokeizai.net/articles/-/349371
  { date: "2020-05-11", headline: "三越伊勢丹HDの前期決算は111億円の最終赤字。今期の業績予想は公表を見送り",
    body: "店舗の時短営業や臨時休業が響いた。今期の見通しは新型コロナの影響で立たないとした。", codes: ["3099"], importance: 2 },

  /* ---------- 高島屋（8233） ---------- */

  // https://www.sbbit.jp/article/refers/50327
  // https://www.tsr-net.co.jp/data/detail/1190365_1527.html
  { date: "2020-12-25", headline: "高島屋の3〜11月期決算は243億円の最終赤字",
    body: "前年同期は164億円の黒字。臨時休業と訪日客の減少が響いた。", codes: ["8233"], importance: 2 },

  /* ---------- すかいらーくHD（3197） ---------- */

  // https://www2.infomart.co.jp/web/jp/images/upload/744/010120200521420616_8809694.pdf （決算短信）
  { date: "2020-05-21", headline: "すかいらーくHDの1〜3月期決算は営業利益4,000万円（99.3%減）",
    body: "売上収益は867億円（7.6%減）。", codes: ["3197"], importance: 2 },

  // https://www.watch.impress.co.jp/docs/news/1254805.html
  // https://www.businessinsider.jp/post-229612
  { date: "2020-05-26", headline: "すかいらーくHDが、7月1日からグループ全店で深夜営業をやめると発表",
    body: "ガスト、ジョナサン、バーミヤンなど約2,600店で、原則23時30分までの営業にする。", codes: ["3197"], importance: 1 },

  // https://www.sbbit.jp/article/refers/46854
  // https://www.tsr-net.co.jp/data/detail/1190269_1527.html
  { date: "2020-11-12", headline: "すかいらーくHDが今期は150億円の最終赤字になる見通しを発表。約200店を閉店へ",
    body: "閉店は2021年末までに進め、新規出店を差し引くと約120店の減少。雇用は維持するとした。", codes: ["3197"], importance: 3 },

  /* ---------- ニトリHD（9843） ---------- */

  // https://www.sbbit.jp/article/refers/45789
  // https://www.bcnretail.com/market/detail/20201101_197496.html
  { date: "2020-10-29", headline: "ニトリHDが、ホームセンターの島忠に1株5,500円でTOB（株式公開買い付け）を行うと発表",
    body: "島忠には、DCMホールディングスが1株4,200円でTOBを進めていた。", codes: ["9843"], importance: 2 },

  // https://www.sbbit.jp/article/refers/46925
  // https://www.sbbit.jp/article/refers/46927
  { date: "2020-11-13", headline: "島忠が、ニトリHDのTOBに賛同すると表明",
    body: "先に賛同していたDCMホールディングスのTOBより、価格がニトリのほうが高かった。", codes: ["9843"], importance: 2 },

  /* ---------- 神戸物産（3038） ---------- */

  // https://www2.jpx.co.jp/disc/30380/140120201214434521.pdf （会社の開示資料）
  { date: "2020-12-14", headline: "神戸物産が中期経営計画の目標を上方修正",
    body: "10月期は主力の業務スーパー事業が大きく伸び、売上高と各利益が過去最高になったため。", codes: ["3038"], importance: 2 },

  /* ---------- 資生堂（4911） ---------- */

  // https://corp.shiseido.com/jp/ir/pdf/ir20200806_717.pdf （会社の開示資料。5/12 に通期予想を未定にしたことの記載）
  { date: "2020-05-12", headline: "資生堂が、今期の業績予想を「未定」に変更",
    body: "", codes: ["4911"], importance: 2 },

  // https://corp.shiseido.com/jp/ir/pdf/ir20200806_717.pdf （会社の開示資料）
  { date: "2020-08-06", headline: "資生堂の1〜6月期決算は228億円の最終赤字。今期は220億円の最終赤字の見通し",
    body: "売上高は1,909億円（34.4%減）。未定としていた通期予想を改めて示した。", codes: ["4911"], importance: 3 },

  // https://www.sbbit.jp/article/refers/46616
  // https://www.fashionsnap.com/article/2020-11-10/shiseido-202012-03/
  { date: "2020-11-10", headline: "資生堂が今期の最終損益予想を下方修正。赤字幅は220億円から300億円に",
    body: "国内の消費の落ち込みが想定より大きく、欧米での移動制限で市場の回復も遅れた。", codes: ["4911"], importance: 2 },

  /* ===================== グループ3：銀行・証券・通信 ===================== */

  /* ---------- 三菱UFJフィナンシャル・グループ（8306） ---------- */

  // https://www.mufg.jp/dam/pressrelease/2020/pdf/news-20200204-001_ja.pdf （会社の開示資料）
  { date: "2020-02-04", headline: "三菱UFJが前期の純利益目標を9,000億円から7,500億円に下方修正",
    body: "インドネシアのバンクダナモンに関するのれんを一括で償却するため。", codes: ["8306"], importance: 2 },

  // https://www.mufg.jp/dam/pressrelease/2020/pdf/news-20201113-001_ja.pdf （会社の開示資料。5/15 に公表した目標の記載）
  // https://www.sbbit.jp/article/refers/46990
  { date: "2020-05-15", headline: "三菱UFJが前期決算を発表。今期の純利益目標は5,500億円",
    body: "", codes: ["8306"], importance: 2 },

  // https://www.mufg.jp/dam/pressrelease/2020/pdf/news-20201113-001_ja.pdf （会社の開示資料）
  // https://www.sbbit.jp/article/refers/46958
  { date: "2020-11-13", headline: "三菱UFJが今期の純利益目標を5,500億円から6,000億円に上方修正",
    body: "上期の実績が堅調だったため。与信関係費用の見通しは4,500億円から5,000億円に引き上げた。", codes: ["8306"], importance: 2 },

  /* ---------- KDDI（9433） ---------- */

  // https://www.bcnretail.com/market/detail/20201028_196735.html
  // https://www.soumu.go.jp/main_content/000716724.pdf （総務省の資料）
  { date: "2020-10-28", headline: "KDDIが、UQ mobileで月20GB・月額3,980円の新料金プランを発表",
    body: "2021年2月以降に提供する。同じ日にソフトバンクも20GBの新プランを発表した。", codes: ["9433"], importance: 2 },

  /* ---------- Zホールディングス（4689） ---------- */

  // https://www.itmedia.co.jp/news/article/2007/31/1200731139/
  // https://www.businessinsider.jp/article/217700/
  { date: "2020-07-31", headline: "Zホールディングスの4〜6月期決算は営業利益506億円（40.0%増）",
    body: "売上収益は2,738億円（14.8%増）。ZOZOの連結子会社化が寄与し、巣ごもり消費でネット通販も伸びた。", codes: ["4689"], importance: 2 },

  /* ===================== グループ4：情報・通信・電機・ネット ===================== */

  /* ---------- ソフトバンクグループ（9984） ---------- */

  // https://group.softbank/ja-JP/news/press/20200323 （会社の発表。3/13 の自社株買いの記載）
  { date: "2020-03-13", headline: "ソフトバンクグループが5,000億円の自社株買いを発表", body: "", codes: ["9984"], importance: 3 },

  // https://group.softbank/ja-JP/news/press/20200323 （会社の発表）
  // https://gamebiz.jp/news/262818
  { date: "2020-03-23", headline: "ソフトバンクグループが最大4.5兆円の保有資産を売却・資金化し、最大2兆円の自社株買いを行うと発表",
    body: "3月13日発表分と合わせた自社株買いは2.5兆円で、発行済み株式の45%にあたる。負債の削減にも充てる。", codes: ["9984"], importance: 3 },

  // https://www.businessinsider.jp/article/213067/
  // https://www.bcnretail.com/market/detail/20200518_173850.html
  { date: "2020-05-18", headline: "ソフトバンクグループの前期決算は9,616億円の最終赤字",
    body: "", codes: ["9984"], importance: 3 },

  // https://www.bcnretail.com/market/detail/20200914_190742.html
  // https://gendai.media/articles/-/75832
  { date: "2020-09-14", headline: "ソフトバンクグループが、英半導体設計のアームを米エヌビディアに最大400億ドルで売却すると発表",
    body: "現金とエヌビディア株で受け取る。2016年に約320億ドルで買収していた。", codes: ["9984"], importance: 3 },

  /* ---------- ソニー（6758） ---------- */

  // https://www.bcnretail.com/topics_detail9/20200519_173920.html
  // https://www.businessinsider.jp/article/213156/
  { date: "2020-05-19", headline: "ソニーが、上場子会社のソニーフィナンシャルHDを約4,000億円で完全子会社化すると発表",
    body: "1株2,600円でTOBを行う。2021年4月に社名を「ソニーグループ」に変える方針も示した。", codes: ["6758"], importance: 2 },

  // https://www.gamespark.jp/article/2020/09/17/102234.html
  // https://www.famitsu.com/news/202009/17205925.html
  { date: "2020-09-17", headline: "ソニーが、PlayStation 5を11月12日に発売すると発表。通常版は49,980円（税別）",
    body: "デジタル・エディションは39,980円（税別）。予約は9月18日から。", codes: ["6758"], importance: 2 },

  // https://www.sbbit.jp/article/refers/45743
  // https://www.asset-alive.com/news/?mode=show&seq=38868
  { date: "2020-10-28", headline: "ソニーが今期の営業利益予想を6,200億円から7,000億円に上方修正",
    body: "ゲーム分野の営業利益予想を2,400億円から3,000億円に引き上げた。", codes: ["6758"], importance: 3 },

  /* ---------- アドバンテスト（6857） ---------- */

  // https://www.sbbit.jp/article/refers/45785
  // https://www3.advantest.com/ja/investors/ir-library/pdf/J_BIZ_201029_note.pdf （会社の決算説明資料）
  { date: "2020-10-29", headline: "アドバンテストが今期の営業利益予想を450億円から525億円に上方修正",
    body: "4〜9月期の営業利益は309億円（5.9%減）。メモリー向けの試験装置の需要が堅調とみている。", codes: ["6857"], importance: 2 },

  /* ---------- サイバーエージェント（4751） ---------- */

  // https://gamebiz.jp/news/280021
  // https://www.businessinsider.jp/article/223150/
  { date: "2020-10-28", headline: "サイバーエージェントの9月期決算は営業利益338億円（9.9%増）",
    body: "ゲームとネット広告が堅調だった。「ABEMA」の赤字は縮小した。", codes: ["4751"], importance: 2 },

  /* ===================== グループ5：自動車・医薬品・鉄鋼・海運 ===================== */

  /* ---------- トヨタ自動車（7203） ---------- */

  // https://car.watch.impress.co.jp/docs/news/1251884.html
  // https://www.businessinsider.jp/article/212707/
  { date: "2020-05-12", headline: "トヨタ自動車が、今期の営業利益は5,000億円（約80%減）になる見通しを発表",
    body: "新型コロナの影響を織り込んだ。前期の決算と同時に発表した。", codes: ["7203"], importance: 3 },

  // https://www.sbbit.jp/article/refers/46302
  // https://monoist.itmedia.co.jp/mn/articles/2011/09/news036.html
  { date: "2020-11-06", headline: "トヨタ自動車が今期の営業利益予想を5,000億円から1兆3,000億円に上方修正",
    body: "新型コロナで落ち込んだ販売が急回復している。4〜9月期の営業利益は5,199億円。", codes: ["7203"], importance: 3 },

  /* ---------- 中外製薬（4519） ---------- */

  // https://www2.jpx.co.jp/disc/45190/140120200121448495.pdf （会社の開示資料）
  // https://nk.jiho.jp/article/153551
  { date: "2020-01-21", headline: "中外製薬が、1株を3株に分割すると発表",
    body: "効力発生日は7月1日。投資単位あたりの金額を下げて、株を買いやすくするため。", codes: ["4519"], importance: 1 },

  // https://www2.jpx.co.jp/disc/45190/140120200130453218.pdf （決算短信）
  // https://nk.jiho.jp/article/153551
  { date: "2020-01-30", headline: "中外製薬の2019年12月期決算は純利益1,575億円（70.4%増）",
    body: "", codes: ["4519"], importance: 2 },

  // https://nk.jiho.jp/article/150543
  // https://www.yakuji.co.jp/?p=78829
  { date: "2020-04-08", headline: "中外製薬が、関節リウマチなどの薬「アクテムラ」で、重症の新型コロナ肺炎を対象にした国内の臨床試験を行うと発表",
    body: "承認の取得を目指す第3相試験。親会社のロシュは海外で同様の試験を進めている。", codes: ["4519"], importance: 2 },

  /* ---------- 日本製鉄（5401） ---------- */

  // https://monoist.itmedia.co.jp/mn/spv/2002/10/news036.html
  // https://www.city.kure.lg.jp/uploaded/attachment/60589.pdf （呉市の資料）
  { date: "2020-02-07", headline: "日本製鉄が、減損などで約4,900億円の損失を計上する見通しと、呉製鉄所の全設備を休止する計画を発表",
    body: "製造業向けの鉄鋼需要の減少と、原料価格の高止まりが重なった。", codes: ["5401"], importance: 3 },
];
