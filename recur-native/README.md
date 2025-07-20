# Recur Mobile App

A React Native mobile application for subscription management, built with Expo and TypeScript.

## 🚀 Project Setup

This project has been configured with the following technologies:

- **React Native** with **Expo SDK 53**
- **TypeScript** for type safety
- **Expo Router** for file-based navigation
- **React Query** for data fetching and caching
- **Zustand** for state management
- **Axios** for API communication
- **Expo SecureStore** for secure token storage
- **Victory Native** for charts and analytics

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Generic components (Button, Input, etc.)
│   ├── forms/          # Form-specific components
│   ├── charts/         # Chart components
│   └── lists/          # List and card components
├── screens/            # Screen components (organized by feature)
├── services/           # API and external services
│   ├── api/            # API client and endpoints
│   ├── auth/           # Authentication service
│   ├── storage/        # Local storage service
│   └── notifications/  # Push notification service
├── hooks/              # Custom React hooks
├── store/              # Zustand stores
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── constants/          # App constants and configuration
└── providers/          # React context providers
```

## 🛠 Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the development server**
   ```bash
   npm start
   ```

3. **Run on specific platforms**
   ```bash
   npm run ios      # iOS Simulator
   npm run android  # Android Emulator
   npm run web      # Web browser
   ```

## 📱 Available Scripts

- `npm start` - Start the Expo development server
- `npm run start:clear` - Start with cleared cache
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run type-check` - Run TypeScript type checking
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run clean` - Clean and reinstall dependencies

## 🏗 Architecture Overview

### State Management
- **Zustand** for global app state (auth, settings)
- **React Query** for server state management and caching
- **Expo SecureStore** for secure token storage
- **AsyncStorage** for general app data

### Navigation
- **Expo Router** with file-based routing
- Tab-based navigation for main screens
- Modal presentations for forms
- Authentication flow routing

### API Integration
- **Axios** client with interceptors for auth tokens
- Automatic token refresh handling
- Request/response logging in development
- Error handling and retry logic

### Offline Support
- React Query caching for offline data access
- Offline action queuing
- Network state detection
- Data synchronization on reconnect

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file in the project root:

```env
API_BASE_URL=http://localhost:5000/api
SENTRY_DSN=your_sentry_dsn_here
```

### API Configuration
Update `src/constants/config.ts` to configure:
- API endpoints
- Timeout settings
- Retry policies
- Storage keys

## 🧪 Testing

The project is set up for testing with:
- **Jest** for unit testing
- **React Native Testing Library** for component testing
- **Detox** for E2E testing (to be configured)

Run tests:
```bash
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report
```

## 📦 Building

### Development Build
```bash
npm run prebuild        # Generate native code
npm run dev            # Start with development client
```

### Production Build
```bash
npm run build:android   # Build for Android
npm run build:ios      # Build for iOS
npm run build:all      # Build for all platforms
```

## 🔐 Security Features

- JWT token management with automatic refresh
- Biometric authentication support
- Secure storage for sensitive data
- Certificate pinning (to be implemented)
- Input validation and sanitization

## 📊 Performance Optimizations

- List virtualization for large datasets
- Image optimization and caching
- Bundle size optimization
- Memory management
- Background data synchronization

## 🎨 Design System

The app uses a consistent design system defined in `src/constants/config.ts`:
- Color palette
- Typography scale
- Spacing system
- Border radius values
- Component variants

## 🚧 Development Status

This is the initial project setup. The following features are planned for implementation:

1. ✅ **Project Setup and Configuration** (Current)
2. 🔄 **Core Infrastructure and Services**
3. 🔄 **Authentication System**
4. 🔄 **Dashboard Implementation**
5. 🔄 **Subscription Management**
6. 🔄 **Category Management**
7. 🔄 **Notifications System**
8. 🔄 **Profile and Settings**
9. 🔄 **Offline Support**
10. 🔄 **Performance Optimization**

## 📚 Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

## 🤝 Contributing

1. Follow the established project structure
2. Use TypeScript for all new code
3. Follow the ESLint configuration
4. Write tests for new features
5. Update documentation as needed

## 📄 License

This project is part of the Recur subscription management system.