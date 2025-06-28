import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Visualizations from './pages/Visualizations';
import Downloads from './pages/Downloads';
import DataExplorer from './pages/DataExplorer';
import SpeciesExplorer from './pages/SpeciesExplorer';
import DataExplorerMotif from './pages/DataExplorerMotif';
import MotifExplorer from './pages/MotifExplorer';
import Help from './pages/Help';

function App() {
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Navbar />
        <main className="flex-grow-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/visualizations" element={<Visualizations />} />
            <Route path="/downloads" element={<Downloads />} />
            <Route path="/explore" element={<DataExplorer />} />
            <Route path="/explore_motif" element={<DataExplorerMotif />} />
            <Route path="/species-explore" element={<SpeciesExplorer />} />
            <Route path="/motif-explore" element={<MotifExplorer />} />
            <Route path="/help" element={<Help />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
