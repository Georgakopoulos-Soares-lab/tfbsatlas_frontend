// src/pages/Visualizations.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import '../styles/Visualizations.css';

/* child charts */
import MotifDensityBarChart from '../components/MotifDensityBarChart';
import TfFamilySunburstChart from '../components/TfFamilySunburstChart';
import TfClassDensityPlot from '../components/TfClassDensityPlot';
import DensityHeatmapPerOrder from '../components/DensityHeatmapPerOrder'; // <-- 1. IMPORT

/* static species list for selectors */
import joinedData from '../constants/static/joined.json';

const Visualizations = () => {
  /* ... (all existing state and useEffect hooks for the TSS plot remain unchanged) ... */
  const speciesOptions = joinedData.map((s) => ({
    value: s.assembly_accession,
    label: s.organism_name,
  }));

  const [tssSpeciesObject, setTssSpeciesObject] = useState(
    speciesOptions.find((o) => o.value === 'GCA_000001405') || speciesOptions[0]
  );

  const [tssPlotData, setTssPlotData] = useState(null);
  const [loadingTss, setLoadingTss] = useState(false);
  const [errorTss, setErrorTss] = useState(null);

  useEffect(() => {
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
        if (data.plot) {
          setTssPlotData(JSON.parse(data.plot));
        } else {
          throw new Error(data.error || 'Unknown error');
        }
      } catch (err) {
        console.error('Error fetching TSS density plot:', err);
        setErrorTss('Failed to fetch TSS density plot.');
      } finally {
        setLoadingTss(false);
      }
    };

    fetchTssDensityData(tssSpeciesObject?.value);
  }, [tssSpeciesObject]);

  useEffect(() => {
    if (tssPlotData && window.Plotly) {
      const el = document.getElementById('plotly-tss-container');
      if (el) window.Plotly.react(el, tssPlotData.data, tssPlotData.layout);
    }
  }, [tssPlotData]);

  return (
    <div className="visualizations-page-container">
      <div className="header text-center">
        <h1 className="fancy-title mt-5">Visualizations</h1>
        <p className="subtitle">
          Explore transcription factor activity across different species and
          conditions.
        </p>
      </div>

      <div className="visualization-section">
        {/* ------------------ COLUMN 1: Sunburst | COLUMN 2: Bar ------------------ */}
        <div className="two-column-layout">
          <div className="column-left">
            <TfFamilySunburstChart />
          </div>

          <div className="column-right">
            <MotifDensityBarChart />
          </div>
        </div>

        {/* ------------------ EXTRA ROW: TF-Class plot & Heatmap ------------- */}
        <div className="two-column-layout" style={{ marginTop: '2rem' }}>
          <div className="column-left">
            <TfClassDensityPlot />
          </div>

          <div className="column-right">
            {/* <-- 2. REPLACE PLACEHOLDER --> */}
            <DensityHeatmapPerOrder />
          </div>
        </div>

        {/* ------------------ TSS Density Plot (with its own selector) ------------ */}
        <div className="two-column-layout" style={{ marginTop: '2rem' }}>
          <div className="column-left" style={{ flex: '1 1 100%' }}>
            <h3 className="chart-title">TSS Density Plot</h3>
            <p className="chart-description">
              Transcriptional activity near transcription-start sites for the
              selected species.
            </p>

            <div
              className="selector-container"
              style={{ marginBottom: '1rem' }}
            >
              <label className="selector-label">
                Select a Species for TSS Plot
              </label>
              <Select
                className="custom-select"
                options={speciesOptions}
                value={tssSpeciesObject}
                onChange={(opt) => setTssSpeciesObject(opt)}
                placeholder="Select a species…"
                isClearable
              />
            </div>

            {loadingTss && <p className="loading">Loading TSS plot…</p>}
            {errorTss && <p className="error">{errorTss}</p>}

            <div
              id="plotly-tss-container"
              style={{ width: '100%', minHeight: '700px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Visualizations;
