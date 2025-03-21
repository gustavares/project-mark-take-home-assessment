import { Resource } from "../entities/Resource";
import { Topic } from "../entities/Topic";
import { TopicFactory } from "../factories/TopicFactory";
import { ResourceRepository } from "../repositories/ResourceRepository";
import { TopicRepository } from "../repositories/TopicRepository";
import { NotFoundError, ValidationError } from "../shared/errors";

export class TopicService {
    constructor(
        private topicRepository: TopicRepository,
        private resourceRepository: ResourceRepository
    ) { }

    async getByIdAndVersion(id: string, version: number): Promise<Topic> {
        try {
            const foundTopic = await this.topicRepository.findById(id, version);
            if (!foundTopic) {
                throw new NotFoundError(`Topic of id ${id} and version ${version} not found`);
            }

            return foundTopic;
        } catch (error) {
            throw error;
        }
    }

    async create(name: string, content: string, parentTopicId?: string): Promise<Topic> {
        if (!name.trim()) {
            throw new ValidationError('Topic name cannot be empty');
        }
        if (!content.trim()) {
            throw new ValidationError('Topic content cannot be empty');
        }

        if (parentTopicId) {
            const parentTopic = await this.topicRepository.findById(parentTopicId);

            if (!parentTopic) {
                throw new NotFoundError(`Parent topic of id ${parentTopicId} not found`);
            }
        }

        try {
            let topic = TopicFactory.createNew({
                name,
                content,
                parentTopicId,
                resources: []
            });
            topic = await this.topicRepository.create(topic);

            return topic;
        } catch (error) {
            throw error;
        }
    }

    async getByIdWithSubtopics(id: string): Promise<Topic> {
        try {
            const foundTopic = await this.topicRepository.findByIdWithSubtopics(id);
            if (!foundTopic) {
                throw new NotFoundError(`Topic of id ${id} not found`);
            }

            return foundTopic;
        } catch (error) {
            throw error;
        }
    }

    async update(id: string, resources: Resource[], content?: string) {
        const existingTopic = await this.topicRepository.findById(id);

        if (!existingTopic) {
            throw new NotFoundError(`Topic of id ${id} not found`);
        }

        const newVersionTopic = TopicFactory.createNextVersion(existingTopic, resources, content);
        const createdTopic = await this.topicRepository.create(newVersionTopic);

        if (resources && resources.length) {
            const createdResources = await this.resourceRepository.create(newVersionTopic.resources);
            createdTopic.resources = createdResources;
        }

        return createdTopic;
    }
}