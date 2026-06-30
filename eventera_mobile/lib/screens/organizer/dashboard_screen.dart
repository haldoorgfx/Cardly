import 'package:flutter/material.dart';

import '../../auth_service.dart';
import '../../eventera_api.dart';
import '../../models.dart';
import '../../theme.dart';

/// Organizer home: lists the events you own with their status and stats.
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _api = EventeraApi();
  late Future<List<OrganizerEvent>> _future;

  @override
  void initState() {
    super.initState();
    _future = _api.myEvents();
  }

  Future<void> _refresh() async {
    setState(() => _future = _api.myEvents());
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Brand.cream,
        surfaceTintColor: Brand.cream,
        elevation: 0,
        title: const Text('Your events',
            style: TextStyle(
                color: Brand.ink, fontSize: 18, fontWeight: FontWeight.w700)),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.account_circle_outlined, color: Brand.ink),
            onSelected: (v) async {
              if (v == 'signout') await AuthService.instance.signOut();
            },
            itemBuilder: (ctx) => [
              PopupMenuItem(
                enabled: false,
                child: Text(AuthService.instance.email ?? 'Signed in',
                    style: const TextStyle(color: Brand.muted, fontSize: 13)),
              ),
              const PopupMenuItem(value: 'signout', child: Text('Sign out')),
            ],
          ),
          const SizedBox(width: 6),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          color: Brand.forest,
          onRefresh: _refresh,
          child: FutureBuilder<List<OrganizerEvent>>(
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
              if (snap.hasError) {
                return _message(
                  Icons.error_outline,
                  "Couldn't load your events",
                  'Pull down to retry.',
                );
              }
              final events = snap.data ?? const [];
              if (events.isEmpty) {
                return ListView(
                  children: [
                    const SizedBox(height: 80),
                    _message(
                      Icons.event_note_outlined,
                      'No events yet',
                      'Create your first event to start collecting cards.',
                    ),
                  ],
                );
              }
              return ListView.separated(
                padding: const EdgeInsets.all(20),
                itemCount: events.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (ctx, i) => _eventTile(events[i]),
              );
            },
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: Brand.forest,
        foregroundColor: Colors.white,
        onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Create event — coming next.')),
          );
        },
        icon: const Icon(Icons.add),
        label: const Text('New event'),
      ),
    );
  }

  Widget _eventTile(OrganizerEvent e) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Brand.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Brand.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(e.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        color: Brand.ink,
                        fontSize: 16,
                        fontWeight: FontWeight.w600)),
              ),
              _statusChip(e),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              _stat(Icons.visibility_outlined, '${e.viewCount}', 'views'),
              const SizedBox(width: 20),
              _stat(Icons.download_outlined, '${e.downloadCount}', 'cards'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _statusChip(OrganizerEvent e) {
    final published = e.isPublished;
    final color = published ? Brand.success : Brand.muted;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(published ? 'Published' : e.status,
          style: TextStyle(
              color: color, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }

  Widget _stat(IconData icon, String value, String label) {
    return Row(
      children: [
        Icon(icon, color: Brand.muted, size: 16),
        const SizedBox(width: 5),
        Text(value,
            style: const TextStyle(
                color: Brand.ink, fontSize: 14, fontWeight: FontWeight.w600)),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(color: Brand.muted, fontSize: 13)),
      ],
    );
  }

  Widget _message(IconData icon, String title, String body) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: Brand.muted, size: 40),
            const SizedBox(height: 14),
            Text(title,
                style: const TextStyle(
                    color: Brand.ink,
                    fontSize: 18,
                    fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            Text(body,
                textAlign: TextAlign.center,
                style: const TextStyle(
                    color: Brand.muted, fontSize: 14, height: 1.5)),
          ],
        ),
      ),
    );
  }
}
