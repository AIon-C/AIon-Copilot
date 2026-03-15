type MockSeedMessage = {
  id: string;
  user: string;
  text: string;
  createdAt: string;
  parentId?: string;
};

export const mockMessages: MockSeedMessage[] = [
  {
    id: '1',
    user: 'Alice',
    text: 'Hello! 進捗どうですか？',
    createdAt: '2026-01-01T09:00:00.000Z',
  },
  {
    id: '2',
    user: 'Bob',
    text: 'フロント側のレイアウトはだいたい完了です。',
    createdAt: '2026-01-01T09:01:00.000Z',
  },
  {
    id: '3',
    user: 'Demo User',
    text: 'いいね！その件、スレッドで詳細共有します。',
    createdAt: '2026-01-01T09:02:00.000Z',
    parentId: '2',
  },
  {
    id: '4',
    user: 'Alice',
    text: '助かる。対応内容を箇条書きでお願いします。',
    createdAt: '2026-01-01T09:03:00.000Z',
    parentId: '2',
  },
  {
    id: '5',
    user: 'Bob',
    text: '了解、今からまとめます。',
    createdAt: '2026-01-01T09:04:00.000Z',
    parentId: '2',
  },
];
