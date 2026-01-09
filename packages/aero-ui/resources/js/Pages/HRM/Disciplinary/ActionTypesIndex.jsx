import React, { useCallback, useEffect, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input } from "@heroui/react";
import { Cog6ToothIcon, PlusIcon } from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import App from '@/Layouts/App.jsx';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';

const ActionTypesIndex = ({ title }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
        const checkScreenSize = () => setIsMobile(window.innerWidth < 640);
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const [loading, setLoading] = useState(false);
    const [actionTypes, setActionTypes] = useState([]);
    const [search, setSearch] = useState('');

    const canCreate = auth.permissions?.includes('hrm.disciplinary.action-types.create') || false;

    const fetchActionTypes = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.disciplinary.action-types.index'));
            if (response.status === 200) setActionTypes(response.data);
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to fetch action types' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchActionTypes();
    }, [fetchActionTypes]);

    return (
        <>
            <Head title={title || "Disciplinary Action Types"} />
            
            <div className="flex flex-col w-full h-full p-4" role="main">
                <div className="space-y-4">
                    <div className="w-full">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
                            <Card className="transition-all duration-200" style={getThemedCardStyle()}>
                                <CardHeader className="border-b p-0" style={{
                                    borderColor: `var(--theme-divider, #E4E4E7)`,
                                    background: `linear-gradient(135deg, color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                                }}>
                                    <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`} style={{
                                                    background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                    borderRadius: `var(--borderRadius, 12px)`,
                                                }}>
                                                    <Cog6ToothIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>Disciplinary Action Types</h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>Configure disciplinary action types and severity levels</p>
                                                </div>
                                            </div>
                                            {canCreate && (
                                                <Button color="primary" variant="shadow" startContent={<PlusIcon className="w-4 h-4" />} size={isMobile ? "sm" : "md"}>
                                                    Add Action Type
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <div className="mb-6">
                                        <Input label="Search" placeholder="Search action types..." value={search} onChange={(e) => setSearch(e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />} variant="bordered" size="sm" radius={themeRadius} />
                                    </div>
                                    
                                    <div className="text-center py-8 text-default-500">
                                        {loading ? "Loading action types..." : "Disciplinary action types will be displayed here"}
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

ActionTypesIndex.layout = (page) => <App children={page} />;
export default ActionTypesIndex;
