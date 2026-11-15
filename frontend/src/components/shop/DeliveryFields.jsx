import { Link } from 'react-router-dom';
import { formatFCFA } from './shopUtils';

const field = 'block w-full h-11 px-3.5 border rounded bg-white text-sm text-[#111] outline-none focus:border-[#111]';
const label = 'block text-[13px] font-medium text-[#222] mb-1.5';

/**
 * Coordonnées de livraison (maquette « 04b · Panier sans compte ») :
 * nom et WhatsApp pour un invité, commune (avec frais) et adresse précise.
 */
export default function DeliveryFields({ user, values, onChange, errors = {}, zones, idPrefix = 'co' }) {
    const set = (key) => (event) => onChange({ ...values, [key]: event.target.value });
    const border = (key) => (errors[key] ? 'border-[#b42318]' : 'border-[#d9d9d9]');
    const needsPhone = !user || !user.phone;

    return (
        <div className="space-y-[18px]">
            {!user && (
                <p className="text-[13.5px] text-[#555] leading-relaxed">
                    Pas besoin de compte pour commander. <Link to="/login" className="underline font-medium text-[#111]">Se connecter</Link> vous
                    permet seulement de retrouver vos commandes et vos favoris.
                </p>
            )}

            {!user && (
                <div>
                    <label htmlFor={`${idPrefix}-name`} className={label}>Nom complet</label>
                    <input id={`${idPrefix}-name`} autoComplete="name" value={values.name} onChange={set('name')} placeholder="Votre nom et prénom" aria-invalid={Boolean(errors.name)} className={`${field} ${border('name')}`} />
                    {errors.name && <p className="mt-1.5 text-[12.5px] text-[#b42318]">{errors.name}</p>}
                </div>
            )}

            {needsPhone && (
                <div>
                    <label htmlFor={`${idPrefix}-phone`} className={label}>Numéro WhatsApp</label>
                    <input id={`${idPrefix}-phone`} type="tel" autoComplete="tel" value={values.phone} onChange={set('phone')} placeholder="+225 07 00 00 00 00" aria-invalid={Boolean(errors.phone)} className={`${field} ${border('phone')}`} />
                    <p className={`mt-1.5 text-[12.5px] ${errors.phone ? 'text-[#b42318]' : 'text-[#666]'}`}>
                        {errors.phone || 'Nous vous écrivons sur ce numéro pour confirmer la commande.'}
                    </p>
                </div>
            )}

            {user && (
                <p className="text-[13.5px] text-[#555]">
                    Commande au nom de <b className="font-semibold text-[#111]">{user.name}</b>
                    {user.phone && <> · confirmation au <b className="font-semibold text-[#111]">{user.phone}</b></>}
                </p>
            )}

            <div>
                <label htmlFor={`${idPrefix}-zone`} className={label}>Commune</label>
                <select
                    id={`${idPrefix}-zone`}
                    value={values.zoneId ?? ''}
                    onChange={(event) => onChange({ ...values, zoneId: event.target.value ? Number(event.target.value) : null })}
                    aria-invalid={Boolean(errors.zone)}
                    className={`${field} ${border('zone')}`}
                >
                    <option value="">Choisir une commune</option>
                    {zones.map((zone) => (
                        <option key={zone.id} value={zone.id}>{zone.name} (+{formatFCFA(zone.price)})</option>
                    ))}
                </select>
                {errors.zone && <p className="mt-1.5 text-[12.5px] text-[#b42318]">{errors.zone}</p>}
            </div>

            <div>
                <label htmlFor={`${idPrefix}-address`} className={label}>Adresse précise</label>
                <textarea id={`${idPrefix}-address`} rows={2} autoComplete="street-address" value={values.address} onChange={set('address')} placeholder="Quartier, rue, point de repère…" aria-invalid={Boolean(errors.address)} className={`${field} ${border('address')} h-auto py-2.5 resize-none`} />
                {errors.address && <p className="mt-1.5 text-[12.5px] text-[#b42318]">{errors.address}</p>}
            </div>
        </div>
    );
}
