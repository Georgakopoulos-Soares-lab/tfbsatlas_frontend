import clsx from "clsx";
import React, { useState, useEffect, useRef } from "react";
import CustomInput from "./Input";
import "../../styles/CustomDropdown.css";

const CustomDropdown = ({ options, defaultOption, onOptionSelect, showInput = true }) => {
    const [isOpen, setIsOpen] = useState(false); // State for toggling dropdown
    const [searchTerm, setSearchTerm] = useState(""); // Search term for filtering
    const [filteredOptions, setFilteredOptions] = useState([]); // Filtered options
    const [selectedOption, setSelectedOption] = useState(defaultOption || options[0]);
    const dropdownRef = useRef(null); // Ref for handling clicks outside dropdown
    const [inputValue, setInputValue] = useState("");

    // Initialize and sort options
    useEffect(() => {
        const sortedOptions = [...options].sort((a, b) => a.localeCompare(b));
        setFilteredOptions(sortedOptions);
    }, [options]);

    // Filter options when the search term changes
    useEffect(() => {
        const filtered = options.filter((option) =>
            option.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredOptions(filtered);
    }, [searchTerm, options]);

    const handleOptionClick = (option) => {
        setSelectedOption(option); // Update selected option
        setIsOpen(false); // Close dropdown
        onOptionSelect(option); // Notify parent of selection
    };

    const toggleDropdown = () => {
        setIsOpen((prev) => !prev); // Toggle dropdown visibility
    };

    useEffect(() => {
        // Close dropdown if clicked outside
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="custom-dropdown" ref={dropdownRef}>
            {/* Dropdown Header */}
            <div className="dropdown-header" onClick={toggleDropdown}>
                <span>{selectedOption || "Select an option"}</span>
                <i className={`arrow ${isOpen ? "up" : "down"}`} />
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div>
                    {/* Search Input */}
                    {showInput && <CustomInput
                        type="text"
                        placeholder="Search options..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)} // Update search term
                        icon={<i className="fas fa-search"></i>} // Optional: Search icon
                        errorMessage={filteredOptions.length === 0 ? "No matching options" : ""}
                    />}


                    {/* Options List */}
                    <ul className={clsx("dropdown-list", {
                        "show_input": showInput,
                        "hide_input": !showInput,
                    })}>
                        {filteredOptions.map((option, index) => (
                            <li
                                key={index}
                                className="dropdown-item"
                                onClick={() => handleOptionClick(option)}
                            >
                                {option}
                            </li>
                        ))}
                        {filteredOptions.length === 0 && (
                            <li className="dropdown-item no-results">No results found</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default CustomDropdown;
