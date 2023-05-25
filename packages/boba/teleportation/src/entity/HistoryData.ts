import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'
import { PrimaryColumn } from 'typeorm/decorator/columns/PrimaryColumn'

@Entity()
export class HistoryData {
  @PrimaryColumn({ type: 'int' })
  blockNo: number

  @PrimaryColumn({ type: 'int' })
  chainId: string | number
}
