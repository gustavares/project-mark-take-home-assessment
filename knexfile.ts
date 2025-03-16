import knex, { Knex } from "knex";
const DEFAULT_DB_PATH = './db/sqlite';

const knexConfig = (dbPath: string) => {
  return <Knex.Config>{
    client: 'sqlite3',
    connection: {
      filename: dbPath,
    },
    useNullAsDefault: true,
    migrations: {
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    }
  };
}

const getDb = (dbPath = DEFAULT_DB_PATH) => knex(knexConfig(dbPath));

const runMigrations = async (db: Knex) => {
  try {
    await db.migrate.latest();
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
}

export { getDb, runMigrations };