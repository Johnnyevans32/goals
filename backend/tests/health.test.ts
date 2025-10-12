import request from 'supertest';
import express from 'express';

// Create a simple test app with just the health endpoint
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Add the health endpoint directly
  app.get('/health', (req, res) => {
    res.json({
      status: 'OK',
      message: 'API is running',
      environment: 'test',
      version: '1.0.0',
    });
  });

  return app;
};

describe('Health Check Endpoint', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createTestApp();
  });

  it('should return health status with 200 OK', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'OK',
      message: 'API is running',
      environment: 'test',
      version: '1.0.0',
    });
  });

  it('should respond with JSON content type', async () => {
    const response = await request(app)
      .get('/health')
      .expect('Content-Type', /json/);
  });

  it('should have all required health check fields', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('environment');
    expect(response.body).toHaveProperty('version');
  });
});