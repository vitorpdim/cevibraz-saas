import { Sidebar } from './components/Sidebar';
import { ThemeToggle } from './components/ThemeToggle';
import { Outlet } from 'react-router-dom';

function App() {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <ThemeToggle />
        <Outlet />
      </div>
    </div>
  );
}

export default App;
