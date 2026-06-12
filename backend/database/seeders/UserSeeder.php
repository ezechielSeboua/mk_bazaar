<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Création d'un administrateur
        User::create([
            'name' => 'Marie Dagua',
            'email' => 'marie.dagua@epitech.eu',
            //Utiliser bcrypt pour hasher le mot de passe
            'password' => bcrypt('password'),
            'is_admin' => true,
        ]);

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
