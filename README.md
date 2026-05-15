## Prerequisites


- [.NET SDK](https://dotnet.microsoft.com/download) ( 8.0 or later)
- [Node.js](https://nodejs.org/) (v18 or later recommended)
- Stripe CLI


### 1. Start the Backend (ASP.NET Core)

1. Open a terminal and navigate to the backend `Api` project directory:
   ```bash
   cd backend/Api
   ```
2. Run the .NET application:
   ```bash
   dotnet run
   ```

### 2. Start the Frontend (React + Vite)

1. Open a **new** terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the necessary Node modules (you only need to do this once after cloning):
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

### 3. Database Setup (PostgreSQL)

*For first time setup:*

1. **Install PostgreSQL**: Ensure the PostgreSQL **database server** is installed and running on your local machine.
   *Note: You may also want to install a GUI client like **pgAdmin** or **DBeaver**
2. **Configure Connection String**: Check `backend/Api/appsettings.Development.json` (or `appsettings.json`) and verify the connection string matches your local PostgreSQL credentials (username, password, port).
3. **Apply Migrations**: Open a terminal in the backend `Api` directory and run the Entity Framework Core migrations to create the database schema:
   ```bash
   cd backend/Api
   dotnet tool install --global dotnet-ef # if you don't have the EF Core tools installed
   dotnet ef database update
   ```


## 🧪 Testing Instructions

### 🖥️ Backend Tests
1. Navigate to the backend directory:
   ```bash
   cd PSK_NAMED
   ```
2. Run the test suite:
   ```bash
   dotnet test
   ```

⚠️ **Dependency Warning:**
The package `<PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="8.*" />` in `Api.csproj` currently generates compilation/runtime warnings. Upgrading this dependency to version `9.0.0` resolves the issue and prevents warnings from being thrown. Did NOT check whether it is safe to upgrade.

---

### 🌐 Frontend Tests
1. Navigate to the frontend directory:
   ```bash
   cd PSK_NAMED/frontend
   ```
2. Run the test suite:
   ```bash
   npm test run
   ```

# .env files:

## frontend:

VITE_STRIPE_PUBLISHABLE_KEY=

## backend:

DB_HOST=localhost  
DB_PORT=5432  
DB_NAME=Named  
DB_USER=postgres  
DB_PASSWORD=postgres  
JWT_SECRET=  

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587 
SMTP_USER=  
SMTP_PASS=  

STRIPE_WEBHOOK_SECRET=  
STRIPE_SECRET_KEY=


### STRIPE_WEBHOOK_SECRET
> To get STRIPE_WEBHOOK_SECRET (add secret once and then dotnet run will start this automatically via StripeListenService)
> stripe listen --forward-to http://localhost:5134/api/checkout/webhook

### JWT_SECRET:
> openssl rand -hex 32

### STRIPE_SECRET_KEY and VITE_STRIPE_PUBLISHABLE_KEY=
> Ask to be added to the Stripe project
### SMTP_USER= and SMTP_PASS=  
https://myaccount.google.com/apppasswords?rapt=AEjHL4N5kTiaRJyI3rceOcIvJVQ7rs9apqsSJPjc_ZWuW97OLljgIEbmbaJGJqVTWlRdCOveXpzp9611E5apM2gim1v6SXqKk40E7ddvHzoi863UXy8bC_g

