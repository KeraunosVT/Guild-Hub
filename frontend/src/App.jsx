import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Masthead from './components/Masthead';
import Footer from './components/Footer';
import Home from './pages/Home';
import MatchStats from './pages/MatchStats';

function Layout() {
  return (
    <div className="min-h-screen bg-ink text-bone flex flex-col">
      <Masthead />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/war-record" element={<MatchStats />} />
          {/* Legacy aliases kept so old links still resolve */}
          <Route path="/dashboard" element={<MatchStats />} />
          <Route path="/match-stats" element={<MatchStats />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
