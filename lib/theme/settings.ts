/**
 * Theme/brand settings reader.
 *
 * Reads site_settings row (id = 1) from Supabase.
 * Uses the anon client so public pages can access it without auth.
 * Falls back to Eventera's locked defaults if the DB is unreachable.
 */

import { createClient } from '@/lib/supabase/server';

export interface ThemeColors {
  primary:     string;
  primaryDark: string;
  primarySoft: string;
  primaryMid:  string;
  accent:      string;
  accentDark:  string;
  ink:         string;
  inkSoft:     string;
  muted:       string;
  cream:       string;
}

export interface ThemeFonts {
  display: string;
  body:    string;
  mono:    string;
}

export interface ThemeGradients {
  hero: string;
}

export interface SiteSettings {
  id:             number;
  brand_name:     string;
  logo_url:       string | null;  // colored logo — for light backgrounds (marketing nav)
  logo_light_url: string | null;  // white/light logo — for dark backgrounds (sidebar)
  favicon_url:    string | null;
  colors:         ThemeColors;
  fonts:          ThemeFonts;
  gradients:      ThemeGradients;
  updated_at:     string;
  updated_by:     string | null;
}

/** Eventera's locked default values — used as fallback and as CSS var fallbacks */
export const DEFAULT_SETTINGS: SiteSettings = {
  id:             1,
  brand_name:     'Eventera',
  logo_url:       null,
  logo_light_url: null,
  favicon_url:    null,
  colors: {
    primary:     '#1F4D3A',
    primaryDark: '#163828',
    primarySoft: '#E8EFEB',
    primaryMid:  '#2A6A50',
    accent:      '#E8C57E',
    accentDark:  '#C9A45E',
    ink:         '#0F1F18',
    inkSoft:     '#3A4A42',
    muted:       '#6B7A72',
    cream:       '#FAF6EE',
  },
  fonts: {
    display: 'DM Sans',
    body:    'Inter',
    mono:    'Inter',
  },
  gradients: {
    hero: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)',
  },
  updated_at: new Date().toISOString(),
  updated_by: null,
};

/**
 * Fetch site settings from Supabase.
 * Server-side only. Returns DEFAULT_SETTINGS on any error.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error || !data) return DEFAULT_SETTINGS;

    return {
      id:             data.id,
      brand_name:     data.brand_name,
      logo_url:       data.logo_url,
      logo_light_url: data.logo_light_url ?? null,
      favicon_url:    data.favicon_url,
      colors:      { ...DEFAULT_SETTINGS.colors,    ...(data.colors    as Partial<ThemeColors>)    },
      fonts:       { ...DEFAULT_SETTINGS.fonts,     ...(data.fonts     as Partial<ThemeFonts>)     },
      gradients:   { ...DEFAULT_SETTINGS.gradients, ...(data.gradients as Partial<ThemeGradients>) },
      updated_at:  data.updated_at,
      updated_by:  data.updated_by,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Build the CSS custom-property string to inject in ThemeProvider.
 * Only outputs overrides that differ from defaults (keeps the inline style minimal).
 */
export function buildThemeCssVars(settings: SiteSettings): Record<string, string> {
  const vars: Record<string, string> = {};
  const c = settings.colors;
  const f = settings.fonts;
  const g = settings.gradients;

  vars['--theme-primary']      = c.primary;
  vars['--theme-primary-dark'] = c.primaryDark;
  vars['--theme-primary-soft'] = c.primarySoft;
  vars['--theme-primary-mid']  = c.primaryMid;
  vars['--theme-accent']       = c.accent;
  vars['--theme-accent-dark']  = c.accentDark;
  vars['--theme-ink']          = c.ink;
  vars['--theme-ink-soft']     = c.inkSoft;
  vars['--theme-muted']        = c.muted;
  vars['--theme-cream']        = c.cream;
  vars['--theme-font-display'] = f.display;
  vars['--theme-font-body']    = f.body;
  vars['--theme-font-mono']    = f.mono;
  vars['--theme-grad-hero']    = g.hero;

  return vars;
}
