import { Topic } from "../entities/Topic";
import { TopicFactory } from "../factories/TopicFactory";
import { TopicRepository } from "../repositories/TopicRepository";
import { ValidationError } from "../shared/errors";

export class TopicService {
    constructor(private topicRepository: TopicRepository) { }

    async create(name: string, content: string): Promise<Topic> {
        if (!name.trim()) {
            throw new ValidationError('Topic name cannot be empty');
        }
        if (!content.trim()) {
            throw new ValidationError('Topic content cannot be empty');
        }

        try {
            let topic = TopicFactory.createNew(name, content);
            topic = await this.topicRepository.create(topic);

            return topic;
        } catch (error) {
            throw error;
        }
    }

    async update(id: string, content: string) {
        const existingTopic = await this.topicRepository.findById(id);

        if (!existingTopic) {
            // TODO: create custom error for not found
            throw new Error('Topic not found');
        }

        const newVersionTopic = TopicFactory.createNextVersion(existingTopic, content);
        const createdTopic = await this.topicRepository.create(newVersionTopic);

        return createdTopic;
    }
}