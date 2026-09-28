# Vercel Setup Instructions - Step by Step

## 🎯 Your Neon Database Connection String
```
postgresql://USER:PASSWORD@YOUR-NEON-HOST/neondb?sslmode=require&channel_binding=require
```

---

## 📋 PART 1: Set Up Neon Database (Do This FIRST)

### Step 1: Create Local .env File

In your project root, create a `.env` file with:

```env
DATABASE_URL="postgresql://USER:PASSWORD@YOUR-NEON-HOST/neondb?sslmode=require&channel_binding=require"
```

### Step 2: Run Database Migrations

Open your terminal in the project folder and run:

```bash
# Deploy the database schema to Neon
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

**Expected Output:**
```
✓ Prisma Migrate applied the following migration(s):
  - 20240101000000_init
  - 20240102000000_add_interests
  - [etc...]
```

### Step 3: Verify Database Setup

Check your Neon dashboard:
1. Go to https://console.neon.tech
2. Select your project
3. Click "Tables" - you should see all tables created:
   - User
   - Post
   - Message
   - Group
   - HelpRequest
   - LocalService
   - WellbeingResource
   - Alert
   - Connection
   - etc.

---

## 🚀 PART 2: Deploy to Vercel

### Step 1: Go to Vercel

1. Visit: https://vercel.com/new
2. Sign in with GitHub

### Step 2: Import Repository

1. Click **"Import Git Repository"**
2. Find: `kevin21quirk/burton-latimer-community`
3. Click **"Import"**

### Step 3: Configure Project

**Project Name:**
- Enter: `burton-latimer-community` (or your preferred name)
- This will be your URL: `https://burton-latimer-community.vercel.app`

**Framework Preset:**
- ✅ Should auto-detect as **Next.js**
- Leave as is

**Root Directory:**
- ✅ Leave blank (use root)

### Step 4: Add Environment Variables

Click **"Environment Variables"** section and add these **3 variables**:

#### Variable 1: DATABASE_URL
- **Name:** `DATABASE_URL`
- **Value:** 
  ```
  postgresql://USER:PASSWORD@YOUR-NEON-HOST/neondb?sslmode=require&channel_binding=require
  ```
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

#### Variable 2: NEXTAUTH_SECRET
- **Name:** `NEXTAUTH_SECRET`
- **Value:** Generate one by running this command locally:
  ```bash
  openssl rand -base64 32
  ```
  Copy the output (should be ~44 characters)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

#### Variable 3: NEXTAUTH_URL
- **Name:** `NEXTAUTH_URL`
- **Value:** `https://burton-latimer-community.vercel.app`
  (or whatever project name you chose)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait 2-5 minutes for build to complete
3. You'll see "Congratulations!" when done

---

## ✅ PART 3: Post-Deployment Setup

### Step 1: Visit Your Site

Go to: `https://burton-latimer-community.vercel.app`

You should see the login/register page.

### Step 2: Create Your Admin Account

**Option A: Register then Promote (Recommended)**

1. Click "Register" on your deployed site
2. Fill out the form with your details
3. Complete registration
4. Go to Neon.tech dashboard
5. Click **"SQL Editor"**
6. Run this query (replace with your email):

```sql
UPDATE "User" 
SET "isAdmin" = true 
WHERE email = 'your-email@example.com';
```

7. Refresh your site and navigate to `/admin`
8. You should now have admin access!

**Option B: Create Admin Directly**

1. Go to Neon.tech SQL Editor
2. First, hash your password locally:
   ```bash
   node -e "console.log(require('bcryptjs').hashSync('YourPassword123', 10))"
   ```
3. Run this SQL (replace values):

```sql
INSERT INTO "User" (
  id, 
  email, 
  password, 
  "firstName", 
  "lastName", 
  "accountType", 
  city, 
  "isAdmin", 
  "gdprConsent", 
  "marketingConsent",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  'admin@burtonlatimer.com',
  '$2a$10$YourHashedPasswordFromStep2',
  'Admin',
  'User',
  'INDIVIDUAL',
  'Burton Latimer',
  true,
  true,
  false,
  NOW(),
  NOW()
);
```

---

## 🔍 Verification Checklist

After deployment, verify everything works:

- [ ] Site loads at Vercel URL
- [ ] Can register new account
- [ ] Can login with credentials
- [ ] Dashboard loads
- [ ] Messages page works
- [ ] Search in messages works (type single letter)
- [ ] Admin can access `/admin` page
- [ ] Help requests can be created
- [ ] Groups can be created
- [ ] Posts can be created

---

## 🔄 Future Updates

To deploy changes in the future:

1. Make changes locally
2. Test locally with `npm run dev`
3. Commit: `git add . && git commit -m "Description"`
4. Push: `git push origin master`
5. Vercel automatically deploys! ✨

---

## 🆘 Troubleshooting

### Build Fails with Prisma Error

**Error:** "Cannot find module '@prisma/client'"

**Fix:** Add to `package.json` scripts:
```json
"postinstall": "prisma generate"
```
Then redeploy.

### Can't Connect to Database

**Error:** "Can't reach database server"

**Fix:**
1. Verify DATABASE_URL in Vercel environment variables
2. Check Neon project is active (not paused)
3. Ensure connection string includes `&channel_binding=require`

### Authentication Not Working

**Error:** "Invalid session"

**Fix:**
1. Verify NEXTAUTH_SECRET is set in Vercel
2. Verify NEXTAUTH_URL matches your Vercel domain exactly
3. Redeploy after adding/changing variables

### Admin Page Shows 403

**Fix:**
1. Verify your user has `isAdmin = true` in database
2. Check Neon SQL Editor:
   ```sql
   SELECT email, "isAdmin" FROM "User" WHERE email = 'your-email@example.com';
   ```
3. If false, run the UPDATE query from Step 2 above

---

## 📞 Need Help?

Check:
1. Vercel deployment logs (click on deployment → "Building" tab)
2. Vercel function logs (click on deployment → "Functions" tab)
3. Browser console (F12) for client errors
4. Neon query logs in dashboard

---

**Setup Date:** February 22, 2026
**Repository:** https://github.com/kevin21quirk/burton-latimer-community
**Database:** Neon.tech (EU West 2)
**Hosting:** Vercel
