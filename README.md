# HivonBlog — Full-Stack Blogging Platform

A full-stack blogging platform built with **Next.js 14**, **Supabase**, and **Google Gemini AI** for the Hivon Automations internship assignment.

---

## 🌐 Live Demo
**Deployed URL:** `https://your-deployment-url.vercel.app`
**GitHub Repo:** `https://github.com/your-username/hivon-blog-platform`

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend + Backend | Next.js 14 (App Router) |
| Authentication | Supabase Auth |
| Database | Supabase (PostgreSQL) |
| File Storage | Supabase Storage |
| AI Integration | Google Gemini 1.5 Flash API |
| Styling | Tailwind CSS |
| Deployment | Vercel |
| Version Control | Git + GitHub |

---

## ✨ Features

- **Three user roles** — Viewer, Author, Admin with enforced permissions
- **Blog posts** — Create, edit, view with featured images
- **AI Summaries** — Auto-generated ~200-word summaries via Gemini on post creation
- **Comments** — Authenticated users can comment; owners and admins can delete
- **Search** — Real-time title search on the home page
- **Pagination** — 6 posts per page with smart pagination
- **Admin Dashboard** — Manage all posts, comments, and user roles
- **Image Upload** — Upload images to Supabase Storage or paste a URL
- **Responsive Design** — Mobile-friendly across all screen sizes

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) account (free)
- A [Google AI Studio](https://aistudio.google.com/app/apikey) API key (free)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/hivon-blog-platform.git
cd hivon-blog-platform
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the entire contents of `supabase/schema.sql`
3. This creates: `users`, `posts`, `comments` tables + RLS policies + auth trigger + storage bucket
4. In **Authentication → Settings**, optionally disable email confirmation for easier local testing

### 4. Configure environment variables
```bash
cp .env.local.example .env.local
```
Edit `.env.local` and fill in your values:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GOOGLE_AI_API_KEY=your-gemini-api-key
```
Find Supabase keys at: **Project Settings → API**

### 5. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 6. Create your first Admin user
1. Register an account normally through the UI
2. In Supabase → **Table Editor → users**, find your row and change `role` to `admin`
3. Sign out and sign back in — you now have full admin access

---

## 🏗 Project Structure

```
blog-platform/
├── app/
│   ├── page.jsx                    # Home — post listing, search, pagination
│   ├── login/page.jsx              # Login
│   ├── register/page.jsx           # Register with role selection
│   ├── create-post/page.jsx        # Create post (Author/Admin only)
│   ├── admin/page.jsx              # Admin dashboard
│   ├── posts/
│   │   └── [id]/
│   │       ├── page.jsx            # Post detail + comments
│   │       └── edit/page.jsx       # Edit post (Author/Admin only)
│   └── api/
│       ├── posts/route.js          # GET all posts, POST new
│       ├── posts/[id]/route.js     # GET, PUT, DELETE single post
│       ├── comments/route.js       # GET + POST comments
│       └── generate-summary/route.js  # Gemini AI summary
├── components/
│   ├── Navbar.jsx
│   ├── PostCard.jsx
│   ├── CommentSection.jsx
│   ├── SearchBar.jsx
│   └── Pagination.jsx
├── lib/
│   ├── supabase.js                 # Browser client
│   └── supabase-server.js          # Server client (SSR)
├── supabase/
│   └── schema.sql                  # Full DB schema + RLS + trigger
├── middleware.js                   # Route protection
└── .env.local.example
```

---

## 📦 Deployment (Vercel)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your GitHub repo
3. Add Environment Variables (same 3 as in `.env.local`)
4. Click **Deploy** — Vercel auto-detects Next.js, no extra config needed

---

## 📋 Submission Explanation

### 1. AI Tool Used — **Cursor**
I used **Cursor** as my primary AI coding assistant. I chose it because:
- It has deep context awareness of the entire codebase, making it ideal for a multi-file project like this
- Its inline `Cmd+K` editing lets you describe a change in plain English and apply it in seconds
- It understands Next.js App Router conventions natively, reducing boilerplate mistakes
- It helped scaffold repetitive patterns (like similar API routes and form pages) very quickly

Cursor helped me: generate the initial Supabase schema, write RLS policies, scaffold the API routes, and debug a cookie-handling issue in the Supabase SSR client (explained below).

---

### 2. Feature Logic

#### Authentication Flow
1. User submits the register form → `supabase.auth.signUp()` is called
2. Supabase creates a row in `auth.users`
3. A **database trigger** (`handle_new_user`) automatically inserts a matching row into `public.users` with the name, email, and role from `raw_user_meta_data`
4. On login, `supabase.auth.signInWithPassword()` returns a session stored in cookies
5. The `middleware.js` runs on every request, validates the session via `supabase.auth.getUser()`, and redirects unauthenticated users away from protected routes

#### Role-Based Access
| Role | Permissions |
|---|---|
| **Viewer** | Read posts, read summaries, comment |
| **Author** | All Viewer permissions + create posts + edit own posts |
| **Admin** | All permissions + edit/delete any post + delete any comment + change user roles |

Enforcement happens at three layers:
- **UI** — Navbar and buttons conditionally render based on role
- **Client pages** — Each protected page checks role on mount and redirects if unauthorised
- **Database** — Supabase RLS policies are the final enforcement layer, rejecting invalid writes even if the UI is bypassed

#### Post Creation Logic
1. Author fills in title, body, and optionally an image (file upload or URL)
2. If a file is uploaded → it goes to Supabase Storage → a public URL is returned
3. `/api/generate-summary` is called with title + body
4. The post is inserted into `posts` table with the generated summary stored in the `summary` column
5. User is redirected to the new post's page

#### AI Summary Generation Flow
1. The client calls `POST /api/generate-summary` with `{ title, body }`
2. The server-side route truncates the body to 3000 characters (cost optimisation)
3. It calls the **Gemini 1.5 Flash** API (free tier) with a prompt requesting a ~200-word summary
4. `maxOutputTokens: 300` caps the output (another cost-optimisation measure)
5. The summary text is returned and stored in the `posts.summary` column
6. The summary is **never regenerated** — it is displayed from the database on every page load

---

### 3. Cost Optimisation

| Strategy | How It Works |
|---|---|
| **Generate once, store forever** | Summary is generated only at post creation time and stored in `posts.summary`. Re-reading the post never calls the API. |
| **Input truncation** | Post body is capped at 3000 characters before sending to Gemini, reducing input token count. |
| **Output cap** | `maxOutputTokens: 300` prevents unexpectedly long (and expensive) responses. |
| **Graceful degradation** | If the Gemini API call fails (network error, quota exceeded), the post is still created with an empty summary — no API retry loop. |
| **Flash model** | Using `gemini-1.5-flash` instead of `gemini-1.5-pro` — 10–15× cheaper per token with similar summarisation quality. |

---

### 4. Development Understanding

#### Bug Encountered — Supabase SSR Cookie Handling
**Problem:** After logging in, protected pages would briefly flash and redirect to `/login` even though the user was authenticated. The session was being set in cookies but the server-side Supabase client wasn't reading it correctly.

**Root Cause:** I was using the browser Supabase client (`createBrowserClient`) in Server Components, which can't access HTTP cookies. This meant `getUser()` always returned `null` on the server.

**Fix:** I created a separate `lib/supabase-server.js` using `@supabase/ssr`'s `createServerClient` with a proper cookie adapter that reads from Next.js's `cookies()` function. The browser client is only used in `'use client'` components; the server client is used in API routes and middleware.

#### Key Architectural Decisions

**1. Client-side data fetching on most pages:** Instead of Server Components + `fetch`, I used `'use client'` pages with the Supabase browser SDK. This gives instant interactivity (no page reload needed for auth state) and makes role-checking straightforward.

**2. Trigger-based profile creation:** Rather than manually inserting into `public.users` after signup, a PostgreSQL trigger does it automatically. This prevents the race condition where a user exists in `auth.users` but not in `public.users`, which would break any query joining on user data.

**3. RLS as the security foundation:** All business logic in the UI is for UX only. The real access control lives in Supabase Row Level Security policies, which reject unauthorised database operations at the database level regardless of how the app is called.

**4. Summary stored as plain text:** Summaries are stored as a `TEXT` column rather than a JSON blob or separate table. Since the summary is a single string with no structure needed, this keeps queries simple and avoids unnecessary joins.
