import React from 'react';
import { Head } from '@inertiajs/react';
import './styles/public.css';
import PublicLayout from './Layout/PublicLayout';
import HeroSection from './Components/HeroSection';
import TrustBar from './Components/TrustBar';
import FeatureGrid from './Components/FeatureGrid';
import NarrativeSection from './Components/NarrativeSection';
import StatsSection from './Components/StatsSection';
import CTASection from './Components/CTASection';
import TestimonialsSection from './Components/TestimonialsSection';

export default function Home({ title = 'AEOS Enterprise Suite — Modern ERP Platform' }) {
    return (
        <>
            <Head title={title} />
            <div style={{ background: '#03040A', color: '#E8EDF5', minHeight: '100vh' }}>
                <PublicLayout>
                    {/* 1. Immersive Hero with mouse-parallax + floating mockup */}
                    <HeroSection />

                    {/* 2. Social Proof / Trust Marquee */}
                    <TrustBar />

                    {/* 3. Bento Feature Grid */}
                    <FeatureGrid />

                    {/* 4. Scroll-linked Narrative (sticky parallax panels) */}
                    <NarrativeSection />

                    {/* 5. Count-up Stats */}
                    <StatsSection />

                    {/* 6. Glassmorphic CTA with inline lead form */}
                    <CTASection />

                    {/* 7. Testimonials slider + masonry flanks */}
                    <TestimonialsSection />

                    {/* Footer is included in PublicLayout */}
                </PublicLayout>
            </div>
        </>
    );
}
