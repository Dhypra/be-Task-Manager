# Backend API Server

A production-ready Node.js backend with Express, TypeScript, Prisma, and Socket.IO for real-time task management.

## 🚀 Quick Deploy to Railway

### 1. Prerequisites
- Railway account ([railway.app](https://railway.app))
- PostgreSQL database (Railway provides this)

### 2. Deploy Steps

#### Option A: One-Click Deploy (Recommended)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/yourusername/yourrepo)

#### Option B: Manual Deploy
1. **Connect Repository**
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project" → "Deploy from GitHub repo"
   - Connect your GitHub repository

2. **Add PostgreSQL Database**
   - In your Railway project, click "Add Plugin"
   - Add "PostgreSQL" database
   - Railway will automatically set `DATABASE_URL` environment variable

3. **Set Environment Variables**
   In Railway project settings → Variables:
   ```env
   DATABASE_URL=postgresql://... # Auto-set by Railway PostgreSQL
   JWT_SECRET=<your-secure-secret>
   JWT_EXPIRY=24h
   PORT=5000
   NODE_ENV=production
   CORS_ORIGIN=https://your-frontend-domain.com
   SOCKET_IO_CORS=https://your-frontend-domain.com
   ```

4. **Generate Secure JWT_SECRET**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. **Deploy**
   - Railway will automatically build and deploy
   - Check deployment logs for any errors

### 3. Post-Deploy Setup

1. **Run Database Migrations**
   ```bash
   # Via Railway CLI or in Railway project terminal:
   npx prisma migrate deploy
   ```

2. **Verify Deployment**
   ```bash
   curl https://your-railway-url.up.railway.app/
   # Should return: "Hello world"
   ```

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login & get JWT token

### Tasks (Requires Authentication)
- `GET /api/tasks` - Get paginated tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/tasks/export/pdf` - Export tasks as PDF

### Admin Only
- `GET /api/users` - Get all users
- `GET /api/tasks/all` - Get all tasks (no pagination)

### Real-time (Socket.IO)
- `taskCreated` - Broadcast when task created
- `taskUpdated` - Broadcast when task updated
- `taskDeleted` - Broadcast when task deleted

## 🔧 Development

### Local Setup
```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your local database URL

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.IO
- **Authentication**: JWT
- **PDF Generation**: PDFKit
- **Password Hashing**: bcrypt
- **Deployment**: Railway

## 🔒 Security Features

- JWT authentication with role-based access
- Rate limiting (100 req/15min)
- CORS configuration
- Input validation
- Structured logging
- Environment variable validation

## 📊 Monitoring

- Health check endpoint: `GET /`
- Structured JSON logging
- Graceful shutdown handling
- Error tracking ready for Sentry/DataDog

## 🚨 Troubleshooting

### Build Fails
```bash
# Check TypeScript errors
npx tsc --noEmit

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Issues
```bash
# Test database connection
npx prisma studio

# Run migrations
npx prisma migrate deploy
```

### Socket.IO Not Working
```javascript
// Client connection example
import io from 'socket.io-client';

const socket = io('https://your-railway-url.up.railway.app', {
  auth: { token: 'your-jwt-token' }
});

socket.on('taskCreated', (task) => {
  console.log('New task:', task);
});
```

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | JWT signing secret (32+ chars) | `abc123...` |
| `JWT_EXPIRY` | JWT token expiry | `24h` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `production` |
| `CORS_ORIGIN` | Allowed origins | `https://mydomain.com` |
| `SOCKET_IO_CORS` | Socket.IO allowed origins | `https://mydomain.com` |

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details