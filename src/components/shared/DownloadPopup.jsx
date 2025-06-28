import React from "react";

const Popup = ({ onClose }) => {
    const handleRedirect = () => {
        // Redirect to the full data page
        window.location.href = "/downloads";
    };

    const handleClose = () => {
        // Notify the parent to close the popup
        if (onClose) {
            onClose();
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <h2>Limited Data Downloaded</h2>
                <p>
                    Only the current page data have been downloaded. You can view
                    the full dataset on another page.
                </p>
                <button style={styles.button} onClick={handleRedirect}>
                    View Full Dataset
                </button>
                <button style={styles.buttonClose} onClick={handleClose}>
                    Close
                </button>
            </div>
        </div>
    );
};

export default Popup;

const styles = {
    overlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
    },
    modal: {
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
        textAlign: "center",
        maxWidth: "400px",
        width: "80%",
    },
    button: {
        margin: "10px",
        padding: "10px 20px",
        backgroundColor: "#007BFF",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
    },
    buttonClose: {
        margin: "10px",
        padding: "10px 20px",
        backgroundColor: "#DC3545",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
    },
};
