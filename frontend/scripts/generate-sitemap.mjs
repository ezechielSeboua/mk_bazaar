import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const SITE_URL = (process.env.VITE_SITE_URL || 'http://localhost:5173').replace(/\/$/, '');
const API_URL = (process.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');

const STATIC_ROUTES = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/products', priority: '0.9', changefreq: 'daily' },
    { path: '/about', priority: '0.6', changefreq: 'monthly' },
];

const fetchAllProducts = async () => {
    const products = [];
    let page = 1;
    let lastPage = 1;

    do {
        const response = await fetch(`${API_URL}/products?page=${page}&per_page=100`);
        if (!response.ok) break;

        const data = await response.json();
        products.push(...(data.data || []));
        lastPage = data.last_page || 1;
        page += 1;
    } while (page <= lastPage);

    return products;
};

const buildUrlEntry = (path, priority, changefreq, lastmod) => `
  <url>
    <loc>${SITE_URL}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

const generate = async () => {
    mkdirSync(publicDir, { recursive: true });

    const today = new Date().toISOString().split('T')[0];
    let productEntries = '';

    try {
        const products = await fetchAllProducts();
        productEntries = products
            .filter((p) => p.slug)
            .map((p) => buildUrlEntry(`/products/${p.slug}`, '0.8', 'weekly', today))
            .join('');
        console.log(`✓ ${products.length} produit(s) ajouté(s) au sitemap`);
    } catch (err) {
        console.warn('⚠ API indisponible — sitemap généré sans les produits:', err.message);
    }

    const staticEntries = STATIC_ROUTES
        .map((route) => buildUrlEntry(route.path, route.priority, route.changefreq, today))
        .join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticEntries}${productEntries}
</urlset>`;

    const robots = `User-agent: *
Allow: /

Disallow: /dashboard
Disallow: /login

Sitemap: ${SITE_URL}/sitemap.xml
`;

    writeFileSync(join(publicDir, 'sitemap.xml'), sitemap.trim());
    writeFileSync(join(publicDir, 'robots.txt'), robots.trim());

    console.log(`✓ sitemap.xml et robots.txt générés (${SITE_URL})`);
};

generate();
