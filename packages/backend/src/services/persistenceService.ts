import fs from 'fs';
import path from 'path';
import {MCPConfig} from '../types/config';
import {EventEmitter} from 'events';
import {createReadStream, createWriteStream} from 'fs';
import readline from 'readline';

export interface PersistenceOptions {
	dataDir?: string;
	configFileName: string;
	backupInterval?: number; // 备份间隔时间（毫秒），默认1小时
	maxBackups?: number; // 最大备份文件数量，默认24个
}

export class PersistenceService extends EventEmitter {
	static readonly EVENT_MCP_AUTO_START = 'mcpAutoStart';
	private dataDir: string;
	private backupInterval: number;
	private configFileName: string;
	private maxBackups: number;
	private backupTimer: NodeJS.Timeout | null = null;


	constructor(options: PersistenceOptions) {
		super();
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
		const fileName = id ?  `${configFileName}/${id}.json` : `${configFileName}.json` ;
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

	async saveData(data: any, id?: string): Promise<void> {
		const filePath = this.getConfigPath(id);
		try {
			await fs.promises.writeFile(
				filePath,
				JSON.stringify(data, null, 2),
				'utf-8'
			);
		} catch (error) {
			throw new Error(`Failed to save data: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	async loadData(id?: string): Promise<MCPConfig | any> {
		const filePath = this.getConfigPath(id);
		try {
			if (!(await this.exists(filePath))) {
				return {};
			}
			const data = await fs.promises.readFile(filePath, 'utf-8');
			return JSON.parse(data);
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
			const backupPath = path.join(this.dataDir, `config.${timestamp}.backup.json`);

			// 备份所有配置文件
			const files = await fs.promises.readdir(this.dataDir);
			const configFiles = files.filter(file => file.startsWith('config_') && file.endsWith('.json'));

			for (const file of configFiles) {
				const sourcePath = path.join(this.dataDir, file);
				const backupFilePath = path.join(this.dataDir, `${file.replace('.json', '')}.${timestamp}.backup.json`);
				await fs.promises.copyFile(sourcePath, backupFilePath);
			}

			await this.cleanupOldBackups();
		} catch (error) {
			console.error(`Failed to backup data: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	private async cleanupOldBackups(): Promise<void> {
		try {
			const files = await fs.promises.readdir(this.dataDir);
			const backupFiles = files
				.filter(file => file.match(/^config.*\.backup\.json$/))
				.map(file => ({
					name: file,
					path: path.join(this.dataDir, file),
					time: new Date(file.split('.')[1].replace(/-/g, ':'))
				}))
				.sort((a, b) => b.time.getTime() - a.time.getTime());

			if (backupFiles.length > this.maxBackups) {
				const filesToDelete = backupFiles.slice(this.maxBackups);
				for (const file of filesToDelete) {
					await fs.promises.unlink(file.path);
				}
			}
		} catch (error) {
			console.error(`Failed to cleanup old backups: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	private startAutoBackup(): void {
		// if (this.backupTimer) {
		// 	clearInterval(this.backupTimer);
		// }
		// this.backupTimer = setInterval(() => {
		// 	this.backupData();
		// }, this.backupInterval);
	}

	public stopAutoBackup(): void {
		if (this.backupTimer) {
			clearInterval(this.backupTimer);
			this.backupTimer = null;
		}
	}
}