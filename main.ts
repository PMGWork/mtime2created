import { Plugin, Notice, FileSystemAdapter, TFile, moment } from 'obsidian';
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
  },
  en: {
    commandName: 'Sync mtime to created',
    menuTitle: 'Sync mtime to created',
    noFileSelected: 'No file selected.',
    notFileSystem: 'This plugin only works with the file system adapter.',
    errorSyncing: 'Error syncing time',
    errorGettingStats: 'Error getting file stats.',
    syncSuccess: 'Synced modification time to creation time',
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

    if (!(this.app.vault.adapter instanceof FileSystemAdapter)) {
      new Notice(this.t('notFileSystem'));
      return;
    }

    const basePath = this.app.vault.adapter.getBasePath();
    const filePath = path.join(basePath, targetFile.path);

    try {
      const stats = fs.statSync(filePath);
      const birthtime = stats.birthtime;

      // Format date for SetFile: "MM/DD/YYYY HH:MM:SS"
      const formattedDate = this.formatDateForSetFile(birthtime);

      // Command to update modification time (mtime) on macOS
      // SetFile -m "MM/DD/YYYY HH:MM:SS" filename
      const command = `SetFile -m "${formattedDate}" "${filePath}"`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          new Notice(`${this.t('errorSyncing')}: ${error.message}`);
          return;
        }
        new Notice(`${this.t('syncSuccess')}: ${formattedDate}`);
      });

    } catch (err) {
      console.error('Error getting file stats:', err);
      new Notice(this.t('errorGettingStats'));
    }
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
