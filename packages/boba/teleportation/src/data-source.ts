import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { HistoryData } from './entity/HistoryData'

import dotenv from 'dotenv'

dotenv.config()

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_DB_HOST ?? 'teleportation_db', // teleportation_db
  port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
  username: process.env.POSTGRES_USER ?? 'postgres',
  password: process.env.POSTGRES_PASSWORD ?? 'abcdef',
  database: process.env.POSTGRES_DB ?? 'postgres',
  synchronize: false,
  logging: true,
  entities: [HistoryData],
  migrations: [],
  subscribers: [],
})

export const historyDataRepository = AppDataSource.getRepository(HistoryData)
