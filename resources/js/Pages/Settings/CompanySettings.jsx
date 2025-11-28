import React, {useState} from 'react';
import {Head, usePage} from "@inertiajs/react";
import App from "@/Layouts/App.jsx";
import { motion } from 'framer-motion';
import CompanyInformationForm from "@/Forms/CompanyInformationForm.jsx"


const CompanySettings = ({title}) => {
    const [settings, setSettings] = useState(usePage().props.companySettings);


    return (
        <>
            <Head title={title}/>
            <div className="flex justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <CompanyInformationForm settings={settings} setSettings={setSettings} />
                </motion.div>
            </div>
        </>

    );
};
CompanySettings.layout = (page) => <App>{page}</App>;
export default CompanySettings;

