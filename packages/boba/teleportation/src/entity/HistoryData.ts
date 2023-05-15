import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'
import { PrimaryColumn } from 'typeorm/decorator/columns/PrimaryColumn'

@Entity()
export class HistoryData {
  @Column({ type: 'bigint' })
  blockNo: string

  @PrimaryColumn({ type: 'int' })
  chainId: string
}
