import 'package:flutter/material.dart';

import '../../net.dart';
import '../../ui/tokens.dart';
import '../../ui/components.dart';
import '../engage/_shared.dart';

/// Speed networking — a fast one-at-a-time "meet people" deck.
///
/// Mirrors the web app's `/e/[slug]/speed-networking`:
///  - Loads up to 20 confirmed / checked_in `registrations` (excluding self).
///  - Shows one attendee at a time; Skip advances, Connect fires the same
///    POST /api/events/[id]/connections call used by PeopleScreen.
class SpeedNetworkingScreen extends StatefulWidget {
  final String eventId;
  final String? registrationId;
  const SpeedNetworkingScreen({
    super.key,
    required this.eventId,
    this.registrationId,
  });

  @override
  State<SpeedNetworkingScreen> createState() => _SpeedNetworkingScreenState();
}

class _SpeedNetworkingScreenState extends State<SpeedNetworkingScreen> {
  bool _loading = true;
  String? _error;
  StatusReason _errorReason = StatusReason.generic;
  List<_Attendee> _deck = [];
  int _index = 0;
  bool _connecting = false;
  String? _rid;

  bool get _canNetwork => _rid != null && _rid!.isNotEmpty;

  @override
  void initState() {
    super.initState();
    _rid = widget.registrationId;
    if (_canNetwork) {
      _load();
    } else {
      _resolveRegThenLoad();
    }
  }

  Future<void> _resolveRegThenLoad() async {
    final rid = await effectiveRegId(widget.registrationId, widget.eventId);
    if (!mounted) return;
    setState(() => _rid = rid);
    if (_canNetwork) {
      _load();
    } else {
      setState(() => _loading = false);
    }
  }

  Future<void> _load() async {
    if (!_canNetwork) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final rows = await supa
          .from('registrations')
          .select('id, attendee_name, eventera_card_url')
          .eq('event_id', widget.eventId)
          .inFilter('status', ['confirmed', 'checked_in']).limit(20);

      final list = asMapList(rows)
          .map(_Attendee.fromRow)
          .where((a) => a.id.isNotEmpty && a.id != _rid)
          .toList()
        ..shuffle();

      if (!mounted) return;
      setState(() {
        _deck = list;
        _index = 0;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      final msg = describeError(e, context: 'attendees');
      setState(() {
        _loading = false;
        _error = msg;
        _errorReason = _reasonFor(e, msg);
      });
    }
  }

  void _advance() {
    if (!mounted) return;
    setState(() => _index++);
  }

  void _restart() {
    if (!mounted) return;
    setState(() {
      _deck = List<_Attendee>.from(_deck)..shuffle();
      _index = 0;
    });
  }

  Future<void> _connect(_Attendee a) async {
    if (_connecting) return;
    setState(() => _connecting = true);
    try {
      await apiPost('/api/events/${widget.eventId}/connections', {
        'requester_id': _rid,
        'recipient_id': a.id,
      });
      if (!mounted) return;
      setState(() => _connecting = false);
      showToast(context, 'Connection request sent', type: ToastType.success);
      _advance();
    } catch (e) {
      if (!mounted) return;
      setState(() => _connecting = false);
      showToast(context, describeError(e, context: 'this connection'),
          type: ToastType.error);
    }
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: const MAppBar(title: 'Speed networking', hairline: true),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (!_canNetwork) {
      return const EmptyState(
        icon: Icons.people_alt_outlined,
        title: 'Register to start networking',
        message: 'Register for this event to meet other attendees.',
      );
    }
    if (_loading) return const LoadingState();
    if (_error != null) {
      return ErrorStateView(
          message: _error!, onRetry: _load, reason: _errorReason);
    }
    if (_deck.isEmpty) {
      return const EmptyState(
        icon: Icons.people_alt_outlined,
        title: 'No one to meet yet',
        message: 'No other attendees have joined yet. Check back soon.',
      );
    }
    if (_index >= _deck.length) {
      return EmptyState(
        icon: Icons.check_circle_outline,
        title: 'That\'s everyone',
        message: 'You\'ve been through everyone here.',
        ctaLabel: 'Start over',
        onCta: _restart,
      );
    }
    return _buildCard(_deck[_index]);
  }

  Widget _buildCard(_Attendee a) {
    final progress = '${_index + 1} of ${_deck.length}';
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
            AppSpace.lg, AppSpace.base, AppSpace.lg, AppSpace.lg),
        child: Column(
          children: [
            Align(
              alignment: Alignment.center,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.forestSoft,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(progress,
                    style: AppText.bodySm.copyWith(
                        color: AppColors.forest, fontWeight: FontWeight.w600)),
              ),
            ),
            Expanded(
              child: Center(
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                      horizontal: 24, vertical: 36),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(AppRadius.card),
                    border: Border.all(color: AppColors.border),
                    boxShadow: AppShadow.lift,
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SizedBox(
                        width: 132,
                        height: 132,
                        child: ClipOval(
                          child: (a.avatarUrl != null &&
                                  a.avatarUrl!.isNotEmpty)
                              ? Image.network(
                                  a.avatarUrl!,
                                  fit: BoxFit.cover,
                                  loadingBuilder: (ctx, child, progress) =>
                                      progress == null
                                          ? child
                                          : PhotoPlaceholder(
                                              hue: hueFromString(a.id)),
                                  errorBuilder: (_, __, ___) =>
                                      PhotoPlaceholder(
                                          hue: hueFromString(a.id)),
                                )
                              : PhotoPlaceholder(hue: hueFromString(a.id)),
                        ),
                      ),
                      const SizedBox(height: 22),
                      Text(
                        a.name,
                        textAlign: TextAlign.center,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.h2,
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: AppSpace.base),
            Row(
              children: [
                Expanded(
                  child: MButton(
                    'Skip',
                    kind: MBtnKind.sec,
                    onTap: _connecting ? null : _advance,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: MButton(
                    'Connect',
                    icon: Icons.person_add_alt,
                    loading: _connecting,
                    onTap: _connecting ? null : () => _connect(a),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Classifies a caught load error into a [StatusReason] so [ErrorStateView]
/// shows the right icon/copy — network for connectivity, and the
/// ApiException status code for anything the server told us (402 plan-gated,
/// 403 permission, 404 not found).
StatusReason _reasonFor(Object? error, String message) {
  if (message.toLowerCase().contains("couldn't reach the server")) {
    return StatusReason.network;
  }
  if (error is ApiException) {
    switch (error.status) {
      case 402:
        return StatusReason.plan;
      case 403:
        return StatusReason.permission;
      case 404:
        return StatusReason.notFound;
    }
  }
  return StatusReason.generic;
}

// ─── model ──────────────────────────────────────────────────────────────────

class _Attendee {
  final String id;
  final String name;
  final String? avatarUrl;

  _Attendee({required this.id, required this.name, required this.avatarUrl});

  factory _Attendee.fromRow(Map<String, dynamic> r) => _Attendee(
        id: asString(r['id']),
        name: asString(r['attendee_name'], 'Attendee'),
        avatarUrl: (r['eventera_card_url'] == null)
            ? null
            : asString(r['eventera_card_url']),
      );
}
