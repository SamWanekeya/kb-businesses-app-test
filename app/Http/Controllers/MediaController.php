<?php

namespace App\Http\Controllers;

use App\Models\MediaItem;
use App\Models\User;
use App\Services\StorageConfigService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Storage;
use Validator;

class MediaController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        if (!$user->hasPermissionTo('manage-media')) {
            return response()->json([]);
        }

        $mediaItems = MediaItem::with('media')->latest()->get();

        $media = $mediaItems->flatMap(function ($item) use ($user) {
            $mediaQuery = $item->getMedia('images');

            // SuperAdmin can see all media
            if ($user->hasRole('super_admin')) {
                // No user_id filter for super_admin
            } // Users with manage-any-media can see all media
            elseif ($user->hasPermissionTo('manage-any-media')) {
                // Filter for manage-any-media
                $organizationUsersIds = User::where('created_by', createdBy())->orWhere('id', createdBy())->pluck('id');
                $mediaQuery = $mediaQuery->whereIn('user_id', $organizationUsersIds);
            } elseif ($user->hasPermissionTo('manage-own-media')) {
                // Can only see their own media
                $mediaQuery = $mediaQuery->where('user_id', $user->id);
            } else {
                $mediaQuery = collect();
            }

            return $mediaQuery->map(function ($media) {
                try {
                    $originalUrl = $this->getFullUrl($media->getUrl());
                    $thumbUrl = $originalUrl;

                    try {
                        $thumbUrl = $this->getFullUrl($media->getUrl('thumb'));
                    } catch (Exception $e) {
                        // Fail silently but log once for investigation
                        Log::error($e);
                        // If thumb conversion fails, use original
                    }

                    return [
                        'id' => $media->id,
                        'name' => $media->name,
                        'file_name' => $media->file_name,
                        'url' => $originalUrl,
                        'thumb_url' => $thumbUrl,
                        'size' => $media->size,
                        'mime_type' => $media->mime_type,
                        'user_id' => $media->user_id,
                        'created_at' => $media->created_at,
                    ];
                } catch (Exception $e) {
                    // Fail silently but log once for investigation
                    Log::error($e);

                    // Skip media files with unavailable storage disks
                    return null;
                }
            })->filter(); // Remove null entries
        });

        return response()->json($media);
    }

    private function getFullUrl($url)
    {
        if (str_starts_with($url, 'http')) {
            return $url;
        }

        $baseUrl = request()->getSchemeAndHttpHost();

        return $baseUrl . $url;
    }

    public function batchStore(Request $request)
    {
        // Validate storage configuration
        $storageValidation = $this->validateStorageConfig();
        if ($storageValidation) {
            return $storageValidation;
        }

        // Check storage limits
        $storageCheck = $this->checkStorageLimit($request->file('files'));
        if ($storageCheck) {
            return $storageCheck;
        }


        $config = StorageConfigService::getStorageConfig();

        // Normalize allowed file types to handle case sensitivity
        $allowedTypes = $config['allowed_file_types'];
        $normalizedTypes = strtolower($allowedTypes);
        $maximumSizeKB = (int)($config['storage_maximum_upload_size'] ?? 2048);
        $maximumSizeMB = round($maximumSizeKB / 1024, 2);
        $validationRules = StorageConfigService::getFileValidationRules();

        // Custom validation with user-friendly messages
        $validator = Validator::make($request->all(), [
            'files' => 'required|array',
            'files.*' => array_merge(['file'], $validationRules),
        ], [
            'files.*.mimes' => __('Only these file types are allowed: :type', [
                'type' => strtoupper(str_replace(',', ', ', $allowedTypes)),
            ]),
            'files.*.maximum' => __('File size cannot exceed :max MB.', ['maximum' => $maximumSizeMB]),
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => __('File validation failed'),
                'errors' => $validator->errors()->all(),
                'allowed_types' => $config['allowed_file_types'],
                'maximum_size_mb' => $maximumSizeMB,
            ], 422);
        }

        // Set max file size for Spatie Media Library (in bytes)
        config(['media-library.maximum_file_size' => $maximumSizeKB * 1024]);

        $uploadedMedia = [];
        $errors = [];

        foreach ($request->file('files') as $file) {
            try {
                $mediaItem = MediaItem::create([
                    'name' => $file->getClientOriginalName(),
                ]);

                $media = $mediaItem->addMedia($file)
                    ->toMediaCollection('images');

                $media->user_id = auth()->id();
                $media->save();

                // Update user storage usage
                $organization = User::find(createdBy());
                $this->updateStorageUsage($organization, $media->size);

                // Force thumbnail generationAdd commentMore actions
                try {
                    $media->getUrl('thumb');
                } catch (Exception $e) {
                    // Fail silently but log once for investigation
                    Log::error($e);
                    // Thumbnail generation failed, but continue
                }

                $originalUrl = $this->getFullUrl($media->getUrl());
                $thumbUrl = $originalUrl; // Default to original

                try {
                    $thumbUrl = $this->getFullUrl($media->getUrl('thumb'));
                } catch (Exception $e) {
                    // Fail silently but log once for investigation
                    Log::error($e);
                    // If thumb conversion fails, use original
                }

                $uploadedMedia[] = [
                    'id' => $media->id,
                    'name' => $media->name,
                    'file_name' => $media->file_name,
                    'url' => $originalUrl,
                    'thumb_url' => $thumbUrl,
                    'size' => $media->size,
                    'mime_type' => $media->mime_type,
                    'user_id' => $media->user_id,
                    'created_at' => $media->created_at,
                ];
            } catch (Exception $e) {
                // Fail silently but log once for investigation
                Log::error($e);
                if (isset($mediaItem)) {
                    $mediaItem->delete();
                }
                $errors[] = [
                    'file' => $file->getClientOriginalName(),
                    'error' => $this->getUserFriendlyError($e, $file->getClientOriginalName(), $maximumSizeMB),
                ];
            }
        }

        if (count($uploadedMedia) > 0 && empty($errors)) {
            return response()->json([
                'message' => count($uploadedMedia) . __(' file(s) uploaded successfully'),
                'data' => $uploadedMedia,
            ]);
        } elseif (count($uploadedMedia) > 0 && !empty($errors)) {
            return response()->json([
                'message' => count($uploadedMedia) . ' uploaded, ' . count($errors) . ' failed',
                'data' => $uploadedMedia,
                'errors' => array_column($errors, 'error'),
            ]);
        } else {
            return response()->json([
                'message' => 'Upload failed',
                'errors' => array_column($errors, 'error'),
            ], 422);
        }
    }

    private function validateStorageConfig()
    {
        try {
            $disk = StorageConfigService::getActiveDisk();
            $storage = Storage::disk($disk);

            // Test if we can write to the storage
            $testFile = 'test_' . time() . '.txt';
            $storage->put($testFile, 'test');
            $storage->delete($testFile);

            return null; // No error
        } catch (Exception $e) {
            // Fail silently but log once for investigation
            Log::error($e);

            return response()->json([
                'message' => __('Storage configuration error'),
                'errors' => [__('Unable to access storage. Please check storage settings.')],
            ], 500);
        }
    }

    private function checkStorageLimit($files)
    {
        $user = auth()->user();
        if ($user->type === 'super_admin') {
            return null;
        }

        $limit = $this->getUserStorageLimit($user);
        if (!$limit) {
            return null;
        }

        $uploadSize = collect($files)->sum('size');
        $currentUsage = $this->getUserStorageUsage($user);

        if (($currentUsage + $uploadSize) > $limit) {
            return response()->json([
                'message' => __('Storage limit exceeded'),
                'errors' => [__('Please delete files or upgrade plan')],
            ], 422);
        }

        return null;
    }

    private function getUserStorageLimit($user)
    {
        if ($user->type === 'organization' && $user->plan) {
            return $user->plan->storage_limit * 1024 * 1024 * 1024;
        }

        if ($user->created_by) {
            $organization = User::find($user->created_by);
            if ($organization && $organization->plan) {
                return $organization->plan->storage_limit * 1024 * 1024 * 1024;
            }
        }

        return null;
    }

    private function getUserStorageUsage($user)
    {
        if ($user->type === 'organization') {
            // Get storage usage for organization and all its staff
            $organizationUsers = User::where('created_by', $user->id)->pluck('id')->push($user->id);

            return Media::whereIn('user_id', $organizationUsers)->sum('size');
        }

        if ($user->created_by) {
            // Get storage usage for entire organization
            $organization = User::find($user->created_by);
            if ($organization) {
                $organizationUsers = User::where('created_by', $organization->id)->pluck('id')->push($organization->id);

                return Media::whereIn('user_id', $organizationUsers)->sum('size');
            }
        }

        // Individual user storage usage
        return Media::where('user_id', $user->id)->sum('size');
    }

    private function updateStorageUsage($user, $size)
    {
        if ($user->storage_limit == 0) {
            $user->increment('storage_limit', $this->getUserStorageUsage($user));
        }
        $user->increment('storage_limit', $size);
    }

    private function getUserFriendlyError(Exception $e, $fileName, $maximumSizeMB = null): string
    {
        $message = $e->getMessage();
        $extension = strtoupper(pathinfo($fileName, PATHINFO_EXTENSION));

        Log::error('Media upload error', [
            'file' => $fileName,
            'error' => $message,
            'trace' => $e->getTraceAsString(),
        ]);

        // Handle media library collection errors
        if (str_contains($message, 'was not accepted into the collection')) {
            if (str_contains($message, 'mime:')) {
                return __("File type not allowed: :extension. Please check your storage settings.", ['extension' => $extension]);
            }

            return __("File format not supported: :extension. Please check your storage settings.", ['extension' => $extension]);
        }

        // Handle storage disk errors
        if (str_contains($message, 'storage') || str_contains($message, 'disk') || str_contains($message, 'No such file or directory')) {
            return __("Storage error: :extension. Please check storage configuration.", ['extension' => $extension]);
        }

        // Handle file size errors
        if (str_contains($message, 'size') || str_contains($message, 'large') || str_contains($message, 'exceeds')) {
            if ($maximumSizeMB) {
                return __("Max :max MB is allowed.", ['maximum' => $maximumSizeMB]);
            }

            return __("File too large: :extension", ['extension' => $extension]);
        }

        // Handle permission errors
        if (str_contains($message, 'permission') || str_contains($message, 'denied') || str_contains($message, 'not writable')) {
            return __("Permission denied: :extension. Check directory permissions.", ['extension' => $extension]);
        }

        // Handle image processing errors
        if (str_contains($message, 'image') || str_contains($message, 'conversion') || str_contains($message, 'gd') || str_contains($message, 'imagick')) {
            return __("Image processing error: :extension. File may be corrupted.", ['extension' => $extension]);
        }

        // Generic fallback with more detail
        return __("Upload failed: :extension. Error: :error", ['extension' => $extension, 'error' => substr($message, 0, 100)]);
    }

    public function download($id)
    {
        $user = auth()->user();
        $query = Media::where('id', $id);

        // SuperAdmin and users with manage-any-media can download any media
        if ($user->type !== 'super_admin' && !$user->hasPermissionTo('manage-any-media')) {
            $query->where('user_id', $user->id);
        }

        $media = $query->firstOrFail();

        try {
            $filePath = $media->getPath();

            if (!file_exists($filePath)) {
                abort(404, __('File not found'));
            }

            return response()->download($filePath, $media->file_name);
        } catch (Exception $e) {
            // Fail silently but log once for investigation
            Log::error($e);
            abort(404, __('File storage unavailable'));
        }
    }

    public function destroy($id)
    {
        $user = auth()->user();
        $query = Media::where('id', $id);

        // SuperAdmin and users with manage-any-media can delete any media
        if ($user->type !== 'super_admin' && !$user->hasPermissionTo('manage-any-media')) {
            $query->where('user_id', $user->id);
        }

        $media = $query->firstOrFail();
        $mediaItem = $media->model;

        $fileSize = $media->size;

        try {
            $media->delete();
        } catch (Exception $e) {
            // Fail silently but log once for investigation
            Log::error($e);
            // If storage disk is unavailable, force delete from database
            $media->forceDelete();
        }

        // Update user storage usage
        $organization = User::find(createdBy());
        $this->updateStorageUsage($organization, -$fileSize);

        // Delete the MediaItem if it has no more media files
        if ($mediaItem && $mediaItem->getMedia()->count() === 0) {
            $mediaItem->delete();
        }

        return response()->json(['message' => __('Media deleted successfully')]);
    }

    /**
     * Render the Inertia media library page with storage limits.
     */
    public function mediaLibrary(Request $request): Response
    {
        $planLimits = null;
        $user = $request->user();

        if ($user && $user->type === 'organization') {
            $plan = $user->getCurrentPlan();

            if ($plan && $plan->storage_limit > 0) {
                // Pata watumiaji wote waliofunguliwa na shirika hili, pamoja na shirika lenyewe
                $organizationUsers = User::where('created_by', $user->id)
                    ->pluck('id')
                    ->push($user->id);

                // Hesabu jumla ya nafasi iliyotumika sasa hivi
                $currentStorageUsage = Media::whereIn('user_id', $organizationUsers)
                    ->sum('size');

                // Badilisha kikomo cha GB kwenda kwenye Bytes
                $storageLimit = $plan->storage_limit * 1024 * 1024 * 1024;

                $planLimits = [
                    'current_storage' => $currentStorageUsage,
                    'maximum_storage' => $storageLimit,
                    'can_create' => $currentStorageUsage < $storageLimit,
                ];
            }
        }

        return Inertia::render('MediaLibrary', [
            'planLimits' => $planLimits,
        ]);
    }
}
