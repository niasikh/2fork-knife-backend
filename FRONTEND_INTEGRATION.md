# 🔗 Frontend Integration Guide

## Quick Start: Connect Your React Native App

### Step 1: Install Dependencies

```bash
cd restaurant-reservation-app

# For REST API
npm install axios

# For GraphQL (optional)
npm install @apollo/client graphql
```

### Step 2: Create API Service

Create `restaurant-reservation-app/services/api.ts`:

```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api/v1'  // Local development
  : 'https://fork-knife-backend.onrender.com/api/v1'; // Production

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      await handleTokenRefresh();
    }
    return Promise.reject(error);
  }
);

async function handleTokenRefresh() {
  try {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken,
    });
    
    await AsyncStorage.setItem('authToken', response.data.accessToken);
    await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
  } catch (error) {
    // Refresh failed, logout user
    await AsyncStorage.clear();
    // Navigate to login screen
  }
}

export default api;
```

### Step 3: Create Auth Service

Create `restaurant-reservation-app/services/auth.ts`:

```typescript
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface LoginData {
  identifier: string; // email or phone
  password: string;
}

export const authService = {
  // Register new user
  async register(data: RegisterData) {
    const response = await api.post('/auth/register', data);
    
    // Save tokens
    await AsyncStorage.setItem('authToken', response.data.accessToken);
    await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    
    return response.data;
  },

  // Login
  async login(data: LoginData) {
    const response = await api.post('/auth/login', data);
    
    // Save tokens
    await AsyncStorage.setItem('authToken', response.data.accessToken);
    await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    
    return response.data;
  },

  // Logout
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.clear();
    }
  },

  // Get current user
  async getMe() {
    const response = await api.get('/auth/me');
    await AsyncStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  // Check if logged in
  async isAuthenticated() {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  },

  // Get stored user
  async getStoredUser() {
    const userJson = await AsyncStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  },
};
```

### Step 4: Create Restaurant Service

Create `restaurant-reservation-app/services/restaurants.ts`:

```typescript
import api from './api';

export const restaurantService = {
  // Get all restaurants
  async getAll(filters?: {
    city?: string;
    cuisine?: string;
    search?: string;
  }) {
    const response = await api.get('/restaurants', { params: filters });
    return response.data;
  },

  // Get restaurant by ID
  async getById(id: string) {
    const response = await api.get(`/restaurants/${id}`);
    return response.data;
  },

  // Get restaurant by slug
  async getBySlug(slug: string) {
    const response = await api.get(`/restaurants/slug/${slug}`);
    return response.data;
  },

  // Get restaurant shifts
  async getShifts(restaurantId: string, dayOfWeek?: number) {
    const response = await api.get(`/restaurants/${restaurantId}/shifts`, {
      params: { dayOfWeek },
    });
    return response.data;
  },
};
```

### Step 5: Create Availability Service

Create `restaurant-reservation-app/services/availability.ts`:

```typescript
import api from './api';

export const availabilityService = {
  // Check if specific time is available
  async check(
    restaurantId: string,
    date: string, // YYYY-MM-DD
    time: string, // HH:mm
    partySize: number
  ) {
    const response = await api.get(`/availability/${restaurantId}/check`, {
      params: { date, time, partySize },
    });
    return response.data;
  },

  // Get all available time slots for a date
  async getSlots(
    restaurantId: string,
    date: string,
    partySize: number
  ) {
    const response = await api.get(`/availability/${restaurantId}/slots`, {
      params: { date, partySize },
    });
    return response.data;
  },
};
```

### Step 6: Create Reservation Service

Create `restaurant-reservation-app/services/reservations.ts`:

