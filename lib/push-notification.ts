import webpush from 'web-push';

// Configure web push
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || '',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  actions?: {
    action: string;
    title: string;
    icon?: string;
  }[];
  data?: Record<string, any>;
}

export async function sendPushNotification(
  subscription: PushSubscriptionJSON,
  payload: PushNotificationPayload
) {
  try {
    const notificationPayload = {
      notification: {
        title: payload.title,
        body: payload.body,
        icon: payload.icon || `${process.env.NEXT_PUBLIC_APP_URL}/logo-dark.png`,
        badge: payload.badge || `${process.env.NEXT_PUBLIC_APP_URL}/badge.png`,
        tag: payload.tag || 'spaceout-notification',
        actions: payload.actions,
      },
      data: payload.data || {},
    };

    await webpush.sendNotification(subscription, JSON.stringify(notificationPayload));
    return { success: true };
  } catch (error: any) {
    console.error('Push notification error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendWelcomePushNotification(subscription: PushSubscriptionJSON, userName: string) {
  return sendPushNotification(subscription, {
    title: '👋 Welcome to SpaceOut!',
    body: `Hey ${userName}! Thanks for signing up. Start booking your workspace now!`,
    icon: `${process.env.NEXT_PUBLIC_APP_URL}/logo-dark.png`,
    actions: [
      { action: 'view', title: 'View Dashboard' },
      { action: 'close', title: 'Dismiss' },
    ],
    data: { url: '/user/dashboard' },
  });
}

export async function sendCheckInPushNotification(subscription: PushSubscriptionJSON) {
  return sendPushNotification(subscription, {
    title: '✅ Check-in Successful!',
    body: 'You have successfully checked in. Enjoy your workspace!',
    icon: `${process.env.NEXT_PUBLIC_APP_URL}/logo-dark.png`,
    actions: [
      { action: 'view', title: 'View Details' },
    ],
    data: { url: '/user/check-in' },
  });
}

export async function sendCheckOutPushNotification(subscription: PushSubscriptionJSON) {
  return sendPushNotification(subscription, {
    title: '👋 Thanks for using SpaceOut!',
    body: 'You have checked out. We hope to see you again soon!',
    icon: `${process.env.NEXT_PUBLIC_APP_URL}/logo-dark.png`,
    actions: [
      { action: 'rebook', title: 'Book Again' },
    ],
    data: { url: '/location' },
  });
}

export async function sendPaymentPushNotification(
  subscription: PushSubscriptionJSON,
  amount: number,
  reference: string
) {
  return sendPushNotification(subscription, {
    title: '💳 Payment Received',
    body: `Your payment of ₦${amount.toLocaleString()} has been processed successfully.`,
    icon: `${process.env.NEXT_PUBLIC_APP_URL}/logo-dark.png`,
    actions: [
      { action: 'receipt', title: 'View Receipt' },
    ],
    data: { url: '/user/payments', reference },
  });
}

export async function sendAdminNotificationOnSignup(
  subscriptions: PushSubscriptionJSON[],
  userName: string,
  userEmail: string
) {
  const promises = subscriptions.map((sub) =>
    sendPushNotification(sub, {
      title: '🎉 New User Signup',
      body: `${userName} (${userEmail}) just signed up for SpaceOut!`,
      icon: `${process.env.NEXT_PUBLIC_APP_URL}/logo-dark.png`,
      tag: 'admin-signup',
      data: { url: '/admin/dashboard/users' },
    })
  );
  return Promise.all(promises);
}

export async function sendAdminNotificationOnCheckIn(
  subscriptions: PushSubscriptionJSON[],
  userName: string
) {
  const promises = subscriptions.map((sub) =>
    sendPushNotification(sub, {
      title: '🔓 User Check-In',
      body: `${userName} has checked in to the workspace.`,
      icon: `${process.env.NEXT_PUBLIC_APP_URL}/logo-dark.png`,
      tag: 'admin-checkin',
      data: { url: '/admin/dashboard/bookings' },
    })
  );
  return Promise.all(promises);
}

export async function sendAdminWelcomePushNotification(
  subscription: PushSubscriptionJSON,
  adminName: string
) {
  return sendPushNotification(subscription, {
    title: '👋 Welcome Admin!',
    body: `${adminName}, you are now able to manage SpaceOut!`,
    icon: `${process.env.NEXT_PUBLIC_APP_URL}/logo-dark.png`,
    actions: [
      { action: 'dashboard', title: 'Go to Dashboard' },
    ],
    data: { url: '/admin/dashboard' },
  });
}
