# AIon-Copilot API リファレンス

**Base URL**: `http://34.149.213.223`
**プロトコル**: ConnectRPC (JSON over HTTP POST)

## 共通ルール

- 全エンドポイント `POST` メソッド
- `Content-Type: application/json`
- 認証が必要なエンドポイント: `Authorization: Bearer <access_token>` ヘッダー
- エンドポイント形式: `/<package>.<Service>/<Method>`

---

## ヘルスチェック（REST）

```bash
# Liveness
curl http://34.149.213.223/health
# → {"status":"ok"}

# Readiness (DB・Redis接続確認)
curl http://34.149.213.223/ready
# → {"status":"ready"}
```

---

## 1. AuthService（認証）

パス: `chatapp.auth.v1.AuthService`

| メソッド | 認証 | 説明 |
|---|---|---|
| SignUp | 不要 | ユーザー登録 |
| LogIn | 不要 | ログイン |
| RefreshToken | 不要 | トークンリフレッシュ |
| Logout | 必要 | ログアウト |
| SendPasswordResetEmail | 不要 | 未実装 |
| ResetPassword | 不要 | 未実装 |

### SignUp

```bash
curl -X POST http://34.149.213.223/chatapp.auth.v1.AuthService/SignUp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "displayName": "表示名",
    "clientRequestId": "unique-id-1"
  }'
```

レスポンス:
```json
{
  "user": {"id": "...", "email": "...", "displayName": "..."},
  "accessToken": "eyJhbG...",
  "refreshToken": "...",
  "expiresAt": "2026-03-27T12:00:00Z"
}
```

### LogIn

```bash
curl -X POST http://34.149.213.223/chatapp.auth.v1.AuthService/LogIn \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

レスポンス: SignUp と同一形式

### RefreshToken

```bash
curl -X POST http://34.149.213.223/chatapp.auth.v1.AuthService/RefreshToken \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<refresh_token>"}'
```

### Logout（要認証）

```bash
curl -X POST http://34.149.213.223/chatapp.auth.v1.AuthService/Logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{}'
```

---

## 2. UserService（ユーザー）

パス: `chatapp.user.v1.UserService` — 全て要認証

| メソッド | 説明 |
|---|---|
| GetMe | 自分の情報取得 |
| UpdateProfile | プロフィール更新 |
| ChangePassword | パスワード変更 |

### GetMe

```bash
curl -X POST http://34.149.213.223/chatapp.user.v1.UserService/GetMe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{}'
```

### UpdateProfile

```bash
curl -X POST http://34.149.213.223/chatapp.user.v1.UserService/UpdateProfile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "user": {"displayName": "新しい名前"},
    "updateMask": {"paths": ["display_name"]}
  }'
```

### ChangePassword

```bash
curl -X POST http://34.149.213.223/chatapp.user.v1.UserService/ChangePassword \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "currentPassword": "old_pass",
    "newPassword": "new_pass"
  }'
```

---

## 3. WorkspaceService（ワークスペース）

パス: `chatapp.workspace.v1.WorkspaceService` — 全て要認証

| メソッド | 説明 |
|---|---|
| CreateWorkspace | ワークスペース作成 |
| ListWorkspaces | 一覧取得（ページネーション） |
| GetWorkspace | ID指定で取得 |
| UpdateWorkspace | 更新（name, icon_url） |
| InviteWorkspaceMember | メンバー招待 |
| JoinWorkspaceByInvite | 招待トークンで参加 |
| GetInviteInfo | 招待コードの情報取得 |
| ListWorkspaceMembers | メンバー一覧 |
| RemoveMember | メンバー削除 |

### CreateWorkspace

```bash
curl -X POST http://34.149.213.223/chatapp.workspace.v1.WorkspaceService/CreateWorkspace \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "name": "My Workspace",
    "iconUrl": "",
    "clientRequestId": "unique-id-2"
  }'
```

### ListWorkspaces

```bash
curl -X POST http://34.149.213.223/chatapp.workspace.v1.WorkspaceService/ListWorkspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"page": {"page": 1, "pageSize": 20}}'
```

### GetWorkspace

```bash
curl -X POST http://34.149.213.223/chatapp.workspace.v1.WorkspaceService/GetWorkspace \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"workspaceId": "<workspace_id>"}'
```

### UpdateWorkspace

```bash
curl -X POST http://34.149.213.223/chatapp.workspace.v1.WorkspaceService/UpdateWorkspace \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "workspace": {"id": "<workspace_id>", "name": "New Name"},
    "updateMask": {"paths": ["name"]}
  }'
