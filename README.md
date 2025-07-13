# E-Tanzeem Diary App - User Guide

## Overview

The E-Tanzeem Diary App is a comprehensive organizational management application designed for the Jamat-e-Islami Pakistan organization. It serves as a digital platform for managing organizational activities, member records, reports, and hierarchical unit structures within the Tanzeem (organizational) system.

## Key Features

### 1. Authentication & User Management
- **Login System**: Secure email-based authentication
- **Role-based Access**: Different permissions based on user's organizational level
- **Profile Management**: Users can view and edit their personal information
- **Urdu Interface**: Complete Urdu language support with RTL layout

### 2. Dashboard (ڈیش بورڈ)
The main dashboard provides an overview of:
- **User's Unit Information**: Current organizational unit and hierarchy
- **Quick Statistics**: Workforce counts, activities, and reports
- **Navigation Hub**: Access to all major features
- **Duration Selection**: Filter data by time periods (last 2 weeks, last month, etc.)
- **Report Generation**: Quick access to generate organizational reports

### 3. Member Management (ارکان)
- **Member Directory**: View all members in your organizational unit
- **Search & Filter**: Find members by name, address, or phone number
- **Member Categories**: 
  - **ارکان (Rukun)**: Full members
  - **امیدوار (Umeedwar)**: Candidates
  - **کارکن (Karkun)**: Workers
- **Member Details**: View comprehensive information including:
  - Personal details (name, CNIC, date of birth)
  - Contact information (phone, WhatsApp, address)
  - Organizational details (unit assignment, status)
  - Professional information (education, profession)
- **Add/Edit Members**: Create new member records or update existing ones
- **Transfer Members**: Move members between organizational units

### 4. Activities Management (سرگرمیاں)
- **Schedule Activities**: Plan future organizational activities
- **Report Activities**: Document completed activities
- **Activity Types**:
  - **تنظیمی (Organizational)**: Internal organizational activities
  - **دعوتی (Invitational)**: Outreach and invitation activities
  - **تربیت (Training)**: Educational and training sessions
- **Activity Details**: Include location, date/time, attendance, and descriptions
- **Status Tracking**: Track activity status (draft, published, pending)

### 5. Reports System (رپورٹس)
- **Comprehensive Reporting**: Generate detailed organizational reports
- **Multiple Report Types**: Various templates for different organizational needs
- **Progress Tracking**: Monitor completion status of reports
- **Filter Options**: Filter reports by time period, unit, and status
- **Submission Management**: Submit and track report submissions

### 6. Workforce Management (افرادی قوت)
- **Workforce Overview**: View total member counts by category
- **Statistics Dashboard**: Track increases, targets, and achievements
- **Unit-wise Breakdown**: See workforce distribution across units

### 7. Financial Management (آمدنی)
- **Income Tracking**: Record and monitor organizational income
- **Expense Management**: Track organizational expenses
- **Financial Reports**: Generate financial summaries

### 8. Meeting Management (جلسے)
- **Meeting Scheduling**: Plan and schedule organizational meetings
- **Meeting Reports**: Document meeting outcomes and attendance
- **Visit Tracking**: Record and track organizational visits

## Navigation Structure

### Main Tabs:
1. **ڈیش بورڈ (Dashboard)** - Main overview and quick actions
2. **رپورٹس (Reports)** - Report generation and management
3. **سرگرمیاں (Activities)** - Activity scheduling and reporting
4. **ارکان (Arkan)** - Member management

### Additional Screens:
- **افرادی قوت (Workforce)** - Workforce statistics
- **آمدنی (Income)** - Financial management
- **جلسے (Meetings)** - Meeting management
- **پروفائل (Profile)** - User profile and settings

## User Interface Features

### Language & Design:
- **Urdu Interface**: Complete Urdu language support with right-to-left (RTL) layout
- **Localized Content**: All interface elements, labels, and content in Urdu
- **Modern UI**: Clean, professional interface design optimized for Urdu text
- **Responsive Layout**: Adapts to different screen sizes
- **Color-coded Elements**: Different colors for different member types and statuses
- **Intuitive Icons**: Visual indicators for different functions

## Data Management

### Hierarchical Structure:
- **Organizational Units**: Multi-level organizational hierarchy
- **Unit Management**: View and manage subordinate units
- **Parent-Child Relationships**: Navigate organizational structure

