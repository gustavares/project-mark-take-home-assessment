import { Knex } from "knex";
import { TopicRepository } from "./TopicRepository";
import { Topic } from "../entities/Topic";
import { DatabaseError } from "../shared/errors";

export class SqliteTopicRepository implements TopicRepository {

    constructor(private db: Knex) { }

    async create(topic: Topic): Promise<Topic> {
        try {
            const [{ id, version, createdAt, updatedAt, parentTopicId }] = await this.db('topic')
                .insert({
                    name: topic.name,
                    content: topic.content,
                    version: topic.version,
                    createdAt: topic.createdAt,
                    updatedAt: topic.updatedAt,
                    parentTopicId: topic.parentTopicId,
                })
                .returning(['id', 'version', 'createdAt', 'updatedAt', 'parentTopicId']);

            return new Topic(topic.name, topic.content, version, createdAt, updatedAt, id, parentTopicId);
        } catch (error) {
            if (error instanceof Error) {
                throw new DatabaseError(`Error inserting topic in the database: ${error.message}`);
            }
            console.error(error);
            throw new DatabaseError('Database failed to insert');
        }
    }
}