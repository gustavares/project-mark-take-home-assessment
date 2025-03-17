import { Topic } from "../entities/Topic";

export interface TopicRepository {
    create(topic: Topic): Promise<Topic>;
    findById(id: number, version?: number): Promise<Topic | null>;
}