import { Knex } from "knex";
import { TopicRepository } from "./TopicRepository";
import { Topic } from "../entities/Topic";
import { DatabaseError } from "../shared/errors";
import { Resource } from "../entities/Resource";

export class SqliteTopicRepository implements TopicRepository {

    constructor(private db: Knex) { }

    async create(topic: Topic): Promise<Topic> {
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

    async findById(id: string, version?: number): Promise<Topic | null> {
        try {
            let query = this.db('topic')
                .where({ id })
                .orderBy('version', 'desc')
                .first();

            if (version) {
                query = this.db('topic')
                    .where({ id, version })
                    .first();
            }

            const result = await query;
            if (result) {
                const topic = new Topic(
                    result.id,
                    result.name,
                    result.content,
                    result.version,
                    result.createdAt,
                    result.updatedAt,
                );
                // TODO: should use left join
                const resources = await this.findResources(id, result.version);
                topic.resources = resources;

                return topic;
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

    async findByIdWithSubtopics(id: string): Promise<Topic | null> {
        const root = await this.findById(id);
        if (!root) return null;

        const subtopics = await this.findSubtopics(id);
        return { ...root, subtopics };
    }

    private async findSubtopics(parentId: string): Promise<Topic[]> {
        const directChildren = await this.db('topic').where({ parentTopicId: parentId });

        const subtopics: Topic[] = await Promise.all(
            directChildren.map(async child => ({
                ...child,
                subtopics: await this.findSubtopics(child.id)
            }))
        );

        return subtopics;
    }

    private async findResources(topicId: string, topicVersion: number): Promise<Resource[]> {
        const resources = await this.db('resource').where({ topicId, topicVersion });

        return resources;
    }
}