```

### InviteWorkspaceMember

```bash
curl -X POST http://34.149.213.223/chatapp.workspace.v1.WorkspaceService/InviteWorkspaceMember \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"workspaceId": "<workspace_id>", "email": "invite@example.com"}'
```

### JoinWorkspaceByInvite

```bash
curl -X POST http://34.149.213.223/chatapp.workspace.v1.WorkspaceService/JoinWorkspaceByInvite \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"inviteToken": "<token>", "clientRequestId": "unique-id-3"}'
```

### GetInviteInfo

```bash
curl -X POST http://34.149.213.223/chatapp.workspace.v1.WorkspaceService/GetInviteInfo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"inviteCode": "<code>"}'
```

### ListWorkspaceMembers

```bash
curl -X POST http://34.149.213.223/chatapp.workspace.v1.WorkspaceService/ListWorkspaceMembers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"workspaceId": "<workspace_id>", "page": {"page": 1, "pageSize": 20}}'
```

### RemoveMember

```bash
curl -X POST http://34.149.213.223/chatapp.workspace.v1.WorkspaceService/RemoveMember \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"workspaceId": "<workspace_id>", "userId": "<user_id>"}'
```

---

## 4. ChannelService（チャンネル）

パス: `chatapp.channel.v1.ChannelService` — 全て要認証

| メソッド | 説明 |
|---|---|
| CreateChannel | チャンネル作成 |
| ListChannels | 一覧取得（ソート・ページネーション） |
| SearchChannels | 名前検索 |
| GetChannel | ID指定で取得 |
| UpdateChannel | 更新（name, description） |
| JoinChannel | チャンネル参加 |
| LeaveChannel | チャンネル退出 |
| MarkChannelRead | 既読マーク |
| GetUnreadCounts | 未読数取得 |

### CreateChannel

```bash
curl -X POST http://34.149.213.223/chatapp.channel.v1.ChannelService/CreateChannel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "workspaceId": "<workspace_id>",
    "name": "general",
    "description": "一般チャンネル",
    "clientRequestId": "unique-id-4"
  }'
```

### ListChannels

```bash
curl -X POST http://34.149.213.223/chatapp.channel.v1.ChannelService/ListChannels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "workspaceId": "<workspace_id>",
    "page": {"page": 1, "pageSize": 20},
    "sort": {"field": "name", "order": "SORT_ORDER_ASC"}
  }'
```

### SearchChannels

```bash
curl -X POST http://34.149.213.223/chatapp.channel.v1.ChannelService/SearchChannels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "workspaceId": "<workspace_id>",
    "query": "general",
    "page": {"page": 1, "pageSize": 20}
  }'
```

### GetChannel

```bash
curl -X POST http://34.149.213.223/chatapp.channel.v1.ChannelService/GetChannel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"channelId": "<channel_id>"}'
```

### UpdateChannel

```bash
curl -X POST http://34.149.213.223/chatapp.channel.v1.ChannelService/UpdateChannel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "channel": {"id": "<channel_id>", "name": "renamed"},
    "updateMask": {"paths": ["name"]}
  }'
```

### JoinChannel

```bash
curl -X POST http://34.149.213.223/chatapp.channel.v1.ChannelService/JoinChannel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"channelId": "<channel_id>", "clientRequestId": "unique-id-5"}'
```

### LeaveChannel

```bash
curl -X POST http://34.149.213.223/chatapp.channel.v1.ChannelService/LeaveChannel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"channelId": "<channel_id>"}'
```

### MarkChannelRead

```bash
curl -X POST http://34.149.213.223/chatapp.channel.v1.ChannelService/MarkChannelRead \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"channelId": "<channel_id>", "lastReadMessageId": "<message_id>"}'
```

### GetUnreadCounts

```bash
curl -X POST http://34.149.213.223/chatapp.channel.v1.ChannelService/GetUnreadCounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"workspaceId": "<workspace_id>"}'
```

---

## 5. MessageService（メッセージ）

パス: `chatapp.message.v1.MessageService` — 全て要認証

| メソッド | 説明 |
|---|---|
| SendMessage | メッセージ送信 |
| ListMessages | 一覧取得（カーソルページネーション） |
| GetMessage | ID指定で取得 |
| UpdateMessage | メッセージ編集 |
| DeleteMessage | メッセージ削除（ソフトデリート） |
| SendTypingIndicator | 未実装 |

### SendMessage

```bash
curl -X POST http://34.149.213.223/chatapp.message.v1.MessageService/SendMessage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "channelId": "<channel_id>",
    "content": "Hello!",
    "fileIds": [],
    "clientMessageId": "unique-msg-1"
  }'
```

### SendMessage（スレッド返信）

```bash
curl -X POST http://34.149.213.223/chatapp.message.v1.MessageService/SendMessage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "channelId": "<channel_id>",
    "content": "返信です",
    "threadRootId": "<message_id>",
    "clientMessageId": "unique-msg-2"
  }'
```

### ListMessages

```bash
curl -X POST http://34.149.213.223/chatapp.message.v1.MessageService/ListMessages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"channelId": "<channel_id>", "page": {"cursor": "", "limit": 50}}'
```

### GetMessage

```bash
curl -X POST http://34.149.213.223/chatapp.message.v1.MessageService/GetMessage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"messageId": "<message_id>"}'
```

### UpdateMessage

```bash
curl -X POST http://34.149.213.223/chatapp.message.v1.MessageService/UpdateMessage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "message": {"id": "<message_id>", "content": "編集済み"},
    "updateMask": {"paths": ["content"]}
  }'
