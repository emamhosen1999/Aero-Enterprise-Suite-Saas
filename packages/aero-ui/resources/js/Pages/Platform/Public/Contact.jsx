import { Head } from '@inertiajs/react';
import PublicLayout from './Layout/PublicLayout';
import ContactHero from './Components/ContactHero';
import ContactOptions from './Components/ContactOptions';
import ContactForm from './Components/ContactForm';
import ContactInfo from './Components/ContactInfo';
import ContactFAQ from './Components/ContactFAQ';
import ContactCTA from './Components/ContactCTA';
import './styles/public.css';

export default function Contact({ title }) {
    return (
        <>
            <Head title={title} />
            <div className="public-page">
                <PublicLayout>
                    <ContactHero />
                    <ContactOptions />
                    <ContactForm />
                    <ContactInfo />
                    <ContactFAQ />
                    <ContactCTA />
                </PublicLayout>
            </div>
        </>
    );
}
