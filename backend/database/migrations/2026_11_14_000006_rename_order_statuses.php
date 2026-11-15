<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Statuts de la maquette : Envoyée → Validée → En livraison → Livrée (+ Annulée).
 *
 *   pending    → pending    (envoyée, en attente de validation)
 *   processing → confirmed  (validée, en traitement)
 *   (nouveau)  → shipping   (en livraison)
 *   completed  → delivered  (livrée)
 *   cancelled  → cancelled
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('orders')->where('status', 'processing')->update(['status' => 'confirmed']);
        DB::table('orders')->where('status', 'completed')->update(['status' => 'delivered']);
    }

    public function down(): void
    {
        DB::table('orders')->whereIn('status', ['confirmed', 'shipping'])->update(['status' => 'processing']);
        DB::table('orders')->where('status', 'delivered')->update(['status' => 'completed']);
    }
};
