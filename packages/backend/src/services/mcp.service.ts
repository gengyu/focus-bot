import { ChildProcess, spawn } from 'child_process';
import { MCPConfig, MCPServerConfig } from '../types/config';

export class MCPService {
  private servers: Map<string, ChildProcess> = new Map();

  constructor(private config: MCPConfig) {}

  async startServers() {
    const { mcpServers } = this.config;
    
    for (const [name, serverConfig] of Object.entries(mcpServers)) {
      await this.startServer(name, serverConfig);
    }
  }

  private async startServer(name: string, config: MCPServerConfig) {
    if (this.servers.has(name)) {
      throw new Error(`Server ${name} is already running`);
    }

    const server = spawn(config.command, config.args);

    server.stdout.on('data', (data) => {
      console.log(`[${name}] stdout: ${data}`);
    });

    server.stderr.on('data', (data) => {
      console.error(`[${name}] stderr: ${data}`);
    });

    server.on('close', (code) => {
      console.log(`[${name}] process exited with code ${code}`);
      this.servers.delete(name);
    });

    this.servers.set(name, server);
  }

  async stopServers() {
    for (const [name, server] of this.servers) {
      await this.stopServer(name);
    }
  }

  private async stopServer(name: string) {
    const server = this.servers.get(name);
    if (!server) {
      return;
    }

    server.kill();
    this.servers.delete(name);
  }

  getRunningServers(): string[] {
    return Array.from(this.servers.keys());
  }
}