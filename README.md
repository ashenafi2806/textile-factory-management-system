# Textile Factory Management System (TFMS)

A comprehensive, web-based solution for managing the end-to-end operations of a textile factory, including production tracking, inventory management, workforce coordination, and quality control.

## Features

###  Authentication & Authorization
- Secure JWT-based authentication.
- Role-Based Access Control (RBAC) supporting **ADMIN, HR_ADMIN, MANAGER, SUPERVISOR, and WORKER**.
- Protected routes and dynamic UI rendering based on user roles.

### Workforce & Organization Management
- **Organizational Hierarchy**: Manage Departments (Production, Maintenance, QA, etc.) and Teams.
- **Worker Master Records**: Complete profile management for factory workers.
- **Shift Rotation Engine**: Automated shift scheduling using pattern-based modulo logic (Morning, Night, Off rotations).
- **Attendance Tracking**: Supervisor-led digital attendance logging with audit trails.
- **Leave Management**: Worker-initiated leave requests with multi-level approval workflows.
- **Workforce Analytics**: Real-time insights into worker availability and factory capacity.

## Tech Stack

### Backend
- **Framework**: NestJS (TypeScript)
- **ORM**: Prisma 7
- **Database**: MySQL / MariaDB
- **Caching**: Redis
- **Security**: Passport.js with JWT Strategy

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Design**: Premium Modern UI with focus on accessibility and responsiveness.

##  Getting Started

### What you need first
- Node.js (v18 or higher)
- Docker & Docker Compose
- MySQL / MariaDB instance

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/ashenafi2806/textile-factory-management-system.git
   ```
2. Set up environment variables:
   - Create `.env` in the `backend` directory based on `.env.example`.
3. Start the infrastructure:
   ```bash
   docker-compose up -d
   ```
4. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
5. Run migrations and seed:
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma db seed
   ```
6. Start development servers:
   ```bash
   # Backend
   npm run start:dev
   # Frontend
   npm run dev
   ```

## License
This project is licensed under the MIT License - see the LICENSE file for details.
