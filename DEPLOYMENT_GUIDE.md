# BakeSync ERP - Deployment Guide

## Understanding Your Setup

Your Supabase project is **already deployed and working** at:
- **Supabase URL**: `https://zeqrxuxaljysecbovmmf.supabase.co/`
- This is your backend API and database - it's already live!

What you need to deploy is your **Next.js frontend application** to make it accessible on the web.

---

## Option 1: Deploy to Vercel (Recommended for Next.js)

Vercel is the easiest and most popular platform for deploying Next.js applications.

### Step 1: Prepare Your Project

1. **Ensure your code is committed to Git**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push
   ```

2. **Test your build locally**
   ```bash
   pnpm build
   ```
   If this succeeds, you're ready to deploy!

### Step 2: Deploy to Vercel

1. **Sign up/Login to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with your GitHub account (recommended)

2. **Import Your Project**
   - Click "Add New Project"
   - Import your Git repository (GitHub/GitLab/Bitbucket)
   - Select your BakeSync repository

3. **Configure Project Settings**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `pnpm build` (or leave default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `pnpm install`

4. **Add Environment Variables**
   In the "Environment Variables" section, add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://zeqrxuxaljysecbovmmf.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```
   (Get your anon key from Supabase Dashboard → Settings → API)

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (2-5 minutes)
   - Your app will be live at `https://your-project.vercel.app`

### Step 3: Update Supabase Auth Settings

After deployment, update your Supabase project settings:

1. **Go to Supabase Dashboard**
   - Navigate to: [https://app.supabase.com/project/zeqrxuxaljysecbovmmf](https://app.supabase.com/project/zeqrxuxaljysecbovmmf)

2. **Update Authentication Settings**
   - Go to **Authentication** → **URL Configuration**
   - **Site URL**: `https://your-project.vercel.app`
   - **Redirect URLs**: Add:
     - `https://your-project.vercel.app/auth/callback`
     - `https://your-project.vercel.app/**`
     - `https://your-project.vercel.app/dashboard`

3. **Save Changes**

---

## Option 2: Deploy to Other Platforms

### Netlify

1. **Sign up at [netlify.com](https://netlify.com)**
2. **Connect your Git repository**
3. **Build settings**:
   - Build command: `pnpm build`
   - Publish directory: `.next`
4. **Add environment variables** (same as Vercel)
5. **Deploy**

### Railway

1. **Sign up at [railway.app](https://railway.app)**
2. **Create new project from Git**
3. **Add environment variables**
4. **Deploy**

### Self-Hosted (VPS/Server)

1. **Build the application**:
   ```bash
   pnpm build
   ```

2. **Start the production server**:
   ```bash
   pnpm start
   ```

3. **Use a process manager** (PM2 recommended):
   ```bash
   npm install -g pm2
   pm2 start npm --name "bakesync" -- start
   pm2 save
   pm2 startup
   ```

4. **Configure reverse proxy** (Nginx recommended) to handle HTTPS

---

## Post-Deployment Checklist

- [ ] Application builds successfully
- [ ] Environment variables are set correctly
- [ ] Supabase Auth Site URL is updated
- [ ] Supabase Auth Redirect URLs are configured
- [ ] Test user registration/login
- [ ] Test database connections
- [ ] Verify all features work in production

---

## Troubleshooting

### Build Errors

If you encounter build errors:
1. Check the build logs in your deployment platform
2. Ensure all dependencies are in `package.json`
3. Try building locally: `pnpm build`

### Authentication Issues

If authentication doesn't work:
1. Verify environment variables are set correctly
2. Check Supabase Auth settings (Site URL and Redirect URLs)
3. Ensure your production URL matches the Site URL in Supabase

### Database Connection Issues

If you can't connect to the database:
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
3. Check Supabase project is not paused
4. Verify RLS policies allow your operations

---

## Quick Deploy Commands (Vercel CLI)

Alternatively, you can use Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

---

## Your Current Status

✅ **Supabase Backend**: Deployed and working
- URL: `https://zeqrxuxaljysecbovmmf.supabase.co/`
- Database migrations: Applied
- Project linked: Yes

⏳ **Next.js Frontend**: Needs deployment
- Choose a hosting platform (Vercel recommended)
- Set environment variables
- Deploy and configure Supabase Auth

---

## Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Documentation](https://supabase.com/docs)


