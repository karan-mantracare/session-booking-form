import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    const data = await request.json();
    const { expert_id, booking_date, booking_time, user_id } = data;

    if (!expert_id || !booking_date || !booking_time || !user_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Clean up old holds
    await query(`
      DELETE FROM on_hold_slots 
      WHERE created_at < NOW() - INTERVAL '1 minute'
    `);

    // 2. Check if the slot is already booked
    const bookingRes = await query(`
      SELECT 1 FROM bookings 
      WHERE expert_id = $1 AND booking_date = $2 AND booking_time = $3
    `, [expert_id, booking_date, booking_time]);

    if (bookingRes.rows.length > 0) {
      return NextResponse.json({ error: "Slot is already booked." }, { status: 409 });
    }

    // 3. Check if someone else is holding it
    const holdRes = await query(`
      SELECT user_id FROM on_hold_slots
      WHERE expert_id = $1 AND booking_date = $2 AND booking_time = $3
    `, [expert_id, booking_date, booking_time]);

    if (holdRes.rows.length > 0) {
      // Postgres might return user_id as string if it's BIGINT
      if (holdRes.rows[0].user_id != user_id) {
        return NextResponse.json({ error: "Slot is currently on hold by another user." }, { status: 409 });
      } else {
        // User is already holding it, refresh the hold
        await query(`
          UPDATE on_hold_slots 
          SET created_at = CURRENT_TIMESTAMP
          WHERE expert_id = $1 AND booking_date = $2 AND booking_time = $3 AND user_id = $4
        `, [expert_id, booking_date, booking_time, user_id]);
        return NextResponse.json({ success: true, message: "Hold refreshed" });
      }
    }

    // 4. Create new hold
    // First remove any existing hold for this user so they can only hold one slot at a time
    await query(`
      DELETE FROM on_hold_slots WHERE user_id = $1
    `, [user_id]);

    await query(`
      INSERT INTO on_hold_slots (expert_id, booking_date, booking_time, user_id)
      VALUES ($1, $2, $3, $4)
    `, [expert_id, booking_date, booking_time, user_id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in hold-slot:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
