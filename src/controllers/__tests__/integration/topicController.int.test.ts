import fs from 'fs'
import { Knex } from 'knex';
import request from 'supertest';
import { getDb, runMigrations } from '../../../../knexfile';
import { Application } from '../../../Application';
import { TopicController } from '../../TopicController';
import { TopicService } from '../../../services/TopicService';
import { TopicRepository } from '../../../repositories/TopicRepository';
import { SqliteTopicRepository } from '../../../repositories/SqliteTopicRepository';

const DB_PATH = './db.integration/sqlite';
let db: Knex;
let application: Application;

beforeAll(async () => {
    db = await getDb(DB_PATH)
    await runMigrations(db);

    const topicRepository = new SqliteTopicRepository(db);
    const topicService = new TopicService(topicRepository);
    const topicController = new TopicController(topicService);
    application = new Application(topicController);
    application.start(3000);
});

afterAll(async () => {
    await application.stop();
    // await db.migrate.rollback()
    await db.destroy();

    if (fs.existsSync(DB_PATH)) {
        fs.unlinkSync(DB_PATH);
    }
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

        const insertedTopic = await db('topic')
            .where({ id: response.body.id })
            .first();

        expect(insertedTopic).toBeDefined();
        expect(insertedTopic.id).toBe(1);
        expect(insertedTopic.name).toBe(topicData.name);
        expect(insertedTopic.content).toBe(topicData.content);
        expect(insertedTopic.version).toBe(1);
    });
});