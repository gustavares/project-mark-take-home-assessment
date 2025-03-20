import type { Knex } from "knex";

const knexConfig: Knex.Config = {
  client: "sqlite3",
  connection: {
    filename: "./db/sqlite",
  },
  useNullAsDefault: true,
  migrations: {
    directory: "./migrations",
  },
  seeds: {
    directory: "./seeds",
  },
};

export default knexConfig;
