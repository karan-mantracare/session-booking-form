import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_Nsum2UB3blSQ@ep-curly-bonus-azx48qjl-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function migrate() {
  try {
    await client.connect();
    console.log("Connected to DB, applying schema migrations...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS on_hold_slots (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          expert_id UUID REFERENCES experts(id) ON DELETE CASCADE,
          booking_date DATE NOT NULL,
          booking_time TIME NOT NULL,
          user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Created on_hold_slots table");

    await client.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1
              FROM pg_constraint
              WHERE conname = 'unique_booking_slot'
          ) THEN
              ALTER TABLE bookings
              ADD CONSTRAINT unique_booking_slot UNIQUE (expert_id, booking_date, booking_time);
          END IF;
      END $$;
    `);
    console.log("Added unique constraint on bookings");

    console.log("Migration successful.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

migrate();
