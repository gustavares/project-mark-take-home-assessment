import { Topic } from "../entities/Topic";

export interface TopicRepository {
    create(topic: Topic): Promise<Topic>;
    findById(id: string, version?: number): Promise<Topic | null>;
    findByIdWithSubtopics(id: string): Promise<Topic | null>;
}