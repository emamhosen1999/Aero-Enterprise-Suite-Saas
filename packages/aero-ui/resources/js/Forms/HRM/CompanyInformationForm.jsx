import React, {useEffect, useState} from 'react';
import {Card, CardHeader, Select,} from '@heroui/react';
import {showToast} from "@/utils/toastUtils";

import {getCountries} from '@/Props/countries.jsx'

const CompanyInformationForm = ({settings, setSettings}) => {

    const [countries, setCountries] = useState(getCountries());
    const [selectedCountry, setSelectedCountry] = useState(settings.country);

    const [states, setStates] = useState([]);


    const [formData, setFormData] = useState({
        companyName: settings.companyName || '',
        contactPerson: settings.contactPerson || '',
        address: settings.address || '',
        country: settings.country || '',
        city: settings.city || '',
        state: settings.state || '',
        postalCode: settings.postalCode || '',
        email: settings.email || '',
        phoneNumber: settings.phoneNumber || '',
        mobileNumber: settings.mobileNumber || '',
        fax: settings.fax || '',
        websiteUrl: settings.websiteUrl || '',
    });


    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (key, value) => {
        setFormData(prevData => ({ ...prevData, [key]: value }));

        if (key === 'country')
            setSelectedCountry(value);
    };

    useEffect(() => {
        const country = countries.find(c => c.name === selectedCountry);
        if (country && country.states) {
            setStates(country.states);
        } else {
            setStates([]);
        }
    }, [selectedCountry]);


    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            // Assuming the route for updating company settings is 'company-settings.update'
            const response = await axios.put(route('update-company-settings'), {
                // Include all the necessary form data for updating settings
                companyName: formData.companyName || '',
                contactPerson: formData.contactPerson || '',
                address: formData.address || '',
                country: formData.country || '',
                city: formData.city || '',
                state: formData.state || '',
                postalCode: formData.postalCode || '',
                email: formData.email || '',
                phoneNumber: formData.phoneNumber || '',
                mobileNumber: formData.mobileNumber || '',
                fax: formData.fax || '',
                websiteUrl: formData.websiteUrl || '',
            });

            if (response.status === 200) {
                setSettings(response.data.companySettings);
                setErrors({});
                showToast.success(response.data.messages?.length > 0 ? response.data.messages.join(' ') : 'Company settings updated successfully', {
                    icon: '🟢',
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: theme.glassCard.background,
                        border: theme.glassCard.border,
                        color: theme.palette.text.primary,
                    }
                });
            }
        } catch (error) {

            if (error.response) {
                if (error.response.status === 422) {
                    setErrors(error.response.data.errors || {});
                    showToast.error(error.response.data.error || 'Failed to update company settings.', {
                        icon: '🔴',
                        style: {
                            backdropFilter: 'blur(16px) saturate(200%)',
                            background: theme.glassCard.background,
                            border: theme.glassCard.border,
                            color: theme.palette.text.primary,
                        }
                    });
                } else {
                    showToast.error('An unexpected error occurred. Please try again later.', {
                        icon: '🔴',
                        style: {
                            backdropFilter: 'blur(16px) saturate(200%)',
                            background: theme.glassCard.background,
                            border: theme.glassCard.border,
                            color: theme.palette.text.primary,
                        }
                    });
                }
                console.error(error.response.data);
            } else if (error.request) {
                showToast.error('No response received from the server. Please check your internet connection.', {
                    icon: '🔴',
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: theme.glassCard.background,
                        border: theme.glassCard.border,
                        color: theme.palette.text.primary,
                    }
                });
                console.error(error.request);
            } else {
                showToast.error('An error occurred while setting up the request.', {
                    icon: '🔴',
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: theme.glassCard.background,
                        border: theme.glassCard.border,
                        color: theme.palette.text.primary,
                    }
                });
                console.error('Error', error.message);
            }
        }
    };


    return (
        <Grow in>
            <Card className="shadow-lg">
                <CardHeader title="Company Information" />
                <form onSubmit={handleSubmit}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>Company Details</Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Company Name"
                                    value={formData.companyName}
                                    onChange={(e) => handleChange('companyName', e.target.value)}
                                    fullWidth
                                    error={Boolean(errors.companyName)}
                                    helperText={errors.companyName}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Contact Person"
                                    value={formData.contactPerson}
                                    error={Boolean(errors.contactPerson)}
                                    helperText={errors.contactPerson}
                                    onChange={(e) => handleChange('contactPerson', e.target.value)}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Address"
                                    value={formData.address}
                                    error={Boolean(errors.address)}
                                    helperText={errors.address}
                                    onChange={(e) => handleChange('address', e.target.value)}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} lg={3}>
                                <FormControl fullWidth>
                                    <InputLabel id="country">Country</InputLabel>
                                    <Select
                                        variant="outlined"
                                        labelId="country"
                                        label="Country"
                                        value={formData.country}
                                        error={Boolean(errors.country)}
                                        onChange={(e) => handleChange('country', e.target.value)}
                                        fullWidth
                                        MenuProps={{
                                            PaperProps: {
                                                sx: {
                                                    backdropFilter: 'blur(16px) saturate(200%)',
                                                    background: theme.glassCard.background,
                                                    border: theme.glassCard.border,
                                                    borderRadius: 2,
                                                    boxShadow:
                                                        'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
                                                },
                                            },
                                        }}
                                    >
                                        {countries.map(option => (
                                        <MenuItem
                                            value={option.name}
                                            key={option.name}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                '&:hover': {
                                                    backgroundColor: theme.palette.action.hover
                                                }
                                            }}
                                        >
                                            <Box sx={{display: 'flex'}}>
                                                <img style={{marginRight: "8px"}} alt={option.code2} src={`https://flagsapi.com/${option.code2}/shiny/24.png`}/>
                                                {option.name}
                                            </Box>
                                        </MenuItem>
                                        ))}
                                    </Select>
                                    <FormHelperText>{errors.country}</FormHelperText>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6} lg={3}>
                                <FormControl fullWidth>
                                    <InputLabel id="state">State/Province</InputLabel>
                                    <Select
                                        labelId="state"
                                        label="State/Province"
                                        disabled={!states}
                                        variant='outlined'
                                        value={formData.state}
                                        error={Boolean(errors.state)}
                                        onChange={(e) => handleChange('state', e.target.value)}
                                        fullWidth
                                        MenuProps={{
                                            PaperProps: {
                                                sx: {
                                                    backdropFilter: 'blur(16px) saturate(200%)',
                                                    background: theme.glassCard.background,
                                                    border: theme.glassCard.border,
                                                    borderRadius: 2,
                                                    boxShadow:
                                                        'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
                                                },
                                            },
                                        }}
                                    >
                                        {states.map(state => (
                                            <MenuItem key={state.name} value={state.name}>
                                                {state.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    <FormHelperText>{errors.state}</FormHelperText>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6} lg={3}>
                                <TextField
                                    label="City"
                                    value={formData.city}
                                    error={Boolean(errors.city)}
                                    helperText={errors.city}
                                    onChange={(e) => handleChange('city', e.target.value)}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} lg={3}>
                                <TextField
                                    label="Postal Code"
                                    value={formData.postalCode}
                                    error={Boolean(errors.postalCode)}
                                    helperText={errors.postalCode}
                                    onChange={(e) => handleChange('postalCode', e.target.value)}
                                    fullWidth
                                />
                            </Grid>
                        </Grid>

                        <Typography variant="h6" gutterBottom sx={{ marginTop: 2 }}>Contact Details</Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Email"
                                    value={formData.email}
                                    error={Boolean(errors.email)}
                                    helperText={errors.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Phone Number"
                                    value={formData.phoneNumber}
                                    error={Boolean(errors.phoneNumber)}
                                    helperText={errors.phoneNumber}
                                    onChange={(e) => handleChange('phoneNumber', e.target.value)}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Mobile Number"
                                    value={formData.mobileNumber}
                                    error={Boolean(errors.mobileNumber)}
                                    helperText={errors.mobileNumber}
                                    onChange={(e) => handleChange('mobileNumber', e.target.value)}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Fax"
                                    value={formData.fax}
                                    error={Boolean(errors.fax)}
                                    helperText={errors.fax}
                                    onChange={(e) => handleChange('fax', e.target.value)}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Website URL"
                                    value={formData.websiteUrl}
                                    error={Boolean(errors.websiteUrl)}
                                    helperText={errors.websiteUrl}
                                    onChange={(e) => handleChange('websiteUrl', e.target.value)}
                                    fullWidth
                                />
                            </Grid>
                        </Grid>
                    </CardContent>

                    <CardActions sx={{ justifyContent: 'center' }}>
                        <LoadingButton
                            loading={loading}
                            sx={{
                                borderRadius: '50px',
                                padding: '6px 16px',
                            }}
                            variant="outlined"
                            color="primary"
                            type="submit"
                        >
                            Save
                        </LoadingButton>
                    </CardActions>
                </form>
            </Card>
        </Grow>

    );
};

export default CompanyInformationForm;
