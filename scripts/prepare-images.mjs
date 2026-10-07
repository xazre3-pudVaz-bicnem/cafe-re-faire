/**
 * 写真の準備。
 *   npm run images:prepare
 *
 * 店から届いた写真（assets/source-photos/…）から、サイトで使う写真（public/images/）と
 * SNS 用の横長画像（public/og/）を作る。
 *
 * 決まり
 *   ・使うのは、店から届いた実写だけ。素材サイトの写真や生成画像は足さない。
 *   ・人物（とくに子ども）と、車のナンバーが写っている部分は切り落とす。
 *   ・切り抜かない写真は、画質を落とさないよう元のファイルをそのまま写す。
 *   ・表示サイズごとの縮小と AVIF / WebP への変換は、next/image が行う（ここではしない）。
 *
 * 使わなかった写真
 *   line-04 … 窓の外の車のナンバーが写っている（同じ構図の line-02 を使う）
 *   line-05 / 07 / 08 … 同じ写真の重複（切り抜き済みの line-09 を使う）
 *   line-34 … 2026年10月の営業カレンダー（内容は文字で載せる）
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "assets", "source-photos", "line-album-2026-10-07");
const OUT_DIR = path.join(ROOT, "public", "images");
const OG_DIR = path.join(ROOT, "public", "og");

/**
 * src  … line-XX の番号
 * out  … 出力名（内容が分かる英語。画像検索にも使われる）
 * crop … 切り抜き（元写真の画素。left / top / width / height）
 * og   … SNS 用の横長画像も作るとき。position は切り抜く位置（sharp の gravity か { top } ）
 */
const JOBS = [
  // ---- 店内 ----
  { src: 2, out: "cafe-refaire-interior-01", og: { position: "centre" } },
  { src: 3, out: "cafe-refaire-interior-02", og: { top: 0.42 } },
  // 右下のごみ箱を外す
  { src: 10, out: "cafe-refaire-interior-03", crop: { left: 0, top: 0, width: 1477, height: 1010 }, og: { position: "north" } },
  { src: 1, out: "cafe-refaire-interior-04" },
  { src: 9, out: "cafe-refaire-counter", og: { top: 0.3 } },
  { src: 31, out: "cafe-refaire-wall-art", og: { top: 0.16 } },

  // ---- 外観 ----
  { src: 6, out: "cafe-refaire-blue-door", og: { top: 0.3 } },
  // 扉の前に立つ子どもを外し、表札とオリーブだけにする
  { src: 26, out: "cafe-refaire-entrance-sign", crop: { left: 545, top: 60, width: 563, height: 940 }, og: { top: 0.12 } },
  // 左端の扉のガラス越しに見える貼り紙を外す
  { src: 29, out: "cafe-refaire-olive-tree", crop: { left: 95, top: 0, width: 1013, height: 1477 }, og: { top: 0.2 } },
  { src: 25, out: "cafe-refaire-signboard", og: { top: 0.2 } },
  { src: 27, out: "cafe-refaire-parking-sign", og: { position: "centre" } },
  // 右端の車を外す
  { src: 28, out: "cafe-refaire-exterior", crop: { left: 0, top: 0, width: 1415, height: 1108 }, og: { position: "centre" } },

  // ---- ケーキ ----
  { src: 24, out: "cafe-refaire-cake-showcase-01", og: { top: 0.3 } },
  { src: 23, out: "cafe-refaire-cake-showcase-02" },
  { src: 17, out: "sweet-potato-cheesecake", og: { top: 0.36 } },
  { src: 18, out: "chocolat-berry-parfait", og: { top: 0.36 } },
  { src: 19, out: "tiramisu-mousse", og: { top: 0.36 } },
  { src: 20, out: "crumble-berry-gateau-chocolat", og: { top: 0.4 } },
  { src: 21, out: "caramel-cheese-terrine", og: { top: 0.42 } },
  { src: 22, out: "matcha-terrine", og: { position: "centre" } },

  // ---- プレート ----
  { src: 13, out: "plate-taco-rice", og: { position: "centre" } },
  { src: 14, out: "plate-roast-beef", og: { position: "centre" } },
  { src: 15, out: "plate-hamburg", og: { position: "centre" } },
  { src: 16, out: "plate-omurice", og: { position: "centre" } },
  { src: 30, out: "plate-chicken", og: { position: "centre" } },
  { src: 33, out: "pizza-tomato", og: { position: "centre" } },

  // ---- テイクアウト ----
  { src: 11, out: "takeout-bowls-01", og: { position: "centre" } },
  { src: 12, out: "takeout-bowls-02" },
];

const OG = { width: 1200, height: 630 };

async function makeOg(input, og, outFile) {
  const meta = await sharp(input).metadata();
  // 幅を 1200 に合わせ、指定の高さから 630 を切り出す
  const scale = OG.width / meta.width;
  const scaledH = Math.round(meta.height * scale);
  let pipeline = sharp(input).resize({ width: OG.width, kernel: "lanczos3" });
  if (scaledH > OG.height) {
    let top;
    if (typeof og.top === "number") top = Math.round((scaledH - OG.height) * og.top);
    else if (og.position === "north") top = 0;
    else if (og.position === "south") top = scaledH - OG.height;
    else top = Math.round((scaledH - OG.height) / 2);
    pipeline = pipeline.extract({ left: 0, top, width: OG.width, height: OG.height });
  } else {
    pipeline = sharp(input).resize({ width: OG.width, height: OG.height, fit: "cover", position: "centre" });
  }
  await pipeline.jpeg({ quality: 84, mozjpeg: true }).toFile(outFile);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(OG_DIR, { recursive: true });

  const rows = [];
  for (const job of JOBS) {
    const srcFile = path.join(SRC_DIR, `line-${String(job.src).padStart(2, "0")}.jpg`);
    if (!fs.existsSync(srcFile)) throw new Error(`元の写真がありません: ${srcFile}`);
    const outFile = path.join(OUT_DIR, `${job.out}.jpg`);

    const meta = await sharp(srcFile).metadata();
    const needsRotate = meta.orientation && meta.orientation !== 1;

    if (job.crop || needsRotate) {
      let p = sharp(srcFile).rotate();
      if (job.crop) p = p.extract(job.crop);
      await p.jpeg({ quality: 92, mozjpeg: true, chromaSubsampling: "4:4:4" }).toFile(outFile);
    } else {
      fs.copyFileSync(srcFile, outFile);
    }

    if (job.og) await makeOg(outFile, job.og, path.join(OG_DIR, `${job.out}.jpg`));

    const out = await sharp(outFile).metadata();
    rows.push(`${job.out.padEnd(34)} line-${String(job.src).padStart(2, "0")}  ${out.width}x${out.height}  ${(fs.statSync(outFile).size / 1024).toFixed(0)}KB${job.crop ? "  (切り抜き)" : ""}${job.og ? "  +og" : ""}`);
  }
  console.log(rows.join("\n"));
  console.log(`\n${JOBS.length} 枚を ${path.relative(ROOT, OUT_DIR)} に用意しました。`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
