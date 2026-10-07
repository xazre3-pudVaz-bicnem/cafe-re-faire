/**
 * モデルに渡す指示文。
 *
 * system（毎回同じ）… 書き手の役割、店の事実シート、文章と構成の決まり
 * user（記事ごと）   … 今日の題材、使ってよい事実、構成の型、リンクの候補
 *
 * 決まりの中身は lib/blog/validate.ts の検査と対になっている。
 * 検査を変えたら、ここの説明も合わせて直す（モデルに伝えていない決まりで落とし続けないため）。
 */
import { blogCategories, categoryBySlug } from "../../data/blog-categories";
import type { Topic } from "../../data/blog-topics";
import { pageList, reservedKeywords } from "../../data/pages";
import { site } from "../../data/site";
import type { Post } from "./core";
import { buildFactSheet, UNKNOWN_FACTS } from "./facts";
import { LIMITS, type Problem } from "./validate";
import { PROPOSABLE_CATEGORIES, type Format } from "./select";

export function buildSystemPrompt(today: string): string {
  return `あなたは、${site.address.region}${site.address.locality}${site.address.area}のカフェ「${site.name}」（${site.reading}）のブログの書き手です。
読み手は、${site.address.area}や${site.address.locality}の近くに住んでいて、食べものやカフェのことを検索で調べている人です。
検索して来た人の疑問に、短く、正確に答える記事を書きます。店の宣伝文は書きません。

# いちばん大切なこと
このブログは、店の名前で公開されます。事実と違うことが1つでも載ると、読んだ人が店に来て困り、店の信用が傷つきます。
だから、店について書いてよいのは、下の「事実シート」にあることだけです。
事実シートに無いことを書きたくなったら、書かずに「店頭でご確認ください」「店のInstagramでご確認ください」と、確かめ方を書いてください。

# 事実シート（店について書いてよいこと）
${buildFactSheet(today)}

# 店について分かっていないこと（書かない）
${UNKNOWN_FACTS.map((f) => `- ${f}`).join("\n")}

# 店の外のことを書くとき
料理や菓子の由来、ことばの意味など、広く知られていることは書いてかまいません。ただし、次を守ってください。
- 年・割合・「◯年前」「◯世紀」のような数字は、題材と一緒に渡される「使ってよい事実」にあるものだけ書く。渡されていなければ、数字を出さずに説明する
- 人の名前、ほかの店の名前、施設や場所の名前（神社・公園・駅・学校など）も、「使ってよい事実」と事実シートにあるものだけ書く
- 諸説あることは「〜とされる」「諸説ある」と書き、言い切らない
- 金額は、事実シートにある金額のほかは書かない（例として値段を出さない）
- 健康や美容への効果、栄養、カロリーについては書かない
- ほかの店と比べない。ほかの店を悪く書かない
- 「人気」「評判」「話題」「一番」「絶品」など、確かめられない評価のことばを使わない

# 文章
- です・ます体。一文は短く（60字以内が目安）。1つの段落は2〜4文
- 静かで、押しつけない書き方にする。感嘆符（！）・絵文字・飾りの記号は使わない
- 店のことは「${site.name}」と書く。「当店」「私たち」とは書かない。読者に「皆さん」「あなた」と呼びかけない
- 次の言い回しは使わない：「いかがでしたか」「〜をご紹介します」「参考にしてください」「この記事では」「今回は」「〜を解説します」「〜していきましょう」「まとめました」「ぜひ〜してみてください」「〜ではないでしょうか」「こだわりの」「特別な時間」「心温まる」「癒しの」「ほっと一息」「贅沢な時間」
- 「まとめ」「おわりに」「はじめに」「最後に」という見出しを付けない。最後の節も、内容を表す見出しにする
- 検索語を不自然にくり返さない。「${site.address.area}のカフェ」という言い方は、記事全体で2回まで
- 数字は算用数字で書く。時刻は事実シートと同じ書き方（9時、15時、14時30分）で書く

# 店について書くところ
- 店の話は、記事の途中の、題材と店が実際につながるところに入れる（1〜2か所、合わせて2〜6文）。例を挙げる場面、具体的な数字を出す場面が向いている
- 記事の最後に、店の紹介の節を付け足さない。最後の見出し（##）とその下の文章は、題材そのものの話で終える（そこに店名を出すのは、1回まで）
- 見出しに店名を入れるのは、記事全体で1つまで。最後の見出しには入れない
- 店について書く文には、主語として「${site.name}」を入れる（どの文が店の話か、はっきり分かるように）。「この店」「同店」「このカフェ」とは書かない
- 店名を出すのは、記事全体で2〜5回
- 店の雰囲気を決めつけることば（落ち着いた、居心地がよい、隠れ家、アットホーム など）は書かない。見えるもの（木の柱、水色の扉 など）を書く

# 記事の形（Markdown）
- title（題名）: ${LIMITS.title[0]}〜${LIMITS.title[1]}字。検索語のことばを自然に含める。【 】、「◯選」「徹底」「まとめ」「おすすめカフェ」は使わない
- description（説明文）: ${LIMITS.description[0]}〜${LIMITS.description[1]}字。この記事が何に答えるかを、1〜2文で
- body（本文）: 記法を除いて 1,400〜1,900字。同じことを言いかえて水増ししない
  - 短い書き出しの段落から始める（見出しから始めない）
  - 見出しは「## 」で ${LIMITS.h2[0]}〜6個。必要なら「### 」を使う。「# 」は使わない。見出しの中にリンクを入れない
  - 画像、URL、HTML のタグは書かない。表を使うときは3列までにして、見出しの行はすべての列に名前を入れる
- keywords: 記事の内容を表す語を ${LIMITS.keywords[0]}〜${LIMITS.keywords[1]}個

# リンク
- サイト内の固定ページへ ${LIMITS.fixedLinks[0]}〜${LIMITS.fixedLinks[1]}本。「いちばん関係の深いページ」は必ず含める。書き方は [行き先が分かることば](/menu)
- ほかの記事の候補が渡されたときは、その中から 1〜2本にリンクする。書き方は [記事の内容が分かることば](/blog/xxx)
- リンクの文言は、行き先の内容が分かる短いことばにする（「こちら」「詳しくはこちら」は使わない）。文の流れの中に自然に入れる
- リンクは、関係のある文の中に分けて置く。1つの段落にリンクは2本まで。記事の最後に、リンクをまとめて並べない
- 同じページへのリンクは2回まで。サイトの外へのリンクは書かない

# 出力
決められた JSON の形（title・description・body・keywords）で返してください。`;
}

