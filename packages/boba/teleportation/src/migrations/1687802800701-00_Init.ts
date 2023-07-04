import {MigrationInterface, QueryRunner, Table} from 'typeorm'

export class Init1687802800701 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS history_data (chain_id int NOT NULL, block_no int NULL, PRIMARY KEY (chain_id))`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('history_data', true)
  }
}
