import knex, { Knex } from 'knex';
import fs from 'fs';
import knexConfig from '../../knexfile';

const DEFAULT_DB_PATH = './db/sqlite';

const getDb = (dbPath = DEFAULT_DB_PATH): Knex => {
    const config: Knex.Config = {
        ...knexConfig,
        connection: { filename: dbPath },
    };
    console.log(config)
    return knex(config);
};

const runMigrations = async (db: Knex) => {
    try {
        console.log('RUNNING MIGRATIONS')
        await db.migrate.latest();
    } catch (error) {
        throw error;
    }
};

export { getDb, runMigrations };