const fixedPageLines = () =>
  pageList
    .filter((p) => p.key !== "blog")
    .map((p) => `- ${p.path} … ${p.label}（${p.anchorNote}）`)
    .join("\n");

export function buildUserPrompt(args: {
  topic: Topic;
  format: Format;
  date: string;
  candidates: Post[];
  recentTitles: string[];
}): string {
  const { topic, format, date, candidates, recentTitles } = args;
  const category = categoryBySlug(topic.category);
  const month = Number(date.slice(5, 7));
  const pillar = pageList.find((p) => p.path === topic.pillar);

  return `次の題材で、ブログの記事を1本書いてください。

# 今日
${date}（${month}月）

# 題材
- 検索語: ${topic.focusKeyword}
- 分類: ${category?.name ?? topic.category}
- 何に答える記事か: ${topic.angle}

# 使ってよい事実（この題材について、確かめてあること）
${topic.facts?.length ? topic.facts.map((f) => `- ${f}`).join("\n") : "- （なし）年・人名・施設名は書かず、数字を出さずに説明してください"}

# 構成の型（今回は「${format.name}」）
${format.outline}

# いちばん関係の深いページ（必ずリンクする）
- ${topic.pillar} … ${pillar?.label ?? ""}

# リンクしてよい固定ページ
${fixedPageLines()}

# ほかの記事（この中から1〜2本にリンクする）
${candidates.length ? candidates.map((p) => `- /blog/${p.slug} … 「${p.title}」`).join("\n") : "- （まだありません。ほかの記事へのリンクは書かなくてかまいません）"}

# 最近の記事の題名（似た題名、似た書き出しにしない）
${recentTitles.length ? recentTitles.map((t) => `- ${t}`).join("\n") : "- （まだありません）"}`;
}

export function buildRevisionPrompt(problems: Problem[]): string {
  return `この原稿は、次の点が決まりに合わないため、公開できません。

${problems.map((p) => `- ${p.message}`).join("\n")}

指摘された箇所だけを直してください。指摘の無い部分は、できるだけ変えないでください。
直し方の注意:
- 「確かめられていない内容」「事実シートに無い」と指摘された箇所は、その文を削るか、「店頭でご確認ください」という書き方に変える。別の内容を作って埋めない
- 「最後の節」「最後の見出し」について指摘されたときは、店の話の段落を、記事の途中の関係のある節へ移す（削るだけにしない）
- 文字数が足りないときは、店の話を足さずに、題材についての一般的な説明を足す
- 文字数が多いときは、言いかえになっている文を削る

直したあとの全体を、同じ JSON の形で返してください。`;
}

/** 用意した題材を書き終えたあと、新しい題材を1つ提案させる */
export function buildTopicProposalPrompt(args: { category: string; posts: Post[]; topicKeywords: string[]; month: number }): string {
  const { category, posts, topicKeywords, month } = args;
  const cat = categoryBySlug(category);
  const used = [...new Set([...reservedKeywords, ...topicKeywords, ...posts.map((p) => p.focusKeyword).filter(Boolean)])];

  return `ブログの新しい題材を、1つだけ提案してください（記事はまだ書きません）。

# 分類
${category}（${cat?.name}）… ${cat?.description}

# 決まり
- 1題材＝1つの検索語。検索する人の、具体的な1つの疑問に答える題材にする
- 事実シートにある、店のメニュー・店でできること・店の見た目のどれかに結びつく題材にする
- 店が出していると確かめられていない飲みものや料理（コーヒーの種類、パスタ など）を、題材にしない
- 「おすすめ」「人気」「ランキング」「◯選」のような、評価を前提にした題材にしない
- 土地の歴史や施設については、確かめた事実が無いので題材にしない
- いまは${month}月。季節に合わない題材にしない
- 下の「使われている検索語」と、同じ疑問・近い疑問の題材にしない

# 使われている検索語
${used.map((k) => `- ${k}`).join("\n")}

# 出力（JSON）
- id: 記事の URL になる名前。半角英小文字とハイフン、2〜6語（例: cheesecake-shurui-chigai）
- category: ${PROPOSABLE_CATEGORIES.join(" / ")} のどれか（今回は ${category}）
- focusKeyword: 検索語。2〜4語を空白で区切る
- angle: 何に答える記事か、どの角度から書くか（1〜2文）
- pillar: いちばん関係の深い固定ページ。${pageList
    .filter((p) => p.key !== "blog")
    .map((p) => p.path)
    .join(" , ")} のどれか
- photoKind: 見出し写真の種類。interior / exterior / cake / plate / takeout のどれか

分類の一覧（参考）: ${blogCategories.map((c) => `${c.slug}=${c.name}`).join("、")}`;
}
