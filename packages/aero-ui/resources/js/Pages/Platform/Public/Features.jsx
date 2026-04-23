import { Head } from '@inertiajs/react';
import { useState } from 'react';
import FeaturesCTA from './Components/FeaturesCTA';
import FeaturesHero from './Components/FeaturesHero';
import ModuleDetail from './Components/ModuleDetail';
import ModuleGrid from './Components/ModuleGrid';
import PlatformPillars from './Components/PlatformPillars';
import PublicLayout from './Layout/PublicLayout';
import './styles/public.css';

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
