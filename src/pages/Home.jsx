import React, { useEffect, useState } from 'react';
import SpeciesCategories from '../components/SpeciesCategories';
import MotifCategories from '../components/MotifCategories';
import "../styles/Home_Components.css";
import Statistics from '../components/Statistics';

const Home = () => {
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setShowScrollIndicator(false);
      } else {
        setShowScrollIndicator(true);
      }

    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToMainContent = () => {
    document.querySelector('.main-content').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="homepage">
      {/* Header Section */}
      <div className="text-center header-section">
        <h1 className="display-4 fancy-title">Welcome to the TFBS Atlas</h1>
        <p className="lead text-muted">
          Explore transcription factor motifs across various mammalian species with an intuitive interface.
        </p>
        {/* Statistics Section */}
        <Statistics />
        {showScrollIndicator && (
          <div className="scroll-indicator" onClick={scrollToMainContent}>
            <span>Scroll to Explore</span>
            <div className="scroll-arrow"></div>
          </div>
        )}
      </div>

      {/* Main Content Section */}
      <div className="main-content">
        <div className="categories-container">
          <SpeciesCategories />
        </div>
        <div className="categories-container">
          <MotifCategories />
        </div>
      </div>
    </div>
  );
};

export default Home;
