import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../eventera_api.dart';
import '../../models.dart';
import '../../organize/organizer_api.dart';
import '../../theme.dart';
import '../../ui/components.dart';
import '../../roles/staff/event_control_screen.dart';
import 'catering_screen.dart';
import 'communications_screen.dart';
import 'entitlements_screen.dart';
import 'event_days_screen.dart';
import 'manage_tickets_screen.dart';
import 'share_screen.dart';
import 'zone_editor_screen.dart';

/// Manage a single event: see its design + status, edit the fields (zones),
/// publish/unpublish, share, or delete.
class EventDetailScreen extends StatefulWidget {
  final String eventId;
  final String initialName;
  const EventDetailScreen({
    super.key,
    required this.eventId,
    required this.initialName,
  });

  @override
  State<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends State<EventDetailScreen> {
  final _api = EventeraApi();
  final _org = const OrganizerApi();
  late Future<OwnedEvent> _future;
  bool _changed = false; // whether to tell the dashboard to refresh
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _future = _api.loadOwnEvent(widget.eventId);
  }

  void _reload() {
    setState(() => _future = _api.loadOwnEvent(widget.eventId));
  }

  Future<void> _togglePublish(OwnedEvent e) async {
    final publishing = !e.isPublished;
    if (!publishing) {
      final ok = await _confirmUnpublish();
      if (ok != true) return;
    }
    HapticFeedback.lightImpact();
    setState(() => _busy = true);
    try {
      await _api.setPublished(e.id, publishing);
      // Keep the public event page's visibility in step with the status so the
      // discovery / registration side matches (best-effort; status is the
      // source of truth for the card flow).
      try {
        await _org.setEventPublic(e.id, publishing, title: e.name);
      } catch (_) {/* status already flipped */}
      _changed = true;
      _reload();
      if (mounted) {
        showToast(
            context,
            publishing
                ? 'Event published — share it now.'
                : 'Event unpublished.',
            type: ToastType.success);
      }
    } catch (e) {
      if (mounted) {
        showToast(context, describeError(e, context: 'the event'),
            type: ToastType.error);
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<bool?> _confirmUnpublish() {
    return showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Brand.surface,
        title: const Text('Unpublish event?'),
        content: const Text(
            'Attendees won\'t be able to open the link or register until you '
            'publish again. Your registrations and check-ins are kept.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Keep published',
                style: TextStyle(color: Brand.forest)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child:
                const Text('Unpublish', style: TextStyle(color: Brand.danger)),
          ),
        ],
      ),
    );
  }

