import { Pool } from 'pg'

export const dbPool = new Pool({
  host: process.env.DB_HOST ?? 'localhost',
  user: process.env.DB_USER ?? 'postgres',
  database: process.env.DB_NAME ?? 'teleportation',
  password: process.env.DB_PASSWORD ?? 'abcdef',
  port: parseInt(process.env.DB_PORT || '5432', 10),
})

export const connectToDB = async () => {
  try {
    await dbPool.connect()
  } catch (err) {
    console.error(err)
  }
}

export const disconnectDB = async () => {
  try {
    await dbPool.end()
  } catch(err) {
    console.error(err)
  }
}
