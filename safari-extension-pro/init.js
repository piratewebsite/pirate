// Initialize workspace and Bluesky after page load

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof NotesWorkspace !== 'undefined' && typeof BlueskyIntegration !== 'undefined') {
    window.licenseManager = new LicenseManager();
    await window.licenseManager.loadLicense();
    window.workspace = new NotesWorkspace();
    window.bluesky = new BlueskyIntegration();
    
    // Setup Pro Settings modal
    setupProModal();
  } else {
    console.error('[Init] Classes not defined yet');
  }
});

// Fallback if DOM already loaded
if (document.readyState !== 'loading') {
  if (typeof NotesWorkspace !== 'undefined' && typeof BlueskyIntegration !== 'undefined') {
    window.licenseManager = new LicenseManager();
    window.licenseManager.loadLicense().then(() => {
      window.workspace = new NotesWorkspace();
      window.bluesky = new BlueskyIntegration();
      
      // Setup Pro Settings modal
      setupProModal();
    });
  }
}

function setupProModal() {
  const proBtn = document.getElementById('pro-settings-btn');
  const modal = document.getElementById('pro-modal');
  const closeBtn = document.getElementById('pro-modal-close');
  
  if (!proBtn || !modal) return;
  
  // Open modal on button click
  proBtn.addEventListener('click', () => {
    renderProModal();
    modal.classList.add('active');
  });
  
  // Close modal on close button
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });
  
  // Close modal on background click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });
}

