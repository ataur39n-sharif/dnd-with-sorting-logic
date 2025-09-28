import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDB();
    return NextResponse.json(db);
  } catch (error) {
    console.error('Error fetching database:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database' },
      { status: 500 }
    );
  }
}