import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const locationCode = searchParams.get('locationCode');
    const userId = searchParams.get('user_id');

    if (!locationCode || !userId) {
      return NextResponse.json({ error: "locationCode and user_id are required" }, { status: 400 });
    }

    const result = await query('SELECT * FROM special_off_days WHERE location_code = $1 AND user_id = $2', [locationCode, userId]);
    return NextResponse.json({ offDays: result.rows });
  } catch (error) {
    console.error("Error fetching calendar data:", error);
    return NextResponse.json({ error: "Failed to fetch calendar data" }, { status: 500 });
  }
}
