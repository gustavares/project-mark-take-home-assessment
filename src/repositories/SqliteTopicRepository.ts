import { Knex } from "knex";
import { TopicRepository } from "./TopicRepository";
import { Topic } from "../entities/Topic";
import { DatabaseError } from "../shared/errors";

export class SqliteTopicRepository implements TopicRepository {

    constructor(private db: Knex) { }

    async create(topic: Topic): Promise<Topic> {
        // TODO: use transaction to avoid race condition
        if (!topic.id) {
            const lastId = await this.db('topic').max('id as maxId').first();
            topic.id = lastId?.maxId + 1 || 1;
        }
        try {
            const [insertedTopic] = await this.db('topic')
                .insert({
                    id: topic.id,
                    name: topic.name,
                    content: topic.content,
                    version: topic.version,
                    updatedAt: topic.updatedAt,
                    parentTopicId: topic.parentTopicId,
                })
                .returning('*');

            return insertedTopic;
        } catch (error) {
            if (error instanceof Error) {
                throw new DatabaseError(`Error inserting topic in the database: ${error.message}`);
            }
            console.error(error);
            throw new DatabaseError('Database failed to insert');
        }
    }

    async findById(id: number, version: number): Promise<Topic | null> {
        try {
            const result = await this.db('topic')
                .where({ id, version })
                .orderBy('version', 'desc')
                .first();

            if (result) {
                return new Topic(result.name, result.content, result.version, result.createdAt, result.updatedAt, result.id);
            }
            return null;
        } catch (error) {
            if (error instanceof Error) {
                throw new DatabaseError(`Error fetching topic from the database: ${error.message}`);
            }
            console.error(error);
            throw new DatabaseError('Database failed to find topic');
        }
    }
}