// MembershipUtils.js - Utility functions for membership management
// Modified to grant everyone free access
class MembershipUtils {
  static async checkMembershipStatus() {
    return { isValid: true, tier: 'premium', email: 'guest@local', source: 'open-access', message: 'Free access for all' };
  }

  static async checkUnifiedMembershipStatus() {
    return { isValid: true, tier: 'premium', email: 'guest@local', source: 'open-access', message: 'Free access for all' };
  }

  static getFavorites() {
    try { return JSON.parse(localStorage.getItem('memberFavorites') || '[]'); } catch { return []; }
  }

  static getBookmarkedChannels() {
    try { return JSON.parse(localStorage.getItem('memberChannels') || '[]'); } catch { return []; }
  }

  static addFavorite(video) {
    const favorites = this.getFavorites();
    const exists = favorites.some(fav => {
      if (video.uniqueId && fav.uniqueId) return fav.uniqueId === video.uniqueId;
      if (video.platform && fav.platform) return fav.videoId === video.videoId && fav.platform === video.platform;
      return fav.videoId === video.videoId;
    });
    if (!exists) {
      favorites.unshift({
        uniqueId: video.uniqueId || `${video.platform || 'youtube'}:${video.videoId}`,
        videoId: video.videoId, platform: video.platform || 'youtube',
        title: video.title, thumbnail: video.thumbnail,
        channelTitle: video.channelTitle, url: video.url,
        dateAdded: new Date().toISOString()
      });
      localStorage.setItem('memberFavorites', JSON.stringify(favorites));
    }
    return favorites;
  }

  static removeFavorite(videoId, platform = null) {
    const favorites = this.getFavorites();
    const filtered = favorites.filter(fav => {
      if (!fav.platform) return fav.videoId !== videoId;
      if (platform) return !(fav.videoId === videoId && fav.platform === platform);
      return fav.videoId !== videoId;
    });
    localStorage.setItem('memberFavorites', JSON.stringify(filtered));
    return filtered;
  }

  static addChannel(channel) {
    const channels = this.getBookmarkedChannels();
    const uniqueChannelId = `${channel.platform || 'youtube'}:${channel.channelId}`;
    const exists = channels.some(ch => {
      if (channel.uniqueChannelId && ch.uniqueChannelId) return ch.uniqueChannelId === channel.uniqueChannelId;
      if (channel.platform && ch.platform) return ch.channelId === channel.channelId && ch.platform === channel.platform;
      return ch.channelId === channel.channelId;
    });
    if (!exists) {
      channels.unshift({
        uniqueChannelId, channelId: channel.channelId,
        platform: channel.platform || 'youtube',
        channelName: channel.channelName,
        channelUrl: channel.channelUrl || null,
        dateAdded: new Date().toISOString()
      });
      localStorage.setItem('memberChannels', JSON.stringify(channels));
    }
    return channels;
  }

  static removeChannel(channelId, platform = null) {
    const channels = this.getBookmarkedChannels();
    const filtered = channels.filter(ch => {
      if (!ch.platform) return ch.channelId !== channelId;
      if (platform) return !(ch.channelId === channelId && ch.platform === platform);
      return ch.channelId !== channelId;
    });
    localStorage.setItem('memberChannels', JSON.stringify(filtered));
    return filtered;
  }

  static isFavorited(videoId, platform = null) {
    return this.getFavorites().some(fav => platform ? fav.videoId === videoId && fav.platform === platform : fav.videoId === videoId);
  }

  static isChannelBookmarked(channelId, platform = null) {
    return this.getBookmarkedChannels().some(ch => platform ? ch.channelId === channelId && ch.platform === platform : ch.channelId === channelId);
  }
}

// Export for ES6 module imports
export { MembershipUtils };
