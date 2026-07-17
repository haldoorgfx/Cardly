// EX02 · My Booth & products — Booth-info / Products segmented; product showcase
// with full add / edit / delete. Reads/writes `exhibitor_products`
// (060_exhibitor_products_meetings.sql) via SponsorApi.

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../ui/tokens.dart';
import '../../ui/components.dart';
import '../role_widgets.dart';
import '../sponsor/sponsor_api.dart';

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
  final int position;
  _Product(this.id, this.name, this.description, this.imageUrl, this.featured,
      this.position);
}

class _BoothProductsScreenState extends State<BoothProductsScreen> {
  int _tab = 0; // 0 = booth info, 1 = products
  late Future<List<_Product>> _future;
  int _count = 0;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<_Product>> _load() async {
    final rows = await SponsorApi.fetchProducts(widget.sponsorId);
    final list = rows.map((m) {
      return _Product(
        (m['id'] ?? '').toString(),
        (m['name'] ?? '').toString(),
        (m['description'] ?? '').toString(),
        (m['image_url'] ?? '').toString(),
        m['is_featured'] == true,
        (m['position'] is num) ? (m['position'] as num).toInt() : 0,
      );
    }).toList();
    _count = list.length;
    return list;
  }

  void _reload() => setState(() => _future = _load());

