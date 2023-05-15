import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { HistoryData } from './entity/HistoryData'

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost', // teleportation
  port: 5432,
  username: 'postgres',
  password: 'abcdef',
  database: 'teleportation',
  synchronize: true,
  logging: false,
  entities: [HistoryData],
  migrations: [],
  subscribers: [],
})
