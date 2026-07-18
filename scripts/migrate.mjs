import pg from 'pg'
import { readFileSync } from 'fs'

const { Pool } = pg

const sql = readFileSync(
  new URL('../supabase/migrations/20240101000000_create_tables.sql', import.meta.url),
  'utf-8'
)

const PASSWORD = 'dLhwg0kca7nsJv'
const PROJECT_REF = 'hunezjiapvawfkceplcu'

async function run() {
  // Try direct connection first
  const pool = new Pool({
    host: `db.${PROJECT_REF}.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: PASSWORD,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })

  try {
    const client = await pool.connect()
    console.log('Connected to database!')
    
    await client.query(sql)
    console.log('Tables created successfully!')
    
    // Verify
    const { rows } = await client.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' ORDER BY table_name`
    )
    console.log('Tables:', rows.map(r => r.table_name).join(', '))
    
    client.release()
    await pool.end()
    return
  } catch (err) {
    console.error('Direct connection failed:', err.message)
    // Try pooler
    console.log('Trying pooler connection...')
  }

  const pool2 = new Pool({
    host: 'aws-0-ap-northeast-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: `postgres.${PROJECT_REF}`,
    password: PASSWORD,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })

  try {
    const client2 = await pool2.connect()
    console.log('Connected via pooler!')
    await client2.query(sql)
    console.log('Tables created successfully!')
    const { rows } = await client2.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' ORDER BY table_name`
    )
    console.log('Tables:', rows.map(r => r.table_name).join(', '))
    client2.release()
    await pool2.end()
  } catch (err2) {
    console.error('Pooler also failed:', err2.message)
    console.error('Please run the SQL manually in Supabase Dashboard SQL Editor.')
  }
}

run()
