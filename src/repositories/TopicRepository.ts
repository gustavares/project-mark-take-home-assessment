import { Topic } from "../entities/Topic";

export interface TopicRepository {
    create(topic: Topic): Promise<Topic>;
}