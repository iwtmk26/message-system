# 伝言メモ

社内で受けた電話の伝言を登録し、Teams のチャネルへメールで通知する Web システム。
迷惑電話の番号を照合する画面も持つ（現在はブラウザ内の仮データ版。`docs/nuisance-feature.md`）。

> この README は 2026-10-09 の引継ぎ時に、コードを読んで書き起こしたもの。
> 「未確認」と書いた箇所は、前任者への確認が済むまで推測を含む。

## 構成

```
ブラウザ ─ CloudFront ─ S3（画面）
   └─ API Gateway（HTTP API）─ Lambda（Java）
                                ├─ DynamoDB: Messages / Members
                                └─ SES → Teams チャネルのメールアドレス（通知）
```

| フォルダ | 中身 |
|---|---|
| `frontend/` | 画面。React + TypeScript + Vite |
| `backend/message-api/` | API。Java の Lambda 関数（`src/main/java/com/message/Handler.java` に全処理） |
| `terraform/` | AWS 資源の定義（本番用と推測。未確認） |
| `docs/` | 機能説明・テスト結果 |
| `seleniuum/` | 画面操作の手動確認スクリプト（本番 URL を開く） |

`backend/message-api/` の中にある `package.json`・`src/*.tsx`・`terraform/` は古いコピーで、使っていない（未確認）。

## API

`Handler.java` が API Gateway の `routeKey` で処理を振り分ける。

| ルート | 処理 |
|---|---|
| `GET /members` | 社員一覧（伝言先に使われた回数が多い順） |
| `GET /messages` | 伝言一覧（新しい順に最大50件） |
| `GET /messages/{messageId}` | 伝言1件 |
| `DELETE /messages?messageId=...` | 伝言削除 |
| `POST /messages` | 伝言登録と Teams への通知 |

認証はかかっていない。

## データ（DynamoDB）

| テーブル | キー | 項目 |
|---|---|---|
| `Messages` | `messageId` | `messageBody`, `receiverName`, `destination`, `registeredAt`（JST の文字列） |
| `Members` | `memberId` | `memberName`, `displayName`（任意）, `fromEmail`（任意） |

- 電話先（会社名）は専用項目がなく、本文の1行目に `【電話先】会社名` として入る（`frontend/src/messageFormat.ts`）。
- `receiverName`（受電者）と `destination`（伝言先）には、`Members` の `memberName` がそのまま入る。

## 必要なもの

| ツール | 確認済みの版（2026-10-09 時点のこのPC） |
|---|---|
| Java（JDK） | 21 |
| Maven | 3.9 |
| Node.js / npm | 24 / 11 |
| Terraform | 1.16 |
| AWS CLI | 2 |

AWS へのデプロイには、このシステムの AWS アカウントの認証情報が別途必要。

## 画面をローカルで動かす

```
cd frontend
```

```
npm install
```

```
npm run dev
```

ブラウザで http://localhost:5173 を開く。

- `npm run dev` のときは本番 API に接続せず、ブラウザ内の仮データで動く（画面上部に「テストモード」と出る）。Teams への通知も送られない。
- テスト用 API に繋ぐときは、`frontend/.env.development.local` に `VITE_API_BASE_URL=<テスト用APIのURL>` と書く（Git には載らない。例は `frontend/.env.example`）。画面上部に黄色い帯が出る。テスト用 API の作り方は `docs/環境分離設計.md` と `terraform-test/README.md`。
- `npm run dev` では本番 API には繋がらない（本番の URL を書いても仮データになる）。本番に繋がるのは `npm run build` で作った画面だけ。

チェック：

```
npx tsc -b --noEmit
```

```
npx eslint .
```

## ビルド

画面（`frontend/dist/` に出力）：

```
cd frontend
```

```
npm run build
```

API（`backend/message-api/target/message-api-1.0-SNAPSHOT.jar` に出力）：

```
cd backend/message-api
```

```
mvn package
```

## デプロイ

**本番環境が変わる操作。実行前に必ず `terraform plan` で差分を確認する。**

### API（Lambda・API Gateway・DynamoDB など）

先に API の jar をビルドしておく（Terraform が `../backend/message-api/target/` の jar を読む）。

```
cd terraform
```

```
terraform init
```

```
terraform plan
```

```
terraform apply
```

注意：Terraform の state はリポジトリに含まれていない。state が手元にない状態で `apply` すると、本番に既にある資源を新規に作ろうとして失敗する。state の所在は前任者に確認中（未確認）。

### 画面（S3・CloudFront）

手順は文書化されていなかった。次の手順と推測している（未確認）。

```
aws s3 sync frontend/dist s3://message-system-frontend --delete
```

```
aws cloudfront create-invalidation --distribution-id <ディストリビューションID> --paths "/*"
```

## 設定の置き場所

| 項目 | 場所 |
|---|---|
| API の URL | `frontend/src/api.ts`（直書き） |
| 通知先の Teams メールアドレス | `terraform/main.tf` の Lambda 環境変数 `TEAMS_EMAIL` |
| 送信元メールアドレス（既定） | 同 `FROM_EMAIL`。SES で検証済みである必要がある |
| 社員ごとの送信元 | `Members` テーブルの `fromEmail`・`displayName` |
| 完了画面の Teams チャネルへのリンク | `frontend/src/pages/CompletionPage.tsx` |
| Lambda の実行ロール | Terraform の外（AWS コンソールで作成）。名前は `terraform/main.tf` を参照 |

認証情報（AWS のキーなど）はリポジトリに置かない。`.env`・`*.tfstate`・`*.tfvars` は `.gitignore` で除外済み。

## 運用

`docs/運用手順.md` を参照。
