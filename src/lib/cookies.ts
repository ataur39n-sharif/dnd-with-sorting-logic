import { cookies } from 'next/headers';
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

// Server-side: Get database from cookies
export async function getDBFromCookies(): Promise<DB> {
  try {
    const cookieStore = await cookies();
    const dbCookie = cookieStore.get(COOKIE_NAME);
    
    if (!dbCookie?.value) {
      return DEFAULT_DB;
    }
    
    return deserializeDB(dbCookie.value);
  } catch (error) {
    console.error('Error getting database from cookies:', error);
    return DEFAULT_DB;
  }
}

// Server-side: Save database to cookies
export async function saveDBToCookies(db: DB): Promise<void> {
  try {
    const cookieStore = await cookies();
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
    
    cookieStore.set(COOKIE_NAME, serialized, {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });
  } catch (error) {
    console.error('Error saving database to cookies:', error);
  }
}

// Client-side cookie operations
export function getDBFromClientCookies(): DB {
  if (typeof window === 'undefined') {
    return getDefaultDB();
  }
  
  try {
    const cookies = document.cookie.split(';');
    const dbCookie = cookies.find(cookie => 
      cookie.trim().startsWith(`${COOKIE_NAME}=`)
    );
    
    if (!dbCookie) {
      return getDefaultDB();
    }
    
    const value = dbCookie.split('=')[1];
    return deserializeDB(decodeURIComponent(value));
  } catch (error) {
    console.error('Error reading DB from client cookies:', error);
    return getDefaultDB();
  }
}

export function saveDBToClientCookies(db: DB): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    const serialized = serializeDB(db);
    
    if (serialized.length > MAX_COOKIE_SIZE) {
      console.warn('DB data exceeds cookie size limit, truncating...');
      const truncatedDB = {
        lists: db.lists.slice(0, 10),
        items: db.items.slice(0, 50)
      };
      const truncatedSerialized = serializeDB(truncatedDB);
      document.cookie = `${COOKIE_NAME}=${encodeURIComponent(truncatedSerialized)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    } else {
      document.cookie = `${COOKIE_NAME}=${encodeURIComponent(serialized)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    }
  } catch (error) {
    console.error('Error saving DB to client cookies:', error);
  }
}

function getDefaultDB(): DB {
  return {
    lists: [
      {
        id: "list-1",
        userId: "user-1",
        title: "To Do",
        orderRank: 1024,
        version: 1,
        updatedAt: new Date().toISOString()
      },
      {
        id: "list-2", 
        userId: "user-1",
        title: "In Progress",
        orderRank: 2048,
        version: 1,
        updatedAt: new Date().toISOString()
      },
      {
        id: "list-3",
        userId: "user-1", 
        title: "Done",
        orderRank: 3072,
        version: 1,
        updatedAt: new Date().toISOString()
      }
    ],
    items: [
      {
        id: "item-1",
        listId: "list-1",
        title: "Design user interface",
        orderRank: 1024,
        version: 1,
        updatedAt: new Date().toISOString()
      },
      {
        id: "item-2",
        listId: "list-1",
        title: "Implement drag and drop",
        orderRank: 2048,
        version: 1,
        updatedAt: new Date().toISOString()
      },
      {
        id: "item-3",
        listId: "list-2",
        title: "Test functionality",
        orderRank: 1024,
        version: 1,
        updatedAt: new Date().toISOString()
      }
    ]
  };
}