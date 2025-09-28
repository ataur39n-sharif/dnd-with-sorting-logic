import { NextRequest, NextResponse } from 'next/server';
import { getDB, saveDB, getNeighbors } from '@/lib/db';
import { MoveListSchema } from '@/lib/schemas';
import { midRank, reindexCollection, DEFAULT_STEP } from '@/lib/ranking';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = MoveListSchema.parse(body);
    
    const db = await getDB();
    const list = db.lists.find(l => l.id === params.id);
    
    if (!list) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      );
    }

    const { leftRank, rightRank } = await getNeighbors({
      collection: 'lists',
      beforeId: validatedData.beforeId || undefined,
      afterId: validatedData.afterId || undefined
    });

    let newRank = midRank(leftRank, rightRank);
    
    if (Number.isNaN(newRank)) {
      // Reindex all lists
      const sortedLists = db.lists.sort((a, b) => a.orderRank - b.orderRank);
      reindexCollection(sortedLists, DEFAULT_STEP);
      
      // Recalculate neighbors after reindexing
      const { leftRank: L2, rightRank: R2 } = await getNeighbors({
        collection: 'lists',
        beforeId: validatedData.beforeId || undefined,
        afterId: validatedData.afterId || undefined
      });
      newRank = midRank(L2, R2);
    }

    list.orderRank = newRank;
    list.version += 1;
    list.updatedAt = new Date().toISOString();

    await saveDB(db);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error moving list:', error);
    return NextResponse.json(
      { error: 'Failed to move list' },
      { status: 500 }
    );
  }
}