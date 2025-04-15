import type { MCPConfig } from '../types/config';

export const API_BASE_URL = 'http://localhost:3000';

export interface Capability {
  name: string;
  description: string;
}

export interface ConfigListItem {
  id: string;
  name: string;
  isRunning: boolean;
}

export class ConfigAPI {
  async getConfigList(): Promise<ConfigListItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/list`);
      
      if (!response.ok) {
        throw new Error(`获取配置列表失败: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`获取配置列表失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  async getConfigById(id: string): Promise<MCPConfig> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/${id}`);
      
      if (!response.ok) {
        throw new Error(`获取配置详情失败: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`获取配置详情失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  async toggleMCPStatus(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/toggle/${id}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`切换MCP状态失败: ${response.statusText}`);
      }

      const result = await response.json();
      return result.isRunning;
    } catch (error) {
      throw new Error(`切换MCP状态失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  async capabilities(id: string): Promise<Capability[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/capabilities/${id}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`获取服务器能力列表失败: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`获取服务器能力列表失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

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