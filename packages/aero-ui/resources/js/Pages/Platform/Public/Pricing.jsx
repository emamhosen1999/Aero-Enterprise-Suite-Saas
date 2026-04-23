import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import './styles/public.css';
import PublicLayout from './Layout/PublicLayout';
import PricingHero from './Components/PricingHero';
import PricingPlans from './Components/PricingPlans';
import ComparisonTable from './Components/ComparisonTable';
import PricingFAQ from './Components/PricingFAQ';
import PricingCTA from './Components/PricingCTA';

export default function Pricing({ title, plans = [] }) {
    const [isAnnual, setIsAnnual] = useState(false);
    const [publicPlans, setPublicPlans] = useState(Array.isArray(plans) ? plans : []);

    useEffect(() => {
        if (publicPlans.length > 0) {
            return;
        }

        let active = true;

        axios.get('/api/platform/v1/plans')
            .then((response) => {
                if (!active) {
                    return;
                }

                const payloadPlans = response?.data?.plans;
                if (Array.isArray(payloadPlans) && payloadPlans.length > 0) {
                    setPublicPlans(payloadPlans);
                }
            })
            .catch(() => {
                // Keep static pricing fallback when API is unavailable.
            });

        return () => {
            active = false;
        };
    }, [publicPlans.length]);

    return (
        <>
            <Head title={title} />
            <div className="public-page">
                <PublicLayout>
                    <PricingHero isAnnual={isAnnual} setIsAnnual={setIsAnnual} />
                    <PricingPlans isAnnual={isAnnual} plans={publicPlans} />
                    <ComparisonTable />
                    <PricingFAQ />
                    <PricingCTA />
                </PublicLayout>
            </div>
        </>
    );
}
