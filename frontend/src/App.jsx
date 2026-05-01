import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Navbar />
      <main className="landing">
        {/* Empty landing page — content will be added later */}
      </main>
    </AuthProvider>
  );
}

export default App;
