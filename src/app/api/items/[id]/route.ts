import { NextRequest, NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db';
import { UpdateItemSchema } from '@/lib/schemas';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = UpdateItemSchema.parse(body);
    
    const db = await getDB();
    const itemIndex = db.items.findIndex(i => i.id === params.id);
    
    if (itemIndex === -1) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    db.items[itemIndex] = {
      ...db.items[itemIndex],
      title: validatedData.title || db.items[itemIndex].title,
      version: db.items[itemIndex].version + 1,
      updatedAt: new Date().toISOString()
    };

    await saveDB(db);

    return NextResponse.json({ success: true, item: db.items[itemIndex] });
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDB();
    const itemIndex = db.items.findIndex(i => i.id === params.id);
    
    if (itemIndex === -1) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    db.items.splice(itemIndex, 1);
    await saveDB(db);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}