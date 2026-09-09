import { Button } from '@components/UserInterface/Button';
import Separator from '@components/UserInterface/Separator';
import { cn } from '@lib/utils';
import Color from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Bold,
    Code,
    Italic,
    Link as LinkIcon,
    List,
    ListOrdered,
    Quote,
    Redo,
    Strikethrough,
    Undo,
    Unlink,
} from 'lucide-react';
import { forwardRef, useImperativeHandle, useState } from 'react';

interface RichTextEditorProps {
    content?: string;
    onChange?: (content: string) => void;
    placeholder?: string;
    className?: string;
    editable?: boolean;
}

export interface RichTextEditorRef {
    getContent: () => string;
    setContent: (content: string) => void;
    focus: () => void;
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
    ({ content = '', onChange, placeholder: _placeholder = 'Start typing...', className, editable = true }, ref) => {
        const [showHtml, setShowHtml] = useState(false);
        const [htmlContent, setHtmlContent] = useState(content);

        const editor = useEditor({
            extensions: [
                StarterKit,
                TextStyle,
                Color,
                TextAlign.configure({
                    types: ['heading', 'paragraph'],
                }),
                Link.configure({
                    openOnClick: false,
                }),
            ],
            content,
            editable,
            onUpdate: ({ editor }) => {
                if (!showHtml) {
                    onChange?.(editor.getHTML());
                }
            },
        });

        useImperativeHandle(ref, () => ({
            getContent: () => editor?.getHTML() ?? '',
            setContent: (content: string) => editor?.commands.setContent(content),
            focus: () => editor?.commands.focus(),
        }));

        if (!editor) {
            return null;
        }

        const addLink = () => {
            const url = window.prompt('Enter URL:');
            if (url) {
                editor.chain().focus().setLink({ href: url }).run();
            }
        };

        const toggleHtmlView = () => {
            if (showHtml) {
                // Switch back to editor view
                editor?.commands.setContent(htmlContent, false);
                onChange?.(htmlContent);
                setShowHtml(false);
            } else {
                // Switch to HTML view - use original content if available
                const currentHtml = content || editor?.getHTML() || '';
                setHtmlContent(currentHtml);
                setShowHtml(true);
            }
        };

        const handleHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const newHtml = e.target.value;
            setHtmlContent(newHtml);
            onChange?.(newHtml);
        };

        return (
            <div className={cn('overflow-hidden rounded-lg border', className)}>
                {editable && (
                    <div className="bg-muted/50 flex flex-wrap gap-1 border-b p-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="lg"
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            className={editor.isActive('bold') ? 'bg-muted' : ''}
                        >
                            <Bold className="h-4 w-4" />
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            size="lg"
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            className={editor.isActive('italic') ? 'bg-muted' : ''}
                        >
                            <Italic className="h-4 w-4" />
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            size="lg"
                            onClick={() => editor.chain().focus().toggleStrike().run()}
                            className={editor.isActive('strike') ? 'bg-muted' : ''}
                        >
                            <Strikethrough className="h-4 w-4" />
                        </Button>

                        <Separator orientation="vertical" className="h-6" />

                        <Button
                            type="button"
                            variant="ghost"
                            size="lg"
                            onClick={() => editor.chain().focus().setTextAlign('left').run()}
                            className={editor.isActive({ textAlign: 'left' }) ? 'bg-muted' : ''}
                        >
                            <AlignLeft className="h-4 w-4" />
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            size="lg"
                            onClick={() => editor.chain().focus().setTextAlign('center').run()}
                            className={editor.isActive({ textAlign: 'center' }) ? 'bg-muted' : ''}
                        >
                            <AlignCenter className="h-4 w-4" />
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            size="lg"
                            onClick={() => editor.chain().focus().setTextAlign('right').run()}
                            className={editor.isActive({ textAlign: 'right' }) ? 'bg-muted' : ''}
                        >
                            <AlignRight className="h-4 w-4" />
                        </Button>

                        <Separator orientation="vertical" className="h-6" />

                        <Button
                            type="button"
                            variant="ghost"
                            size="lg"
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            className={editor.isActive('bulletList') ? 'bg-muted' : ''}
                        >
                            <List className="h-4 w-4" />
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            size="lg"
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                            className={editor.isActive('orderedList') ? 'bg-muted' : ''}
                        >
                            <ListOrdered className="h-4 w-4" />
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            size="lg"
                            onClick={() => editor.chain().focus().toggleBlockquote().run()}
                            className={editor.isActive('blockquote') ? 'bg-muted' : ''}
                        >
                            <Quote className="h-4 w-4" />
                        </Button>

                        <Separator orientation="vertical" className="h-6" />

                        <Button type="button" variant="ghost" size="lg" onClick={addLink}>
                            <LinkIcon className="h-4 w-4" />
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            size="lg"
                            onClick={() => editor.chain().focus().unsetLink().run()}
                            disabled={!editor.isActive('link')}
                        >
                            <Unlink className="h-4 w-4" />
                        </Button>

                        <Separator orientation="vertical" className="h-6" />

                        <Button
                            type="button"
                            variant="ghost"
                            size="lg"
                            onClick={() => editor.chain().focus().undo().run()}
                            disabled={!editor.can().undo()}
                        >
                            <Undo className="h-4 w-4" />
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            size="lg"
                            onClick={() => editor.chain().focus().redo().run()}
                            disabled={!editor.can().redo()}
                        >
                            <Redo className="h-4 w-4" />
                        </Button>

                        <Separator orientation="vertical" className="h-6" />

                        <Button type="button" variant="ghost" size="lg" onClick={toggleHtmlView} className={showHtml ? 'bg-muted' : ''}>
                            <Code className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {showHtml ? (
                    <textarea
                        value={htmlContent}
                        onChange={handleHtmlChange}
                        className="min-h-[200px] w-full resize-none border-0 bg-neutral-50 p-4 text-sm focus:outline-none"
                    />
                ) : (
                    <EditorContent
                        editor={editor}
                        className="prose prose-sm max-w-none [&_.ProseMirror]:min-h-[250px] [&_.ProseMirror]:cursor-text [&_.ProseMirror]:p-4 [&_.ProseMirror]:outline-none [&_.ProseMirror]:focus:outline-none"
                    />
                )}
            </div>
        );
    },
);

RichTextEditor.displayName = 'RichTextEditor';

export { RichTextEditor };
