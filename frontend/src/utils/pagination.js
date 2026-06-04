/**
 * Récupère toutes les pages d'une ressource paginée (format Laravel).
 * Page 1 d'abord, puis les pages restantes en parallèle.
 * @param {(page: number) => Promise<{ success: boolean, data: object }>} fetchPage
 */
export const fetchAllPages = async (fetchPage) => {
    const firstResult = await fetchPage(1);
    if (!firstResult?.success) return [];

    const payload = firstResult.data;
    const firstItems = Array.isArray(payload) ? payload : (payload?.data ?? []);
    const lastPage = payload?.last_page ?? 1;

    if (lastPage <= 1) return firstItems;

    const remainingPages = Array.from({ length: lastPage - 1 }, (_, i) => i + 2);
    const results = await Promise.all(remainingPages.map((page) => fetchPage(page)));

    const restItems = results.flatMap((result) => {
        if (!result?.success) return [];
        const pagePayload = result.data;
        return Array.isArray(pagePayload) ? pagePayload : (pagePayload?.data ?? []);
    });

    return [...firstItems, ...restItems];
};

/** Métadonnées de pagination Laravel (total, etc.) */
export const getPaginationMeta = (result) => {
    const payload = result?.data;
    if (!payload || Array.isArray(payload)) return null;
    return {
        total: payload.total ?? null,
        lastPage: payload.last_page ?? 1,
        perPage: payload.per_page ?? null,
    };
};
