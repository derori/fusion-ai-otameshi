# Gemini CLI + Claude Opus 連携開発環境

このプロジェクトは、Gemini CLIをメインの司令塔とし、特定のタスク（テスト作成、リファクタリング、高度なコード修正など）を **Claude 3 Opus** に委譲するハイブリッドな開発環境を提供します。

## 構成
- **Gemini (Main Agent)**: 全体の進捗管理、ファイル操作、コマンド実行を担当。
- **Claude 3 Opus (Sub-Agent via MCP)**: `opus_expert` エージェントを通じて、高度な推論やコード生成を担当。

## セットアップ

### 1. 依存パッケージのインストール
`mcp-opus-server` ディレクトリに移動し、必要なパッケージをインストールします。
```bash
cd mcp-opus-server
npm install
```

### 2. Anthropic API キーの設定
`~/.gemini/settings.json` を開き、`opus-assistant` の環境変数に Anthropic API キーを設定してください。

```json
{
  "mcpServers": {
    "opus-assistant": {
      "command": "node",
      "args": ["/home/derori/workspace/deroris.github/fusion-ai-otameshi/mcp-opus-server/index.js"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-..." 
      }
    }
  }
}
```
※ パスは環境に合わせて適宜修正してください。

## 使い方

Gemini CLI 内で `@opus_expert` を呼び出すことで、Opusにタスクを依頼できます。

### テストコードの作成
```text
@opus_expert src/index.js のテストコードを作成して。
```

### コードのリファクタリング
```text
@opus_expert この関数の可読性をOpusに向上させて。
```

### 高度な技術相談
```text
@opus_expert Opusにこのアーキテクチャの改善案を聞いて。
```

## ディレクトリ構造
- `mcp-opus-server/`: Opusと通信するための MCP (Model Context Protocol) サーバー。
- `.gemini/agents/opus_expert.md`: Opusを呼び出すためのサブエージェント定義。
