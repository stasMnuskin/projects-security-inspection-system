# Security Inspection Management System

## Description
This system is a platform for managing security inspections for security companies. It allows for managing inspections across multiple sites for multiple entrepreneurs (clients), and provides tools for managing users, entrepreneurs, sites, and various types of inspections.

## Technologies

### Backend
- Node.js
- Express.js
- Sequelize ORM
- PostgreSQL
- JSON Web Tokens (JWT) for authentication
- bcrypt for password hashing

### Frontend (In Development)
- React.js

## Installation

### Prerequisites
- Node.js (version 14 or higher)
- PostgreSQL

### Installation Steps
1. Clone the repository:
  git clone https://github.com/stasMnuskin/projects-security-inspection-system
  cd security-inspection-system
2. Install dependencies:
npm install
3. Set up environment variables:
  Create a `.env` file in the root directory and add the following variables:
    DB_HOST=your_database_host
  DB_USER=your_database_user
  DB_PASS=your_database_password
  DB_NAME=your_database_name
  JWT_SECRET=your_jwt_secret
4. Run database migrations:
  npx sequelize-cli db:migrate
5. Start the server:
  npm start

## Usage
After starting the server, the API can be accessed at `http://localhost:5000`.

## API Documentation

### Authentication
All API routes except for login and register require a valid JWT token in the `x-auth-token` header.

### Endpoints

#### Users

- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login a user
- `GET /api/users/me` - Get current user details
- `PUT /api/users/update` - Update user details
- `GET /api/users` - Get all users (Admin only)
- `DELETE /api/users/:id` - Delete a user (Admin only)
- `PUT /api/users/:id/role` - Change user role (Admin only)

#### Entrepreneurs

- `POST /api/entrepreneurs` - Create a new entrepreneur
- `GET /api/entrepreneurs` - Get all entrepreneurs
- `GET /api/entrepreneurs/:id` - Get a specific entrepreneur
- `PUT /api/entrepreneurs/:id` - Update an entrepreneur
- `DELETE /api/entrepreneurs/:id` - Delete an entrepreneur

#### Sites

- `POST /api/sites` - Create a new site
- `GET /api/sites` - Get all sites
- `GET /api/sites/:id` - Get a specific site
- `PUT /api/sites/:id` - Update a site
- `DELETE /api/sites/:id` - Delete a site

#### Inspection Types

- `POST /api/inspection-types` - Create a new inspection type
- `GET /api/inspection-types` - Get all inspection types
- `GET /api/inspection-types/:id` - Get a specific inspection type
- `PUT /api/inspection-types/:id` - Update an inspection type
- `DELETE /api/inspection-types/:id` - Delete an inspection type

#### Inspections

- `POST /api/inspections` - Create a new inspection
- `GET /api/inspections` - Get all inspections
- `GET /api/inspections/:id` - Get a specific inspection
- `PUT /api/inspections/:id` - Update an inspection
- `DELETE /api/inspections/:id` - Delete an inspection

## Testing
To run tests:
npm test

## License
This project is licensed under the MIT License. See the `LICENSE` file for details.

## Contact
If you have any questions or suggestions, please contact [stas.mnuskin@gmail.com].