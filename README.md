# SMHCSS - Student Mental Health Counseling Support System

A comprehensive web application built with Next.js, TypeScript, and MySQL for managing student mental health counseling services in educational institutions.

## 🚀 Features

### For Students
- **User Registration & Login**: Secure authentication with role-based access
- **Appointment Booking**: Schedule sessions with available counselors
- **Dashboard**: View appointments, notifications, and mental health resources
- **Resource Access**: Browse mental health materials and educational content
- **Feedback System**: Rate and provide feedback on counseling sessions

### For Counselors
- **Professional Dashboard**: Manage appointments and availability
- **Appointment Management**: Accept/reject appointment requests  
- **Session Notes**: Maintain detailed session records
- **Mental Health Records**: Track student progress and treatment plans
- **Resource Sharing**: Upload and share mental health resources

### For Administrators
- **System Overview**: Monitor system statistics and user activity
- **User Management**: Manage student and counselor accounts
- **Resource Management**: Upload and organize system-wide resources
- **Notification System**: Send system-wide announcements
- **Reports & Analytics**: Generate insights on system usage

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: MySQL
- **Authentication**: Custom JWT-based authentication
- **API**: RESTful API with Next.js API Routes

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- Node.js (v18 or higher)
- npm or yarn
- MySQL Server (v8.0 or higher)

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

1. **Create MySQL Database**:
   - Start your MySQL server
   - Create a new database named `smhcss_db`

2. **Configure Database Connection**:
   - Update the database configuration in `.env.local`:
   ```
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=smhcss_db
   ```

3. **Initialize Database**:
   ```bash
   node lib/db.js
   ```
   This will create all necessary tables and insert sample data.

### 3. Environment Variables

Update the `.env.local` file with your database credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=smhcss_db

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# JWT Secret
JWT_SECRET=your-jwt-secret-key-here
```

### 4. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## 🔐 Default Login Credentials

After running the database initialization, you can use these default credentials:

**Admin Account**:
- Email: admin@smhcss.edu
- Password: admin123

## 📊 Database Schema

### Core Tables
- **STUDENT**: Student information and profiles
- **COUNSELOR**: Counselor profiles and specializations
- **ADMIN**: System administrator accounts
- **APPOINTMENT**: Appointment scheduling and management
- **SESSION**: Counseling session records
- **MENTAL_HEALTH_RECORD**: Student mental health tracking
- **FEEDBACK**: Session feedback and ratings
- **RESOURCE**: Educational and mental health resources
- **NOTIFICATION**: System notifications

## 🎨 Features Implemented

- ✅ Complete authentication system with role-based access
- ✅ Student dashboard with appointment booking
- ✅ Counselor dashboard with appointment management
- ✅ Admin dashboard with system overview
- ✅ Responsive design for all screen sizes
- ✅ Database schema with all required tables
- ✅ API endpoints for all major functionalities

## 🧪 Testing the Application

1. **Student Flow**:
   - Register as a student with department selection
   - Login and access student dashboard
   - Book appointments with available counselors
   - View notifications and resources

2. **Counselor Flow**:
   - Register as a counselor with specialization
   - Login and access counselor dashboard
   - Manage availability status
   - Accept/reject appointment requests

3. **Admin Flow**:
   - Login with admin credentials
   - View system statistics
   - Monitor user activities
   - Access management features

## 📱 Mobile Responsiveness

The application is fully responsive and optimized for:
- Desktop (1024px and above)
- Tablet (768px - 1023px)  
- Mobile (320px - 767px)

## 🔧 API Endpoints

- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET/POST /api/appointments` - Appointment management
- `GET /api/counselors/available` - Available counselors
- `GET /api/notifications` - User notifications
- `GET /api/departments` - Academic departments
- `GET /api/specializations` - Counseling specializations

---

**Note**: This is a comprehensive mental health counseling management system designed for educational institutions. Ensure proper database setup before running the application.
