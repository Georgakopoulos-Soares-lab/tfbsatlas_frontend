import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Dropdown from './shared/Dropdown';
import { InfoTooltip } from './shared/InfoTooltip';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/Datatable.css';
import { downloadMotifData } from '../utils/downloadDB';
import { species, protein } from '../constants/static/static_metadata.js';
import { urls } from '../constants/constants.js';
import InstructionsSection from './shared/InstructionsSection';
import DownloadPopup from './shared/DownloadPopup';

const SuggestionList = ({ suggestions, onSuggestionClick }) => (
  <ul
    className="list-group position-absolute w-100"
    style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}
  >
    {suggestions.map((suggestion, index) => (
      <li
        key={index}
        className="list-group-item list-group-item-action suggestion-item-compact"
        style={{ cursor: 'pointer' }}
        onMouseDown={() => onSuggestionClick(suggestion)}
      >
        {suggestion}
      </li>
    ))}
  </ul>
);

const DataTableMotif = () => {
  const location = useLocation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);
  const [isPageInputActive, setIsPageInputActive] = useState(false);
  const [goToPageInput, setGoToPageInput] = useState('');
  const pageInputRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestionBox, setActiveSuggestionBox] = useState('');
  const filtersRef = useRef(null);

  // Filter states
  const [assembly, setAssembly] = useState('');
  const [motifId, setMotifId] = useState('');
  const [motifAltId, setMotifAltId] = useState('');
  const [sequenceName, setSequenceName] = useState('');
  const [queryStart, setQueryStart] = useState('');
  const [queryEnd, setQueryEnd] = useState('');
  const [scoreRange, setScoreRange] = useState({ min: '', max: '' });
  const [pValueRange, setPValueRange] = useState({ min: '', max: '' });
  const [qValueRange, setQValueRange] = useState({ min: '', max: '' });
  const [matchedSequence, setMatchedSequence] = useState('');
  const [protClass, setProtClass] = useState('');
  const [family, setFamily] = useState('');
  const [strandFilter, setStrandFilter] = useState('both');

  // State for column visibility
  const [columnsVisibility, setColumnsVisibility] = useState({
    species: true,
    motifId: true,
    motifAltId: true,
    sequenceName: true,
    start: true,
    stop: true,
    strand: true,
    score: true,
    pValue: true,
    qValue: true,
    matchedSequence: true,
    protClass: true,
    family: true,
  });

  // State to control visibility of filter section
  const [filtersVisible, setFiltersVisible] = useState(false);
  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    column: 'score',
    direction: 'asc',
  });
  const queryParams = new URLSearchParams(location.search);
  const taxonomyColumn = queryParams.get('taxonomy_column');
  const taxonomyValue = queryParams.get('taxonomy_value');

  const tooltipText =
    'Only the current page will be downloaded. For full dataset download visit the Downloads page';

  const [showPopup, setShowPopup] = useState(false);
  const handleClosePopup = () => {
    setShowPopup(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target)) {
        setActiveSuggestionBox('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // MODIFICATION: Auto-populate dependent fields based on the selected taxonomy
  useEffect(() => {
    // Sync URL taxonomy params with local filter state
    if (taxonomyColumn && taxonomyValue) {
      if (taxonomyColumn === 'motif_alt_id') {
        setMotifAltId(taxonomyValue);
        // Find the protein to auto-fill class and family
        const proteinEntry = protein.find((p) => p.name === taxonomyValue);
        if (proteinEntry) {
          setFamily(proteinEntry.family);
          setProtClass(proteinEntry.class);
        }
      } else if (taxonomyColumn === 'family') {
        setFamily(taxonomyValue);
        // Find the protein to auto-fill class
        const proteinEntry = protein.find((p) => p.family === taxonomyValue);
        if (proteinEntry) {
          setProtClass(proteinEntry.class);
        }
      } else if (taxonomyColumn === 'class') {
        setProtClass(taxonomyValue);
      }
    }
  }, [taxonomyColumn, taxonomyValue]);

  const handleAutosuggestChange = (e, field, setter) => {
    const { value } = e.target;
    setter(value);

    const suggestionConfig = {
      motifAltId: { data: protein, key: 'name', type: 'protein' },
      motifId: { data: protein, key: 'matrix_id', type: 'protein' },
      family: { data: protein, key: 'family', type: 'protein' },
      protClass: { data: protein, key: 'class', type: 'protein' },
      assembly: { data: species, key: 'species_name', type: 'species' },
    };

    const config = suggestionConfig[field];
    if (!config || !value.trim()) {
      setActiveSuggestionBox('');
      setSuggestions([]);
      return;
    }

    let sourceData = config.data;
    if (config.type === 'protein' && taxonomyColumn && taxonomyValue) {
      const pageContextKey = taxonomyColumn;
      sourceData = sourceData.filter(
        (item) =>
          item[pageContextKey]?.toLowerCase() === taxonomyValue.toLowerCase()
      );
    }

    const { key } = config;
    const lowercasedValue = value.toLowerCase();
    const filteredSuggestions = sourceData
      .map((item) => item[key])
      .filter(
        (itemValue) =>
          itemValue && itemValue.toLowerCase().startsWith(lowercasedValue)
      );
    const distinctSuggestions = [...new Set(filteredSuggestions)];
    setSuggestions(distinctSuggestions.slice(0, 10));
    setActiveSuggestionBox(field);
  };

  const handleSuggestionClick = (suggestion, setter) => {
    setter(suggestion);
    setActiveSuggestionBox('');
    setSuggestions([]);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
        taxonomy_column: taxonomyColumn,
        taxonomy_value: taxonomyValue?.trim(),
        species_name: assembly?.trim() || undefined,
        motif_id: motifId?.trim() || undefined,
        motif_alt_id: motifAltId?.trim() || undefined,
        sequence_name: sequenceName?.trim() || undefined,
        matched_sequence: matchedSequence?.trim() || undefined,
        start: queryStart?.toString().trim() || 1,
        end: queryEnd?.toString().trim() || 99999999999999999,
        strand: strandFilter === 'both' ? undefined : strandFilter,
        score_min: scoreRange.min?.toString().trim() || undefined,
        score_max: scoreRange.max?.toString().trim() || undefined,
        p_value_min: pValueRange.min?.toString().trim() || undefined,
        p_value_max: pValueRange.max?.toString().trim() || undefined,
        q_value_min: qValueRange.min?.toString().trim() || undefined,
        q_value_max: qValueRange.max?.toString().trim() || undefined,
        class: protClass?.trim() || undefined,
        family: family?.trim() || undefined,
      };

      const filteredParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined)
      );

      const queryParams = new URLSearchParams(filteredParams);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/filter_based_on_motif?${queryParams.toString()}`,
        { timeout: 10000 }
      );
      const result = await response.json();
      if (result.data) {
        setData(result.data);
        setTotalRecords(result.pagination.totalPages || 0);
      } else {
        setData([]);
        setTotalRecords(0);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setData([]);
      setTotalRecords(0);
    }
    setLoading(false);
  }, [
    page,
    perPage,
    taxonomyColumn,
    taxonomyValue,
    assembly,
    motifId,
    motifAltId,
    sequenceName,
    matchedSequence,
    queryStart,
    queryEnd,
    strandFilter,
    scoreRange,
    pValueRange,
    qValueRange,
    protClass,
    family,
  ]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Focus and select the text when the input becomes active
    if (isPageInputActive && pageInputRef.current) {
      pageInputRef.current.focus();
      pageInputRef.current.select();
    }
  }, [isPageInputActive]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleActivatePageInput = () => {
    // Don't allow editing if table is loading or has no pages
    if (loading || totalRecords === 0) return;
    setGoToPageInput(page.toString()); // Pre-fill with the current page number
    setIsPageInputActive(true);
  };

  const handleGoToPage = () => {
    const pageNumber = parseInt(goToPageInput, 10);

    // Always hide the input after the action
    setIsPageInputActive(false);

    // Validate the number and check if it's different from the current page
    if (
      pageNumber &&
      pageNumber >= 1 &&
      pageNumber <= totalRecords &&
      pageNumber !== page
    ) {
      setPage(pageNumber);
    }

    setGoToPageInput(''); // Clear the temporary input state
  };

  // MODIFICATION: Make clear filters "smarter" about locked taxonomy
  const handleClearFilters = () => {
    setAssembly('');
    setMotifId('');
    setSequenceName('');
    setQueryStart('');
    setQueryEnd('');
    setStrandFilter('both');
    setScoreRange({ min: '', max: '' });
    setPValueRange({ min: '', max: '' });
    setQValueRange({ min: '', max: '' });
    setMatchedSequence('');

    // Conditionally clear taxonomy-related fields
    if (taxonomyColumn !== 'motif_alt_id') {
      setMotifAltId('');
    }
    if (!['family', 'motif_alt_id'].includes(taxonomyColumn)) {
      setFamily('');
    }
    if (!['class', 'family', 'motif_alt_id'].includes(taxonomyColumn)) {
      setProtClass('');
    }

    setPage(1);
    setTimeout(fetchData, 0);
  };

  const handleColumnToggle = (column) => {
    setColumnsVisibility((prev) => ({ ...prev, [column]: !prev[column] }));
  };

  const [motifDetails, setMotifDetails] = useState(null);

  // Function to fetch species details - kept for Assembly link clicks
  const [speciesDetails, setSpeciesDetails] = useState(null);
  const fetchSpeciesDetails = async (speciesName) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/species/${speciesName}`
      );
      const result = await response.json();
      setSpeciesDetails(result);
    } catch (error) {
      console.error('Error fetching species details:', error);
    }
  };
  const handleSpeciesClick = (speciesName) => {
    if (!taxonomyValue) fetchSpeciesDetails(speciesName);
  };

  const handleDownload = async (format) => {
    setLoading(true);
    downloadMotifData(data, columnsVisibility, format);
    setLoading(false);
    setShowPopup(true);
  };

  const handleSort = (column) => {
    const isSameColumn = sortConfig.column === column;
    const newDirection =
      isSameColumn && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ column, direction: newDirection });
    const sortedData = [...data].sort((a, b) => {
      if (a[column] < b[column]) return newDirection === 'asc' ? -1 : 1;
      if (a[column] > b[column]) return newDirection === 'asc' ? 1 : -1;
      return 0;
    });
    setData(sortedData);
  };

  const renderSortIcon = (column) => {
    if (sortConfig.column === column) {
      return sortConfig.direction === 'asc' ? '↑' : '↓';
    }
    return '↑';
  };

  // MODIFICATION: Dynamically build the list of columns for the dropdown
  const getSelectableColumns = () => {
    const columns = [
      { label: 'Assembly', value: 'species' },
      { label: 'TF Name', value: 'motifAltId' },
      { label: 'Motif ID', value: 'motifId' },
      { label: 'Sequence Name', value: 'sequenceName' },
      { label: 'Start', value: 'start' },
      { label: 'Stop', value: 'stop' },
      { label: 'Strand', value: 'strand' },
      { label: 'Score', value: 'score' },
      { label: 'P-value', value: 'pValue' },
      { label: 'Q-value', value: 'qValue' },
      { label: 'Matched Sequence', value: 'matchedSequence' },
      { label: 'TF Class', value: 'protClass' },
      { label: 'Family', value: 'family' },
    ];

    // Filter out columns that are redundant based on the selected taxonomy
    return columns.filter((col) => {
      if (
        (col.value === 'protClass' || col.value === 'family') &&
        taxonomyColumn === 'motif_alt_id'
      )
        return false;
      if (col.value === 'protClass' && taxonomyColumn === 'family')
        return false;
      if (col.value === 'protClass' && taxonomyColumn === 'class') return false;
      if (col.value === 'family' && taxonomyColumn === 'family') return false;
      if (col.value === 'motifAltId' && taxonomyColumn === 'motif_alt_id')
        return false;
      if (col.value === 'motifId' && taxonomyColumn === 'motif_alt_id')
        return false; // Hide Motif ID if TF Name is selected
      return true;
    });
  };

  return (
    <div className={'table-container my-5'}>
      <h1 className="mb-4 text-center fancy-title">
        Motif Data Table for {taxonomyValue}
      </h1>
      <InstructionsSection />

      <div className="text-center mb-4">
        <button
          className="btn btn-primary rounded-pill shadow-sm"
          onClick={() => setFiltersVisible(!filtersVisible)}
        >
          {filtersVisible ? 'Hide Filters' : 'Show Advanced Filters'}
        </button>
      </div>

      <div ref={filtersRef}>
        <div className="row mb-4">
          <div className="col position-relative">
            <label htmlFor="assembly">Assembly</label>
            <input
              type="text"
              id="assembly"
              className="form-control"
              value={assembly}
              onChange={(e) =>
                handleAutosuggestChange(e, 'assembly', setAssembly)
              }
              autoComplete="off"
            />
            {activeSuggestionBox === 'assembly' && suggestions.length > 0 && (
              <SuggestionList
                suggestions={suggestions}
                onSuggestionClick={(s) => handleSuggestionClick(s, setAssembly)}
              />
            )}
          </div>
          {taxonomyColumn !== 'motif_alt_id' && (
            <div className="col position-relative">
              <label htmlFor="motifId">Motif ID</label>
              <input
                type="text"
                id="motifId"
                className="form-control"
                value={motifId}
                onChange={(e) =>
                  handleAutosuggestChange(e, 'motifId', setMotifId)
                }
                autoComplete="off"
              />
              {activeSuggestionBox === 'motifId' && suggestions.length > 0 && (
                <SuggestionList
                  suggestions={suggestions}
                  onSuggestionClick={(s) =>
                    handleSuggestionClick(s, setMotifId)
                  }
                />
              )}
            </div>
          )}
          <div className="col">
            <label htmlFor="matchedSequence"> Matched Sequence </label>
            <input
              type="text"
              id="matchedSequence"
              className="form-control"
              value={matchedSequence}
              onChange={(e) => {
                const lettersOnly = e.target.value.replace(/[^a-zA-Z]/g, '');
                setMatchedSequence(lettersOnly);
              }}
            />
          </div>
        </div>
      </div>

      {filtersVisible && (
        <div>
          <div className="row mb-4">
            <div className="col">
              <label htmlFor="sequenceName"> Chromosome </label>
              <input
                type="text"
                id="sequenceName"
                className="form-control"
                value={sequenceName}
                onChange={(e) => setSequenceName(e.target.value)}
              />
              <div className="col position-relative mt-2">
                <label htmlFor="motifAltId"> TF Name </label>
                <input
                  type="text"
                  id="motifAltId"
                  className="form-control"
                  value={motifAltId}
                  onChange={(e) =>
                    handleAutosuggestChange(e, 'motifAltId', setMotifAltId)
                  }
                  readOnly={taxonomyColumn === 'motif_alt_id'}
                  autoComplete="off"
                />
                {activeSuggestionBox === 'motifAltId' &&
                  suggestions.length > 0 && (
                    <SuggestionList
                      suggestions={suggestions}
                      onSuggestionClick={(s) =>
                        handleSuggestionClick(s, setMotifAltId)
                      }
                    />
                  )}
              </div>
            </div>
            <div className="col">
              <label htmlFor="queryStart"> Start </label>
              <input
                type="number"
                id="queryStart"
                className="form-control"
                placeholder="e.g., 10000"
                value={queryStart}
                onChange={(e) => setQueryStart(e.target.value)}
              />
            </div>
            <div className="col">
              <label htmlFor="queryEnd"> End </label>
              <input
                type="number"
                id="queryEnd"
                className="form-control"
                placeholder="e.g., 50000"
                value={queryEnd}
                onChange={(e) => setQueryEnd(e.target.value)}
              />
            </div>
            <div className="col d-flex flex-column">
              <label>Strand</label>
              <div className="strand-toggle-container">
                <input
                  type="radio"
                  id="radio-both"
                  name="strand"
                  value="both"
                  checked={strandFilter === 'both'}
                  onChange={(e) => setStrandFilter(e.target.value)}
                />
                <label htmlFor="radio-both">Both</label>
                <input
                  type="radio"
                  id="radio-plus"
                  name="strand"
                  value="+"
                  checked={strandFilter === '+'}
                  onChange={(e) => setStrandFilter(e.target.value)}
                />
                <label htmlFor="radio-plus">+</label>
                <input
                  type="radio"
                  id="radio-minus"
                  name="strand"
                  value="-"
                  checked={strandFilter === '-'}
                  onChange={(e) => setStrandFilter(e.target.value)}
                />
                <label htmlFor="radio-minus">-</label>
                <div className="glider"></div>
              </div>
            </div>
          </div>

          <div className="row mb-4">
            <div className="col">
              <label htmlFor="scoreRangeMin"> Score Range </label>
              <input
                type="number"
                id="scoreRangeMin"
                className="form-control"
                placeholder="Min"
                value={scoreRange.min}
                onChange={(e) => {
                  setScoreRange({
                    ...scoreRange,
                    min: Math.max(0, Math.min(100, Number(e.target.value))),
                  });
                }}
              />
              <input
                type="number"
                id="scoreRangeMax"
                className="form-control mt-2"
                placeholder="Max"
                value={scoreRange.max}
                onChange={(e) => {
                  setScoreRange({
                    ...scoreRange,
                    max: Math.max(0, Math.min(100, Number(e.target.value))),
                  });
                }}
              />
            </div>
            <div className="col">
              <label htmlFor="pValueRangeMin"> P - Value Range </label>
              <input
                type="number"
                id="pValueRangeMin"
                className="form-control"
                placeholder="Min"
                value={pValueRange.min}
                onChange={(e) =>
                  setPValueRange({ ...pValueRange, min: e.target.value })
                }
              />
              <input
                type="number"
                id="pValueRangeMax"
                className="form-control mt-2"
                placeholder="Max"
                value={pValueRange.max}
                onChange={(e) =>
                  setPValueRange({ ...pValueRange, max: e.target.value })
                }
              />
            </div>
            <div className="col">
              <label htmlFor="qValueRangeMin"> Q - Value Range </label>
              <input
                type="number"
                id="qValueRangeMin"
                className="form-control"
                placeholder="Min"
                value={qValueRange.min}
                onChange={(e) =>
                  setQValueRange({ ...qValueRange, min: e.target.value })
                }
              />
              <input
                type="number"
                id="qValueRangeMax"
                className="form-control mt-2"
                placeholder="Max"
                value={qValueRange.max}
                onChange={(e) =>
                  setQValueRange({ ...qValueRange, max: e.target.value })
                }
              />
            </div>
          </div>

          <div className="row mb-4">
            <div className="col position-relative">
              <label htmlFor="class"> TF Class </label>
              <input
                type="text"
                id="class"
                className="form-control"
                value={protClass}
                onChange={(e) =>
                  handleAutosuggestChange(e, 'protClass', setProtClass)
                }
                readOnly={['class', 'family', 'motif_alt_id'].includes(
                  taxonomyColumn
                )}
                autoComplete="off"
              />
              {activeSuggestionBox === 'protClass' &&
                suggestions.length > 0 && (
                  <SuggestionList
                    suggestions={suggestions}
                    onSuggestionClick={(s) =>
                      handleSuggestionClick(s, setProtClass)
                    }
                  />
                )}
            </div>
            <div className="col position-relative">
              <label htmlFor="family"> TF Family </label>
              <input
                type="text"
                id="family"
                className="form-control"
                value={family}
                onChange={(e) =>
                  handleAutosuggestChange(e, 'family', setFamily)
                }
                readOnly={['family', 'motif_alt_id'].includes(taxonomyColumn)}
                autoComplete="off"
              />
              {activeSuggestionBox === 'family' && suggestions.length > 0 && (
                <SuggestionList
                  suggestions={suggestions}
                  onSuggestionClick={(s) => handleSuggestionClick(s, setFamily)}
                />
              )}
            </div>
          </div>
        </div>
      )}
      <div className="text-center mb-4 d-flex gap-4 justify-content-center">
        <button
          className="btn btn-primary rounded-pill shadow-sm"
          onClick={handleSearch}
          disabled={loading}
        >
          Search
        </button>
        <button
          className="btn btn-primary rounded-pill shadow-sm"
          onClick={handleClearFilters}
          disabled={loading}
        >
          Clear Filters
        </button>
      </div>

      <div className="mb-4">
        <button
          className="btn btn-primary dropdown-toggle w-100"
          type="button"
          onClick={() => setIsColumnsDropdownOpen(!isColumnsDropdownOpen)}
          aria-expanded={isColumnsDropdownOpen}
        >
          Select Columns to Display
        </button>
        {isColumnsDropdownOpen && (
          <div className="table-container my-5">
            <div className="d-flex flex-wrap gap-3">
              {getSelectableColumns().map((column) => (
                <div key={column.value} className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id={`column-${column.value}`}
                    checked={columnsVisibility[column.value]}
                    onChange={() => handleColumnToggle(column.value)}
                  />
                  <label
                    className="form-check-label"
                    htmlFor={`column-${column.value}`}
                  >
                    {column.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="d-flex align-items-center mb-3">
        <span className="me-2"> Rows per page: </span>
        <Dropdown
          options={['20', '30', '40', '50', '100', '500', '1000']}
          defaultOption={'20'}
          onOptionSelect={(option) => setPerPage(parseInt(option))}
          showInput={false}
        />
      </div>
      <div className="text-center mb-4">
        <button
          className="btn btn-primary mx-2"
          onClick={() => handleDownload('csv')}
        >
          Download CSV
          <InfoTooltip message={tooltipText} />
        </button>
        <button
          className="btn btn-secondary mx-2"
          onClick={() => handleDownload('json')}
        >
          Download JSON
          <InfoTooltip message={tooltipText} />
        </button>
        <button
          className="btn btn-success mx-2"
          onClick={() => handleDownload('parquet')}
        >
          Download Parquet
          <InfoTooltip message={tooltipText} />
        </button>
      </div>
      {showPopup && <DownloadPopup onClose={handleClosePopup} />}

      <div
        className="table-responsive"
        style={loading ? { filter: 'blur(4px)' } : {}}
      >
        <table className="table table-bordered table-striped table-hover shadow-sm">
          <thead className="thead-dark text-center">
            <tr>
              {/* MODIFICATION: Table headers now use the same conditional logic */}
              {columnsVisibility.motifAltId &&
                taxonomyColumn !== 'motif_alt_id' && <th>TF Name </th>}
              {columnsVisibility.motifId &&
                taxonomyColumn !== 'motif_alt_id' && <th>Motif ID</th>}
              {columnsVisibility.sequenceName && <th>Chromosome </th>}
              {columnsVisibility.start && <th>Start </th>}
              {columnsVisibility.stop && <th>End </th>}
              {columnsVisibility.strand && <th>Strand </th>}
              {columnsVisibility.score && (
                <th
                  onClick={() => handleSort('score')}
                  style={{ cursor: 'pointer' }}
                >
                  Score {renderSortIcon('score')}
                </th>
              )}
              {columnsVisibility.pValue && (
                <th
                  onClick={() => handleSort('p_value')}
                  style={{ cursor: 'pointer' }}
                >
                  P - value {renderSortIcon('p_value')}
                </th>
              )}
              {columnsVisibility.qValue && (
                <th
                  onClick={() => handleSort('q_value')}
                  style={{ cursor: 'pointer' }}
                >
                  Q - value {renderSortIcon('q_value')}
                </th>
              )}
              {columnsVisibility.matchedSequence && <th>Matched Sequence </th>}
              {columnsVisibility.protClass &&
                !['class', 'family', 'motif_alt_id'].includes(
                  taxonomyColumn
                ) && <th>TF Class </th>}
              {columnsVisibility.family &&
                !['family', 'motif_alt_id'].includes(taxonomyColumn) && (
                  <th>Family </th>
                )}
              {columnsVisibility.species && <th>Assembly </th>}
            </tr>
          </thead>
          <tbody className="text-center">
            {loading ? (
              <tr>
                <td
                  colSpan={
                    Object.values(columnsVisibility).filter((v) => v).length
                  }
                  className="text-center"
                >
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden"> Loading...</span>
                  </div>
                </td>
              </tr>
            ) : data?.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    Object.values(columnsVisibility).filter((v) => v).length
                  }
                  className="no-data-row"
                >
                  No data found
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={index}>
                  {columnsVisibility.motifAltId &&
                    taxonomyColumn !== 'motif_alt_id' && (
                      <td>{item.motif_alt_id}</td>
                    )}
                  {columnsVisibility.motifId &&
                    taxonomyColumn !== 'motif_alt_id' && (
                      <td>{item.motif_id}</td>
                    )}
                  {columnsVisibility.sequenceName && (
                    <td>{item.sequence_name}</td>
                  )}
                  {columnsVisibility.start && <td>{item.start}</td>}
                  {columnsVisibility.stop && <td>{item.stop}</td>}
                  {columnsVisibility.strand && <td>{item.strand}</td>}
                  {columnsVisibility.score && (
                    <td>{parseFloat(item.score).toFixed(4)}</td>
                  )}
                  {columnsVisibility.pValue && (
                    <td>{item.p_value.toExponential(4)}</td>
                  )}
                  {columnsVisibility.qValue && (
                    <td>{parseFloat(item.q_value).toFixed(4)}</td>
                  )}
                  {columnsVisibility.matchedSequence && (
                    <td>{item.matched_sequence.toUpperCase()}</td>
                  )}
                  {columnsVisibility.protClass &&
                    !['class', 'family', 'motif_alt_id'].includes(
                      taxonomyColumn
                    ) && <td>{item.class}</td>}
                  {columnsVisibility.family &&
                    !['family', 'motif_alt_id'].includes(taxonomyColumn) && (
                      <td>{item.family}</td>
                    )}
                  {columnsVisibility.species && (
                    <td
                      className="td_cursor"
                      onClick={() =>
                        handleSpeciesClick(item.assembly_accession)
                      }
                    >
                      <a
                        href={`https://www.ncbi.nlm.nih.gov/datasets/genome/${item.assembly_accession}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {item.assembly_accession}
                      </a>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {motifDetails && (
        <div className="modal-overlay" onClick={() => setMotifDetails(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title"> {motifDetails?.name} </h5>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setMotifDetails(null)}
              >
                X
              </button>
            </div>
            <div className="modal-body">
              {motifDetails?.matrix_id && (
                <div className="modal-logo">
                  <img
                    src={`${urls?.JASPAR_LOGOS_URL}${motifDetails?.matrix_id}.svg`}
                    alt={`${motifDetails?.name} Logo`}
                    className="modal-logo-img"
                  />
                </div>
              )}
              <p>
                <strong>Transcription Factor Class: </strong>
                {motifDetails?.class_column}
              </p>
              <p>
                <strong>Family: </strong> {motifDetails?.family}
              </p>
              <p>
                <strong>Species: </strong> {motifDetails?.species}
              </p>
              <a
                href={`${urls?.JASPAR_URL}${motifDetails?.matrix_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="modal-link"
              >
                More Info
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="pagination-controls text-center mt-4 d-flex justify-content-center align-items-center">
        <button
          className="btn btn-outline-primary me-2"
          onClick={() => setPage(1)}
          disabled={page === 1 || loading}
        >
          First
        </button>
        <button
          className="btn btn-outline-primary"
          onClick={() => setPage(Math.max(page - 1, 1))}
          disabled={page === 1 || loading}
        >
          Previous
        </button>

        <span className="mx-3">
          Page{' '}
          {isPageInputActive ? (
            <input
              ref={pageInputRef}
              type="number"
              className="form-control form-control-sm d-inline-block"
              style={{ width: '70px', textAlign: 'center' }}
              value={goToPageInput}
              onChange={(e) => setGoToPageInput(e.target.value)}
              onBlur={handleGoToPage} // Triggers when clicking away
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGoToPage();
                if (e.key === 'Escape') setIsPageInputActive(false);
              }}
              min="1"
              max={totalRecords}
            />
          ) : (
            <span
              onClick={handleActivatePageInput}
              style={{
                cursor: 'pointer',
                color: '#0d6efd',
                textDecoration: 'underline',
                userSelect: 'none',
              }}
              title="Click to go to a specific page"
            >
              {page}
            </span>
          )}{' '}
          of {totalRecords > 0 ? totalRecords : 1}
        </span>

        <button
          className="btn btn-outline-primary"
          onClick={() => setPage(Math.min(page + 1, totalRecords))}
          disabled={page === totalRecords || totalRecords === 0 || loading}
        >
          Next
        </button>
        <button
          className="btn btn-outline-primary ms-2"
          onClick={() => setPage(totalRecords)}
          disabled={page === totalRecords || totalRecords === 0 || loading}
        >
          Last
        </button>
      </div>
    </div>
  );
};

export default DataTableMotif;
