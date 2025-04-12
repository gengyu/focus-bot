import fs from 'fs';
import path from 'path';
import {spawn, ChildProcess} from 'child_process';
import {
    MCPConfig,
    ConfigService,
    ConfigValidationResult,
    ConfigValidationError,
    ConfigStorageOptions,
    MCPConfigListItem
} from '../types/config';
import {Client} from '@modelcontextprotocol/sdk';

console.log(Client, 33)


export class FileConfigService implements ConfigService {
    private filePath: string;
    private runningMCPs: Set<string> = new Set();
    private mcpProcesses: Map<string, ChildProcess> = new Map();


    constructor(options?: ConfigStorageOptions) {
        this.filePath = options?.filePath || path.join(process.cwd(), 'config.json');


    }

    async saveConfig(config: MCPConfig): Promise<void> {
        const validation = this.validateConfig(config);
        if (!validation.isValid) {
            throw new ConfigValidationError('Invalid configuration', validation.errors || []);
        }

        try {
            await fs.promises.writeFile(
                this.filePath,
                JSON.stringify(config, null, 2),
                'utf-8'
            );
        } catch (error) {
            throw new Error(`Failed to save config: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async loadConfig(): Promise<MCPConfig> {
        try {
            const data = await fs.promises.readFile(this.filePath, 'utf-8');
            const config = JSON.parse(data) as MCPConfig;
            const validation = this.validateConfig(config);

            if (!validation.isValid) {
                throw new ConfigValidationError('Invalid configuration', validation.errors || []);
            }

            return config;
        } catch (error) {
            if (error instanceof ConfigValidationError) {
                throw error;
            }
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                // 如果配置文件不存在，返回默认配置
                return {
                    serverUrl: 'http://localhost:5000',
                    transport: 'http',
                    debug: false,
                    mcpServers: {}
                };
            }
            throw new Error(`Failed to load config: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async getConfigList(): Promise<MCPConfigListItem[]> {
        try {
            const config = await this.loadConfig();
            const configList: MCPConfigListItem[] = [];

            // 将配置转换为列表项
            Object.entries(config.mcpServers).forEach(([id, serverConfig]) => {
                configList.push({
                    id,
                    name: serverConfig.name || `MCP配置${id}`,
                    isRunning: this.runningMCPs.has(id)
                });
            });

            return configList;
        } catch (error) {
            throw new Error(`Failed to get config list: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async toggleMCPStatus(id: string): Promise<boolean> {
        try {
            // 检查配置是否存在
            const config = await this.loadConfig();
            if (!config.mcpServers || !config.mcpServers[id]) {
                throw new Error(`MCP configuration with ID ${id} not found`);
            }

            // 切换运行状态
            const isCurrentlyRunning = this.runningMCPs.has(id);

            if (isCurrentlyRunning) {
                this.runningMCPs.delete(id);
                // 停止MCP服务
                const process = this.mcpProcesses.get(id);
                if (process) {
                    process.kill();
                    this.mcpProcesses.delete(id);
                    console.log(`Stopping MCP server: ${id}`);
                }
            } else {
                // 启动MCP服务
                const serverConfig = config.mcpServers[id];
                if (!serverConfig.command) {
                    throw new Error(`MCP server configuration is missing command: ${id}`);
                }

                try {
                    // 调用启动MCP进程的方法
                    await this.startMCPProcess(id, serverConfig);
                    console.log(`Starting MCP server: ${id}`);
                } catch (err) {
                    this.runningMCPs.delete(id);
                    throw new Error(`Failed to start MCP server: ${err instanceof Error ? err.message : 'Unknown error'}`);
                }
            }

            return !isCurrentlyRunning; // 返回新的运行状态
        } catch (error) {
            throw new Error(`Failed to toggle MCP status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async isMCPRunning(id: string): Promise<boolean> {
        return this.runningMCPs.has(id);
    }


    private async startMCPProcess(id: string, serverConfig: { command: string; args?: string[] }): Promise<void> {
        console.log(`Starting MCP server: id, ${serverConfig}`)
        new Client({
            config: {
                serverUrl: serverConfig.command,
                transport: 'http',
                debug: true
            },
        });
        const process = spawn(serverConfig.command, serverConfig.args || [], {
            stdio: 'pipe',
            detached: false
        });

        // 处理进程输出
        process.stdout?.on('data', (data) => {
            console.log(`[MCP ${id}] ${data.toString().trim()}`);
        });

        process.stderr?.on('data', (data) => {
            console.error(`[MCP ${id}] Error: ${data.toString().trim()}`);
        });

        // 处理进程退出
        process.on('exit', (code) => {
            console.log(`MCP server ${id} exited with code ${code}`);
            this.runningMCPs.delete(id);
            this.mcpProcesses.delete(id);
        });

        process.on('error', (err) => {
            console.error(`Failed to start MCP server ${id}: ${err.message}`);
            this.runningMCPs.delete(id);
            this.mcpProcesses.delete(id);
        });

        // 保存进程引用
        this.mcpProcesses.set(id, process);
        this.runningMCPs.add(id);
    }

    validateConfig(config: MCPConfig): ConfigValidationResult {
        const errors: string[] = [];

        if (!config.serverUrl) {
            errors.push('Server URL is required');
        } else if (!this.isValidUrl(config.serverUrl)) {
            errors.push('Invalid server URL format');
        }

        if (config.transport && !['stdio', 'http'].includes(config.transport)) {
            errors.push('Transport must be either "stdio" or "http"');
        }

        if (config.debug !== undefined && typeof config.debug !== 'boolean') {
            errors.push('Debug must be a boolean value');
        }

        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined
        };
    }

    private isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
}

