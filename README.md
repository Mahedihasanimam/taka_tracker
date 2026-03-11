<div align="center">
  <img src="assets/icon.png" alt="TakaTrack Logo" width="120" height="120" />
  
  # TakaTrack (টাকাট্র্যাক)
  
  **A Modern Personal Finance Tracker for Bangladesh**
  
  [![React Native](https://img.shields.io/badge/React%20Native-0.74-blue?logo=react)](https://reactnative.dev/)
  [![Expo](https://img.shields.io/badge/Expo-SDK%2051-black?logo=expo)](https://expo.dev/)
  [![SQLite](https://img.shields.io/badge/SQLite-Local%20DB-green?logo=sqlite)](https://www.sqlite.org/)
  [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
  [![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS-lightgrey)]()

  <p align="center">
    <a href="#-features">Features</a> •
    <a href="#-screenshots">Screenshots</a> •
    <a href="#-installation">Installation</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-documentation">Documentation</a>
  </p>
</div>

---

## 📖 About

**TakaTrack** is a feature-rich, offline-first personal finance management application designed specifically for users in Bangladesh. Built with React Native and Expo, it helps users track their daily income and expenses, manage budgets, and visualize their financial data through intuitive charts—all without requiring an internet connection.

### Why TakaTrack?

- 🔒 **Privacy First**: All data stored locally on your device
- 📴 **Works Offline**: No internet required for any feature
- 🇧🇩 **Made for Bangladesh**: Supports Bengali (বাংলা) language and BDT (৳) currency
- 📊 **Visual Insights**: Beautiful charts to understand your spending
- 🎨 **Modern UI**: Clean, intuitive interface with bKash-inspired design

---

## ✨ Features

### 💰 Transaction Management

- Add income and expense transactions
- Categorize with custom icons and colors
- Add notes and select dates
- Search and filter transactions
- Edit or delete entries

### 📁 Category Management

- Create custom categories for income/expense
- Choose from 20+ icons
- Pick from 15 color options
- Separate categories for income and expense

### 📊 Budget Tracking

- Set monthly budgets per category
- Visual progress indicators
- Alerts when approaching/exceeding limits
- Suggested limits based on income (10%, 20%, 30%)

### 📈 Analytics Dashboard

- **Daily View**: Donut chart showing category breakdown
- **Weekly View**: Bar chart for 7-day spending pattern
- **Monthly View**: Line chart showing spending trends
- Real-time balance calculation

### 📤 Data Export

- Export transactions as **CSV** (for spreadsheets)
- Export as **PDF** (professional reports)
- Filter by date range before export
- Share via any app on your device

### 🌐 Multi-language Support

- English
- Bengali (বাংলা)
- Easy language switching

### 🔐 Secure Authentication

- Local user accounts
- Password protection
- Token-based session management
- Password reset functionality

---

## 📱 Screenshots

<div align="center">
  <table>
    <tr>
      <td align="center"><b>Dashboard</b></td>
      <td align="center"><b>Transactions</b></td>
      <td align="center"><b>Add Transaction</b></td>
    </tr>
    <tr>
      <td><img src="docs/screenshots/home.png" width="200"/></td>
      <td><img src="docs/screenshots/transactions.png" width="200"/></td>
      <td><img src="docs/screenshots/add.png" width="200"/></td>
    </tr>
    <tr>
      <td align="center"><b>Budget</b></td>
      <td align="center"><b>Categories</b></td>
      <td align="center"><b>Profile</b></td>
    </tr>
    <tr>
      <td><img src="docs/screenshots/budget.png" width="200"/></td>
      <td><img src="docs/screenshots/categories.png" width="200"/></td>
      <td><img src="docs/screenshots/profile.png" width="200"/></td>
    </tr>
  </table>
</div>

---

## 🚀 Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Android Studio](https://developer.android.com/studio) (for Android) or [Xcode](https://developer.apple.com/xcode/) (for iOS)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/MoneyMaster.git

# Navigate to project directory
cd MoneyMaster

# Install dependencies
npm install

# Install Expo packages
npx expo install

# Start the development server
npx expo start
```

### Running on Device

```bash
# Android
npx expo start --android

# iOS
npx expo start --ios

# Or scan QR code with Expo Go app
npx expo start
```

### Building for Production

```bash
# Android APK
eas build --platform android --profile preview

# Android App Bundle (for Play Store)
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production
```

---

## 🛠 Tech Stack

| Category             | Technology                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------- |
| **Framework**        | [React Native](https://reactnative.dev/)                                                                 |
| **Platform**         | [Expo](https://expo.dev/) (SDK 51)                                                                       |
| **Navigation**       | [Expo Router](https://docs.expo.dev/router/introduction/)                                                |
| **Database**         | [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/)                                         |
| **State Management** | React Context API                                                                                        |
| **Storage**          | [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/) |
| **Styling**          | [twrnc](https://github.com/jaredh159/tailwind-react-native-classnames) (Tailwind CSS)                    |
| **Icons**            | [lucide-react-native](https://lucide.dev/)                                                               |
| **Charts**           | [react-native-gifted-charts](https://gifted-charts.web.app/)                                             |
| **UI Effects**       | [expo-linear-gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/)                       |
| **Image Picker**     | [expo-image-picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)                              |
| **File System**      | [expo-file-system](https://docs.expo.dev/versions/latest/sdk/filesystem/)                                |
| **PDF Generation**   | [expo-print](https://docs.expo.dev/versions/latest/sdk/print/)                                           |
| **Sharing**          | [expo-sharing](https://docs.expo.dev/versions/latest/sdk/sharing/)                                       |

---

## 📂 Project Structure

```
MoneyMaster/
├── 📁 app/                      # Expo Router screens
│   ├── 📁 (tabs)/               # Tab navigation
│   │   ├── _layout.tsx          # Tab configuration
│   │   ├── index.tsx            # Home/Dashboard
│   │   ├── transactions.tsx     # Transaction list
│   │   ├── add.tsx              # Add transaction
│   │   ├── budget.tsx           # Budget management
│   │   └── profile.tsx          # User profile
│   ├── 📁 auth/                 # Authentication
│   │   ├── signIn.tsx
│   │   ├── signUp.tsx
│   │   ├── forgotPassword.tsx
│   │   └── resetPassword.tsx
│   ├── 📁 profile/              # Profile screens
│   │   ├── edit.tsx
│   │   └── changePassword.tsx
│   ├── 📁 screens/              # Other screens
│   │   └── categories.tsx
│   └── _layout.tsx              # Root layout
├── 📁 components/               # Reusable components
├── 📁 constants/                # App constants
│   └── translations.ts          # i18n translations
├── 📁 context/                  # React contexts
│   ├── AuthContext.tsx          # Authentication
│   └── LanguageContext.tsx      # Internationalization
├── 📁 services/                 # Business logic
│   └── db.ts                    # Database operations
├── 📁 utils/                    # Utility functions
├── 📁 assets/                   # Static assets
├── 📁 docs/                     # Documentation
├── app.json                     # Expo configuration
├── package.json                 # Dependencies
└── README.md                    # This file
```

---

## 💾 Database Schema

TakaTrack uses SQLite for local data persistence:

```sql
-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  amount REAL NOT NULL,
  type TEXT NOT NULL,        -- 'income' or 'expense'
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  note TEXT,
  icon TEXT,
  color TEXT
);

-- Categories table
CREATE TABLE categories (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  name TEXT NOT NULL,
  type TEXT NOT NULL,        -- 'income' or 'expense'
  icon TEXT NOT NULL,
  color TEXT NOT NULL
);

-- Budgets table
CREATE TABLE budgets (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  category TEXT NOT NULL,
  limit_amount REAL NOT NULL
);
```

---

## 📚 Documentation

Detailed documentation is available in the `/docs` folder:

| Document                                      | Description                       |
| --------------------------------------------- | --------------------------------- |
| [DATABASE.md](docs/DATABASE.md)               | Database schema and relationships |
| [AUTH_FLOW.md](docs/AUTH_FLOW.md)             | Authentication flow diagram       |
| [FEATURES.md](docs/FEATURES.md)               | Detailed feature documentation    |
| [SCREENS.md](docs/SCREENS.md)                 | Screen-by-screen documentation    |
| [SERVICES.md](docs/SERVICES.md)               | API and service documentation     |
| [CONTEXTS.md](docs/CONTEXTS.md)               | Context providers guide           |
| [TRANSLATIONS.md](docs/TRANSLATIONS.md)       | Translation system guide          |
| [SETUP.md](docs/SETUP.md)                     | Detailed setup instructions       |
| [QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md) | Quick code reference              |

---

## 🛒 Envato Submission Kit

Submission helper docs are available in `envato/`:

- `01-MARKETPLACE-CHOICE.md`
- `02-SUBMISSION-CHECKLIST.md`
- `03-ITEM-DESCRIPTION-TEMPLATE.md`
- `04-PRICING-GUIDE.md`
- `05-WHAT-YOU-MUST-DO.md`

Build a clean upload package:

```bash
npm run package:envato
```

---

## 🎨 Design System

### Colors

| Color                | Hex       | Usage              |
| -------------------- | --------- | ------------------ |
| Primary (bKash Pink) | `#e2136e` | Main brand color   |
| Primary Dark         | `#be125a` | Gradients, headers |
| Success              | `#10b981` | Income, positive   |
| Warning              | `#f59e0b` | Budget warnings    |
| Error                | `#ef4444` | Expense, errors    |
| Info                 | `#3b82f6` | Information        |

### Typography

- **Font Family**: System default
- **Heading**: 24px, Extra Bold
- **Subheading**: 18px, Bold
- **Body**: 14px, Medium
- **Caption**: 12px, Regular

---

## 🔧 Configuration

### Environment Variables

No environment variables required! TakaTrack is fully offline.

### App Configuration (app.json)

```json
{
  "expo": {
    "name": "TakaTrack",
    "slug": "MoneyMaster",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "MoneyMaster",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#e2136e"
    },
    "android": {
      "package": "com.yourcompany.MoneyMaster",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#e2136e"
      }
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.MoneyMaster",
      "supportsTablet": true
    }
  }
}
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript for type safety
- Follow React Native best practices
- Use functional components with hooks
- Style with Tailwind CSS (twrnc)
- Add translations for new text

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```

```
