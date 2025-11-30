import React, { useState, useEffect } from 'react';
import {
    Card as HeroCard,
    Card,
    CardBody,
    CardHeader,
    Button as HeroButton,
    Input,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Select,
    SelectItem,
    Chip,
    Divider,
    Tabs,
    Tab
} from '@heroui/react';
import { motion } from 'framer-motion';
import { Head, usePage } from "@inertiajs/react";
import App from "@/Layouts/App.jsx";
import { 
    PlusIcon, 
    PencilSquareIcon, 
    TrashIcon, 
    UserIcon, 
    AcademicCapIcon, 
    CreditCardIcon,
    ShieldCheckIcon,
    DocumentTextIcon,
    ChartBarSquareIcon
} from '@heroicons/react/24/outline';
import { showToast } from "@/utils/toastUtils";
import axios from 'axios';

const TabPanel = (props) => {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`hr-settings-tabpanel-${index}`}
            aria-labelledby={`hr-settings-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
};

const a11yProps = (index) => {
    return {
        id: `hr-settings-tab-${index}`,
        'aria-controls': `hr-settings-tabpanel-${index}`,
    };
};

const HRMSettings = ({ title, activeTab = 0 }) => {
    const [tabValue, setTabValue] = useState(activeTab);
    
    // Get props from the page
    const { 
        onboardingSettings, 
        skillsSettings,
        benefitsSettings,
        safetySettings,
        documentSettings
    } = usePage().props;

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    return (
        <>
            <Head title={title} />
            <Box sx={{ width: '100%' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs 
                        value={tabValue} 
                        onChange={handleTabChange} 
                        aria-label="HR module settings tabs"
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        <Tab 
                            icon={<UserIcon className="h-5 w-5" />} 
                            label="Onboarding & Offboarding" 
                            {...a11yProps(0)} 
                        />
                        <Tab 
                            icon={<AcademicCapIcon className="h-5 w-5" />} 
                            label="Skills & Competencies" 
                            {...a11yProps(1)} 
                        />
                        <Tab 
                            icon={<CreditCardIcon className="h-5 w-5" />} 
                            label="Benefits" 
                            {...a11yProps(2)} 
                        />
                        <Tab 
                            icon={<ShieldCheckIcon className="h-5 w-5" />} 
                            label="Safety" 
                            {...a11yProps(3)} 
                        />
                        <Tab 
                            icon={<DocumentTextIcon className="h-5 w-5" />} 
                            label="Documents" 
                            {...a11yProps(4)} 
                        />
                    </Tabs>
                </Box>
                
                {/* Onboarding & Offboarding */}
                <TabPanel value={tabValue} index={0}>
                    <Grow in={tabValue === 0} timeout={300}>
                        <Box>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Card className="shadow-lg">
                                        <CardHeader 
                                            title="Onboarding Process Configuration" 
                                            subheader="Configure the employee onboarding workflow"
                                        />
                                        <CardContent>
                                            <Typography variant="body2" color="text.secondary">
                                                Configure onboarding processes, checklists, and automated tasks for new employees.
                                            </Typography>
                                            {/* Form components would go here */}
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Card className="shadow-lg">
                                        <CardHeader 
                                            title="Offboarding Process Configuration" 
                                            subheader="Configure the employee offboarding workflow"
                                        />
                                        <CardContent>
                                            <Typography variant="body2" color="text.secondary">
                                                Configure offboarding processes, exit interviews, and asset recovery checklists.
                                            </Typography>
                                            {/* Form components would go here */}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Box>
                    </Grow>
                </TabPanel>
                
                {/* Skills & Competencies */}
                <TabPanel value={tabValue} index={1}>
                    <Grow in={tabValue === 1} timeout={300}>
                        <Box>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Card className="shadow-lg">
                                        <CardHeader 
                                            title="Skills Management" 
                                            subheader="Configure technical and soft skills categories"
                                        />
                                        <CardContent>
                                            <Typography variant="body2" color="text.secondary">
                                                Define and manage skills categories, proficiency levels, and skills assessments.
                                            </Typography>
                                            {/* Form components would go here */}
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Card className="shadow-lg">
                                        <CardHeader 
                                            title="Competency Frameworks" 
                                            subheader="Configure competency models by role"
                                        />
                                        <CardContent>
                                            <Typography variant="body2" color="text.secondary">
                                                Define competency models and frameworks for different job roles and career paths.
                                            </Typography>
                                            {/* Form components would go here */}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Box>
                    </Grow>
                </TabPanel>
                
                {/* Benefits */}
                <TabPanel value={tabValue} index={2}>
                    <Grow in={tabValue === 2} timeout={300}>
                        <Box>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Card className="shadow-lg">
                                        <CardHeader 
                                            title="Benefits Configuration" 
                                            subheader="Configure employee benefits packages and eligibility rules"
                                        />
                                        <CardContent>
                                            <Typography variant="body2" color="text.secondary">
                                                Configure benefits packages, eligibility criteria, enrollment periods, and coverage details.
                                            </Typography>
                                            {/* Form components would go here */}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Box>
                    </Grow>
                </TabPanel>
                
                {/* Safety */}
                <TabPanel value={tabValue} index={3}>
                    <Grow in={tabValue === 3} timeout={300}>
                        <Box>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Card className="shadow-lg">
                                        <CardHeader 
                                            title="Safety Training Configuration" 
                                            subheader="Configure safety training requirements and certifications"
                                        />
                                        <CardContent>
                                            <Typography variant="body2" color="text.secondary">
                                                Configure safety training programs, certification requirements, and renewal schedules.
                                            </Typography>
                                            {/* Form components would go here */}
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Card className="shadow-lg">
                                        <CardHeader 
                                            title="Incident Reporting" 
                                            subheader="Configure incident categories and reporting workflows"
                                        />
                                        <CardContent>
                                            <Typography variant="body2" color="text.secondary">
                                                Configure incident types, severity levels, reporting procedures, and notification workflows.
                                            </Typography>
                                            {/* Form components would go here */}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Box>
                    </Grow>
                </TabPanel>
                
                {/* Documents */}
                <TabPanel value={tabValue} index={4}>
                    <Grow in={tabValue === 4} timeout={300}>
                        <Box>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Card className="shadow-lg">
                                        <CardHeader 
                                            title="Document Management" 
                                            subheader="Configure document categories, templates, and retention policies"
                                        />
                                        <CardContent>
                                            <Typography variant="body2" color="text.secondary">
                                                Configure document categories, templates, approval workflows, and retention policies.
                                            </Typography>
                                            {/* Form components would go here */}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Box>
                    </Grow>
                </TabPanel>
            </Box>
        </>
    );
};

HRMSettings.layout = (page) => <App>{page}</App>;
export default HRMSettings;
