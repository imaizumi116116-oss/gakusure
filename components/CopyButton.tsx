'use client';

import { useToast } from './ToastProvider';
import { copy } from '@/lib/copy';

type CopyButtonProps = {
  text: string;
};

export function CopyButton({ text }: CopyButtonProps) {
  const { push } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      push(copy.post.copySuccess, 'success');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      push(copy.post.copySuccess, 'success');
    }
  };

  return (
    <button type="button" onClick={handleCopy} className="soft-button">
      {copy.post.copy}
    </button>
  );
}
