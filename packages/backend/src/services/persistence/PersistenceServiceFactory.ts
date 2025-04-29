import { Service } from '../container/decorators';
import { IPersistenceServiceFactory, IPersistenceService, PersistenceOptions } from '../interfaces/IPersistenceService';
import { FilePersistenceService } from './FilePersistenceService';

@Service('persistenceServiceFactory')
export class PersistenceServiceFactory implements IPersistenceServiceFactory {
  private services: Map<string, IPersistenceService> = new Map();

  createPersistenceService<T>(options: PersistenceOptions): IPersistenceService<T> {
    const serviceKey = `${options.configFileName}-${options.dataDir || 'default'}`;
    
    if (this.services.has(serviceKey)) {
      return this.services.get(serviceKey) as IPersistenceService<T>;
    }

    const service = new FilePersistenceService<T>(options);
    this.services.set(serviceKey, service);
    
    return service;
  }

  async dispose(): Promise<void> {
    for (const service of this.services.values()) {
      if (service instanceof FilePersistenceService) {
        service.stopAutoBackup();
      }
    }
    this.services.clear();
  }
}