## Prerequisites


- [.NET SDK](https://dotnet.microsoft.com/download) ( 8.0 or later)
- [Node.js](https://nodejs.org/) (v18 or later recommended)


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
