import { SITE_NAME, absoluteUrl, absoluteImageUrl } from '../config/seo';

export const buildOrganizationJsonLd = () => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: absoluteUrl('/'),
});

export const buildProductJsonLd = (product) => {
    if (!product) return null;

    const images = (product.image_path || [])
        .map((img) => absoluteImageUrl(Array.isArray(img) ? img[0] : img))
        .filter(Boolean);

    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description,
        sku: String(product.id),
        url: absoluteUrl(`/products/${product.slug || product.id}`),
        image: images.length > 0 ? images : undefined,
        brand: {
            '@type': 'Brand',
            name: SITE_NAME,
        },
        offers: {
            '@type': 'Offer',
            priceCurrency: 'XOF',
            price: product.price,
            availability: product.in_stock
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            url: absoluteUrl(`/products/${product.slug || product.id}`),
        },
        category: product.category?.name,
    };
};

export const buildBreadcrumbJsonLd = (items) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: absoluteUrl(item.path),
    })),
});
