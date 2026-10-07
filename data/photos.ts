/**
 * 写真（画像つき）。画面で使うのはこちら。
 *
 * 静的 import にしておくと、幅と高さが自動で入り、読み込み中に画面がずれない（CLS が起きない）。
 * 説明文（alt）や種類は data/photo-meta.ts にある。写真を足すときは、両方に同じキーで足す。
 */
import type { StaticImageData } from "next/image";
import { photoMeta, photoOgPath, photoPath, type PhotoKey, type PhotoKind } from "./photo-meta";

import interior01 from "@/public/images/cafe-refaire-interior-01.jpg";
import interior02 from "@/public/images/cafe-refaire-interior-02.jpg";
import interior03 from "@/public/images/cafe-refaire-interior-03.jpg";
import interior04 from "@/public/images/cafe-refaire-interior-04.jpg";
import counter from "@/public/images/cafe-refaire-counter.jpg";
import wallArt from "@/public/images/cafe-refaire-wall-art.jpg";
import blueDoor from "@/public/images/cafe-refaire-blue-door.jpg";
import entranceSign from "@/public/images/cafe-refaire-entrance-sign.jpg";
import oliveTree from "@/public/images/cafe-refaire-olive-tree.jpg";
import signboard from "@/public/images/cafe-refaire-signboard.jpg";
import parkingSign from "@/public/images/cafe-refaire-parking-sign.jpg";
import exterior from "@/public/images/cafe-refaire-exterior.jpg";
import showcase01 from "@/public/images/cafe-refaire-cake-showcase-01.jpg";
import showcase02 from "@/public/images/cafe-refaire-cake-showcase-02.jpg";
import cakeSweetPotato from "@/public/images/sweet-potato-cheesecake.jpg";
import cakeChocolatBerry from "@/public/images/chocolat-berry-parfait.jpg";
import cakeTiramisu from "@/public/images/tiramisu-mousse.jpg";
import cakeGateau from "@/public/images/crumble-berry-gateau-chocolat.jpg";
import cakeCaramel from "@/public/images/caramel-cheese-terrine.jpg";
import cakeMatcha from "@/public/images/matcha-terrine.jpg";
import plateTacoRice from "@/public/images/plate-taco-rice.jpg";
import plateRoastBeef from "@/public/images/plate-roast-beef.jpg";
import plateHamburg from "@/public/images/plate-hamburg.jpg";
import plateOmurice from "@/public/images/plate-omurice.jpg";
import plateChicken from "@/public/images/plate-chicken.jpg";
import pizza from "@/public/images/pizza-tomato.jpg";
import takeout01 from "@/public/images/takeout-bowls-01.jpg";
import takeout02 from "@/public/images/takeout-bowls-02.jpg";

export type { PhotoKey, PhotoKind };

export type Photo = {
  image: StaticImageData;
  alt: string;
  kind: PhotoKind;
  /** public/ 配下の変わらない URL（構造化データ用） */
  path: string;
  /** SNS 用の横長画像（1200×630） */
  og?: string;
};

const images: Record<PhotoKey, StaticImageData> = {
  interior01,
  interior02,
  interior03,
  interior04,
  counter,
  wallArt,
  blueDoor,
  entranceSign,
  oliveTree,
  signboard,
  parkingSign,
  exterior,
  showcase01,
  showcase02,
  cakeSweetPotato,
  cakeChocolatBerry,
  cakeTiramisu,
  cakeGateau,
  cakeCaramel,
  cakeMatcha,
  plateTacoRice,
  plateRoastBeef,
  plateHamburg,
  plateOmurice,
  plateChicken,
  pizza,
  takeout01,
  takeout02,
};

export const photos = Object.fromEntries(
  (Object.keys(photoMeta) as PhotoKey[]).map((key) => [
    key,
    {
      image: images[key],
      alt: photoMeta[key].alt,
      kind: photoMeta[key].kind,
      path: photoPath(key),
      og: photoOgPath(key),
    } satisfies Photo,
  ]),
) as Record<PhotoKey, Photo>;
