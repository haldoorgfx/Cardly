import 'package:flutter/material.dart';

import '../../net.dart';
import '../../theme.dart';
import 'thread_screen.dart';

/// Attendee directory + AI matches for an event.
///
/// Verified against the web app:
///  - GET /api/events/[id]/people?reg=<registration_id> returns confirmed /
///    checked_in `registrations` with { id, attendee_name, attendee_email,
///    ticket_type_id, custom_fields, eventera_card_url, ticket_types(name),
///    connection_status }.
///  - POST /api/events/[id]/connections { requester_id, recipient_id } creates
///    an `attendee_connections` row (status 'pending').
///  - GET /api/events/[id]/matches?registration_id=<id> returns
///    { matches: [{ matched_registration_id, score, reason,
///      registration: { id, attendee_name, custom_fields } }] }.
class PeopleScreen extends StatefulWidget {
  final String eventId;
  final String slug;
  final String? registrationId;

  const PeopleScreen({
    super.key,
    required this.eventId,
    required this.slug,
    this.registrationId,
  });

  @override
  State<PeopleScreen> createState() => _PeopleScreenState();
}

class _PeopleScreenState extends State<PeopleScreen> {
  bool _loading = true;
  String? _error;
  List<_Person> _people = [];
  List<_Match> _matches = [];

  bool get _canNetwork =>
      widget.registrationId != null && widget.registrationId!.isNotEmpty;

  @override
  void initState() {
    super.initState();
    if (_canNetwork) _load();
    else _loading = false;
  }

