# mtime2created

ファイルの更新日時 (mtime) を、作成日時 (birthtime) と同じ日時に同期する Obsidian プラグインです。

> [!WARNING]
> このプラグインは **macOS 専用** です。
> macOS 固有の `SetFile` コマンドを使用しているため、Windows や Linux では動作しません。

## 概要

Obsidian でノートを管理していると、ファイルの移動や編集によって「更新日時」が意図せず変更されてしまうことがあります。
このプラグインを使用すると、ファイルの「更新日時」をそのファイルの「作成日時」に強制的に合わせることができます。

## 主な機能

- **日時の同期**: アクティブなファイル、または選択したファイルの更新日時を作成日時に同期します。
- **多言語対応**: Obsidian の言語設定に合わせて、コマンド名やメニュー名が日本語/英語に切り替わります。
  - 日本語: `修正日時を作成日時に同期`
  - 英語: `Sync mtime to created`
- **右クリックメニュー**: ファイルエクスプローラーやエディタのタブを右クリックして、コンテキストメニューから素早く実行できます。

## 動作環境

- macOS
- Obsidian

※ `SetFile` コマンドが利用可能である必要があります（通常、macOS に標準で含まれているか、Xcode Command Line Tools に含まれています）。

## インストール

1. GitHub の Releases ページから最新の `main.js`, `manifest.json`, `styles.css` をダウンロードします。
2. Obsidian の保管庫 (Vault) の `.obsidian/plugins/mtime2created/` フォルダにファイルを配置します。
3. Obsidian の設定画面 > コミュニティプラグイン から `mtime2created` を有効にします。

## 使い方

### コマンドパレットから実行

1. `Cmd + P` でコマンドパレットを開きます。
2. `修正日時を作成日時に同期` (英語環境では `Sync mtime to created`) を検索して実行します。

### 右クリックメニューから実行

1. ファイルエクスプローラー上のファイル、またはエディタのタブを右クリックします。
2. メニューから `修正日時を作成日時に同期` (英語環境では `Sync mtime to created`) を選択します。

## 開発

```bash
# リポジトリのクローン
git clone https://github.com/yutotod/mtime2created.git
cd mtime2created

# 依存関係のインストール
npm install

# 開発ビルド (ウォッチモード)
npm run dev

# 本番ビルド
npm run build
```

## ライセンス

MIT
