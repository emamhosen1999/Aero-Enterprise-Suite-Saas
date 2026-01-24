import React, { useCallback, useEffect, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Button, Card, CardBody, CardHeader, Input } from "@heroui/react";
import { FolderIcon, PlusIcon } from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import { getThemedCardStyle } from '@/Components/UI/ThemedCard.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { useHRMAC } from '@/Hooks/useHRMAC';

const AssetCategoriesIndex = ({ title }) => {
    const { auth } = usePage().props;
    const themeRadius = useThemeRadius();
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();
    
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth < 768);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState('');

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('hrm.assets.categories.list'));
            if (response.status === 200) setCategories(response.data);
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to fetch categories' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    return (
        <StandardPageLayout
            title="Asset Categories"
            subtitle="Manage asset categories and types"
            icon={<FolderIcon className="w-6 h-6" />}
            iconColorClass="text-primary"
            iconBgClass="bg-primary/20"
            actions={
                canCreate && (
                    <Button color="primary" variant="shadow" startContent={<PlusIcon className="w-4 h-4" />} size={isMobile ? "sm" : "md"}>
                        Add Category
                    </Button>
                )
            }
            filters={
                <Input 
                    label="Search" 
                    placeholder="Search categories..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)}
                    startContent={<MagnifyingGlassIcon className="w-4 h-4" />} 
                    variant="bordered" 
                    size="sm" 
                    radius={themeRadius} 
                />
            }
            ariaLabel="Asset Categories"
        >
            <div className="text-center py-8 text-default-500">
                {loading ? "Loading categories..." : "Asset categories will be displayed here"}
            </div>
        </StandardPageLayout>
    );
};

AssetCategoriesIndex.layout = (page) => <App children={page} />;
export default AssetCategoriesIndex;
