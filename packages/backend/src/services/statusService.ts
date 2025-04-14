import fs from 'fs';
import path from 'path';

interface MCPStatus {
  [id: string]: {
    isRunning: boolean;
    lastUpdated: string;
  };
}

export class StatusService {
  private statusFilePath: string;

  constructor(dataDir: string = path.join(process.cwd(), 'data')) {
    this.statusFilePath = path.join(dataDir, 'mcp-status.json');
  }

  private async ensureStatusFile(): Promise<void> {
    try {
      await fs.promises.access(this.statusFilePath);
    } catch {
      await fs.promises.writeFile(this.statusFilePath, JSON.stringify({}, null, 2));
    }
  }

  async getStatus(id: string): Promise<boolean> {
    await this.ensureStatusFile();
    try {
      const status: MCPStatus = JSON.parse(
        await fs.promises.readFile(this.statusFilePath, 'utf-8')
      );
      return status[id]?.isRunning || false;
    } catch (error) {
      console.error('Error reading status:', error);
      return false;
    }
  }

  async setStatus(id: string, isRunning: boolean): Promise<void> {
    await this.ensureStatusFile();
    try {
      const status: MCPStatus = JSON.parse(
        await fs.promises.readFile(this.statusFilePath, 'utf-8')
      );
      
      status[id] = {
        isRunning,
        lastUpdated: new Date().toISOString()
      };

      await fs.promises.writeFile(
        this.statusFilePath,
        JSON.stringify(status, null, 2)
      );
    } catch (error) {
      throw new Error(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllStatus(): Promise<MCPStatus> {
    await this.ensureStatusFile();
    try {
      return JSON.parse(
        await fs.promises.readFile(this.statusFilePath, 'utf-8')
      );
    } catch (error) {
      console.error('Error reading all status:', error);
      return {};
    }
  }
}