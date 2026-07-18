'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';

export interface ConfirmOptions {
  title: string;
  /** Body copy or JSX shown under the title. */
  body?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm button in danger red for destructive actions. */
  danger?: boolean;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Branded replacement for the native `window.confirm()`.
 * Usage:  const confirm = useConfirm();
 *         if (await confirm({ title: 'Delete this?', danger: true })) { ... }
 */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    setOpts(options);
    return new Promise<boolean>((resolve) => { resolver.current = resolve; });
  }, []);

  const settle = useCallback((result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setOpts(null);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={!!opts}
        onClose={() => settle(false)}
        title={opts?.title ?? ''}
        maxWidth={420}
        footer={
          <>
            <button
              onClick={() => settle(false)}
              className="h-10 px-4 rounded-xl text-[13px] font-medium border transition hover:bg-[#F5F3EE]"
              style={{ borderColor: '#E5E0D4', color: '#65736B' }}
            >
              {opts?.cancelLabel ?? 'Cancel'}
            </button>
            <button
              onClick={() => settle(true)}
              className="h-10 px-5 rounded-xl text-[13px] font-semibold text-white transition hover:opacity-90"
              style={{ background: opts?.danger ? '#B8423C' : '#1F4D3A' }}
            >
              {opts?.confirmLabel ?? 'Confirm'}
            </button>
          </>
        }
      >
        {opts?.body != null && (
          <div className="text-[14px]" style={{ color: '#3A4A42', lineHeight: 1.55 }}>
            {opts.body}
          </div>
        )}
      </Modal>
    </ConfirmContext.Provider>
  );
}
