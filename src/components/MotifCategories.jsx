import React, { useState, useCallback, useEffect, useMemo } from 'react';
import CustomDropdown from './shared/Dropdown';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/Home_Components.css';

// Import data sources from static JSON files
import motifMetadata from '../constants/static/motif_metadata.json';
import emptyMotifs from '../constants/static/empty_motifs.json'; // Contains empty motif IDs
import emptyClassesFamilies from '../constants/static/empty_classes_families.json';

// ----------------------------------------------
// MotifCategories: let users explore by Family, Class, or Transcription Factor.
// Data is now dynamically sourced and filtered to exclude empty motifs, classes, and families.
// ----------------------------------------------
const MotifCategories = () => {
  const navigate = useNavigate();

  // Process the motif metadata once, memoize, and filter the result for efficiency
  const { categoryData } = useMemo(() => {
    // Create Sets of empty items for efficient O(1) lookups
    const emptyMotifSet = new Set(emptyMotifs);

    // BUG FIX: Normalize the filter lists to be lowercase and trimmed.
    // This makes the comparison robust against case or whitespace differences.
    const emptyFamilySet = new Set(
      emptyClassesFamilies.empty_tf_families.map((f) => f.toLowerCase().trim())
    );
    const emptyClassSet = new Set(
      emptyClassesFamilies.empty_tf_classes.map((c) => c.toLowerCase().trim())
    );

    const family = new Set();
    const tfClass = new Set();
    const transcriptionFactor = new Set();

    motifMetadata.forEach((item) => {
      // BUG FIX: Normalize the data from motifMetadata before checking against the Set.
      // Add family only if it exists and is NOT in the normalized empty set.
      if (
        item.tf_family &&
        !emptyFamilySet.has(item.tf_family.toLowerCase().trim())
      ) {
        family.add(item.tf_family);
      }

      // BUG FIX: Normalize the data from motifMetadata before checking against the Set.
      // Add class only if it exists and is NOT in the normalized empty set.
      if (
        item.tf_class &&
        !emptyClassSet.has(item.tf_class.toLowerCase().trim())
      ) {
        tfClass.add(item.tf_class);
      }

      // Add transcription factor only if its corresponding motif ID is NOT in the empty set
      if (item.name && !emptyMotifSet.has(item.motif_id)) {
        transcriptionFactor.add(item.name);
      }
    });

    return {
      categoryData: {
        family: [...family].sort(),
        class: [...tfClass].sort(),
        'transcription factor': [...transcriptionFactor].sort(),
      },
    };
  }, []); // Empty dependency array ensures this runs only once

  const [selectedCategory, setSelectedCategory] = useState('family');
  const [items, setItems] = useState([]);
  const [additionalItems, setAdditionalItems] = useState([]);
  const [selectedAdditionalItem, setSelectedAdditionalItem] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialise with four "family" examples once categoryData is available
  useEffect(() => {
    const initialItems = categoryData['family'] || [];
    setItems(initialItems.slice(0, 4));
    setAdditionalItems(initialItems.slice(4));
  }, [categoryData]);

  // Handle change of the primary dropdown
  const handleCategoryChange = (category) => {
    const lowercasedCategory = category.toLowerCase();
    setSelectedCategory(lowercasedCategory);

    const itemsForCategory = categoryData[lowercasedCategory] || [];

    setItems(itemsForCategory.slice(0, 4));
    setAdditionalItems(itemsForCategory.slice(4));
    setSelectedAdditionalItem('');
  };

  // Add more chips from the "Select More" dropdown
  const handleAdditionalItemSelect = useCallback((item) => {
    setItems((prev) => [...prev, item]);
    setAdditionalItems((prev) => prev.filter((i) => i !== item));
    setSelectedAdditionalItem(item);
  }, []);

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
          <div className="d-flex justify-content-center mb-4 mt-4 gap-5">
            <div className="dropdown-container">
              <CustomDropdown
                options={['Family', 'Class', 'Transcription Factor']}
                defaultOption="Family"
                onOptionSelect={handleCategoryChange}
                showInput={false}
              />
            </div>
            {additionalItems.length > 0 && (
              <div className="dropdown-container">
                <CustomDropdown
                  options={additionalItems}
                  defaultOption={selectedAdditionalItem || 'Select More'}
                  onOptionSelect={handleAdditionalItemSelect}
                />
              </div>
            )}
          </div>
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
