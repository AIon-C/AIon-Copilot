# GKE 環境 API リファレンス

## 接続方法

現在、全サービスは ClusterIP で公開されており、外部から直接アクセスできません。
ローカルからアクセスするには `kubectl port-forward` を使用します。

### port-forward の起動

```bash
# GKE 認証（初回のみ）
gcloud container clusters get-credentials aion-copilot-cluster \
  --region asia-northeast1 --project aion-copilot

# Backend API (port 18080 → 8080)
kubectl port-forward svc/backend 18080:8080 -n aion-copilot

# AI Agent API (port 13001 → 3001)
kubectl port-forward svc/ai-agent 13001:3001 -n aion-copilot
```

### ベース URL

| サービス | ローカル (port-forward) | クラスタ内 |
|---|---|---|
| Backend | `http://localhost:18080` | `http://backend:8080` |
| AI Agent | `http://localhost:13001` | `http://ai-agent:3001` |

---

## 認証

Backend API と AI Agent API の保護エンドポイントは JWT Bearer トークンによる認証が必要です。

```
Authorization: Bearer <access_token>
```

アクセストークンは `SignUp` または `LogIn` のレスポンスに含まれる `accessToken` を使用します。
有効期限が切れた場合は `RefreshToken` で再取得できます。

---

## Backend API (ConnectRPC)

ConnectRPC プロトコルを使用。全エンドポイントは `POST` メソッド、`Content-Type: application/json` です。

### ヘルスチェック

```bash
# Health
curl http://localhost:18080/health

# Readiness
curl http://localhost:18080/ready
```

### Auth Service

#### SignUp - ユーザー登録

```bash
curl -X POST http://localhost:18080/chatapp.auth.v1.AuthService/SignUp \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "山田太郎",
    "email": "yamada@example.com",
    "password": "SecurePassword123"
  }'
```

レスポンス:
```json
{
  "user": {
    "id": "uuid",
    "email": "yamada@example.com",
    "displayName": "山田太郎",
    "metadata": { "createdAt": "...", "updatedAt": "..." }
  },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresAt": "2026-03-26T..."
}
```

#### LogIn - ログイン

```bash
curl -X POST http://localhost:18080/chatapp.auth.v1.AuthService/LogIn \
  -H "Content-Type: application/json" \
  -d '{
    "email": "yamada@example.com",
    "password": "SecurePassword123"
  }'
```

#### Logout - ログアウト

```bash
curl -X POST http://localhost:18080/chatapp.auth.v1.AuthService/Logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{}'
```

#### RefreshToken - トークン更新

```bash
curl -X POST http://localhost:18080/chatapp.auth.v1.AuthService/RefreshToken \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<refresh_token>"}'
```

#### SendPasswordResetEmail - パスワードリセットメール送信

```bash
curl -X POST http://localhost:18080/chatapp.auth.v1.AuthService/SendPasswordResetEmail \
  -H "Content-Type: application/json" \
  -d '{"email": "yamada@example.com"}'
```

#### ResetPassword - パスワードリセット

```bash
curl -X POST http://localhost:18080/chatapp.auth.v1.AuthService/ResetPassword \
  -H "Content-Type: application/json" \
  -d '{"token": "<reset_token>", "newPassword": "NewPassword456"}'
```

---

### User Service (要認証)

#### GetMe - 自分のプロフィール取得

```bash
curl -X POST http://localhost:18080/chatapp.user.v1.UserService/GetMe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{}'
```

#### UpdateProfile - プロフィール更新

```bash
curl -X POST http://localhost:18080/chatapp.user.v1.UserService/UpdateProfile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"displayName": "新しい名前"}'
```

#### ChangePassword - パスワード変更

```bash
curl -X POST http://localhost:18080/chatapp.user.v1.UserService/ChangePassword \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"currentPassword": "OldPass123", "newPassword": "NewPass456"}'
```

---

### Workspace Service (要認証)

#### CreateWorkspace - ワークスペース作成

