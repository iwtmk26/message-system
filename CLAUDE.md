# 伝言メモ

社内の電話の伝言を登録し、Teams に通知する Web システム。画面は `frontend/`（React + TypeScript + Vite）、API は `backend/message-api/`（Java の Lambda）、AWS 構成は `terraform/`（本番）と `terraform-test/`（テスト）。
作業する PC は Windows（PowerShell）。

## 本番に触れない（最重要）

- IMPORTANT: 本番の AWS を変える操作は、AI は実行しない。`terraform apply`・`terraform destroy`・`terraform import`、`aws s3 sync`・`aws s3 rm`、`aws cloudfront create-invalidation`、本番テーブル（`Messages`・`Members`・`NuisanceNumbers`）への書き込み・削除が当たる。必要なときは、コマンドを示して担当者に頼む。
- 本番用の AWS プロファイル `shift-prod` を使うコマンドは実行しない。
- 動作確認は、仮データ（`npm run dev`、設定なし）か、テスト環境（`terraform-test/`、テーブル名に `-test`、通知先は「99_テスト」）で行う。
- `terraform-test/terraform.tfstate` は Git に載らず、この PC にしかない。消さない。

## 確認コマンド（変更したら、該当するものを実行して結果を示す）

- 画面の型チェック: `npx tsc -b --noEmit`（`frontend/` で）
- 画面の lint: `npx eslint .`（`frontend/` で）。既存のエラーが1件ある（`RegistrationPage.tsx` の effect 内の setState）。それ以外のエラーを増やさない
- 画面のビルド: `npm run build`（`frontend/` で）
- API のテスト: `mvn test`（`backend/message-api/` で）
- Terraform の文法: `terraform validate`（`terraform/`・`terraform-test/` で）

## Git

- `main` に直接コミットしない。ブランチを作り、プルリクエストにする。マージは担当者が行う。
- コミットのメッセージは日本語で、何を変えたかを1行目に書く。

## 文書

- 正本は `docs/` の Markdown。`docs/excel/` の Excel は、`docs/tools/md2xlsx.js` で Markdown から作る（Excel だけを直さない）。
- 確認していないことは「未確認」、推測は「推測」と書く。テストの結果は、方法と日付を添える（`docs/テスト項目書.md` の書き方に合わせる）。
- 仕様・画面を変えたら、`docs/仕様書.md` と `docs/テスト項目書.md` も直す。

## 落とし穴

- 既存の伝言 API（`Handler.java`）は、エラーでも HTTP 200 で文字列を返す。迷惑番号 API（`NuisanceApi.java`）は正しいステータスを返す。
- 「電話先」は専用の項目がなく、本文の1行目に `【電話先】会社名` として入る（`frontend/src/messageFormat.ts`）。
- `backend/message-api/` の中の `package.json`・`src/*.tsx`・`terraform/` は古い残骸で、使っていない。
- AWS コンソールは、東京リージョン（ap-northeast-1）にしないと資源が見えない。
- 詳しい手順は `README.md` と `docs/運用手順.md`、リリースは `docs/リリース手順書.md`。