  /// Add / edit sheet. When [existing] is null it inserts; otherwise updates.
  Future<void> _editProduct({_Product? existing}) async {
    final name = TextEditingController(text: existing?.name ?? '');
    final desc = TextEditingController(text: existing?.description ?? '');
    var featured = existing?.featured ?? false;
    String? error;

    final action = await showMSheet<String>(
      context,
      StatefulBuilder(builder: (ctx, setSheet) {
        return Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(existing == null ? 'Add product' : 'Edit product',
                style: const TextStyle(
                    color: AppColors.ink, fontSize: 17, fontWeight: FontWeight.w700)),
            const SizedBox(height: 16),
            MInput(
                label: 'Name',
                hint: 'Product name',
                controller: name,
                icon: Icons.inventory_2_outlined),
            const SizedBox(height: 12),
            MInput(
                label: 'Description',
                hint: 'Short description',
                controller: desc,
                minLines: 2,
                maxLines: 4),
            const SizedBox(height: 14),
            Row(children: [
              const Expanded(
                child: Text('Feature at the top of your booth',
                    style: TextStyle(color: AppColors.inkSoft, fontSize: 13.5)),
              ),
              MToggle(
                  value: featured,
                  onChanged: (v) => setSheet(() => featured = v)),
            ]),
            if (error != null) ...[
              const SizedBox(height: 8),
              Text(error!,
                  style: const TextStyle(color: AppColors.danger, fontSize: 12.5)),
            ],
            const SizedBox(height: 18),
            MButton(existing == null ? 'Add product' : 'Save changes',
                icon: existing == null ? Icons.add : Icons.check, onTap: () {
              if (name.text.trim().isEmpty) {
                setSheet(() => error = 'Give your product a name.');
                return;
              }
              Navigator.pop(ctx, 'save');
            }),
            if (existing != null) ...[
              const SizedBox(height: 8),
              MButton('Delete product',
                  kind: MBtnKind.text, onTap: () => Navigator.pop(ctx, 'delete')),
            ],
          ],
        );
      }),
    );

    if (action == 'save') {
      try {
        if (existing == null) {
          await SponsorApi.addProduct(
            sponsorId: widget.sponsorId,
            eventId: widget.eventId,
            name: name.text,
            description: desc.text,
            featured: featured,
            position: _count,
          );
        } else {
          await SponsorApi.updateProduct(
            id: existing.id,
            name: name.text,
            description: desc.text,
            featured: featured,
          );
        }
        if (!mounted) return;
        HapticFeedback.selectionClick();
        _reload();
        showToast(context, existing == null ? 'Product added.' : 'Product updated.');
      } catch (e) {
        if (mounted) {
          showToast(context, describeError(e, context: 'that product'));
        }
      }
    } else if (action == 'delete' && existing != null) {
      await _delete(existing);
    }
  }

  Future<void> _delete(_Product p) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Delete product?'),
        content: Text('Remove "${p.name}" from your booth? This cannot be undone.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel',
                  style: TextStyle(color: AppColors.inkSoft))),
          TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Delete',
                  style: TextStyle(
                      color: AppColors.danger, fontWeight: FontWeight.w700))),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await SponsorApi.deleteProduct(p.id);
      if (!mounted) return;
      _reload();
      showToast(context, 'Product deleted.');
    } catch (e) {
      if (mounted) {
        showToast(context, describeError(e, context: 'that product'));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: MAppBar(title: 'My booth'),
      body: Column(
        children: [
          RoleBar(
              icon: Icons.storefront_outlined,
              eventName: widget.eventName,
              roleLine: 'Exhibitor'),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(children: [
              _seg('Booth info', 0),
              const SizedBox(width: 8),
              _seg('Products', 1)
            ]),
          ),
          Expanded(child: _tab == 0 ? _boothInfo() : _products()),
        ],
      ),
      bottomBar: _tab == 1
          ? Padding(
              padding: const EdgeInsets.all(16),
              child: MButton('Add product',
                  icon: Icons.add, onTap: () => _editProduct()),
            )
          : null,
    );
  }

  Widget _boothInfo() => ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(widget.boothName,
              style: const TextStyle(
                  color: AppColors.ink, fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Text(
              (widget.boothDescription != null &&
                      widget.boothDescription!.trim().isNotEmpty)
                  ? widget.boothDescription!
                  : 'No description yet.',
              style: const TextStyle(
                  color: AppColors.inkSoft, fontSize: 14, height: 1.5)),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
                color: AppColors.forestSoft,
                borderRadius: BorderRadius.circular(12)),
            child: const Text(
                'Logo, cover and rich booth pages are managed on the Eventera web dashboard.',
                style: TextStyle(
                    color: AppColors.forest, fontSize: 12.5, height: 1.4)),
          ),
        ],
      );

  Widget _products() => FutureBuilder<List<_Product>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const LoadingState();
          }
          if (snap.hasError) {
            final msg = describeError(snap.error, context: 'your products');
            return ErrorStateView(
              message: msg,
              onRetry: _reload,
              reason: msg.toLowerCase().contains("couldn't reach the server")
                  ? StatusReason.network
                  : msg.toLowerCase().contains('permission')
                      ? StatusReason.permission
                      : StatusReason.generic,
            );
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
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemBuilder: (_, i) {
              final p = products[i];
              return InkWell(
                borderRadius: BorderRadius.circular(14),
                onTap: () => _editProduct(existing: p),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: AppColors.creamSoft,
                        borderRadius: BorderRadius.circular(10),
                        image: p.imageUrl.isNotEmpty &&
                                p.imageUrl.startsWith('http')
                            ? DecorationImage(
                                image: NetworkImage(p.imageUrl),
                                fit: BoxFit.cover)
                            : null,
                      ),
                      child: (p.imageUrl.isEmpty || !p.imageUrl.startsWith('http'))
                          ? const Icon(Icons.image_outlined,
                              color: AppColors.inkMuted, size: 20)
                          : null,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(children: [
                              Flexible(
                                child: Text(p.name,
                                    style: const TextStyle(
                                        color: AppColors.ink,
                                        fontSize: 14.5,
                                        fontWeight: FontWeight.w600)),
                              ),
                              if (p.featured)
                                Container(
                                  margin: const EdgeInsets.only(left: 6),
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                      color: AppColors.gold,
                                      borderRadius: BorderRadius.circular(6)),
                                  child: const Text('Featured',
                                      style: TextStyle(
                                          color: AppColors.forestDark,
                                          fontSize: 10,
                                          fontWeight: FontWeight.w700)),
                                ),
                            ]),
                            if (p.description.isNotEmpty)
                              Text(p.description,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                      color: AppColors.inkSoft, fontSize: 12.5)),
                          ]),
                    ),
                    const Icon(Icons.chevron_right,
                        size: 18, color: AppColors.inkMuted),
                  ]),
                ),
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
                    color: sel ? Colors.white : AppColors.inkSoft,
                    fontWeight: FontWeight.w600,
                    fontSize: 13.5)),
          ),
        ),
      ),
    );
  }
}
