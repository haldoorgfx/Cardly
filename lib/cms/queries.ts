/**
 * lib/cms/queries.ts
 *
 * CMS query helpers — used by server components, API routes, and the
 * admin editor. All writes use the service-role client (bypasses RLS).
 * Reads that need to work for public users use the anon/user client.
 *
 * Note: Supabase's `Json` type doesn't overlap with our typed CMS
 * interfaces. All casts use `as unknown as T` to cross that boundary.
 */

import { createClient, createAdminClient } from '@/lib/supabase/server';
import type {
  CmsPage,
  CmsBlock,
  CmsNavigation,
  CmsMedia,
  CmsPageVersion,
  CmsPageWithBlocks,
  BlockType,
  BlockContent,
  PageSeo,
  NavItem,
  PageSnapshot,
} from './types';
import type { Json, Database } from '@/types/database';

// ── Pages ─────────────────────────────────────────────────────────────────────

/** List all pages (admin only — includes drafts). */
export async function listPages(): Promise<CmsPage[]> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('cms_pages')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as CmsPage[];
}

/** Get a single page by slug. Public: only published. Admin: pass `adminMode = true`. */
export async function getPageBySlug(
  slug: string,
  adminMode = false,
): Promise<CmsPageWithBlocks | null> {
  const supabase = adminMode ? await createAdminClient() : await createClient();

  let pageQuery = supabase.from('cms_pages').select('*').eq('slug', slug);
  if (!adminMode) pageQuery = pageQuery.eq('status', 'published');
  const { data: page, error: pageError } = await pageQuery.single();
  if (pageError || !page) return null;

  const { data: blocks, error: blocksError } = await supabase
    .from('cms_blocks')
    .select('*')
    .eq('page_id', page.id)
    .order('position', { ascending: true });
  if (blocksError) throw new Error(blocksError.message);

  return {
    ...(page as unknown as CmsPage),
    blocks: (blocks ?? []) as unknown as CmsBlock[],
  };
}

/** Get a single page by ID (admin only). */
export async function getPageById(id: string): Promise<CmsPageWithBlocks | null> {
  const supabase = await createAdminClient();

  const { data: page, error: pageError } = await supabase
    .from('cms_pages')
    .select('*')
    .eq('id', id)
    .single();
  if (pageError || !page) return null;

  const { data: blocks, error: blocksError } = await supabase
    .from('cms_blocks')
    .select('*')
    .eq('page_id', id)
    .order('position', { ascending: true });
  if (blocksError) throw new Error(blocksError.message);

  return {
    ...(page as unknown as CmsPage),
    blocks: (blocks ?? []) as unknown as CmsBlock[],
  };
}

