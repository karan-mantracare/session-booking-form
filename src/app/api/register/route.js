import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    const { name, email, department } = await request.json();

    if (!name || !email || !department) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const insertQuery = `
      INSERT INTO users (name, email, department)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, department;
    `;
    
    const result = await query(insertQuery, [name, email, department]);
    const newUser = result.rows[0];

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Failed to register user" }, { status: 500 });
  }
}
