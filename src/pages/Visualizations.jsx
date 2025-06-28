import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import '../styles/Visualizations.css';

// --- THE CORE FIX: Use joined.json as the single source of truth ---
import joinedData from '../constants/static/joined.json';

// Import all chart components
import MotifPieChart from '../components/MotifPieChart';
import CommonTranscriptionFactors from '../components/CommonTranscriptionFactors';
import MotifDensityBarChart from '../components/MotifDensityBarChart';
import TfFamilySunburstChart from '../components/TfFamilySunburstChart';

const Visualizations = () => {
  // --- Create dropdown options directly and reliably from joined.json ---
  const speciesOptions = joinedData.map((species) => ({
    value: species.assembly_accession, // The Assembly ID (e.g., "GCF_029289425")
    label: species.organism_name,      // The display name (e.g., "Pan paniscus")
  }));

  // Initialize state with a valid default object to prevent any initial render errors.
  const [selectedSpeciesObject, setSelectedSpeciesObject] = useState(() =>
    // Default to Homo sapiens, a reliable entry. Fallback to the first option.
    speciesOptions.find(o => o.value === 'GCA_000001405') || speciesOptions[0]
  );

  // State for the async TSS plot
  const [tssPlotData, setTssPlotData] = useState(null);
  const [loadingTss, setLoadingTss] = useState(false);
  const [errorTss, setErrorTss] = useState(null);

  // --- This useEffect hook will now work correctly ---
  useEffect(() => {
    // A log to confirm the state is valid on every change
    console.log('[Visualizations] Selected Species Object Changed:', selectedSpeciesObject);

    const fetchTssDensityData = async (assemblyId) => {
      if (!assemblyId) {
        setTssPlotData(null);
        return;
      }
      setLoadingTss(true);
      setErrorTss(null);
      try {
        const { data } = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/density_plot`,
          { assembly_id: assemblyId, color: 'lightgreen', lw: 1.7 },
          { headers: { 'Content-Type': 'application/json' } }
        );
        if (data.plot) setTssPlotData(JSON.parse(data.plot));
        else throw new Error(data.error || 'Unknown error');
      } catch (err) {
        console.error('Error fetching TSS density plot:', err);
        setErrorTss('Failed to fetch TSS density plot.');
      } finally {
        setLoadingTss(false);
      }
    };

    // Ensure we have a valid object before trying to fetch
    if (selectedSpeciesObject?.value) {
      fetchTssDensityData(selectedSpeciesObject.value);
    }
  }, [selectedSpeciesObject]);

  // Re-render Plotly chart when data arrives
  useEffect(() => {
    if (tssPlotData && window.Plotly) {
      const container = document.getElementById('plotly-tss-container');
      if (container) window.Plotly.react(container, tssPlotData.data, tssPlotData.layout);
    }
  }, [tssPlotData]);

  const handleSpeciesChange = (opt) => {
    setSelectedSpeciesObject(opt);
  };

  return (
    <div className="visualizations-page-container">
      <div className="header text-center">
        <h1 className="fancy-title mt-5">Visualizations</h1>
        <p className="subtitle">Explore transcription factor activity across different species and conditions.</p>
      </div>

      <div className="visualization-section">
        <MotifDensityBarChart />
      </div>

      <div className="visualization-section">
        <h2 className="text-center fancy-title-medium mt-3">Detailed Species Analysis</h2>

        <div className="selector-container">
          <label className="selector-label">Select a Species to Analyze</label>
          <Select
            className="custom-select"
            options={speciesOptions}
            value={selectedSpeciesObject}
            onChange={handleSpeciesChange}
            placeholder="Select a Species..."
            isClearable
          />
        </div>

        {selectedSpeciesObject ? (
          <>
            <h3 className="text-center" style={{ fontWeight: 300, marginBottom: '2rem' }}>
              Displaying detailed charts for: <strong>{selectedSpeciesObject.label}</strong>
            </h3>

            <div className="two-column-layout">
              {/* Sunburst Chart receives the ASSEMBLY ID */}
              <div className="column-left">
                <h3 className="chart-title">TF Family Density Breakdown</h3>
                <p className="chart-description">Hierarchical view of motif density by TF Class and Family.</p>
                <TfFamilySunburstChart speciesAssemblyId={selectedSpeciesObject.value} />
              </div>

              {/* Pie Chart receives the ORGANISM NAME */}
              <div className="column-right">
                <h3 className="chart-title">Motif Distribution</h3>
                <p className="chart-description">Distribution of motifs by TF Class (outer ring) and Family (inner ring).</p>
                <MotifPieChart speciesName={selectedSpeciesObject.label} />
              </div>
            </div>

            <div className="two-column-layout" style={{ marginTop: '2rem' }}>
              {/* Common TFs receives the ASSEMBLY ID */}
              <div className="column-left" style={{ flex: '1 1 100%' }}>
                <h3 className="chart-title">Most Common Transcription Factor Families</h3>
                <p className="chart-description">Top TF families based on occurrence count in the selected species.</p>
                <CommonTranscriptionFactors
                  assemblyId={selectedSpeciesObject.value}
                  organismLabel={selectedSpeciesObject.label}
                />
              </div>
            </div>

            <div className="two-column-layout" style={{ marginTop: '2rem' }}>
              {/* TSS Density Plot receives the ASSEMBLY ID */}
              <div className="column-left" style={{ flex: '1 1 100%' }}>
                <h3 className="chart-title">TSS Density Plot</h3>
                <p className="chart-description">Visualize transcriptional activity near start sites for the selected species.</p>
                {loadingTss && <p className="loading">Loading TSS plot...</p>}
                {errorTss && <p className="error">{errorTss}</p>}
                <div id="plotly-tss-container" style={{ width: '100%', minHeight: '700px' }} />
              </div>
            </div>
          </>
        ) : (
          <div className="text-center p-5"><p>Please select a species to view detailed analytics.</p></div>
        )}
      </div>
    </div>
  );
};

export default Visualizations;