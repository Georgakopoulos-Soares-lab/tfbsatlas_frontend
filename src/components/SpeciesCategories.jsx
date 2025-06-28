import React, { useState, useEffect, useCallback } from 'react';
import CustomDropdown from './shared/Dropdown';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/Home_Components.css';
import backgroundImages from '../constants/backgroundImages';
import { species_categories, t2t_ids } from '../constants/categories';
import { genus_family } from '../constants/genus_family';

const SpeciesCategories = () => {
  const [selectedCategory, setSelectedCategory] = useState('order'); // Default category (lowercase)
  const categoryData = species_categories;
  const [items, setItems] = useState([]);
  const [additionalItems, setAdditionalItems] = useState(categoryData['order']);
  const [selectedAdditionalItem, setSelectedAdditionalItem] = useState('');
  const [loading, setLoading] = useState(false); // Loader state
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize with the default category 'order'
    const initialItems = categoryData['order'] || [];
    setItems(initialItems.slice(0, 4)); // Show the first 4 items
    setAdditionalItems(initialItems.slice(4)); // Store the remaining items
  }, []); // Removed categoryData from dependency array to run only once on mount

  // Handle category change
  const handleCategoryChange = (category, data = categoryData) => {
    const lowercasedCategory = category.toLowerCase();
    setSelectedCategory(lowercasedCategory); // Update main category
    const items = data[lowercasedCategory] || [];
    setItems(items.slice(0, 4)); // Show the first 4 items
    setAdditionalItems(items.slice(4)); // Store the remaining items
    setSelectedAdditionalItem(''); // Reset the additional dropdown
  };

  // Handle additional item selection
  const handleAdditionalItemSelect = (item) => {
    setItems((prevItems) => [...prevItems, item]);
    setAdditionalItems((prevAdditionalItems) =>
      prevAdditionalItems.filter((additionalItem) => additionalItem !== item)
    );
    setSelectedAdditionalItem(item); // Set the selected additional item
  };

  // Navigate to a new page on card click
  const handleCardClick = useCallback(
    (item) => {
      const taxonomyColumn = selectedCategory;
      const taxonomyValue = item;
      // handle case for selected category = t2t species
      if (selectedCategory === 't2t species') {
        navigate(
          `/explore?species_id=${t2t_ids[taxonomyValue]}&species_name=${taxonomyValue}`
        );
      } else {
        // This 'else' block now correctly handles "Family", "Order", "Genus", and "Species"
        // Redirect to /explore with query parameters
        navigate(
          `/explore?taxonomy_column=${taxonomyColumn.toLowerCase()}&taxonomy_value=${taxonomyValue}`
        );
      }
    },
    [selectedCategory, navigate]
  );

  // Find Background Image
  const getBackgroundImage = (item) => {
    if (backgroundImages?.[item]) return backgroundImages?.[item];
    else return backgroundImages?.[genus_family[item]];
  };

  return (
    <div className="container">
      {/* Loader */}
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
            Explore Species Categories
          </h2>

          {/* Explanatory Text */}
          <p className="explanation-text">
            Use the dropdown below to select a category like "Family", "Order",
            "Genus", "Species", or "T2T Species". Once a category is selected,
            popular species from that category will appear below. You can also
            select additional species using the "Select More" dropdown.
          </p>

          {/* Dropdown for selecting category */}
          <div className="d-flex justify-content-center mb-4 mt-4">
            <div className="dropdown-container">
              <CustomDropdown
                // MODIFICATION: Added "Species" to the options array
                options={['Family', 'Order', 'Genus', 'Species', 'T2T Species']}
                defaultOption={'Order'}
                onOptionSelect={
                  (selected) => handleCategoryChange(selected) // No need for toLowerCase() here if handled in the function
                }
                showInput={false}
              />
              <small className="dropdown-hint">
                Choose a category to explore.
              </small>
            </div>

            {/* Dropdown for additional items */}
            {additionalItems.length > 0 && (
              <div className="dropdown-container">
                <CustomDropdown
                  options={additionalItems}
                  defaultOption={selectedAdditionalItem || 'Select More'}
                  onOptionSelect={(selectedItem) =>
                    handleAdditionalItemSelect(selectedItem)
                  }
                />
                <small className="dropdown-hint">
                  Add more items to the list.
                </small>
              </div>
            )}
          </div>

          {/* Cards for the most common items */}
          {items.length > 0 && (
            <div className="row justify-content-center mt-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="col-md-3 mb-4 animate-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div
                    className="card text-center shadow border-0 rounded-pill"
                    onClick={() => handleCardClick(item)}
                    style={{
                      cursor: 'pointer',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      backgroundImage: `url(${getBackgroundImage(item)})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      color: getBackgroundImage(item) ? 'white' : 'black',
                      textShadow: getBackgroundImage(item)
                        ? '0px 0px 5px rgba(0,0,0,0.8)'
                        : 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.boxShadow =
                        '0 10px 20px rgba(0, 0, 0, 0.3)';
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

export default SpeciesCategories;
