import express, { Express } from 'express';

export class Application {
    public app: Express;

    constructor() {
        this.app = express();
        this.setupMiddlewares();
    }

    private setupMiddlewares() {
        this.app.use(express.json());
    }

    public start(port: number) {
        this.app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    }
}