import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import './styles/public.css';
import PublicLayout from './Layout/PublicLayout';
import PricingHero from './Components/PricingHero';
import PricingPlans from './Components/PricingPlans';
import ComparisonTable from './Components/ComparisonTable';
import PricingFAQ from './Components/PricingFAQ';
import PricingCTA from './Components/PricingCTA';

export default function Pricing({ title = 'Pricing' }) {
    const [isAnnual, setIsAnnual] = useState(false);

    return (
        <>
            <Head title={title} />
            <div className="public-page">
                <PublicLayout>
                    <PricingHero isAnnual={isAnnual} setIsAnnual={setIsAnnual} />
                    <PricingPlans isAnnual={isAnnual} />
                    <ComparisonTable />
                    <PricingFAQ />
                    <PricingCTA />
                </PublicLayout>
            </div>
        </>
    );
}
