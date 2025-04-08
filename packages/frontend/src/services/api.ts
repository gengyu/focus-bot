import type { MCPConfig } from '../types/config';

const API_BASE_URL = 'http://localhost:5000';

export class ConfigAPI {
  async saveConfig(config: MCPConfig): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        throw new Error(`保存配置失败: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`保存配置失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  async loadConfig(): Promise<MCPConfig> {
    try {
      const response = await fetch(`${API_BASE_URL}/config`);
      
      if (!response.ok) {
        throw new Error(`加载配置失败: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`加载配置失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}

export const configAPI = new ConfigAPI();