<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Route;

class ListRouteNames extends Command
{
    protected $signature = 'route:names';

    protected $description = 'Hutoa orodha fupi ya majina ya route katika muundo wa PHP Array';

    public function handle(): void
    {
        $routes = collect(Route::getRoutes()->getRoutes());

        // Tenga kwa Middleware (Auth vs Guest vs Public)
        $groupedByAuth = $routes->groupBy(function ($route) {
            $middleware = collect($route->gatherMiddleware());

            if ($middleware->contains(fn ($m) => str_contains($m, 'auth'))) {
                return 'auth';
            }
            if ($middleware->contains(fn ($m) => str_contains($m, 'guest'))) {
                return 'guest';
            }

            return 'public';
        });

        $finalArray = [];

        // Chakata kila kundi na kubana majina kwa kutumia "*"
        foreach ($groupedByAuth as $authGroup => $routeCollection) {
            $routeNames = $routeCollection
                ->map(fn ($route) => $route->getName())
                ->filter()
                ->unique()
                ->sort();

            if ($routeNames->isEmpty()) {
                $finalArray[$authGroup] = [];
                continue;
            }

            $tightenedNames = collect();

            // Kikundi cha herufi kabla ya doti ya kwanza (.)
            foreach ($routeNames as $name) {
                if (str_contains($name, '.')) {
                    $parts = explode('.', $name);
                    $root = $parts[0];

                    // Angalia kama kuna routes nyingine zinazoanza na jina hili la mzizi
                    $siblings = $routeNames->filter(fn ($n) => str_starts_with($n, $root . '.'));

                    if ($siblings->count() > 1) {
                        $tightenedNames->push("{$root}.*");
                    } else {
                        $tightenedNames->push($name);
                    }
                } else {
                    $tightenedNames->push($name);
                }
            }

            // Hifadhi matokeo yaliyosafishwa kwenye array kuu
            $finalArray[$authGroup] = $tightenedNames->unique()->values()->toArray();
        }

        // Chapisha array kwenye terminal kwa muundo wa PHP unaosomeka vyema
        $this->line("[\n" . $this->formatArray($finalArray, 1) . "];");
    }

    /**
     * Husaidia kutengeneza mpangilio mzuri wa herufi (indentation) kwa ajili ya array output
     */
    private function formatArray(array $array, int $indentLevel = 1): string
    {
        $output = '';
        $indent = str_repeat('    ', $indentLevel);
        $closingIndent = str_repeat('    ', $indentLevel - 1);

        foreach ($array as $key => $value) {
            $formattedKey = is_int($key) ? $key : "'{$key}'";

            if (is_array($value)) {
                if (empty($value)) {
                    $output .= "{$indent}{$formattedKey} => [],\n";
                } else {
                    $output .= "{$indent}{$formattedKey} => [\n";
                    $output .= $this->formatArray($value, $indentLevel + 1);
                    $output .= "{$indent}],\n";
                }
            } else {
                $output .= "{$indent}'{$value}',\n";
            }
        }

        return $output;
    }
}
