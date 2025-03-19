import { Knex } from "knex";
import { Resource } from "../entities/Resource";
import { ResourceRepository } from "./ResourceRepository";

export class SqliteResourceRepository implements ResourceRepository {
    constructor(private db: Knex) { }

    async create(resources: Resource[]): Promise<Resource[]> {
        return await this.db.transaction(async trx => {
            return await trx.batchInsert('resource', resources).returning('*');
        });
    }
}