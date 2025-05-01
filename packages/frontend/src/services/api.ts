import type {MCPConfig} from '../types/config';
import {TransportAdapter, TransportType} from "../transports";
import type {AppSetting} from "../../../../share/type.ts";

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


const transport = new TransportAdapter(TransportType.HTTP, {
    prefix: 'config',
    serverUrl: API_BASE_URL
});

export class ConfigAPI {
    async getModelConfig(): Promise<AppSetting> {
        const req = {method: 'getAppSetting', payload: {}};
        const res = await transport.invokeDirect(req);
        if (!res.success) throw new Error(`获取模型配置失败: ${res.error}`);
        return res.data;
    }

    async saveModelConfig(config: AppSetting): Promise<void> {
        const req = {method: 'saveAppSetting', payload: config};
        const res = await transport.invokeDirect(req);
        if (!res.success) throw new Error(`保存模型配置失败: ${res.error}`);
    }

    async getConfigList(): Promise<ConfigListItem[]> {
        const req = {method: 'list', payload: {}};
        const res = await transport.invokeDirect(req);
        if (!res.success) throw new Error(`获取配置列表失败: ${res.error}`);
        return res.data;
    }

    async getConfigById(id: string): Promise<MCPConfig> {
        const req = {method: 'getConfigById', payload: {id}};
        const res = await transport.invokeDirect(req);
        if (!res.success) throw new Error(`获取配置详情失败: ${res.error}`);
        return res.data;
    }

    async toggleMCPStatus(id: string): Promise<boolean> {
        const req = {method: 'toggleMCPStatus', payload: {id}};
        const res = await transport.invokeDirect(req);
        if (!res.success) throw new Error(`切换MCP状态失败: ${res.error}`);
        return res.data.isRunning;
    }

    async capabilities(id: string): Promise<Capability[]> {
        const req = {method: 'capabilities', payload: {id}};
        const res = await transport.invokeDirect(req);
        if (!res.success) throw new Error(`获取服务器能力列表失败: ${res.error}`);
        return res.data;
    }

    async saveConfig(config: MCPConfig): Promise<void> {
        const req = {method: 'saveConfig', payload: {config}};
        const res = await transport.invokeDirect(req);
        if (!res.success) throw new Error(`保存配置失败: ${res.error}`);
    }

    async loadConfig(): Promise<MCPConfig> {
        const req = {method: 'loadConfig', payload: {}};
        const res = await transport.invokeDirect(req);
        if (!res.success) throw new Error(`加载配置失败: ${res.error}`);
        return res.data;
    }
}

export const configAPI = new ConfigAPI();