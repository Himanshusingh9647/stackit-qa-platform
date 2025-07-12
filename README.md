# StackIt - Real-Time Q&A Forum Platform

A modern, real-time Q&A platform built with React, Node.js, and Socket.IO. Ask questions, get answers, and engage with a community of developers in real-time.

## ✨ Features

- **User Authentication** - Secure email/password registration and login
- **Real-time Updates** - Live answers, votes, and question updates using WebSockets
- **Rich Question System** - Ask questions with detailed descriptions and tags
- **Voting System** - Upvote and downvote questions and answers
- **Tag-based Organization** - Categorize questions with custom tags
- **Search Functionality** - Find questions by keywords and tags
- **Admin Moderation** - Admin tools for content moderation
- **Responsive Design** - Works seamlessly on desktop and mobile devices

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **TailwindCSS** for styling
- **React Router** for navigation
- **React Hook Form** with Yup validation
- **Socket.IO Client** for real-time features
- **Axios** for API calls
- **React Hot Toast** for notifications
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **Socket.IO** for real-time communication
- **Prisma ORM** with PostgreSQL
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express Validator** for input validation

## 📁 Project Structure

```
├── frontend/                 # React TypeScript application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # React contexts (Auth)
│   │   ├── pages/           # Page components
│   │   ├── types/           # TypeScript type definitions
│   │   ├── utils/           # Utility functions (API, Socket)
│   │   └── App.tsx          # Main app component
│   ├── package.json
│   └── tailwind.config.js
├── backend/                  # Node.js Express API
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── routes/              # API route handlers
│   ├── middleware/          # Express middleware
│   ├── lib/                 # Database connection
│   ├── package.json
│   └── index.js             # Server entry point
├── package.json             # Root package.json for scripts
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- PostgreSQL database
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd stackit-qna-platform
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up the database**
   
   Create a PostgreSQL database and update the connection string in `backend/.env`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/stackit_db"
   JWT_SECRET="your-super-secret-jwt-key"
   PORT=5000
   CLIENT_URL=http://localhost:3000
   ```

4. **Set up Prisma**
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Frontend on http://localhost:3000
   - Backend on http://localhost:5000

## 🗄 Database Schema

### User
- Authentication and profile information
- Admin privileges and ban status

### Question
- Title, description, and metadata
- Belongs to a user, has many answers and votes
- Connected to tags through QuestionTag

### Answer
- Response content and metadata
- Belongs to a question and user
- Has many votes

### Tag
- Category labels with colors
- Connected to questions through QuestionTag

### Vote
- Upvote/downvote system
- Can be for questions or answers
- One vote per user per item

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Questions
- `GET /api/questions` - List questions with pagination
- `GET /api/questions/:id` - Get question details with answers
- `POST /api/questions` - Create new question
- `DELETE /api/questions/:id` - Delete question (admin only)

### Answers
- `POST /api/answers` - Create new answer
- `PUT /api/answers/:id` - Update answer
- `DELETE /api/answers/:id` - Delete answer

### Voting
- `POST /api/votes` - Vote on question or answer
- `GET /api/votes/:targetType/:targetId` - Get user's vote

### Tags & Search
- `GET /api/tags` - List all tags
- `GET /api/tags/popular` - Get popular tags
- `GET /api/search/questions` - Search questions

## 🔄 Real-time Features

The application uses Socket.IO for real-time updates:

- **New Questions** - Instantly appear on the home page
- **New Answers** - Live updates when viewing a question
- **Vote Updates** - Real-time score changes
- **Content Moderation** - Immediate removal of deleted content

## 🎨 UI Components

### Core Components
- `<QuestionCard />` - Display question preview
- `<VoteButton />` - Voting interface
- `<LoadingSpinner />` - Loading states
- `<Layout />` - App layout with navigation

### Pages
- `<Home />` - Question list with filters
- `<QuestionDetail />` - Full question view with answers
- `<AskQuestion />` - Question creation form
- `<Login />` / `<Register />` - Authentication forms

## 🔧 Development Scripts

```bash
# Install all dependencies
npm run install-all

# Start both frontend and backend in development mode
npm run dev

# Start only backend
npm run backend

# Start only frontend
npm run frontend

# Build for production
npm run build

# Start production server
npm start
```

## 🚀 Deployment

### Backend Deployment
1. Set up PostgreSQL database
2. Configure environment variables
3. Run `npx prisma generate` and `npx prisma db push`
4. Start with `npm start`

### Frontend Deployment
1. Build the React app: `npm run build`
2. Serve static files from the `build` folder
3. Configure API_URL environment variable

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions, please create an issue in the repository or contact the development team.
