# Deploy to Render

## Quick Deploy Steps

1. **Create Render Account** (free tier): https://render.com

2. **Connect GitHub** (or use direct Git URL):
   - Go to Render Dashboard → New → Web Service
   - Select GitHub → Connect GitHub account
   - Find `pirate` repository

3. **Configure Deployment**:
   - **Name**: `skypost-license-backend`
   - **Branch**: main (or your branch)
   - **Root Directory**: `skypost-backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/index-simple.js`
   - **Plan**: Free

4. **Add Environment Variables**:
   In Render Dashboard, go to Environment:
   ```
   STRIPE_SECRET_KEY=sk_test_51SkueoGqBdnUOwR7avWtT1Yz76Mog21t6xqVO7fQDYVpqypgzTUlzwlRLETWoUb4ZFE66vfMNehbOnmYBPMHlCOv00kvHVWwvn
   STRIPE_PUBLISHABLE_KEY=pk_test_51SkueoGqBdnUOwR7HurOWKQTwG362R2DAZtb16FKmSLMuNJXOSvdhoHX31RHpYv3fJma0nEkHWlRQgW0JePLj90z00uzVQug9w
   STRIPE_PRICE_ID=price_1SkugtGqBdnUOwR7LrDwQIro
   STRIPE_WEBHOOK_SECRET=whsec_JOMmM4Pe5XoSE4AJfkNa9BujfCVUtJU6
   ```

5. **Deploy**: Click "Deploy" and wait ~2 minutes

6. **Get Your URL**: After deployment, you'll see `https://skypost-license-backend-xxxx.onrender.com`

7. **Update Stripe Webhook** (in Stripe Dashboard):
   - Endpoint URL: `https://skypost-license-backend-xxxx.onrender.com/webhooks/stripe`
   - Events: `charge.succeeded`, `customer.subscription.created`

8. **Update Extension** (`license.js`):
   Change:
   ```javascript
   const response = await fetch('http://localhost:3000/api/licenses/verify', {
   ```
   To:
   ```javascript
   const response = await fetch('https://skypost-license-backend-xxxx.onrender.com/api/licenses/verify', {
   ```

Done! Your backend is live with Stripe payments 🎉

## Testing Payment Flow

1. User enters email and clicks "Get Pro"
2. Stripe checkout opens
3. Use test card: `4242 4242 4242 4242` (any future expiry, any CVC)
4. Webhook triggers → License auto-created
5. Extension detects license and activates Pro features

## Database

SQLite database file (`licenses.db`) persists on Render's file system.
Licenses and users are permanent (won't reset on restart).
