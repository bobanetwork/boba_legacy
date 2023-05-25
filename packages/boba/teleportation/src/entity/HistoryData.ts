import { Entity, Column } from 'typeorm'
import { PrimaryColumn } from 'typeorm/decorator/columns/PrimaryColumn'

@Entity()
export class HistoryData {
  @PrimaryColumn({ type: 'int' })
  chainId: string | number

  @Column({ type: 'int' })
  blockNo: number
}
