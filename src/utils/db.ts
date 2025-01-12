import type { Rule, Workspace } from "@/modules/base";

// IndexedDB 工具类
class DB {
  dbName: string;
  version: number;
  db: IDBDatabase | null;

  constructor(dbName: string, version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  // 打开数据库连接
  async open() {
    if (this.db) return this.db;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 搜索历史表
        if (!db.objectStoreNames.contains('searchHistory')) {
          const searchHistoryStore = db.createObjectStore('searchHistory', { keyPath: 'uuid' });
          searchHistoryStore.createIndex('term', 'term', { unique: false });
          searchHistoryStore.createIndex('isFavorite', 'isFavorite', { unique: false });
          searchHistoryStore.createIndex('updateTime', 'updateTime', { unique: false });
          searchHistoryStore.createIndex('useCount', 'useCount', { unique: false });
        }

        // 工作空间表
        if (!db.objectStoreNames.contains('workspace')) {
          const workspaceStore = db.createObjectStore('workspace', { keyPath: 'id' });
          workspaceStore.createIndex('id', 'id', { unique: false });
          workspaceStore.createIndex('name', 'name', { unique: false });
        }

        // 规则表
        if (!db.objectStoreNames.contains('rule')) {
          const ruleStore = db.createObjectStore('rule', { keyPath: 'uuid' });
          ruleStore.createIndex('id', 'id', { unique: true });
          ruleStore.createIndex('uuid', 'uuid', { unique: true });
        }

        // 设置表
        
        if (!db.objectStoreNames.contains('settings')) {
            const settingsStore = db.createObjectStore('settings', { keyPath: 'key' });
            settingsStore.createIndex('key', 'key', { unique: true });
            settingsStore.createIndex('value', 'value', { unique: false });
          } 
      };
    });
  }

  // 添加数据
  async add(storeName: string, data: object) {
    console.log("add", storeName, data);
    const db = await this.open() as IDBDatabase;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(JSON.parse(JSON.stringify(data)));
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 获取数据
  async get(storeName: string, key: string|number) {
    const db = await this.open() as IDBDatabase;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 更新数据
  async put(storeName: string, data: object) {
    const db = await this.open() as IDBDatabase;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(JSON.parse(JSON.stringify(data)));
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 删除数据
  async delete(storeName: string, key: string|number) {
    const db = await this.open() as IDBDatabase;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 获取所有数据
  async getAll(storeName: string) {
    const db = await this.open() as IDBDatabase;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(JSON.parse(JSON.stringify(request.result)));
      request.onerror = () => reject(request.error);
    });
  }

  // 使用索引查询数据
    async getByIndex(storeName: string, indexName: string, value: string | number) {
    const db = await this.open() as IDBDatabase;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 按范围查询
  async getByRange(storeName: string, indexName: string, range: IDBKeyRange) {
    const db = await this.open() as IDBDatabase;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(range);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 清理过期缓存
  async clearExpiredCache() {
    const now = new Date().getTime();
    const db = await this.open() as IDBDatabase;
    const transaction = db.transaction('cache', 'readwrite');
    const store = transaction.objectStore('cache');
    const index = store.index('expireTime');
    
    const range = IDBKeyRange.upperBound(now);
    const request = index.openCursor(range);
    
    request.onsuccess = (event: Event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        cursor.continue();
      }
    };
  }
}

// 创建一个默认的数据库实例
export const db = new DB('logdog_db9', 1); 

export const searchTableHelper = {
    add: (data: object) => db.add('searchHistory', data),
    get: (key: string|number) => db.get('searchHistory', key),
    put: (data: object) => db.put('searchHistory', data),
    delete: (key: string|number) => db.delete('searchHistory', key),
    getAll: () => db.getAll('searchHistory'),
}

export const workspaceTableHelper = {
    add: (data: Workspace) => db.add('workspace', data),
    get: (key: string|number) => db.get('workspace', key) as Promise<Workspace>,
    put: (data: Workspace) => db.put('workspace', data),
    delete: (key: string|number) => db.delete('workspace', key),
    getAll: () => db.getAll('workspace') as Promise<Workspace[]>,
    isExistById: async (id: number): Promise<boolean> => {
        const result = await db.getByIndex('workspace', 'id', id) as Workspace[];
        return result.length > 0;
    },
}

export const ruleTableHelper = {
    insertOrUpdate: async (data: Rule) => {
        if (await ruleTableHelper.isExistByUuid(data.uuid)) {
            return ruleTableHelper.put(data);
        } else {
            return ruleTableHelper.add(data);
        }
    },
    add: (data: Rule) => db.add('rule', data),
    get: (key: string|number) => db.get('rule', key) as Promise<Rule>,
    put: (data: Rule) => db.put('rule', data),
    delete: (key: string|number) => db.delete('rule', key),
    getAll: () => db.getAll('rule') as Promise<Rule[]>,
    isExistById: async (id: number): Promise<boolean> => {
        const result = await db.getByIndex('rule', 'id', id) as Rule[];
        return result.length > 0;
    },
    isExistByUuid: async (uuid: string): Promise<boolean> => {
        const result = await db.getByIndex('rule', 'uuid', uuid) as Rule[];
        return result.length > 0;
    },
}

export const settingsTableHelper = {
    get: async (key: string, defaultValue: number | string | boolean | null) => {
        const result = await db.get('settings', key) as { value: number | string | boolean | null };
        return result ? result.value : defaultValue;
    },
    set: async (key: string, value: number | string | boolean | null) => {
        const existingSetting = await db.get('settings', key);
        if (existingSetting) {
            return db.put('settings', { key, value });
        } else {
            return db.add('settings', { key, value });
        }
    },
}