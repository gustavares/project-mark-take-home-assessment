import { Topic } from "../entities/Topic";

export class TopicFactory {
    static createNew(name: string, content: string): Topic {
        return new Topic(name, content);
    }

    static createNextVersion(existingTopic: Topic, newContent: string): Topic {
        return new Topic(existingTopic.name, newContent, existingTopic.version + 1, existingTopic.createdAt, new Date(), existingTopic.id, existingTopic.parentTopicId);
    }
}
