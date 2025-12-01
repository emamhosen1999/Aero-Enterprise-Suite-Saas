import { Head } from '@inertiajs/react';

export default function FaviconHead({ favicon, title }) {
    const faviconUrl = favicon || '/assets/images/favicon.ico';
    
    return (
        <Head>
            {title && <title>{title}</title>}
            <link rel="icon" type="image/x-icon" href={faviconUrl} />
            <link rel="icon" type="image/png" sizes="16x16" href={faviconUrl} />
            <link rel="icon" type="image/png" sizes="32x32" href={faviconUrl} />
            <link rel="apple-touch-icon" sizes="180x180" href={faviconUrl} />
        </Head>
    );
}
