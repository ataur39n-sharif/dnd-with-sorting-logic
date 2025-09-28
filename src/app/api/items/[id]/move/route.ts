import { NextRequest, NextResponse } from 'next/server';
import { getDB, saveDB, getNeighbors } from '@/lib/db';
import { MoveItemSchema } from '@/lib/schemas';
import { midRank, reindexCollection, DEFAULT_STEP } from '@/lib/ranking';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params;
    const body = await request.json();
    const validatedData = MoveItemSchema.parse(body);
    
    const db = await getDB();
    const item = db.items.find(i => i.id === itemId);
    
    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Support both targetListId and listId for backward compatibility
    const targetListId = validatedData.targetListId ?? validatedData.listId ?? item.listId;
    
    // Verify target list exists if moving to different list
    if (targetListId !== item.listId) {
      const targetList = db.lists.find(l => l.id === targetListId);
      if (!targetList) {
        return NextResponse.json(
          { error: 'Target list not found' },
          { status: 404 }
        );
      }
    }

    const { leftRank, rightRank } = await getNeighbors({
      collection: 'items',
      listId: targetListId,
      beforeId: validatedData.beforeId || undefined,
      afterId: validatedData.afterId || undefined
    });

    let newRank = midRank(leftRank, rightRank);
    
    if (Number.isNaN(newRank)) {
      // Reindex only items in the target list
      const listItems = db.items
        .filter(i => i.listId === targetListId)
        .sort((a, b) => a.orderRank - b.orderRank);
      
      reindexCollection(listItems, DEFAULT_STEP);
      
      // Recalculate neighbors after reindexing
      const { leftRank: L2, rightRank: R2 } = await getNeighbors({
        collection: 'items',
        listId: targetListId,
        beforeId: validatedData.beforeId || undefined,
        afterId: validatedData.afterId || undefined
      });
      newRank = midRank(L2, R2);
    }

    item.listId = targetListId;
    item.orderRank = newRank;
    item.version += 1;
    item.updatedAt = new Date().toISOString();
    await saveDB(db);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error moving item:', error);
    return NextResponse.json(
      { error: 'Failed to move item' },
      { status: 500 }
    );
  }
}