# Goals

an app for managing personal and professional goals with AI-powered insights and automated tracking capabilities.

## 🏗️ Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                       │
├─────────────────────────────────────────────────────────────────┤
                                │
                                │ API Calls
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backend (Node.js)                        │
├─────────────────────────────────────────────────────────────────┤
                                │
                                │ Database Queries
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                        │
├─────────────────────────────────────────────────────────────────┤
```

## 🤖 AI Design & Integration

### AI-Powered Features

2. **Progress Predictions**: AI models predict goal completion likelihood based on historical data
3. **Action Suggestions**: Intelligent task breakdown and scheduling recommendations

## 🔄 CI/CD Pipeline

### Backend CI/CD (`backend-ci.yml`)

```yaml
Triggers:
  - Push to main/develop branches
  - Pull requests affecting backend code

Jobs: 1. TypeScript Compilation Check
  2. Dependency Installation & Caching
  3. Application Build
  4. PostgreSQL Service Setup
  5. Server Startup & Health Check Test
  6. Cleanup & Resource Management
```

### Frontend CI/CD (`frontend-ci.yml`)

```yaml
Triggers:
  - Push to main/develop branches
  - Pull requests affecting frontend code

Jobs: 1. ESLint Code Quality Check
  2. TypeScript Type Checking
  3. Application Build with Turbopack
  4. Build Artifact Verification
  5. Output Integrity Testing
```

### Deployment Strategy

- **Blue-Green Deployment**: Zero-downtime deployments
- **Feature Flags**: Gradual feature rollouts
- **Rollback Capability**: Quick reversion to previous versions
- **Health Checks**: Automated verification post-deployment

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Yarn package manager

### Backend Setup

```bash
cd backend
cp .env.example .env
# Configure database connection in .env
yarn install
yarn build
yarn start
```

### Frontend Setup

```bash
cd frontend
yarn install
yarn dev
```

### Running Tests

```bash
# Backend health check test
cd backend && yarn test

# Frontend linting and build verification
cd frontend && yarn lint && yarn build
```

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Goal Management

- `GET /api/goals` - List user goals
- `POST /api/goals` - Create new goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal

### Action Management

- `GET /api/goals/:goalId/actions` - List goal actions
- `POST /api/goals/:goalId/actions` - Create action
- `PUT /api/goals/:goalId/actions/:id` - Update action
- `DELETE /api/goals/:goalId/actions/:id` - Delete action

## 🔒 Security Considerations

- JWT-based authentication with refresh tokens
- Input validation using class-validator
- SQL injection prevention through parameterized queries
- Secure password hashing with bcrypt

## 🎯 Drift Detection & Goal Status

The system includes intelligent goal tracking with automatic status computation based on progress and deadlines.

### Drift Detection Algorithm

Located in `backend/src/utils/drift.ts`, the `computeGoalStatus` function automatically determines goal status:

```typescript
function computeGoalStatus(
  currentValue: number,
  targetValue: number,
  dueDate: Date
): GoalStatus;
```

**Status Logic:**

- **ON_TRACK**: Progress ratio ≥ 0.8 (80% or better)
- **AT_RISK**: Progress ratio 0.5-0.8 (50-80%)
- **OFF_TRACK**: Progress ratio < 0.5 (under 50%) OR past due date

**Implementation:**

- Automatically updates when goal progress is reported
- Used in goal update endpoints to maintain accurate status
- Powers dashboard statistics
- Helps users identify goals needing attention

### Goal Progress Tracking

- **Numeric Progress**: Goals track `current_value` vs `target_value`
- **Automatic Status Updates**: Status recalculates on each progress update
- **Historical Tracking**: `GoalUpdates` entity maintains progress history
- **Dashboard Integration**: Real-time statistics show goal distribution

## 📊 Performance Optimization

- Database indexing on frequently queried fields
- Connection pooling for database connections
- Image optimization with Next.js Image component
- Lazy loading for non-critical components

## 📈 Monitoring & Observability

- Health check endpoints for service status
- Error tracking and alerting
- Business metrics dashboard
- Infrastructure monitoring

---
