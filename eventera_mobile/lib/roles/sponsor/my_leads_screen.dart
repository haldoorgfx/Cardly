// SPO04 · My Leads — searchable/filterable lead list (hot/warm/cold).
// Reads `sponsor_leads` via SponsorApi; the RLS policy from
// 059_sponsor_lead_capture.sql grants sponsors + booth team read access to their
// own booth's leads. Live-updates via a realtime channel on the same table.

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../ui/tokens.dart';
import '../../ui/components.dart';
import 'sponsor_api.dart';
import 'lead_detail_screen.dart';
import 'lead_scanner_screen.dart';

class MyLeadsScreen extends StatefulWidget {
  final String sponsorId;
  final String boothName;
  const MyLeadsScreen({super.key, required this.sponsorId, required this.boothName});

  @override
  State<MyLeadsScreen> createState() => _MyLeadsScreenState();
}

class _Lead {
  final String id, name, email, company, role, rating, note;
  final DateTime? at;
  _Lead(this.id, this.name, this.email, this.company, this.role, this.rating,
      this.note, this.at);
}

class _MyLeadsScreenState extends State<MyLeadsScreen> {
  late Future<List<_Lead>> _future;
  String _filter = 'all'; // all|hot|warm|cold
  String _q = '';
  // Owned by this screen so "Clear filters" can actually empty the box —
  // resetting _q alone would leave the typed text sitting in the field.
  final TextEditingController _searchCtrl = TextEditingController();

  RealtimeChannel? _channel;

