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
            'password' => bcrypt('password'),
            'is_admin' => true,
        ]);
    }
}
