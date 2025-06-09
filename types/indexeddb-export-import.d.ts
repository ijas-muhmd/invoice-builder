declare module 'indexeddb-export-import' {
  export function exportToJsonString(
    db: IDBDatabase,
    callback: (err: any, jsonString: string) => void
  ): void;
  export function importFromJsonString(
    db: IDBDatabase,
    jsonString: string,
    callback: (err: any) => void
  ): void;
} 