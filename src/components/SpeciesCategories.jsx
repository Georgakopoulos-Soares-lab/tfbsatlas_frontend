import React, { useState, useEffect, useCallback, useMemo } from 'react';
import CustomDropdown from './shared/Dropdown';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/Home_Components.css';
import backgroundImages from '../constants/backgroundImages';

// Import new data source from static JSON files
import assemblyMetadata from '../constants/static/joined.json';
// import motifMetadata from '../constants/static/motif_metadata.json'; // Not needed for this component yet

const SpeciesCategories = () => {
  const navigate = useNavigate();

  // Process the assembly metadata once and memoize the result
  const { categoryData, familyLookup } = useMemo(() => {
    const order = new Set();
    const family = new Set();
    const genus = new Set();
    const species = new Set();
    const familyLookup = {}; // Maps species/genus -> family for background images

    assemblyMetadata.forEach((item) => {
      if (item.order) order.add(item.order);
      if (item.family) family.add(item.family);
      if (item.genus) genus.add(item.genus);
      if (item.species) species.add(item.species);

      // Populate lookup maps for background images
      if (item.species) {
        familyLookup[item.species] = item.family;
      }
      if (item.genus) {
        familyLookup[item.genus] = item.family;
      }
    });

    const t2tSpeciesList = assemblyMetadata
      .filter((item) => item.species && item.species.endsWith(' T2T'))
      .map((item) => item.species);

    return {
      categoryData: {
        order: [...order].sort(),
        family: [...family].sort(),
        genus: [...genus].sort(),
        species: [...species].sort(),
        't2t species': t2tSpeciesList.sort(),
      },
      familyLookup,
    };
  }, []);

  const [selectedCategory, setSelectedCategory] = useState('order');
  const [items, setItems] = useState([]);
  const [additionalItems, setAdditionalItems] = useState([]);
  const [selectedAdditionalItem, setSelectedAdditionalItem] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initialItems = categoryData['order'] || [];
    setItems(initialItems.slice(0, 4));
    setAdditionalItems(initialItems.slice(4));
  }, [categoryData]);

  const handleCategoryChange = (category) => {
    const lowercasedCategory = category.toLowerCase();
    setSelectedCategory(lowercasedCategory);
    const newItems = categoryData[lowercasedCategory] || [];
    setItems(newItems.slice(0, 4));
    setAdditionalItems(newItems.slice(4));
    setSelectedAdditionalItem('');
  };

  // MODIFICATION: Reverted to only handle single item selection
  const handleAdditionalItemSelect = (selectedItem) => {
    // Move the selected item from additionalItems to items
    setItems((prevItems) => [...prevItems, selectedItem]);
    setAdditionalItems((prevAdditionalItems) =>
      prevAdditionalItems.filter(
        (additionalItem) => additionalItem !== selectedItem
      )
    );
    setSelectedAdditionalItem(selectedItem);
  };

  const handleCardClick = useCallback(
    (item) => {
      const taxonomyValue = item;
      const taxonomyColumn =
        selectedCategory === 't2t species' ? 'species' : selectedCategory;

      navigate(
        `/explore?taxonomy_column=${taxonomyColumn.toLowerCase()}&taxonomy_value=${taxonomyValue}`
      );
    },
    [selectedCategory, navigate]
  );

  const getBackgroundImage = useCallback(
    (item) => {
      const baseItem = item.replace(' T2T', '');
      return (
        backgroundImages?.[baseItem] ??
        backgroundImages?.[familyLookup[baseItem]]
      );
    },
    [familyLookup]
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
            Explore Species Categories
          </h2>
          <p className="explanation-text">
            Use the dropdown below to select a category like "Family", "Order",
            "Genus", "Species", or "T2T Species". Once a category is selected,
            popular species from that category will appear below. You can also
            select additional species using the "Select More" dropdown.
          </p>
          <div className="d-flex justify-content-center mb-4 mt-4">
            <div className="dropdown-container">
              <CustomDropdown
                options={['Family', 'Order', 'Genus', 'Species', 'T2T Species']}
                defaultOption={'Order'}
                onOptionSelect={handleCategoryChange}
                showInput={false}
              />
              <small className="dropdown-hint">
                Choose a category to explore.
              </small>
            </div>
            {/* Conditionally render the "Select More" dropdown */}
            {additionalItems.length > 0 && (
              <div className="dropdown-container">
                <CustomDropdown
                  // MODIFICATION: Options are just the additional items, no "Add All"
                  options={additionalItems}
                  defaultOption={selectedAdditionalItem || 'Select More'}
                  onOptionSelect={handleAdditionalItemSelect}
                />
                <small className="dropdown-hint">
                  Add more items to the list.
                </small>
              </div>
            )}
          </div>
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
