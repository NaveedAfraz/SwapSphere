# SwapSphere Backend API Documentation

## Overview
SwapSphere is a mobile-first peer-to-peer marketplace backend built with Node.js, Express, and PostgreSQL. This API provides all the endpoints needed for a modern marketplace application including listings, offers, chat, payments, reviews, and more.

## Architecture
- **Framework**: Node.js + Express
- **Database**: PostgreSQL (Neon)
- **Authentication**: JWT with bcrypt password hashing
- **Structure**: Feature-wise modular architecture
- **Pattern**: Controller-Model-Route pattern following auth structure

## Features

### 1. Authentication (`/auth`)
User authentication and authorization system.

**Endpoints:**
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

**Models:**
- `User` - Basic user information
- `Profile` - Extended user profile data
- `Seller` - Seller-specific information

---

### 2. User Management (`/user`)
User profile and settings management.

**Endpoints:**
- `GET /user/profile` - Get current user profile
- `PUT /user/profile` - Update user profile
- `PUT /user/settings` - Update user settings (email, phone)
- `POST /user/avatar` - Upload user avatar
- `GET /user/seller/:sellerId` - Get public seller profile
- `POST /user/seller` - Create/update seller profile
- `DELETE /user/account` - Deactivate user account

**Features:**
- Profile management with avatar upload
- Seller profile creation and management
- Account settings and deactivation
- Public seller profile viewing

---

### 3. Listings (`/listing`)
Product listing management with search and discovery.

**Endpoints:**
- `POST /listing` - Create new listing
- `GET /listing` - Get all listings with filters
- `GET /listing/search` - Search listings
- `GET /listing/:id` - Get specific listing
- `PUT /listing/:id` - Update listing
- `DELETE /listing/:id` - Delete listing
- `POST /listing/:id/favorite` - Toggle favorite status
- `GET /listing/favorites/my` - Get user's favorites
- `POST /listing/:id/images` - Upload listing images
- `PUT /listing/:id/images/:imageId/primary` - Set primary image

**Features:**
- Full CRUD operations for listings
- Advanced search with full-text search
- Image management with primary image support
- Favorites system
- View tracking
- Category and condition filtering
- Price range filtering

---

### 4. Chat (`/chat`)
Real-time messaging system for buyer-seller communication.

**Endpoints:**
- `POST /chat` - Create new chat
- `GET /chat` - Get user's chats
- `GET /chat/:id` - Get specific chat
- `POST /chat/:id/messages` - Send message
- `GET /chat/:id/messages` - Get chat messages
- `POST /chat/:id/messages/read` - Mark messages as read
- `DELETE /chat/:id/messages/:messageId` - Delete message

**Features:**
- Real-time messaging
- Chat creation based on listings
- Message read status tracking
- Participant management
- Message history with pagination
- Support for attachments

---

### 5. Offers (`/offer`)
Offer and negotiation system for listings.

**Endpoints:**
- `POST /offer` - Create new offer
- `GET /offer/buyer` - Get buyer's offers
- `GET /offer/seller` - Get seller's offers
- `GET /offer/listing/:listingId` - Get offers for listing
- `GET /offer/:id` - Get specific offer
- `POST /offer/:id/accept` - Accept offer
- `POST /offer/:id/decline` - Decline offer
- `POST /offer/:id/counter` - Create counter offer
- `POST /offer/:id/cancel` - Cancel offer

**Features:**
- Offer creation with price and quantity
- Offer status management (pending, accepted, declined, countered, expired, cancelled)
- Counter-offer system
- Offer expiration
- Buyer and seller offer views

---

### 6. Orders (`/order`)
Order management system for accepted offers.

**Endpoints:**
- `POST /order` - Create order from accepted offer
- `GET /order/buyer` - Get buyer's orders
- `GET /order/seller` - Get seller's orders
- `GET /order/:id` - Get specific order
- `PUT /order/:id/status` - Update order status
- `GET /order/:id/items` - Get order items
- `POST /order/:id/cancel` - Cancel order

**Features:**
- Order creation from accepted offers
- Order status tracking (pending, reserved, paid, shipped, delivered, cancelled, refunded, disputed, completed)
- Order item management
- Shipping and billing information
- Order history

---

### 7. Payments (`/payment`)
Payment processing integration with Stripe.

**Endpoints:**
- `POST /payment` - Create payment
- `GET /payment/order/:orderId` - Get order payments
- `GET /payment/:id` - Get specific payment
- `POST /payment/:id/confirm` - Confirm payment (webhook)
- `POST /payment/:id/refund` - Refund payment

**Features:**
- Stripe integration for payment processing
- Payment status tracking
- Order payment history
- Refund processing
- Webhook support for payment confirmation

---

### 8. Reviews (`/review`)
Review and rating system for users and sellers.

**Endpoints:**
- `POST /review` - Create new review
- `GET /review/my` - Get reviews written by user
- `GET /review/for-me` - Get reviews about user
- `GET /review/:id` - Get specific review
- `PUT /review/:id` - Update review
- `DELETE /review/:id` - Delete review

**Features:**
- 1-5 star rating system
- Review creation for completed orders
- User rating statistics
- Review management (edit/delete)
- Average rating calculation
- Seller reputation tracking

---

### 9. Notifications (`/notification`)
Notification system for user alerts.

**Endpoints:**
- `POST /notification` - Create notification
- `GET /notification` - Get user notifications
- `GET /notification/unread-count` - Get unread count
- `POST /notification/:id/read` - Mark as read
- `POST /notification/mark-all-read` - Mark all as read
- `DELETE /notification/:id` - Delete notification

**Features:**
- Real-time notifications
- Read/unread status tracking
- Bulk notification operations
- Notification cleanup
- Unread count tracking

---

## Database Schema

The database uses the following main tables:
- `users` - User accounts
- `profiles` - User profiles
- `sellers` - Seller information
- `listings` - Product listings
- `listing_images` - Listing images
- `offers` - Offer negotiations
- `orders` - Purchase orders
- `order_items` - Order line items
- `payments` - Payment records
- `chats` - Conversation threads
- `messages` - Chat messages
- `reviews` - User reviews
- `notifications` - User notifications

## Authentication

All protected endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Error Handling

The API uses standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

Error responses follow this format:
```json
{
  "error": "Error message description"
}
```

## Pagination

List endpoints support pagination with these parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

Response includes pagination metadata:
```json
{
  "items": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Environment Variables

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `STRIPE_SECRET_KEY` - Stripe API key
- `AWS_ACCESS_KEY_ID` - S3 access key
- `AWS_SECRET_ACCESS_KEY` - S3 secret key
- `AWS_REGION` - S3 bucket region
- `S3_BUCKET_NAME` - S3 bucket name

## Development

### Setup
1. Install dependencies: `npm install`
2. Set up environment variables
3. Run database migrations
4. Start development server: `npm run dev`

### Testing
- Run tests: `npm test`
- Run tests with coverage: `npm run test:coverage`

### Database
- Run migrations: `npm run migrate`
- Seed database: `npm run seed`

## Deployment

The backend is designed for deployment on platforms like Vercel, Heroku, or AWS. Ensure all environment variables are properly configured in production.

## Security

- Password hashing with bcrypt
- JWT token authentication
- SQL injection prevention with parameterized queries
- Input validation and sanitization
- CORS configuration
- Rate limiting (recommended)

## Contributing

Follow the established patterns:
- Feature-wise folder structure
- Controller-Model-Route pattern
- Exported functions (no classes)
- Proper error handling
- Input validation
- Database transactions for complex operations
