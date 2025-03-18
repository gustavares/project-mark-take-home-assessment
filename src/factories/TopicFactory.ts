import { Topic } from "../entities/Topic";

export class TopicFactory {
    static createNew(name: string, content: string, parentTopicId?: number): Topic {
        return new Topic(name, content, 1, new Date(), new Date(), undefined, parentTopicId);
    }

    static createNextVersion(existingTopic: Topic, newContent: string): Topic {
        return new Topic(
            existingTopic.name,
            newContent,
            existingTopic.version + 1,
            existingTopic.createdAt,
            new Date(),
            existingTopic.id,
            existingTopic.parentTopicId
        );
    }
}
