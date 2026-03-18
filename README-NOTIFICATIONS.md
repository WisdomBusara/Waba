# WABA Notification System

This document outlines the notification system implemented in the WABA (Water Billing Application) system.

## Overview

The notification system allows administrators to configure alerts based on consumption thresholds and unusual activity. It monitors meter readings in real-time and generates alerts when specific conditions are met.

## Features

1. **High Consumption Alerts**: Triggers a notification when a single meter reading exceeds a user-defined threshold.
2. **Unusual Activity Alerts**: Triggers a notification when a meter reading is significantly higher than the average of the last 3 readings (specifically, more than double the average).
3. **User-Specific Settings**: Each administrator can configure their own alert thresholds and preferences (e.g., enable/disable email or push notifications).
4. **Real-Time Monitoring**: The system checks for alerts asynchronously every time a new meter reading is recorded.
5. **Notification Center**: A dedicated UI view to manage and read notifications, accessible via the bell icon in the header or the sidebar.

## How It Works

### 1. Database Schema
- **`notification_settings`**: Stores user preferences, including `highConsumptionThreshold`, `unusualActivityAlerts`, `emailAlerts`, and `pushAlerts`.
- **`notifications`**: Stores the generated alerts, including `title`, `message`, `type` (`HIGH_CONSUMPTION` or `UNUSUAL_ACTIVITY`), and `isRead` status.

### 2. Alert Generation Logic
When a new meter reading is submitted via `POST /api/meters/:id/readings`, the system asynchronously calls the `checkConsumptionAndNotify` function.

This function:
1. Calculates the consumption (current reading - previous reading).
2. Retrieves all users and their notification settings.
3. For each user, checks if the consumption exceeds their `highConsumptionThreshold`.
4. Calculates the average of the last 3 consumptions. If the current consumption is > 2x the average, it flags it as unusual activity.
5. If either condition is met (and the user has the alert enabled), it inserts a new record into the `notifications` table.

### 3. Mock Email and Push Notifications
Currently, the system logs a message to the server console when an email or push notification would be sent. 

```typescript
if (user.emailAlerts !== 0) {
    console.log(`[MOCK EMAIL] Sending email to ${user.email}: [${title}] ${message}`);
}
if (user.pushAlerts === 1) {
    console.log(`[MOCK PUSH] Sending push notification to user ${user.id}: [${title}] ${message}`);
}
```

To implement real email or push notifications, you can replace these `console.log` statements in `server.ts` with actual integrations (e.g., Nodemailer, SendGrid, Firebase Cloud Messaging).

### 4. Frontend UI
- **Header**: A bell icon displays the count of unread notifications. It polls the server every 30 seconds to stay updated.
- **Notifications View**: Displays a list of all notifications, allowing users to mark them as read. It also includes a settings panel to configure the `highConsumptionThreshold` and toggle email/push alerts.

## Setup and Configuration

No additional environment variables are required for the basic notification system. The settings are managed entirely through the UI and stored in the SQLite database.

To configure alerts:
1. Log in to the application.
2. Click the bell icon in the header or select "Notifications" from the sidebar.
3. Adjust the "High Consumption Threshold" and toggle the desired alert types in the "Alert Settings" panel.
4. Click "Save Settings".
