import { Resource } from "../../entities/Resource";
import { Topic } from "../../entities/Topic";
import { TopicFactory } from "../../factories/TopicFactory";
import { ResourceRepository } from "../../repositories/ResourceRepository";
import { TopicRepository } from "../../repositories/TopicRepository";
import { DatabaseError, ValidationError } from "../../shared/errors";
import { TopicService } from "../TopicService";

const topicRepositoryMock: jest.Mocked<TopicRepository> = {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdWithSubtopics: jest.fn()
};

const resourceRepositoryMock: jest.Mocked<ResourceRepository> = {
    create: jest.fn(),
};

const topicService = new TopicService(topicRepositoryMock, resourceRepositoryMock);

describe('TopicService', () => {
    describe('create()', () => {
        it('should create a new topic successfully', async () => {
            const mockTopic = TopicFactory.createNew({
                name: 'Test Topic',
                content: 'This is a test',
                resources: []
            });

            topicRepositoryMock.create.mockResolvedValue(mockTopic);

            const result = await topicService.create(mockTopic.name, mockTopic.content);

            expect(result.id).toEqual(mockTopic.id);
            expect(topicRepositoryMock.create).toHaveBeenCalledWith(expect.any(Topic));
        });

        it('should throw ValidationError if name is empty', async () => {
            await expect(topicService.create('', 'test content')).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if content is empty', async () => {
            await expect(topicService.create('topic name', '')).rejects.toThrow(ValidationError);
        });

        it('should throw a DatabaseError when repository fails to create a topic', async () => {
            topicRepositoryMock.create.mockRejectedValue(new DatabaseError('Failed to connect to database'));

            await expect(topicService.create('Test topic', 'this is a test')).rejects.toThrow(DatabaseError);
        });
    });

    describe('create() with parentTopicId', () => {
        it('should create a topic linked to the parent', async () => {
            const parentTopic = TopicFactory.createNew({
                name: 'Parent',
                content: 'this is the parent topic',
                resources: []
            });
            topicRepositoryMock.findById.mockResolvedValue(parentTopic);
            const childTopic = TopicFactory.createNew({
                parentTopicId: parentTopic.id,
                name: 'Child',
                content: 'this is the child topic',
                resources: []
            });
            topicRepositoryMock.create.mockResolvedValue(childTopic);

            const newTopic = await topicService.create(childTopic.name, childTopic.content, childTopic.parentTopicId);
            expect(topicRepositoryMock.findById).toHaveBeenCalledWith(parentTopic.id);
            expect(newTopic.parentTopicId).toBe(parentTopic.id);
        });
    });

    describe('update()', () => {
        it('should create a new version of a topic without modifying the previous', async () => {
            const mockPreviousTopic = TopicFactory.createNew({
                name: 'Previous Topic',
                content: 'This is a test',
                resources: []
            });

            const newContent = 'Updated content';
            const updatedTopic = { ...mockPreviousTopic, content: newContent, version: mockPreviousTopic.version + 1 };
            topicRepositoryMock.create.mockResolvedValue(mockPreviousTopic);
            topicRepositoryMock.findById.mockResolvedValue(mockPreviousTopic);
            topicRepositoryMock.create.mockResolvedValue(updatedTopic);

            const result = await topicService.update(mockPreviousTopic.id, [], newContent);
            expect(result).toMatchObject(updatedTopic);
            expect(topicRepositoryMock.create).toHaveBeenCalledWith(expect.objectContaining({
                id: mockPreviousTopic.id,
                content: newContent,
                version: 2,
            }));
        });
    });
});