  Future<void> _load() async {
    if (!_canNetwork) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        apiGet('/api/events/${widget.eventId}/people',
            query: {'reg': widget.registrationId}),
        _loadMatches(),
      ]);

      final peopleData = results[0];
      final people = asMapList(
          peopleData is Map ? peopleData['people'] : peopleData);

      setState(() {
        _people = people.map(_Person.fromRow).toList();
        _matches = results[1] as List<_Match>;
        _loading = false;
      });
    } on ApiException catch (e) {
      setState(() {
        _loading = false;
        _error = e.message;
      });
    } catch (_) {
      setState(() {
        _loading = false;
        _error = 'Something went wrong loading the directory.';
      });
    }
  }

  Future<List<_Match>> _loadMatches() async {
    try {
      final data = await apiGet('/api/events/${widget.eventId}/matches',
          query: {'registration_id': widget.registrationId});
      final list = asMapList(data is Map ? data['matches'] : data);
      return list.map(_Match.fromRow).toList();
    } catch (_) {
      return const [];
    }
  }

  Future<void> _connect(_Person p) async {
    setState(() => p.connecting = true);
    try {
      await apiPost('/api/events/${widget.eventId}/connections', {
        'requester_id': widget.registrationId,
        'recipient_id': p.id,
      });
      if (!mounted) return;
      setState(() {
        p.connectionStatus = 'pending';
        p.connecting = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Connection request sent')),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => p.connecting = false);
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      if (!mounted) return;
      setState(() => p.connecting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not send request')),
      );
    }
  }

  void _openThread(String otherId, String otherName) {
    if (!_canNetwork) return;
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ThreadScreen(
          eventId: widget.eventId,
          registrationId: widget.registrationId!,
          otherRegId: otherId,
          otherName: otherName,
        ),
      ),
    );
  }

  void _showPersonSheet(_Person p) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Brand.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  _Avatar(url: p.avatarUrl, name: p.name, size: 48),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(p.name,
                            style: const TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.w700,
                                color: Brand.ink)),
                        if (p.subtitle.isNotEmpty)
                          Text(p.subtitle,
                              style: const TextStyle(
                                  fontSize: 13, color: Brand.muted)),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              FilledButton.icon(
                onPressed: () {
                  Navigator.of(context).pop();
                  _openThread(p.id, p.name);
                },
                icon: const Icon(Icons.chat_bubble_outline, size: 18),
                label: const Text('Message'),
              ),
              const SizedBox(height: 10),
              if (p.connectionStatus == null)
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Brand.forest,
                    side: const BorderSide(color: Brand.border),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: p.connecting
                      ? null
                      : () {
                          Navigator.of(context).pop();
                          _connect(p);
                        },
                  icon: const Icon(Icons.person_add_alt, size: 18),
                  label: const Text('Connect'),
                )
              else
                Center(
                  child: _ConnectionBadge(status: p.connectionStatus!),
                ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Brand.cream,
      appBar: AppBar(
        backgroundColor: Brand.cream,
        foregroundColor: Brand.forest,
        elevation: 0,
        title: const Text('People', style: TextStyle(color: Brand.forest)),
      ),
      body: !_canNetwork
          ? const _RegisterPrompt()
          : _loading
              ? const _CenterSpinner()
              : _error != null
                  ? _ErrorState(message: _error!, onRetry: _load)
                  : RefreshIndicator(
                      color: Brand.forest,
                      onRefresh: _load,
                      child: _buildList(),
                    ),
    );
  }

  Widget _buildList() {
    if (_people.isEmpty && _matches.isEmpty) {
      return ListView(
        children: const [
          SizedBox(height: 120),
          _EmptyState(
            icon: Icons.groups_outlined,
            message: 'No other attendees have joined yet.\nCheck back soon.',
          ),
        ],
      );
    }
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 40),
      children: [
        if (_matches.isNotEmpty) ...[
          const _SectionLabel('Suggested for you'),
          const SizedBox(height: 12),
          ..._matches.map(_buildMatchTile),
          const SizedBox(height: 24),
        ],
        const _SectionLabel('All attendees'),
        const SizedBox(height: 12),
        ..._people.map(_buildPersonTile),
      ],
    );
  }

  Widget _buildMatchTile(_Match m) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Brand.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Brand.gold.withValues(alpha: 0.6)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                _Avatar(url: null, name: m.name, size: 42),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(m.name,
                          style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: Brand.ink)),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          const Icon(Icons.auto_awesome,
                              size: 13, color: Brand.gold),
                          const SizedBox(width: 4),
                          Text('${m.scorePct}% match',
                              style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: Brand.inkSoft)),
                        ],
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.chat_bubble_outline,
                      size: 20, color: Brand.forest),
                  onPressed: () => _openThread(m.id, m.name),
                ),
              ],
            ),
            if (m.reason.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(m.reason,
                  style: const TextStyle(
                      fontSize: 13, height: 1.4, color: Brand.inkSoft)),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildPersonTile(_Person p) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: () => _showPersonSheet(p),
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Brand.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Brand.border),
          ),
          child: Row(
            children: [
              _Avatar(url: p.avatarUrl, name: p.name, size: 44),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(p.name,
                        style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: Brand.ink)),
                    if (p.subtitle.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(p.subtitle,
                          style: const TextStyle(
                              fontSize: 13, color: Brand.muted)),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 8),
              _trailing(p),
            ],
          ),
        ),
      ),
    );
  }

  Widget _trailing(_Person p) {
    if (p.connectionStatus != null) {
      return _ConnectionBadge(status: p.connectionStatus!);
    }
    if (p.connecting) {
      return const SizedBox(
        width: 20,
        height: 20,
        child: CircularProgressIndicator(strokeWidth: 2, color: Brand.forest),
      );
    }
    return OutlinedButton(
      style: OutlinedButton.styleFrom(
        foregroundColor: Brand.forest,
        side: const BorderSide(color: Brand.border),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
      ),
      onPressed: () => _connect(p),
      child: const Text('Connect', style: TextStyle(fontSize: 13)),
    );
  }
}

// ─── models ───────────────────────────────────────────────────────────────

class _Person {
  final String id;
  final String name;
  final String subtitle;
  final String? avatarUrl;
  String? connectionStatus;
  bool connecting = false;

  _Person({
    required this.id,
    required this.name,
    required this.subtitle,
    required this.avatarUrl,
    required this.connectionStatus,
  });

