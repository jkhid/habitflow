# HabitFlow Deployment Guide

## Quick Start (Recommended)

### Backend: Deploy to Render

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/habitflow.git
   git push -u origin main
   ```

2. **Set up Render**
   - Go to [render.com](https://render.com) and sign up
   - Click "New +" → "Blueprint"
   - Connect your GitHub repo
   - Render will auto-detect the `render.yaml` and create:
     - PostgreSQL database (free tier)
     - Web service for the API

3. **Before deploying, switch to PostgreSQL schema**
   ```bash
   # Copy production schema
   copy prisma\schema.production.prisma prisma\schema.prisma
   ```

4. **Configure Environment Variables on Render**
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: (auto-generated or set a strong secret)
   - `CORS_ORIGIN`: `https://your-frontend-url.vercel.app`
   - `DATABASE_URL`: (auto-filled from database)

5. **Note your API URL** (e.g., `https://habitflow-api.onrender.com`)

---

### Frontend: Deploy to Vercel

1. **Push frontend to GitHub** (if not already)

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com) and sign up
   - Click "Add New Project"
   - Import your GitHub repo
   - Set the root directory to `frontend`
   - Framework preset: Vite

3. **Configure Environment Variables on Vercel**
   - `VITE_API_URL`: `https://your-backend-url.onrender.com/api`

4. **Deploy!**

---

## Alternative: Railway (Backend)

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select your repo
4. Add a PostgreSQL database from the Railway dashboard
5. Set environment variables:
   - `DATABASE_URL`: (copy from PostgreSQL service)
   - `JWT_SECRET`: your-secret-key
   - `CORS_ORIGIN`: https://your-frontend.vercel.app
   - `NODE_ENV`: production

---

## Environment Variables Reference

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-super-secret-key
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-frontend.vercel.app
```

### Frontend (.env)
```
VITE_API_URL=https://your-backend.onrender.com/api
```

---

## Post-Deployment Checklist

- [ ] Backend health check: `https://your-api.onrender.com/health`
- [ ] Frontend loads correctly
- [ ] Can sign up new account
- [ ] Can log in
- [ ] Can create habits
- [ ] Can check in to habits
- [ ] Update CORS_ORIGIN if using custom domain

---

## Custom Domain (Optional)

### Vercel (Frontend)
1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as instructed

### Render (Backend)
1. Go to Service Settings → Custom Domain
2. Add your domain
3. Update DNS records as instructed
4. Update `CORS_ORIGIN` to include new domain

---

## Troubleshooting

### "CORS error"
- Ensure `CORS_ORIGIN` on backend includes your frontend URL
- Include the full URL with `https://`

### "Database connection failed"
- Check `DATABASE_URL` is correct
- Ensure database is running on Render/Railway

### "Prisma error"
- Run `npm run db:migrate:prod` manually if needed
- Check that schema matches PostgreSQL

### Slow initial load on Render free tier
- Free tier services spin down after inactivity
- First request after idle takes ~30 seconds
- Consider upgrading to paid tier for always-on

---

## Local Development After Deployment

To keep using SQLite locally while production uses PostgreSQL:

1. Keep `prisma/schema.prisma` as SQLite for local dev
2. Only use `schema.production.prisma` when deploying
3. Or use separate branches for dev/prod
