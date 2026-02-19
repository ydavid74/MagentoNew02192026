# Environment Setup Guide

This guide explains how to set up environment variables for the Magento Admin application, particularly for configuring the ngrok URL for the Shopify Database Sync API.

## Quick Setup

### 1. Set up ngrok URL

Run the setup script with your ngrok URL:

```bash
node setup-env.js https://your-ngrok-url.ngrok-free.app
```

This will create a `.env.local` file with the proper configuration.

### 2. Start the development server

```bash
npm run dev
```

## Manual Setup

If you prefer to set up the environment file manually:

### 1. Create `.env.local` file

Create a `.env.local` file in the root directory with the following content:

```env
# Environment Configuration for Local Development
# This file is for local development only and should not be committed to version control

# Ngrok URL for Shopify Database Sync API
VITE_NGROK_URL=https://your-ngrok-url.ngrok-free.app

# API Base URL (will be constructed from NGROK_URL)
VITE_API_BASE_URL=${VITE_NGROK_URL}/api

# Development mode
VITE_DEV_MODE=true
```

### 2. Update the ngrok URL

Replace `https://your-ngrok-url.ngrok-free.app` with your actual ngrok URL.

## Environment Variables

| Variable            | Description                                          | Example                             |
| ------------------- | ---------------------------------------------------- | ----------------------------------- |
| `VITE_NGROK_URL`    | The base ngrok URL for the Shopify Database Sync API | `https://abc123.ngrok-free.app`     |
| `VITE_API_BASE_URL` | The full API endpoint URL                            | `https://abc123.ngrok-free.app/api` |
| `VITE_DEV_MODE`     | Development mode flag                                | `true`                              |

## Updating ngrok URL

When your ngrok URL changes (which happens every time you restart ngrok unless you have a paid plan), you need to update the environment file:

### Using the setup script:

```bash
node setup-env.js https://new-ngrok-url.ngrok-free.app
```

### Manually:

Edit the `.env.local` file and update the `VITE_NGROK_URL` value.

## How it works

The application uses Vite's environment variable system:

1. Environment variables prefixed with `VITE_` are exposed to the client-side code
2. The API configuration in `src/config/api.ts` reads these variables
3. If no environment variables are set, it falls back to the default ngrok URL
4. The `.env.local` file is ignored by git and is for local development only

## Troubleshooting

### Environment variables not working

- Make sure your environment variables are prefixed with `VITE_`
- Restart the development server after changing environment variables
- Check that the `.env.local` file is in the root directory

### API calls failing

- Verify your ngrok URL is correct and active
- Make sure the Shopify Database Sync service is running
- Check the browser console for any CORS or network errors

### ngrok URL keeps changing

- Consider upgrading to a paid ngrok plan for a static URL
- Use the setup script to quickly update the URL when it changes
- Set up a script to automatically update the URL when ngrok restarts
