import { Helmet } from 'react-helmet-async';
import {
    SITE_NAME,
    DEFAULT_DESCRIPTION,
    absoluteUrl,
    truncateDescription,
} from '../config/seo';

export default function Seo({
    title,
    description = DEFAULT_DESCRIPTION,
    path = '/',
    image,
    noindex = false,
    jsonLd,
    type = 'website',
}) {
    const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    const metaDescription = truncateDescription(description);
    const canonical = absoluteUrl(path);
    const ogImage = image || absoluteUrl('/favicon.svg');

    const structuredData = jsonLd
        ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd])
        : [];

    return (
        <Helmet>
            <html lang="fr" />
            <title>{pageTitle}</title>
            <meta name="description" content={metaDescription} />
            <link rel="canonical" href={canonical} />

            {noindex ? (
                <meta name="robots" content="noindex, nofollow" />
            ) : (
                <meta name="robots" content="index, follow" />
            )}

            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:type" content={type} />
            <meta property="og:title" content={pageTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:url" content={canonical} />
            <meta property="og:locale" content="fr_FR" />
            {ogImage && <meta property="og:image" content={ogImage} />}

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={pageTitle} />
            <meta name="twitter:description" content={metaDescription} />
            {ogImage && <meta name="twitter:image" content={ogImage} />}

            {structuredData.map((data, index) => (
                <script key={index} type="application/ld+json">
                    {JSON.stringify(data)}
                </script>
            ))}
        </Helmet>
    );
}
