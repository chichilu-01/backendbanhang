# E-Commerce Backend API

## Overview
Node.js Express backend API for an e-commerce application with authentication, product management, cart, orders, reviews, and media upload functionality.

## Recent Changes
- **December 5, 2025**: Initial project setup on Replit
  - Configured to run on port 3000 with backend workflow
  - Dependencies installed via npm
  - Server running successfully
  - Project uses MySQL database (requires configuration)
  - Auto-imports routes from the routes directory

## Project Architecture
- **Framework**: Express.js (Node.js)
- **Database**: MySQL (via mysql2 with connection pooling)
- **Authentication**: JWT-based authentication
- **File Uploads**: Cloudinary integration for media storage
- **Email**: Supports nodemailer and Resend for email functionality

### Directory Structure
```
.
├── controllers/        # Business logic
│   └── auth.controller.js
├── middleware/         # Express middleware
│   ├── errorHandler.js
│   ├── isAdmin.js
│   ├── validation.js
│   └── verifyToken.js
├── routes/            # API endpoints
│   ├── admin.js
│   ├── auth.js
│   ├── cart.js
│   ├── media.js
│   ├── orders.js
│   ├── products.js
│   ├── protected.js
│   ├── ratings.js
│   ├── reviews.js
│   ├── upload.js
│   └── users.js
├── utils/             # Utility functions
│   ├── cloudinary.js
│   ├── mailClient.js
│   ├── sendOrderEmail.js
│   ├── sendResetCodeEmail.js
│   ├── sendVerificationEmail.js
│   └── store.js
├── db.js              # Database connection
└── index.js           # Main entry point

```

### API Routes
Routes are automatically mounted under `/api/` prefix:
- `/api/auth` - Authentication (login, register)
- `/api/products` - Product management & reviews
- `/api/cart` - Shopping cart operations
- `/api/orders` - Order management
- `/api/users` - User management
- `/api/admin` - Admin operations
- `/api/media` - Media upload/management
- `/api/ratings` - Product ratings
- `/api/upload` - File uploads

## Configuration Requirements

### Environment Variables Needed
The application requires the following environment variables:

**Database (MySQL)**:
- `DB_HOST` - MySQL host
- `DB_PORT` - MySQL port (default: 3306)
- `DB_USER` - MySQL username
- `DB_PASSWORD` - MySQL password
- `DB_NAME` - Database name

**Cloudinary (for image uploads)**:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

**JWT Authentication**:
- `JWT_SECRET` - Secret key for JWT tokens

**Email Service** (choose one):
- For Nodemailer: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`
- For Resend: `RESEND_API_KEY`

**Server**:
- `PORT` - Server port (set to 5000 for Replit)

## User Preferences
- None specified yet

## Development Notes
- The server uses auto-import for routes in the `routes/` directory
- CORS is configured for production frontend at `https://frontendbanhang.vercel.app`
- Uses ES modules (type: "module" in package.json)
