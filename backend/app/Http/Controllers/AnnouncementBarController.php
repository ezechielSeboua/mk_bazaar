<?php

namespace App\Http\Controllers;

use App\Models\AnnouncementBar;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Bandeaux d'annonce affichés à tour de rôle en haut du site.
 */
class AnnouncementBarController extends Controller
{
    /**
     * Lien interne (« /offres ») ou https:// uniquement : la valeur est servie
     * publiquement et réinjectée dans un href.
     */
    private const LINK_PATTERN = '/^(\/(?!\/)[^\s]*|https:\/\/[^\s]+)$/';

    /** Public : bandeaux à afficher maintenant, dans l'ordre. */
    public function index(): JsonResponse
    {
        return response()->json(
            AnnouncementBar::visible()->get(['id', 'message', 'link', 'starts_at', 'ends_at', 'is_active', 'sort_order'])
        );
    }

    /** Admin : tous les bandeaux, avec leur statut (displayed, scheduled, ended, inactive). */
    public function all(): JsonResponse
    {
        return response()->json(
            AnnouncementBar::orderBy('sort_order')->orderBy('id')->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateBar($request);
        $validated['sort_order'] ??= (int) AnnouncementBar::max('sort_order') + 1;

        return response()->json(AnnouncementBar::create($validated), 201);
    }

    public function update(Request $request, AnnouncementBar $announcementBar): JsonResponse
    {
        $announcementBar->update($this->validateBar($request, $announcementBar));

        return response()->json($announcementBar);
    }

    public function destroy(AnnouncementBar $announcementBar): JsonResponse
    {
        $announcementBar->delete();

        return response()->json(['message' => 'Bandeau supprimé.']);
    }

    /** Reçoit les identifiants dans le nouvel ordre (glisser-déposer). */
    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer|distinct|exists:announcement_bars,id',
        ]);

        DB::transaction(function () use ($validated) {
            foreach ($validated['ids'] as $position => $id) {
                AnnouncementBar::where('id', $id)->update(['sort_order' => $position]);
            }
        });

        return response()->json(['message' => 'Ordre enregistré.']);
    }

    private function validateBar(Request $request, ?AnnouncementBar $bar = null): array
    {
        $validated = $request->validate([
            'message'    => ($bar ? 'sometimes' : 'required') . '|string|max:255',
            'link'       => ['nullable', 'string', 'max:255', 'regex:' . self::LINK_PATTERN],
            'starts_at'  => 'nullable|date',
            'ends_at'    => 'nullable|date',
            'is_active'  => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer|min:0|max:65535',
        ]);

        $starts = array_key_exists('starts_at', $validated) ? $validated['starts_at'] : $bar?->starts_at;
        $ends   = array_key_exists('ends_at', $validated) ? $validated['ends_at'] : $bar?->ends_at;

        if ($starts && $ends && strtotime((string) $ends) < strtotime((string) $starts)) {
            throw ValidationException::withMessages(['ends_at' => ['La date de fin doit suivre la date de début.']]);
        }

        return $validated;
    }
}
