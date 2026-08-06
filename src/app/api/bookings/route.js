import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    const data = await request.json();
    
    const requiredFields = ['employee_name', 'employee_email', 'department', 'location_code', 'expert_id', 'expert_name', 'booking_date', 'booking_time', 'user_id'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
      }
    }

    // Save the booking
    const insertQuery = `
      INSERT INTO bookings (employee_name, employee_email, department, location_code, feeling, expert_id, expert_name, session_status, booking_date, booking_time, duration, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'booked', $8, $9, 60, $10)
      RETURNING *;
    `;
    const values = [
      data.employee_name,
      data.employee_email,
      data.department,
      data.location_code,
      data.feeling || '',
      data.expert_id,
      data.expert_name,
      data.booking_date,
      data.booking_time,
      data.user_id
    ];

    let result;
    try {
      result = await query(insertQuery, values);
    } catch (dbError) {
      // Check if it's a unique constraint violation (code 23505)
      if (dbError.code === '23505') {
        return NextResponse.json({ error: "Sorry, this slot has just been booked by another user. Please select a different time." }, { status: 409 });
      }
      throw dbError;
    }
    
    const newBooking = result.rows[0];

    // Remove the hold since booking is confirmed
    await query(`
      DELETE FROM on_hold_slots WHERE user_id = $1
    `, [data.user_id]);

    // Fetch the expert email
    let expertEmail = null;
    try {
      const expertResult = await query('SELECT email FROM experts WHERE id = $1', [data.expert_id]);
      if (expertResult.rows.length > 0) {
        expertEmail = expertResult.rows[0].email;
      }
    } catch (e) {
      console.error("Failed to fetch expert email:", e);
    }
    
    // Add expert_email to the webhook payload
    const webhookPayload = {
      ...newBooking,
      expert_email: expertEmail
    };

    // Trigger Webhook
    try {
      const webhookUrl = 'https://workflows.mantracare.com/webhook/mbrdi-session-booking';
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      });
      if (!webhookResponse.ok) {
        const errText = await webhookResponse.text();
        console.error("Webhook failed with status", webhookResponse.status, errText);
      } else {
        console.log("Webhook triggered successfully");
      }
    } catch (webhookError) {
      console.error("Failed to trigger webhook:", webhookError);
    }

    return NextResponse.json({ success: true, booking: newBooking }, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
