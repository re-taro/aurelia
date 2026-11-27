# e2e

Playwright で、ブログの見た目 (VRT) と動き (遷移・目次・リンクカード・API・フィード) を確かめる。依存の更新 (Renovate) を automerge しても、表示が崩れたり機能が壊れたりしていないことを CI で保証するのが目的。

- 見た目: ページごとにスクリーンショットを撮り、コミットしたベースラインと比べる。撮るたびに横へのはみ出しも確かめる
- 動き: ClientRouter の遷移、目次の開閉、リンクカードの OGP 取得、背景の WebGL、404、`/api/og`・RSS・サイトマップ・OG 画像・meta
- エラー: ページで捕まらなかった例外・`console.error`・読み込めなかったリソース・外部オリジンへのリクエストは、それだけでテストを失敗させる

## 実行

Docker の中で走る。イメージを作るときに依存のインストールと e2e 用のビルドもするので、必要なのは Docker だけ。

```sh
pnpm run e2e                                 # 全件
pnpm run e2e e2e/scenarios/post.spec.ts      # ファイルで絞る
pnpm run e2e --project=Chrome-SP -g '目次'   # プロジェクトやタイトルで絞る
pnpm run e2e:update                          # ベースラインを撮り直す
```

失敗したテストの trace・差分画像は `e2e/test-results/`、HTML レポートは `e2e/playwright-report/` に出る (`pnpm exec playwright show-report e2e/playwright-report`)。CI では失敗したときにどちらも `playwright-report` という artifact に上がる。

### 手元のブラウザで動かす

テストを書くときや失敗を調べるときは、Docker を通さずに手元の Chromium で動かせる。毎回 e2e 用にビルドし直してから走る。

```sh
pnpm exec playwright install chromium        # 初回だけ
pnpm run e2e:local                           # 引数は pnpm run e2e と同じ
pnpm run e2e:ui                              # UI モード
```

手元の描画は OS ごとに違うので、スクリーンショットは `__screenshots__/local/` (git の管理外) と比べる。最初に `pnpm run e2e:local --update-snapshots` で作る。

## 構成

```
e2e/
├── playwright.config.ts  プロジェクト・webServer・スナップショットの置き場所
├── Dockerfile            実行環境 (Playwright の公式イメージ + 依存 + e2e 用のビルド)
├── compose.yml           コンテナの起動と e2e/ のマウント
├── definitions.ts        ポート・ディレクトリ・固定の記事の ID
├── contents/             固定の記事。e2e 用のビルドは contents/ の代わりにこれを読む
├── fixtures/             テストから使うフィクスチャ (test.ts が入口)
├── pages/                画面ごとのページオブジェクト
├── scenarios/            テスト本体。http/ はブラウザを使わない応答の検査
├── server/origin.ts      リンクカードの取得先の代わりに応答するサーバー
├── resources/            スタブの応答 (origin/)・ファビコン・撮影時のスタイル
├── utils/                エラーの収集・通信の制御・待ち合わせ・はみ出しの検査
└── __screenshots__/      ベースライン (docker/ をコミットする。local/ は手元用)
```

### プロジェクト

| 名前        | 端末                    | 対象                                        |
| ----------- | ----------------------- | ------------------------------------------- |
| `HTTP`      | なし (request / page)   | `scenarios/http/`                           |
| `Chrome-PC` | Desktop Chrome (1280px) | それ以外                                    |
| `Chrome-SP` | Pixel 7 (412px)         | それ以外。ブレークポイントは 560px しかない |

### 動かすもの

`webServer` が 2 つ起動する。

- `astro preview --outDir dist-e2e`: 本番と同じく workerd の上で動かす。`/api/og` の HTMLRewriter や Images binding もここを通る
- `node e2e/server/origin.ts`: リンクカードの取得先の代わり

e2e 用のビルド (`pnpm run e2e:build`) は `AURELIA_CONTENTS_DIR=./e2e/contents` で記事を差し替え、`dist-e2e/` に出す。通常の `dist/` は上書きしない。

## 安定させるための仕組み

| 揺れの原因                             | 対処                                                                                                        |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 記事の追加・編集                       | 実際の記事ではなく `e2e/contents/` の固定の記事でビルドする。記事を書いてもベースラインは変わらない         |
| OS やマシンごとの描画の違い            | 実行環境を Docker のイメージ (digest で固定) にそろえ、その中で撮ったものだけをベースラインにする           |
| 背景のクラゲ (WebGL・乱数・時間で動く) | 撮るときだけ `resources/screenshot.css` で隠す。動いていることは `background.spec.ts` で別に確かめる        |
| リンクカードの取得先 (外部のサイト)    | ブラウザの `/api/og?url=…` の取得先を、`server/origin.ts` に差し替える。`/api/og` 自体は本物が応答する      |
| リンクカードのファビコン (Google)      | `resources/favicon.png` を返す。それ以外の外部オリジンへのリクエストは止めて、テストを失敗させる            |
| `/api/og` のキャッシュ (`.wrangler/`)  | スタブの URL に実行ごとの ID (`E2E_RUN_ID`) を入れ、前の実行の応答を使わせない                              |
| `client:visible` の島 (リンクカード)   | 撮る前にすべて画面に入れて hydrate させ、通信・フォント・画像のデコードが終わるまで待つ (`utils/settle.ts`) |
| View Transition                        | 遷移が終わるのを待ってから次の操作をする (`waitForTransition`)。途中で次の遷移を始めると例外になる          |

## テストの書き方

`fixtures/test.ts` から `test` と `expect` を import する。画面の要素と操作は `pages/` のページオブジェクトにまとめ、ロケータはロールとラベルで引く。

```ts
import { POSTS } from '../definitions';
import { expect, test } from '../fixtures/test';

test('コードブロックと GitHub のパーマリンクを表示する', async ({ capture, postPage }) => {
	await postPage.goto(POSTS.code.id);

	await expect(postPage.codeBlocks).toHaveCount(8);
	await capture('code');
});
```

### スクリーンショット

`capture(name)` で撮る。島の hydrate・通信・フォント・画像を待ってから撮り、撮る前に横へのはみ出しがないことも確かめる。

```ts
await capture('default'); // ページ全体
await capture('toc-open', { fullPage: false }); // 画面に見えている範囲だけ
await capture('card', { target: postPage.linkCards.first() }); // 要素だけ
```

- 名前は spec ファイルの中で重複させない (`__screenshots__/docker/<プロジェクト>/<spec>-snapshots/<名前>.png`)
- 撮る前に、その状態になったことを `expect` で確かめる

### エラー

意図してエラーを起こすときだけ、`allowedErrors` で許す。

```ts
test.use({ allowedErrors: [NOT_FOUND_RESPONSE] });
```

### 記事の要素を足したとき

Markdown の新しい書き方やコンポーネントを記事で使い始めたら、`contents/` の固定の記事にも足して、ベースラインを撮り直す。固定の記事にない要素は、VRT では守られない。

## ベースライン

コミットするのは、コンテナの中で撮った `__screenshots__/docker/` だけ。arm64 (Apple Silicon) と amd64 (CI) のコンテナの差は比較の許容範囲に収まる。

- 見た目を意図して変えたときは `pnpm run e2e:update` で撮り直し、差分を目で確かめてからコミットする
- 意図しない差分が出たら、`e2e/playwright-report/` で期待・実際・差分の 3 枚を見比べる
- `@playwright/test` を上げるときは `Dockerfile` の Playwright のイメージも同じ版にする (Renovate はまとめて上げる)。ブラウザが変わるので、差分が出たら撮り直す
