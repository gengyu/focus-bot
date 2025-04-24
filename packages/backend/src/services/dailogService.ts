import {PersistenceOptions, PersistenceService} from "./persistenceService.ts";
import path from "path";
import {DialogState} from "../../../../share/type";

export class DialogService {

  private persistenceService: PersistenceService;

  constructor(options?: PersistenceOptions) {
    this.persistenceService = new PersistenceService({
      dataDir: options?.dataDir || path.join(process.cwd(), 'data'),
      configFileName: 'dialog.json',
      backupInterval: options?.backupInterval ?? 3600000, // 默认1小时
      maxBackups: options?.maxBackups ?? 24 // 默认24个备份
    });
  }

  async getDialogList(): Promise<DialogState> {
    try {
      return await this.persistenceService.loadData();
    } catch (error) {
      throw new Error(`Failed to load settting data ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async saveDialogList(dialogState: DialogState): Promise<void> {
    try {
      await this.persistenceService.saveData(dialogState);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return;
      }
      throw new Error(`Failed to load settting data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}