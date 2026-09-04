<?php

namespace App\Models;

use App\Traits\AutoApplyPermissionCheck;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Auth\User as Authenticatable;

class BaseAuthenticatable extends Authenticatable
{
    use AutoApplyPermissionCheck;

    /**
     * Scope a query to apply permission-based filtering
     *
     * @param Builder $query
     *
     * @return Builder
     */
    public function scopeWithPermissionCheck($query)
    {
        $tableName = $this->getTable();

        return $this->applyPermissionScope($query, $tableName);
    }
}
