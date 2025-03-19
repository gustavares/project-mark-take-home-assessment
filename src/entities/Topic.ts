import { ulid } from 'ulid';
import { Resource } from "./Resource";

export class Topic {
    public readonly id: string;
    public name: string;
    public content: string;
    public readonly version: number;
    public readonly createdAt: Date;
    public updatedAt: Date;
    public parentTopicId?: string;
    public subtopics: Topic[];
    public resources: Resource[];

    constructor(
        id: string = ulid(),
        name: string,
        content: string,
        version: number = 1,
        createdAt: Date = new Date(),
        updatedAt: Date = new Date(),
        parentTopicId?: string,
        resources: Resource[] = [],
        subtopics: Topic[] = []
    ) {
        this.id = id;
        this.name = name;
        this.content = content;
        this.version = version;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.parentTopicId = parentTopicId;
        this.subtopics = subtopics;
        this.resources = resources;
    }
}
