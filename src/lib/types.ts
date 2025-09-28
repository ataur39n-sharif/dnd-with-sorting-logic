export type ID = string;

export type ActionList = {
  id: ID;
  userId: ID;
  title: string;
  orderRank: number; // sparse integer rank
  version: number;
  updatedAt: string; // ISO timestamp
};

export type ActionItem = {
  id: ID;
  listId: ID;
  title: string;
  description?: string; // optional description field
  orderRank: number; // sparse integer rank
  version: number;
  updatedAt: string; // ISO timestamp
};

export type DB = {
  lists: ActionList[];
  items: ActionItem[];
};