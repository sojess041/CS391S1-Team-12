# Deployment Guide

This guide covers deploying Spark!Bytes to production.

## Prerequisites

- A Supabase project with database schema set up (see [DATABASE_SETUP.md](./DATABASE_SETUP.md))
- Supabase Storage configured for images (see [STORAGE_SETUP.md](./STORAGE_SETUP.md))
- Environment variables ready

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)

Vercel is the easiest way to deploy Next.js applications.

#### Steps:

1. **Push your code to GitHub** (if not already done)

2. **Import project to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Select the repository: `sojess041/CS391S1-Team-12`

3. **Configure project settings:**
   - **Root Directory:** `client`
   - **Framework Preset:** Next.js (auto-detected)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

4. **Add Environment Variables:**
   In Vercel project settings → Environment Variables, add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (for API routes)
   ```

5. **Deploy:**
   - Click "Deploy"
   - Vercel will automatically build and deploy your app
   - You'll get a URL like `https://your-project.vercel.app`

6. **Update Supabase Auth Redirect URLs:**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your Vercel URL to "Redirect URLs"
   - Add `https://your-project.vercel.app/auth/callback` to allowed redirect URLs

### Option 2: Other Platforms

#### Netlify
- Similar to Vercel
- Set root directory to `client`
- Add environment variables in Netlify dashboard
- Build command: `npm run build`
- Publish directory: `.next`

#### Self-hosted (Docker)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Post-Deployment Checklist

- [ ] Verify environment variables are set correctly
- [ ] Test authentication (sign up, log in)
- [ ] Test event creation and editing
- [ ] Test image uploads
- [ ] Verify Google Maps links work
- [ ] Test dark mode toggle
- [ ] Check mobile responsiveness
- [ ] Update Supabase redirect URLs
- [ ] Test email confirmation (if enabled)

## Environment Variables Required

### Required:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key

### Optional (for API routes):
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for server-side operations

### Optional (for email notifications):
- `RESEND_API_KEY` - If using Resend for emails

## Troubleshooting

### Build fails
- Check that all TypeScript errors are resolved
- Ensure all dependencies are in `package.json`
- Verify environment variables are set

### Authentication not working
- Check Supabase redirect URLs include your deployment URL
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check browser console for errors

### Images not uploading
- Verify Supabase Storage is configured (see [STORAGE_SETUP.md](./STORAGE_SETUP.md))
- Check storage bucket permissions
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set if using API routes

### Map not loading
- Leaflet uses OpenStreetMap (no API key needed)
- Check browser console for CORS or loading errors
- Verify Leaflet CSS is loading correctly

## Custom Domain

To use a custom domain:
1. Add domain in Vercel/Netlify settings
2. Update DNS records as instructed
3. Update Supabase redirect URLs to include your custom domain
4. Update `NEXT_PUBLIC_SITE_URL` if used in your app

