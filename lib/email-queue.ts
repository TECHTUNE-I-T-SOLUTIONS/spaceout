/**
 * Email Queue utilities - Currently not in use
 * Batch emails are sent immediately without queuing
 */

// Placeholder exports to prevent import errors
export const initializeEmailQueue = async () => true;
export const getEmailQueueStats = async () => ({ pending: 0, sent: 0, failed: 0, total: 0 });
export const getPendingEmails = async () => [];
export const markEmailAsSent = async () => {};
export const markEmailAsFailed = async () => {};
export const cleanupOldEmails = async () => 0;
