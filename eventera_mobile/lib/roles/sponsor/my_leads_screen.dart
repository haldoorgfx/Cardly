// SPO04 · My Leads — searchable/filterable lead list (hot/warm/cold).
// Reads `sponsor_leads` directly; the RLS policy from 059_sponsor_lead_capture.sql
// grants sponsors + booth team read access to their own booth's leads.
//
// DRAFT — not build-tested.

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../ui/tokens.dart';
import '../../ui/components.dart';
import 'lead_detail_screen.dart';

class MyLeadsScreen extends StatefulWidget {
  final String sponsorId;
  final String boothName;
  const MyLeadsScreen({super.key, required this.sponsorId, required this.boothName});

  @override
  State<MyLeadsScreen> createState() => _MyLeadsScreenState();
}

class _Lead {
  final String id, name, email, rating, note;
  final DateTime? at;
  _Lead(this.id, this.name, this.email, this.rating, this.note, this.at);
}

class _MyLeadsScreenState extends State<MyLeadsScreen> {
  late Future<List<_Lead>> _future;
  String _filter = 'all'; // all|hot|warm|cold
  String _q = '';

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
          callback: (_) { if (mounted) setState(() => _future = _load()); },
        )
        .subscribe();
  }

  @override
  void dispose() {
    final c = _channel;
    if (c != null) Supabase.instance.client.removeChannel(c);
    super.dispose();
  }

  Future<List<_Lead>> _load() async {
    final rows = await Supabase.instance.client
        .from('sponsor_leads')
        .select('id, attendee_name, attendee_email, rating, note, created_at')
        .eq('sponsor_id', widget.sponsorId)
        .order('created_at', ascending: false);
    return (rows as List).map((r) {
      final m = Map<String, dynamic>.from(r as Map);
      return _Lead(
        (m['id'] ?? '').toString(),
        (m['attendee_name'] ?? 'Lead').toString(),
        (m['attendee_email'] ?? '').toString(),
        (m['rating'] ?? '').toString(),
        (m['note'] ?? '').toString(),
        m['created_at'] != null ? DateTime.tryParse(m['created_at'].toString()) : null,
      );
    }).toList();
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
            return const Center(child: CircularProgressIndicator(color: AppColors.forest));
          }
          final all = snap.data ?? [];
          var leads = all;
          if (_filter != 'all') leads = leads.where((l) => l.rating == _filter).toList();
          if (_q.isNotEmpty) {
            final q = _q.toLowerCase();
            leads = leads.where((l) =>
                l.name.toLowerCase().contains(q) || l.email.toLowerCase().contains(q)).toList();
          }

          if (all.isEmpty) {
            return const EmptyState(
              icon: Icons.qr_code_scanner,
              title: 'No leads yet',
              message: 'Open the lead scanner at your booth to capture your first lead.',
            );
          }

          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                child: TextField(
                  onChanged: (v) => setState(() => _q = v),
                  decoration: InputDecoration(
                    hintText: 'Search leads',
                    prefixIcon: const Icon(Icons.search, size: 20),
                    filled: true,
                    fillColor: AppColors.creamSoft,
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
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
                        child: ChoiceChip(
                          label: Text(f == 'all' ? 'All' : f[0].toUpperCase() + f.substring(1)),
                          selected: _filter == f,
                          onSelected: (_) => setState(() => _filter = f),
                          selectedColor: AppColors.forestSoft,
                        ),
                      ),
                  ],
                ),
              ),
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: leads.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (_, i) {
                    final l = leads[i];
                    return InkWell(
                      borderRadius: BorderRadius.circular(14),
                      onTap: () => Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => LeadDetailScreen(
                              name: l.name, email: l.email, rating: l.rating,
                              note: l.note, boothName: widget.boothName, capturedAt: l.at))),
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
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(l.name,
                                    style: const TextStyle(
                                        color: AppColors.ink, fontSize: 14.5, fontWeight: FontWeight.w600)),
                                if (l.email.isNotEmpty)
                                  Text(l.email,
                                      style: const TextStyle(color: AppColors.inkMuted, fontSize: 12.5)),
                                if (l.note.isNotEmpty)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 4),
                                    child: Text(l.note,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(color: AppColors.inkSoft, fontSize: 12.5)),
                                  ),
                              ],
                            ),
                          ),
                          if (l.rating.isNotEmpty)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                              decoration: BoxDecoration(
                                color: _ratingColor(l.rating).withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Text(l.rating,
                                  style: TextStyle(
                                      color: _ratingColor(l.rating),
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700)),
                            ),
                        ],
                      ),
                    ));
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
