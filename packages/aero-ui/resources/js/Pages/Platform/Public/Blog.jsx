import { Head } from '@inertiajs/react';
import PublicLayout from './Layout/PublicLayout';
import BlogHero from './Components/BlogHero';
import BlogFeatured from './Components/BlogFeatured';
import BlogCategories from './Components/BlogCategories';
import BlogGrid from './Components/BlogGrid';
import BlogNewsletter from './Components/BlogNewsletter';
import BlogCTA from './Components/BlogCTA';
import './styles/public.css';

export default function Blog({ title }) {
    return (
        <>
            <Head title={title} />
            <div className="public-page">
                <PublicLayout>
                    <BlogHero />
                    <BlogFeatured />
                    <BlogCategories />
                    <BlogGrid />
                    <BlogNewsletter />
                    <BlogCTA />
                </PublicLayout>
            </div>
        </>
    );
}
