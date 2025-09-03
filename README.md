# 💰 Expense Tracker - Full Stack Application

A modern, full-stack expense tracking application built with React frontend and Spring Boot backend.

## 🚀 Features

### Frontend (React)
- **Modern UI/UX** with Neuomorphism design
- **Dark/Light Theme** toggle
- **Responsive Design** for all devices
- **Real-time Dashboard** with charts and analytics
- **Transaction Management** (CRUD operations)
- **Recurring Transactions** with automatic processing
- **Advanced Filtering** and search capabilities
- **Category Management** with dynamic categories
- **JWT Authentication** with secure token handling

### Backend (Spring Boot)
- **RESTful APIs** with comprehensive endpoints
- **JWT Authentication** with refresh tokens
- **PostgreSQL Database** with JPA/Hibernate
- **Scheduled Tasks** for recurring transactions
- **Input Validation** and error handling
- **API Documentation** with Swagger/OpenAPI
- **CORS Configuration** for frontend integration

## 🛠️ Tech Stack

### Frontend
- React 18+
- Axios for API calls
- Chart.js for data visualization
- Date-fns for date manipulation
- React Icons for UI icons
- CSS3 with custom properties

### Backend
- Spring Boot 3.2+
- Spring Security with JWT
- Spring Data JPA
- PostgreSQL Database
- Maven for dependency management
- Swagger for API documentation

## 📋 Prerequisites

- Node.js 16+ and npm
- Java 17+
- PostgreSQL 12+
- Maven 3.6+

## 🚀 Getting Started

### Backend Setup

1. **Clone and setup the Spring Boot backend** (create this separately):
```bash
# Create Spring Boot project with the provided specification
# Set up PostgreSQL database
# Configure application.properties
```

2. **Database Configuration** (`application.properties`):
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/expense_tracker
spring.datasource.username=your_username
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# JWT Configuration
jwt.secret=your-secret-key
jwt.expiration=86400000
jwt.refresh-expiration=604800000

# Server Configuration
server.port=8080
```

3. **Start the backend**:
```bash
mvn spring-boot:run
```

### Frontend Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Configure API URL** (optional):
Create a `.env` file in the root directory:
```env
REACT_APP_API_URL=http://localhost:8080/api
```

3. **Start the frontend**:
```bash
npm start
```

The application will be available at `http://localhost:3006`

## 🔧 API Configuration

The frontend is configured to connect to the backend API at `http://localhost:8080/api` by default. You can change this by:

1. Setting the `REACT_APP_API_URL` environment variable
2. Modifying the `API_CONFIG.BASE_URL` in `src/config/api.js`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Transactions
- `GET /api/transactions` - Get transactions (with filtering)
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/{id}` - Update transaction
- `DELETE /api/transactions/{id}` - Delete transaction

### Recurring Transactions
- `GET /api/recurring-transactions` - Get recurring transactions
- `POST /api/recurring-transactions` - Create recurring transaction
- `PUT /api/recurring-transactions/{id}` - Update recurring transaction
- `DELETE /api/recurring-transactions/{id}` - Delete recurring transaction
- `POST /api/recurring-transactions/{id}/process` - Process recurring transaction

### Dashboard & Analytics
- `GET /api/dashboard/summary` - Get dashboard summary
- `GET /api/categories` - Get available categories

## 🧪 Testing the API Integration

Use the provided cURL commands to test the backend APIs:

```bash
# Register a new user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'

# Create a transaction (replace YOUR_JWT_TOKEN)
curl -X POST http://localhost:8080/api/transactions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "EXPENSE",
    "description": "Grocery Shopping",
    "amount": 85.50,
    "category": "Grocery",
    "date": "2024-01-15"
  }'
```

## 🔐 Authentication Flow

1. **Registration/Login**: User provides credentials
2. **JWT Token**: Backend returns JWT token and refresh token
3. **Token Storage**: Frontend stores tokens in localStorage
4. **API Requests**: All API requests include JWT token in Authorization header
5. **Token Refresh**: Automatic token refresh when expired
6. **Logout**: Tokens are cleared from storage

## 📱 Features Overview

### Dashboard
- **Summary Cards**: Total income, expenses, and balance
- **Today's Activity**: Current day transactions
- **Charts**: Visual representation of spending patterns
- **Recent Transactions**: Latest 5 transactions with edit/delete options

### Transaction Management
- **Add/Edit Transactions**: Full CRUD operations
- **Categories**: Dynamic categories from backend
- **Date Selection**: Easy date picking
- **Type Selection**: Income or Expense with visual indicators

### Recurring Transactions
- **Automated Processing**: Backend handles recurring transaction creation
- **Flexible Frequencies**: Monthly, weekly, quarterly, yearly
- **Manual Processing**: Process recurring transactions on-demand
- **Active/Inactive States**: Pause and resume recurring transactions

### Reports & Analytics
- **Advanced Filtering**: By date range, category, type, and search
- **Visual Charts**: Pie charts, bar charts, and trend lines
- **Category Breakdown**: Detailed spending analysis
- **Export Options**: (Future enhancement)

## 🎨 UI/UX Features

- **Neuomorphism Design**: Modern, soft UI elements
- **Dark/Light Themes**: Toggle between themes
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Loading States**: Visual feedback during API calls
- **Error Handling**: User-friendly error messages
- **Smooth Animations**: CSS transitions and hover effects

## 🔧 Development

### Project Structure
```
src/
├── components/          # React components
├── contexts/           # React contexts (Auth)
├── services/           # API service layer
├── config/            # Configuration files
├── index.css          # Global styles
└── index.js           # App entry point
```

### Key Components
- **ExpenseTracker**: Main application component
- **Dashboard**: Analytics and summary view
- **TransactionForm**: Add/edit transaction modal
- **RecurringTransactions**: Manage recurring transactions
- **AuthContext**: Authentication state management

### API Service Layer
- **Centralized API calls** with axios
- **Request/Response interceptors** for auth and error handling
- **Structured error handling** with user-friendly messages
- **Automatic token refresh** logic

## 🚀 Deployment

### Frontend Deployment
```bash
# Build for production
npm run build

# Deploy the build folder to your hosting service
```

### Backend Deployment
```bash
# Package the application
mvn clean package

# Run the JAR file
java -jar target/expense-tracker-backend.jar
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the console for error messages
2. Verify backend is running on port 8080
3. Ensure database is properly configured
4. Check API endpoint URLs match your backend configuration

## 🔮 Future Enhancements

- **Data Export**: CSV/PDF export functionality
- **Budget Management**: Set and track budgets
- **Multi-currency Support**: Handle different currencies
- **Mobile App**: React Native version
- **Advanced Analytics**: More detailed reports and insights
- **Notifications**: Email/SMS notifications for recurring transactions
- **Data Backup**: Cloud backup and sync

---

**Happy Expense Tracking! 💰📊**