  factory _Person.fromRow(Map<String, dynamic> r) {
    final cf = r['custom_fields'];
    String subtitle = '';
    if (cf is Map) {
      final title = asString(cf['title'] ?? cf['job_title'] ?? cf['role']).trim();
      final company =
          asString(cf['company'] ?? cf['organization'] ?? cf['organisation'])
              .trim();
      if (title.isNotEmpty && company.isNotEmpty) {
        subtitle = '$title · $company';
      } else {
        subtitle = title.isNotEmpty ? title : company;
      }
    }
    final tt = r['ticket_types'];
    if (subtitle.isEmpty && tt is Map) {
      subtitle = asString(tt['name']).trim();
    }
    return _Person(
      id: asString(r['id']),
      name: asString(r['attendee_name'], 'Attendee'),
      subtitle: subtitle,
      avatarUrl: (r['eventera_card_url'] == null)
          ? null
          : asString(r['eventera_card_url']),
      connectionStatus: r['connection_status'] == null
          ? null
          : asString(r['connection_status']),
    );
  }
}

class _Match {
  final String id;
  final String name;
  final int scorePct;
  final String reason;

  _Match({
    required this.id,
    required this.name,
    required this.scorePct,
    required this.reason,
  });

  factory _Match.fromRow(Map<String, dynamic> r) {
    final reg = r['registration'];
    final name = (reg is Map)
        ? asString(reg['attendee_name'], 'Attendee')
        : 'Attendee';
    // Web app scores matches on a 0–100 scale (see lib/matchmaking/index.ts).
    final pct = asDouble(r['score']).round().clamp(0, 100);
    return _Match(
      id: asString(r['matched_registration_id']),
      name: name,
      scorePct: pct,
      reason: asString(r['reason']).trim(),
    );
  }
}

// ─── shared local widgets (avoid editing shared files) ──────────────────────

class _RegisterPrompt extends StatelessWidget {
  const _RegisterPrompt();
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Icon(Icons.badge_outlined, color: Brand.forest, size: 44),
            SizedBox(height: 14),
            Text('Register to network',
                style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Brand.ink)),
            SizedBox(height: 8),
            Text(
              'Register for this event to see who else is attending and start connecting.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, height: 1.5, color: Brand.inkSoft),
            ),
          ],
        ),
      ),
    );
  }
}

class _ConnectionBadge extends StatelessWidget {
  final String status;
  const _ConnectionBadge({required this.status});
  @override
  Widget build(BuildContext context) {
    late final Color bg;
    late final Color fg;
    late final String label;
    switch (status) {
      case 'accepted':
        bg = Brand.success.withValues(alpha: 0.12);
        fg = Brand.success;
        label = 'Connected';
        break;
      case 'declined':
        bg = Brand.muted.withValues(alpha: 0.12);
        fg = Brand.muted;
        label = 'Declined';
        break;
      default:
        bg = Brand.gold.withValues(alpha: 0.20);
        fg = Brand.inkSoft;
        label = 'Pending';
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration:
          BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
      child: Text(label,
          style: TextStyle(
              fontSize: 12, fontWeight: FontWeight.w600, color: fg)),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);
  @override
  Widget build(BuildContext context) => Text(
        text,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.4,
          color: Brand.forest,
        ),
      );
}

class _CenterSpinner extends StatelessWidget {
  const _CenterSpinner();
  @override
  Widget build(BuildContext context) =>
      const Center(child: CircularProgressIndicator(color: Brand.forest));
}

class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorState({required this.message, required this.onRetry});
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, color: Brand.danger, size: 40),
            const SizedBox(height: 12),
            Text(message,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 15, color: Brand.inkSoft)),
            const SizedBox(height: 16),
            FilledButton(onPressed: onRetry, child: const Text('Try again')),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String message;
  const _EmptyState({required this.icon, required this.message});
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: Brand.muted, size: 40),
            const SizedBox(height: 12),
            Text(message,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 15, color: Brand.inkSoft)),
          ],
        ),
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  final String? url;
  final String name;
  final double size;
  const _Avatar({required this.url, required this.name, this.size = 44});

  String get _initials {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) return '?';
    if (parts.length == 1) return parts.first[0].toUpperCase();
    return (parts.first[0] + parts.last[0]).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final fallback = Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Brand.forest, Color(0xFF2A6A50)],
        ),
      ),
      child: Text(_initials,
          style: TextStyle(
              color: Colors.white,
              fontSize: size * 0.34,
              fontWeight: FontWeight.w600)),
    );
    if (url == null || url!.isEmpty) return fallback;
    return ClipOval(
      child: Image.network(
        url!,
        width: size,
        height: size,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => fallback,
        loadingBuilder: (ctx, child, prog) => prog == null ? child : fallback,
      ),
    );