## Local MCP Server Tutorial

ローカルMCPサーバーを作成するためのチュートリアルです。

## 事前準備

- Node.js（v22想定）
- Claude Desktopまたは他のMCPクライアント

## チュートリアル

### 1. プロジェクト作成

```bash
npx giget@latest gh:7nohe/local-mcp-server-tutorial my-mcp-server
cd my-mcp-server
npm install
git init
git branch -M main
git add .
git commit -m "Initial commit"
```

### 2. TypeScriptコードをビルド、実行してみる

以下src/index.tsの内容を実行可能な形へビルド、実行してみます。

```ts
#!/usr/bin/env node
async function main() {
  console.error("Hello, world!");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
```

```bash
npm run build
./dist/index.js
# Hello, world!
```

> [!NOTE]
> package.jsonのbinプロパティに設定によりnode_modules/.bin/以下にシンボリックリンクが作成され、./dist/index.jsを実行することができます。



### 3. 必要なライブラリをインストール

```bash
npm install @modelcontextprotocol/sdk zod
```

### 4. MCPサーバーの実装

```ts
#!/usr/bin/env node
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// MCPサーバーのインスタンスを作成します。
const server = new McpServer({
  name: "my-mcp-server",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

async function main() {
  const transport = new StdioServerTransport();
  // Resources

  // Hello, world!を返すResourceを定義します。
  server.resource(
    "Greeting",
    "greeting://hello",
    (uri, { }) => {
      console.log(uri)
      return {
        contents: [
          {
            uri: uri.href,
            text: "Hello, world!",
          }
        ]
      }
    })

  // 動的なResourceにはResourceTemplateクラスを使用します。
  // listオプションはこのテンプレートにマッチする全てのResourcesをリストするためのコールバックです。ResourceTemplateを使用する場合はundefinedでも指定する必要があります。
  server.resource(
    "Greeting with name",
    new ResourceTemplate("greeting://hello/{name}", {
      // listは
      list: async () => {
        // 例えばここでAPIを叩いてユーザー一覧を取得することができます。
        await setTimeout(() => { }, 1000);
        // ここではダミーのデータを返します。
        return {
          resources:
            [
              { name: "Alice", uri: "greeting://hello/Alice" },
              { name: "Bob", uri: "greeting://hello/Bob" },
              { name: "Charlie", uri: "greeting://hello/Charlie" },
            ]
        }
      },
    }),
    (uri, { name }) => {
      return {
        contents: [
          {
            uri: uri.href,
            text: `Hello, ${name}!`,
          }
        ]
      }
    })

    // Prompts
  server.prompt(
    "Japanese Translation",
    {
      englishText: z.string().describe("翻訳する英語のテキスト"),
    },
    ({ englishText }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `あなたはプロの翻訳者です。次のテキストを日本語に翻訳してください: ${englishText}`,
        }
      }]
    }));


  // Tools
  server.tool(
    "calculate-bmi",
    "BMIの計算を行います",
    {
      weightKg: z.number().describe("体重(kg)"),
      heightM: z.number().describe("身長(m)"),
    },
    ({ weightKg, heightM }) => {
      return {
        content: [
          {
            type: "text",
            text: String(weightKg / (heightM * heightM)),
          }
        ]
      }
    })

  server.connect(transport);
  console.error("my-mcp-server started");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});

```

### 5. デバッグ

Inspectorを使ってデバッグします。

```bash
npx @modelcontextprotocol/inspector ./dist/index.js
```

http://127.0.0.1:6274 をブラウザで開くと、定義したResourcesやToolsのレスポンスを確認できます。

> [!NOTE]
> 毎回ビルドコマンド打つのが面倒な場合は`npm run watch`を実行しておくと、変更があるたびに自動でビルドしてくれます。


次にClaude Desktopで動作確認します。
Settings -> Developer -> Edit Configからclaude_desktop_config.jsonをエディタで開き、以下のように設定します。

```json
{
  "mcpServers": {
    "my-mcp-server": {
      "command": "/<Projectまでの絶対パス>/my-mcp-server/dist/index.js"
    }
  }
}
```

保存したらClaude Desktopを再起動します。

Toolsボタンから一覧の確認、Attach from MCPボタンからResourceやPromptが選択できるようになれば成功です。


### 6. パッケージ公開

```bash
npm login
npm publish
```

> [!NOTE]
> npm publishの際に、package.jsonのnameを@username/my-mcp-serverのようにすることで、自分の作成したパッケージだと分かりやすくなります。

> [!WARNING]
> npmパッケージは一度公開してしまうと削除が難しいので、慎重に公開しましょう。

ポイント:
- package.jsonのscripts.prepublishOnlyでビルドを行うようにしておくと、npm publishの際に自動でビルドされます。
- package.jsonのbinプロパティに以下のように設定しておくと、CLIとして実行できるようになります。

```json
"bin": "./dist/index.js"
```
- package.jsonのfilesプロパティに以下のように設定しておくと、distフォルダだけを公開されます。

```json
"files": [
  "dist"
]
```

### 7. 公開したMCPサーバーを実行する

Claude Desktopの設定を以下のように変更します。

```json
"my-mcp-server": {
  "command": "npx",
  "args": [
    "@your-name/my-mcp-server@latest"
  ]
}
```
