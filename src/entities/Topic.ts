export class Topic {
    public id?: string;
    public version: number;
    public createdAt: Date;
    public updatedAt: Date;

    constructor(
        public name: string,
        public content: string,
        version?: number,
        createdAt?: Date,
        updatedAt?: Date,
        id?: string,
    ) {
        this.version = version ?? 1;
        this.createdAt = createdAt ?? new Date();
        this.updatedAt = updatedAt ?? new Date();
        this.id = id;
    }
}
