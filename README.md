Security Inspection System
Overview
This project is a comprehensive security inspection management system designed for security companies. It allows for the management of inspections across multiple sites for various clients.
Features

User authentication and authorization
Inspection creation and management
Real-time reporting
Client and site management
Integration with Google Sheets

Tech Stack

Backend: Node.js, Express.js
Database: PostgreSQL
ORM: Sequelize
Frontend: React.js 
Authentication: JWT

Getting Started
Prerequisites

Node.js (v14 or later)
PostgreSQL

Installation

Clone the repository
git clone https://github.com/your-username/security-inspection-system.git
cd security-inspection-system

Install backend dependencies
cd backend
npm install

Set up environment variables
Create a .env file in the backend directory and add:
PORT=5000
DB_HOST=localhost
DB_USER=your_db_username
DB_PASS=your_db_password
DB_NAME=security_inspection_db
JWT_SECRET=your_jwt_secret

Start the server
npm run dev


Project Structure
security-inspection-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── server.js
│   ├── package.json
│   └── .env
└── frontend/ 

Database Setup
To set up the database schema, run:
npx sequelize-cli db:migrate
To undo the last migration:
npx sequelize-cli db:migrate:undo

API Endpoints
User Routes

POST /api/users/register: Register a new user
Body: { username, email, password, role }

POST /api/users/login: Login a user
Body: { email, password }

Inspection Routes

POST /api/inspections: Create a new inspection (requires authentication)

Body: { site, type, details }


GET /api/inspections: Get all inspections (requires authentication)
GET /api/inspections/:id: Get a specific inspection (requires authentication)
PUT /api/inspections/:id: Update an inspection (requires authentication)

Body: { site, type, details, status }


DELETE /api/inspections/:id: Delete an inspection (requires authentication)

To use authenticated routes, include the JWT token in the header:

GET /api/users/me: Get current user info (requires authentication)

To use authenticated routes, include the JWT token in the header:
x-auth-token: YOUR_JWT_TOKEN

Contributing
Please read CONTRIBUTING.md for details on my code of conduct and the process for submitting pull requests.
License
This project is licensed under the MIT License - see the LICENSE.md file for details.
