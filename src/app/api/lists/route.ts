import { NextRequest, NextResponse } from 'next/server';
import { getDB, saveDB, generateId, getNextOrderRank } from '@/lib/db';
import { CreateListSchema } from '@/lib/schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateListSchema.parse(body);
    
    const db = await getDB();
    
    const newList = {
      id: generateId(),
      userId: 'user-1', // For demo purposes
      title: validatedData.title,
      orderRank: await getNextOrderRank('lists'),
      version: 1,
      updatedAt: new Date().toISOString()
    };

    db.lists.push(newList);
    await saveDB(db);

    return NextResponse.json({ success: true, list: newList });
  } catch (error) {
    console.error('Error creating list:', error);
    return NextResponse.json(
      { error: 'Failed to create list' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const db = await getDB();
    return NextResponse.json(db.lists);
  } catch (error) {
    console.error('Error fetching lists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lists' },
      { status: 500 }
    );
  }
}