/** Create a new CMS page. */
export async function createPage(params: {
  slug: string;
  title: string;
  createdBy: string;
  seo?: PageSeo;
}): Promise<CmsPage> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('cms_pages')
    .insert({
      slug: params.slug,
      title: params.title,
      status: 'draft',
      seo: (params.seo ?? {}) as unknown as Json,
      created_by: params.createdBy,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as CmsPage;
}

/** Update a page's title, slug, status, or SEO. */
export async function updatePage(
  id: string,
  patch: Partial<Pick<CmsPage, 'title' | 'slug' | 'status' | 'seo'>>,
): Promise<CmsPage> {
  const supabase = await createAdminClient();
  const { seo, ...rest } = patch;
  const { data, error } = await supabase
    .from('cms_pages')
    .update({
      ...rest,
      ...(seo !== undefined ? { seo: seo as unknown as Json } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as CmsPage;
}

/** Delete a page (cascades to blocks and versions). */
export async function deletePage(id: string): Promise<void> {
  const supabase = await createAdminClient();
  const { error } = await supabase.from('cms_pages').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Blocks ────────────────────────────────────────────────────────────────────

/** Replace all blocks for a page atomically (delete + re-insert). */
export async function setPageBlocks(
  pageId: string,
  blocks: Array<{ type: BlockType; content: BlockContent; position: number }>,
): Promise<CmsBlock[]> {
  const supabase = await createAdminClient();

  const { error: delError } = await supabase
    .from('cms_blocks')
    .delete()
    .eq('page_id', pageId);
  if (delError) throw new Error(delError.message);

  if (blocks.length === 0) return [];

  const rows = blocks.map((b) => ({
    page_id: pageId,
    type: b.type,
    content: b.content as unknown as Json,
    position: b.position,
  }));

  const { data, error } = await supabase
    .from('cms_blocks')
    .insert(rows)
    .select();
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as CmsBlock[];
}

/** Update the content of a single block. */
export async function updateBlock(
  blockId: string,
  params: { content?: BlockContent; position?: number },
): Promise<CmsBlock> {
  const supabase = await createAdminClient();
  const updateData: Database['public']['Tables']['cms_blocks']['Update'] = {};
  if (params.content !== undefined) updateData.content = params.content as unknown as Json;
  if (params.position !== undefined) updateData.position = params.position;
  const { data, error } = await supabase
    .from('cms_blocks')
    .update(updateData)
    .eq('id', blockId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as CmsBlock;
}

/** Add a single block to a page. */
export async function addBlock(
  pageId: string,
  type: BlockType,
  content: BlockContent,
  position: number,
): Promise<CmsBlock> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('cms_blocks')
    .insert({ page_id: pageId, type, content: content as unknown as Json, position })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as CmsBlock;
}

/** Delete a single block. */
export async function deleteBlock(blockId: string): Promise<void> {
  const supabase = await createAdminClient();
  const { error } = await supabase.from('cms_blocks').delete().eq('id', blockId);
  if (error) throw new Error(error.message);
}

// ── Navigation ────────────────────────────────────────────────────────────────

/** Get navigation by location. */
export async function getNavigation(
  location: 'header' | 'footer',
): Promise<CmsNavigation | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('cms_navigation')
    .select('*')
    .eq('location', location)
    .single();
  if (error) return null;
  return data as unknown as CmsNavigation;
}

/** Get both header + footer navigation in one call. */
export async function getAllNavigation(): Promise<{
  header: CmsNavigation | null;
  footer: CmsNavigation | null;
}> {
  const supabase = await createClient();
  const { data } = await supabase.from('cms_navigation').select('*');
  const rows = (data ?? []) as unknown as CmsNavigation[];
  return {
    header: rows.find((r) => r.location === 'header') ?? null,
    footer: rows.find((r) => r.location === 'footer') ?? null,
  };
}

/** Upsert navigation items for a location. */
export async function setNavigation(
  location: 'header' | 'footer',
  items: NavItem[],
): Promise<CmsNavigation> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('cms_navigation')
    .upsert(
      {
        location,
        items: items as unknown as Json,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'location' },
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as CmsNavigation;
}

// ── Media ─────────────────────────────────────────────────────────────────────

/** List all media items, newest first. */
export async function listMedia(opts?: {
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<{ items: CmsMedia[]; total: number }> {
  const supabase = await createAdminClient();
  const limit = opts?.limit ?? 48;
  const offset = opts?.offset ?? 0;

  let query = supabase
    .from('cms_media')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (opts?.search) {
    query = query.or(
      `filename.ilike.%${opts.search}%,alt.ilike.%${opts.search}%`,
    );
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { items: (data ?? []) as unknown as CmsMedia[], total: count ?? 0 };
}

/** Insert a media record after uploading to Storage. */
export async function insertMedia(params: {
  url: string;
  filename?: string;
  alt?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  mime?: string;
  uploadedBy: string;
}): Promise<CmsMedia> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('cms_media')
    .insert({
      url: params.url,
      filename: params.filename ?? null,
      alt: params.alt ?? null,
      width: params.width ?? null,
      height: params.height ?? null,
      size_bytes: params.sizeBytes ?? null,
      mime: params.mime ?? null,
      uploaded_by: params.uploadedBy,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as CmsMedia;
}

/** Update alt text for a media item. */
export async function updateMediaAlt(id: string, alt: string): Promise<CmsMedia> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('cms_media')
    .update({ alt })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as CmsMedia;
}

/** Delete a media record (does NOT remove from Storage — caller must do that). */
export async function deleteMedia(id: string): Promise<void> {
  const supabase = await createAdminClient();
  const { error } = await supabase.from('cms_media').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Versions ──────────────────────────────────────────────────────────────────

/** List version history for a page (newest first, no snapshot in list). */
export async function listPageVersions(pageId: string): Promise<
  Array<Omit<CmsPageVersion, 'snapshot'>>
> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('cms_page_versions')
    .select('id, page_id, version_num, created_by, created_at')
    .eq('page_id', pageId)
    .order('version_num', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Array<Omit<CmsPageVersion, 'snapshot'>>;
}

/** Get a specific version with its full snapshot. */
export async function getPageVersion(versionId: string): Promise<CmsPageVersion | null> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('cms_page_versions')
    .select('*')
    .eq('id', versionId)
    .single();
  if (error) return null;
  return data as unknown as CmsPageVersion;
}

/** Snapshot a page into a new version and bump `published_version`. */
export async function publishPage(
  pageId: string,
  snapshot: PageSnapshot,
  createdBy: string,
): Promise<CmsPageVersion> {
  const supabase = await createAdminClient();

  // Next version number
  const { data: existing } = await supabase
    .from('cms_page_versions')
    .select('version_num')
    .eq('page_id', pageId)
    .order('version_num', { ascending: false })
    .limit(1)
    .single();

  const nextNum = (existing?.version_num ?? 0) + 1;

  const { data: version, error: vErr } = await supabase
    .from('cms_page_versions')
    .insert({
      page_id: pageId,
      version_num: nextNum,
      snapshot: snapshot as unknown as Json,
      created_by: createdBy,
    })
    .select()
    .single();
  if (vErr) throw new Error(vErr.message);

  // Mark page as published + record published_version
  await supabase
    .from('cms_pages')
    .update({
      status: 'published',
      published_version: nextNum,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pageId);

  return version as unknown as CmsPageVersion;
}
