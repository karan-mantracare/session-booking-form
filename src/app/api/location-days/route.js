import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const locationCode = searchParams.get('locationCode');
    const userId = searchParams.get('user_id');

    if (!locationCode || !userId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Fetch distinct days that experts are available at this location
    const res = await query(`
      SELECT DISTINCT ec.days 
      FROM expert_to_company ec
      JOIN company_locations cl ON ec.company_id = cl.id
      WHERE cl.location_code = $1
    `, [locationCode]);

    const availableDays = res.rows.map(row => row.days);

    return NextResponse.json({ availableDays });
  } catch (error) {
    console.error("Error fetching location days:", error);
    return NextResponse.json({ error: "Failed to fetch days" }, { status: 500 });
  }
}
