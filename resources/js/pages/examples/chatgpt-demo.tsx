import { ChatGptButton, ChatGptField, ChatGptModal } from '@/components/chatgpt';
import { PageWrapper } from '@/components/PageWrapper';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function ChatGptDemo() {
    const { t: translate } = useTranslation();
    const [formData, setFormData] = useState({
        productName: '',
        description: '',
        marketingCopy: '',
    });
    const [showModal, setShowModal] = useState(false);
    const [showCouponDialog, setShowCouponDialog] = useState(false);
    const [showChatGptModal, setShowChatGptModal] = useState(false);

    const handleFieldChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleGenerateAll = (content: string) => {
        // Example of using generated content for multiple fields
        const lines = content.split('\n').filter((line) => line.trim());
        if (lines.length >= 3) {
            setFormData({
                productName: lines[0] || '',
                description: lines[1] || '',
                marketingCopy: lines[2] || '',
            });
        }
    };

    const breadcrumbs = [{ title: translate('Dashboard'), href: route('dashboard') }, { title: translate('ChatGPT Demo') }];

    return (
        <PageWrapper title="ChatGPT Integration Demo" breadcrumbs={breadcrumbs}>
            <div className="mx-auto max-w-4xl space-y-6">
                {/* Modal Stacking Demo */}
                <Card className="p-6">
                    <h2 className="mb-4 text-lg font-semibold">{translate('Modal Stacking Demo')}</h2>
                    <p className="mb-4 text-sm text-gray-600">
                        {translate('Test independent modal stacking: Open the Coupon Dialog, then open ChatGPT Modal on top of it.')}
                    </p>
                    <div className="space-x-2">
                        <Button onClick={() => setShowCouponDialog(true)}>Open Add Coupon Dialog</Button>
                        <Button variant="outline" onClick={() => setShowChatGptModal(true)}>
                            Open ChatGPT Modal
                        </Button>
                    </div>
                </Card>
                <Card className="p-6">
                    <h2 className="mb-4 text-lg font-semibold">{translate('Product Information Form')}</h2>

                    <div className="space-y-4">
                        {/* Example 1: ChatGptField for single input */}
                        <div>
                            <Label htmlFor="productName">{translate('Product Name')}</Label>
                            <ChatGptField
                                value={formData.productName}
                                onChange={(value) => handleFieldChange('productName', value)}
                                placeholder={translate('Enter product name')}
                                modalTitle="Generate Product Name"
                                modalPlaceholder="Describe your product and target market to generate a catchy product name"
                            />
                        </div>

                        {/* Example 2: ChatGptField for textarea */}
                        <div>
                            <Label htmlFor="description">{translate('Product Description')}</Label>
                            <ChatGptField
                                value={formData.description}
                                onChange={(value) => handleFieldChange('description', value)}
                                placeholder={translate('Enter product description')}
                                type="textarea"
                                rows={4}
                                modalTitle="Generate Product Description"
                                modalPlaceholder="Describe your product features, benefits, and target audience to generate a compelling description"
                            />
                        </div>

                        {/* Example 3: ChatGptField for marketing copy */}
                        <div>
                            <Label htmlFor="marketingCopy">{translate('Marketing Copy')}</Label>
                            <ChatGptField
                                value={formData.marketingCopy}
                                onChange={(value) => handleFieldChange('marketingCopy', value)}
                                placeholder={translate('Enter marketing copy')}
                                type="textarea"
                                rows={3}
                                modalTitle="Generate Marketing Copy"
                                modalPlaceholder="Create persuasive marketing copy that highlights your product's unique selling points"
                                buttonText="Generate Copy"
                            />
                        </div>

                        {/* Example 4: Standalone ChatGPT button for bulk generation */}
                        <div className="border-t pt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium">{translate('Bulk Content Generation')}</h3>
                                    <p className="text-sm text-gray-600">{translate('Generate all content at once')}</p>
                                </div>
                                <ChatGptButton onClick={() => setShowModal(true)} text="Generate All Content" variant="default" />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Display current form data */}
                <Card className="p-6">
                    <h3 className="mb-4 text-lg font-semibold">{translate('Current Form Data')}</h3>
                    <div className="space-y-2 text-sm">
                        <div>
                            <strong>{translate('Product Name')}:</strong> {formData.productName || translate('Not set')}
                        </div>
                        <div>
                            <strong>{translate('Description')}:</strong> {formData.description || translate('Not set')}
                        </div>
                        <div>
                            <strong>{translate('Marketing Copy')}:</strong> {formData.marketingCopy || translate('Not set')}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Bulk generation modal */}
            <ChatGptModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onGenerate={handleGenerateAll}
                title="Generate All Product Content"
                placeholder="Describe your product in detail. I'll generate a product name, description, and marketing copy for you. Separate each with a new line."
            />

            {/* Demo Coupon Dialog */}
            <Dialog open={showCouponDialog} onOpenChange={setShowCouponDialog}>
                <DialogContent modalId="demo-coupon-dialog">
                    <DialogHeader>
                        <DialogTitle>Add Coupon</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p>This is the Add Coupon Dialog content.</p>
                        <p className="text-sm text-gray-600">Click the button below to open ChatGPT Modal on top of this dialog.</p>

                        <Button onClick={() => setShowChatGptModal(true)}>Open ChatGPT Assistant</Button>

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button variant="outline" onClick={() => setShowCouponDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={() => setShowCouponDialog(false)}>Save Coupon</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Demo ChatGPT Modal */}
            <ChatGptModal
                isOpen={showChatGptModal}
                onClose={() => setShowChatGptModal(false)}
                onGenerate={(content) => {
                    setShowChatGptModal(false);
                }}
                title="AI Content Generator"
                placeholder="This ChatGPT modal opens on top of other dialogs..."
            />
        </PageWrapper>
    );
}
