/**
 * OpenAPI 3.0 Specification for AIon Copilot AI Agent API
 */
export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "AIon Copilot AI Agent API",
    description:
      "AIエージェントバックエンドAPI。チャットスレッド管理、AIとの会話(SSE)、メッセージ履歴取得を提供します。",
    version: "1.0.0",
  },
  servers: [
    {
      url: "http://localhost:3001",
      description: "Local development",
    },
  ],
  tags: [
    { name: "Health", description: "ヘルスチェック・レディネスチェック" },
    { name: "Threads", description: "AIチャットスレッドのCRUD操作" },
    { name: "Chat", description: "AIとの会話 (SSEストリーミング)" },
    { name: "Messages", description: "メッセージ履歴取得" },
  ],
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "ヘルスチェック",
        description: "サーバーが起動しているか確認します。",
        responses: {
          "200": {
            description: "正常",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/ready": {
      get: {
        tags: ["Health"],
        summary: "レディネスチェック",
        description:
          "PostgreSQL・Redisへの接続を検証し、サービスがリクエストを受け付けられる状態か確認します。",
        responses: {
          "200": {
            description: "全依存サービスに接続可能",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ready" },
                  },
                },
              },
            },
          },
          "503": {
            description: "依存サービスに接続不可",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "not ready" },
                    error: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/ai/threads": {
      post: {
        tags: ["Threads"],
        summary: "スレッド作成",
        description:
          "新しいAIチャットスレッドを作成します。スコープは channelId / threadRootId の組み合わせで決まります。",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateThreadRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "スレッド作成成功",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ThreadResponse" },
              },
            },
          },
          "400": {
            description: "バリデーションエラー",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      get: {
        tags: ["Threads"],
        summary: "スレッド一覧取得",
        description: "認証ユーザーのスレッド一覧を更新日時の降順で返します。",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "スレッド一覧",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    threads: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/ThreadResponse",
                      },
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/ai/threads/{id}": {
      patch: {
        tags: ["Threads"],
        summary: "スレッドタイトル更新",
        description: "指定スレッドのタイトルを更新します。",
        security: [{ BearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/ThreadId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title"],
                properties: {
                  title: {
                    type: "string",
                    minLength: 1,
                    maxLength: 200,
                    example: "更新後のタイトル",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "更新成功",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ThreadResponse" },
              },
            },
          },
          "400": {
            description: "バリデーションエラー",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Threads"],
        summary: "スレッド削除",
        description: "指定スレッドとそれに紐づく全メッセージを削除します (CASCADE)。",
        security: [{ BearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/ThreadId" }],
        responses: {
          "204": { description: "削除成功" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/ai/ask": {
      post: {
        tags: ["Chat"],
        summary: "AIにメッセージ送信 (SSE)",
        description: `AIエージェントにメッセージを送信し、Server-Sent Events (SSE) ストリームで応答を受信します。

**SSEイベント形式:**
- \`data: {"type":"text-delta","content":"..."}\` — テキストチャンク (逐次配信)
- \`data: {"type":"done","threadId":"..."}\` — ストリーム完了

**スコープ判定:**
- \`free\`: channelId・threadRootId なし → コンテキストなし
- \`channel\`: channelId あり → Redisからチャンネルコンテキスト注入
- \`thread\`: channelId + threadRootId あり → Redisからスレッドコンテキスト注入`,
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AskRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "SSEストリーム",
            content: {
              "text/event-stream": {
                schema: {
                  type: "string",
                  description:
                    'SSEイベントストリーム。各行は `data: {"type":"text-delta","content":"..."}` 形式。',
                  example:
                    'data: {"type":"text-delta","content":"こんにちは"}\n\ndata: {"type":"done","threadId":"..."}\n\n',
                },
              },
            },
          },
          "400": {
            description: "バリデーションエラー",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/ai/threads/{id}/messages": {
      get: {
        tags: ["Messages"],
        summary: "メッセージ履歴取得",
        description: "指定スレッドのメッセージ一覧を作成日時の昇順で返します。",
        security: [{ BearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/ThreadId" }],
        responses: {
          "200": {
            description: "メッセージ一覧",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    messages: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/MessageResponse",
                      },
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "HS256署名のJWTトークン。`sub` claimにユーザーIDを設定。",
      },
    },
    parameters: {
      ThreadId: {
        name: "id",
        in: "path",
        required: true,
        description: "スレッドのUUID",
        schema: { type: "string", format: "uuid" },
      },
    },
    schemas: {
      CreateThreadRequest: {
        type: "object",
        required: ["workspaceId", "title"],
        properties: {
          workspaceId: {
            type: "string",
            format: "uuid",
            description: "ワークスペースID",
          },
          title: {
            type: "string",
            minLength: 1,
            maxLength: 200,
            description: "スレッドタイトル",
            example: "TypeScript質問",
          },
          channelId: {
            type: "string",
            format: "uuid",
            nullable: true,
            description: "チャンネルID (channelスコープ / threadスコープ時に指定)",
          },
          threadRootId: {
            type: "string",
            format: "uuid",
            nullable: true,
            description: "スレッドルートメッセージID (threadスコープ時に指定。channelIdも必須)",
          },
        },
      },
      ThreadResponse: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          workspaceId: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          title: { type: "string", example: "TypeScript質問" },
          scope: { $ref: "#/components/schemas/Scope" },
          model: { type: "string", example: "gemini-2.5-flash" },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2026-03-17T10:00:00.000Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2026-03-17T10:00:00.000Z",
          },
        },
      },
      Scope: {
        type: "object",
        description: "スコープ情報。type によって含まれるフィールドが異なる。",
        required: ["type"],
        properties: {
          type: {
            type: "string",
            enum: ["free", "channel", "thread"],
            description:
              "free: コンテキストなし / channel: チャンネルコンテキスト / thread: スレッドコンテキスト",
          },
          channelId: {
            type: "string",
            format: "uuid",
            description: "channel / thread スコープ時に存在",
          },
          threadRootId: {
            type: "string",
            format: "uuid",
            description: "thread スコープ時のみ存在",
          },
        },
        example: {
          type: "channel",
          channelId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01",
        },
      },
      AskRequest: {
        type: "object",
        required: ["threadId", "message"],
        properties: {
          threadId: {
            type: "string",
            format: "uuid",
            description: "送信先スレッドのID",
          },
          message: {
            type: "string",
            minLength: 1,
            maxLength: 10000,
            description: "ユーザーメッセージ (最大10,000文字)",
            example: "TypeScriptの型ガードについて説明してください。",
          },
        },
      },
      MessageResponse: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          role: {
            type: "string",
            enum: ["user", "assistant"],
            description: "メッセージの送信者ロール",
          },
          content: {
            type: "string",
            description: "メッセージ本文",
          },
          metadata: {
            $ref: "#/components/schemas/MessageMetadata",
            nullable: true,
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
        },
      },
      MessageMetadata: {
        type: "object",
        nullable: true,
        description: "assistantメッセージのメタデータ",
        properties: {
          inputTokens: {
            type: "integer",
            description: "入力トークン数",
            example: 150,
          },
          outputTokens: {
            type: "integer",
            description: "出力トークン数",
            example: 80,
          },
          latencyMs: {
            type: "integer",
            description: "レスポンス生成時間 (ms)",
            example: 1200,
          },
          modelVersion: {
            type: "string",
            description: "使用モデルバージョン",
          },
          contextRange: {
            $ref: "#/components/schemas/ContextRange",
          },
        },
      },
      ContextRange: {
        type: "object",
        description: "コンテキスト注入範囲の情報",
        properties: {
          fromMessageId: { type: "string", format: "uuid" },
          toMessageId: { type: "string", format: "uuid" },
          messageCount: { type: "integer" },
          topicDetected: { type: "boolean" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: {
                type: "string",
                description: "エラーコード",
                enum: [
                  "VALIDATION_ERROR",
                  "UNAUTHORIZED",
                  "FORBIDDEN",
                  "NOT_FOUND",
                  "LLM_ERROR",
                  "SERVICE_UNAVAILABLE",
                  "INTERNAL_ERROR",
                ],
              },
              message: {
                type: "string",
                description: "エラーメッセージ",
              },
            },
          },
        },
        example: {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request",
          },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: "認証エラー — Authorization ヘッダーが無い、または無効なJWTトークン",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              error: {
                code: "UNAUTHORIZED",
                message: "Missing or invalid Authorization header",
              },
            },
          },
        },
      },
      Forbidden: {
        description: "権限エラー — 他ユーザーのリソースへのアクセス",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              error: { code: "FORBIDDEN", message: "Forbidden" },
            },
          },
        },
      },
      NotFound: {
        description: "リソースが見つからない",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              error: {
                code: "NOT_FOUND",
                message: "Thread not found: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
              },
            },
          },
        },
      },
    },
  },
} as const;
