/**
 * Daily Work Excel Import Utilities
 * Preserves the exact Excel format: [0]=date, [1]=number, [2]=type, [3]=description, [4]=location
 * Provides enhanced validation and error reporting
 */

class ExcelImportValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.validationRules = {
            date: {
                required: true,
                validator: this.validateDate.bind(this),
                message: 'Date must be a valid date (YYYY-MM-DD format)'
            },
            number: {
                required: true,
                validator: this.validateRFINumber.bind(this),
                message: 'RFI Number must follow format: RFI-YYYY-XXX (e.g., RFI-2025-001)'
            },
            type: {
                required: true,
                validator: this.validateWorkType.bind(this),
                message: 'Work type must be Structure, Embankment, or Pavement'
            },
            description: {
                required: true,
                validator: this.validateDescription.bind(this),
                message: 'Description must be at least 10 characters'
            },
            location: {
                required: true,
                validator: this.validateLocation.bind(this),
                message: 'Location must follow chainage format (e.g., K5+100 or K5+100-K5+200)'
            }
        };
    }

    /**
     * Validate a single Excel row
     * @param {Array} row - Excel row data [date, number, type, description, location]
     * @param {number} rowIndex - Row number for error reporting
     * @returns {Object} Validation result with errors and parsed data
     */
    validateRow(row, rowIndex) {
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            data: null
        };

        // Check if row has minimum required columns
        if (!row || row.length < 5) {
            result.isValid = false;
            result.errors.push(`Row ${rowIndex}: Insufficient columns. Expected 5 columns: [date, number, type, description, location]`);
            return result;
        }

        const [date, number, type, description, location] = row;

        // Map to our expected format
        const parsedData = {
            date: this.parseDate(date),
            number: this.trimString(number),
            type: this.trimString(type),
            description: this.trimString(description),
            location: this.trimString(location)
        };

        // Validate each field
        Object.entries(this.validationRules).forEach(([field, rule]) => {
            const value = parsedData[field];
            
            if (rule.required && this.isEmpty(value)) {
                result.errors.push(`Row ${rowIndex}: ${field} is required`);
                result.isValid = false;
                return;
            }

            if (!this.isEmpty(value) && !rule.validator(value)) {
                result.errors.push(`Row ${rowIndex}: ${rule.message}`);
                result.isValid = false;
            }
        });

        // Additional business logic validations
        this.validateBusinessRules(parsedData, rowIndex, result);

        if (result.isValid) {
            result.data = parsedData;
        }

        return result;
    }

    /**
     * Validate business rules
     */
    validateBusinessRules(data, rowIndex, result) {
        // Check for future dates
        if (data.date && new Date(data.date) > new Date()) {
            result.warnings.push(`Row ${rowIndex}: Date is in the future`);
        }

        // Check for duplicate RFI numbers (would need to be checked against database)
        // This is a placeholder for the actual duplicate check
        // if (this.isDuplicateRFI(data.number)) {
        //     result.errors.push(`Row ${rowIndex}: RFI Number ${data.number} already exists`);
        //     result.isValid = false;
        // }
    }

    /**
     * Validate date field
     */
    validateDate(date) {
        if (!date) return false;
        
        const parsedDate = new Date(date);
        return parsedDate instanceof Date && !isNaN(parsedDate);
    }

    /**
     * Validate RFI number format
     */
    validateRFINumber(number) {
        if (!number) return false;
        
        const rfiPattern = /^RFI-\d{4}-\d{3,4}$/;
        return rfiPattern.test(number.toString().trim());
    }

    /**
     * Validate work type
     */
    validateWorkType(type) {
        if (!type) return false;
        
        const validTypes = ['Structure', 'Embankment', 'Pavement'];
        return validTypes.includes(type.toString().trim());
    }

    /**
     * Validate description
     */
    validateDescription(description) {
        if (!description) return false;
        
        return description.toString().trim().length >= 10;
    }

    /**
     * Validate location format
     */
    validateLocation(location) {
        if (!location) return false;
        
        const locationPattern = /^K\d+(\+\d+)?(-K\d+(\+\d+)?)?$/;
        return locationPattern.test(location.toString().trim());
    }

    /**
     * Helper methods
     */
    isEmpty(value) {
        return value === null || value === undefined || value.toString().trim() === '';
    }

    trimString(value) {
        return value ? value.toString().trim() : '';
    }

    parseDate(date) {
        if (!date) return null;
        
        // Handle various date formats
        if (date instanceof Date) {
            return date.toISOString().split('T')[0];
        }
        
        // Handle Excel serial date numbers
        if (typeof date === 'number') {
            const excelDate = new Date((date - 25569) * 86400 * 1000);
            return excelDate.toISOString().split('T')[0];
        }
        
        // Handle string dates
        const parsedDate = new Date(date);
        if (parsedDate instanceof Date && !isNaN(parsedDate)) {
            return parsedDate.toISOString().split('T')[0];
        }
        
        return date.toString();
    }

    /**
     * Generate validation summary
     */
    generateSummary(validationResults) {
        const totalRows = validationResults.length;
        const validRows = validationResults.filter(r => r.isValid).length;
        const invalidRows = totalRows - validRows;
        const totalWarnings = validationResults.reduce((sum, r) => sum + r.warnings.length, 0);
        const totalErrors = validationResults.reduce((sum, r) => sum + r.errors.length, 0);

        return {
            totalRows,
            validRows,
            invalidRows,
            totalWarnings,
            totalErrors,
            successRate: totalRows > 0 ? (validRows / totalRows * 100).toFixed(1) : 0,
            canProceed: invalidRows === 0
        };
    }

    /**
     * Format validation results for display
     */
    formatResults(validationResults) {
        const summary = this.generateSummary(validationResults);
        const allErrors = validationResults.flatMap(r => r.errors);
        const allWarnings = validationResults.flatMap(r => r.warnings);

        return {
            summary,
            errors: allErrors,
            warnings: allWarnings,
            validData: validationResults.filter(r => r.isValid).map(r => r.data)
        };
    }
}

/**
 * Frontend usage example for React components
 */
export const useExcelValidation = () => {
    const [validationState, setValidationState] = useState({
        isValidating: false,
        results: null,
        summary: null
    });

    const validateExcelData = useCallback(async (excelData) => {
        setValidationState(prev => ({ ...prev, isValidating: true }));

        try {
            const validator = new ExcelImportValidator();
            const results = excelData.map((row, index) => 
                validator.validateRow(row, index + 1)
            );

            const formatted = validator.formatResults(results);
            
            setValidationState({
                isValidating: false,
                results: formatted,
                summary: formatted.summary
            });

            return formatted;
        } catch (error) {
            console.error('Validation error:', error);
            setValidationState({
                isValidating: false,
                results: null,
                summary: null
            });
            throw error;
        }
    }, []);

    return {
        validationState,
        validateExcelData,
        clearValidation: () => setValidationState({
            isValidating: false,
            results: null,
            summary: null
        })
    };
};

export default ExcelImportValidator;
