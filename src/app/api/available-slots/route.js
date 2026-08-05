import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { parse, addMinutes, format, isBefore } from 'date-fns';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const locationCode = searchParams.get('locationCode');
    const dateStr = searchParams.get('date'); 
    const dayOfWeek = searchParams.get('day'); 

    if (!locationCode || !dateStr || !dayOfWeek) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Fetch experts for the location, day and user_id using the mapping table
    const expertsRes = await query(`
      SELECT 
        e.id, 
        e.expert_name, 
        e.expert_type as counselor_type, 
        ec.start_time, 
        ec.end_time 
      FROM experts e
      JOIN expert_to_company ec ON e.id = ec.expert_id
      JOIN company_locations cl ON ec.company_id = cl.id
      WHERE cl.location_code = $1 
        AND ec.days = $2 
    `, [locationCode, dayOfWeek]);
    
    const experts = expertsRes.rows;

    // Fetch leaves for the date
    const leavesRes = await query(
      'SELECT expert_id FROM leaves WHERE leave_date = $1',
      [dateStr]
    );
    const leaveExpertIds = leavesRes.rows.map(l => l.expert_id);

    // Fetch bookings for the date
    const bookingsRes = await query(
      'SELECT expert_id, booking_time, duration FROM bookings WHERE booking_date = $1',
      [dateStr]
    );
    const bookings = bookingsRes.rows;

    // Filter out experts who are on leave
    const availableExperts = experts.filter(e => !leaveExpertIds.includes(e.id));

    // Generate slots
    const expertSlots = availableExperts.map(expert => {
      const slots = [];
      let currentTime = parse(expert.start_time, 'HH:mm:ss', new Date());
      const endTime = parse(expert.end_time, 'HH:mm:ss', new Date());

      while (isBefore(currentTime, endTime)) {
        const timeString = format(currentTime, 'HH:mm');
        const proposedSessionEnd = addMinutes(currentTime, 60);
        
        // Skip if the 60 min session exceeds the expert's working hours
        if (proposedSessionEnd > endTime) {
          currentTime = addMinutes(currentTime, 30);
          continue;
        }
        
        const isBooked = bookings.some(b => {
          if (b.expert_id !== expert.id) return false;
          
          const bStart = parse(b.booking_time, 'HH:mm:ss', new Date());
          const bEnd = addMinutes(bStart, b.duration || 60); 
          
          const slotStart = currentTime;
          const slotEnd = proposedSessionEnd;
          
          // True if the proposed 60 min slot overlaps with an existing booking
          return isBefore(bStart, slotEnd) && isBefore(slotStart, bEnd);
        });
        
        if (!isBooked) {
          slots.push(timeString);
        }
        
        currentTime = addMinutes(currentTime, 30);
      }

      return {
        expert_id: expert.id,
        expert_name: expert.expert_name,
        counselor_type: expert.counselor_type,
        available_slots: slots
      };
    });

    return NextResponse.json({ expertSlots });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return NextResponse.json({ error: "Failed to fetch available slots" }, { status: 500 });
  }
}
