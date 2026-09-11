import { toast } from '@components/CustomToast';
import { Button } from '@components/UserInterface/Button';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/Select';
import { Textarea } from '@components/UserInterface/Textarea';
import useStackedModal from '@hooks/useStackedModal';
import { usePage } from '@inertiajs/react';
import languageData from '@lang/language.json';
import { route } from '@utils/Routes';
import { Check, Copy, Loader2, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import ReactCountryFlag from 'react-country-flag';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

interface ChatGptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (content: string) => void;
    title?: string;
    placeholder?: string;
}

export function ChatGptModal({
    isOpen,
    onClose,
    onGenerate,
    title = 'AI Content Generator',
    placeholder = 'Describe what you want to generate...',
}: ChatGptModalProps) {
    const { t: translate } = useTranslation();
    const { csrf_token } = usePage().props;
    const { modalId, zIndex } = useStackedModal('chatgpt-modal', isOpen);
    const [prompt, setPrompt] = useState('');
    const [generatedContent, setGeneratedContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [language, setLanguage] = useState('en');
    const [creativity, setCreativity] = useState('medium');
    const [numResults, setNumResults] = useState(1);
    const [maxLength, setMaxLength] = useState(150);
    const [selectedText, setSelectedText] = useState('');
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            toast.error(translate('Please enter a prompt'));
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(route('chatgpt.generate'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf_token,
                },
                body: JSON.stringify({
                    prompt,
                    language,
                    creativity,
                    num_results: numResults,
                    maximum_length: maxLength,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.success == false) {
                    toast.error(data.message);
                    return;
                }
                setGeneratedContent(data.content);
            } else {
                toast.error(data.message || translate('Failed to generate content'));
            }
        } catch (error) {
            toast.error(translate('Error connecting to AI service'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleUse = () => {
        if (generatedContent) {
            onGenerate(generatedContent);
            handleClose();
        }
    };

    const handleClose = () => {
        setPromptranslate('');
        setGeneratedContentranslate('');
        setSelectedTextranslate('');
        setCopied(false);
        onClose();
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast.success(translate('Copied to clipboard'));
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast.error(translate('Failed to copy'));
        }
    };

    const handleTextSelection = () => {
        const textarea = document.getElementById('generated-content') as HTMLTextAreaElement;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const selected = textarea.value.substring(start, end);
            setSelectedText(selected);
        }
    };

    if (!isOpen) {
        return null;
    }

    const modalContent = (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex }}>
            <div className="fixed inset-0 bg-black/50" />
            <div
                className="pointer-events-auto mx-4 w-full max-w-2xl rounded-lg border bg-white shadow-xl dark:bg-gray-800"
                style={{ zIndex: zIndex + 1 }}
            >
                <div className="flex items-center justify-between border-b p-6">
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                        <Sparkles className="text-primary h-5 w-5" />
                        {translate(title)}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="cursor-pointer rounded-full p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4 p-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>{translate('Language')}</Label>
                            <Select value={language} onValueChange={setLanguage}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent style={{ zIndex: zIndex + 10 }}>
                                    {languageData.map((lang) => (
                                        <SelectItem key={lang.code} value={lang.code}>
                                            <ReactCountryFlag
                                                countryCode={lang.countryCode}
                                                svg
                                                style={{ width: '1em', height: '1em', marginRight: '8px' }}
                                            />
                                            {lang.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>{translate('AI Creativity')}</Label>
                            <Select value={creativity} onValueChange={setCreativity}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent style={{ zIndex: zIndex + 10 }}>
                                    <SelectItem value="low">{translate('Low')} (0.3)</SelectItem>
                                    <SelectItem value="medium">{translate('Medium')} (0.7)</SelectItem>
                                    <SelectItem value="high">{translate('High')} (0.9)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>{translate('Number of Results')}</Label>
                            <Input type="number" value={numResults} onChange={(e) => setNumResults(Number(e.target.value))} min={1} max={5} />
                        </div>
                        <div>
                            <Label>{translate('Max Result Length')}</Label>
                            <Input type="number" value={maxLength} onChange={(e) => setMaxLength(Number(e.target.value))} min={50} max={500} />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="prompt">{translate('Add Text')}</Label>
                        <Textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={translate(placeholder)}
                            rows={3}
                            className="mt-1"
                        />
                    </div>

                    <Button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="w-full">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {translate('Generating...')}
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                {translate('Generate')}
                            </>
                        )}
                    </Button>

                    {generatedContent && (
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <Label htmlFor="generated">{translate('Output Text')}</Label>
                                <div className="flex gap-2">
                                    {selectedText && (
                                        <Button size="sm" variant="outline" onClick={() => copyToClipboard(selectedText)}>
                                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                            {translate('Copy Selected')}
                                        </Button>
                                    )}
                                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(generatedContent)}>
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        {translate('Copy Text')}
                                    </Button>
                                </div>
                            </div>
                            <Textarea
                                id="generated-content"
                                value={generatedContent}
                                onChange={(e) => setGeneratedContent(e.target.value)}
                                onSelect={handleTextSelection}
                                rows={6}
                                className="mt-1"
                            />
                            <div className="mt-2 flex gap-2">
                                <Button onClick={handleUse} className="flex-1">
                                    {translate('Use This Content')}
                                </Button>
                                <Button variant="outline" onClick={handleGenerate} disabled={isLoading}>
                                    {translate('Regenerate')}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
