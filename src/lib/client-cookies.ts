import type { DB } from './types';

const COOKIE_NAME = 'dnd-app-db';
const MAX_COOKIE_SIZE = 4000; // Leave some room for cookie overhead

// Default database structure
const DEFAULT_DB: DB = {
  lists: [],
  items: []
};

// Serialize database to string
export function serializeDB(db: DB): string {
  return JSON.stringify(db);
}

// Deserialize database from string
export function deserializeDB(data: string): DB {
  try {
    const parsed = JSON.parse(data);
    return {
      lists: parsed.lists || [],
      items: parsed.items || []
    };
  } catch (error) {
    console.error('Error deserializing database:', error);
    return DEFAULT_DB;
  }
}

// Client-side: Get database from cookies
export function getDBFromClientCookies(): DB {
  if (typeof document === 'undefined') {
    return DEFAULT_DB;
  }
  
  try {
    const cookies = document.cookie.split(';');
    const dbCookie = cookies.find(cookie => 
      cookie.trim().startsWith(`${COOKIE_NAME}=`)
    );
    
    if (!dbCookie) {
      return DEFAULT_DB;
    }
    
    const value = dbCookie.split('=')[1];
    if (!value) {
      return DEFAULT_DB;
    }
    
    return deserializeDB(decodeURIComponent(value));
  } catch (error) {
    console.error('Error getting database from client cookies:', error);
    return DEFAULT_DB;
  }
}

// Client-side: Save database to cookies
export function saveDBToClientCookies(db: DB): void {
  if (typeof document === 'undefined') {
    return;
  }
  
  try {
    let serialized = serializeDB(db);
    
    // Truncate if too large
    if (serialized.length > MAX_COOKIE_SIZE) {
      console.warn('Database too large for cookie, truncating...');
      const truncatedDB: DB = {
        lists: db.lists.slice(0, Math.floor(db.lists.length / 2)),
        items: db.items.slice(0, Math.floor(db.items.length / 2))
      };
      serialized = serializeDB(truncatedDB);
    }
    
    const maxAge = 60 * 60 * 24 * 30; // 30 days
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(serialized)}; max-age=${maxAge}; path=/; SameSite=Lax`;
  } catch (error) {
    console.error('Error saving database to client cookies:', error);
  }
}