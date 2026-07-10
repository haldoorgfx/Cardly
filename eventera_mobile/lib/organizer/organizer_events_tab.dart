import 'package:flutter/material.dart';

import '../eventera_api.dart';
import '../models.dart';
import '../screens/organizer/create_event_screen.dart';
import '../screens/organizer/event_detail_screen.dart';
import '../ui/components.dart';
import '../ui/tokens.dart';
import 'organizer_shell.dart';

/// Events tab — the organizer's own events (same query as the dashboard). White
/// cards on cream; tap opens the existing event detail screen. The forest header
/// band carries a single "new event" action.
class OrganizerEventsTab extends StatefulWidget {
  const OrganizerEventsTab({super.key});

  @override
  State<OrganizerEventsTab> createState() => _OrganizerEventsTabState();
}

class _OrganizerEventsTabState extends State<OrganizerEventsTab> {
  final _api = EventeraApi();
  late Future<List<OrganizerEvent>> _future;

  @override
  void initState() {
    super.initState();
    _future = _api.myEvents();
  }

  void _reload() => setState(() => _future = _api.myEvents());

  Future<void> _refresh() async {
    _reload();
    await _future;
  }

  Future<void> _newEvent() async {
    final created = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => const CreateEventScreen()),
    );
    if (created == true) _reload();
  }

  Future<void> _open(OrganizerEvent e) async {
    final changed = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => EventDetailScreen(eventId: e.id, initialName: e.name),
      ),
    );
    if (changed == true) _reload();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        OrgHeaderBand(
          title: 'Events',
          trailing: _HeaderAction(icon: Icons.add, onTap: _newEvent),
        ),
        Expanded(
          child: FutureBuilder<List<OrganizerEvent>>(
            future: _future,
            builder: (context, snap) {
              if (snap.connectionState == ConnectionState.waiting) {
                return const _EventsSkeleton();
              }
              if (snap.hasError) {
                return ErrorStateView(
                    message: "Couldn't load your events.", onRetry: _reload);
              }
              final events = snap.data ?? const [];
              if (events.isEmpty) {
                return EmptyState(
                  icon: Icons.event_note_outlined,
                  title: 'No events yet',
                  message: 'Create your first event to start collecting cards.',
                  ctaLabel: 'New event',
                  onCta: _newEvent,
                );
              }
              return RefreshIndicator(
                color: AppColors.forest,
                onRefresh: _refresh,
                child: ListView.separated(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
                  itemCount: events.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (_, i) =>
                      _EventCard(event: events[i], onTap: () => _open(events[i])),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

/// A translucent-white action button that sits inside the forest header band.
class _HeaderAction extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _HeaderAction({required this.icon, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        width: 40,
        height: 40,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.14),
          borderRadius: BorderRadius.circular(11),
        ),
        child: Icon(icon, color: Colors.white, size: 20),
      ),
    );
  }
}

class _EventCard extends StatelessWidget {
  final OrganizerEvent event;
  final VoidCallback onTap;
  const _EventCard({required this.event, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return MCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(event.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.h3.copyWith(fontSize: 15.5)),
              ),
              const SizedBox(width: 8),
              if (event.isPublished)
                const Tag('Published', kind: TagKind.success)
              else
                Tag(event.status, kind: TagKind.warning),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _Stat(
                  icon: Icons.visibility_outlined,
                  value: '${event.viewCount}',
                  label: 'views'),
              const SizedBox(width: 22),
              _Stat(
                  icon: Icons.download_outlined,
                  value: '${event.downloadCount}',
                  label: 'cards'),
            ],
          ),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  const _Stat({required this.icon, required this.value, required this.label});
  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppColors.inkMuted),
        const SizedBox(width: 6),
        Text(value, style: AppText.numSm.copyWith(color: AppColors.ink)),
        const SizedBox(width: 4),
        Text(label, style: AppText.caption.copyWith(color: AppColors.inkMuted)),
      ],
    );
  }
}

/// Skeleton that mirrors the real event-card list.
class _EventsSkeleton extends StatelessWidget {
  const _EventsSkeleton();
  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
      itemCount: 4,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, __) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.card),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Skeleton(width: 160, height: 16),
            SizedBox(height: 14),
            Skeleton(width: 120, height: 12),
          ],
        ),
      ),
    );
  }
}
