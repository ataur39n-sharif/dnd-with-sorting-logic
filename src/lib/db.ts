import { v4 as uuidv4 } from 'uuid';
import { ActionList, ActionItem, DB } from './types';
import { DEFAULT_STEP } from './ranking';
import { getDBFromCookies, saveDBToCookies } from './cookies';

export async function getDB(): Promise<DB> {
  return await getDBFromCookies();
}

export async function saveDB(db: DB): Promise<void> {
  await saveDBToCookies(db);
}

export function generateId(): string {
  return uuidv4();
}

export async function getNeighbors(params: {
  collection: 'lists' | 'items';
  listId?: string;
  beforeId?: string;
  afterId?: string;
}): Promise<{ leftRank?: number; rightRank?: number }> {
  const { collection, listId, beforeId, afterId } = params;
  
  const db = await getDB();
  let items: (ActionList | ActionItem)[];
  
  if (collection === 'lists') {
    items = db.lists.sort((a, b) => a.orderRank - b.orderRank);
  } else {
    items = db.items
      .filter(item => !listId || item.listId === listId)
      .sort((a, b) => a.orderRank - b.orderRank);
  }

  let leftRank: number | undefined;
  let rightRank: number | undefined;

  console.log(`getNeighbors called with:`, { collection, listId, beforeId, afterId });
  console.log(`Items in collection:`, items.map(item => ({ id: item.id, orderRank: item.orderRank })));

  if (beforeId) {
    // beforeId represents the item that comes BEFORE the new position
    // So leftRank should be the rank of beforeId, and rightRank should be the next item
    const beforeIndex = items.findIndex(item => item.id === beforeId);
    if (beforeIndex !== -1) {
      leftRank = items[beforeIndex].orderRank;
      if (beforeIndex < items.length - 1) {
        rightRank = items[beforeIndex + 1].orderRank;
      }
    }
    console.log(`beforeId logic: beforeIndex=${beforeIndex}, leftRank=${leftRank}, rightRank=${rightRank}`);
  } else if (afterId) {
    // afterId represents the item that comes AFTER the new position
    // So rightRank should be the rank of afterId, and leftRank should be the previous item
    const afterIndex = items.findIndex(item => item.id === afterId);
    if (afterIndex !== -1) {
      rightRank = items[afterIndex].orderRank;
      if (afterIndex > 0) {
        leftRank = items[afterIndex - 1].orderRank;
      }
    }
    console.log(`afterId logic: afterIndex=${afterIndex}, leftRank=${leftRank}, rightRank=${rightRank}`);
  }

  console.log(`getNeighbors result:`, { leftRank, rightRank });
  return { leftRank, rightRank };
}

export async function getNextOrderRank(collection: 'lists' | 'items', listId?: string): Promise<number> {
  const db = await getDB();
  let items: (ActionList | ActionItem)[];
  
  if (collection === 'lists') {
    items = db.lists;
  } else {
    items = db.items.filter(item => !listId || item.listId === listId);
  }
  
  if (items.length === 0) {
    return DEFAULT_STEP;
  }
  
  const maxRank = Math.max(...items.map(item => item.orderRank));
  return maxRank + DEFAULT_STEP;
}