```bash
curl -X POST http://localhost:18080/chatapp.workspace.v1.WorkspaceService/CreateWorkspace \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "My Workspace"}'
```

#### ListWorkspaces - ワークスペース一覧

```bash
curl -X POST http://localhost:18080/chatapp.workspace.v1.WorkspaceService/ListWorkspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{}'
```

#### GetWorkspace - ワークスペース詳細

```bash
curl -X POST http://localhost:18080/chatapp.workspace.v1.WorkspaceService/GetWorkspace \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"workspaceId": "<workspace_id>"}'
```

#### UpdateWorkspace - ワークスペース更新

```bash
curl -X POST http://localhost:18080/chatapp.workspace.v1.WorkspaceService/UpdateWorkspace \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"workspaceId": "<workspace_id>", "name": "Updated Name"}'
```

#### InviteWorkspaceMember - メンバー招待

```bash
curl -X POST http://localhost:18080/chatapp.workspace.v1.WorkspaceService/InviteWorkspaceMember \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"workspaceId": "<workspace_id>", "email": "member@example.com"}'
```

#### JoinWorkspaceByInvite - 招待で参加

```bash
curl -X POST http://localhost:18080/chatapp.workspace.v1.WorkspaceService/JoinWorkspaceByInvite \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"inviteToken": "<invite_token>"}'
```

#### GetInviteInfo - 招待情報取得

```bash
curl -X POST http://localhost:18080/chatapp.workspace.v1.WorkspaceService/GetInviteInfo \
  -H "Content-Type: application/json" \
  -d '{"inviteToken": "<invite_token>"}'
```

#### ListWorkspaceMembers - メンバー一覧

```bash
curl -X POST http://localhost:18080/chatapp.workspace.v1.WorkspaceService/ListWorkspaceMembers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"workspaceId": "<workspace_id>"}'
```

#### RemoveMember - メンバー削除

```bash
curl -X POST http://localhost:18080/chatapp.workspace.v1.WorkspaceService/RemoveMember \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"workspaceId": "<workspace_id>", "userId": "<user_id>"}'
```

---

### Channel Service (要認証)

#### CreateChannel - チャンネル作成

```bash
curl -X POST http://localhost:18080/chatapp.channel.v1.ChannelService/CreateChannel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"workspaceId": "<workspace_id>", "name": "general"}'
```

#### ListChannels - チャンネル一覧

```bash
curl -X POST http://localhost:18080/chatapp.channel.v1.ChannelService/ListChannels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"workspaceId": "<workspace_id>"}'
```

#### SearchChannels - チャンネル検索

```bash
curl -X POST http://localhost:18080/chatapp.channel.v1.ChannelService/SearchChannels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"workspaceId": "<workspace_id>", "query": "general"}'
```

#### GetChannel - チャンネル詳細

```bash
curl -X POST http://localhost:18080/chatapp.channel.v1.ChannelService/GetChannel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"channelId": "<channel_id>"}'
```

#### UpdateChannel - チャンネル更新

```bash
curl -X POST http://localhost:18080/chatapp.channel.v1.ChannelService/UpdateChannel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"channelId": "<channel_id>", "name": "renamed", "description": "説明文"}'
```

#### JoinChannel / LeaveChannel

```bash
# 参加
curl -X POST http://localhost:18080/chatapp.channel.v1.ChannelService/JoinChannel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"channelId": "<channel_id>"}'

# 退出
curl -X POST http://localhost:18080/chatapp.channel.v1.ChannelService/LeaveChannel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"channelId": "<channel_id>"}'
```

#### MarkChannelRead - 既読にする

```bash
curl -X POST http://localhost:18080/chatapp.channel.v1.ChannelService/MarkChannelRead \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"channelId": "<channel_id>"}'
```

#### GetUnreadCounts - 未読数取得

```bash
curl -X POST http://localhost:18080/chatapp.channel.v1.ChannelService/GetUnreadCounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"workspaceId": "<workspace_id>"}'
```

---

### Message Service (要認証)

#### SendMessage - メッセージ送信

