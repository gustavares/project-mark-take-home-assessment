import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('topic', table => {
        table.integer('id').notNullable();
        table.string('name').notNullable();
        table.text('content').notNullable();
        table.integer('version').defaultTo(1);
        table.timestamp('createdAt').defaultTo(knex.fn.now());
        table.timestamp('updatedAt').defaultTo(knex.fn.now());
        table.integer('parentTopicId').nullable().references('id').inTable('topic').onDelete('SET NULL');;

        table.primary(['id', 'version']);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('topic');
}
