# Deploying to Cloudflare Pages

To successfully deploy ViralTweetLab to Cloudflare Pages, you must follow these steps:

## 1. Enable Node.js Compatibility Flag
As shown in your screenshot, Next.js requires the `nodejs_compat` flag to run on Cloudflare's edge network.

1. Go to your **Cloudflare Dashboard**.
2. Navigate to **Workers & Pages** > **[Your Project Name]**.
3. Go to the **Settings** tab.
4. Click on **Functions** in the left sidebar.
5. Scroll down to **Compatibility Flags**.
6. For both **Production** and **Preview** environments, add the flag: `nodejs_compat`.
7. Click **Save**.

## 2. Environment Variables
Ensure you have set your `NEXT_PUBLIC_GEMINI_API_KEY` in the Cloudflare Pages dashboard under **Settings** > **Environment Variables**.

## 3. Build Settings
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (or `dist` depending on your adapter)

I have already added a `wrangler.toml` file to your project with the `nodejs_compat` flag included, which may help if you are using the Wrangler CLI.