```typescript
import api from './api';

interface CreateReservationData {
  restaurantId: string;
  reservationDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  partySize: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  occasion?: string;
  specialRequests?: string;
  dietaryNotes?: string;
  seatingPreference?: string;
  experienceId?: string;
}

export const reservationService = {
  // Get user's reservations
  async getMyReservations(filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const response = await api.get('/reservations', { params: filters });
    return response.data;
  },

  // Get reservation by ID
  async getById(id: string) {
    const response = await api.get(`/reservations/${id}`);
    return response.data;
  },

  // Get reservation by confirmation code
  async getByConfirmationCode(code: string) {
    const response = await api.get(`/reservations/confirmation/${code}`);
    return response.data;
  },

  // Create new reservation
  async create(data: CreateReservationData) {
    const response = await api.post('/reservations', data);
    return response.data;
  },

  // Update reservation
  async update(id: string, data: Partial<CreateReservationData>) {
    const response = await api.put(`/reservations/${id}`, data);
    return response.data;
  },

  // Cancel reservation
  async cancel(id: string, reason?: string) {
    const response = await api.post(`/reservations/${id}/cancel`, { reason });
    return response.data;
  },
};
```

### Step 7: Use in Components

Example: Login Screen

```typescript
import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { authService } from '../services/auth';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      await authService.login({
        identifier: email,
        password,
      });
      
      // Navigate to home screen
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Email or Phone"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button
        title={loading ? 'Loading...' : 'Login'}
        onPress={handleLogin}
        disabled={loading}
      />
    </View>
  );
}
```

Example: Restaurant List Screen

```typescript
import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity } from 'react-native';
import { restaurantService } from '../services/restaurants';

export default function RestaurantListScreen({ navigation }) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      const data = await restaurantService.getAll({ city: 'Tbilisi' });
      setRestaurants(data);
    } catch (error) {
      console.error('Failed to load restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderRestaurant = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('RestaurantDetail', { id: item.id })}
    >
      <Text>{item.name}</Text>
      <Text>{item.cuisine.join(', ')}</Text>
      <Text>Rating: {item.rating || 'N/A'}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <FlatList
      data={restaurants}
      renderItem={renderRestaurant}
      keyExtractor={(item) => item.id}
    />
  );
}
```

Example: Create Reservation Screen

```typescript
import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { reservationService } from '../services/reservations';

export default function CreateReservationScreen({ route, navigation }) {
  const { restaurantId, date, time, partySize } = route.params;
  
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    try {
      setLoading(true);
      
      const reservation = await reservationService.create({
        restaurantId,
        reservationDate: date,
        startTime: time,
        partySize,
        guestName,
        guestEmail,
        guestPhone,
        specialRequests,
      });

      Alert.alert(
        'Success!',
        `Reservation confirmed! Code: ${reservation.confirmationCode}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('MyReservations'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create reservation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TextInput placeholder="Name" value={guestName} onChangeText={setGuestName} />
      <TextInput placeholder="Email" value={guestEmail} onChangeText={setGuestEmail} />
      <TextInput placeholder="Phone" value={guestPhone} onChangeText={setGuestPhone} />
      <TextInput
        placeholder="Special Requests"
        value={specialRequests}
        onChangeText={setSpecialRequests}
        multiline
      />
      <Button
        title={loading ? 'Creating...' : 'Confirm Reservation'}
        onPress={handleCreate}
        disabled={loading}
      />
    </View>
  );
}
```

---

## 🔐 Environment Configuration

Create `restaurant-reservation-app/.env`:

```bash
# Development
API_URL_DEV=http://localhost:3000/api/v1
GRAPHQL_URL_DEV=http://localhost:3000/graphql

# Production
API_URL_PROD=https://fork-knife-backend.onrender.com/api/v1
GRAPHQL_URL_PROD=https://fork-knife-backend.onrender.com/graphql
```

Use with `react-native-dotenv` or expo-constants.

---

## ✅ Testing Checklist

- [ ] User can register
- [ ] User can login
- [ ] Token is stored and sent with requests
- [ ] Token refresh works on 401
- [ ] Restaurants list loads
- [ ] Restaurant details display
- [ ] Availability check works
- [ ] Time slots load
- [ ] Reservation creation works
- [ ] Confirmation code is displayed
- [ ] User's reservations list
- [ ] Reservation cancellation works

---

**You're ready to integrate! 🚀**

