// import React from "react";
// import {
//     Chart as ChartJS,
//     LineElement,
//     CategoryScale,
//     LinearScale,
//     PointElement,
//     Title,
//     Tooltip,
//     Legend,
// } from "chart.js";
// import { Line } from "react-chartjs-2";
// import annotationPlugin from "chartjs-plugin-annotation";
// import { tss_result } from "../constants/dynamic_figures/tss_result";

// // Register Chart.js components and plugins
// ChartJS.register(
//     LineElement,
//     CategoryScale,
//     LinearScale,
//     PointElement,
//     Title,
//     Tooltip,
//     Legend,
//     annotationPlugin
// );

// const TranscriptionPlot = () => {

//     // Access the plot JSON from the tss_result object
//     const plotData = JSON.parse(tss_result.plot);

//     // Extract the first data trace (assuming the required data is in the first trace)
//     const xValues = plotData.data[0].x;
//     const yValues = plotData.data[0].y;

//     // Log the results to verify
//     console.log("X Values:", xValues);
//     console.log("Y Values:", yValues);

//     const data = {
//         labels: xValues,
//         datasets: [
//             {
//                 label: "TSS",
//                 data: yValues,
//                 borderColor: "lightgreen",
//                 borderWidth: 1.7,
//                 tension: 0.1, // Makes the line slightly curved
//                 pointRadius: 0, // Removes data points
//             },
//         ],
//     };

//     const options = {
//         responsive: true,
//         plugins: {
//             title: {
//                 display: true,
//                 text: "Transcription Start Site",
//                 font: {
//                     size: 24,
//                 },
//             },
//             legend: {
//                 display: false,
//             },
//             annotation: {
//                 annotations: {
//                     verticalLine: {
//                         type: "line",
//                         xMin: 0,
//                         xMax: 0,
//                         borderColor: "black",
//                         borderWidth: 2,
//                         borderDash: [6, 4], // Dashed line
//                         label: {
//                             enabled: true,
//                             content: "TSS (0)",
//                             position: "start",
//                             backgroundColor: "rgba(0,0,0,0.6)",
//                             color: "white",
//                         },
//                     },
//                     horizontalLine: {
//                         type: "line",
//                         yMin: 1,
//                         yMax: 1,
//                         borderColor: "red",
//                         borderWidth: 1.5,
//                         label: {
//                             enabled: true,
//                             content: "Enrichment (1)",
//                             position: "end",
//                             backgroundColor: "rgba(255,0,0,0.6)",
//                             color: "white",
//                         },
//                     },
//                 },
//             },
//         },
//         scales: {
//             x: {
//                 title: {
//                     display: true,
//                     text: "Position",
//                     font: {
//                         size: 16,
//                     },
//                 },
//                 ticks: {
//                     callback: (value) => (value % 100 === 0 ? value : ""), // Show ticks every 100 units
//                 },
//             },
//             y: {
//                 title: {
//                     display: true,
//                     text: "Enrichment",
//                     font: {
//                         size: 16,
//                     },
//                 },
//                 beginAtZero: true,
//             },
//         },
//     };

//     return <Line data={data} options={options} />;
// };

// export default TranscriptionPlot;

import React, { useEffect, useRef } from 'react';
import { tss_result } from "../constants/dynamic_figures/tss_result";

const TranscriptionPlot = () => {
    const plotRef = useRef(null);
    //     // Access the plot JSON from the tss_result object
    const plotData = JSON.parse(tss_result.plot);

    //     // Extract the first data trace (assuming the required data is in the first trace)
    const xValues = plotData.data[0].x;
    const yValues = plotData.data[0].y;


    useEffect(() => {
        // Ensure Plotly is loaded
        if (window.Plotly && tss_result) {
            const plotData = JSON.parse(tss_result.plot); // Parse the JSON string from the backend

            // Render the plot
            window.Plotly.react(plotRef.current, plotData.data, plotData.layout);
        } else {
            console.error('Plotly or tssResult is not available');
        }
    }, [tss_result]);

    return (
        <div>
            <h2>Transcription Start Site Plot</h2>
            <div ref={plotRef} style={{ width: '100%', height: '700px' }}></div>
        </div>
    );
};




export default TranscriptionPlot;
