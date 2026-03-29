<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# 🎹 Learn Piano — Backend API

NestJS backend for the Learn Piano application. Supports user authentication, lesson management, quizzes with scoring, gamification (XP/level/streak/badges), and Stripe subscription payments.

---

## 🏗️ Project Structure

```
src/
├── auth/              # JWT auth, register, login
├── users/             # User profile
├── subscription/      # Stripe plans & payments
├── lessons/           # Lesson CRUD (admin) + access control
├── quiz/              # Quiz fetch & submission + scoring
├── progress/          # XP, level, streak, badges, leaderboard
├── database/          # Seed script
└── common/
    ├── decorators/    # @CurrentUser, @Roles
    ├── guards/        # RolesGuard, PremiumGuard
    └── filters/       # Global exception filter
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js ≥ 18
- Docker & Docker Compose (for PostgreSQL)

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env with your values
```

### 4. Start the database
```bash
npm run db:up
```

### 5. Run the server
```bash
npm run start:dev
```

### 6. Seed sample data (optional)
```bash
npm run seed
```

The API will be available at: `http://localhost:8000/api/v1`

---

## 📡 API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | ❌ | Register new user |
| POST | `/api/v1/auth/login` | ❌ | Login, returns JWT |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/users/me` | ✅ | Get current user profile |

### Subscription
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/subscription/plans` | ❌ | List all plans |
| POST | `/api/v1/subscription/upgrade` | ✅ | Upgrade to premium (Stripe) |
| DELETE | `/api/v1/subscription/cancel` | ✅ | Cancel subscription |

### Lessons
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/v1/lessons` | ✅ | any | List all lessons |
| GET | `/api/v1/lessons/:id` | ✅ | any | Get lesson detail |
| POST | `/api/v1/lessons` | ✅ | admin | Create lesson |
| PUT | `/api/v1/lessons/:id` | ✅ | admin | Update lesson |
| DELETE | `/api/v1/lessons/:id` | ✅ | admin | Delete lesson |

### Quiz
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/quiz/:lessonId` | ✅ | Get quiz for a lesson |
| POST | `/api/v1/quiz/:lessonId/submit` | ✅ | Submit answers, get score + XP |
| POST | `/api/v1/quiz` | ✅ admin | Create quiz |

### Progress
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/progress` | ✅ | Get user XP/level/streak/badges |
| GET | `/api/v1/progress/leaderboard` | ✅ | Top 50 users by XP |
| POST | `/api/v1/progress/lessons/:lessonId/complete` | ✅ | Complete theory lesson + award XP |

---

## 🎮 Gamification Rules

### XP & Level
```
level = Math.floor(xp / 100)
```
- Complete quiz (≥60%): `+xpReward × (percentage/100)`
- Complete theory lesson (first time only): `+xpReward`

### Streak
- Same day → no change
- Consecutive day → `streak + 1`
- Gap > 1 day → `streak = 1`

### Badges
| Badge | Condition |
|-------|-----------|
| Beginner | Complete 1 lesson |
| Intermediate | Complete 10 lessons |
| Expert | Complete 50 lessons |
| Streak 7 | 7-day streak |
| Streak 30 | 30-day streak |

---

## ⚙️ Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8000` |
| `FRONTEND_URLS` | Comma-separated list of allowed frontend origins for CORS | `http://localhost:3000,http://localhost:3001` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | DB username | `postgres` |
| `DB_PASSWORD` | DB password | `postgres` |
| `DB_DATABASE` | DB name | `learn_piano` |
| `JWT_SECRET` | JWT signing secret | — |
| `JWT_EXPIRES_IN` | JWT expiry | `7d` |
| `STRIPE_SECRET_KEY` | Stripe secret key | — |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | — |
| `STRIPE_PREMIUM_PRICE_ID` | Stripe Price ID for premium plan | — |

---

## 🧪 Example Requests

### Register
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Password123","name":"Test User"}'
```

### Submit Quiz
```bash
curl -X POST http://localhost:8000/api/v1/quiz/<lessonId>/submit \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"answers":[{"questionId":"q1","answer":"8"},{"questionId":"q2","answer":"C"}]}'
```
