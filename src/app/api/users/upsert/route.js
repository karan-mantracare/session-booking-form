import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    const data = await request.json();
    
    if (!data.user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    // Upsert the user
    const upsertQuery = `
      INSERT INTO users (id) 
      VALUES ($1)
      ON CONFLICT (id) DO NOTHING
      RETURNING *;
    `;
    
    await query(upsertQuery, [data.user_id]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error upserting user:", error);
    return NextResponse.json({ error: "Failed to upsert user" }, { status: 500 });
  }
}