  @override
  void initState() {
    super.initState();
    _future = _load();
    _channel = Supabase.instance.client
        .channel('leads:${widget.sponsorId}')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'sponsor_leads',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'sponsor_id',
            value: widget.sponsorId,
          ),
          callback: (_) {
            if (mounted) setState(() => _future = _load());
          },
        )
        .subscribe();
  }

  @override
  void dispose() {
    final c = _channel;
    if (c != null) Supabase.instance.client.removeChannel(c);
    _searchCtrl.dispose();
    super.dispose();
  }

  /// The only way a lead ever gets into this list — so the empty state opens
  /// it directly instead of just naming it.
  Future<void> _openScanner() async {
    await Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => LeadScannerScreen(
          sponsorId: widget.sponsorId, boothName: widget.boothName),
    ));
    if (mounted) _refresh();
  }

  Future<List<_Lead>> _load() async {
    final rows = await SponsorApi.fetchLeads(widget.sponsorId);
    return rows.map((m) {
      return _Lead(
        (m['id'] ?? '').toString(),
        (m['attendee_name'] ?? 'Lead').toString(),
        (m['attendee_email'] ?? '').toString(),
        (m['company'] ?? '').toString(),
        (m['role'] ?? '').toString(),
        (m['rating'] ?? '').toString(),
        (m['note'] ?? '').toString(),
        m['created_at'] != null
            ? DateTime.tryParse(m['created_at'].toString())
            : null,
      );
    }).toList();
  }

  Future<void> _refresh() async {
    final f = _load();
    setState(() => _future = f);
    await f;
  }

  Color _ratingColor(String r) => r == 'hot'
      ? AppColors.danger
      : r == 'warm'
          ? AppColors.warning
          : AppColors.forest;

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: MAppBar(title: 'My leads'),
      body: FutureBuilder<List<_Lead>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const LoadingState();
          }
          if (snap.hasError) {
            return ErrorStateView(
              message: "We couldn't load your leads. Check your connection and try again.",
              onRetry: () => setState(() => _future = _load()),
            );
          }
          final all = snap.data ?? [];
          var leads = all;
          if (_filter != 'all') {
            leads = leads.where((l) => l.rating == _filter).toList();
          }
          if (_q.isNotEmpty) {
            final q = _q.toLowerCase();
            leads = leads
                .where((l) =>
                    l.name.toLowerCase().contains(q) ||
                    l.email.toLowerCase().contains(q) ||
                    l.company.toLowerCase().contains(q))
                .toList();
          }

          if (all.isEmpty) {
            return EmptyState(
              icon: Icons.qr_code_scanner,
              title: 'No leads yet',
              message: 'Leads are captured by scanning an attendee QR at your '
                  'booth. Scan your first one to fill this list.',
              ctaLabel: 'Open lead scanner',
              onCta: _openScanner,
            );
          }

          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                child: TextField(
                  controller: _searchCtrl,
                  onChanged: (v) => setState(() => _q = v),
                  decoration: InputDecoration(
                    hintText: 'Search name, email or company',
                    hintStyle: const TextStyle(color: AppColors.inkMuted),
                    prefixIcon: const Icon(Icons.search, size: 20, color: AppColors.inkMuted),
                    filled: true,
                    fillColor: AppColors.creamSoft,
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none),
                  ),
                ),
              ),
              SizedBox(
                height: 40,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: [
                    for (final f in const ['all', 'hot', 'warm', 'cold'])
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: MChip(
                          f == 'all' ? 'All' : f[0].toUpperCase() + f.substring(1),
                          selected: _filter == f,
                          onTap: () => setState(() => _filter = f),
                        ),
                      ),
                  ],
                ),
              ),
              Expanded(
                child: leads.isEmpty
                    ? EmptyState(
                        icon: Icons.filter_alt_off_outlined,
                        title: 'No leads match',
                        message: 'You have ${all.length} '
                            '${all.length == 1 ? 'lead' : 'leads'}, but none '
                            'match the current search or rating filter.',
                        ctaLabel: 'Clear filters',
                        onCta: () => setState(() {
                          _q = '';
                          _filter = 'all';
                          _searchCtrl.clear();
                        }),
                      )
                    : RefreshIndicator(
                        color: AppColors.forest,
                        onRefresh: _refresh,
                        child: ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: leads.length,
                          separatorBuilder: (_, _) => const SizedBox(height: 8),
                          itemBuilder: (_, i) {
                            final l = leads[i];
                            return InkWell(
                              borderRadius: BorderRadius.circular(14),
                              onTap: () => Navigator.of(context).push(
                                  MaterialPageRoute(
                                      builder: (_) => LeadDetailScreen(
                                          leadId: l.id,
                                          boothName: widget.boothName))),
                              child: Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: AppColors.surface,
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(color: AppColors.border),
                                ),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(l.name,
                                              style: const TextStyle(
                                                  color: AppColors.ink,
                                                  fontSize: 14.5,
                                                  fontWeight: FontWeight.w600)),
                                          if (l.company.isNotEmpty ||
                                              l.email.isNotEmpty)
                                            Text(
                                                l.company.isNotEmpty
                                                    ? (l.role.isNotEmpty
                                                        ? '${l.role} · ${l.company}'
                                                        : l.company)
                                                    : l.email,
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                                style: const TextStyle(
                                                    color: AppColors.inkSoft,
                                                    fontSize: 12.5)),
                                          if (l.note.isNotEmpty)
                                            Padding(
                                              padding:
                                                  const EdgeInsets.only(top: 4),
                                              child: Text(l.note,
                                                  maxLines: 1,
                                                  overflow:
                                                      TextOverflow.ellipsis,
                                                  style: const TextStyle(
                                                      color: AppColors.inkSoft,
                                                      fontSize: 12.5)),
                                            ),
                                        ],
                                      ),
                                    ),
                                    if (l.rating.isNotEmpty)
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 9, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: _ratingColor(l.rating)
                                              .withValues(alpha: 0.12),
                                          borderRadius:
                                              BorderRadius.circular(999),
                                        ),
                                        child: Text(l.rating,
                                            style: TextStyle(
                                                color: _ratingColor(l.rating),
                                                fontSize: 11,
                                                fontWeight: FontWeight.w700)),
                                      ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
              ),
            ],
          );
        },
      ),
    );
  }
}
