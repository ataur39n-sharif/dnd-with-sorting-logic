import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listId } = await params;
    const db = await getDB();
    
    // Verify the list exists
    const list = db.lists.find(l => l.id === listId);
    if (!list) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      );
    }
    
    // Get items for this list, sorted by orderRank
    const items = db.items
      .filter(item => item.listId === listId)
      .sort((a, b) => a.orderRank - b.orderRank);
    
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}