# Full-Stack Portfolio Application

This project is organized into two independent directories:
- **`client/`**: Frontend (React 19, Tailwind CSS, Lucide Icons, Motion, Vite)
- **`server/`**: Backend (Node.js, Express, MongoDB Atlas, Mongoose, JWT Auth)

---

## 💻 Local Development

Run both frontend and backend concurrently from the project root:
```bash
npm run dev
```
- **Frontend (Client):** http://localhost:3000
- **Backend (API):** http://localhost:5000/api
- **Admin Panel:** http://localhost:3000/#/admin/login

---

## 🚀 Deployment Guide

### 1. Backend Deployment on Render (Web Service)
1. In Render, select **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add the following **Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGODB_URI`: `mongodb+srv://skmahammadnurhosen1_db_user:A20tbWPmDhaAstFF@cluster0.t43fvzd.mongodb.net/portfolio?retryWrites=true&w=majority&appName=Cluster0`
   - `JWT_SECRET`: `noor_portfolio_super_jwt_secret_key_2026_secure`
   - `ADMIN_EMAIL`: `skmahammadnurhosen1@gmail.com`
   - `ADMIN_INITIAL_PASSWORD`: `NOORNORAHOSEN`
5. Click **Create Web Service**. Note the deployed URL (e.g. `https://your-backend.onrender.com`).

*Note: In MongoDB Atlas -> Network Access -> IP Access List, make sure to allow `0.0.0.0/0` so Render can connect.*

---

### 2. Frontend Deployment on Netlify
1. In Netlify, select **Add new site** -> **Import an existing project** (or drag and drop `client/dist`).
2. If connecting from Git:
   - **Base directory:** `client`
   - **Build command:** `npm run build`
   - **Publish directory:** `client/dist`
3. In **Environment variables**, set:
   - `VITE_API_URL`: `https://your-backend.onrender.com/api` (Replace with your actual Render URL)
4. Deploy! Netlify will build the client and communicate with your Render backend.
