import { Entity, Column } from 'typeorm'
import { PrimaryColumn } from 'typeorm/decorator/columns/PrimaryColumn'

@Entity({ name: 'last_airdrop' })
export class LastAirdrop {
  /** @dev Chain independent to be more resilient */
  @PrimaryColumn({ type: 'varchar', name: 'wallet_addr' })
  walletAddr: string

  @Column({ type: 'int', name: 'block_timestamp' })
  blockTimestamp: number
}
