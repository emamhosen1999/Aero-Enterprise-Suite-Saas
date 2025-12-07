import React from 'react';
import {
    TextField,
    FormControl,
    FormControlLabel,
    FormHelperText,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    Grid,
    Autocomplete,
    Chip,
} from '@mui/material';

/**
 * Reusable form field components
 * Reduces duplication in form creation
 */

// Standard text field with error handling
export const FormTextField = ({
    name,
    label,
    value,
    onChange,
    error,
    required = false,
    type = 'text',
    multiline = false,
    rows = 4,
    gridProps = { xs: 12 },
    ...textFieldProps
}) => (
    <Grid item {...gridProps}>
        <TextField
            name={name}
            label={label}
            value={value || ''}
            onChange={onChange}
            error={!!error}
            helperText={error}
            required={required}
            type={type}
            multiline={multiline}
            rows={multiline ? rows : undefined}
            fullWidth
            variant="outlined"
            {...textFieldProps}
        />
    </Grid>
);

// Select dropdown field
export const FormSelectField = ({
    name,
    label,
    value,
    onChange,
    options = [],
    error,
    required = false,
    gridProps = { xs: 12 },
    ...selectProps
}) => (
    <Grid item {...gridProps}>
        <FormControl fullWidth error={!!error} required={required}>
            <InputLabel>{label}</InputLabel>
            <Select
                name={name}
                value={value || ''}
                onChange={onChange}
                label={label}
                {...selectProps}
            >
                {options.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                        {option.name}
                    </MenuItem>
                ))}
            </Select>
            {error && <FormHelperText>{error}</FormHelperText>}
        </FormControl>
    </Grid>
);

// Switch/Toggle field
export const FormSwitchField = ({
    name,
    label,
    checked,
    onChange,
    gridProps = { xs: 12 },
    ...switchProps
}) => (
    <Grid item {...gridProps}>
        <FormControlLabel
            control={
                <Switch
                    name={name}
                    checked={checked || false}
                    onChange={onChange}
                    {...switchProps}
                />
            }
            label={label}
        />
    </Grid>
);

// Autocomplete field
export const FormAutocompleteField = ({
    name,
    label,
    value,
    onChange,
    options = [],
    error,
    required = false,
    multiple = false,
    gridProps = { xs: 12 },
    ...autocompleteProps
}) => (
    <Grid item {...gridProps}>
        <Autocomplete
            options={options}
            getOptionLabel={(option) => option.name || option.title || option}
            value={value}
            onChange={(event, newValue) => {
                const syntheticEvent = {
                    target: {
                        name,
                        value: newValue
                    }
                };
                onChange(syntheticEvent);
            }}
            multiple={multiple}
            renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                    <Chip
                        variant="outlined"
                        label={option.name || option.title || option}
                        {...getTagProps({ index })}
                        key={index}
                    />
                ))
            }
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    error={!!error}
                    helperText={error}
                    required={required}
                    variant="outlined"
                />
            )}
            {...autocompleteProps}
        />
    </Grid>
);

// Date field
export const FormDateField = ({
    name,
    label,
    value,
    onChange,
    error,
    required = false,
    gridProps = { xs: 12 },
    ...dateProps
}) => (
    <Grid item {...gridProps}>
        <TextField
            name={name}
            label={label}
            type="date"
            value={value || ''}
            onChange={onChange}
            error={!!error}
            helperText={error}
            required={required}
            fullWidth
            variant="outlined"
            InputLabelProps={{
                shrink: true,
            }}
            {...dateProps}
        />
    </Grid>
);

// Number field
export const FormNumberField = ({
    name,
    label,
    value,
    onChange,
    error,
    required = false,
    min,
    max,
    step = 1,
    gridProps = { xs: 12 },
    ...numberProps
}) => (
    <Grid item {...gridProps}>
        <TextField
            name={name}
            label={label}
            type="number"
            value={value || ''}
            onChange={onChange}
            error={!!error}
            helperText={error}
            required={required}
            fullWidth
            variant="outlined"
            inputProps={{
                min,
                max,
                step,
            }}
            {...numberProps}
        />
    </Grid>
);

// Export all components
export {
    FormTextField as default,
};