import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'API is running!' });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});