import { Topic } from "../entities/Topic";

export interface TopicRepository {
    create(topic: Topic): Promise<Topic>;
    findById(id: string): Promise<Topic> | void;
    update(topic: Topic): Promise<Topic>;
}