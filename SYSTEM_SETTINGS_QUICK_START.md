# 🚀 System Settings Quick Start Guide

## ✅ **FIXED: API Server Issues Resolved!**

The system settings page is now fully functional with a working API server. Here's how to get started:

## 🛠️ **Setup Instructions**

### 1. **Start the API Server**

```bash
cd shopify-database-sync
npm run api:start
```

The server will run on **port 3002** and you'll see:

```
[INFO] System Settings API server running on port 3002
```

### 2. **Access System Settings**

1. Open your Magento Admin app
2. Navigate to **System Settings** in the navigation menu
3. Configure your settings as needed

## 🧪 **Test the API (Optional)**

```bash
# Test health endpoint
curl http://localhost:3002/health

# Test settings endpoint
curl http://localhost:3002/api/settings

# Test sync endpoint
curl -X POST http://localhost:3002/api/sync/run-once
```

## 📋 **Available Features**

### **General Tab**

- ✅ **Cron Job Interval**: Set how often automated tasks run (1-1440 minutes)
- ✅ **Email Notifications**: Toggle email notifications on/off
- ✅ **Save Settings**: Persist your configuration

### **Sync Jobs Tab**

- ✅ **Run Sync Once**: Manually trigger data synchronization
- ✅ **Sync Status**: View current sync status and last run time
- ✅ **Cron Job Toggle**: Enable/disable automatic sync jobs

### **Automation Tab**

- ✅ **Test Automation Once**: Manually test the automation workflow
- ✅ **Automation Status**: View current automation status
- ✅ **Cron Job Toggle**: Enable/disable automatic automation jobs

### **Import Tab**

- ✅ **Google Sheets URL**: Enter your Google Sheets URL for status model import
- ✅ **Import Status Model**: Import status rules from Google Sheets
- ✅ **Test Email**: Test email sending functionality

## 🔧 **What Was Fixed**

1. **ES Module Issues**: Fixed `require.main === module` to work with ES modules
2. **Settings Loading**: Fixed settings file loading and creation
3. **Port Conflicts**: Changed from port 3001 to 3002 to avoid conflicts
4. **API Endpoints**: All endpoints are now working correctly
5. **Frontend Integration**: Updated API URLs to use the correct port

## 🎯 **Next Steps**

1. **Start the API server** using the command above
2. **Open the Magento Admin** and navigate to System Settings
3. **Test the features** by clicking the various buttons
4. **Configure your settings** as needed

## 🚨 **Troubleshooting**

### **Server Won't Start**

- Make sure port 3002 is available
- Check if another process is using the port
- Try running `npm run api:start` again

### **API Calls Fail**

- Ensure the API server is running on port 3002
- Check the browser console for CORS errors
- Verify the API server logs for errors

### **Settings Not Saving**

- Check if the `config` directory exists in `shopify-database-sync/src/`
- Verify file permissions for the settings file

## 📊 **API Endpoints**

- `GET /health` - Health check
- `GET /api/settings` - Get current settings
- `POST /api/settings` - Update settings
- `POST /api/sync/run-once` - Run sync once
- `GET /api/sync/status` - Get sync status
- `POST /api/automation/run-once` - Run automation once
- `GET /api/automation/status` - Get automation status
- `POST /api/email/test` - Test email sending
- `GET /api/email/status` - Get email status
- `POST /api/import/status-model` - Import from Google Sheets

## 🎉 **Success!**

Your system settings page is now fully functional! You can:

- Configure cron job intervals
- Test sync and automation workflows
- Test email functionality
- Import status models from Google Sheets
- Monitor system status in real-time

The API server is running on port 3002 and all endpoints are working correctly. Enjoy your new system settings interface! 🚀