  Future<void> _delete(OwnedEvent e) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Brand.surface,
        title: const Text('Delete event?'),
        content: const Text(
            'This permanently deletes the event and its cards. This cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: Brand.muted)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete', style: TextStyle(color: Brand.danger)),
          ),
        ],
      ),
    );
    if (ok != true) return;
    HapticFeedback.mediumImpact();
    try {
      await _api.deleteEvent(e.id);
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) {
        showToast(context, describeError(e, context: 'this event'),
            type: ToastType.error);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: true,
      onPopInvokedWithResult: (didPop, _) {},
      child: Scaffold(
        appBar: AppBar(
          backgroundColor: Brand.cream,
          surfaceTintColor: Brand.cream,
          elevation: 0,
          title: Text(widget.initialName,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                  color: Brand.ink, fontSize: 17, fontWeight: FontWeight.w600)),
          iconTheme: const IconThemeData(color: Brand.ink),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.of(context).pop(_changed),
          ),
        ),
        body: SafeArea(
          child: FutureBuilder<OwnedEvent>(
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
              if (snap.hasError || !snap.hasData) {
                // Surface the REAL reason (not found, no design yet, offline,
                // ...) instead of a blanket "couldn't load" — loadOwnEvent()
                // already throws specific EventeraException messages for each
                // case; describeError() only has to translate raw/noisy
                // exceptions (network, Postgrest) that aren't already clean.
                final msg = describeError(snap.error, context: 'this event');
                final reason = msg.toLowerCase().contains("couldn't reach the server")
                    ? StatusReason.network
                    : (msg.toLowerCase().contains('not found') ||
                            msg.toLowerCase().contains('no design yet'))
                        ? StatusReason.notFound
                        : StatusReason.generic;
                return StatusState(
                  kind: StatusKind.error,
                  reason: reason,
                  message: msg,
                  primaryLabel: 'Try again',
                  onPrimary: _reload,
                  secondaryLabel: 'Go back',
                  onSecondary: () => Navigator.of(context).pop(_changed),
                );
              }
              return _content(snap.data!);
            },
          ),
        ),
      ),
    );
  }

  Widget _content(OwnedEvent e) {
    final fieldCount = e.zonesRaw.where((z) {
      final t = z['type'];
      final hidden = z['hidden'] == true;
      return !hidden && (t == 'text' || t == 'photo' || t == 'custom');
    }).length;

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // Design preview
        Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 280),
            child: AspectRatio(
              aspectRatio: e.bgWidth / e.bgHeight,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Container(
                  decoration: BoxDecoration(
                    color: Brand.surface,
                    border: Border.all(color: Brand.border),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: e.backgroundUrl == null
                      ? const Center(
                          child: Text('No design',
                              style: TextStyle(color: Brand.muted)))
                      : Image.network(e.backgroundUrl!, fit: BoxFit.cover,
                          // Distinguish "still downloading" from the
                          // "Could not load design" error below — without
                          // this both look like an identical blank panel.
                          loadingBuilder: (ctx, child, progress) =>
                              progress == null
                                  ? child
                                  : const Center(
                                      child: SizedBox(
                                        width: 22,
                                        height: 22,
                                        child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: Brand.muted),
                                      ),
                                    ),
                          errorBuilder: (_, __, ___) => const Center(
                              child: Text('Could not load design',
                                  style: TextStyle(color: Brand.muted)))),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            _statusChip(e),
            const SizedBox(width: 10),
            Text('$fieldCount ${fieldCount == 1 ? "field" : "fields"}',
                style: const TextStyle(color: Brand.muted, fontSize: 14)),
          ],
        ),
        const SizedBox(height: 22),

        _actionTile(
          icon: Icons.tune,
          title: 'Edit fields',
          subtitle: 'Place name & photo areas on the design',
          onTap: () async {
            final saved = await Navigator.of(context).push<bool>(
              MaterialPageRoute(builder: (_) => ZoneEditorScreen(event: e)),
            );
            if (saved == true) {
              _changed = true;
              _reload();
            }
          },
        ),
        _actionTile(
          icon: Icons.confirmation_number_outlined,
          title: 'Tickets & pricing',
          subtitle: 'Add, edit, hide or price your ticket types',
          onTap: () async {
            final changed = await Navigator.of(context).push<bool>(
              MaterialPageRoute(
                builder: (_) => ManageTicketsScreen(
                    eventId: e.id, eventName: e.name),
              ),
            );
            if (changed == true) _changed = true;
          },
        ),
        _actionTile(
          icon: Icons.calendar_view_day_outlined,
          title: 'Event days',
          subtitle: 'Turn this into a multi-day event with per-day capacity',
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => EventDaysScreen(eventId: e.id, eventName: e.name),
            ),
          ),
        ),
        _actionTile(
          icon: Icons.workspace_premium_outlined,
          title: 'Entitlements',
          subtitle: 'Meals, merch, sessions — what attendees can redeem',
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => EntitlementsScreen(eventId: e.id, eventName: e.name),
            ),
          ),
        ),
        _actionTile(
          icon: Icons.restaurant_outlined,
          title: 'Catering & accessibility',
          subtitle: 'Meal counts, dietary needs, and accessibility requests',
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => CateringScreen(eventId: e.id, eventName: e.name),
            ),
          ),
        ),
        _actionTile(
          icon: Icons.mail_outline,
          title: 'Communications',
          subtitle: 'Email a custom update to all confirmed attendees',
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => CommunicationsScreen(eventId: e.id, eventName: e.name),
            ),
          ),
        ),
        _actionTile(
          icon: Icons.qr_code_scanner,
          title: 'Check in attendees',
          subtitle: e.isPublished
              ? 'Scan QR codes and see live check-in numbers'
              : 'Publish first to open the door',
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => EventControlScreen(
                  eventId: e.id, eventName: e.name, isOwner: true),
            ),
          ),
        ),
        _actionTile(
          icon: Icons.ios_share,
          title: 'Share link',
          subtitle: e.isPublished
              ? 'Send the link or QR to attendees'
              : 'Publish first to share',
          onTap: () {
            if (!e.isPublished) {
              showToast(context,
                  'Publish the event first so attendees can open the link.',
                  type: ToastType.warning);
              return;
            }
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => ShareScreen(slug: e.slug, eventName: e.name),
              ),
            );
          },
        ),
        _actionTile(
          icon: Icons.delete_outline,
          title: 'Delete event',
          subtitle: 'Remove permanently',
          danger: true,
          onTap: () => _delete(e),
        ),
        const SizedBox(height: 24),

        // Publish / unpublish
        SizedBox(
          width: double.infinity,
          child: FilledButton.icon(
            style: FilledButton.styleFrom(
              backgroundColor: e.isPublished ? Brand.muted : Brand.forest,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: _busy ? null : () => _togglePublish(e),
            icon: _busy
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                        strokeWidth: 2.3, color: Colors.white))
                : Icon(e.isPublished ? Icons.visibility_off : Icons.public,
                    size: 20),
            label: Text(e.isPublished ? 'Unpublish' : 'Publish event',
                style: const TextStyle(
                    fontSize: 15, fontWeight: FontWeight.w600)),
          ),
        ),
        if (!e.isPublished && fieldCount == 0) ...[
          const SizedBox(height: 10),
          const Text(
            'Tip: add at least a name field so attendees can personalize their card.',
            style: TextStyle(color: Brand.muted, fontSize: 12.5, height: 1.4),
          ),
        ],
      ],
    );
  }

  Widget _statusChip(OwnedEvent e) {
    final color = e.isPublished ? Brand.success : Brand.muted;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(e.isPublished ? 'Published' : e.status,
          style: TextStyle(
              color: color, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }

  Widget _actionTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    bool danger = false,
  }) {
    final color = danger ? Brand.danger : Brand.ink;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Brand.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Brand.border),
          ),
          child: Row(
            children: [
              Icon(icon, color: danger ? Brand.danger : Brand.forest, size: 22),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: TextStyle(
                            color: color,
                            fontSize: 15,
                            fontWeight: FontWeight.w600)),
                    const SizedBox(height: 2),
                    Text(subtitle,
                        style: const TextStyle(
                            color: Brand.muted, fontSize: 13)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: Brand.muted),
            ],
          ),
        ),
      ),
    );
  }
}
