<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'order_number',
        'date',
        'delivery_location',
        'delivery_fee',
        'detailed_address',
        'total_price',
        'status',
        'products', // Contient le tableau d'objets produits (id, name, qty, price, image_path)
    ];

    protected $casts = [
        'date'              => 'date',
        'delivery_fee'      => 'integer',
        'total_price'       => 'integer',
        'products'          => 'array', // Cast JSON vers Array PHP automatique
    ];
}