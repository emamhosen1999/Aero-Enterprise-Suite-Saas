import { Head } from '@inertiajs/react';
import PublicLayout from './Layout/PublicLayout';
import AboutHero from './Components/AboutHero';
import AboutMission from './Components/AboutMission';
import AboutValues from './Components/AboutValues';
import AboutTimeline from './Components/AboutTimeline';
import AboutTeam from './Components/AboutTeam';
import AboutCTA from './Components/AboutCTA';
import './styles/public.css';

export default function About({ title = 'About — aeos365' }) {
    return (
        <>
            <Head title={title} />
            <div className="public-page">
                <PublicLayout>
                    <AboutHero />
                    <AboutMission />
                    <AboutValues />
                    <AboutTimeline />
                    <AboutTeam />
                    <AboutCTA />
                </PublicLayout>
            </div>
        </>
    );
}
