import knex, { Knex } from "knex";

const knexConfig: Knex.Config = {
  client: 'sqlite3',
  connection: {
    filename: './db/sqlite',
  },
  useNullAsDefault: true,
  migrations: {
    directory: './migrations',
  },
  seeds: {
    directory: './seeds',
  }
}

const db = knex(knexConfig);

const runMigrations = async () => {
  try {
    await db.migrate.latest();
    console.log('Migrations completed');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
}

export { db, runMigrations };