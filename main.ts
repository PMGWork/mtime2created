import { Plugin, Notice, FileSystemAdapter, TFile, TAbstractFile, moment } from 'obsidian';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

// 多言語対応メッセージ辞書
const messages = {
  ja: {
    commandName: '修正日時を作成日時に同期',
    menuTitle: '修正日時を作成日時に同期',
    noFileSelected: 'ファイルが選択されていません。',
    notFileSystem: 'このプラグインはファイルシステムアダプターでのみ動作します。',
    errorSyncing: '時刻の同期中にエラーが発生しました',
    errorGettingStats: 'ファイル情報の取得中にエラーが発生しました。',
    syncSuccess: '修正日時を作成日時に同期しました',
    batchSuccess: '完了: {success} 件, 失敗: {fail} 件',
  },
  en: {
    commandName: 'Sync mtime to created',
    menuTitle: 'Sync mtime to created',
    noFileSelected: 'No file selected.',
    notFileSystem: 'This plugin only works with the file system adapter.',
    errorSyncing: 'Error syncing time',
    errorGettingStats: 'Error getting file stats.',
    syncSuccess: 'Synced modification time to creation time',
    batchSuccess: 'Done: {success}, Failed: {fail}',
  }
};

type Language = 'ja' | 'en';

export default class Mtime2CreatedPlugin extends Plugin {
  private currentLang: Language = 'en';

  async onload() {
    // Obsidianの言語設定を検出
    this.detectLanguage();

    this.addCommand({
      id: 'sync-mtime-to-created',
      name: this.t('commandName'),
      checkCallback: (checking: boolean) => {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile) {
          if (!checking) {
            this.syncMtimeToCreated(activeFile);
          }
          return true;
        }
        return false;
      }
    });

    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        if (file instanceof TFile) {
          menu.addItem((item) => {
            item
              .setTitle(this.t('menuTitle'))
              .setIcon('clock')
              .onClick(() => {
                this.syncMtimeToCreated(file);
              });
          });
        }
      })
    );

    this.registerEvent(
      this.app.workspace.on('files-menu', (menu, files) => {
        const tFiles = files.filter((f) => f instanceof TFile) as TFile[];
        if (tFiles.length > 0) {
          menu.addItem((item) => {
            item
              .setTitle(this.t('menuTitle'))
              .setIcon('clock')
              .onClick(() => {
                this.syncBatch(tFiles);
              });
          });
        }
      })
    );
  }

  /**
   * Obsidianの言語設定を検出
   */
  private detectLanguage(): void {
    const locale = moment.locale();
    // 日本語ロケール（ja, ja-jp など）を検出
    this.currentLang = locale.startsWith('ja') ? 'ja' : 'en';
  }

  /**
   * 多言語メッセージを取得
   */
  private t(key: keyof typeof messages.en): string {
    return messages[this.currentLang][key];
  }

  async syncMtimeToCreated(file?: TFile) {
    const targetFile = file ?? this.app.workspace.getActiveFile();
    if (!targetFile) {
      new Notice(this.t('noFileSelected'));
      return;
    }

    try {
      await this.processFile(targetFile);
      // 成功時のメッセージは processFile 内ではなくここで出す（単一ファイルの場合）
      // しかし processFile は void なので、日付を取得しなおすか、processFile が日付を返すようにするか。
      // 既存の挙動に合わせるため、processFile 内で日付計算しているが、
      // ここでは簡易的に現在時刻完了とするか、processFile から戻り値をもらう。
      // シンプルに「同期しました」で良い。
      new Notice(this.t('syncSuccess'));
    } catch (err) {
      new Notice(`${this.t('errorSyncing')}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async syncBatch(files: TFile[]) {
    let successCount = 0;
    let failCount = 0;

    const promises = files.map(async (file) => {
      try {
        await this.processFile(file);
        successCount++;
      } catch (e) {
        console.error(`Failed to sync ${file.path}:`, e);
        failCount++;
      }
    });

    await Promise.all(promises);

    const msg = this.t('batchSuccess' as any)
      .replace('{success}', successCount.toString())
      .replace('{fail}', failCount.toString());
    new Notice(msg);
  }

  async processFile(file: TFile): Promise<void> {
    if (!(this.app.vault.adapter instanceof FileSystemAdapter)) {
      throw new Error(this.t('notFileSystem'));
    }

    const basePath = this.app.vault.adapter.getBasePath();
    const filePath = path.join(basePath, file.path);

    return new Promise((resolve, reject) => {
      try {
        const stats = fs.statSync(filePath);
        const birthtime = stats.birthtime;
        const formattedDate = this.formatDateForSetFile(birthtime);
        const command = `SetFile -m "${formattedDate}" "${filePath}"`;

        exec(command, (error, stdout, stderr) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  formatDateForSetFile(date: Date): string {
    const pad = (num: number) => num.toString().padStart(2, '0');
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
  }

  onunload() {

  }
}
