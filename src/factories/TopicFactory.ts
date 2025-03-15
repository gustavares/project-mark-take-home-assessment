import { Topic } from "../entities/Topic";

export class TopicFactory {
    static createNew(name: string, content: string): Topic {
        return new Topic(name, content);
    }
}
