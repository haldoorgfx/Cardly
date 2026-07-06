// EX02 · My Booth & products — Booth-info / Products segmented; product showcase.
// Reads/writes `exhibitor_products` (060_exhibitor_products_meetings.sql).
// DRAFT — verify via `flutter analyze`.

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../ui/tokens.dart';
import '../../ui/components.dart';
import '../role_widgets.dart';

class BoothProductsScreen extends StatefulWidget {
  final String sponsorId;
  final String eventId;
  final String eventName;
  final String boothName;
  final String? boothDescription;
  const BoothProductsScreen({
    super.key,
    required this.sponsorId,
    required this.eventId,
    required this.eventName,
    required this.boothName,
    this.boothDescription,
  });

  @override
  State<BoothProductsScreen> createState() => _BoothProductsScreenState();
}

class _Product {
  final String id, name, description, imageUrl;
  final bool featured;
  _Product(this.id, this.name, this.description, this.imageUrl, this.featured);
}

class _BoothProductsScreenState extends State<BoothProductsScreen> {
  int _tab = 0; // 0 = booth info, 1 = products
  late Future<List<_Product>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<_Product>> _load() async {
    final rows = await Supabase.instance.client
        .from('exhibitor_products')
        .select('id, name, description, image_url, is_featured')
        .eq('sponsor_id', widget.sponsorId)
        .order('position');
    return (rows as List).map((r) {
      final m = Map<String, dynamic>.from(r as Map);
      return _Product(
        (m['id'] ?? '').toString(),
        (m['name'] ?? '').toString(),
        (m['description'] ?? '').toString(),
        (m['image_url'] ?? '').toString(),
        m['is_featured'] == true,
      );
    }).toList();
  }

  Future<void> _addProduct() async {
    final name = TextEditingController();
    final desc = TextEditingController();
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
            left: 20, right: 20, top: 20, bottom: 20 + MediaQuery.of(ctx).viewInsets.bottom),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Text('Add product',
              style: TextStyle(color: AppColors.ink, fontSize: 17, fontWeight: FontWeight.w700)),
          const SizedBox(height: 14),
          TextField(controller: name, decoration: const InputDecoration(hintText: 'Product name')),
          const SizedBox(height: 10),
          TextField(controller: desc, maxLines: 2, decoration: const InputDecoration(hintText: 'Short description')),
          const SizedBox(height: 16),
          MButton('Add', onTap: () => Navigator.pop(ctx, true)),
        ]),
      ),
    );
    if (ok == true && name.text.trim().isNotEmpty) {
      await Supabase.instance.client.from('exhibitor_products').insert({
        'sponsor_id': widget.sponsorId,
        'event_id': widget.eventId,
        'name': name.text.trim(),
        'description': desc.text.trim(),
      });
      setState(() => _future = _load());
    }
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: MAppBar(title: 'My booth'),
      body: Column(
        children: [
          RoleBar(icon: Icons.storefront_outlined, eventName: widget.eventName, roleLine: 'Exhibitor'),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(children: [_seg('Booth info', 0), const SizedBox(width: 8), _seg('Products', 1)]),
          ),
          Expanded(
            child: _tab == 0 ? _boothInfo() : _products(),
          ),
        ],
      ),
      bottomBar: _tab == 1
          ? Padding(
              padding: const EdgeInsets.all(16),
              child: MButton('Add product', icon: Icons.add, onTap: _addProduct),
            )
          : null,
    );
  }

  Widget _boothInfo() => ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(widget.boothName,
              style: const TextStyle(color: AppColors.ink, fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Text(widget.boothDescription ?? 'No description yet.',
              style: const TextStyle(color: AppColors.inkSoft, fontSize: 14, height: 1.5)),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: AppColors.forestSoft, borderRadius: BorderRadius.circular(12)),
            child: const Text('Logo, cover and rich booth pages are managed on the Eventera web dashboard.',
                style: TextStyle(color: AppColors.forest, fontSize: 12.5, height: 1.4)),
          ),
        ],
      );

  Widget _products() => FutureBuilder<List<_Product>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: AppColors.forest));
          }
          final products = snap.data ?? [];
          if (products.isEmpty) {
            return const EmptyState(
              icon: Icons.inventory_2_outlined,
              title: 'No products yet',
              message: 'Add the products you\'re showcasing at your booth.',
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: products.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (_, i) {
              final p = products[i];
              return Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(children: [
                  Container(
                    width: 48, height: 48,
                    decoration: BoxDecoration(
                      color: AppColors.creamSoft,
                      borderRadius: BorderRadius.circular(10),
                      image: p.imageUrl.isNotEmpty
                          ? DecorationImage(image: NetworkImage(p.imageUrl), fit: BoxFit.cover)
                          : null,
                    ),
                    child: p.imageUrl.isEmpty
                        ? const Icon(Icons.image_outlined, color: AppColors.inkMuted, size: 20)
                        : null,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Flexible(
                          child: Text(p.name,
                              style: const TextStyle(
                                  color: AppColors.ink, fontSize: 14.5, fontWeight: FontWeight.w600)),
                        ),
                        if (p.featured)
                          Container(
                            margin: const EdgeInsets.only(left: 6),
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                                color: AppColors.gold, borderRadius: BorderRadius.circular(6)),
                            child: const Text('Featured',
                                style: TextStyle(
                                    color: AppColors.forestDark, fontSize: 10, fontWeight: FontWeight.w700)),
                          ),
                      ]),
                      if (p.description.isNotEmpty)
                        Text(p.description,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(color: AppColors.inkMuted, fontSize: 12.5)),
                    ]),
                  ),
                ]),
              );
            },
          );
        },
      );

  Widget _seg(String label, int i) {
    final sel = _tab == i;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _tab = i),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: sel ? AppColors.forest : AppColors.creamSoft,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Center(
            child: Text(label,
                style: TextStyle(
                    color: sel ? Colors.white : AppColors.inkMuted,
                    fontWeight: FontWeight.w600, fontSize: 13.5)),
          ),
        ),
      ),
    );
  }
}
