<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class AppSettingController extends Controller
{
    private const ALLOWED_KEYS = [
        'hero_banner',
        'carousel',
        'delivery_zones',
        'shipping_zones',
        'site_name',
        'contact_info',
        'social_links',
    ];

    private function validateKey(string $key): void
    {
        if (!in_array($key, self::ALLOWED_KEYS, true)) {
            abort(422, "Clé de configuration invalide : {$key}");
        }
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
