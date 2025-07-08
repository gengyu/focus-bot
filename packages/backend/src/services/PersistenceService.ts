import Database from 'better-sqlite3';
import path from 'path';

export interface PersistenceOptions {
  dataDir?: string;
  configFileName: string;
}

export class PersistenceService<T = any> {
  private db: Database.Database;
  private tableName: string;

  constructor(options: PersistenceOptions) {
    const dataDir = options.dataDir || path.join(process.cwd(), 'data');
    const dbPath = path.join(dataDir, options.configFileName.replace(/\.json$/, '.sqlite3'));
    this.tableName = options.configFileName.replace(/\.json$/, '');
    this.db = new Database(dbPath);
    this.initialize();
  }

  private initialize() {
    // Table: key (TEXT PRIMARY KEY), value (TEXT)
    this.db.prepare(
      `CREATE TABLE IF NOT EXISTS ${this.tableName} (key TEXT PRIMARY KEY, value TEXT NOT NULL)`
    ).run();
  }

  async saveData(data: T, id?: string): Promise<void> {
    const key = id || 'default';
    const value = JSON.stringify(data);
    this.db.prepare(
      `INSERT INTO ${this.tableName} (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`
    ).run(key, value);
  }

  async loadData(id?: string): Promise<T | undefined> {
    const key = id || 'default';
    const row = this.db.prepare(
      `SELECT value FROM ${this.tableName} WHERE key = ?`
    ).get(key) as any;
    if (!row) return undefined;
    return JSON.parse(row.value) as T;
  }
}