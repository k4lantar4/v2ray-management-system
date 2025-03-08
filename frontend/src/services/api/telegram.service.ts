import { BaseApiService } from './base.service';

export class TelegramService extends BaseApiService {
  private static instance: TelegramService;

  private constructor() {
    super('/telegram');
  }

  public static getInstance(): TelegramService {
    if (!TelegramService.instance) {
      TelegramService.instance = new TelegramService();
    }
    return TelegramService.instance;
  }

  // Get bot information
  public async getBotInfo() {
    return this.get('/bot/info');
  }

  // Get user's Telegram channels
  public async getChannels() {
    return this.get('/channels');
  }

  // Add a new channel for marketing
  public async addChannel(username: string) {
    return this.post('/channels', { username });
  }

  // Remove a channel
  public async removeChannel(channelId: string) {
    return this.delete(`/channels/${channelId}`);
  }

  // Generate marketing content for channels using AI
  public async generateContent(channelId: string, topic: string) {
    return this.post(`/channels/${channelId}/generate-content`, { topic });
  }

  // Schedule content posting
  public async schedulePost(channelId: string, content: string, scheduledAt: string) {
    return this.post(`/channels/${channelId}/schedule`, { content, scheduledAt });
  }

  // Get scheduled posts
  public async getScheduledPosts(channelId: string) {
    return this.get(`/channels/${channelId}/scheduled`);
  }

  // Cancel scheduled post
  public async cancelScheduledPost(channelId: string, postId: string) {
    return this.delete(`/channels/${channelId}/scheduled/${postId}`);
  }

  // Get channel statistics
  public async getChannelStats(channelId: string) {
    return this.get(`/channels/${channelId}/stats`);
  }

  // Get bot commands usage statistics
  public async getBotStats() {
    return this.get('/bot/stats');
  }

  // Get user activity logs
  public async getUserLogs() {
    return this.get('/logs/users');
  }

  // Get purchase logs
  public async getPurchaseLogs() {
    return this.get('/logs/purchases');
  }

  // Get card-to-card transaction logs
  public async getCardTransactionLogs() {
    return this.get('/logs/card-transactions');
  }

  // Verify phone number through Telegram
  public async verifyPhone(phoneNumber: string) {
    return this.post('/verify/phone', { phoneNumber });
  }

  // Create support group
  public async createSupportGroup(name: string, description: string) {
    return this.post('/groups/support', { name, description });
  }

  // Get support groups
  public async getSupportGroups() {
    return this.get('/groups/support');
  }

  // Add admin to support group
  public async addGroupAdmin(groupId: string, userId: string) {
    return this.post(`/groups/${groupId}/admins`, { userId });
  }

  // Remove admin from support group
  public async removeGroupAdmin(groupId: string, userId: string) {
    return this.delete(`/groups/${groupId}/admins/${userId}`);
  }
} 