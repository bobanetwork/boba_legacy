import { Entity, Column } from 'typeorm'
import { PrimaryColumn } from 'typeorm/decorator/columns/PrimaryColumn'

@Entity({ name: 'history_data' })
export class HistoryData {
  @PrimaryColumn({ type: 'int', name: 'chain_id' })
  chainId: string | number

  @Column({ type: 'int', name: 'block_no' })
  blockNo: number
}
