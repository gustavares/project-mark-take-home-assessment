import { Topic } from "../../entities/Topic";
import { TopicRepository } from "../../repositories/TopicRepository";
import { DatabaseError, ValidationError } from "../../shared/errors";
import { TopicService } from "../TopicService";

const topicRepositoryMock: jest.Mocked<TopicRepository> = {
    create: jest.fn(),
    findById: jest.fn(),
}

const topicService = new TopicService(topicRepositoryMock);

describe('TopicService', () => {
    describe('create()', () => {
        it('should create a new topic successfully', async () => {
            const topicData = { name: 'Test Topic', content: 'This is a test' };
            const mockTopic = new Topic(topicData.name, topicData.content, 1, new Date(), new Date(), 1);

            topicRepositoryMock.create.mockResolvedValue(mockTopic);

            const result = await topicService.create(topicData.name, topicData.content);

            expect(result).toEqual(mockTopic);
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

    describe('update()', () => {
        it('should create a new version of a topic without modifying the previous', async () => {
            const topicData = { id: 1, name: 'Previous Topic', content: 'This is a test' };
            const mockPreviousTopic = new Topic(topicData.name, topicData.content, 1, new Date(), new Date(), topicData.id);

            const newContent = 'Updated content';
            const updatedTopic = { ...mockPreviousTopic, content: newContent, version: mockPreviousTopic.version + 1 };
            topicRepositoryMock.create.mockResolvedValue(mockPreviousTopic);
            topicRepositoryMock.findById.mockResolvedValue(mockPreviousTopic);
            topicRepositoryMock.create.mockResolvedValue(updatedTopic);

            // TODO: fix undefined id in topic
            const result = await topicService.update(mockPreviousTopic.id as number, mockPreviousTopic.version, newContent);
            expect(result).toMatchObject(updatedTopic);
            expect(topicRepositoryMock.create).toHaveBeenCalledWith(expect.objectContaining({
                id: mockPreviousTopic.id,
                content: newContent,
                version: 2,
            }));
        });
    });
});