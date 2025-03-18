import { Request, Response, Router } from "express";
import { TopicService } from "../services/TopicService";
import { AppError } from "../shared/AppError";

export class TopicController {
    public router: Router = Router();

    constructor(private topicService: TopicService) {
        this.setupRoutes();
    }

    private setupRoutes() {
        this.router.get('/:id/subtopics', this.getWithSubtopics);
        this.router.post('/', this.create);
        // TODO: update route to be just /:id, users should not be able to update a previous version of a topic, just the latest one
        this.router.patch('/:id', this.update);
    }
    private getWithSubtopics = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const topic = await this.topicService.getByIdWithSubtopics(Number(id));
            res.status(200).json(topic);
        } catch (err) {
            if (err instanceof AppError) {
                res.status(err.statusCode).json({ message: err.message });
            } else {
                res.status(500).json({ message: 'Internal Server Error' });
            }
        }
    }

    private create = async (req: Request, res: Response) => {
        try {
            const { name, content, parentTopicId } = req.body;
            const topic = await this.topicService.create(name, content, parentTopicId);
            res.status(201).json(topic);
        } catch (err) {
            if (err instanceof AppError) {
                res.status(err.statusCode).json({ message: err.message });
            } else {
                res.status(500).json({ message: 'Internal Server Error' });
            }
        }
    }

    private update = async (req: Request, res: Response) => {
        const { id } = req.params;
        const { content } = req.body;

        try {
            // TODO: better handle req param types
            const topic = await this.topicService.update(Number(id), content);
            res.status(200).json(topic);
        } catch (err) {
            console.error(err)
            if (err instanceof AppError) {
                res.status(err.statusCode).json({ message: err.message });
            } else {
                res.status(500).json({ message: 'Internal Server Error' });
            }
        }
    }
}