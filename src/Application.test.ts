import { Application } from './Application';

describe('Application', () => {
    let app: Application;

    beforeEach(() => {
        app = new Application();
    });

    it('should instatiate the app', () => {
        expect(app).toBeDefined();
    });

    it('should have express app', () => {
        expect(app.app).toBeDefined();
        expect(app.app).toHaveProperty('listen');
    })
});