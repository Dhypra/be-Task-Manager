# Production Deployment Checklist

## ✅ Keamanan (Security)

- [x] **JWT Secret**: Update `JWT_SECRET` di `.env` dengan string random minimal 32 karakter
  ```bash
  # Generate random secret:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [x] **CORS Configuration**: Sesuaikan `CORS_ORIGIN` hanya ke domain frontend yang authorized
  ```env
  CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com
  ```
- [x] **Socket.IO CORS**: Sesuaikan `SOCKET_IO_CORS` dengan `CORS_ORIGIN`
- [x] **Rate Limiting**: Implemented untuk proteksi brute-force (100 req/15min)
- [x] **Environment Variables**: Validasi lengkap di startup

### Recommended (Tambahan)
- [ ] **HTTPS Only**: Deploy dengan SSL/TLS certificate
- [ ] **Helmet.js**: Tambah library untuk HTTP headers security
  ```
  npm install helmet
  ```
- [ ] **Input Sanitization**: Gunakan library seperti `sanitize-html` atau `xss`
- [ ] **CSRF Protection**: Untuk form submissions

---

## 🗄️ Database (PostgreSQL)

- [x] **Prisma ORM**: Terintegrasi dengan baik
- [x] **Migrations**: File migrasi sudah ada di `prisma/migrations/`
- [x] **Connection String**: Set di `DATABASE_URL`

### Pre-Deployment
- [ ] Ensure backup strategy exist
- [ ] Test connection pooling untuk production
- [ ] Consider `PgBouncer` untuk connection management

---

## 📦 Dependencies & Versions

Current Stack:
- Node.js: minimum v18.x (ES modules support)
- Express: 5.2.1
- Prisma: 7.5.0
- Socket.IO: 4.8.3
- TypeScript: 6.0.2

### Add Recommended Security Libraries
```bash
npm install helmet express-validator
npm install --save-dev @types/express-validator
```

---

## 🚀 Server Configuration

### Environment Variables Required
```env
# Database
DATABASE_URL=postgresql://user:password@host:port/dbname

# JWT
JWT_SECRET=<32+ random characters>
JWT_EXPIRY=24h

# Server
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com

# Socket.IO
SOCKET_IO_CORS=https://yourdomain.com
```

### Node.js Runtime
```bash
# Install dependencies
npm install

# Build TypeScript (if needed)
npm run build

# Run server
npm run dev  # For development
NODE_ENV=production npm run dev  # For production
```

### Process Manager
Recommend menggunakan PM2 untuk production:
```bash
npm install -g pm2

# Start dengan PM2
pm2 start app.ts --name "backend" --interpreter tsx

# Setup auto-restart on server reboot
pm2 startup
pm2 save
```

---

## 📊 Logging & Monitoring

- [x] **Structured Logging**: Implemented dengan JSON format
- [x] **Log Levels**: INFO, WARN, ERROR, DEBUG

### Recommendation
- [ ] Integrate centralized logging (e.g., Winston, Morgan)
- [ ] Setup log rotation untuk prevent disk space issues
- [ ] Monitor server performance dengan tools seperti Datadog, New Relic

---

## 🔄 API Endpoints

### Auth Routes (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login & get JWT token

### Task Routes (`/api`)
- `GET /tasks` - Get paginated tasks (requires auth)
- `GET /tasks/:id` - Get task detail (requires auth)
- `POST /tasks` - Create new task (requires auth)
- `PUT /tasks/:id` - Update task (requires auth)
- `DELETE /tasks/:id` - Delete task (requires auth)
- `GET /users` - Get all users (admin only)
- `GET /tasks/all` - Get all tasks (admin only)
- `GET /stats` - Get task statistics (requires auth)
- `GET /tasks/export/pdf` - Export tasks as PDF (requires auth)

### Real-time via Socket.IO
- `taskCreated` - Broadcast saat task baru dibuat
- `taskUpdated` - Broadcast saat task diupdate
- `taskDeleted` - Broadcast saat task dihapus
- Auto-subscribe ke room `user:{userId}` dan `admin` jika role ADMIN

---

## ✓ Quality Assurance

- [x] **TypeScript**: Strict mode enabled, no compilation errors
- [x] **Error Handling**: Consistent error responses across all endpoints
- [x] **Input Validation**: Implemented untuk auth dan task creation
- [x] **Type Safety**: Full type coverage dengan TypeScript

### Testing (Recommended)
- [ ] Unit tests dengan Jest
- [ ] Integration tests untuk API endpoints
- [ ] Load testing dengan k6 atau Apache JMeter

---

## 🚨 Critical Before Deployment

1. **Update JWT_SECRET** - JANGAN PERNAH gunakan default `"Dhahypra"`
2. **Verify CORS Origins** - Hanya allow trusted domains
3. **Test Socket.IO Auth** - Pastikan hanya authenticated users yang bisa connect
4. **Database Backup** - Setup otomatis database backup
5. **SSL Certificate** - Deploy dengan HTTPS only
6. **Monitor Error Logs** - Setup alert untuk error logs

---

## 📝 Additional Notes

- Graceful shutdown implemented (SIGTERM handling)
- Socket.IO JWT authentication implemented
- Room-based broadcasting untuk targeted updates
- Dynamic CORS configuration dari environment variables
- Comprehensive logging dengan structured JSON output
