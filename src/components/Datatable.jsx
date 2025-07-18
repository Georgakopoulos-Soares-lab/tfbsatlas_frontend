import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import Dropdown from './shared/Dropdown';
import { InfoTooltip } from './shared/InfoTooltip';

import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/Datatable.css';
import { downloadSpeciesData } from '../utils/downloadDB';
import { urls } from '../constants/constants.js';
// --- MODIFICATION START ---
// Updated imports to use the new JSON data sources
import species from '../constants/static/joined.json';
import protein from '../constants/static/motif_metadata.json';
// --- MODIFICATION END ---
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

const DataTable = () => {
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

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    column: 'score',
    direction: 'asc',
  });

  // Filter states
  const [speciesName, setSpeciesName] = useState('');
  const [motifId, setMotifId] = useState('');
  const [motifAltId, setMotifAltId] = useState('');
  const [sequenceName, setSequenceName] = useState('');
  const [scoreRange, setScoreRange] = useState({ min: '', max: '' });
  const [queryStart, setQueryStart] = useState('');
  const [queryEnd, setQueryEnd] = useState('');
  const [strandFilter, setStrandFilter] = useState('both');
  const [pValueRange, setPValueRange] = useState({ min: '', max: '' });
  const [qValueRange, setQValueRange] = useState({ min: '', max: '' });
  const [matchedSequence, setMatchedSequence] = useState('');
  const [order, setOrder] = useState('');
  const [family, setFamily] = useState('');
  const [genus, setGenus] = useState('');

  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestionBox, setActiveSuggestionBox] = useState('');
  const filtersRef = useRef(null);
  // Ref to track if it's the initial mount to prevent double-fetching
  const isInitialMount = useRef(true);

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
    order: true,
    family: true,
    genus: true,
  });

  // State to control visibility of filter section
  const [filtersVisible, setFiltersVisible] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const taxonomyColumn = queryParams.get('taxonomy_column');
  const taxonomyValue = queryParams.get('taxonomy_value');
  const species_name_query_param = queryParams.get('species_id');
  const species_gerular_name_query_param = queryParams.get('species_name');

  const tooltipText =
    'Only the current page will be downloaded. For full dataset download visit the Downloads page';

  const [showPopup, setShowPopup] = useState(false);
  const handleClosePopup = () => setShowPopup(false);

  useEffect(() => {
    if (taxonomyColumn && taxonomyValue) {
      let speciesInfo;
      // Clear previous taxonomy settings to avoid residue
      setOrder('');
      setFamily('');
      setGenus('');
      setSpeciesName('');

      switch (taxonomyColumn) {
        case 'species':
          speciesInfo = species.find((s) => s.organism_name === taxonomyValue);
          if (speciesInfo) {
            setSpeciesName(speciesInfo.organism_name);
            setGenus(speciesInfo.genus);
            setFamily(speciesInfo.family);
            setOrder(speciesInfo.order);
          }
          break;
        case 'genus':
          speciesInfo = species.find((s) => s.genus === taxonomyValue);
          if (speciesInfo) {
            setGenus(speciesInfo.genus);
            setFamily(speciesInfo.family);
            setOrder(speciesInfo.order);
          }
          break;
        case 'family':
          speciesInfo = species.find((s) => s.family === taxonomyValue);
          if (speciesInfo) {
            setFamily(speciesInfo.family);
            setOrder(speciesInfo.order);
          }
          break;
        case 'order':
          setOrder(taxonomyValue);
          break;
        default:
          break;
      }
    }
  }, [taxonomyColumn, taxonomyValue]);

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

  const handleAutosuggestChange = (e, field, setter) => {
    const { value } = e.target;
    setter(value);

    const suggestionConfig = {
      speciesName: { data: species, key: 'organism_name' },
      genus: { data: species, key: 'genus' },
      order: { data: species, key: 'order' },
      family: { data: species, key: 'family' },
      motifId: { data: protein, key: 'motif_id' },
      motifAltId: { data: protein, key: 'name' },
    };

    const config = suggestionConfig[field];
    if (!config || !value.trim()) {
      setActiveSuggestionBox('');
      setSuggestions([]);
      return;
    }

    let sourceData = config.data;
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

  const handleActivatePageInput = () => {
    if (loading || totalRecords === 0) return;
    setGoToPageInput(page.toString());
    setIsPageInputActive(true);
  };

  const handleGoToPage = () => {
    const pageNumber = parseInt(goToPageInput, 10);
    setIsPageInputActive(false);
    if (
      pageNumber &&
      pageNumber >= 1 &&
      pageNumber <= totalRecords &&
      pageNumber !== page
    ) {
      setPage(pageNumber);
    }
    setGoToPageInput('');
  };

  useEffect(() => {
    if (isPageInputActive && pageInputRef.current) {
      pageInputRef.current.focus();
      pageInputRef.current.select();
    }
  }, [isPageInputActive]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
        taxonomy_column:
          taxonomyColumn === 'species'
            ? 'organism_name'
            : taxonomyColumn === 'order'
              ? 'order_taxon'
              : taxonomyColumn,
        taxonomy_value: taxonomyValue?.trim(),
        species_name: speciesName?.trim() || undefined,
        motif_id: motifId?.toString()?.trim() || undefined,
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
        order: order?.trim() || undefined,
        family: family?.trim() || undefined,
        genus: genus?.trim() || undefined,
        species_id_query_param: species_name_query_param || undefined,
      };

      const filteredParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined)
      );
      const queryParams = new URLSearchParams(filteredParams);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/data/filter?${queryParams.toString()}`,
        { timeout: 30000 }
      );
      const result = response?.data;
      if (result.data) {
        setData(result.data);
        setTotalRecords(result?.pagination?.totalPages || 0);
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
    speciesName,
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
    order,
    family,
    genus,
    species_name_query_param,
  ]);

  useEffect(() => {
    if ((taxonomyColumn && taxonomyValue) || species_name_query_param) {
      fetchData();
    }
  }, [taxonomyColumn, taxonomyValue, species_name_query_param, fetchData]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchData();
  }, [page, perPage, fetchData]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleClearFilters = () => {
    setMotifId('');
    setMotifAltId('');
    setSequenceName('');
    setQueryStart('');
    setQueryEnd('');
    setStrandFilter('both');
    setScoreRange({ min: '', max: '' });
    setPValueRange({ min: '', max: '' });
    setQValueRange({ min: '', max: '' });
    setMatchedSequence('');

    const lockedLevels = ['order', 'family', 'genus', 'species'];
    if (!lockedLevels.includes(taxonomyColumn)) setOrder('');
    if (!lockedLevels.slice(1).includes(taxonomyColumn)) setFamily('');
    if (!lockedLevels.slice(2).includes(taxonomyColumn)) setGenus('');
    if (taxonomyColumn !== 'species') setSpeciesName('');

    setPage(1);
    setTimeout(fetchData, 0);
  };

  const handleColumnToggle = (column) => {
    setColumnsVisibility((prev) => ({ ...prev, [column]: !prev[column] }));
  };

  const [motifDetails, setMotifDetails] = useState(null);

  // --- MODIFICATION START ---
  // The fetchMotifDetails function is removed and its logic is integrated
  // into handleMotifClick to use the locally imported 'protein' JSON data.
  const handleMotifClick = (motifId) => {
    // Find the motif details from the imported 'protein' JSON data.
    const details = protein.find((p) => p.motif_id === motifId);

    if (details) {
      setMotifDetails(details);
    } else {
      // Log an error if the motif ID is not found in the local data.
      console.error(`Details for motif ID ${motifId} not found in local JSON.`);
      // Ensure the modal doesn't show or shows an error state.
      setMotifDetails(null);
    }
  };
  // --- MODIFICATION END ---

  const handleDownload = async (format) => {
    setLoading(true);
    downloadSpeciesData(data, columnsVisibility, format);
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

  const getSelectableColumns = () => {
    const allCols = [
      { label: 'Species', value: 'species' },
      { label: 'Genus', value: 'genus' },
      { label: 'Family', value: 'family' },
      { label: 'Order', value: 'order' },
      { label: 'Motif ID', value: 'motifId' },
      { label: 'TF Name', value: 'motifAltId' },
      { label: 'Sequence Name', value: 'sequenceName' },
      { label: 'Start', value: 'start' },
      { label: 'Stop', value: 'stop' },
      { label: 'Strand', value: 'strand' },
      { label: 'Score', value: 'score' },
      { label: 'P-value', value: 'pValue' },
      { label: 'Q-value', value: 'qValue' },
      { label: 'Matched Sequence', value: 'matchedSequence' },
    ];
    if (!taxonomyColumn) return allCols;
    const hidden = [];
    if (['species', 'genus', 'family', 'order'].includes(taxonomyColumn))
      hidden.push('order');
    if (['species', 'genus', 'family'].includes(taxonomyColumn))
      hidden.push('family');
    if (['species', 'genus'].includes(taxonomyColumn)) hidden.push('genus');
    if (taxonomyColumn === 'species') hidden.push('species');
    return allCols.filter((col) => !hidden.includes(col.value));
  };

  return (
    <div className={'table-container my-5'}>
      <h1 className="mb-4 text-center fancy-title">
        Genomic Data Table for{' '}
        {taxonomyValue || species_gerular_name_query_param}
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
            <label htmlFor="speciesName"> Species Name </label>
            <input
              type="text"
              id="speciesName"
              className="form-control"
              value={speciesName}
              onChange={(e) =>
                handleAutosuggestChange(e, 'speciesName', setSpeciesName)
              }
              readOnly={taxonomyColumn === 'species'}
              autoComplete="off"
            />
            {activeSuggestionBox === 'speciesName' &&
              suggestions.length > 0 && (
                <SuggestionList
                  suggestions={suggestions}
                  onSuggestionClick={(s) =>
                    handleSuggestionClick(s, setSpeciesName)
                  }
                />
              )}
          </div>
          <div className="col position-relative">
            <label htmlFor="motifId"> Motif ID </label>
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
                onSuggestionClick={(s) => handleSuggestionClick(s, setMotifId)}
              />
            )}
          </div>
          <div className="col position-relative">
            <label htmlFor="motifAltId"> TF Name </label>
            <input
              type="text"
              id="motifAltId"
              className="form-control"
              value={motifAltId}
              onChange={(e) =>
                handleAutosuggestChange(e, 'motifAltId', setMotifAltId)
              }
              autoComplete="off"
            />
            {activeSuggestionBox === 'motifAltId' && suggestions.length > 0 && (
              <SuggestionList
                suggestions={suggestions}
                onSuggestionClick={(s) =>
                  handleSuggestionClick(s, setMotifAltId)
                }
              />
            )}
          </div>
          <div className="col">
            <label htmlFor="matchedSequence"> Matched Sequence </label>
            <input
              type="text"
              id="matchedSequence"
              className="form-control"
              value={matchedSequence}
              onChange={(e) => {
                setMatchedSequence(e.target.value.replace(/[^a-zA-Z]/g, ''));
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
              <label htmlFor="order"> Order </label>
              <input
                type="text"
                id="order"
                className="form-control"
                value={order}
                onChange={(e) => handleAutosuggestChange(e, 'order', setOrder)}
                readOnly={['order', 'family', 'genus', 'species'].includes(
                  taxonomyColumn
                )}
                autoComplete="off"
              />
              {activeSuggestionBox === 'order' && suggestions.length > 0 && (
                <SuggestionList
                  suggestions={suggestions}
                  onSuggestionClick={(s) => handleSuggestionClick(s, setOrder)}
                />
              )}
            </div>
            <div className="col position-relative">
              <label htmlFor="family"> Family </label>
              <input
                type="text"
                id="family"
                className="form-control"
                value={family}
                onChange={(e) =>
                  handleAutosuggestChange(e, 'family', setFamily)
                }
                readOnly={['family', 'genus', 'species'].includes(
                  taxonomyColumn
                )}
                autoComplete="off"
              />
              {activeSuggestionBox === 'family' && suggestions.length > 0 && (
                <SuggestionList
                  suggestions={suggestions}
                  onSuggestionClick={(s) => handleSuggestionClick(s, setFamily)}
                />
              )}
            </div>
            <div className="col position-relative">
              <label htmlFor="genus"> Genus </label>
              <input
                type="text"
                id="genus"
                className="form-control"
                value={genus}
                onChange={(e) => handleAutosuggestChange(e, 'genus', setGenus)}
                readOnly={['genus', 'species'].includes(taxonomyColumn)}
                autoComplete="off"
              />
              {activeSuggestionBox === 'genus' && suggestions.length > 0 && (
                <SuggestionList
                  suggestions={suggestions}
                  onSuggestionClick={(s) => handleSuggestionClick(s, setGenus)}
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
              {columnsVisibility.species &&
                !['species'].includes(taxonomyColumn) && <th>Species</th>}
              {columnsVisibility.genus &&
                !['species', 'genus'].includes(taxonomyColumn) && (
                  <th>Genus</th>
                )}
              {columnsVisibility.family &&
                !['species', 'genus', 'family'].includes(taxonomyColumn) && (
                  <th>Family</th>
                )}
              {columnsVisibility.order &&
                !['species', 'genus', 'family', 'order'].includes(
                  taxonomyColumn
                ) && <th>Order</th>}
              {columnsVisibility.motifAltId && <th>TF Name</th>}
              {columnsVisibility.motifId && <th>Motif ID</th>}
              {columnsVisibility.sequenceName && <th>Chromosome</th>}
              {columnsVisibility.start && <th>Start</th>}
              {columnsVisibility.stop && <th>End</th>}
              {columnsVisibility.strand && <th>Strand</th>}
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
                  P-value {renderSortIcon('p_value')}
                </th>
              )}
              {columnsVisibility.qValue && (
                <th
                  onClick={() => handleSort('q_value')}
                  style={{ cursor: 'pointer' }}
                >
                  Q-value {renderSortIcon('q_value')}
                </th>
              )}
              {columnsVisibility.matchedSequence && <th>Matched Sequence</th>}
            </tr>
          </thead>
          <tbody className="text-center">
            {loading ? (
              <tr>
                <td
                  colSpan={
                    getSelectableColumns().filter(
                      (c) => columnsVisibility[c.value]
                    ).length
                  }
                  className="text-center"
                >
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    getSelectableColumns().filter(
                      (c) => columnsVisibility[c.value]
                    ).length
                  }
                  className="no-data-row"
                >
                  No data found
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={index}>
                  {/* --- MODIFICATION START --- */}
                  {columnsVisibility.species &&
                    !['species'].includes(taxonomyColumn) &&
                    (() => {
                      // Find species metadata from the imported joined.json
                      const speciesInfo = species.find(
                        (s) => s.organism_name === item.species_name
                      );
                      // Get the assembly accession if found
                      const assemblyAccession = speciesInfo
                        ? speciesInfo.assembly_accession
                        : null;

                      if (assemblyAccession) {
                        // If we have an accession, render a link
                        return (
                          <td>
                            <a
                              href={`https://www.ebi.ac.uk/ena/browser/view/${assemblyAccession}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {item.species_name}
                            </a>
                          </td>
                        );
                      } else {
                        // If no accession found, just render the name as text
                        return <td>{item.species_name}</td>;
                      }
                    })()}
                  {/* --- MODIFICATION END --- */}
                  {columnsVisibility.genus &&
                    !['species', 'genus'].includes(taxonomyColumn) && (
                      <td>{item.genus}</td>
                    )}
                  {columnsVisibility.family &&
                    !['species', 'genus', 'family'].includes(
                      taxonomyColumn
                    ) && <td>{item.family}</td>}
                  {columnsVisibility.order &&
                    !['species', 'genus', 'family', 'order'].includes(
                      taxonomyColumn
                    ) && <td>{item.order}</td>}
                  {columnsVisibility.motifAltId && <td>{item.motif_alt_id}</td>}
                  {columnsVisibility.motifId && (
                    <td
                      className="td_cursor"
                      onClick={() => handleMotifClick(item.motif_id)}
                    >
                      {item.motif_id}
                    </td>
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
              <h5 className="modal-title">{motifDetails?.name}</h5>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setMotifDetails(null)}
              >
                X
              </button>
            </div>
            <div className="modal-body">
              {motifDetails?.motif_id && (
                <div className="modal-logo">
                  <img
                    src={`${urls?.JASPAR_LOGOS_URL}${motifDetails?.motif_id}.svg`}
                    alt={`${motifDetails?.name} Logo`}
                    className="modal-logo-img"
                  />
                </div>
              )}
              <p>
                <strong>Transcription Factor Class: </strong>
                {motifDetails?.tf_class}
              </p>
              <p>
                <strong>Family: </strong>
                {motifDetails?.tf_family}
              </p>
              <p>
                <strong>Species: </strong>
                {motifDetails?.species_name}
              </p>
              <a
                href={`${urls?.JASPAR_URL}${motifDetails?.motif_id}`}
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
          className="btn btn-primary me-2"
          onClick={() => setPage(1)}
          disabled={page === 1 || loading}
        >
          First
        </button>
        <button
          className="btn btn-primary"
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
              onBlur={handleGoToPage}
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
          className="btn btn-primary"
          onClick={() => setPage(Math.min(page + 1, totalRecords))}
          disabled={page === totalRecords || totalRecords === 0 || loading}
        >
          Next
        </button>
        <button
          className="btn btn-primary ms-2"
          onClick={() => setPage(totalRecords)}
          disabled={page === totalRecords || totalRecords === 0 || loading}
        >
          Last
        </button>
      </div>
    </div>
  );
};

export default DataTable;
