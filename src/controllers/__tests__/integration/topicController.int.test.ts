import request from 'supertest';
import { db, runMigrations } from '../../../../knexfile';
import { Application } from '../../../Application';
import { TopicController } from '../../TopicController';
import { TopicService } from '../../../services/TopicService';
import { TopicRepository } from '../../../repositories/TopicRepository';

let application: Application;

beforeAll(async () => {
    await runMigrations();

    const topicRepositoryMock: jest.Mocked<TopicRepository> = {
        create: jest.fn(),
    };

    const topicService = new TopicService(topicRepositoryMock);
    const topicController = new TopicController(topicService);
    application = new Application(topicController);
    application.start(3000);
});

afterAll(async () => {
    await application.stop();
    await db.destroy();
});

describe('POST /topic', () => {
    it('should create a topic and store it in the database', async () => {
        const topicData = {
            name: 'Test',
            content: 'Testing the topic creation endpoint'
        };


        const response = await request(application.app)
            .post('/topic')
            .send(topicData)
            .set('Accept', 'application/json');

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe(topicData.name);
        expect(response.body.content).toBe(topicData.content);

        // TODO: check if topic was inserted into db
    });
});