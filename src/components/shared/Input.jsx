import React, { useState } from "react";

const CustomInput = ({
    type = "text", // Input type (text, email, password, etc.)
    placeholder = "Enter text", // Placeholder text
    value, // Current input value
    onChange, // Handler for input change
    icon, // Optional icon component (e.g., FontAwesome, Material Icons)
    errorMessage, // Optional error message for validation
    style, // Optional additional styles
}) => {
    const [focused, setFocused] = useState(false); // Track focus state

    const inputContainerStyle = {
        display: "flex",
        alignItems: "center",
        position: "absolute", // Use relative positioning to prevent layout issues
        backgroundColor: "#fff",
        border: `2px solid ${focused ? "#007bff" : "#ccc"}`,
        borderRadius: "8px", // Rounded corners
        padding: "10px",
        zIndex: 1,
        transition: "border-color 0.3s, box-shadow 0.3s",
        boxShadow: focused ? "0 2px 6px rgba(0, 123, 255, 0.3)" : "0 1px 3px rgba(0, 0, 0, 0.1)",
        marginTop: '2px',
        width: '250px',
        minWidth: '180px',
        ...style, // Allow overriding styles from props
    };

    const iconStyle = {
        marginRight: "10px",
        fontSize: "18px",
        color: "#666",
    };

    const inputFieldStyle = {
        flex: 1,
        border: "none",
        outline: "none",
        fontSize: "14px",
        color: "#333",
        backgroundColor: "transparent",
    };

    const errorMessageStyle = {
        marginTop: "4px",
        fontSize: "12px",
        color: "#d9534f",
    };

    return (
        <div style={inputContainerStyle}>
            {icon && <span style={iconStyle}>{icon}</span>}
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                style={inputFieldStyle}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
            />
            {errorMessage && <span style={errorMessageStyle}>{errorMessage}</span>}
        </div>
    );
};

export default CustomInput;