```

### DeleteMessage

```bash
curl -X POST http://34.149.213.223/chatapp.message.v1.MessageService/DeleteMessage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"messageId": "<message_id>"}'
```

---

## 6. ThreadService（スレッド）

パス: `chatapp.thread.v1.ThreadService` — 要認証

| メソッド | 説明 |
|---|---|
| GetThread | スレッドのルートメッセージと返信を取得 |

### GetThread

```bash
curl -X POST http://34.149.213.223/chatapp.thread.v1.ThreadService/GetThread \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"threadRootId": "<message_id>"}'
```

---

## 7. ReactionService（リアクション）

パス: `chatapp.reaction.v1.ReactionService`

| メソッド | 認証 | 説明 |
|---|---|---|
| AddReaction | 必要 | リアクション追加 |
| RemoveReaction | 必要 | リアクション削除 |
| ListReactions | 不要 | リアクション一覧取得 |

### AddReaction

```bash
curl -X POST http://34.149.213.223/chatapp.reaction.v1.ReactionService/AddReaction \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"messageId": "<message_id>", "emojiCode": "👍"}'
```

### RemoveReaction

```bash
curl -X POST http://34.149.213.223/chatapp.reaction.v1.ReactionService/RemoveReaction \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"messageId": "<message_id>", "emojiCode": "👍"}'
```

### ListReactions（認証不要）

```bash
curl -X POST http://34.149.213.223/chatapp.reaction.v1.ReactionService/ListReactions \
  -H "Content-Type: application/json" \
  -d '{"messageId": "<message_id>"}'
```

---

## 8. FileService（ファイル）

パス: `chatapp.file.v1.FileService` — 全て要認証

| メソッド | 説明 |
|---|---|
| CreateUploadSession | GCSアップロードセッション作成 |
| CompleteUpload | アップロード完了 |
| AbortUpload | アップロード中止 |
| GetDownloadUrl | 署名付きダウンロードURL取得 |

### CreateUploadSession

```bash
curl -X POST http://34.149.213.223/chatapp.file.v1.FileService/CreateUploadSession \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "workspaceId": "<workspace_id>",
    "fileName": "image.png",
    "contentType": "image/png",
    "fileSize": 12345,
    "clientRequestId": "unique-id-6"
  }'
```

### CompleteUpload

```bash
curl -X POST http://34.149.213.223/chatapp.file.v1.FileService/CompleteUpload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"fileId": "<file_id>"}'
```

### AbortUpload

```bash
curl -X POST http://34.149.213.223/chatapp.file.v1.FileService/AbortUpload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"fileId": "<file_id>"}'
```

### GetDownloadUrl

```bash
curl -X POST http://34.149.213.223/chatapp.file.v1.FileService/GetDownloadUrl \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"fileId": "<file_id>"}'
```

---

## 共通データ型

### ページネーション（オフセット）

```json
// リクエスト
{"page": {"page": 1, "pageSize": 20}}

// レスポンス
{"page": {"page": 1, "pageSize": 20, "totalCount": 100, "hasNext": true, "hasPrev": false}}
```

### ページネーション（カーソル）

```json
// リクエスト
{"page": {"cursor": "", "limit": 50}}

// レスポンス
{"page": {"nextCursor": "...", "prevCursor": "...", "hasMoreBefore": false, "hasMoreAfter": true}}
```

### FieldMask（部分更新）

```json
{"updateMask": {"paths": ["display_name", "avatar_url"]}}
```

### ソート

```json
{"sort": {"field": "name", "order": "SORT_ORDER_ASC"}}
```

---

## エラーレスポンス

ConnectRPC のエラー形式:

```json
{
  "code": "not_found",
  "message": "resource not found"
}
```

| code | HTTP Status | 説明 |
|---|---|---|
| invalid_argument | 400 | バリデーションエラー |
| unauthenticated | 401 | 認証エラー |
| permission_denied | 403 | 権限不足 |
| not_found | 404 | リソースが見つからない |
| already_exists | 409 | リソースが既に存在 |
| aborted | 409 | コンフリクト |
| internal | 500 | サーバー内部エラー |

---

## サービス統計

| サービス | メソッド数 | 認証 |
|---|---|---|
| AuthService | 5 | SignUp/LogIn/RefreshToken は不要 |
| UserService | 3 | 全て必要 |
| WorkspaceService | 9 | 全て必要 |
| ChannelService | 9 | 全て必要 |
| MessageService | 6 | 全て必要 |
| ThreadService | 1 | 必要 |
| ReactionService | 3 | ListReactions のみ不要 |
| FileService | 4 | 全て必要 |
| **合計** | **40** | |