```bash
curl -X POST http://localhost:18080/chatapp.message.v1.MessageService/SendMessage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"channelId": "<channel_id>", "content": "Hello from GKE!"}'
```

スレッド返信の場合:
```bash
curl -X POST http://localhost:18080/chatapp.message.v1.MessageService/SendMessage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"channelId": "<channel_id>", "content": "返信です", "threadRootId": "<message_id>"}'
```

#### ListMessages - メッセージ一覧 (カーソルページネーション)

```bash
curl -X POST http://localhost:18080/chatapp.message.v1.MessageService/ListMessages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"channelId": "<channel_id>", "limit": 50}'
```

次ページ:
```bash
curl -X POST http://localhost:18080/chatapp.message.v1.MessageService/ListMessages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"channelId": "<channel_id>", "limit": 50, "cursor": "<cursor>"}'
```

#### GetMessage - メッセージ取得

```bash
curl -X POST http://localhost:18080/chatapp.message.v1.MessageService/GetMessage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"messageId": "<message_id>"}'
```

#### UpdateMessage - メッセージ編集

```bash
curl -X POST http://localhost:18080/chatapp.message.v1.MessageService/UpdateMessage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"messageId": "<message_id>", "content": "編集後のメッセージ"}'
```

#### DeleteMessage - メッセージ削除

```bash
curl -X POST http://localhost:18080/chatapp.message.v1.MessageService/DeleteMessage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"messageId": "<message_id>"}'
```

#### SendTypingIndicator - タイピング通知

```bash
curl -X POST http://localhost:18080/chatapp.message.v1.MessageService/SendTypingIndicator \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"channelId": "<channel_id>"}'
```

---

### Thread Service (要認証)

#### GetThread - スレッド取得

```bash
curl -X POST http://localhost:18080/chatapp.thread.v1.ThreadService/GetThread \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"messageId": "<root_message_id>"}'
```

---

### Reaction Service (要認証)

#### AddReaction - リアクション追加

```bash
curl -X POST http://localhost:18080/chatapp.reaction.v1.ReactionService/AddReaction \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"messageId": "<message_id>", "emojiCode": "thumbsup"}'
```

#### RemoveReaction - リアクション削除

```bash
curl -X POST http://localhost:18080/chatapp.reaction.v1.ReactionService/RemoveReaction \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"messageId": "<message_id>", "emojiCode": "thumbsup"}'
```

#### ListReactions - リアクション一覧

```bash
curl -X POST http://localhost:18080/chatapp.reaction.v1.ReactionService/ListReactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"messageId": "<message_id>"}'
```

---

### File Service (要認証)

#### CreateUploadSession - アップロードセッション作成

```bash
curl -X POST http://localhost:18080/chatapp.file.v1.FileService/CreateUploadSession \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"workspaceId": "<workspace_id>", "fileName": "photo.png", "contentType": "image/png", "fileSize": 1024}'
```

#### CompleteUpload - アップロード完了

```bash
curl -X POST http://localhost:18080/chatapp.file.v1.FileService/CompleteUpload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"fileId": "<file_id>"}'
```

#### AbortUpload - アップロード中止

```bash
curl -X POST http://localhost:18080/chatapp.file.v1.FileService/AbortUpload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"fileId": "<file_id>"}'
```

#### GetDownloadUrl - ダウンロード URL 取得

```bash
curl -X POST http://localhost:18080/chatapp.file.v1.FileService/GetDownloadUrl \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"fileId": "<file_id>"}'
```

---

## AI Agent API (REST/Hono)

### ヘルスチェック

```bash
# Health
curl http://localhost:13001/api/health

# Readiness (DB・Redis 接続確認)
curl http://localhost:13001/api/ready
```

### Swagger ドキュメント

```bash
curl http://localhost:13001/api/swagger
```

### AI チャット (要認証)

#### POST /api/ai/threads - スレッド作成

```bash
curl -X POST http://localhost:13001/api/ai/threads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"workspaceId": "<workspace_id>", "title": "新しい会話"}'
```

