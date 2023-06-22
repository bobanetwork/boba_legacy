import { Entity, Column } from 'typeorm'
import { PrimaryColumn } from 'typeorm/decorator/columns/PrimaryColumn'

export interface IFailedDisbursement {
  sourceChainId: string | number
  destChainId: string | number
  depositId: number
  sourceChainTokenAddr?: string
  destChainTokenAddr?: string
  amount: string
  emitter: string
  errorMsg: string
}

@Entity()
export class FailedDisbursement {
  constructor(props: IFailedDisbursement) {
    this.sourceChainId = props.sourceChainId
    this.destChainId = props.destChainId
    this.depositId = props.depositId
    this.sourceChainTokenAddr = props.sourceChainTokenAddr
    this.destChainTokenAddr = props.destChainTokenAddr
    this.amount = props.amount
    this.emitter = props.emitter
    this.errorMsg = props.errorMsg
  }

  @PrimaryColumn({ type: 'int' })
  sourceChainId: string | number

  @PrimaryColumn({ type: 'int' })
  destChainId: string | number

  @PrimaryColumn()
  depositId: number

  @Column({ nullable: true })
  sourceChainTokenAddr?: string

  @Column({ nullable: true })
  destChainTokenAddr?: string

  @Column()
  amount: string

  @Column()
  emitter: string

  @Column({ nullable: true })
  errorMsg: string
}
