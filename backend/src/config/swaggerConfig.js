const path = require('path');

module.exports = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Security Inspection API',
      version: '1.0.0',
      description: 'API for managing security inspections',
    },
    servers: [
      {
        url: process.env.API_URL,
        description: 'API Server',
      },
    ],
  },
  apis: [
    path.resolve(__dirname, '../routes/*.js'),
    path.resolve(__dirname, '../docs/paths/*.yaml'),
    path.resolve(__dirname, '../docs/schemas/*.yaml'),
  ],
};