レスポンス:
```json
{
  "id": "uuid",
  "workspaceId": "uuid",
  "userId": "uuid",
  "title": "新しい会話",
  "model": "gemini-2.5-flash",
  "createdAt": "...",
  "updatedAt": "..."
}
```

#### GET /api/ai/threads - スレッド一覧

```bash
curl http://localhost:13001/api/ai/threads \
  -H "Authorization: Bearer <token>"
```

#### PATCH /api/ai/threads/:id - スレッドタイトル更新

```bash
curl -X PATCH http://localhost:13001/api/ai/threads/<thread_id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title": "更新後のタイトル"}'
```

#### DELETE /api/ai/threads/:id - スレッド削除

```bash
curl -X DELETE http://localhost:13001/api/ai/threads/<thread_id> \
  -H "Authorization: Bearer <token>"
```

レスポンス: `204 No Content`

#### GET /api/ai/threads/:id/messages - メッセージ履歴取得

```bash
curl http://localhost:13001/api/ai/threads/<thread_id>/messages \
  -H "Authorization: Bearer <token>"
```

#### POST /api/ai/ask - AI に質問 (SSE ストリーム)

```bash
curl -N -X POST http://localhost:13001/api/ai/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"threadId": "<thread_id>", "message": "こんにちは！"}'
```

レスポンス (Server-Sent Events):
```
data: {"type":"text-delta","content":"こん"}
data: {"type":"text-delta","content":"にちは"}
data: {"type":"text-delta","content":"！お手伝い"}
data: {"type":"text-delta","content":"できることはありますか？"}
data: {"type":"done","threadId":"uuid"}
```

---

## GCP リソース情報

| リソース | 値 |
|---|---|
| GCP プロジェクト | `aion-copilot` |
| GKE クラスタ | `aion-copilot-cluster` (asia-northeast1) |
| Cloud SQL | `aion-copilot-db` / Private IP: `10.192.0.3` |
| GCS バケット | `aion-copilot-chatapp-files` |
| Artifact Registry | `asia-northeast1-docker.pkg.dev/aion-copilot/aion-copilot` |
| K8s Namespace | `aion-copilot` |

---

## 動作確認済みフロー例

```bash
# 1. port-forward 起動
kubectl port-forward svc/backend 18080:8080 -n aion-copilot &
kubectl port-forward svc/ai-agent 13001:3001 -n aion-copilot &

# 2. ユーザー登録
RESP=$(curl -s -X POST http://localhost:18080/chatapp.auth.v1.AuthService/SignUp \
  -H "Content-Type: application/json" \
  -d '{"displayName":"テストユーザー","email":"user@example.com","password":"Password123"}')
TOKEN=$(echo $RESP | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")

# 3. ワークスペース作成
WS=$(curl -s -X POST http://localhost:18080/chatapp.workspace.v1.WorkspaceService/CreateWorkspace \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"テスト"}')
WS_ID=$(echo $WS | python3 -c "import sys,json; print(json.load(sys.stdin)['workspace']['id'])")

# 4. チャンネル作成
CH=$(curl -s -X POST http://localhost:18080/chatapp.channel.v1.ChannelService/CreateChannel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"workspaceId\":\"$WS_ID\",\"name\":\"general\"}")
CH_ID=$(echo $CH | python3 -c "import sys,json; print(json.load(sys.stdin)['channel']['id'])")

# 5. メッセージ送信
curl -s -X POST http://localhost:18080/chatapp.message.v1.MessageService/SendMessage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"channelId\":\"$CH_ID\",\"content\":\"Hello from GKE!\"}"

# 6. AI スレッド作成 & 質問
THREAD=$(curl -s -X POST http://localhost:13001/api/ai/threads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"workspaceId\":\"$WS_ID\",\"title\":\"テスト\"}")
THREAD_ID=$(echo $THREAD | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

curl -N -X POST http://localhost:13001/api/ai/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"threadId\":\"$THREAD_ID\",\"message\":\"2+2は？\"}"
```
