import { z } from 'zod';

export const CreateListSchema = z.object({
  title: z.string().min(1).max(100)
});

export const UpdateListSchema = z.object({
  title: z.string().min(1).max(100).optional()
});

export const MoveListSchema = z.object({
  beforeId: z.string().nullable().optional(),
  afterId: z.string().nullable().optional()
});

export const CreateItemSchema = z.object({
  listId: z.string(),
  title: z.string().min(1).max(200)
});

export const UpdateItemSchema = z.object({
  title: z.string().min(1).max(200).optional()
});

export const MoveItemSchema = z.object({
  targetListId: z.string().optional(),
  listId: z.string().optional(), // Add listId as alternative
  beforeId: z.string().nullable().optional(),
  afterId: z.string().nullable().optional()
});