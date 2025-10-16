# 🚀 Fork & Knife Backend - Deployment Guide

## 🏗️ Recommended Architecture

**Primary Strategy**:
- **Frontend** (Mobile/Admin) → **Vercel**
- **Backend API + Worker** → **Fly.io**
- **Database** → **Supabase PostgreSQL**
- **Redis** → **Upstash** or Fly Redis
- **POS Connector** → **Fly.io** (separate app, optional)

See **[docs/DEPLOYMENT_STRATEGY.md](./docs/DEPLOYMENT_STRATEGY.md)** for complete guide!

---

## Quick Deployment Options

### Option 1: Fly.io (Recommended)
✅ Best price/performance  
✅ Deploy near Georgia  
✅ Background workers  
✅ $5/month starter  

### Option 2: Render.com (Alternative)
✅ Easier setup  
✅ Free tier available  
✅ Good documentation  
✅ $7/month starter  

### Option 3: Railway.app
✅ Simple, generous free tier

### Option 4: AWS/Google Cloud/Azure
✅ Production-grade, more complex

---

## 🎯 QUICK START: Deploy to Fly.io (Recommended)

### Step 1: Prepare Your Code

1. Make sure you're in the backend directory:
```bash
cd /Users/niasikharulidze/Desktop/Fork-knife-app/fork-knife-backend
```

