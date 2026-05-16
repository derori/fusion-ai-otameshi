# Shogi Web

シンプルでモダンなブラウザ版将棋アプリです。
React + TypeScript で構築されており、マウスとキーボードの両方で操作可能です。

## 機能
- オフライン2人対戦（同じ画面で交互に操作）
- マス目クリックによる駒の選択・移動
- キーボードによる盤面ナビゲーションと操作
- 駒取りと持ち駒の管理
- シンプルな白黒デザイン

## セットアップと起動

### 依存パッケージのインストール
```bash
cd shogi-web
npm install
```

### 開発サーバーの起動
```bash
npm run dev
```
起動後、ブラウザで `http://localhost:5173` にアクセスしてください。

## 操作方法

### マス目操作
- **クリック**: 駒の選択、移動先の決定、選択解除。

### キーボード操作
盤面をクリックしてフォーカスを当てることで、キーボード操作が可能になります。
- **矢印キー (↑↓←→)**: 盤面上のカーソルを移動。
- **Enter / Space**: カーソル位置の駒を選択 / 移動先の決定。

## テストの実行

Vitest を使用してロジックのテストを実行できます。

### 全テストの実行
```bash
npm test
```

### ウォッチモードでの実行
```bash
npm run test:watch
```

## 技術スタック
- **Frontend**: React 19
- **Build Tool**: Vite 8
- **Language**: TypeScript
- **Test**: Vitest, React Testing Library
- **Styling**: Vanilla CSS
