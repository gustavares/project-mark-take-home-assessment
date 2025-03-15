import { Topic } from "../entities/Topic";
import { TopicFactory } from "../factories/TopicFactory";
import { TopicRepository } from "../repositories/TopicRepository";

export class TopicService {
    constructor(private topicRepository: TopicRepository) { }

    async create(name: string, content: string): Promise<Topic> {
        try {
            let topic = TopicFactory.createNew(name, content);
            topic = await this.topicRepository.create(topic);

            return topic;
        } catch (error) {
            throw error;
        }
    }
}