import { Request, Response, Router } from "express";
import { TopicService } from "../services/TopicService";
import { AppError } from "../shared/AppError";

export class TopicController {
    public router: Router = Router();

    constructor(private topicService: TopicService) {
        this.setupRoutes();
    }

    private setupRoutes() {
        this.router.post('/', this.create);
    }

    private create = async (req: Request, res: Response) => {
        try {
            const { name, content } = req.body;
            const topic = await this.topicService.create(name, content);
            res.status(201).json(topic);
        } catch (err) {
            if (err instanceof AppError) {
                res.status(err.statusCode).json({ message: err.message });
            } else {
                res.status(500).json({ message: 'Internal Server Error' });
            }
        }
    }
}