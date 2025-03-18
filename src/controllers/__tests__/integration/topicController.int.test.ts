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

let db: Knex;
let application: Application;

async function setup(): Promise<{ setupDb: Knex; setupApp: Application; }> {
    const setupDb = await getDb(DB_PATH)
    await runMigrations(setupDb);

    const topicRepository = new SqliteTopicRepository(setupDb);
    const topicService = new TopicService(topicRepository);
    const topicController = new TopicController(topicService);
    const setupApp = new Application(topicController);
    setupApp.start(3000);

    return {
        setupDb,
        setupApp
    }
}

async function stop(db: Knex, application: Application) {
    await application.stop();
    // await db.migrate.rollback()
    await db.destroy();

    if (fs.existsSync(DB_PATH)) {
        fs.unlinkSync(DB_PATH);
    }
}

describe('TopicController', () => {
    describe('POST /topic with parentTopicId', () => {
        beforeEach(async () => {
            const { setupDb, setupApp } = await setup();
            db = setupDb;
            application = setupApp;
        });

        afterEach(async () => {
            await stop(db, application);
        });
        describe('given parent topic exists', () => {
            it('should create a topic linked to given parent topic', async () => {
                const parentTopicData = <Topic>{
                    version: 1,
                    name: 'Parent',
                    content: 'this is the parent topic'
                };
                const childTopicData = <Topic>{
                    version: 1,
                    parentTopicId: 1,
                    name: 'Child',
                    content: 'this is the child topic',
                };

                const { body: insertedParentTopic } = await request(application.app)
                    .post('/topic')
                    .send({
                        name: parentTopicData.name,
                        content: parentTopicData.content,
                    })
                    .set('Accept', 'application/json');

                const response = await request(application.app)
                    .post('/topic')
                    .send({
                        name: childTopicData.name,
                        content: childTopicData.content,
                        parentTopicId: childTopicData.parentTopicId
                    })
                    .set('Accept', 'application/json');

                expect(response.status).toBe(201);
                expect(response.body).toHaveProperty('id');;
                expect(response.body.name).toBe(childTopicData.name);
                expect(response.body.content).toBe(childTopicData.content);
                expect(response.body.parentTopicId).toBe(insertedParentTopic?.id);

                const insertedChildTopic = await db<Topic>('topic')
                    .where({ id: response.body.id, version: response.body.version })
                    .first();
                expect(insertedChildTopic).toBeDefined();
                expect(insertedChildTopic?.id).toBe(2);
                expect(insertedChildTopic?.name).toBe(childTopicData.name);
                expect(insertedChildTopic?.content).toBe(childTopicData.content);
                expect(insertedChildTopic?.version).toBe(1);
                expect(insertedChildTopic?.parentTopicId).toBe(insertedParentTopic?.id);
            });
        });
    });
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

    describe('PATCH /topic/:id', () => {
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
                .patch(`/topic/${topicData.id}`)
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
});