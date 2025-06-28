import React, { useState } from 'react';
import '../../styles/Datatable.css';


const InstructionsSection = () => {
    const [showInstructions, setShowInstructions] = useState(false);

    return (
        <div className="instructions-container text-center my-5">
            <button
                className="btn btn-primary rounded-pill shadow-sm"
                onClick={() => setShowInstructions(!showInstructions)}
            >
                {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
            </button>

            {showInstructions && (
                <div className="instructions-content mt-3">
                    <ul className="text-start">
                        <li>
                            <strong>Filter Data:</strong> Use the filter option to narrow down results by criteria like species, transcription factor name, or chromosome.
                        </li>
                        <li>
                            <strong>Select Columns:</strong> Customize the view by selecting or deselecting columns to display.
                        </li>
                        <li>
                            <strong>Download Data:</strong> Export up to 50 MB of filtered data in CSV, JSON, or Parquet format using the download button.
                        </li>
                        <li>
                            <strong>Sorting:</strong> Click column headers to sort data in ascending or descending order.
                        </li>
                        <li>
                            <strong>Rows Per Page:</strong> Adjust the number of rows displayed using the dropdown menu.
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default InstructionsSection;
