import React, { useState, useCallback, useEffect } from 'react';
import CustomDropdown from './shared/Dropdown';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/Home_Components.css';
import { motif_categories } from '../constants/categories';

// ----------------------------------------------
// MotifCategories: let users explore by Family, Class, or Transcription Factor.
// The earlier "Origin Species" option and its helper logic are removed.
// ----------------------------------------------
const MotifCategories = () => {
  const [selectedCategory, setSelectedCategory] = useState('family');
  const [items, setItems] = useState([]);
  const [additionalItems, setAdditionalItems] = useState(
    motif_categories['family'].slice(4)
  );
  const [selectedAdditionalItem, setSelectedAdditionalItem] = useState('');
  const [loading] = useState(false);
  const navigate = useNavigate();

  // Initialise with four "family" examples
  useEffect(() => {
    setItems(motif_categories['family'].slice(0, 4));
  }, []);

  // ----------------------------------------------
  // Handle change of the primary dropdown
  // ----------------------------------------------
  const handleCategoryChange = (category) => {
    const internal = category.toLowerCase(); // "family" | "class" | "transcription factor"
    setSelectedCategory(internal);

    const key = internal === 'transcription factor' ? 'motif_name' : internal;
    const raw = motif_categories[key] || [];

    const display =
      internal === 'transcription factor' ? raw.map((t) => t.name) : raw;

    setItems(display.slice(0, 4));
    setAdditionalItems(display.slice(4));
    setSelectedAdditionalItem('');
  };

  // Add more chips from the "Select More" dropdown
  const handleAdditionalItemSelect = (item) => {
    setItems((prev) => [...prev, item]);
    setAdditionalItems((prev) => prev.filter((i) => i !== item));
    setSelectedAdditionalItem(item);
  };

  // Navigate on card click
  const handleCardClick = useCallback(
    (item) => {
      if (selectedCategory === 'transcription factor') {
        navigate(
          `/explore_motif?taxonomy_column=motif_alt_id&taxonomy_value=${item}`
        );
      } else {
        navigate(
          `/explore_motif?taxonomy_column=${selectedCategory}&taxonomy_value=${item}`
        );
      }
    },
    [selectedCategory, navigate]
  );

  return (
    <div className="container">
      {loading ? (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: '50vh' }}
        >
          <div
            className="spinner-border text-primary"
            role="status"
            style={{ width: '3rem', height: '3rem' }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <h2 className="text-center mb-4 fancy-title-medium">
            Explore Motif Categories
          </h2>

          <p className="explanation-text">
            Choose a category – "Class", "Family", or pick a specific
            "Transcription Factor". Popular entries will appear below; use
            "Select More" to add more.
          </p>

          {/* Primary dropdown + optional additional dropdown */}
          <div className="d-flex justify-content-center mb-4 mt-4 gap-5">
            <div className="dropdown-container">
              <CustomDropdown
                options={['Family', 'Class', 'Transcription Factor']}
                defaultOption="Family"
                onOptionSelect={(opt) => handleCategoryChange(opt)}
                showInput={false}
              />
            </div>

            {additionalItems.length > 0 && (
              <div className="dropdown-container">
                <CustomDropdown
                  options={additionalItems}
                  defaultOption={selectedAdditionalItem || 'Select More'}
                  onOptionSelect={handleAdditionalItemSelect}
                  showInput={false}
                />
              </div>
            )}
          </div>

          {/* Cards */}
          {items.length > 0 && (
            <div className="row justify-content-center mt-4">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="col-md-3 mb-4 animate-card"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div
                    className="card text-center shadow border-0 rounded-pill"
                    onClick={() => handleCardClick(item)}
                    style={{
                      cursor: 'pointer',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      backgroundImage: "url('images/proteins/motifbg.webp')",
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      color: 'white',
                      textShadow: '0 0 5px rgba(0,0,0,0.8)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.boxShadow =
                        '0 10px 20px rgba(0,0,0,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div className="card-body py-4">
                      <h5 className="card-title">{item}</h5>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MotifCategories;
