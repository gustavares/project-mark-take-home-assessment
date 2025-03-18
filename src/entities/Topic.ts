export class Topic {
    public id?: number;
    public readonly version: number;
    public readonly createdAt: Date;
    public updatedAt: Date;
    public parentTopicId?: number;
    public subtopics: Topic[];

    constructor(
        public name: string,
        public content: string,
        version?: number,
        createdAt?: Date,
        updatedAt?: Date,
        id?: number,
        parentTopicId?: number,
        subtopics: Topic[] = []
    ) {
        this.version = version ?? 1;
        this.createdAt = createdAt ?? new Date();
        this.updatedAt = updatedAt ?? new Date();
        this.id = id;
        this.parentTopicId = parentTopicId;
        this.subtopics = subtopics;
    }
}
