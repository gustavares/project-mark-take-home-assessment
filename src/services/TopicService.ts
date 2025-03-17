import { Topic } from "../entities/Topic";
import { TopicFactory } from "../factories/TopicFactory";
import { TopicRepository } from "../repositories/TopicRepository";
import { ValidationError } from "../shared/errors";

export class TopicService {
    constructor(private topicRepository: TopicRepository) { }

    async create(name: string, content: string, parentTopicId?: number): Promise<Topic> {
        if (!name.trim()) {
            throw new ValidationError('Topic name cannot be empty');
        }
        if (!content.trim()) {
            throw new ValidationError('Topic content cannot be empty');
        }

        if (parentTopicId) {
            console.log('searching parent topic')
            const parentTopic = await this.topicRepository.findById(parentTopicId);

            if (!parentTopic) {
                // TODO: create custom NotFound error
                throw new Error('Parent topic not found');
            }
        }

        try {
            let topic = TopicFactory.createNew(name, content, parentTopicId);
            topic = await this.topicRepository.create(topic);

            return topic;
        } catch (error) {
            throw error;
        }
    }

    async update(id: number, version: number, content: string) {
        const existingTopic = await this.topicRepository.findById(id, version);

        if (!existingTopic) {
            // TODO: create custom error for not found
            throw new Error('Topic not found');
        }

        const newVersionTopic = TopicFactory.createNextVersion(existingTopic, content);
        const createdTopic = await this.topicRepository.create(newVersionTopic);

        return createdTopic;
    }
}