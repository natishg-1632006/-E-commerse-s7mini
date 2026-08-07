# 🎨 Natish E-Commerce Platform - Frontend Web Application

> A modern, responsive, high-performance e-commerce frontend web application built with **React 19**, **TypeScript**, **Vite**, **TailwindCSS v4**, **Redux Toolkit**, **React Query**, **Framer Motion**, and deployed to **AWS S3** (`natish-frontend`) with **AWS CloudFront CDN** distribution (`E2SYELFR9Q7KYR`).

---

## 🚀 Key Features & Highlights

* **Modern Stack**: Built with React 19, TypeScript, and Vite for lightning-fast HMR and bundle optimization.
* **State Management**: Dual-layer architecture combining **Redux Toolkit** (global user, cart, wishlist state) and **TanStack React Query** (server-state caching and async invalidation).
* **UI & Aesthetics**: Styled with TailwindCSS v4, Lucide React icons, Framer Motion micro-animations, dynamic glassmorphism UI components, and fully responsive layouts.
* **Form Validation**: Type-safe forms powered by **React Hook Form** and **Zod** schema resolvers.
* **Global CDN Hosting**: Hosted on AWS S3 (`natish-frontend`) and distributed globally via CloudFront CDN (`d222r50ryi3b71.cloudfront.net`) with custom SPA routing rules (403/404 $\rightarrow$ `/index.html` HTTP 200).

---

## 🛠️ Technology Stack

| Layer | Technology | Usage |
| :--- | :--- | :--- |
| **Core Framework** | React 19 + TypeScript | UI component architecture & type safety |
| **Build Tool** | Vite | Lightning-fast development & bundling |
| **Styling** | TailwindCSS v4 + Framer Motion | Modern styling & micro-animations |
| **State Management**| Redux Toolkit + React Query | App state & API server-state caching |
| **HTTP Client** | Axios | Interacting with backend API Gateway routes |
| **Form Handling** | React Hook Form + Zod | Form state & runtime schema validation |
| **Notifications** | React Hot Toast | Real-time user feedback toasts |
| **Hosting & CDN** | AWS S3 + AWS CloudFront CDN | Static web hosting & global distribution |

---

## 📂 Frontend Directory Structure

```text
e-com_frontend/
├── public/                     # Static assets (images, favicon)
├── src/
│   ├── assets/                 # Icons and media files
│   ├── components/             # Reusable UI components (Navbar, Footer, ProductCard, CartModal)
│   ├── context/                # Context providers
│   ├── hooks/                  # Custom React hooks (useCart, useProducts, useAuth)
│   ├── pages/                  # Page views (Home, Products, ProductDetail, Cart, Checkout, Orders, Auth)
│   ├── routes/                 # App routing configuration (React Router DOM v7)
│   ├── services/               # Axios API client modules connecting to API Gateway
│   ├── store/                  # Redux Toolkit slices (authSlice, cartSlice, wishlistSlice)
│   ├── types/                  # TypeScript interface and type definitions
│   ├── App.tsx                 # Main App component
│   └── main.tsx                # Entry point mounting React DOM
├── index.html                  # HTML entry point
├── vite.config.ts              # Vite compiler and plugin config
├── tsconfig.json               # TypeScript compiler options
└── package.json                # Project dependencies and scripts
```

---

## 🔄 End-to-End User Experience Flow

```text
1. User Landing & Browsing
   [Home Page] ──> [Product Catalog Page] ──> [Product Detail View]

2. User Authentication (Cognito Integration)
   [Sign Up / Login Form] ──> [AWS Cognito Auth] ──> [JWT Token Saved in LocalStorage / Redux]

3. Cart Management & Checkout
   [Add Item to Cart] ──> [Cart Drawer / Page] ──> [Proceed to Checkout]

4. Order Confirmation & Payment
   [Shipping Details Form] ──> [Select Payment Method] ──> [Order Placed Toast] ──> [Order History Page]
```

---

## 🌐 AWS CloudFront & S3 Deployment Configuration

* **S3 Hosting Bucket**: `natish-frontend`
* **CloudFront Distribution ID**: `E2SYELFR9Q7KYR`
* **CloudFront Domain**: `d222r50ryi3b71.cloudfront.net`
* **Single Page Application (SPA) Routing**:
  To prevent 404 errors when users refresh deep URLs like `/products` or `/cart`, CloudFront is configured with custom error pages redirecting HTTP `403` and `404` status codes to `/index.html` with an HTTP `200 OK` status code.

---

## 💻 Local Setup & Development Commands

### 1. Install Dependencies
```bash
cd e-com_frontend
npm install
```

### 2. Configure Environment Variables (`.env`)
Create a `.env` file in `e-com_frontend`:
```env
VITE_API_BASE_URL=https://<api-gateway-id>.execute-api.ap-southeast-1.amazonaws.com/prod/api/v1
VITE_COGNITO_USER_POOL_ID=ap-southeast-1_XXXXX
VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 3. Run Local Development Server
```bash
npm run dev
# App will start at http://localhost:5173
```

### 4. Build for Production Deployment
```bash
npm run build
# Compiles TypeScript and builds optimized static assets into dist/
```
