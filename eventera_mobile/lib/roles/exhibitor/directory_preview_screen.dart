// EX04 · Directory preview — how the booth appears to attendees in the expo hall.
// Read-only preview: cover/logo, category, description, Request-meeting CTA, products.
// Reuses booth data (sponsors) + `exhibitor_products`. DRAFT — verify via `flutter analyze`.

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../ui/tokens.dart';
import '../../ui/components.dart';

class DirectoryPreviewScreen extends StatelessWidget {
  final String sponsorId;
  final String boothName;
  final String? description;
  final String? category;
  const DirectoryPreviewScreen({
    super.key,
    required this.sponsorId,
    required this.boothName,
    this.description,
    this.category,
  });

  Future<List<Map<String, dynamic>>> _products() async {
    final rows = await Supabase.instance.client
        .from('exhibitor_products')
        .select('name, description, image_url')
        .eq('sponsor_id', sponsorId)
        .order('position');
    return (rows as List).map((r) => Map<String, dynamic>.from(r as Map)).toList();
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: MAppBar(title: 'Directory preview'),
      body: ListView(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            color: AppColors.goldSoft,
            child: const Text('Preview · this is how attendees see your booth',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.goldHover, fontSize: 12, fontWeight: FontWeight.w600)),
          ),
          Container(
            height: 120,
            decoration: const BoxDecoration(
              gradient: LinearGradient(colors: [AppColors.forest, AppColors.forestDark]),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(boothName,
                    style: const TextStyle(
                        color: AppColors.ink, fontSize: 20, fontWeight: FontWeight.w700)),
                if (category != null) ...[
                  const SizedBox(height: 8),
                  Wrap(spacing: 6, children: [
                    for (final c in category!.split(','))
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                            color: AppColors.forestSoft, borderRadius: BorderRadius.circular(999)),
                        child: Text(c.trim(),
                            style: const TextStyle(color: AppColors.forest, fontSize: 12)),
                      ),
                  ]),
                ],
                const SizedBox(height: 12),
                Text(description ?? 'No description yet.',
                    style: const TextStyle(color: AppColors.inkSoft, fontSize: 14, height: 1.5)),
                const SizedBox(height: 16),
                // This screen previews your public booth listing — the button
                // is what ATTENDEES tap. Make that explicit rather than dead.
                MButton('Request meeting',
                    icon: Icons.event_outlined,
                    onTap: () => showToast(context,
                        'Preview only — this is the button attendees tap to request a meeting with your booth.')),
                const SizedBox(height: 20),
                const Text('Products',
                    style: TextStyle(color: AppColors.ink, fontSize: 15, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                FutureBuilder<List<Map<String, dynamic>>>(
                  future: _products(),
                  builder: (context, snap) {
                    final products = snap.data ?? [];
                    if (products.isEmpty) {
                      return const Text('No products listed.',
                          style: TextStyle(color: AppColors.inkMuted, fontSize: 13));
                    }
                    return Column(
                      children: [
                        for (final p in products)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Row(children: [
                              Container(
                                width: 44, height: 44,
                                decoration: BoxDecoration(
                                    color: AppColors.creamSoft,
                                    borderRadius: BorderRadius.circular(10)),
                                child: const Icon(Icons.image_outlined,
                                    color: AppColors.inkMuted, size: 18),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text((p['name'] ?? '').toString(),
                                    style: const TextStyle(
                                        color: AppColors.ink,
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600)),
                              ),
                            ]),
                          ),
                      ],
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
