import {MigrationInterface, QueryRunner} from 'typeorm'

export class LastAirdrop1687802800701 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS last_airdrop (wallet_addr varchar NOT NULL, block_timestamp int NULL, PRIMARY KEY (wallet_addr))`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('last_airdrop', true)
  }
}
