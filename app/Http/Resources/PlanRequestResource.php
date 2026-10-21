<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Serializes plan requests into the structure expected by the
 * Subscriptions/PlanRequests Inertia page.
 *
 * Related models are eager-loaded by the listing query to avoid
 * N+1 queries. Missing related records are represented safely.
 */
class PlanRequestResource extends JsonResource
{
    /**
     * Transform the plan request into its frontend representation.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = $this->user;
        $plan = $this->plan;

        return [
            'id' => $this->id,

            'user' => $user ? [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => checkFile($user->avatar)
                    ?? getFile($user->avatar),
            ] : null,

            'plan' => $plan ? [
                'id' => $plan->id,
                'name' => $plan->name,
                'duration' => $plan->duration,
            ] : null,

            'status' => $this->status,
            'created_at' => $this->created_at,
            'approved_at' => $this->approved_at,
            'rejected_at' => $this->rejected_at,
        ];
    }
}
