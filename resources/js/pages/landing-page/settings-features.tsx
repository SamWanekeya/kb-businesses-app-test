import MediaPicker from '@/components/MediaPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useBrand } from '@/contexts/BrandContext';
import { THEME_COLORS } from '@/hooks/use-appearance';
import { getDisplayUrl } from '@/utils/helper';
import { Layout, Palette, Plus, Star, Trash2, Type } from 'lucide-react';

export default function FeaturesSection({
    data,
    setData,
    errors,
    handleInputChange,
    getSectionData,
    updateSectionData,
    updateSectionVisibility,
    t = (key) => key,
}) {
    const { themeColor, customColor } = useBrand();
    const brandColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];

    // Helper function to convert full URL to relative path for database storage
    const convertToRelativePath = (url: string): string => {
        if (!url) return url;
        if (!url.startsWith('http')) return url;
        const storageIndex = url.indexOf('/storage/');
        return storageIndex !== -1 ? url.substring(storageIndex) : url;
    };

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
                            <Layout className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('Features Layout')}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('Configure features section layout and columns')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label className="text-sm max-[400px]:hidden">{t('Enable Section')}</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div>
                                        <Switch
                                            checked={data.config_sections?.section_visibility?.features !== false}
                                            onCheckedChange={(checked) => updateSectionVisibility('features', checked)}
                                        />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="min-[400px]:hidden">
                                    <p>{t('Enable Section')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                        <Label htmlFor="features_layout">{t('Layout Style')}</Label>
                        <select
                            id="features_layout"
                            name="features_layout"
                            value={getSectionData('features').layout || 'grid'}
                            onChange={(e) => updateSectionData('features', { layout: e.target.value })}
                            className="w-full rounded-md border border-gray-300 p-2"
                        >
                            <option value="grid">Grid</option>
                            <option value="list">List</option>
                            <option value="cards">Cards</option>
                            <option value="alternating">Alternating</option>
                        </select>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="features_columns">{t('Columns')}</Label>
                        <select
                            id="features_columns"
                            name="features_columns"
                            value={getSectionData('features').columns || 3}
                            onChange={(e) => updateSectionData('features', { columns: parseInt(e.target.value) })}
                            className="w-full rounded-md border border-gray-300 p-2"
                        >
                            <option value="1">1 Column</option>
                            <option value="2">2 Columns</option>
                            <option value="3">3 Columns</option>
                            <option value="4">4 Columns</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-lg bg-green-100 p-2">
                        <Type className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{t('Features Content')}</h3>
                        <p className="text-sm text-gray-500">{t('Features section title and description')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-3">
                        <Label htmlFor="features_title">{t('Features Title')}</Label>
                        <Input
                            id="features_title"
                            name="features_title"
                            value={getSectionData('features').title || ''}
                            onChange={(e) => updateSectionData('features', { title: e.target.value })}
                            placeholder="Features section title"
                        />
                        {errors.features_title && <p className="text-sm text-red-600">{errors.features_title}</p>}
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="features_description">{t('Features Description')}</Label>
                        <Textarea
                            id="features_description"
                            name="features_description"
                            value={getSectionData('features').description || ''}
                            onChange={(e) => updateSectionData('features', { description: e.target.value })}
                            placeholder={t('Description text for features section')}
                            rows={3}
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="features_show_icons">{t('Show Icons')}</Label>
                            <Switch
                                id="features_show_icons"
                                name="features_show_icons"
                                checked={getSectionData('features').show_icons !== false}
                                onCheckedChange={(checked) => updateSectionData('features', { show_icons: checked })}
                            />
                        </div>
                        <p className="text-muted-foreground text-xs">{t('Display icons with features')}</p>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-lg bg-purple-100 p-2">
                        <Palette className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{t('Features Style')}</h3>
                        <p className="text-sm text-gray-500">{t('Background colors and section image')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                        <Label htmlFor="features_background_color">{t('Background Color')}</Label>
                        <div className="flex gap-2">
                            <Input
                                id="features_background_color"
                                name="features_background_color"
                                type="color"
                                value={getSectionData('features').background_color || '#ffffff'}
                                onChange={(e) => updateSectionData('features', { background_color: e.target.value })}
                                className="h-10 w-16 cursor-pointer p-1"
                            />
                            <Input
                                value={getSectionData('features').background_color || '#ffffff'}
                                onChange={(e) => updateSectionData('features', { background_color: e.target.value })}
                                placeholder="#ffffff"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <MediaPicker
                            label="Section Image"
                            value={getDisplayUrl(getSectionData('features').image || '')}
                            onChange={(value) => {
                                updateSectionData('features', { image: convertToRelativePath(value) });
                            }}
                            placeholder={t('Select features section image...')}
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-lg bg-orange-100 p-2">
                        <Star className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{t('Feature Boxes')}</h3>
                        <p className="text-sm text-gray-500">{t('Individual feature items with icons')}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {(getSectionData('features').features_list || []).map((feature, index) => (
                        <div key={index} className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                            <div className="mb-4 flex items-center justify-between">
                                <h4 className="flex items-center gap-2 font-semibold text-gray-900">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
                                        {index + 1}
                                    </span>
                                    {t('Feature')} {index + 1}
                                </h4>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() => {
                                        const newFeatures = (getSectionData('features').features_list || []).filter((_, i) => i !== index);
                                        updateSectionData('features', { features_list: newFeatures });
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="space-y-3">
                                    <Label htmlFor={`feature_${index}_title`}>{t('Title')}</Label>
                                    <Input
                                        id={`feature_${index}_title`}
                                        value={feature.title || ''}
                                        onChange={(e) => {
                                            const newFeatures = [...(getSectionData('features').features_list || [])];
                                            newFeatures[index] = { ...newFeatures[index], title: e.target.value };
                                            updateSectionData('features', { features_list: newFeatures });
                                        }}
                                        placeholder="Feature title"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor={`feature_${index}_icon`}>{t('Icon')}</Label>
                                    <select
                                        id={`feature_${index}_icon`}
                                        value={feature.icon || 'qr-code'}
                                        onChange={(e) => {
                                            const newFeatures = [...(getSectionData('features').features_list || [])];
                                            newFeatures[index] = { ...newFeatures[index], icon: e.target.value };
                                            updateSectionData('features', { features_list: newFeatures });
                                        }}
                                        className="w-full rounded-md border border-gray-300 p-2"
                                    >
                                        <option value="qr-code">QR Code</option>
                                        <option value="smartphone">Smartphone</option>
                                        <option value="share">Share</option>
                                        <option value="bar-chart">Bar Chart</option>
                                        <option value="globe">Globe</option>
                                        <option value="shield">Shield</option>
                                        <option value="star">Star</option>
                                        <option value="zap">Zap</option>
                                        <option value="users">Users</option>
                                        <option value="lock">Lock</option>
                                        <option value="wifi">Wifi</option>
                                        <option value="heart">Heart</option>
                                        <option value="trending-up">TrendingUp</option>
                                    </select>
                                </div>

                                <div className="space-y-3 md:col-span-1">
                                    <Label htmlFor={`feature_${index}_description`}>{t('Description')}</Label>
                                    <Textarea
                                        id={`feature_${index}_description`}
                                        value={feature.description || ''}
                                        onChange={(e) => {
                                            const newFeatures = [...(getSectionData('features').features_list || [])];
                                            newFeatures[index] = { ...newFeatures[index], description: e.target.value };
                                            updateSectionData('features', { features_list: newFeatures });
                                        }}
                                        placeholder={t('Feature description')}
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full px-0 min-[380px]:h-9 min-[380px]:w-auto min-[380px]:px-4"
                        style={{ color: brandColor, borderColor: brandColor }}
                        onClick={() => {
                            const newFeatures = [
                                ...(getSectionData('features').features_list || []),
                                { title: '', description: '', icon: 'qr-code' },
                            ];
                            updateSectionData('features', { features_list: newFeatures });
                        }}
                        title={t('Add Feature Box')}
                    >
                        <Plus className="mr-0 h-4 w-4 min-[380px]:mr-2" />
                        <span className="hidden min-[380px]:inline">{t('Add Feature Box')}</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
