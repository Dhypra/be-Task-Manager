# 🚀 Quick Start: Production Deployment Guide

## ⏱️ 5-Minute Setup untuk Production

### Step 1: Secure Your Credentials (2 min)

```bash
# Generate secure JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Output: abc123def456... (copy this)
```

**Update `.env`**:
```env
# Database - Gunakan strong password
DATABASE_URL="postgresql://user:STRONG_PASSWORD@your-db-host:5432/production_db"

# JWT - Gunakan output dari command di atas
JWT_SECRET="<random-32-character-string>"
JWT_EXPIRY="24h"

# Server
PORT=5000
NODE_ENV=production

# CORS - HANYA allow trusted domains
CORS_ORIGIN="https://yourdomain.com,https://app.yourdomain.com"
SOCKET_IO_CORS="https://yourdomain.com,https://app.yourdomain.com"
```

**⚠️ IMPORTANT**: 
- JANGAN share `.env` file
- JANGAN commit `.env` ke git
- Ensure `.gitignore` includes `.env`

---

### Step 2: Install Dependencies (1 min)

```bash
npm install
npm install helmet express-validator  # Security
```

---

### Step 3: Database Migration (1 min)

```bash
# Run Prisma migrations (ensure DB exists first)
npx prisma migrate deploy

# Verify database connection
npx prisma studio
```

---

### Step 4: Test Locally (1 min)

```bash
# Start development server
npm run dev

# Test endpoints
curl http://localhost:5000/
# Output: "Hello world"

# Test Socket.IO connection
# Use client with: 
# const socket = io('http://localhost:5000', {
#   auth: { token: 'your-jwt-token' }
# });
```

---

## 🐳 Docker Deployment

### Create Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "run", "dev"]
```

### Build and Run
```bash
# Build image
docker build -t backend:latest .

# Run container
docker run -d \
  --name backend \
  -p 5000:5000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  -e NODE_ENV=production \
  backend:latest
```

---

## 🚀 Platform-Specific Deployment

### **Render.com** (Recommended for beginners)
1. Connect GitHub repo
2. Create Web Service
3. Set environment variables in Dashboard
4. Connect PostgreSQL database
5. Deploy

**Cost**: Free tier available

### **Railway.app**
1. Connect GitHub
2. Create new project
3. Add PostgreSQL plugin
4. Set env variables
5. Deploy

**Cost**: $5/month starter

### **AWS Elastic Beanstalk**
1. Install EB CLI
2. Run `eb init`
3. Run `eb create`
4. `eb deploy`

**Cost**: ~$10-20/month

### **Self-Hosted with PM2**
```bash
# SSH into server
ssh user@your-server.com

# Clone repo
git clone <your-repo>
cd project

# Install PM2
npm install -g pm2

# Start app
pm2 start app.ts --name "backend"

# Restart on reboot
pm2 startup
pm2 save

# View logs
pm2 logs backend
```

---

## ✅ Post-Deployment Verification

```bash
# 1. Check server health
curl https://yourdomain.com/

# 2. Test authentication
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# 3. Test protected endpoint
curl https://yourdomain.com/api/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Test Socket.IO (use WebSocket client)
wscat -c wss://yourdomain.com/socket.io/
```

---

## 🔒 Production Security Checklist

- [ ] `.env` file securely managed (not in git)
- [ ] JWT_SECRET is random 32+ characters
- [ ] Database password is strong (20+ chars)
- [ ] CORS_ORIGIN limited to specific domains
- [ ] HTTPS/SSL enabled
- [ ] Rate limiting active (100req/15min)
- [ ] Logging configured and monitored
- [ ] Error monitoring setup (Sentry/etc)
- [ ] Database backups automated
- [ ] Load balancer configured (if scaling)

---

## 🐛 Troubleshooting

### Server won't start
```bash
# Check env variables
env | grep -E 'DATABASE_URL|JWT_SECRET'

# Check logs
npm run dev

# Verify database connectivity
psql $DATABASE_URL -c "SELECT 1"
```

### Socket.IO connection fails
```javascript
// Client-side debugging
const socket = io('https://yourdomain.com', {
  auth: { token: 'your-jwt-token' },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

### High CPU/Memory usage
```bash
# Monitor with PM2
pm2 log backend
pm2 monit

# Check database query performance
# Enable slow query log in PostgreSQL
```

---

## 📊 Monitoring Setup

### Option 1: PM2 Plus (Recommended for simple apps)
```bash
pm2 web          # Dashboard at http://localhost:9615
pm2 plus         # Connect to PM2+ monitoring
```

### Option 2: Node.js Monitoring Tools
```bash
npm install clinic
clinic doctor -- npm run dev
```

### Option 3: External Monitoring
- **Sentry** (error tracking)
- **LogRocket** (session replay)
- **DataDog** (comprehensive monitoring)
- **New Relic** (performance)

---

## 🔄 CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Run tests
        run: npm test
        
      - name: Build
        run: npm run build
        
      - name: Deploy
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
          DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
        run: |
          mkdir -p ~/.ssh
          echo "$DEPLOY_KEY" > ~/.ssh/deploy_key
          ssh-keyscan -H $DEPLOY_HOST >> ~/.ssh/known_hosts
          ssh -i ~/.ssh/deploy_key user@$DEPLOY_HOST "cd /path/to/app && git pull && npm install && pm2 reload backend"
```

---

## 📞 Support & Resources

- **Express.js Docs**: https://expressjs.com
- **Prisma Docs**: https://www.prisma.io/docs
- **Socket.IO Docs**: https://socket.io/docs
- **TypeScript Docs**: https://www.typescriptlang.org/docs
- **Node.js Best Practices**: https://github.com/goldbergyoni/nodebestpractices

---

## 🎯 Next Steps After Deployment

1. **Monitor**: Watch logs for 24 hours
2. **Optimize**: Profile and optimize slow endpoints
3. **Scale**: Setup load balancer if needed
4. **Automate**: Setup CI/CD pipeline
5. **Document**: Document API for frontend team
6. **Iterate**: Gather feedback and improve
