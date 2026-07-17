'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  WifiOff,
  SearchX,
  Lock,
  Sparkles,
  CheckCircle2,
  Info,
  Inbox,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// The one full-block status component for the whole app — a consistent
// icon-in-circle treatment, a title, a SPECIFIC message (never a blanket
// "couldn't load"), and up to two actions. Used for route-level error
// boundaries, empty states, and inline failure/success blocks alike so every
// surface reads the same visual language instead of each screen inventing
// its own ad-hoc "Something went wrong" markup.

export type StatusKind = 'error' | 'warning' | 'success' | 'info' | 'empty';
export type StatusReason =
  | 'network'
  | 'not-found'
  | 'permission'
  | 'plan'
  | 'validation'
  | 'generic';

// Tailwind's JIT scanner needs literal class names in source — a template
// string like `bg-${color}/10` is invisible to it and silently produces no
// CSS. Every combination is spelled out here instead.
const KIND_STYLE: Record<StatusKind, { circle: string; icon: string }> = {
  error: { circle: 'bg-danger/10', icon: 'text-danger' },
  warning: { circle: 'bg-warning/10', icon: 'text-warning' },
  success: { circle: 'bg-success/10', icon: 'text-success' },
  info: { circle: 'bg-info/10', icon: 'text-info' },
  empty: { circle: 'bg-primary-soft', icon: 'text-primary' },
};

const REASON_ICON: Record<StatusReason, LucideIcon> = {
  network: WifiOff,
  'not-found': SearchX,
  permission: Lock,
  plan: Sparkles,
  validation: AlertTriangle,
  generic: AlertTriangle,
};

const KIND_ICON: Record<StatusKind, LucideIcon> = {
  error: AlertTriangle, // overridden by reason when kind === 'error'
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
  empty: Inbox,
};

interface StatusAction {
  label: string;
  onClick?: () => void;
  href?: string;
}

export interface StatusStateProps {
  kind: StatusKind;
  /** Only meaningful when kind === 'error' | 'warning' — picks the specific icon. */
  reason?: StatusReason;
  /** Override the icon entirely (e.g. a domain icon for an empty state). */
  icon?: LucideIcon;
  title?: string;
  message: string;
  primaryAction?: StatusAction;
  secondaryAction?: StatusAction;
  /** Smaller inline variant for embedding inside a card/section vs a full page. */
  compact?: boolean;
  className?: string;
}

function ActionButton({
  action,
  variant,
}: {
  action: StatusAction;
  variant: 'primary' | 'secondary';
}) {
  const cls = cn(
    'inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg text-[13.5px] font-medium transition-colors',
    variant === 'primary'
      ? 'bg-primary text-white hover:bg-primary-dark'
      : 'border border-border text-ink-soft hover:bg-white',
  );
  if (action.href) {
    return (
      <Link href={action.href} className={cls}>
        {action.label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={action.onClick} className={cls}>
      {action.label}
    </button>
  );
}

export function StatusState({
  kind,
  reason = 'generic',
  icon,
  title,
  message,
  primaryAction,
  secondaryAction,
  compact,
  className,
}: StatusStateProps) {
  const style = KIND_STYLE[kind];
  const Icon = icon ?? (kind === 'error' || kind === 'warning' ? REASON_ICON[reason] : KIND_ICON[kind]);

  return (
    <div
      className={cn(
        'flex flex-col items-center text-center',
        compact ? 'py-8 px-4' : 'py-16 px-6',
        className,
      )}
    >
      <div
        className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center mb-4',
          style.circle,
        )}
      >
        <Icon className={cn('w-6 h-6', style.icon)} strokeWidth={2} />
      </div>
      {title && (
        <h3 className="font-display font-bold text-[18px] text-ink mb-1.5 tracking-[-0.01em]">
          {title}
        </h3>
      )}
      <p className="text-[14px] text-muted leading-relaxed max-w-[380px] mb-5">
        {message}
      </p>
      {(primaryAction || secondaryAction) && (
        <div className="flex items-center justify-center gap-3">
          {primaryAction && <ActionButton action={primaryAction} variant="primary" />}
          {secondaryAction && <ActionButton action={secondaryAction} variant="secondary" />}
        </div>
      )}
    </div>
  );
}

/**
 * Turns a caught error into a specific, plain-language sentence instead of a
 * blanket "something went wrong" — mirrors eventera_mobile's describeError().
 * Recognizes fetch/network failures and common HTTP-shaped API error bodies;
 * falls back to the error's own message when it looks safe to show, and only
 * a truly generic default when nothing usable is available.
 */
export function describeError(error: unknown, context = 'this'): string {
  if (!error) return `Something went wrong loading ${context}. Please try again.`;
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();

  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('load failed') ||
    lower.includes('net::err') ||
    lower.includes('offline')
  ) {
    return "We couldn't reach the server. Check your connection and try again.";
  }
  if (lower.includes('timeout') || lower.includes('timed out')) {
    return 'That took too long to respond. Please try again.';
  }
  if (lower.includes('not found') || lower.includes('404')) {
    return "That wasn't found — it may have been deleted or moved.";
  }
  if (lower.includes('unauthorized') || lower.includes('401')) {
    return 'Your session expired. Please sign in again.';
  }
  if (lower.includes('forbidden') || lower.includes('403') || lower.includes('permission')) {
    return "You don't have permission to do that.";
  }
  if (raw.trim() && raw.length < 200 && !lower.includes('[object')) {
    return raw;
  }
  return `Something went wrong loading ${context}. Please try again.`;
}