function renderProModal() {
  const body = document.getElementById('pro-modal-body');
  const isPro = window.licenseManager.isProUser();
  const features = window.licenseManager.getFeatureList();
  
  let html = `
    <div style="margin-bottom: 24px;">
      <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; border-left: 4px solid #667eea; margin-bottom: 20px;">
        <div style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 10px; ${isPro ? 'background: #d4edda; color: #155724;' : 'background: #f8d7da; color: #721c24;'}">
          ${isPro ? '✓ PRO ACTIVE' : '✗ FREE PLAN'}
        </div>
        <div style="font-size: 14px; color: #666;">
          ${isPro ? `Your Pro license expires in ${window.licenseManager.getRemainingDays()} days` : 'Upgrade to Pro to unlock advanced features'}
        </div>
      </div>
    </div>
  `;
  
  // Upgrade box
  if (!isPro) {
    html += `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <h2 style="margin: 0 0 10px 0;">Upgrade to Pro</h2>
        <div style="font-size: 32px; font-weight: bold; margin: 10px 0;">$9.99/month</div>
        <div style="font-size: 13px; margin: 15px 0; line-height: 1.6;">
          ✓ Unlimited scheduled posts<br>
          ✓ Post analytics & engagement tracking<br>
          ✓ Best time to post recommendations<br>
          ✓ Post templates & presets<br>
          ✓ Priority support
        </div>
        <button id="pricing-page-btn" style="margin-top: 15px; width: 100%; padding: 12px 24px; background: white; color: #667eea; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer;">
          Get Pro Access
        </button>
      </div>
    `;
  }
  
  // Features grid
  html += `<div style="margin-bottom: 24px;"><div style="font-weight: 600; color: #333; margin-bottom: 12px; font-size: 16px;">Available Features</div>`;
  html += `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">`;
  
  features.free.forEach(f => {
    html += `
      <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; text-align: center;">
        <div style="font-size: 16px; margin-bottom: 4px;">✓</div>
        <div style="font-weight: 600; font-size: 13px; color: #333;">${f.name}</div>
        ${f.limit ? `<div style="font-size: 11px; color: #999;">${f.limit}</div>` : ''}
      </div>
    `;
  });
  
  features.pro.forEach(f => {
    html += `
      <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; text-align: center; ${!isPro ? 'opacity: 0.6; background: #f9f9f9;' : ''}">
        <div style="font-size: 16px; margin-bottom: 4px;">${!isPro ? '🔒' : '⭐'}</div>
        <div style="font-weight: 600; font-size: 13px; color: #333;">${f.name}</div>
      </div>
    `;
  });
  
  html += '</div></div>';
  
  // Pro user management section
  if (isPro) {
    html += `
      <div style="margin-top: 24px; border-top: 1px solid #e0e0e0; padding-top: 24px;">
        <div style="font-weight: 600; color: #333; margin-bottom: 16px; font-size: 16px;">📋 Account Management</div>
        
        <div style="display: grid; gap: 12px;">
          <button id="backup-btn" style="padding: 12px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 14px;">
            💾 Backup All Data
          </button>
          <button id="restore-btn" style="padding: 12px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 14px;">
            📥 Restore from Backup
          </button>
          <button id="clear-data-btn" style="padding: 12px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 14px;">
            🗑️ Delete All Data & Remove License
          </button>
        </div>
      </div>
    `;
  }
  
  html += '</div></div>';
  
  // Action buttons
  html += `
    <div style="display: flex; gap: 12px; margin-top: 20px;">
      <button id="activate-license-btn" style="flex: 1; padding: 12px; background: #667eea; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
        ${isPro ? 'License Info' : 'Activate License'}
      </button>
      <button id="close-modal-btn" style="flex: 1; padding: 12px; background: #f0f0f0; color: #333; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
        Close
      </button>
    </div>
  `;
  
  body.innerHTML = html;
  
  // Setup button listeners
  const activateBtn = document.getElementById('activate-license-btn');
  const closeBtn = document.getElementById('close-modal-btn');
  const pricingBtn = document.getElementById('pricing-page-btn');
  
  if (activateBtn) {
    activateBtn.addEventListener('click', () => {
      const key = prompt('Enter your license key:');
      if (key) {
        window.licenseManager.activateLicense(key).then((result) => {
          if (result.success) {
            alert(result.message);
            renderProModal();
          } else {
            alert('❌ ' + result.error);
          }
        });
      }
    });
  }
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.getElementById('pro-modal').classList.remove('active');
    });
  }
  
  if (pricingBtn) {
    pricingBtn.addEventListener('click', async () => {
      // Get user email for Stripe checkout
      const email = prompt('Enter your email for checkout:');
      if (!email) return;

      try {
        // Create checkout session
        const response = await fetch('https://skypost-license-backend.onrender.com/api/subscriptions/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail: email })
        });

        const data = await response.json();
        
        if (data.sessionUrl) {
          // Open Stripe checkout in new window
          chrome.tabs.create({ url: data.sessionUrl });
          alert('✅ Stripe checkout opened. Complete your purchase to activate Pro!');
        } else {
          alert('❌ Failed to create checkout session');
        }
      } catch (err) {
        console.error('Checkout error:', err);
        alert('❌ Checkout error: ' + err.message);
      }
    });
  }
  
  // Pro user management handlers
  if (isPro) {
    const backupBtn = document.getElementById('backup-btn');
    const restoreBtn = document.getElementById('restore-btn');
    const clearDataBtn = document.getElementById('clear-data-btn');
    
    if (backupBtn && window.workspace && window.workspace.backupManager) {
      backupBtn.addEventListener('click', async () => {
        try {
          const result = await window.workspace.backupManager.createBackup();
          if (result.success) {
            alert(`✅ Backup created successfully!\n${result.count} notes backed up`);
          } else {
            alert(`❌ Backup failed: ${result.error}`);
          }
        } catch (error) {
          alert('❌ Backup error: ' + error.message);
        }
      });
    }
    
    if (restoreBtn) {
      restoreBtn.addEventListener('click', () => {
        // Create hidden file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.onchange = async (e) => {
          const file = e.target.files[0];
          if (file && window.workspace && window.workspace.backupManager) {
            try {
              const preview = await window.workspace.backupManager.previewBackup(file);
              if (preview.success) {
                const confirmMsg = `Restore backup from ${preview.date}?\n\nThis will restore:\n• ${preview.noteCount} notes\n• ${preview.settingCount} settings\n\nCurrent data will be replaced.`;
                if (confirm(confirmMsg)) {
                  const progressDiv = document.createElement('div');
                  progressDiv.innerHTML = `<div style="padding: 16px; background: #d1ecf1; color: #0c5460; border-radius: 6px; margin-top: 12px;">Restoring data...</div>`;
                  document.getElementById('pro-modal-body').appendChild(progressDiv);
                  
                  const result = await window.workspace.backupManager.restoreBackup(file, (msg) => {
                    progressDiv.innerHTML = `<div style="padding: 16px; background: #d1ecf1; color: #0c5460; border-radius: 6px; margin-top: 12px;">${msg}</div>`;
                  });
                  
                  if (result.success) {
                    alert('✅ Data restored successfully! Reloading...');
                    setTimeout(() => window.location.reload(), 1000);
                  } else {
                    alert('❌ Restore failed: ' + result.error);
                    progressDiv.remove();
                  }
                }
              } else {
                alert('❌ Invalid backup file: ' + preview.error);
              }
            } catch (error) {
              alert('❌ Restore error: ' + error.message);
            }
          }
        };
        fileInput.click();
      });
    }
    
    if (clearDataBtn) {
      clearDataBtn.addEventListener('click', async () => {
        const confirmMsg = 'This will PERMANENTLY delete:\n\n• All notes\n• All settings\n• Your Pro license\n\nThis CANNOT be undone. Are you absolutely sure?';
        if (confirm(confirmMsg)) {
          const secondConfirm = 'Type YES to confirm deletion:';
          const response = prompt(secondConfirm);
          if (response === 'YES') {
            // Clear all data
            if (window.workspace && window.workspace.backupManager) {
              await window.workspace.backupManager.clearAllData(false);
              // Clear Bluesky session
              if (window.bluesky) {
                await window.bluesky.clearSession();
              }
              // Clear license
              if (window.licenseManager) {
                await window.licenseManager.deactivateLicense();
              }
              alert('✅ All data and license removed. Reloading extension...');
              setTimeout(() => window.location.reload(), 1000);
            }
          }
        }
      });
    }
  }
}
