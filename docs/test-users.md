# テストユーザー

本番環境（dev）で使用できるテストユーザーの一覧。

**Base URL**: `http://34.149.213.223`

---

## ユーザー一覧

| 項目 | 値 |
|---|---|
| Email | `test@aion-copilot.dev` |
| Password | `Test1234!` |
| Display Name | テストユーザー |
| User ID | `3aac8f12-4ddd-44a0-b632-e58195f43a1d` |
| 作成日 | 2026-03-20 |

---

## ログイン方法

```bash
curl -X POST http://34.149.213.223/chatapp.auth.v1.AuthService/LogIn \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@aion-copilot.dev",
    "password": "Test1234!"
  }'
```

レスポンス例:

```json
{
  "user": {
    "id": "3aac8f12-4ddd-44a0-b632-e58195f43a1d",
    "email": "test@aion-copilot.dev",
    "displayName": "テストユーザー"
  },
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "expiresAt": "2026-03-27T07:18:32Z"
}
```

---

## トークンの使い方

ログインで取得した `accessToken` を `Authorization` ヘッダーに付与して各 API を呼び出す。

```bash
# 例: 自分の情報を取得
curl -X POST http://34.149.213.223/chatapp.user.v1.UserService/GetMe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{}'
```

---

## トークンのリフレッシュ

`accessToken` の有効期限が切れた場合、`refreshToken` で新しいトークンを取得する。

```bash
curl -X POST http://34.149.213.223/chatapp.auth.v1.AuthService/RefreshToken \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<refreshToken>"}'
```

---

## 注意事項

- テストユーザーは dev 環境専用
- パスワードは変更しないこと（共有アカウント）
- 本番データの破壊的操作（ワークスペース削除等）は避けること
