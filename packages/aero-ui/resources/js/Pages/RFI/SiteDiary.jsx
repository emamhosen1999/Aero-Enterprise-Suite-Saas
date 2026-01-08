import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { 
    Button, Card, CardBody, CardHeader, Input, Textarea, 
    Select, SelectItem, Chip, Spinner 
} from "@heroui/react";
import { 
    DocumentTextIcon, CloudIcon, CameraIcon, 
    UserGroupIcon, WrenchIcon, CubeIcon, PlusIcon
} from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';

/**
 * SiteDiary - Daily activity logging page
 * 
 * Features:
 * - Daily activity log form
 * - Manpower deployment summary
 * - Material consumption quick entry
 * - Equipment usage quick entry
 * - Auto-fetch weather conditions
 * - Progress photos upload
 * - Daily summary PDF export
 */
const SiteDiary = () => {
    const { auth } = usePage().props;

    const getThemeRadius = () => {
        if (typeof window === 'undefined') return 'lg';
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 16) return 'lg';
        return 'full';
    };

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkScreenSize = () => setIsMobile(window.innerWidth < 640);
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [weather, setWeather] = useState(null);
    const [fetchingWeather, setFetchingWeather] = useState(false);

    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        activities: '',
        manpower_count: '',
        materials_used: '',
        equipment_used: '',
        progress_summary: '',
        issues_encountered: '',
        photos: [],
        weather_temperature: '',
        weather_conditions: '',
        work_suitability: true,
    });

    const fetchWeather = useCallback(async () => {
        setFetchingWeather(true);
        try {
            const response = await axios.get(route('rfi.weather.fetch'), {
                params: { date: date, project_id: auth.project?.id }
            });
            if (response.status === 200) {
                setWeather(response.data);
                setForm(prev => ({
                    ...prev,
                    weather_temperature: response.data.temperature,
                    weather_conditions: response.data.condition,
                    work_suitability: response.data.is_work_suitable,
                }));
            }
        } catch (error) {
            showToast.error('Failed to fetch weather data');
        } finally {
            setFetchingWeather(false);
        }
    }, [date, auth.project?.id]);

    useEffect(() => {
        if (date) {
            fetchWeather();
        }
    }, [date, fetchWeather]);

    const handleSubmit = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('rfi.site-diary.store'), form);
                if (response.status === 200) {
                    resolve([response.data.message || 'Site diary entry saved successfully']);
                    setForm({
                        date: new Date().toISOString().split('T')[0],
                        activities: '',
                        manpower_count: '',
                        materials_used: '',
                        equipment_used: '',
                        progress_summary: '',
                        issues_encountered: '',
                        photos: [],
                        weather_temperature: '',
                        weather_conditions: '',
                        work_suitability: true,
                    });
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to save site diary entry']);
            }
        });

        showToast.promise(promise, {
            loading: 'Saving site diary entry...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handlePhotoUpload = (event) => {
        const files = Array.from(event.target.files);
        setForm(prev => ({ ...prev, photos: [...prev.photos, ...files] }));
    };

    const handleExport = async () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('rfi.site-diary.export'), { date }, {
                    responseType: 'blob'
                });
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `site-diary-${date}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                resolve(['Site diary exported successfully']);
            } catch (error) {
                reject(['Failed to export site diary']);
            }
        });

        showToast.promise(promise, {
            loading: 'Exporting site diary...',
            success: (data) => data.join(', '),
            error: (data) => data.join(', '),
        });
    };

    return (
        <>
            <Head title="Site Diary" />
            
            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="Site Diary">
                <div className="space-y-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Card 
                            className="transition-all duration-200"
                            style={{
                                border: `var(--borderWidth, 2px) solid transparent`,
                                borderRadius: `var(--borderRadius, 12px)`,
                                fontFamily: `var(--fontFamily, "Inter")`,
                                background: `linear-gradient(135deg, 
                                    var(--theme-content1, #FAFAFA) 20%, 
                                    var(--theme-content2, #F4F4F5) 10%, 
                                    var(--theme-content3, #F1F3F4) 20%)`,
                            }}
                        >
                            <CardHeader 
                                className="border-b p-0"
                                style={{ borderColor: `var(--theme-divider, #E4E4E7)` }}
                            >
                                <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        <div className="flex items-center gap-3 lg:gap-4">
                                            <div className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                style={{
                                                    background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                    borderRadius: `var(--borderRadius, 12px)`,
                                                }}
                                            >
                                                <DocumentTextIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} 
                                                    style={{ color: 'var(--theme-primary)' }} />
                                            </div>
                                            <div>
                                                <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>
                                                    Daily Site Diary
                                                </h4>
                                                <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>
                                                    Record daily activities, resources, and progress
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <Button
                                            color="primary"
                                            variant="shadow"
                                            onPress={handleExport}
                                            size={isMobile ? "sm" : "md"}
                                        >
                                            Export PDF
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardBody className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input
                                        type="date"
                                        label="Date"
                                        value={form.date}
                                        onChange={(e) => {
                                            setForm(prev => ({ ...prev, date: e.target.value }));
                                            setDate(e.target.value);
                                        }}
                                        radius={getThemeRadius()}
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />

                                    <div className="flex items-center gap-2">
                                        {fetchingWeather ? (
                                            <Spinner size="sm" />
                                        ) : weather ? (
                                            <>
                                                <CloudIcon className="w-5 h-5 text-primary" />
                                                <span className="text-sm">
                                                    {weather.temperature}°C, {weather.condition}
                                                </span>
                                                <Chip 
                                                    color={weather.is_work_suitable ? "success" : "danger"}
                                                    size="sm"
                                                >
                                                    {weather.is_work_suitable ? "Suitable" : "Unsuitable"}
                                                </Chip>
                                            </>
                                        ) : (
                                            <Button size="sm" variant="flat" onPress={fetchWeather}>
                                                Fetch Weather
                                            </Button>
                                        )}
                                    </div>

                                    <Textarea
                                        label="Daily Activities"
                                        placeholder="Describe work activities performed today"
                                        value={form.activities}
                                        onValueChange={(value) => setForm(prev => ({ ...prev, activities: value }))}
                                        minRows={3}
                                        radius={getThemeRadius()}
                                        className="md:col-span-2"
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />

                                    <Input
                                        type="number"
                                        label="Manpower Count"
                                        startContent={<UserGroupIcon className="w-4 h-4 text-default-400" />}
                                        value={form.manpower_count}
                                        onValueChange={(value) => setForm(prev => ({ ...prev, manpower_count: value }))}
                                        radius={getThemeRadius()}
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />

                                    <Textarea
                                        label="Equipment Used"
                                        placeholder="List equipment and machinery used"
                                        startContent={<WrenchIcon className="w-4 h-4 text-default-400" />}
                                        value={form.equipment_used}
                                        onValueChange={(value) => setForm(prev => ({ ...prev, equipment_used: value }))}
                                        minRows={2}
                                        radius={getThemeRadius()}
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />

                                    <Textarea
                                        label="Materials Consumed"
                                        placeholder="List materials used with quantities"
                                        startContent={<CubeIcon className="w-4 h-4 text-default-400" />}
                                        value={form.materials_used}
                                        onValueChange={(value) => setForm(prev => ({ ...prev, materials_used: value }))}
                                        minRows={2}
                                        radius={getThemeRadius()}
                                        className="md:col-span-2"
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />

                                    <Textarea
                                        label="Progress Summary"
                                        placeholder="Summarize work completed and milestones achieved"
                                        value={form.progress_summary}
                                        onValueChange={(value) => setForm(prev => ({ ...prev, progress_summary: value }))}
                                        minRows={3}
                                        radius={getThemeRadius()}
                                        className="md:col-span-2"
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />

                                    <Textarea
                                        label="Issues & Challenges"
                                        placeholder="Note any problems, delays, or concerns"
                                        value={form.issues_encountered}
                                        onValueChange={(value) => setForm(prev => ({ ...prev, issues_encountered: value }))}
                                        minRows={2}
                                        radius={getThemeRadius()}
                                        className="md:col-span-2"
                                        classNames={{ inputWrapper: "bg-default-100" }}
                                    />

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-2">Progress Photos</label>
                                        <div className="flex items-center gap-4">
                                            <Button
                                                as="label"
                                                htmlFor="photo-upload"
                                                startContent={<CameraIcon className="w-4 h-4" />}
                                                size="sm"
                                            >
                                                Upload Photos
                                            </Button>
                                            <input
                                                id="photo-upload"
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={handlePhotoUpload}
                                                className="hidden"
                                            />
                                            {form.photos.length > 0 && (
                                                <Chip size="sm">{form.photos.length} photos selected</Chip>
                                            )}
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 flex justify-end gap-2">
                                        <Button
                                            color="primary"
                                            size="lg"
                                            onPress={handleSubmit}
                                            isLoading={loading}
                                            startContent={<PlusIcon className="w-5 h-5" />}
                                        >
                                            Save Site Diary Entry
                                        </Button>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </>
    );
};

SiteDiary.layout = (page) => <App children={page} />;
export default SiteDiary;
