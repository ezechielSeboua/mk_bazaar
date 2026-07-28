<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class AppSettingController extends Controller
{
    private const ALLOWED_KEYS = [
        'hero',          // Hero banner (used by ConfigurationsPage + dashboard context)
        'hero_banner',   // Legacy alias — kept for backward-compat with existing DB rows
        'carousel',
        'testimonials',
        'shipping_zones',
        'site_name',
        'contact_info',
        'social_links',
        'logo',          // Logo uploadable (remplace /mk_bazaar_logo.png statique)
        'promo_banner',  // Bannière promotionnelle sticky (toggle + texte)
    ];

    /**
     * Règles de validation par clé, appliquées à la valeur décodée.
     *
     * Ces valeurs sont servies publiquement et réinjectées dans des URLs côté
     * front (lien wa.me, liens sociaux) : une saisie libre y ferait passer des
     * paramètres arbitraires. Les clés absentes de cette table ne sont pas
     * validées structurellement — elles portent du contenu éditorial libre.
     */
    private const VALUE_RULES = [
        'contact_info' => [
            'whatsapp' => ['nullable', 'string', 'regex:/^\d{8,15}$/'],
            'email'    => ['nullable', 'email', 'max:255'],
            'address'  => ['nullable', 'string', 'max:255'],
        ],
    ];

    private function validateKey(string $key): void
    {
        if (!in_array($key, self::ALLOWED_KEYS, true)) {
            abort(422, "Clé de configuration invalide : {$key}");
        }
    }

    /**
     * Normalise puis valide la valeur, et retourne la version à stocker.
     *
     * Les clés absentes de VALUE_RULES portent du contenu éditorial libre et
     * traversent sans contrainte de structure.
     */
    private function sanitizeValue(string $key, mixed $value): mixed
    {
        if ($key === 'site_name') {
            if (!is_string($value) || trim($value) === '' || mb_strlen($value) > 100) {
                abort(422, 'Le nom du site doit être une chaîne de 1 à 100 caractères.');
            }

            return trim($value);
        }

        $rules = self::VALUE_RULES[$key] ?? null;

        if ($rules === null) {
            return $value;
        }

        if (!is_array($value)) {
            abort(422, "La configuration « {$key} » doit être un objet.");
        }

        if ($key === 'contact_info' && isset($value['whatsapp'])) {
            $raw = (string) $value['whatsapp'];

            // L'admin saisit volontiers « +225 01 41 64 94 64 » : on tolère les
            // séparateurs usuels. Tout autre caractère est refusé plutôt que
            // silencieusement retiré — sinon « 225…?text=… » deviendrait un
            // numéro erroné en base au lieu d'une erreur visible.
            if ($raw !== '' && preg_match('/[^\d\s+()\-.]/', $raw)) {
                abort(422, 'Le numéro WhatsApp ne doit contenir que des chiffres et des séparateurs (+, -, espace, parenthèses).');
            }

            $value['whatsapp'] = preg_replace('/\D/', '', $raw);
        }

        $validator = validator($value, $rules);

        if ($validator->fails()) {
            abort(422, $validator->errors()->first());
        }

        return $value;
    }

    /**
     * Upload d'une image liée aux settings (Hero, Carrousel…)
     */
    public function uploadImage(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,jpg,png,webp|max:4096',
        ]);

        $path = $request->file('image')->store('settings', 'public');

        return response()->json(['url' => Storage::url($path)]);
    }

    /**
     * Récupérer une configuration spécifique par sa clé
     */
    public function getByKey(string $key)
    {
        $this->validateKey($key);
        $setting = Setting::where('key', $key)->first();

        if (!$setting) {
            return response()->json([
                'key' => $key,
                'value' => [],
            ]);
        }

        return response()->json([
            'key' => $setting->key,
            'value' => $setting->value ?? [],
        ]);
    }

    /**
     * Sauvegarder ou mettre à jour une configuration (Hero, zones de livraison, etc.)
     */
    public function updateByKey(Request $request, string $key)
    {
        $this->validateKey($key);
        $request->validate([
            'value' => 'required',
        ]);

        $value = $request->input('value');

        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $value = $decoded;
            }
        }

        $value = $this->sanitizeValue($key, $value);

        $setting = Setting::updateOrCreate(
            ['key' => $key],
            ['value' => $value],
        );

        return response()->json([
            'message' => "Configuration '{$key}' mise à jour avec succès !",
            'key' => $setting->key,
            'value' => $setting->value,
        ]);
    }
}
