# GKE 外部 API テスト結果

テスト日時: 2026-03-20
外部 IP: `http://34.149.213.223`
LLM プロバイダ: Vertex AI (gemini-2.5-flash) via Workload Identity

## テスト結果サマリー

| カテゴリ | 合計 | OK | NG | 備考 |
|---|---|---|---|---|
| ヘルスチェック | 2 | 2 | 0 | |
| Auth Service | 4 | 4 | 0 | |
| User Service | 2 | 2 | 0 | |
| Workspace Service | 5 | 4 | 1 | UpdateWorkspace で UUID パースエラー |
| Channel Service | 7 | 7 | 0 | |
| Message Service | 5 | 4 | 1 | UpdateMessage で UUID パースエラー |
| Thread Service | 1 | 0 | 1 | GetThread で UUID パースエラー |
| Reaction Service | 3 | 3 | 0 | |
| File Service | 1 | 0 | 1 | IAM 権限不足 (signBlob) |
| AI Agent | 6 | 6 | 0 | Vertex AI 経由で正常動作 |
| **合計** | **36** | **32** | **4** | |

---

## ヘルスチェック

| エンドポイント | メソッド | ステータス | レスポンス |
|---|---|---|---|
| `/health` | GET | **OK** | `{"status":"ok"}` |
| `/ready` | GET | **OK** | `{"status":"ready"}` |

---

## Auth Service

| エンドポイント | ステータス | 備考 |
|---|---|---|
| `SignUp` | **OK** | ユーザー作成成功、accessToken + refreshToken 発行 |
| `LogIn` | **OK** | 認証成功、トークン発行 |
| `RefreshToken` | **OK** | 新しい accessToken 発行 |
| `Logout` | **OK** | `{}` 返却、セッション終了 |

### SignUp レスポンス例

```json
{
  "user": {
    "id": "5ef4c461-...",
    "email": "apitest@example.com",
    "displayName": "API Test User",
    "metadata": { "createdAt": "...", "updatedAt": "..." }
  },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresAt": "2026-03-27T..."
}
```

---

## User Service

| エンドポイント | ステータス | 備考 |
|---|---|---|
| `GetMe` | **OK** | `displayName`, `email` 正常取得 |
| `UpdateProfile` | **OK** | プロフィール名更新成功 |

---

## Workspace Service

| エンドポイント | ステータス | 備考 |
|---|---|---|
| `CreateWorkspace` | **OK** | ワークスペース作成、slug 自動生成 |
| `ListWorkspaces` | **OK** | ページネーション付き一覧取得 (フィールド名は `workspace` 配列) |
| `GetWorkspace` | **OK** | ID 指定で詳細取得 |
| `UpdateWorkspace` | **NG** | `invalid input syntax for type uuid: ""` — 空 UUID パースエラー |
| `ListWorkspaceMembers` | **OK** | メンバー一覧取得 (作成者が自動メンバー) |
| `InviteWorkspaceMember` | **OK** | 招待トークン発行成功 |

---

## Channel Service

| エンドポイント | ステータス | 備考 |
|---|---|---|
| `CreateChannel` | **OK** | チャンネル作成、作成者が自動参加 |
| `ListChannels` | **OK** | ワークスペース内チャンネル一覧 |
| `GetChannel` | **OK** | チャンネル詳細取得 |
| `SearchChannels` | **OK** | クエリ `"gen"` で `general` がヒット |
| `JoinChannel` | **OK** | 既存メンバーの場合 `already_exists` を返却（正常動作） |
| `MarkChannelRead` | **OK** | 既読マーク設定 |
| `GetUnreadCounts` | **OK** | 未読数取得 |

---

## Message Service

| エンドポイント | ステータス | 備考 |
|---|---|---|
| `SendMessage` | **OK** | メッセージ送信成功 |
| `ListMessages` | **OK** | チャンネル内メッセージ一覧 |
| `GetMessage` | **OK** | ID 指定でメッセージ取得 |
| `UpdateMessage` | **NG** | `invalid input syntax for type uuid: ""` — 空 UUID パースエラー |
| `DeleteMessage` | **OK** | メッセージ削除成功（削除されたメッセージを返却） |
| `SendTypingIndicator` | **OK** | タイピング通知送信 |
| `SendMessage (thread reply)` | **OK** | `threadRootId` 指定でスレッド返信成功 |

