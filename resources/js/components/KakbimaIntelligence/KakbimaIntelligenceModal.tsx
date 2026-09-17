import { Button } from '@components/UserInterface/Button';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/Select';
import { Textarea } from '@components/UserInterface/Textarea';
import { useEffect, useState } from 'react';

import { toast } from '@components/CustomToast';
import useStackedModal from '@hooks/useStackedModal';
import { usePage } from '@inertiajs/react';
import languageData from '@lang/language.json';
import { route } from '@utils/Routes';
import { Check, Copy, Loader2, Sparkles, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

interface KakbimaIntelligenceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (content: string) => void;
    title?: string;
}

export default function KakbimaIntelligenceModal({ isOpen, onClose, onGenerate, title = 'AI Content Generator' }: KakbimaIntelligenceModalProps) {
    const { t: translate } = useTranslation();
    const { csrfToken } = usePage().props;

    useStackedModal('kakbima-intelligence-modal', isOpen);
    const [prompt, setPrompt] = useState('');
    const [generatedContent, setGeneratedContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [language, setLanguage] = useState('en');
    const [creativity, setCreativity] = useState('medium');
    const [numResults, setNumResults] = useState(1);
    const [maxLength, setMaxLength] = useState(150);
    const [selectedText, setSelectedText] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Force remove inert from document to allow Kakbima Intelligence modal interaction
            const removeInert = () => {
                document.body.removeAttribute('inert');
                document.documentElement.removeAttribute('inert');
                const allElements = document.querySelectorAll('[inert]');
                allElements.forEach((el) => {
                    el.removeAttribute('inert');
                });
            };

            removeInert();
            // Keep removing inert as Radix might re-add it
            const interval = setInterval(removeInert, 100);

            return () => {
                clearInterval(interval);
            };
        }
    }, [isOpen]);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            toast.error(translate('Please enter a prompt'));
            return;
        }
        const toastId = toast.loading(translate('Generating response...'));

        setIsLoading(true);
        try {
            const response = await fetch(route('kakbima-intelligence.generate'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
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

            // Check both HTTP status and success flag from controller
            if (response.ok && data.success !== false) {
                setGeneratedContent(data.content);
                toast.success(translate('Content generated successfully'));
            } else {
                // Show error message from controller or default message
                const errorMessage = data.message;
                toast.error(translate(errorMessage));
            }
        } catch (errors) {
            toast.dismiss(toastId);

            Object.values(errors).forEach((message) => {
                toast.error(translate(message));
            });
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
        setPrompt('');
        setGeneratedContent('');
        setSelectedText('');
        setCopied(false);
        onClose();
    };

    const copyToClipboard = async (text: string) => {
        const toastId = toast.loading(translate('Copying response...'));
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast.success(translate('Copied to clipboard'));
            setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch (errors) {
            toast.dismiss(toastId);

            Object.values(errors).forEach((message) => {
                toast.error(translate(message));
            });
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
        <div
            className="fixed inset-0 flex items-center justify-center"
            style={{ zIndex: 99999 }}
            data-kakbima-intelligence-modal
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    handleClose();
                }
            }}
        >
            <div className="fixed inset-0 bg-black/30" />
            <div
                className="bg-whitedark:bg-neutral-800 relative mx-4 w-full max-w-2xl rounded-lg border shadow-xl dark:bg-neutral-800"
                style={{ zIndex: 100000 }}
                onClick={(e) => {
                    e.stopPropagation();
                }}
            >
                <div className="flex items-center justify-between border-b p-6">
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                        <Sparkles className="h-5 w-5 text-blue-500" />
                        {translate(title)}
                    </h2>
                    <button onClick={handleClose} className="rounded-full p-1 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-700">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4 p-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>{translate('Language')}</Label>
                            <Select value={language} onValueChange={setLanguage}>
                                <SelectTrigger>
                                    <SelectValue placeholder={translate('Select...')} />
                                </SelectTrigger>
                                <SelectContent style={{ zIndex: 100010 }}>
                                    {languageData.map((lang) => (
                                        <SelectItem key={lang.code} value={lang.code}>
                                            {lang.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>{translate('Ai creativity')}</Label>
                            <Select value={creativity} onValueChange={setCreativity}>
                                <SelectTrigger>
                                    <SelectValue placeholder={translate('Select...')} />
                                </SelectTrigger>
                                <SelectContent style={{ zIndex: 100010 }}>
                                    <SelectItem value="low">{translate('Low')} (0.3)</SelectItem>
                                    <SelectItem value="medium">{translate('Medium')} (0.7)</SelectItem>
                                    <SelectItem value="high">{translate('High')} (0.9)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>{translate('Number of results')}</Label>
                            <Input
                                type="number"
                                inputMode="decimal"
                                value={numResults}
                                onChange={(e) => {
                                    setNumResults(Number(e.target.value));
                                }}
                                min={1}
                                max={5}
                            />
                        </div>
                        <div>
                            <Label>{translate('Maximum result length')}</Label>
                            <Input
                                type="number"
                                inputMode="decimal"
                                value={maxLength}
                                onChange={(e) => {
                                    setMaxLength(Number(e.target.value));
                                }}
                                min={50}
                                max={500}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="prompt">{translate('Add a new text')}</Label>
                        <Textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => {
                                setPrompt(e.target.value);
                            }}
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
                                <Label htmlFor="generated">{translate('Output text')}</Label>
                                <div className="flex gap-2">
                                    {selectedText && (
                                        <Button size="lg" variant="outline" onClick={() => copyToClipboard(selectedText)}>
                                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                            {translate('Copy selected')}
                                        </Button>
                                    )}
                                    <Button size="lg" variant="outline" onClick={() => copyToClipboard(generatedContent)}>
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        {translate('Copy text')}
                                    </Button>
                                </div>
                            </div>
                            <Textarea
                                id="generated-content"
                                value={generatedContent}
                                onChange={(e) => {
                                    setGeneratedContent(e.target.value);
                                }}
                                onSelect={handleTextSelection}
                                rows={6}
                                className="mt-1"
                            />
                            <div className="mt-2 flex gap-2">
                                <Button onClick={handleUse} className="flex-1">
                                    {translate('Use this content')}
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
