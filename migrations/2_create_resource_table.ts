import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('resource', (table) => {
        table.string('id').primary();
        table.integer('topicId').notNullable();
        table.integer('topicVersion').notNullable();
        table.string('url').notNullable();
        table.text('description').nullable();
        table.enu('type', ['video', 'article', 'pdf']).notNullable();
        table.timestamp('createdAt').defaultTo(knex.fn.now());
        table.timestamp('updatedAt').defaultTo(knex.fn.now());

        table.foreign('topicId').references('id').inTable('topic');

        table.index('topicId');
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('resource');
}
