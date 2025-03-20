import { Knex } from 'knex';
import { getDb, runMigrations } from '../knexfile';
import { Application } from './Application';
import { TopicController } from './controllers/TopicController';
import { SqliteTopicRepository } from './repositories/SqliteTopicRepository';
import { TopicService } from './services/TopicService';
import { SqliteResourceRepository } from './repositories/SqliteResourceRepository';

describe('Application', () => {
    let app: Application;
    let db: Knex;

    beforeEach(async () => {
        db = await getDb()
        await runMigrations(db);

        const topicRepository = new SqliteTopicRepository(db);
        const resourceRepository = new SqliteResourceRepository(db);
        const topicService = new TopicService(topicRepository, resourceRepository);
        const topicController = new TopicController(topicService);
        app = new Application(topicController);
    });

    it('should instatiate the app', () => {
        expect(app).toBeDefined();
    });

    it('should have express app', () => {
        expect(app.app).toBeDefined();
        expect(app.app).toHaveProperty('listen');
    });
});