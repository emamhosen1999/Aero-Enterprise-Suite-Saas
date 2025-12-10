import React, {useEffect, useState} from 'react';
import {Card, CardHeader, Divider, Select} from '@heroui/react';
import {showToast} from "@/utils/toastUtils"; // Using consistent toast utility


const SalaryInformationForm = ({user, setUser}) => {
    const [initialUserData, setInitialUserData] = useState({
        id: user.id,
        // New fields
        salary_basis: user.salary_basis || '', // Required string
        salary_amount: user.salary_amount || '', // Required numeric, default to 0
        payment_type: user.payment_type || '', // Required string
        pf_contribution: user.pf_contribution ?? false, // Nullable boolean, default to false
        pf_no: user.pf_no || '', // Nullable string
        employee_pf_rate: user.employee_pf_rate || 0, // Nullable string
        additional_pf_rate: user.additional_pf_rate || 0, // Nullable string
        total_pf_rate: user.total_pf_rate || 0, // Nullable string
        esi_contribution: user.esi_contribution ?? false, // Nullable boolean, default to false
        esi_no: user.esi_no || '', // Nullable string
        employee_esi_rate: user.employee_esi_rate || 0, // Nullable string
        additional_esi_rate: user.additional_esi_rate || 0, // Nullable string
        total_esi_rate: user.total_esi_rate || 0 // Nullable string
    });
    const [changedUserData, setChangedUserData] = useState({
        id: user.id,
    });

    const [dataChanged, setDataChanged] = useState(false);
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    const handleChange = (key, value) => {
        setInitialUserData((prevUser) => {
            const updatedData = { ...prevUser, [key]: value };

            // Remove the key if the value is an empty string
            if (value === '') {
                delete updatedData[key];
            }

            if (key === 'pf_contribution' && value === 0) {
                updatedData['pf_no'] = '';
                updatedData['employee_pf_rate'] = 0;
                updatedData['additional_pf_rate'] = 0;
                updatedData['total_pf_rate'] = 0;
            } else if (key === 'employee_pf_rate' || key === 'additional_pf_rate') {
                updatedData['total_pf_rate'] = updatedData['employee_pf_rate'] + updatedData['additional_pf_rate'];
            }

            if (key === 'esi_contribution' && value === 0) {
                updatedData['esi_no'] = '';
                updatedData['employee_esi_rate'] = 0;
                updatedData['additional_esi_rate'] = 0;
                updatedData['total_esi_rate'] = 0;
            } else if (key === 'employee_esi_rate' || key === 'additional_esi_rate') {
                updatedData['total_esi_rate'] = updatedData['employee_esi_rate'] + updatedData['additional_esi_rate'];
            }

            return updatedData;
        });

        setChangedUserData((prevUser) => {
            const updatedData = { ...prevUser, [key]: value };

            // Remove the key if the value is an empty string
            if (value === '') {
                delete updatedData[key];
            }

            if (key === 'pf_contribution' && value === 0) {
                updatedData['pf_no'] = '';
                updatedData['employee_pf_rate'] = 0;
                updatedData['additional_pf_rate'] = 0;
                updatedData['total_pf_rate'] = 0;
            } else if (key === 'employee_pf_rate' || key === 'additional_pf_rate') {
                updatedData['total_pf_rate'] = updatedData['employee_pf_rate'] + updatedData['additional_pf_rate'];
            }

            if (key === 'esi_contribution' && value === 0) {
                updatedData['esi_no'] = '';
                updatedData['employee_esi_rate'] = 0;
                updatedData['additional_esi_rate'] = 0;
                updatedData['total_esi_rate'] = 0;
            } else if (key === 'employee_esi_rate' || key === 'additional_esi_rate') {
                updatedData['total_esi_rate'] = updatedData['employee_esi_rate'] + updatedData['additional_esi_rate'];
            }

            return updatedData;
        });
    };

    useEffect(() => {
        // Function to filter out unchanged data from changedUserData
        for (const key in changedUserData) {
            // Skip comparison for 'id' or if the value matches the original data
            if (key !== 'id' && changedUserData[key] === user[key]) {
                delete changedUserData[key]; // Skip this iteration
            }
        }
        const hasChanges = Object.keys(changedUserData).filter(key => key !== 'id').length > 0;

        setDataChanged(hasChanges);

    }, [initialUserData, changedUserData, user]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setProcessing(true);

        try {
            const response = await axios.post(route('profile.update'), {
                ruleSet: 'salary',
                ...initialUserData,
            });

            if (response.status === 200) {
                setUser(response.data.user);
                setProcessing(false);
                showToast.success(response.data.messages?.length > 0 ? response.data.messages.join(' ') : 'Salary information updated successfully', {
                    icon: '🟢',
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: 'var(--theme-content1)',
                        border: '1px solid var(--theme-divider)',
                        color: 'var(--theme-primary)',
                    }
                });
            } else {
                setProcessing(false);
                setErrors(response.data.errors);
                showToast.error(response.data.error || 'Failed to update salary information.', {
                    icon: '🔴',
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: 'var(--theme-content1)',
                        border: '1px solid var(--theme-divider)',
                        color: 'var(--theme-primary)',
                    }
                });
            }
        } catch (error) {
            setProcessing(false);
            showToast.error(error.response?.data?.message || 'An unexpected error occurred.', {
                icon: '🔴',
                style: {
                    backdropFilter: 'blur(16px) saturate(200%)',
                    background: 'var(--theme-content1)',
                    border: '1px solid var(--theme-divider)',
                    color: 'var(--theme-primary)',
                }
            });
            console.error(error);
        }
    };


    return (
        <Grid container spacing={2} sx={{ display: 'flex', alignItems: 'stretch' }}>
            <Grid item xs={12} md={12} sx={{ display: 'flex', flexDirection: 'column' }}>
                <Card className="shadow-lg">
                    <CardHeader
                        title="Salary & Statutory Information"
                    />
                    <form onSubmit={handleSubmit}>
                        <CardContent>
                            <Typography sx={{fontWeight: 'bold', m: 2}}>Salary Information</Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={4}>
                                    <FormControl fullWidth>
                                        <InputLabel id="salary-basis-label">Salary basis</InputLabel>
                                        <Select
                                            labelId="salary-basis-label"
                                            value={changedUserData.salary_basis || initialUserData.salary_basis || 'na'}
                                            onChange={(e) => handleChange('salary_basis', e.target.value)}
                                            error={Boolean(errors.salary_basis)}
                                            helperText={errors.salary_basis}
                                            label="Salary basis"
                                            MenuProps={{
                                                PaperProps: {
                                                    sx: {
                                                        backdropFilter: 'blur(16px) saturate(200%)',
                                                        background: 'var(--theme-content1)',
                                                        border: '1px solid var(--theme-divider)',
                                                        borderRadius: 2,
                                                        boxShadow:
                                                            'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
                                                    },
                                                },
                                            }}
                                        >
                                            <MenuItem value="na" disabled>Select salary basis type</MenuItem>
                                            <MenuItem value="Hourly">Hourly</MenuItem>
                                            <MenuItem value="Daily">Daily</MenuItem>
                                            <MenuItem value="Weekly">Weekly</MenuItem>
                                            <MenuItem value="Monthly">Monthly</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        label="Salary amount"
                                        type="number"
                                        fullWidth
                                        placeholder="Type your salary amount"
                                        value={changedUserData.salary_amount || initialUserData.salary_amount || ''}
                                        onChange={(e) => handleChange('salary_amount', e.target.value)}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                        }}
                                        error={Boolean(errors.salary_amount)}
                                        helperText={errors.salary_amount}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FormControl fullWidth>
                                        <InputLabel id="payment-type-label">Payment type</InputLabel>
                                        <Select
                                            labelId="payment-type-label"
                                            label="Payment type"
                                            id={`gender-select-${user.id}`}
                                            value={changedUserData.payment_type || initialUserData.payment_type || 'na'}
                                            onChange={(e) => handleChange('payment_type', e.target.value)}
                                            error={Boolean(errors.payment_type)}
                                            helperText={errors.payment_type}
                                            MenuProps={{
                                                PaperProps: {
                                                    sx: {
                                                        backdropFilter: 'blur(16px) saturate(200%)',
                                                        background: 'var(--theme-content1)',
                                                        border: '1px solid var(--theme-divider)',
                                                        borderRadius: 2,
                                                        boxShadow:
                                                            'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
                                                    },
                                                },
                                            }}
                                        >
                                            <MenuItem value="na" disabled>Select payment type</MenuItem>
                                            <MenuItem value="Bank transfer">Bank transfer</MenuItem>
                                            <MenuItem value="Check">Check</MenuItem>
                                            <MenuItem value="Cash">Cash</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>

                            <Divider sx={{my: 3}}/>

                            <Typography sx={{fontWeight: 'bold', m: 2}}>PF Information</Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={4}>
                                    <FormControl fullWidth>
                                        <InputLabel id="pf-contribution-label">PF contribution</InputLabel>
                                        <Select
                                            labelId="pf-contribution-label"
                                            label="PF contribution"
                                            id={`gender-select-${user.id}`}
                                            value={
                                                changedUserData.pf_contribution !== undefined
                                                    ? changedUserData.pf_contribution
                                                    : initialUserData.pf_contribution !== undefined
                                                        ? initialUserData.pf_contribution
                                                        : 'na'
                                            }
                                            onChange={(e) => handleChange('pf_contribution', e.target.value)}
                                            error={Boolean(errors.pf_contribution)}
                                            helperText={errors.pf_contribution}
                                            MenuProps={{
                                                PaperProps: {
                                                    sx: {
                                                        backdropFilter: 'blur(16px) saturate(200%)',
                                                        background: 'var(--theme-content1)',
                                                        border: '1px solid var(--theme-divider)',
                                                        borderRadius: 2,
                                                        boxShadow:
                                                            'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
                                                    },
                                                },
                                            }}
                                        >
                                            <MenuItem value="na" disabled>Select PF contribution</MenuItem>
                                            <MenuItem value={1}>Yes</MenuItem>
                                            <MenuItem value={0}>No</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        disabled={!Boolean(changedUserData.pf_contribution || initialUserData.pf_contribution)}
                                        InputLabelProps={{shrink: true}}
                                        label="PF No."
                                        fullWidth
                                        type="text"
                                        placeholder="Enter PF No."
                                        value={changedUserData.pf_no || initialUserData.pf_no}
                                        onChange={(e) => handleChange('pf_no', e.target.value)}
                                        error={Boolean(errors.pf_no)}
                                        helperText={errors.pf_no}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FormControl fullWidth>
                                        <InputLabel id="employee-pf-rate-label">Employee PF rate</InputLabel>
                                        <Select
                                            disabled={!Boolean(changedUserData.pf_contribution || initialUserData.pf_contribution)}
                                            labelId="employee-pf-rate-label"
                                            label="Employee PF rate"
                                            value={changedUserData.employee_pf_rate || initialUserData.employee_pf_rate || 'na'}
                                            onChange={(e) => handleChange('employee_pf_rate', e.target.value)}
                                            error={Boolean(errors.employee_pf_rate)}
                                            helperText={errors.employee_pf_rate}
                                            MenuProps={{
                                                PaperProps: {
                                                    sx: {
                                                        backdropFilter: 'blur(16px) saturate(200%)',
                                                        background: 'var(--theme-content1)',
                                                        border: '1px solid var(--theme-divider)',
                                                        borderRadius: 2,
                                                        boxShadow:
                                                            'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
                                                    },
                                                },
                                            }}
                                        >
                                            <MenuItem value="na" disabled>Select pf rate</MenuItem>
                                            {[...Array(11).keys()].map(value => (
                                                <MenuItem key={value} value={value}>{value}%</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FormControl fullWidth>
                                        <InputLabel id="additional-rate-label">Additional rate</InputLabel>
                                        <Select
                                            disabled={!Boolean(changedUserData.pf_contribution || initialUserData.pf_contribution)}
                                            labelId="additional-rate-label"
                                            label="Additional rate"
                                            id={`gender-select-${user.id}`}
                                            value={changedUserData.additional_pf_rate || initialUserData.additional_pf_rate || 'na'}
                                            onChange={(e) => handleChange('additional_pf_rate', e.target.value)}
                                            error={Boolean(errors.additional_pf_rate)}
                                            helperText={errors.additional_pf_rate}
                                            MenuProps={{
                                                PaperProps: {
                                                    sx: {
                                                        backdropFilter: 'blur(16px) saturate(200%)',
                                                        background: 'var(--theme-content1)',
                                                        border: '1px solid var(--theme-divider)',
                                                        borderRadius: 2,
                                                        boxShadow:
                                                            'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
                                                    },
                                                },
                                            }}
                                        >
                                            <MenuItem value="na" disabled>Select additional rate</MenuItem>
                                            {[...Array(11).keys()].map(value => (
                                                <MenuItem key={value} value={value}>{value}%</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        disabled={!Boolean(changedUserData.pf_contribution || initialUserData.pf_contribution)}
                                        InputLabelProps={{shrink: true}}
                                        fullWidth
                                        label="Total rate"
                                        placeholder="N/A"
                                        value={changedUserData.total_pf_rate || initialUserData.total_pf_rate ? `${changedUserData.total_pf_rate || initialUserData.total_pf_rate}%` : ''}
                                        InputProps={{
                                            readOnly: true,
                                        }}
                                        error={Boolean(errors.total_pf_rate)}
                                        helperText={errors.total_pf_rate}
                                    />
                                </Grid>
                            </Grid>

                            <Divider sx={{my: 3}}/>

                            <Typography sx={{fontWeight: 'bold', m: 2}}>ESI Information</Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={4}>
                                    <FormControl fullWidth>
                                        <InputLabel id="esi-contribution-label">ESI contribution</InputLabel>
                                        <Select
                                            labelId="esi-contribution-label"
                                            label="ESI contribution"
                                            value={
                                                changedUserData.esi_contribution !== undefined
                                                    ? changedUserData.esi_contribution
                                                    : initialUserData.esi_contribution !== undefined
                                                        ? initialUserData.esi_contribution
                                                        : 'na'
                                            }
                                            onChange={(e) => handleChange('esi_contribution', e.target.value)}
                                            error={Boolean(errors.esi_contribution)}
                                            helperText={errors.esi_contribution}
                                            MenuProps={{
                                                PaperProps: {
                                                    sx: {
                                                        backdropFilter: 'blur(16px) saturate(200%)',
                                                        background: 'var(--theme-content1)',
                                                        border: '1px solid var(--theme-divider)',
                                                        borderRadius: 2,
                                                        boxShadow:
                                                            'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
                                                    },
                                                },
                                            }}
                                        >
                                            <MenuItem value="na" disabled>Select ESI contribution</MenuItem>
                                            <MenuItem value={1}>Yes</MenuItem>
                                            <MenuItem value={0}>No</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        disabled={!Boolean(changedUserData.esi_contribution || initialUserData.esi_contribution)}
                                        InputLabelProps={{shrink: true}}
                                        label="ESI No."
                                        fullWidth
                                        type="text"
                                        placeholder="Enter ESI No."
                                        value={changedUserData.esi_no || initialUserData.esi_no}
                                        onChange={(e) => handleChange('esi_no', e.target.value)}
                                        error={Boolean(errors.esi_no)}
                                        helperText={errors.esi_no}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FormControl fullWidth>
                                        <InputLabel id="esi-contribution-label">Employee ESI rate</InputLabel>
                                        <Select
                                            disabled={!Boolean(changedUserData.esi_contribution || initialUserData.esi_contribution)}
                                            labelId="esi-contribution-label"
                                            label="ESI contribution"
                                            value={changedUserData.employee_esi_rate || initialUserData.employee_esi_rate || 'na'}
                                            onChange={(e) => handleChange('employee_esi_rate', e.target.value)}
                                            error={Boolean(errors.employee_esi_rate)}
                                            helperText={errors.employee_esi_rate}
                                            MenuProps={{
                                                PaperProps: {
                                                    sx: {
                                                        backdropFilter: 'blur(16px) saturate(200%)',
                                                        background: 'var(--theme-content1)',
                                                        border: '1px solid var(--theme-divider)',
                                                        borderRadius: 2,
                                                        boxShadow:
                                                            'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
                                                    },
                                                },
                                            }}
                                        >
                                            <MenuItem value="na" disabled>Select esi rate</MenuItem>
                                            {[...Array(11).keys()].map(value => (
                                                <MenuItem key={value} value={value}>{value}%</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FormControl fullWidth>
                                        <InputLabel id="esi-contribution-label">Additional rate</InputLabel>
                                        <Select
                                            disabled={!Boolean(changedUserData.esi_contribution || initialUserData.esi_contribution)}
                                            labelId="esi-contribution-label"
                                            label="ESI contribution"
                                            value={changedUserData.additional_esi_rate || initialUserData.additional_esi_rate || 'na'}
                                            onChange={(e) => handleChange('additional_esi_rate', e.target.value)}
                                            error={Boolean(errors.additional_esi_rate)}
                                            helperText={errors.additional_esi_rate}
                                            MenuProps={{
                                                PaperProps: {
                                                    sx: {
                                                        backdropFilter: 'blur(16px) saturate(200%)',
                                                        background: 'var(--theme-content1)',
                                                        border: '1px solid var(--theme-divider)',
                                                        borderRadius: 2,
                                                        boxShadow:
                                                            'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
                                                    },
                                                },
                                            }}
                                        >
                                            <MenuItem value="na" disabled>Select additional rate</MenuItem>
                                            {[...Array(11).keys()].map(value => (
                                                <MenuItem key={value} value={value}>{value}%</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        disabled={!Boolean(changedUserData.esi_contribution || initialUserData.esi_contribution)}
                                        InputLabelProps={{shrink: true}}
                                        fullWidth
                                        label="Total rate"
                                        placeholder="N/A"
                                        value={changedUserData.total_esi_rate || initialUserData.total_esi_rate ? `${changedUserData.total_esi_rate || initialUserData.total_esi_rate}%` : ''}
                                        InputProps={{
                                            readOnly: true,
                                        }}
                                        error={Boolean(errors.total_esi_rate)}
                                        helperText={errors.total_esi_rate}
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                        <CardActions
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '16px',
                            }}
                        >
                            <LoadingButton
                                disabled={!dataChanged}
                                sx={{
                                    borderRadius: '50px',
                                    padding: '6px 16px',
                                }}
                                variant="outlined"
                                color="primary"
                                type="submit"
                                loading={processing}
                            >
                                Submit
                            </LoadingButton>
                        </CardActions>

                    </form>
                </Card>
            </Grid>
        </Grid>

    );
};

export default SalaryInformationForm;
