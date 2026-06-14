import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import MatchStats from './pages/MatchStats';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/match-stats" element={<MatchStats />} />
        <Route path="/dashboard" element={<MatchStats />} />
      </Routes>
    </Router>
  );
}

export default App;