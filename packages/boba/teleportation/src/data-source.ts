import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { HistoryData } from './entity/HistoryData'
import * as postgres from 'pg' // keep depcheck (db driver)

import dotenv from 'dotenv'
import {FailedDisbursement} from "./entity/FailedDisbursement";

dotenv.config()

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.TELEPORTATION_POSTGRES_DB_HOST ?? 'teleportation_db',
  port: parseInt(process.env.TELEPORTATION_POSTGRES_PORT ?? '5432', 10),
  username: process.env.TELEPORTATION_POSTGRES_USER ?? 'postgres',
  password: process.env.TELEPORTATION_POSTGRES_PASSWORD ?? 'abcdef',
  database: process.env.TELEPORTATION_POSTGRES_DB ?? 'postgres',
  synchronize: false,
  logging: false,
  entities: [HistoryData],
  migrations: [],
  subscribers: [],
})

export const historyDataRepository = AppDataSource.getRepository(HistoryData)
export const failedDisbursementRepository = AppDataSource.getRepository(FailedDisbursement)