---

## Thread Service

| エンドポイント | ステータス | 備考 |
|---|---|---|
| `GetThread` | **NG** | `invalid input syntax for type uuid: ""` — 空 UUID パースエラー |

---

## Reaction Service

| エンドポイント | ステータス | 備考 |
|---|---|---|
| `AddReaction` | **OK** | リアクション追加成功 (`thumbsup`) |
| `ListReactions` | **OK** | メッセージのリアクション一覧取得 |
| `RemoveReaction` | **OK** | リアクション削除成功 |

### AddReaction レスポンス例

```json
{
  "reaction": {
    "id": "5da2fff3-...",
    "messageId": "5fb36f6e-...",
    "userId": "5ef4c461-...",
    "emojiCode": "thumbsup",
    "createdAt": "2026-03-20T05:13:07.826284342Z"
  }
}
```

---

## File Service

| エンドポイント | ステータス | 備考 |
|---|---|---|
| `CreateUploadSession` | **NG** | `Permission 'iam.serviceAccounts.signBlob' denied` — SA に signBlob 権限が不足 |

---

## AI Agent (Vertex AI)

| エンドポイント | メソッド | ステータス | 備考 |
|---|---|---|---|
| `POST /api/ai/threads` | POST | **OK** | スレッド作成、model=`gemini-2.5-flash` |
| `GET /api/ai/threads` | GET | **OK** | スレッド一覧取得 |
| `POST /api/ai/ask` | POST | **OK** | Vertex AI 経由で SSE ストリーム応答取得 |
| `GET /api/ai/threads/:id/messages` | GET | **OK** | メッセージ履歴取得 |
| `PATCH /api/ai/threads/:id` | PATCH | **OK** | タイトル更新成功 |
| `DELETE /api/ai/threads/:id` | DELETE | **OK** | 204 No Content |

### AI Ask レスポンス例 (SSE)

```
data: {"type":"text-delta","content":"2"}
data: {"type":"done","threadId":"e9048973-..."}
```

### 日本語応答例

```
data: {"type":"text-delta","content":"日本の首都は東京です。"}
data: {"type":"text-delta","content":"東京は日本の本州の東部に位置しており、政治、経済、文化の中心地"}
data: {"type":"text-delta","content":"です。皇居や国会議事堂、多くの政府機関が置かれています。"}
data: {"type":"done","threadId":"..."}
```

---

## 検出された問題と対応策

### 1. UpdateWorkspace / UpdateMessage / GetThread — UUID パースエラー

**エラー**: `invalid input syntax for type uuid: ""`

**原因**: バックエンドで空文字列が UUID として渡されている。ConnectRPC のリクエストマッピングで一部フィールドが正しく渡っていない可能性がある。

**影響**: 更新系操作とスレッド取得に影響。作成・取得・削除は正常動作。

### 2. File Service — signBlob 権限不足

**エラー**: `Permission 'iam.serviceAccounts.signBlob' denied`

**原因**: backend サービスアカウントに GCS の Signed URL 生成に必要な `iam.serviceAccounts.signBlob` 権限がない。

**対応策**:
```bash
gcloud projects add-iam-policy-binding aion-copilot \
  --member="serviceAccount:backend@aion-copilot.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountTokenCreator"
```

### 3. AI Agent ヘルスチェック — 外部からアクセス不可

**状態**: `/api/health` は Ingress のルーティング上 `/api/ai/*` にマッチしないため、backend にルーティングされ 401 が返る。

**影響**: なし（K8s 内部のヘルスチェックは正常動作中）。

---

## インフラ構成

| コンポーネント | 状態 |
|---|---|
| GKE Autopilot | 稼働中 (asia-northeast1) |
| Cloud SQL PostgreSQL 16 | 稼働中 (Private IP: 10.192.0.3) |
| Cloud Storage | 作成済み (aion-copilot-chatapp-files) |
| Artifact Registry | 稼働中 |
| Cloud NAT | 稼働中 |
| GCE Load Balancer | 稼働中 (34.149.213.223) |
| Vertex AI | 有効 (Workload Identity 経由) |
| Redis | 稼働中 (StatefulSet) |

## Pod 状態

| Pod | Ready | Status |
|---|---|---|
| backend | 1/1 | Running |
| ai-agent (x2) | 1/1 | Running |
| redis-0 | 1/1 | Running |
