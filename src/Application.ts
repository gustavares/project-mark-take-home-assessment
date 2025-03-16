import express, { Express } from 'express';
import http from 'http';
import { TopicController } from './controllers/TopicController';

export class Application {
    public app: Express;
    private server?: http.Server;

    constructor(
        private topicController: TopicController
    ) {
        this.app = express();
        this.setupMiddlewares();
        this.setupRoutes();
    }

    private setupMiddlewares() {
        this.app.use(express.json());
    }

    private setupRoutes() {
        this.app.use('/topic', this.topicController.router);
    }

    public start(port: number) {
        this.server = this.app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    }

    public async stop() {
        if (this.server) {
            return new Promise<void>((res, rej) => {
                this.server?.close(err => {
                    if (err) return rej(err);
                    console.log('Server stopped');
                    res();
                });
            });
        }
    }
}