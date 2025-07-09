import type {MCPConfig} from '../types/config';
import {TransportAdapter, TransportType} from "../transports";
import {type Model, type ProviderId} from "../../../../share/type.ts";
import type {AppSettings} from "../../../../share/appSettings.ts";

export const API_BASE_URL = 'http://localhost:3001';



export interface Capability {
    name: string;
    description: string;
}

export interface ConfigListItem {
    id: string;
    name: string;
    isRunning: boolean;
}


const transport = new TransportAdapter(TransportType.HTTP, {
    prefix: '',
    serverUrl: API_BASE_URL
});



const callAPI = async <T>(req: { method: string; payload: any }): Promise<T> => {
    const res = await transport.invokeDirect(req);
    if (!res.success) throw new Error(`请求失败: ${res.error}`);
    return res.data;
}

// 获取应用配置
export const getAppSetting = async (): Promise<AppSettings> =>   callAPI<AppSettings>({ method: '/config/getAppSetting', payload: {} });

// 保存应用配置
export const saveAppSetting = async (config: AppSettings): Promise<void> => callAPI<void>({ method: '/config/saveAppSetting', payload: config });

// 获取模型配置
export const getModels = async (providerId: ProviderId): Promise<Model[]> => callAPI<Model[]>({ method: '/config/getModels', payload: {providerId} });

 
 
export class ConfigAPI {
    private async callAPI<T>(req: { method: string; payload: any }): Promise<T> {
        const res = await transport.invokeDirect(req);
        if (!res.success) throw new Error(`请求失败: ${res.error}`);
        return res.data;
    }

    async getModelConfig(): Promise<AppSettings> {
        return this.callAPI({ method: 'getAppSetting', payload: {} });
    }

    async getModels(providerId: ProviderId): Promise<AppSettings> {
        return this.callAPI({ method: 'getModels', payload: { providerId } });
    }

    async saveAppSetting(config: AppSettings): Promise<void> {
        return this.callAPI({ method: 'saveAppSetting', payload: config });
    }

    async getConfigList(): Promise<ConfigListItem[]> {
        return this.callAPI({ method: 'list', payload: {} });
    }

    async getConfigById(id: string): Promise<MCPConfig> {
        return this.callAPI({ method: 'getConfigById', payload: { id } });
    }

    async toggleMCPStatus(id: string): Promise<boolean> {
        return this.callAPI({ method: 'toggleMCPStatus', payload: { id } });
    }

    async capabilities(id: string): Promise<Capability[]> {
        return this.callAPI({ method: 'capabilities', payload: { id } });
    }

    async saveConfig(config: MCPConfig): Promise<void> {
        return this.callAPI({ method: 'saveConfig', payload: { config } });
    }

    async loadConfig(): Promise<MCPConfig> {
        return this.callAPI({ method: 'loadConfig', payload: {} });
    }
}

export const configAPI = new ConfigAPI();