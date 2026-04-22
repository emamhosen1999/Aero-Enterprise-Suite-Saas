import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import './styles/public.css';
import PublicLayout from './Layout/PublicLayout';
import FeaturesHero from './Components/FeaturesHero';
import ModuleGrid from './Components/ModuleGrid';
import ModuleDetail from './Components/ModuleDetail';
import PlatformPillars from './Components/PlatformPillars';
import FeaturesCTA from './Components/FeaturesCTA';

export default function Features({ title = 'Features' }) {
    const [activeCategory, setActiveCategory] = useState('all');
    const [selectedModule, setSelectedModule] = useState(null);

    return (
        <>
            <Head title={title} />
            <div className="public-page">
                <PublicLayout>
                    <FeaturesHero />
                    <ModuleGrid
                        activeCategory={activeCategory}
                        setActiveCategory={setActiveCategory}
                        selectedModule={selectedModule}
                        setSelectedModule={setSelectedModule}
                    />
                    <ModuleDetail
                        selectedModule={selectedModule}
                        setSelectedModule={setSelectedModule}
                    />
                    <PlatformPillars />
                    <FeaturesCTA />
                </PublicLayout>
            </div>
        </>
    );
}
