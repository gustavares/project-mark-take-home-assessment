import { Topic } from "../../entities/Topic";
import { TopicRepository } from "../../repositories/TopicRepository";
import { DatabaseError, isError, ValidationError } from "../../shared/errors";
import { TopicService } from "../TopicService";

const topicRepositoryMock: jest.Mocked<TopicRepository> = {
    create: jest.fn(),
}

const topicService = new TopicService(topicRepositoryMock);

describe('TopicService', () => {
    it('should create a new topic successfully', async () => {
        const topicData = { name: 'Test Topic', content: 'This is a test' };
        const mockTopic = new Topic(topicData.name, topicData.content, 1, new Date(), new Date(), '1');

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