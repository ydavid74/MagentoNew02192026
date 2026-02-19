# 🔧 System Settings Setup Guide

## Overview

The System Settings page provides comprehensive control over the PrimeStyle automation system, including sync jobs, automation workflows, email testing, and Google Sheets integration.

## 🚀 Features Implemented

### 1. **General Configuration**

- ✅ Cron job interval settings (1-1440 minutes)
- ✅ Email notifications toggle
- ✅ Settings persistence (localStorage)

### 2. **Data Synchronization**

- ✅ Run sync once manually
- ✅ Enable/disable sync cron job
- ✅ Real-time sync status display
- ✅ Integration with shopify-database-sync service

### 3. **Automation Workflow**

- ✅ Test automation once manually
- ✅ Enable/disable automation cron job
- ✅ Real-time automation status display
- ✅ Integration with automation service

### 4. **Email Testing**

- ✅ Test email sending functionality
- ✅ Real-time email test status
- ✅ Integration with Gmail SMTP

### 5. **Google Sheets Import**

- ✅ Import status model from Google Sheets
- ✅ URL validation for Google Sheets
- ✅ Status model data parsing

## 📁 Files Created

### Frontend (Magento Admin)

- `src/pages/SystemSettingsPage.tsx` - Main system settings page
- `src/api/sync.ts` - Sync API client
- `src/api/automation.ts` - Automation API client
- `src/api/email.ts` - Email API client
- `src/api/import.ts` - Import API client
- `src/services/googleSheets.ts` - Google Sheets integration service

### Backend (Shopify Database Sync)

- `src/services/systemSettings.ts` - System settings service
- `src/api/server.ts` - Express API server
- `package.json` - Updated with new dependencies

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
cd shopify-database-sync
npm install
```

### 2. Start the API Server

```bash
# Development mode (with auto-reload)
npm run api:dev

# Production mode
npm run api:start
```

The API server will run on port 3001 by default.

### 3. Configure Environment Variables

Add to your `.env` file:

```env
API_PORT=3001
```

### 4. Access System Settings

1. Navigate to the Magento Admin app
2. Click on "System Settings" in the navigation menu
3. Configure your settings as needed

## 📋 Usage Guide

### **General Tab**

- **Cron Job Interval**: Set how often automated tasks run (1-1440 minutes)
- **Email Notifications**: Toggle email notifications on/off
- **Save Settings**: Persist your configuration

### **Sync Jobs Tab**

- **Run Sync Once**: Manually trigger data synchronization
- **Sync Status**: View current sync status and last run time
- **Cron Job Toggle**: Enable/disable automatic sync jobs

### **Automation Tab**

- **Test Automation Once**: Manually test the automation workflow
- **Automation Status**: View current automation status
- **Cron Job Toggle**: Enable/disable automatic automation jobs

### **Import Tab**

- **Google Sheets URL**: Enter your Google Sheets URL for status model import
- **Import Status Model**: Import status rules from Google Sheets
- **Test Email**: Test email sending functionality

## 🔗 API Endpoints

### System Settings

- `GET /api/settings` - Get current settings
- `POST /api/settings` - Update settings

### Sync Operations

- `POST /api/sync/run-once` - Run sync once
- `GET /api/sync/status` - Get sync status

### Automation Operations

- `POST /api/automation/run-once` - Run automation once
- `GET /api/automation/status` - Get automation status

### Email Operations

- `POST /api/email/test` - Test email sending
- `GET /api/email/status` - Get email status

### Import Operations

- `POST /api/import/status-model` - Import status model from Google Sheets

## 📊 Google Sheets Integration

### Expected Format

Your Google Sheets should have the following columns:

1. **Status** - Current status name
2. **New Status** - Next status name
3. **Wait Time (Business Days)** - Number of business days to wait
4. **Description** - Description of the status transition
5. **Private Email** - Private email for notifications (optional)
6. **Email Subject** - Email subject line (optional)
7. **Email Custom Message** - Custom email message (optional)
8. **Additional Recipients** - Comma-separated list of additional recipients (optional)

### Example Google Sheets URL

```
https://docs.google.com/spreadsheets/d/your-spreadsheet-id/edit#gid=0
```

## 🔧 Configuration Options

### Cron Job Intervals

- **Minimum**: 1 minute
- **Maximum**: 1440 minutes (24 hours)
- **Default**: 60 minutes

### Email Configuration

- Uses Gmail SMTP (sales@primestyle.com)
- App password: nlptxxyrdjgariwx
- Port: 465 (SSL)

### System Status

The system provides real-time status for:

- Sync jobs (enabled/disabled, last run, next run)
- Automation jobs (enabled/disabled, last run, next run)
- Email configuration (enabled/disabled, configured status)
- Cron job settings (interval, enabled status)

## 🚨 Troubleshooting

### API Server Not Starting

1. Check if port 3001 is available
2. Verify all dependencies are installed
3. Check environment variables

### Email Test Failing

1. Verify Gmail credentials in .env file
2. Check Gmail app password validity
3. Ensure 2FA is enabled on Gmail account

### Google Sheets Import Failing

1. Verify the Google Sheets URL is correct
2. Ensure the sheet has the expected column headers
3. Check if the sheet is publicly accessible or has proper permissions

### Sync/Automation Not Working

1. Check if the shopify-database-sync service is running
2. Verify Supabase credentials
3. Check the service logs for errors

## 📈 Future Enhancements

- Real-time status updates via WebSocket
- Advanced Google Sheets integration with authentication
- Email template management
- Detailed logging and audit trails
- System health monitoring dashboard
- Backup and restore functionality

## 🎯 Benefits

- **Centralized Control**: All system operations in one place
- **Real-time Monitoring**: Live status updates for all services
- **Easy Configuration**: User-friendly interface for settings
- **Flexible Scheduling**: Customizable cron job intervals
- **Data Import**: Easy integration with Google Sheets
- **Email Testing**: Verify email functionality before going live
- **Admin-Only Access**: Secure access restricted to administrators

The System Settings page provides complete control over your PrimeStyle automation system, making it easy to manage, monitor, and configure all aspects of the platform!
