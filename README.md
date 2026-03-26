# Birdman of Chennai — Visitor Booking System

A free, multilingual booking system for Mr. Sudarson Sah's "Birdman of Chennai" initiative, enabling visitors to schedule visits to his home in Chennai, India.

---

## 🎯 Project Overview

**Mission:** Help Mr. Sudarson Sah share his extraordinary life story with visitors while maintaining a peaceful, organized experience through scheduled bookings.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Supabase PostgreSQL, Drizzle ORM

**Cost:** $0/month (100% free-tier infrastructure)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ and npm 10+
- Supabase account (free)
- Git

### Setup Instructions

1. **Clone and Install**
   ```powershell
   git clone https://github.com/your-org/birdman.git
   cd birdman
   npm install
   ```

2. **Configure Environment**
   ```powershell
   copy .env.local.example .env.local
   # Fill in your Supabase credentials
   ```

3. **Push Database Schema**
   ```powershell
   npm run db:push
   ```

4. **Start Development Server**
   ```powershell
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see the application.

**Need detailed setup help?** See [docs/QUICK-START.md](./docs/QUICK-START.md)

---

## 📚 Documentation

### Design Documentation
| Document | Description |
|---|---|
| [🎨 DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) | Global design system, colors, typography, animations |
| [🏠 HOMEPAGE-WIREFRAME.md](./HOMEPAGE-WIREFRAME.md) | Complete homepage wireframe and specifications |
| [🎨 HOMEPAGE-DESIGN-TOKENS.md](./HOMEPAGE-DESIGN-TOKENS.md) | Implementation-ready Tailwind CSS tokens |
| [📐 HOMEPAGE-VISUAL-SPECS.md](./HOMEPAGE-VISUAL-SPECS.md) | Exact measurements and pixel-perfect specs |
| [🚀 SPRINT-1-SUMMARY.md](./SPRINT-1-SUMMARY.md) | Sprint 1 deliverables and implementation roadmap |
| [📦 COMPONENT-GUIDE.md](./COMPONENT-GUIDE.md) | UI component usage and patterns |

### Technical Documentation
| Document | Description |
|---|---|
| [QUICK-START.md](./docs/QUICK-START.md) | Local development setup guide |
| [INFRASTRUCTURE-OVERVIEW.md](./docs/INFRASTRUCTURE-OVERVIEW.md) | Architecture and technology decisions |
| [INFRASTRUCTURE.md](./docs/INFRASTRUCTURE.md) | Detailed infrastructure setup (Supabase, Resend, etc.) |
| [DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Vercel deployment checklist and troubleshooting |
| [SECURITY.md](./docs/SECURITY.md) | Security best practices and implementation |
| [DATABASE.md](./DATABASE.md) | Database schema and relationships |

---

## 🌟 Features

### MVP (Sprint 1-3)
- ✅ Session-based booking system (morning/evening slots)
- ✅ Bilingual UI (English + Tamil)
- ✅ Email confirmations via Resend
- ✅ Daily reminder emails (10 AM IST)
- ✅ Admin dashboard for session management
- ✅ Visitor rules and guidelines display
- ✅ Mobile-responsive design

### Future Enhancements
- 📸 Visitor photo gallery (Vercel Blob storage)
- ⭐ Post-visit feedback system
- 💰 Optional donation tracking
- 📊 Analytics dashboard
- 🔔 WhatsApp notifications (Twilio)

---

## 🏗️ Infrastructure (Zero-Cost)

| Service | Purpose | Free Tier |
|---|---|---|
| **Vercel** | Hosting, Edge Functions | 100 GB bandwidth/month |
| **Supabase** | PostgreSQL Database | 500 MB, 2 GB bandwidth/month |
| **Resend** | Email Service | 3,000 emails/month |
| **Vercel Blob** | Image Storage | 10 GB storage |
| **GitHub Actions** | CI/CD Pipeline | 2,000 minutes/month |

**Total Monthly Cost:** $0 (supports 1000-1500 bookings/month)

See [docs/INFRASTRUCTURE-OVERVIEW.md](./docs/INFRASTRUCTURE-OVERVIEW.md) for details.

---

## 🗂️ Project Structure

```
birdman/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components (Atomic Design)
│   │   ├── atoms/        # Button, Input, Label, etc.
│   │   ├── molecules/    # DatePicker, FormField, etc.
│   │   ├── organisms/    # BookingForm, SessionList, etc.
│   │   └── templates/    # Page layouts
│   ├── lib/
│   │   ├── db/          # Drizzle ORM schema and migrations
│   │   ├── supabase/    # Supabase client configuration
│   │   └── validations/ # Zod schemas for input validation
├── docs/                # Documentation
├── public/              # Static assets
├── .env.local.example   # Environment variables template
├── vercel.json          # Vercel configuration (cron, headers)
└── drizzle.config.ts    # Database configuration
```

---

## 🛠️ Development Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate database migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio (database GUI) |

---

## 🔐 Security

This project follows industry-standard security practices:

- ✅ All secrets stored in `.env.local` (gitignored)
- ✅ API routes protected with JWT authentication
- ✅ Cron endpoints protected with `CRON_SECRET`
- ✅ Rate limiting on booking endpoints
- ✅ Input validation with Zod
- ✅ Security headers (CSP, X-Frame-Options, etc.)
- ✅ Row-Level Security (RLS) in Supabase

See [docs/SECURITY.md](./docs/SECURITY.md) for detailed practices.

---

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```powershell
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import repository
   - Add environment variables
   - Deploy!

**Detailed guide:** [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

---

## 🌍 Internationalization (i18n)

Supported languages:
- 🇬🇧 **English** (en) — Default
- 🇮🇳 **Tamil** (ta) — For local Chennai visitors

Translation files: `src/i18n/`

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -m 'feat: add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Mr. Sudarson Sah** — The Birdman of Chennai
- **Vercel** — Free hosting and edge infrastructure
- **Supabase** — Free PostgreSQL database
- **Resend** — Free email service

---

## 📞 Support

- **Documentation Issues:** Open a GitHub issue
- **Setup Help:** See [docs/QUICK-START.md](./docs/QUICK-START.md)
- **Security Concerns:** See [docs/SECURITY.md](./docs/SECURITY.md)

---

**Built with ❤️ for the Birdman of Chennai**