2. Create a `.env` file with production values (we'll add secrets in Render):
```bash
cp .env.example .env
```

3. Initialize Git (if not already):
```bash
git init
git add .
git commit -m "Initial commit - Fork & Knife Backend"
```

4. Push to GitHub/GitLab:
```bash
# Create a new repo on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/fork-knife-backend.git
git branch -M main
git push -u origin main
```

### Step 2: Setup Supabase (Database)

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Wait for it to initialize (~2 minutes)
4. Go to **Settings → Database**
5. Copy these connection strings:
   - **Connection String** → This is your `DATABASE_URL`
   - **Connection Pooling → Transaction** → This is your `DIRECT_URL`

### Step 3: Deploy to Render

1. Go to [https://render.com](https://render.com)
2. Sign up / Log in with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your repository
5. Configure:
   - **Name**: `fork-knife-backend`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: Leave empty (or `fork-knife-backend` if in monorepo)
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run prisma:generate && npm run build`
   - **Start Command**: `npm run prisma:migrate:deploy && npm run start:prod`
   - **Instance Type**: Free (or Starter $7/mo for better performance)

### Step 4: Add Environment Variables in Render

Click **"Environment"** tab and add:

```bash
NODE_ENV=production
PORT=3000

# Database (from Supabase)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true

# Supabase
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=your-anon-key-from-supabase
SUPABASE_SERVICE_KEY=your-service-role-key-from-supabase

# JWT (Generate strong secrets!)
JWT_SECRET=your-super-secret-min-32-characters-long-random-string
JWT_EXPIRATION=7d
JWT_REFRESH_SECRET=another-super-secret-min-32-characters-long-random-string
JWT_REFRESH_EXPIRATION=30d

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CURRENCY=GEL

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+995555123456

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=noreply@forkknife.ge

# Redis - Render provides this
REDIS_HOST=your-redis-host.render.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Frontend URLs (Update after deployment)
FRONTEND_URL=https://your-frontend.vercel.app
ADMIN_PANEL_URL=https://your-admin.vercel.app

# Other
DEFAULT_TIMEZONE=Asia/Tbilisi
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
LOG_LEVEL=info
```

### Step 5: Add Redis (Required for queues)

1. In Render dashboard, click **"New +"** → **"Redis"**
2. Name: `fork-knife-redis`
3. Region: Same as your backend
4. Plan: Free
5. Click **Create**
6. Copy the **Internal Redis URL**
7. Add to your backend's environment variables:
   - Parse the URL: `redis://user:password@host:port`
   - Set `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`

### Step 6: Deploy!

1. Click **"Create Web Service"**
2. Render will automatically:
   - Install dependencies
   - Generate Prisma client
   - Build TypeScript
   - Run migrations
   - Start the server

3. Wait ~5 minutes for first deployment

4. Your backend will be live at:
   ```
   https://fork-knife-backend.onrender.com
   ```

### Step 7: Verify Deployment

Test your backend:

```bash
# Health check
curl https://fork-knife-backend.onrender.com/health

# Should return:
# {
#   "status": "ok",
#   "timestamp": "...",
#   "services": {
#     "database": "connected"
#   }
# }
```

---

## 🔗 Connect to Frontend

### For React Native Mobile App

Update your API configuration:

**`restaurant-reservation-app/services/api.js`** (or similar):

```javascript
// API Configuration
const API_URL = __DEV__ 
  ? 'http://localhost:3000/api/v1'  // Development
  : 'https://fork-knife-backend.onrender.com/api/v1'; // Production

const GRAPHQL_URL = __DEV__
  ? 'http://localhost:3000/graphql'
  : 'https://fork-knife-backend.onrender.com/graphql';

// Example: Axios instance
import axios from 'axios';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getAuthToken(); // Your token storage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### For GraphQL (Mobile App)

**Using Apollo Client**:

```javascript
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: __DEV__ 
    ? 'http://localhost:3000/graphql'
    : 'https://fork-knife-backend.onrender.com/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = getAuthToken();
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
```

### Example API Calls

**REST API**:

```javascript
// Register user
const register = async (email, password, firstName, lastName) => {
  const response = await api.post('/auth/register', {
    email,
    password,
    firstName,
    lastName,
  });
  return response.data;
};

// Get restaurants
const getRestaurants = async (city) => {
  const response = await api.get('/restaurants', {
    params: { city },
  });
  return response.data;
};

// Create reservation
const createReservation = async (reservationData) => {
  const response = await api.post('/reservations', reservationData);
  return response.data;
};
```

**GraphQL**:

```javascript
import { gql } from '@apollo/client';

// Query
const GET_RESTAURANTS = gql`
  query GetRestaurants($city: String) {
    restaurants(city: $city) {
      id
      name
      slug
      cuisine
      rating
      priceRange
      coverImage
      address
    }
  }
`;

// Mutation
const CREATE_RESERVATION = gql`
  mutation CreateReservation($input: CreateReservationInput!) {
    createReservation(input: $input) {
      id
      confirmationCode
      status
      reservationDate
      startTime
      restaurant {
        name
        address
      }
    }
  }
`;

// Usage
const { data, loading } = useQuery(GET_RESTAURANTS, {
  variables: { city: 'Tbilisi' }
});

const [createReservation] = useMutation(CREATE_RESERVATION);
```

---

## 📱 Update Mobile App Configuration

**`restaurant-reservation-app/app.json`** (or similar):

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://fork-knife-backend.onrender.com/api/v1",
      "graphqlUrl": "https://fork-knife-backend.onrender.com/graphql"
    }
  }
}
```

Access in code:

```javascript
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.apiUrl;
const GRAPHQL_URL = Constants.expoConfig.extra.graphqlUrl;
```

---

## 🔐 CORS Configuration

Your backend already has CORS configured! But verify in Render:

The backend allows requests from:
- `FRONTEND_URL` environment variable
- `ADMIN_PANEL_URL` environment variable

Make sure these are set correctly in Render!

---

## 🧪 Test the Connection

### 1. Test from Browser (CORS check)

Open browser console on your frontend domain:

```javascript
fetch('https://fork-knife-backend.onrender.com/health')
  .then(r => r.json())
  .then(data => console.log(data));

// Should log: { status: 'ok', ... }
```

### 2. Test Authentication Flow

```javascript
// Register
const registerUser = async () => {
  const response = await fetch('https://fork-knife-backend.onrender.com/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'Test1234!',
      firstName: 'Test',
      lastName: 'User'
    })
  });
  
  const data = await response.json();
  console.log('Token:', data.accessToken);
  return data;
};

// Login
const loginUser = async () => {
  const response = await fetch('https://fork-knife-backend.onrender.com/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'test@example.com',
      password: 'Test1234!'
    })
  });
  
  const data = await response.json();
  localStorage.setItem('authToken', data.accessToken);
  return data;
};

// Get Restaurants (protected)
const getRestaurants = async () => {
  const token = localStorage.getItem('authToken');
  const response = await fetch('https://fork-knife-backend.onrender.com/api/v1/restaurants', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};
```

---

## 🐛 Troubleshooting

### Backend not responding
1. Check Render logs: Dashboard → Your Service → Logs
2. Verify all environment variables are set
3. Check database connection string
4. Ensure migrations ran successfully

### CORS errors
1. Add your frontend domain to `FRONTEND_URL` in Render
2. Check browser console for exact error
3. Verify the domain includes protocol (https://)

### Database errors
1. Check Supabase project is active
2. Verify connection strings are correct
3. Ensure migrations ran: Check Render build logs
4. Test connection in Render shell:
   ```bash
   npm run prisma:studio
   ```

### "Module not found" errors
1. Clear build cache in Render
2. Redeploy
3. Check `package.json` has all dependencies

---

## 📊 Monitor Your Deployment

### Render Dashboard
- **Metrics**: CPU, Memory, Response times
- **Logs**: Real-time application logs
- **Events**: Deployments, crashes, restarts

### Supabase Dashboard
- **Database**: Size, connections, queries
- **API**: Usage statistics
- **Logs**: Query logs, errors

---

## 💰 Pricing (Monthly)

**Minimum Setup (Free Tier)**:
- Render Web Service: **Free** (sleeps after 15min inactivity)
- Render Redis: **Free** (25MB)
- Supabase: **Free** (500MB database, 2GB bandwidth)
- **Total: $0/month**

**Recommended Production**:
- Render Starter: **$7/month** (always on, 512MB RAM)
- Render Redis: **$10/month** (100MB)
- Supabase Pro: **$25/month** (8GB database, 50GB bandwidth)
- **Total: ~$42/month**

---

## 🚀 Alternative: Quick Local Test

Want to test locally first? 

```bash
# Terminal 1: Start backend
cd fork-knife-backend
npm install
npm run prisma:generate
npm run start:dev

# Terminal 2: Start your mobile app
cd restaurant-reservation-app
npm start
```

Update mobile app to use:
- iOS Simulator: `http://localhost:3000/api/v1`
- Android Emulator: `http://10.0.2.2:3000/api/v1`
- Physical device: `http://YOUR_COMPUTER_IP:3000/api/v1`

---

## ✅ Deployment Checklist

Before going live:

- [ ] Supabase project created and configured
- [ ] All environment variables set in Render
- [ ] Strong JWT secrets generated (min 32 chars)
- [ ] Stripe keys configured (if using payments)
- [ ] Frontend URL added to CORS whitelist
- [ ] Database migrations ran successfully
- [ ] Health check returns 200 OK
- [ ] Test registration/login flow
- [ ] Test creating a reservation
- [ ] Redis connected (check logs)
- [ ] Custom domain configured (optional)

---

## 🎉 You're Live!

Your backend is now:
- ✅ Running on production server
- ✅ Connected to real PostgreSQL database
- ✅ Accessible via HTTPS
- ✅ Ready for frontend connection
- ✅ Auto-deploying on git push

**Next**: Connect your mobile app and start testing! 🚀

---

**Need Help?**
- Render Docs: https://render.com/docs
- Supabase Docs: https://supabase.com/docs
- Backend Logs: Check Render dashboard