### Data Synchronization:
- **Real-time Updates**: Live data synchronization with backend
- **Offline Capability**: Basic functionality available offline
- **Data Persistence**: Local storage for improved performance

## Security Features

### Authentication:
- **Secure Login**: Email-based authentication system
- **Token Management**: Automatic token refresh for continuous access
- **Access Control**: Role-based permissions and restrictions

### Data Protection:
- **Encrypted Storage**: Secure local data storage
- **API Security**: Secure communication with backend services
- **Privacy Compliance**: User data protection measures

## Technical Features

### Performance:
- **Fast Loading**: Optimized for quick data retrieval
- **Efficient Search**: Quick member and data search capabilities
- **Smooth Navigation**: Responsive navigation between screens

### Compatibility:
- **Cross-Platform**: Works on Android and iOS devices
- **Offline Support**: Basic functionality without internet connection
- **Push Notifications**: Real-time updates and reminders

## Getting Started

### First Time Setup:
1. **Download & Install**: Install the app from your device's app store
2. **Login**: Use your organizational email and password
3. **Profile Setup**: Complete your profile information
4. **Unit Assignment**: Verify your organizational unit assignment

### Daily Usage:
1. **Check Dashboard**: Review daily activities and statistics
2. **Manage Members**: Add, edit, or transfer members as needed
3. **Schedule Activities**: Plan upcoming organizational activities
4. **Generate Reports**: Create and submit required reports
5. **Track Progress**: Monitor organizational goals and achievements

## Best Practices

### Data Entry:
- **Accurate Information**: Ensure all member and activity data is accurate
- **Regular Updates**: Keep member information current
- **Complete Records**: Fill all required fields for comprehensive reporting

### Activity Management:
- **Timely Reporting**: Report activities promptly after completion
- **Detailed Descriptions**: Provide comprehensive activity descriptions
- **Attendance Tracking**: Record accurate attendance numbers

### Report Generation:
- **Regular Submissions**: Submit reports on schedule
- **Quality Content**: Ensure report content is complete and accurate
- **Progress Monitoring**: Track report completion status

## Support & Troubleshooting

### Common Issues:
- **Login Problems**: Verify email and password, check internet connection
- **Data Sync Issues**: Refresh the app or check network connectivity
- **Performance Issues**: Clear app cache or restart the application

### Getting Help:
- **In-app Support**: Use the help section within the app
- **Administrator Contact**: Contact your organizational administrator for access issues
- **Technical Support**: Reach out to the development team for technical problems

## Development Setup

### Prerequisites:
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation:
```bash
# Clone the repository
git clone <repository-url>
cd etanzeem_diary_app

# Install dependencies
npm install

# Start the development server
npm start
```

### Available Scripts:
- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS simulator (macOS only)
- `npm run web` - Run in web browser
- `npm test` - Run tests
- `npm run lint` - Run linting

### Environment Configuration:
The app uses the following environment variables:
- `EXPO_PUBLIC_API_BASE_URL` - Backend API base URL

## Technology Stack

- **Frontend**: React Native with Expo
- **State Management**: Redux Toolkit with Redux Persist
- **Navigation**: Expo Router
- **UI Components**: Custom components with React Native
- **API Client**: Custom API client with token refresh
- **Storage**: MMKV for secure local storage
- **Localization**: i18n-js for Urdu language support
- **Backend**: Directus CMS with REST API

## Project Structure

```
etanzeem_diary_app/
├── app/                    # Main application code
│   ├── components/         # Reusable UI components
│   ├── constants/          # App constants and configurations
│   ├── features/           # Redux slices and business logic
│   ├── screens/            # Screen components
│   ├── services/           # API and external services
│   ├── store/              # Redux store configuration
│   └── utils/              # Utility functions
├── assets/                 # Static assets (images, fonts)
├── locales/                # Translation files
├── android/                # Android-specific configuration
├── ios/                    # iOS-specific configuration
└── docs/                   # Documentation
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is proprietary software developed for Jamat-e-Islami Pakistan.

## Contact

For technical support or questions about the application, please contact the development team.

---

**Note**: This application is designed specifically for the organizational structure and needs of Jamat-e-Islami Pakistan. All features and terminology are tailored to the organization's requirements and hierarchical system. The interface is fully localized in Urdu with right-to-left (RTL) layout support.
