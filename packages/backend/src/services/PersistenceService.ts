import fs from 'fs';
import path from 'path';

export interface PersistenceOptions {
	dataDir?: string;
	configFileName: string;
	backupInterval?: number; // 备份间隔时间（毫秒），默认1小时
	maxBackups?: number; // 最大备份文件数量，默认24个
}

export class PersistenceService<T = any> {
	static readonly EVENT_MCP_AUTO_START = 'mcpAutoStart';
	private dataDir: string;
	private backupInterval: number;
	private configFileName: string;
	private maxBackups: number;
	private backupTimer: NodeJS.Timeout | null = null;


	constructor(options: PersistenceOptions) {
		this.dataDir = options.dataDir || path.join(process.cwd(), 'data');
		this.backupInterval = options.backupInterval || 3600000; // 默认1小时
		this.maxBackups = options.maxBackups || 24; // 默认24个备份
		this.configFileName = options.configFileName;

		this.initialize();
	}

	async initialize(): Promise<void> {
		try {
			await fs.promises.mkdir(this.dataDir, {recursive: true});
			this.startAutoBackup();
		} catch (error) {
			throw new Error(`Failed to initialize persistence service: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	private getConfigPath(id?: string): string {
		const configFileName = this.configFileName.replace('.json', '');
		const fileName = id ? `${configFileName}/${id}.json` : `${configFileName}.json`;
		return path.join(this.dataDir, fileName);
	}

	private async exists(filePath: string): Promise<boolean> {
		try {
			await fs.promises.access(filePath);
			return true;
		} catch {
			return false;
		}
	}

	async saveData(data: T, id?: string): Promise<void> {
		const filePath = this.getConfigPath(id);
		try {
			// 确保文件和路径存在
			await fs.promises.mkdir(path.dirname(filePath), {recursive: true});
			// 保存文件
			await fs.promises.writeFile(
				filePath,
				JSON.stringify(data, null, 2),
				'utf-8'
			);
		} catch (error) {
			throw new Error(`Failed to save data: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	async loadData(id?: string): Promise<T > {
		const filePath = this.getConfigPath(id);
		try {
			if (!(await this.exists(filePath))) {
				return {} as T;
			}
			const data = await fs.promises.readFile(filePath, 'utf-8');
			if(data) return JSON.parse(data) as T;
			return {} as T;
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				throw new Error('Configuration file not found');
			}
			throw new Error(`Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	private async backupData(): Promise<void> {
		try {
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
			const configFileName = this.configFileName.replace('.json', '');

			// 备份主配置文件
			const mainConfigPath = this.getConfigPath();
			if (await this.exists(mainConfigPath)) {
				const mainBackupPath = path.join(this.dataDir, `${configFileName}.${timestamp}.backup.json`);
				await fs.promises.copyFile(mainConfigPath, mainBackupPath);
			}

			// 备份子配置文件
			const configDirPath = path.join(this.dataDir, configFileName);
			if (await this.exists(configDirPath)) {
				const files = await fs.promises.readdir(configDirPath);
				const jsonFiles = files.filter(file => file.endsWith('.json'));

				for (const file of jsonFiles) {
					const sourcePath = path.join(configDirPath, file);
					const backupDirPath = path.join(this.dataDir, `${configFileName}.${timestamp}.backup`);
					await fs.promises.mkdir(backupDirPath, {recursive: true});
					const backupFilePath = path.join(backupDirPath, file);
					await fs.promises.copyFile(sourcePath, backupFilePath);
				}
			}

			await this.cleanupOldBackups();
		} catch (error) {
			console.error(`Failed to backup data: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	private async cleanupOldBackups(): Promise<void> {
		try {
			const files = await fs.promises.readdir(this.dataDir);
			const configFileName = this.configFileName.replace('.json', '');
			const backupPattern = new RegExp(`^${configFileName}\..*\.backup(?:\.json|\/.*\.json)$`);

			const backupFiles = files
				.filter(file => backupPattern.test(file))
				.map(file => ({
					name: file,
					path: path.join(this.dataDir, file),
					time: new Date(file.split('.')[1].replace(/-/g, ':'))
				}))
				.sort((a, b) => b.time.getTime() - a.time.getTime());

			if (backupFiles.length > this.maxBackups) {
				const filesToDelete = backupFiles.slice(this.maxBackups);
				for (const file of filesToDelete) {
					if (file.name.endsWith('.json')) {
						await fs.promises.unlink(file.path);
					} else {
						// 删除备份目录及其内容
						const backupDir = file.path;
						const backupFiles = await fs.promises.readdir(backupDir);
						for (const backupFile of backupFiles) {
							await fs.promises.unlink(path.join(backupDir, backupFile));
						}
						await fs.promises.rmdir(backupDir);
					}
				}
			}
		} catch (error) {
			console.error(`Failed to cleanup old backups: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	private startAutoBackup(): void {
		if (this.backupTimer) {
			clearInterval(this.backupTimer);
		}
		this.backupTimer = setInterval(() => {
			this.backupData();
		}, this.backupInterval);
	}

	public stopAutoBackup(): void {
		if (this.backupTimer) {
			clearInterval(this.backupTimer);
			this.backupTimer = null;
		}
	}
}