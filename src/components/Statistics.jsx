import React, { useState } from 'react';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import '../styles/Home_Components.css';
import { data_statistics } from '../constants/statistics';
import {
  species_categories,
  motif_categories,
  motif_family_initial,
} from '../constants/categories';


ChartJS.register(
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement
);

const InfoPopup = ({ isOpen, onClose, title, data }) => {
  if (!isOpen) return null; // Don't render if not open

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2 className="popup-title">{title}</h2>
        <ul className="popup-list">
          {data.map((item, index) => (
            <li key={index} className="popup-item">
              {item}
            </li>
          ))}
        </ul>
        <button className="popup-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

const Statistics = () => {
  // Species Categories Popup
  const [popupState, setPopupState] = useState({
    isOpen: false,
    title: '',
    data: [],
  });

  const openPopup = (title, data) => {
    setPopupState({ isOpen: true, title, data });
  };

  const closePopup = () => {
    setPopupState({ ...popupState, isOpen: false });
  };

  return (
    <div className="mt-5">
      <h1 className="fancy-title-medium text-center">
        Motif and Species Statistics
      </h1>
      <div className="statistics-box">
        <div
          className="stat-card cursor-pointer"
          onClick={() =>
            openPopup('Mammalian Species', species_categories?.species)
          }
        >
          <h2>Total mammalian assemblies</h2>
          <p>{data_statistics.total_species}</p>
        </div>
        <div
          className="stat-card cursor-pointer"
          onClick={() => openPopup('Species Orders', species_categories?.order)}
        >
          <h2>Total Orders</h2>
          <p>{data_statistics.total_species_orders}</p>
        </div>
        <div
          className="stat-card cursor-pointer"
          onClick={() => openPopup('Families', species_categories?.family)}
        >
          <h2>Total Families</h2>
          <p>{data_statistics.total_species_families}</p>
        </div>
        <div
          className="stat-card cursor-pointer"
          onClick={() => openPopup('Species Genera', species_categories?.genus)}
        >
          <h2>Total Genera</h2>
          <p>{data_statistics.total_species_genera}</p>
        </div>  
        <div className="stat-card">
          <h2>Total Motifs Analyzed</h2>
          <p>{data_statistics.total_motifs}</p>
        </div>
        <div
          className="stat-card cursor-pointer"
          onClick={() => openPopup('Motif Classes', motif_categories?.class)}
        >
          <h2>Total Motif Classes</h2>
          <p>{data_statistics.total_motif_classes}</p>
        </div>
        <div
          className="stat-card cursor-pointer"
          onClick={() => openPopup('Motif Families', motif_categories?.family)}
        >
          <h2>Total Motif Families</h2>
          <p>{data_statistics.total_motif_families}</p>
        </div>
        <div className="stat-card">
          <h2>Total Binding Sites</h2>
          <p>{data_statistics.binding_sites}</p>
        </div>
      </div>
      {/* <div className="statistics-container">
                <PieChartWithDrilldown />
                <CommonTranscriptionFactors />
            </div> */}
      <InfoPopup
        isOpen={popupState.isOpen}
        onClose={closePopup}
        title={popupState.title}
        data={popupState.data}
      />
    </div>
  );
};

export default Statistics;
