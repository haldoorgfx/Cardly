import 'dart:io';

import 'package:flutter/material.dart';

import '../attendee/app_shell.dart' show mainTab;
import '../card_store.dart';
import '../share_card.dart';
import '../theme.dart';

/// History of cards the attendee made on this device. Tap one to view it big
/// and re-share. Pull to refresh.
class MyCardsScreen extends StatefulWidget {
  const MyCardsScreen({super.key});

  @override
  State<MyCardsScreen> createState() => _MyCardsScreenState();
}

class _MyCardsScreenState extends State<MyCardsScreen> {
  late Future<List<SavedCard>> _future;

  @override
  void initState() {
    super.initState();
    _future = CardStore.instance.list();
  }

  void _reload() {
    setState(() => _future = CardStore.instance.list());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Brand.cream,
        surfaceTintColor: Brand.cream,
        elevation: 0,
        title: const Text('My cards',
            style: TextStyle(
                color: Brand.ink, fontSize: 17, fontWeight: FontWeight.w600)),
        iconTheme: const IconThemeData(color: Brand.ink),
      ),
      body: SafeArea(
        child: FutureBuilder<List<SavedCard>>(
          future: _future,
          builder: (ctx, snap) {
            if (snap.connectionState == ConnectionState.waiting) {
              return const Center(
                child: SizedBox(
                  width: 26,
                  height: 26,
                  child: CircularProgressIndicator(
                      strokeWidth: 2.5, color: Brand.gold),
                ),
              );
            }
            final cards = snap.data ?? const [];
            if (cards.isEmpty) return _empty();
            return GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate:
                  const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 14,
                mainAxisSpacing: 14,
                childAspectRatio: 0.7,
              ),
              itemCount: cards.length,
              itemBuilder: (ctx, i) => _tile(cards[i]),
            );
          },
        ),
      ),
    );
  }

  Widget _empty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.style_outlined, color: Brand.muted, size: 40),
            const SizedBox(height: 14),
            const Text('No cards yet',
                style: TextStyle(
                    color: Brand.ink,
                    fontSize: 18,
                    fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            const Text(
              'Cards you make will show up here so you can re-share them anytime.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Brand.muted, fontSize: 14, height: 1.5),
            ),
            const SizedBox(height: 20),
            FilledButton(
              // This screen is a tab in the shell's IndexedStack, not a pushed
              // route — Navigator.pop() here popped the whole app off the root
              // navigator (black screen, no back). Switch to Discover instead,
              // where you open an event to make its card.
              onPressed: () => mainTab.value = 0,
              child: const Text('Browse events'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _tile(SavedCard card) {
    return GestureDetector(
      onTap: () async {
        await Navigator.of(context).push(MaterialPageRoute(
          builder: (_) => _CardViewer(card: card),
        ));
        _reload();
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: FutureBuilder<String>(
                future: CardStore.instance.filePathFor(card),
                builder: (ctx, snap) {
                  if (!snap.hasData) {
                    return const ColoredBox(color: Brand.surface);
                  }
                  return Container(
                    decoration: BoxDecoration(
                      color: Brand.surface,
                      border: Border.all(color: Brand.border),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.file(File(snap.data!), fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) =>
                              const ColoredBox(color: Brand.surface)),
                    ),
                  );
                },
              ),
            ),
          ),
          const SizedBox(height: 6),
          Text(card.eventName,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                  color: Brand.ink, fontSize: 13.5, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _CardViewer extends StatelessWidget {
  final SavedCard card;
  const _CardViewer({required this.card});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Brand.cream,
        surfaceTintColor: Brand.cream,
        elevation: 0,
        title: Text(card.eventName,
            style: const TextStyle(
                color: Brand.ink, fontSize: 17, fontWeight: FontWeight.w600)),
        iconTheme: const IconThemeData(color: Brand.ink),
        actions: [
          IconButton(
            tooltip: 'Delete',
            icon: const Icon(Icons.delete_outline, color: Brand.muted),
            onPressed: () async {
              await CardStore.instance.delete(card);
              if (context.mounted) Navigator.of(context).pop();
            },
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Center(
                  child: FutureBuilder<String>(
                    future: CardStore.instance.filePathFor(card),
                    builder: (ctx, snap) {
                      if (!snap.hasData) return const SizedBox.shrink();
                      return ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Image.file(File(snap.data!),
                            fit: BoxFit.contain),
                      );
                    },
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
              child: SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  icon: const Icon(Icons.ios_share, size: 20),
                  label: const Text('Save / Share'),
                  onPressed: () async {
                    final bytes = await CardStore.instance.bytesFor(card);
                    if (bytes != null) {
                      await shareCardBytes(bytes, card.eventName);
                    }
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
