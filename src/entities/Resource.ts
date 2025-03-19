import { ulid } from "ulid";

export class Resource {
    public id?: string;
    public createdAt: Date;
    public updatedAt: Date;

    constructor(
        public topicId: string,
        public topicVersion: number,
        public url: string,
        public description: string,
        public type: 'video' | 'article' | 'pdf',
        id?: string,
        createdAt?: Date,
        updatedAt?: Date
    ) {
        this.id = id ?? ulid();
        this.createdAt = createdAt ?? new Date();
        this.updatedAt = updatedAt ?? new Date();
    }
}