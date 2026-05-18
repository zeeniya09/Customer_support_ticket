const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Customer Support Ticketing System API',
      version: '1.0.0',
      description:
        'REST API for the Customer Support Ticketing System — a modern helpdesk platform built with the MERN stack.',
      contact: { name: 'Support Team' },
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Tickets', description: 'Ticket management' },
      { name: 'Users', description: 'User management (Admin)' },
      { name: 'Analytics', description: 'Dashboard analytics (Admin)' },
      { name: 'Knowledge Base', description: 'Self-service articles' },
      { name: 'Notifications', description: 'In-app notifications' },
    ],
    paths: {
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string', example: 'John Doe' },
                    email: { type: 'string', example: 'john@example.com' },
                    password: { type: 'string', example: 'password123' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'User registered' } },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login and get JWT token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Login successful' } },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current user profile',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'User profile' } },
        },
      },
      '/api/tickets': {
        get: {
          tags: ['Tickets'],
          summary: 'List tickets (filtered by role)',
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'priority', in: 'query', schema: { type: 'string' } },
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'List of tickets' } },
        },
        post: {
          tags: ['Tickets'],
          summary: 'Create a new ticket',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'description'],
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    category: { type: 'string' },
                    priority: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Ticket created' } },
        },
      },
      '/api/tickets/{id}': {
        get: {
          tags: ['Tickets'],
          summary: 'Get ticket details',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Ticket details' } },
        },
        patch: {
          tags: ['Tickets'],
          summary: 'Update ticket (Agent/Admin)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Ticket updated' } },
        },
      },
      '/api/analytics/overview': {
        get: {
          tags: ['Analytics'],
          summary: 'Dashboard overview statistics',
          responses: { 200: { description: 'Analytics overview' } },
        },
      },
      '/api/analytics/agents': {
        get: {
          tags: ['Analytics'],
          summary: 'Agent performance metrics',
          responses: { 200: { description: 'Agent stats' } },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log('📚 Swagger docs available at /api-docs');
};

module.exports = setupSwagger;
