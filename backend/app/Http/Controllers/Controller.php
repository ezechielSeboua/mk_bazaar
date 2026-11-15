<?php

namespace App\Http\Controllers;

abstract class Controller
{
    /**
     * Vrai si la requête porte un jeton d'administrateur valide.
     * Sert aux routes publiques qui exposent davantage aux admins (produits inactifs…).
     */
    protected function requestIsAdmin(): bool
    {
        return (bool) auth('api')->user()?->is_admin;
    }
}
