import fs from 'fs'
import { Knex } from 'knex';
import request from 'supertest';
import { getDb, runMigrations } from '../../../../knexfile';
import { Application } from '../../../Application';
import { TopicController } from '../../TopicController';
import { TopicService } from '../../../services/TopicService';
import { TopicRepository } from '../../../repositories/TopicRepository';
import { SqliteTopicRepository } from '../../../repositories/SqliteTopicRepository';
import { Topic } from '../../../entities/Topic';

const DB_PATH = './db.integration/sqlite';

describe('POST /topic', () => {
    let db: Knex;
    let application: Application;

    beforeEach(async () => {
        db = await getDb(DB_PATH)
        await runMigrations(db);

        const topicRepository = new SqliteTopicRepository(db);
        const topicService = new TopicService(topicRepository);
        const topicController = new TopicController(topicService);
        application = new Application(topicController);
        application.start(3000);
    });

    afterEach(async () => {
        await application.stop();
        // await db.migrate.rollback()
        await db.destroy();

        if (fs.existsSync(DB_PATH)) {
            fs.unlinkSync(DB_PATH);
        }
    });

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

        const insertedTopic = await db<Topic>('topic')
            .where({ id: response.body.id, version: response.body.version })
            .first();
        expect(insertedTopic).toBeDefined();
        expect(insertedTopic?.id).toBe(1);
        expect(insertedTopic?.name).toBe(topicData.name);
        expect(insertedTopic?.content).toBe(topicData.content);
        expect(insertedTopic?.version).toBe(1);
    });
});

describe('PATCH /topic', () => {
    let db: Knex;
    let application: Application;
    let topicService: TopicService;
    let topicRepository: TopicRepository;

    beforeEach(async () => {
        db = await getDb(DB_PATH)
        await runMigrations(db);

        topicRepository = new SqliteTopicRepository(db);
        topicService = new TopicService(topicRepository);
        const topicController = new TopicController(topicService);
        application = new Application(topicController);
        application.start(3000);
    });

    afterEach(async () => {
        await application.stop();
        await db.destroy();

        if (fs.existsSync(DB_PATH)) {
            fs.unlinkSync(DB_PATH);
        }
    });

    it('should update a topic by creating a new entry in the database without modifying the previous', async () => {
        const topicData = { id: 1, name: 'Previous Topic', content: 'This is a test' };
        const previousTopic = await topicService.create(topicData.name, topicData.content);

        const newContent = 'Updated content';
        const updatedTopic = { ...previousTopic, content: newContent, version: previousTopic.version + 1 };

        const response = await request(application.app)
            .patch(`/topic/${topicData.id}/version/${previousTopic.version}`)
            .send({
                content: newContent,
            })
            .set('Accept', 'application/json');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id');
        expect(response.body.id).toBe(1);
        expect(response.body.name).toBe(topicData.name);
        expect(response.body.content).toBe(newContent);
        expect(response.body.version).toBe(2);

        const updatedDbTopic = await db('topic')
            .where({ id: response.body.id, version: 2 })
            .first();

        expect(updatedDbTopic).toBeDefined();
        expect(updatedDbTopic.id).toBe(1);
        expect(updatedDbTopic.name).toBe(topicData.name);
        expect(updatedDbTopic.content).toBe(newContent);
        expect(updatedDbTopic.version).toBe(2);
    });
});