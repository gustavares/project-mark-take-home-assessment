import { Application } from './Application';
import { TopicController } from './controllers/TopicController';
import { getDb } from './repositories/sqlite';
import { SqliteResourceRepository } from './repositories/SqliteResourceRepository';
import { SqliteTopicRepository } from './repositories/SqliteTopicRepository';
import { TopicService } from './services/TopicService';

async function startApp() {
    const db = await getDb();

    const topicRepository = new SqliteTopicRepository(db);
    const resourceRepository = new SqliteResourceRepository(db);
    const topicService = new TopicService(topicRepository, resourceRepository);
    const topicController = new TopicController(topicService);

    const app = new Application(topicController);
    const port = Number(process.env.PORT) || 3000;
    app.start(port);
}

startApp().catch((error) => {
    console.error("Error starting application:", error);
    process.exit(1);
});