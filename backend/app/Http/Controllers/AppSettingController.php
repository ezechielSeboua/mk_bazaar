<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class AppSettingController extends Controller
{
    /**
     * Récupérer une configuration spécifique par sa clé
     */
    public function getByKey(string $key)
    {
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
