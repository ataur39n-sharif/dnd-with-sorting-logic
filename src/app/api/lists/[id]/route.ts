import { NextRequest, NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db';
import { UpdateListSchema } from '@/lib/schemas';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = UpdateListSchema.parse(body);
    
    const db = await getDB();
    const listIndex = db.lists.findIndex(l => l.id === params.id);
    
    if (listIndex === -1) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      );
    }

    db.lists[listIndex] = {
      ...db.lists[listIndex],
      title: validatedData.title || db.lists[listIndex].title,
      version: db.lists[listIndex].version + 1,
      updatedAt: new Date().toISOString()
    };

    await saveDB(db);

    return NextResponse.json({ success: true, list: db.lists[listIndex] });
  } catch (error) {
    console.error('Error updating list:', error);
    return NextResponse.json(
      { error: 'Failed to update list' },
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
    const listIndex = db.lists.findIndex(l => l.id === params.id);
    
    if (listIndex === -1) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      );
    }

    // Remove the list
    db.lists.splice(listIndex, 1);
    
    // Remove all items in this list
    db.items = db.items.filter(item => item.listId !== params.id);

    await saveDB(db);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting list:', error);
    return NextResponse.json(
      { error: 'Failed to delete list' },
      { status: 500 }
    );
  }
}