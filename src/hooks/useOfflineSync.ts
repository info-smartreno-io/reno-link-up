import { useState, useEffect } from 'react';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineDB extends DBSchema {
  leads: {
    key: string;
    value: any;
  };
  visits: {
    key: string;
    value: any;
  };
  pendingUpdates: {
    key: string;
    value: {
      id: string;
      type: 'lead' | 'visit';
      action: 'create' | 'update';
      data: any;
      timestamp: number;
    };
  };
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [db, setDb] = useState<IDBPDatabase<OfflineDB> | null>(null);

  useEffect(() => {
    const initDB = async () => {
      const database = await openDB<OfflineDB>('field-sales-db', 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('leads')) {
            db.createObjectStore('leads', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('visits')) {
            db.createObjectStore('visits', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('pendingUpdates')) {
            db.createObjectStore('pendingUpdates', { keyPath: 'id' });
          }
        },
      });
      setDb(database);
    };

    initDB();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const saveLocally = async (storeName: 'leads' | 'visits', data: any) => {
    if (!db) return;
    await db.put(storeName, data);
  };

  const getLocally = async (storeName: 'leads' | 'visits', key: string) => {
    if (!db) return null;
    return await db.get(storeName, key);
  };

  const getAllLocally = async (storeName: 'leads' | 'visits') => {
    if (!db) return [];
    return await db.getAll(storeName);
  };

  const queueUpdate = async (type: 'lead' | 'visit', action: 'create' | 'update', data: any) => {
    if (!db) return;
    const id = `${type}-${action}-${Date.now()}`;
    await db.put('pendingUpdates', {
      id,
      type,
      action,
      data,
      timestamp: Date.now(),
    });
  };

  const getPendingUpdates = async () => {
    if (!db) return [];
    return await db.getAll('pendingUpdates');
  };

  const clearPendingUpdate = async (id: string) => {
    if (!db) return;
    await db.delete('pendingUpdates', id);
  };

  return {
    isOnline,
    saveLocally,
    getLocally,
    getAllLocally,
    queueUpdate,
    getPendingUpdates,
    clearPendingUpdate,
  };
}
