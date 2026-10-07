/**
 * 写真の登録簿（文字の情報だけ）。
 *
 * ・使うのは、店から届いた実写だけ（scripts/prepare-images.mjs が public/images に用意する）。
 * ・alt には「写っているもの」を書く。確かめられていない料理名や材料は書かない。
 *   検索語を並べる場所ではない。
 * ・kind は、ブログ記事の見出し写真を選ぶときに使う（内容と関係のない写真を付けないため）。
 * ・画像そのものの import は data/photos.ts にある。ここには置かない
 *   （自動投稿のスクリプトは画像を読み込めないので、文字の情報だけを分けてある）。
 */
export type PhotoKind = "interior" | "exterior" | "cake" | "plate" | "takeout";

export type PhotoMeta = {
  /** public/images/ のファイル名（拡張子なし） */
  file: string;
  alt: string;
  kind: PhotoKind;
  /** SNS 用の横長画像（public/og/）があるか。無い写真は、記事の見出し写真に選ばない */
  og: boolean;
};

export const photoMeta = {
  // ---- 店内 ----
  interior01: {
    file: "cafe-refaire-interior-01",
    alt: "Cafe Re faireの店内。木の柱と観葉植物をはさんで、テーブル席が並ぶ",
    kind: "interior",
    og: true,
  },
  interior02: {
    file: "cafe-refaire-interior-02",
    alt: "古材風の板を張った壁の下に、木の柱とテーブル席が続く店内",
    kind: "interior",
    og: true,
  },
  interior03: {
    file: "cafe-refaire-interior-03",
    alt: "窓ぎわのテーブル席と、水のポットを置いた丸いガラスのテーブル",
    kind: "interior",
    og: true,
  },
  interior04: {
    file: "cafe-refaire-interior-04",
    alt: "木の柱と、壁ぎわのテーブル席を斜めから見た店内",
    kind: "interior",
    og: false,
  },
  counter: {
    file: "cafe-refaire-counter",
    alt: "小さな鉢植えを並べた白いカウンター。奥に木の柱とテーブル席が見える",
    kind: "interior",
    og: true,
  },
  wallArt: {
    file: "cafe-refaire-wall-art",
    alt: "グレーの壁に飾られた、コーヒーカップの線画のオブジェ",
    kind: "interior",
    og: true,
  },

  // ---- 外観 ----
  blueDoor: {
    file: "cafe-refaire-blue-door",
    alt: "グレーの石張りの外壁と、アイアンの飾りがついた水色の扉",
    kind: "exterior",
    og: true,
  },
  entranceSign: {
    file: "cafe-refaire-entrance-sign",
    alt: "入口の白い壁に掛かる「Cafe Re faire」の表札と、オリーブの鉢植え",
    kind: "exterior",
    og: true,
  },
  oliveTree: {
    file: "cafe-refaire-olive-tree",
    alt: "入口のわきに置かれたオリーブの鉢植えと、白い壁に落ちる葉の影",
    kind: "exterior",
    og: true,
  },
  signboard: {
    file: "cafe-refaire-signboard",
    alt: "黒い外壁に掛かる、水色の「Cafe Re faire カフェ ルフェール」の看板",
    kind: "exterior",
    og: true,
  },
  parkingSign: {
    file: "cafe-refaire-parking-sign",
    alt: "外壁の水色の看板。店名の下に、駐車場の方向を示す矢印とPのマーク",
    kind: "exterior",
    og: true,
  },
  exterior: {
    file: "cafe-refaire-exterior",
    alt: "Cafe Re faireの外観。グレーと黒の外壁の角に、水色の看板が掛かる",
    kind: "exterior",
    og: true,
  },

  // ---- ケーキ ----
  showcase01: {
    file: "cafe-refaire-cake-showcase-01",
    alt: "ケーキのショーケース。手書きの値札と、6種類のケーキが並ぶ",
    kind: "cake",
    og: true,
  },
  showcase02: {
    file: "cafe-refaire-cake-showcase-02",
    alt: "ショーケースの中のチーズケーキとテリーヌ。黒い値札に品名と価格",
    kind: "cake",
    og: false,
  },
  cakeSweetPotato: {
    file: "sweet-potato-cheesecake",
    alt: "黒い石のプレートにのせたスイートポテトチーズケーキ。クリームとミントを添えて",
    kind: "cake",
    og: true,
  },
  cakeChocolatBerry: {
    file: "chocolat-berry-parfait",
    alt: "ショコラベリーパルフェ。チョコレートの層にベリーとクッキー、赤いベリーのソース",
    kind: "cake",
    og: true,
  },
  cakeTiramisu: {
    file: "tiramisu-mousse",
    alt: "ティラミスムース。ココアをふった白いムースと、チョコレートのソース",
    kind: "cake",
    og: true,
  },
  cakeGateau: {
    file: "crumble-berry-gateau-chocolat",
    alt: "クランブルベリーガトーショコラ。いちごとブルーベリー、クリームを添えて",
    kind: "cake",
    og: true,
  },
  cakeCaramel: {
    file: "caramel-cheese-terrine",
    alt: "キャラメルチーズテリーヌ。キャラメルソースとベリーを添えた一皿",
    kind: "cake",
    og: true,
  },
  cakeMatcha: {
    file: "matcha-terrine",
    alt: "抹茶テリーヌ。抹茶をふったクリームとベリーを添えて",
    kind: "cake",
    og: true,
  },

  // ---- プレート ----
  plateTacoRice: {
    file: "plate-taco-rice",
    alt: "タコライスのプレート。アボカドとトマト、サラダ、フライドポテト",
    kind: "plate",
    og: true,
  },
  plateRoastBeef: {
    file: "plate-roast-beef",
    alt: "ローストビーフのプレート。ごはんとソース、紫キャベツのサラダ",
    kind: "plate",
    og: true,
  },
  plateHamburg: {
    file: "plate-hamburg",
    alt: "目玉焼きをのせたハンバーグのプレート。ごはんとサラダ",
    kind: "plate",
    og: true,
  },
  plateOmurice: {
    file: "plate-omurice",
    alt: "ソースをかけたオムライスのプレート。サラダ添え",
    kind: "plate",
    og: true,
  },
  plateChicken: {
    file: "plate-chicken",
    alt: "刻んだナッツをのせたチキンのプレート。ごはん、フライドポテト、サラダ",
    kind: "plate",
    og: true,
  },
  pizza: {
    file: "pizza-tomato",
    alt: "トマトをのせた丸いピザ。8つに切り分けてある",
    kind: "plate",
    og: true,
  },

  // ---- テイクアウト ----
  takeout01: {
    file: "takeout-bowls-01",
    alt: "テイクアウトの丼3種。紙の器に、タコライス、チキン、ハンバーグ",
    kind: "takeout",
    og: true,
  },
  takeout02: {
    file: "takeout-bowls-02",
    alt: "店名のシールを貼った、テイクアウトの丼3つ",
    kind: "takeout",
    og: false,
  },
} as const satisfies Record<string, PhotoMeta>;

export type PhotoKey = keyof typeof photoMeta;

export const photoKeys = Object.keys(photoMeta) as PhotoKey[];

export function isPhotoKey(key: string): key is PhotoKey {
  return Object.prototype.hasOwnProperty.call(photoMeta, key);
}

/** public/ 配下の変わらない URL（構造化データ用） */
export function photoPath(key: PhotoKey): string {
  return `/images/${photoMeta[key].file}.jpg`;
}

/** SNS 用の横長画像の URL。無ければ undefined */
export function photoOgPath(key: PhotoKey): string | undefined {
  return photoMeta[key].og ? `/og/${photoMeta[key].file}.jpg` : undefined;
}
