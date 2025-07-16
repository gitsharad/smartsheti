const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart Krushi Companion API',
      version: '1.0.0',
      description: 'API documentation for Smart Krushi Companion application',
      contact: {
        name: 'Smart Krushi Team',
        email: 'support@smartkrushi.com'
      }
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token'
        }
      }
    },
    security: [{
      BearerAuth: []
    }],
    tags: [
      {
        name: 'Authentication',
        description: 'Authentication and user management endpoints'
      },
      {
        name: 'Sensor Data',
        description: 'Sensor data management endpoints'
      },
      {
        name: 'FDSS',
        description: 'Farm Decision Support System endpoints'
      }
    ]
  },
  apis: [
    './docs/swagger/*.yaml'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec; 