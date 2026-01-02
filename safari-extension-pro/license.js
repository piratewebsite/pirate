// License management for Pro features
class LicenseManager {
  constructor() {
    this.LICENSE_KEY = 'proLicenseKey';
    this.LICENSE_EXPIRY = 'proLicenseExpiry';
    this.loadLicense();
  }

  loadLicense() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.LICENSE_KEY, this.LICENSE_EXPIRY], (result) => {
        // Remove old test licenses
        if (result[this.LICENSE_KEY] === 'BLUESKY-PRO-TEST-2025-UNLIMITED') {
          chrome.storage.local.remove([this.LICENSE_KEY, this.LICENSE_EXPIRY], () => {
            this.licenseKey = null;
            this.licenseExpiry = null;
            resolve();
          });
          return;
        }
        
        this.licenseKey = result[this.LICENSE_KEY];
        this.licenseExpiry = result[this.LICENSE_EXPIRY];
        resolve();
      });
    });
  }

  // Check if user has valid pro license
  isProUser() {
    if (!this.licenseKey) return false;
    if (!this.licenseExpiry) return false;
    return new Date(this.licenseExpiry) > new Date();
  }

  // Get remaining days
  getRemainingDays() {
    if (!this.isProUser()) return 0;
    const expiry = new Date(this.licenseExpiry);
    const now = new Date();
    const days = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  }

  // Activate license (called after payment)
  async activateLicense(licenseKey) {
    try {
      // Verify license key with backend
      const response = await fetch('https://skypost-license-backend.onrender.com/api/licenses/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey })
      });

      if (!response.ok) {
        throw new Error('Invalid license key');
      }

      const data = await response.json();
      
      if (!data.valid) {
        throw new Error(data.error || 'License verification failed');
      }

      // Store license
      const expiresAt = data.license?.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      
      await new Promise((resolve) => {
        chrome.storage.local.set({
          [this.LICENSE_KEY]: licenseKey,
          [this.LICENSE_EXPIRY]: expiresAt
        }, resolve);
      });

      this.licenseKey = licenseKey;
      this.licenseExpiry = expiresAt;
      return { success: true, message: '✅ License activated!' };
    } catch (err) {
      console.error('License activation error:', err);
      return { success: false, error: err.message };
    }
  }

  // Deactivate license
  async deactivateLicense() {
    return new Promise((resolve) => {
      chrome.storage.local.remove([this.LICENSE_KEY, this.LICENSE_EXPIRY], () => {
        this.licenseKey = null;
        this.licenseExpiry = null;
        resolve();
      });
    });
  }

  // Get feature list
  getFeatureList() {
    return {
      free: [
        { name: 'Basic Notes', limit: 'Unlimited' },
        { name: 'Local Storage', limit: 'Full' },
        { name: 'Text Formatting', limit: 'Basic' },
        { name: 'Manual Posting', limit: 'Yes' }
      ],
      pro: [
        { name: 'Scheduled Posts' },
        { name: 'Analytics' },
        { name: 'Templates' },
        { name: 'Priority Support' }
      ]
    };
  }

  // Check if user can use a specific feature
  canUseFeature(feature) {
    const proFeatures = ['analytics', 'scheduled', 'templates', 'priority', 'advancedPreviews'];
    if (!proFeatures.includes(feature)) return true; // Free features always available
    return this.isProUser();
  }
}
