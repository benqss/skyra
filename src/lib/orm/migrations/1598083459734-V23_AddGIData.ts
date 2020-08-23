import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

export class V23AddGIData1598083459734 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.createTable(
			new Table({
				name: 'user_game_integration',
				columns: [
					new TableColumn({ name: 'id', type: 'int', isPrimary: true }),
					new TableColumn({ name: 'user_id', type: 'varchar', length: '19' }),
					new TableColumn({ name: 'game', type: 'varchar', length: '35' }),
					new TableColumn({ name: 'extra_data', type: 'jsonb' })
				],
				foreignKeys: [
					new TableForeignKey({
						columnNames: ['user_id'],
						referencedTableName: 'user',
						referencedColumnNames: ['id'],
						onDelete: 'CASCADE'
					})
				]
			})
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.dropTable('user_game_integration');
	}
}
