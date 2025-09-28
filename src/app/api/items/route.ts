import { NextRequest, NextResponse } from 'next/server';
import { getDB, saveDB, generateId, getNextOrderRank } from '@/lib/db';
import { CreateItemSchema } from '@/lib/schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateItemSchema.parse(body);
    
    const db = await getDB();
    
    // Verify the list exists
    const list = db.lists.find(l => l.id === validatedData.listId);
    if (!list) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      );
    }
    
    const newItem = {
      id: generateId(),
      listId: validatedData.listId,
      title: validatedData.title,
      orderRank: await getNextOrderRank('items', validatedData.listId),
      version: 1,
      updatedAt: new Date().toISOString()
    };

    db.items.push(newItem);
    await saveDB(db);

    return NextResponse.json({ success: true, item: newItem });
  } catch (error) {
    console.error('Error creating item:', error);
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    );
  }
}