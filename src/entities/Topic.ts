export class Topic {
    public id?: number;
    public version: number;
    public createdAt: Date;
    public updatedAt: Date;
    public parentTopicId?: number;

    constructor(
        public name: string,
        public content: string,
        version?: number,
        createdAt?: Date,
        updatedAt?: Date,
        id?: number,
        parentTopicId?: number
    ) {
        this.version = version ?? 1;
        this.createdAt = createdAt ?? new Date();
        this.updatedAt = updatedAt ?? new Date();
        this.id = id;
        this.parentTopicId = parentTopicId;
    }
}
