<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Création d'un administrateur
        User::create([
            'name'     => 'Marie Dagua',
            'email'    => env('ADMIN_EMAIL', 'marie.dagua@epitech.eu'),
            'password' => bcrypt(env('ADMIN_SEED_PASSWORD', Str::random(32))),
        ]);

        // Définir is_admin via forceFill (non mass-assignable)
        User::where('email', env('ADMIN_EMAIL', 'marie.dagua@epitech.eu'))
            ->first()
            ?->forceFill(['is_admin' => true])
            ->save();

        // Création d'un utilisateur régulier
        // User::create([
        //     'name' => 'Utilisateur Test',
        //     'email' => 'user@example.com',
        //     'password' => 'password',
        //     'is_admin' => false,
        // ]);

        // Création de 10 utilisateurs aléatoires
        // User::factory(10)->create([
        //     'password' => 'password',
        // ]);
    }
}
