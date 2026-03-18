# AIon-Copilot

Slack 風チャットアプリ + AI コパイロット。

## アーキテクチャ

- **Backend** (`backend/`): Go, ConnectRPC, PostgreSQL(GORM), Redis, GCS. Clean Architecture
- **Frontend** (`frontend/`): Next.js 15, React 19, TypeScript, Tailwind, Shadcn UI
- **AI Agent** (`ai-agent/`): Node.js, Hono, Mastra, Google Gemini

## ビルド・テスト

- Backend: `cd backend && make test`
- Frontend: `cd frontend && npm run typecheck && npm run lint`
- AI Agent: `cd ai-agent && npm run typecheck && npm run lint`

## コード規約

- Go: errors.Is で ErrNotFound を判別、usecase 層にビジネスロジック集約
- TypeScript: kebab-case ファイル名、.usecase.ts / .port.ts / .impl.ts サフィックス
- .env ファイルはコミット禁止（.env.example のみ）
