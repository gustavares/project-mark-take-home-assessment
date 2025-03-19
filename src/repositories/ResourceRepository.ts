import { Resource } from "../entities/Resource";

export interface ResourceRepository {
    create(resources: Resource[]): Promise<Resource[]>;
}