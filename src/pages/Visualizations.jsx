// src/pages/Visualizations.js
import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import '../styles/Visualizations.css';

/* child charts */
import MotifDensityBarChart from '../components/MotifDensityBarChart';
import TfFamilySunburstChart from '../components/TfFamilySunburstChart';
import TfClassDensityPlot from '../components/TfClassDensityPlot';
import DensityHeatmapPerOrder from '../components/DensityHeatmapPerOrder';

/* static data for selectors and charts */
import joinedData from '../constants/static/joined.json';
import tssPlotRawData from '../constants/tss_t2t_data.json'; // New data import

const Visualizations = () => {
  // Options for the species selector, derived from joined.json
  const speciesOptions = joinedData
    .filter((s) => s.organism_name.includes('T2T'))
    .map((s) => ({
      value: s.assembly_accession,
      label: s.organism_name,
    }));

  // --- START: TSS Enrichment Plot Logic ---

  // State for the selected species in the dropdown
  const [tssSpeciesObject, setTssSpeciesObject] = useState(
    speciesOptions.find((o) => o.value === 'GCA_000001405') || speciesOptions[0]
  );

  // State to hold the generated Plotly chart configuration (data and layout)
  const [tssChartConfig, setTssChartConfig] = useState({
    data: [],
    layout: {},
  });
  // State for handling errors, e.g., if data for a species is not available
  const [errorTss, setErrorTss] = useState(null);

  // Effect hook to generate the chart configuration whenever the selected species changes
  useEffect(() => {
    const generateTssPlot = (assemblyId) => {
      // If no species is selected, clear the chart and any errors
      if (!assemblyId) {
        setTssChartConfig({ data: [], layout: {} });
        setErrorTss(null);
        return;
      }

      // Retrieve the data for the selected assembly ID from the imported JSON
      const aggregate_data = tssPlotRawData[assemblyId];

      // If no data exists for the selected species, set an error message
      if (!aggregate_data || aggregate_data.length === 0) {
        setErrorTss(
          `TSS enrichment data is not available for ${
            tssSpeciesObject?.label || 'the selected species'
          }.`
        );
        setTssChartConfig({ data: [], layout: {} }); // Clear the chart config
        return;
      }

      setErrorTss(null); // Clear any previous errors if data is found

      const z_score = 1.96; // for 95% confidence interval

      // Prepare data arrays for Plotly traces
      const x_values = aggregate_data.map((d) => d.relative_pos);
      const enrichment_values = aggregate_data.map((d) => d.enrichment);

      // 1. Main enrichment line trace
      const enrichmentTrace = {
        x: x_values,
        y: enrichment_values,
        mode: 'lines',
        line: { color: '#222F39', width: 3 },
        opacity: 1,
        name: 'Enrichment',
        customdata: aggregate_data.map((d) => [
          d.mean_count,
          d.total_count,
          d.n_windows,
          d.enrichment_sem * z_score,
        ]),
        hovertemplate:
          '<b>%{x} bp from TSS</b><br>' +
          '<b>Enrichment:</b> <b>%{y:.2f}x</b><br>' +
          '<b>Motifs/bin:</b> %{customdata[0]:.1f}<br>' +
          '<b>Total motifs:</b> %{customdata[1]:,.0f}<br>' +
          '<b>95% CI:</b> ±%{customdata[3]:.3f}<br>' +
          '<extra></extra>',
      };

      // 2. Upper bound of the confidence interval (invisible line)
      const ciUpperTrace = {
        x: x_values,
        y: aggregate_data.map((d) => d.enrichment_ci_upper),
        mode: 'lines',
        line: { width: 0 },
        showlegend: false,
        hoverinfo: 'skip',
      };

      // 3. Lower bound of the confidence interval (invisible line, provides fill)
      const ciLowerTrace = {
        x: x_values,
        y: aggregate_data.map((d) => d.enrichment_ci_lower),
        mode: 'lines',
        line: { width: 0 },
        fill: 'tonexty', // Fills the area to the previous trace (ciUpperTrace)
        fillcolor: 'rgba(34, 47, 57, 0.2)',
        showlegend: false,
        hoverinfo: 'skip',
      };

      // Define the layout for the plot
      const layout = {
        xaxis: {
          title: { text: 'Distance from TSS (bp)', font: { size: 14 } },
          range: [-1000, 1000],
          showgrid: true,
          gridcolor: 'rgba(128, 128, 128, 0.3)',
          showline: true,
          linecolor: 'black',
          fixedrange: true,
        },
        yaxis: {
          title: { text: 'Enrichment', font: { size: 14 } },
          showgrid: true,
          gridcolor: 'rgba(128, 128, 128, 0.3)',
          showline: true,
          linecolor: 'black',
          fixedrange: true,
        },
        shapes: [
          // Vertical line at x=0
          {
            type: 'line',
            x0: 0,
            x1: 0,
            y0: 0,
            y1: 1,
            yref: 'paper',
            line: { color: '#4C95D3', dash: 'dash', width: 1.5 },
            opacity: 1,
          },
          // Horizontal line at y=1 (baseline enrichment)
          {
            type: 'line',
            x0: -1000,
            x1: 1000,
            y0: 1,
            y1: 1,
            line: { color: '#4C95D3', dash: 'dash', width: 1.5 },
            opacity: 1,
          },
        ],
        plot_bgcolor: 'transparent',
        paper_bgcolor: 'transparent',
        showlegend: false,
        margin: { l: 60, r: 20, t: 20, b: 60 },
        hovermode: 'closest',
        dragmode: 'zoom',
      };

      // Update the state with the complete chart configuration
      setTssChartConfig({
        data: [enrichmentTrace, ciUpperTrace, ciLowerTrace],
        layout,
      });
    };

    generateTssPlot(tssSpeciesObject?.value);
  }, [tssSpeciesObject]); // Re-run this effect when the selected species changes

  // Effect hook to render or update the Plotly chart in the DOM
  useEffect(() => {
    const el = document.getElementById('plotly-tss-container');
    if (el && window.Plotly) {
      if (tssChartConfig.data.length > 0) {
        // If there's a valid config, render the plot
        window.Plotly.react(el, tssChartConfig.data, tssChartConfig.layout, {
          responsive: true,
        });
      } else {
        // If the config is empty (due to error or no selection), clear the div
        window.Plotly.purge(el);
      }
    }
  }, [tssChartConfig]); // Re-run this effect when the chart configuration changes

  // --- END: TSS Enrichment Plot Logic ---

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
            <DensityHeatmapPerOrder />
          </div>
        </div>

        {/* ------------------ TSS Enrichment Plot (with its own selector) ------------ */}
        <div className="two-column-layout" style={{ marginTop: '2rem' }}>
          <div className="column-left" style={{ flex: '1 1 100%' }}>
            <h3 className="chart-title">TSS Enrichment Plot</h3>
            <p className="chart-description">
              Motif enrichment relative to transcription start sites (TSS) for
              the selected species.
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

            {/* Display error message if data is not available */}
            {errorTss && <p className="error">{errorTss}</p>}

            {/* Container for the Plotly chart */}
            <div
              id="plotly-tss-container"
              style={{ width: '100%', minHeight: '600px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Visualizations;
