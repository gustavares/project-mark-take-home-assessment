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

    async function createTopic(topic: Topic): Promise<Topic> {
        const { body } = await request(application.app)
            .post('/topic')
            .send({
                name: topic.name,
                content: topic.content,
                parentTopicId: topic.parentTopicId
            })
            .set('Accept', 'application/json');

        return body;
    }

    describe('GET /topic/:id/subtopics', () => {
        beforeEach(async () => {
            const { setupDb, setupApp } = await setup();
            db = setupDb;
            application = setupApp;
        });

        afterEach(async () => {
            await stop(db, application);
        });

        it('should retrieve the correct version of the topic', async () => {
            const topicData = <Topic>{
                name: 'Test Topic',
                content: 'This is the original content',
            };

            await createTopic(topicData);
            await request(application.app)
                .patch(`/topic/${1}`)
                .send({
                    content: 'This is the new content',
                })
                .set('Accept', 'application/json');

            const { body: topicVersion1, status } = await request(application.app).get(`/topic/${1}/version/${1}`);

            expect(status).toBe(200);
            expect(topicVersion1.id).toBe(1);
            expect(topicVersion1.version).toBe(1);
            expect(topicVersion1.content).toBe('This is the original content');

            const { body: topicVersion2, status: status2 } = await request(application.app).get(`/topic/${1}/version/${2}`);
            expect(status2).toBe(200);
            expect(topicVersion2.id).toBe(1);
            expect(topicVersion2.version).toBe(2);
            expect(topicVersion2.content).toBe('This is the new content');
        });
    });

    describe('GET /topic/:id/subtopics', () => {
        beforeEach(async () => {
            const { setupDb, setupApp } = await setup();
            db = setupDb;
            application = setupApp;
        });

        afterEach(async () => {
            await stop(db, application);
        });

        it('should retrieve a topic and all its subtopics', async () => {
            const childTopicId2 = <Topic>{
                version: 1,
                name: 'Child 1',
                content: 'this is the child 1 topic',
                parentTopicId: 1,
            };
            const childTopicId3 = <Topic>{
                version: 1,
                name: 'Child 2',
                content: 'this is the child 2 topic',
                parentTopicId: 1
            };
            const childTopicId4 = <Topic>{
                version: 1,
                name: 'Child 3',
                content: 'this is the child 3 topic',
                parentTopicId: 2
            };
            const childTopicId5 = <Topic>{
                version: 1,
                name: 'Child 4',
                content: 'this is the child 4 topic',
                parentTopicId: 4
            };
            const parentTopic = <Topic>{
                version: 1,
                name: 'Parent',
                content: 'this is the parent topic',
            };

            // TODO: Fix, can't use promise.all because ids increment are handled by the repository layer without transactions
            const insertedParentTopic = await createTopic(parentTopic);
            await createTopic(childTopicId2);
            await createTopic(childTopicId3);
            await createTopic(childTopicId4);
            await createTopic(childTopicId5);

            const { body: parentTopicRetrieved, status } = await request(application.app).get(`/topic/${Number(insertedParentTopic.id)}/subtopics`);

            expect(status).toBe(200);
            expect(parentTopicRetrieved.subtopics).toHaveLength(2);

            const [childId2, childId3] = parentTopicRetrieved.subtopics;
            expect(childId2.id).toBe(2);
            expect(childId3.id).toBe(3);

            expect(childId2.subtopics).toHaveLength(1);
            expect(childId2.subtopics[0].id).toBe(4);

            expect(childId3.subtopics).toHaveLength(0);

            const [childId4] = childId2.subtopics;

            expect(childId4.subtopics).toHaveLength(1);
            expect(childId4.subtopics[0].id).toBe(5);
        });
    });

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