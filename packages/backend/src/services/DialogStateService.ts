import path from "path";
import {Conversation} from "../../../../share/type";
import {PersistenceOptions, PersistenceService} from './PersistenceService.ts';
import {Singleton} from "../decorators/Singleton.ts";


@Singleton()
export class DialogStateService {
  private persistenceService: PersistenceService<Conversation>;

  constructor(options?: PersistenceOptions) {
    this.persistenceService = new PersistenceService<Conversation>({
      dataDir: options?.dataDir || path.join(process.cwd(), 'data'),
      configFileName: 'dialog.json',
    });
  }

  async getDialogList(): Promise<Conversation> {
    try {
        return await this.persistenceService.loadData() ?? {
          dialogs: [],
          activeDialogId: '',
          id: '',
        };
    } catch (error) {
      throw new Error(`获取对话列表失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  async saveDialogList(dialogState: Conversation): Promise<void> {
    try {
      await this.persistenceService.saveData(dialogState);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return;
      }
      throw new Error(`保存对话列表失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}