import 'package:flutter/material.dart';

import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';
import 'entitlement_card.dart';
import 'entitlement_state.dart';
import 'fullscreen_qr_screen.dart';

/// E03 — the attendee entitlement view. For one registration, lists every
/// entitlement the signed-in attendee HOLDS (RLS-enforced reads), each with its
/// computed state, and a single Show QR that surfaces the registration's own
/// scan token — the same code the organizer scanner reads.
class EntitlementsScreen extends StatefulWidget {
  final String registrationId;
  final String qrData;
  final String ticketCode;
  final String attendeeName;
  final String ticketTypeLabel;

  const EntitlementsScreen({
    super.key,
    required this.registrationId,
    required this.qrData,
    required this.ticketCode,
    required this.attendeeName,
    required this.ticketTypeLabel,
  });

  @override
  State<EntitlementsScreen> createState() => _EntitlementsScreenState();
}

class _EntitlementsScreenState extends State<EntitlementsScreen> {
  bool _loading = true;
  String? _error;
  StatusReason _errorReason = StatusReason.generic;
  List<EntComputed> _items = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      // The registration tells us the event and ticket tier. Own-row RLS on
      // registrations returns this only when it belongs to the current user.
      final reg = await supa
          .from('registrations')
          .select('event_id, ticket_type_id')
          .eq('id', widget.registrationId)
          .maybeSingle();
      if (reg == null) throw Exception('registration not found');

      final eventId = asString(reg['event_id']);
      final ticketTypeId = reg['ticket_type_id'] == null
          ? null
          : asString(reg['ticket_type_id']);

      final results = await Future.wait([
        // Definitions for the event (attendee-readable via is_event_attendee).
        supa
            .from('entitlements')
            .select('id, name, type, redemption_limit, valid_from, valid_until')
            .eq('event_id', eventId),
        // This registration's OWN ledger rows (owns_registration).
        supa
            .from('entitlement_redemptions')
            .select('entitlement_id, action, status, redeemed_at, day_index')
            .eq('registration_id', widget.registrationId),
        // Base inclusion for this ticket tier (tte read policy).
        if (ticketTypeId != null)
          supa
              .from('ticket_type_entitlements')
              .select('entitlement_id')
              .eq('ticket_type_id', ticketTypeId),
      ]);

      final all = asMapList(results[0]).map(Entitlement.fromMap).toList();
      final ledger = asMapList(results[1]).map(LedgerRow.fromMap).toList();
      final included = ticketTypeId == null
          ? <String>{}
          : asMapList(results[2])
              .map((r) => asString(r['entitlement_id']))
              .toSet();

      final computed = computeHeldEntitlements(
        all: all,
        includedEntitlementIds: included,
        ledger: ledger,
        now: DateTime.now(),
      );
      if (!mounted) return;
      setState(() {
        _items = computed;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      final msg = describeError(e, context: 'your passes');
      setState(() {
        _error = msg;
        _errorReason = msg.toLowerCase().contains("couldn't reach the server")
            ? StatusReason.network
            : StatusReason.generic;
        _loading = false;
      });
    }
  }

  void _showQr() {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => FullscreenQrScreen(
        qrData: widget.qrData,
        ticketCode: widget.ticketCode,
        attendee: widget.attendeeName,
        typeLabel: widget.ticketTypeLabel,
      ),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final showCta = !_loading && _error == null && _items.isNotEmpty;
    return MScaffold(
      appBar: const MAppBar(title: 'Passes', hairline: true),
      bottomBar: showCta
          ? StickyCta(children: [
              Expanded(
                child: MButton('Show QR',
                    kind: MBtnKind.forest,
                    icon: Icons.qr_code_2_rounded,
                    onTap: _showQr),
              ),
            ])
          : null,
      body: _body(),
    );
  }

  Widget _body() {
    if (_loading) return const _EntSkeleton();
    if (_error != null) {
      return ErrorStateView(
          message: _error!, onRetry: _load, reason: _errorReason);
    }
    if (_items.isEmpty) {
      return const EmptyState(
        icon: Icons.confirmation_number_outlined,
        title: 'No passes',
        message: 'This ticket includes no extra passes yet.',
      );
    }
    return RefreshIndicator(
      color: AppColors.forest,
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(
            AppSpace.lg, AppSpace.base, AppSpace.lg, AppSpace.xxl),
        itemCount: _items.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, i) => EntitlementCard(_items[i]),
      ),
    );
  }
}

/// Skeleton mirroring the card row: icon square, two text lines, a tag pill.
class _EntSkeleton extends StatelessWidget {
  const _EntSkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(
          AppSpace.lg, AppSpace.base, AppSpace.lg, AppSpace.xxl),
      children: [
        for (var i = 0; i < 4; i++) ...[
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(AppRadius.card),
              border: Border.all(color: AppColors.border),
              boxShadow: AppShadow.soft,
            ),
            child: Row(
              children: const [
                Skeleton(width: 44, height: 44, radius: 12),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Skeleton(width: 150, height: 14, radius: 7),
                      SizedBox(height: 8),
                      Skeleton(width: 96, height: 11, radius: 6),
                    ],
                  ),
                ),
                SizedBox(width: 8),
                Skeleton(width: 66, height: 22, radius: 999),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],
      ],
    );
  }
}
