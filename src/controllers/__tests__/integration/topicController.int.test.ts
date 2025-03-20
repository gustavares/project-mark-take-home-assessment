import fs from 'fs'
import { Knex } from 'knex';
import request from 'supertest';
import { Application } from '../../../Application';
import { TopicController } from '../../TopicController';
import { TopicService } from '../../../services/TopicService';
import { TopicRepository } from '../../../repositories/TopicRepository';
import { SqliteTopicRepository } from '../../../repositories/SqliteTopicRepository';
import { Topic } from '../../../entities/Topic';
import { PatchTopicDTO, TopicDTO } from '../../../dtos/topic.dto';
import { ResourceRepository } from '../../../repositories/ResourceRepository';
import { SqliteResourceRepository } from '../../../repositories/SqliteResourceRepository';
import { Resource } from '../../../entities/Resource';
import { getDb, runMigrations } from '../../../repositories/sqlite';

const DB_PATH = './db.integration/sqlite';

let db: Knex;
let application: Application;

async function setup(): Promise<{ setupDb: Knex; setupApp: Application; }> {
    if (!fs.existsSync("./db.integration")) {
        console.log('CREATING DB FOLDER')
        fs.mkdirSync("./db.integration", { recursive: true });
    }
    const setupDb = getDb(DB_PATH)
    await runMigrations(setupDb);

    const topicRepository = new SqliteTopicRepository(setupDb);
    const resourceRepository = new SqliteResourceRepository(setupDb);
    const topicService = new TopicService(topicRepository, resourceRepository);
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

    async function createTopic(topic: TopicDTO): Promise<Topic> {
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
            const topicData = <TopicDTO>{
                name: 'Test Topic',
                content: 'This is the original content',
            };

            const topic = await createTopic(topicData);
            await request(application.app)
                .patch(`/topic/${topic.id}`)
                .send({
                    content: 'This is the new content',
                })
                .set('Accept', 'application/json');

            const { body: topicVersion1, status } = await request(application.app).get(`/topic/${topic.id}/version/${1}`);

            expect(status).toBe(200);
            expect(topicVersion1.id).toBe(topic.id);
            expect(topicVersion1.version).toBe(1);
            expect(topicVersion1.content).toBe('This is the original content');

            const { body: topicVersion2, status: status2 } = await request(application.app).get(`/topic/${topic.id}/version/${2}`);
            expect(status2).toBe(200);
            expect(topicVersion2.id).toBe(topic.id);
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
            const insertedParentTopic = await createTopic({
                name: 'Parent',
                content: 'this is the parent topic',
                resources: []
            });
            const childTopic1 = await createTopic({
                name: 'Child 1',
                content: 'this is the child 1 topic',
                parentTopicId: insertedParentTopic.id,
                resources: []
            });
            const childTopic2 = await createTopic({
                name: 'Child 2',
                content: 'this is the child 2 topic',
                parentTopicId: insertedParentTopic.id,
                resources: []
            });
            const childTopic3 = await createTopic({
                name: 'Child 3',
                content: 'this is the child 3 topic',
                parentTopicId: childTopic1.id,
                resources: []
            });
            const childTopic4 = await createTopic({
                name: 'Child 4',
                content: 'this is the child 4 topic',
                parentTopicId: childTopic3.id,
                resources: []
            });

            const { body: parentTopicRetrieved, status } = await request(application.app).get(`/topic/${insertedParentTopic.id}/subtopics`);

            expect(status).toBe(200);
            expect(parentTopicRetrieved.subtopics).toHaveLength(2);

            const [child1, child2] = parentTopicRetrieved.subtopics;
            expect(child1.id).toBe(childTopic1.id);
            expect(child2.id).toBe(childTopic2.id);

            expect(child1.subtopics).toHaveLength(1);
            expect(child2.subtopics).toHaveLength(0);

            const [child3] = child1.subtopics;
            expect(child3.id).toBe(childTopic3.id);

            expect(child3.subtopics).toHaveLength(1);
            expect(child3.subtopics[0].id).toBe(childTopic4.id);
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
                const childTopicData = <TopicDTO>{
                    name: 'Child',
                    content: 'this is the child topic',
                };

                const { body: parentTopic } = await request(application.app)
                    .post('/topic')
                    .send({
                        name: 'Parent',
                        content: 'this is the parent topic'
                    })
                    .set('Accept', 'application/json');

                const response = await request(application.app)
                    .post('/topic')
                    .send({
                        name: childTopicData.name,
                        content: childTopicData.content,
                        parentTopicId: parentTopic.id
                    })
                    .set('Accept', 'application/json');

                const childTopic = response.body;
                expect(response.status).toBe(201);
                expect(childTopic).toHaveProperty('id');;
                expect(childTopic.name).toBe(childTopicData.name);
                expect(childTopic.content).toBe(childTopicData.content);
                expect(childTopic.parentTopicId).toBe(parentTopic?.id);

                const insertedChildTopic = await db<Topic>('topic')
                    .where({ id: childTopic.id, version: childTopic.version })
                    .first();
                expect(insertedChildTopic?.id).toBeDefined();
                expect(insertedChildTopic?.id).toBe(childTopic.id);
                expect(insertedChildTopic?.name).toBe(childTopic.name);
                expect(insertedChildTopic?.content).toBe(childTopic.content);
                expect(insertedChildTopic?.version).toBe(1);
                expect(insertedChildTopic?.parentTopicId).toBe(parentTopic?.id);
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
            const resourceRepository = new SqliteResourceRepository(db);
            const topicService = new TopicService(topicRepository, resourceRepository);
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
            expect(insertedTopic?.id).toBe(response.body.id);
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
        let resourceRepository: ResourceRepository;

        beforeEach(async () => {
            db = await getDb(DB_PATH)
            await runMigrations(db);

            topicRepository = new SqliteTopicRepository(db);
            resourceRepository = new SqliteResourceRepository(db);
            topicService = new TopicService(topicRepository, resourceRepository);
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

        describe('given only the content is being updated', () => {
            it('should update a topic by creating a new entry in the database without modifying the previous', async () => {
                const previousTopic = await topicService.create('Previous Topic', 'This is a test');
                const newContent = 'Updated content';

                const response = await request(application.app)
                    .patch(`/topic/${previousTopic.id}`)
                    .send({
                        content: newContent,
                    })
                    .set('Accept', 'application/json');

                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('id');
                expect(response.body.id).toBe(previousTopic.id);
                expect(response.body.name).toBe(previousTopic.name);
                expect(response.body.content).toBe(newContent);
                expect(response.body.version).toBe(2);

                const updatedDbTopic = await db('topic')
                    .where({ id: response.body.id, version: 2 })
                    .first();

                expect(updatedDbTopic).toBeDefined();
                expect(updatedDbTopic.id).toBe(previousTopic.id);
                expect(updatedDbTopic.name).toBe(previousTopic.name);
                expect(updatedDbTopic.content).toBe(newContent);
                expect(updatedDbTopic.version).toBe(2);
            });
        });

        describe('given a resource is being added', () => {
            it('should update the topic by creating a new version for the topic and link resources to it', async () => {
                const existingTopic = await topicService.create('Patch Test', 'testing resource update');
                const patchTopicDto: PatchTopicDTO = {
                    resources: [
                        {
                            topicId: existingTopic.id,
                            topicVersion: existingTopic.version,
                            description: 'First resource',
                            type: 'pdf',
                            url: 'test.pdf',
                        }
                    ]
                };

                const response = await request(application.app)
                    .patch(`/topic/${existingTopic.id}`)
                    .send(patchTopicDto)
                    .set('Accept', 'application/json');

                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('id');
                expect(response.body.id).toBe(existingTopic.id);
                expect(response.body.resources).toHaveLength(1);
                expect(response.body.version).toBe(2);

                const updatedDbTopic: Topic = await db('topic').select('*').where({ id: response.body.id, version: 2 }).first();
                const resources = await db('resource').select('*').where({ topicId: response.body.id, topicVersion: 2 }) as Resource[];

                expect(updatedDbTopic).toBeDefined();
                expect(updatedDbTopic.id).toBe(response.body.id);
                expect(updatedDbTopic.version).toBe(2);
                expect(resources).toHaveLength(1);
                expect(resources[0].description).toBe(patchTopicDto.resources[0].description);

            });
        });
    });
});