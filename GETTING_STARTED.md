# 🚀 Getting Started with Fork & Knife Backend

## 5-Minute Setup

### Step 1: Install Dependencies

```bash
cd fork-knife-backend
npm install
```

### Step 2: Set Up Environment

```bash
cp .env.example .env
```

**Edit `.env` with your credentials:**
- Get Supabase credentials from [supabase.com](https://supabase.com)
- Get Stripe keys from [stripe.com/dashboard](https://dashboard.stripe.com)
- For local development, Redis can run in Docker

### Step 3: Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate:deploy

# (Optional) Seed with sample data
npm run prisma:seed
```

### Step 4: Start Redis (if not already running)

```bash
docker run -d -p 6379:6379 redis:7-alpine
```

### Step 5: Run the Server

```bash
npm run start:dev
```

Visit **http://localhost:3000/health** to verify it's running!

---

## Testing the API

### 1. Register a User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "password": "Test1234!"
  }'
```

**Save the `accessToken` from the response!**

### 3. Get Your Profile

```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. List Restaurants

```bash
curl http://localhost:3000/api/v1/restaurants
```

---

## Common Issues

### "Database connection failed"
- Check your `DATABASE_URL` in `.env`
- Ensure Supabase project is active
- Verify connection pooling settings

### "Redis connection failed"
- Make sure Redis is running: `docker ps`
- Start Redis: `docker run -d -p 6379:6379 redis:7-alpine`

### "Prisma Client not generated"
- Run: `npm run prisma:generate`

### "Migration failed"
- Reset and retry: `npm run prisma:migrate:reset`
- This will delete all data!

---

## Next Steps

1. **Create a Restaurant** (you'll need RESTAURANT_OWNER role)
2. **Set up Restaurant Areas & Tables**
3. **Configure Operating Hours (Shifts)**
4. **Set Booking Policy**
5. **Test Making a Reservation**

Check the main [README.md](./README.md) for complete documentation!

---

## Development Tips

### Hot Reload
The dev server watches for changes and auto-restarts

### Database GUI
```bash
npm run prisma:studio
```
Opens at http://localhost:5555

### Logs
All logs appear in the console in development mode

### API Testing
Use **Postman**, **Insomnia**, or **Thunder Client** (VS Code extension)

---

## Need Help?

- 📖 [Full Documentation](./README.md)
- 🐛 Report issues to #backend-team on Slack
- 💬 Ask questions in team standup

---

**Happy Coding! 🎉**

