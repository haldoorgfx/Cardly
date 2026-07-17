import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';
import '../../organize/organizer_api.dart';

/// The 8 entitlement types (mirrors the CHECK constraint in
/// 065_entitlements.sql, and web's components/tickets/EntitlementIcon.tsx —
/// same type strings, same icon meaning, kept in lockstep with that file).
const kEntitlementTypes = [
  ('entry', 'Entry', Icons.meeting_room_outlined),
  ('meal', 'Meal', Icons.restaurant_outlined),
  ('session', 'Session', Icons.event_note_outlined),
  ('merch', 'Merch', Icons.shopping_bag_outlined),
  ('transport', 'Transport', Icons.directions_bus_outlined),
  ('access', 'Access', Icons.vpn_key_outlined),
  ('parking', 'Parking', Icons.local_parking_outlined),
  ('certificate', 'Certificate', Icons.workspace_premium_outlined),
];

const kRedemptionLimits = [
  ('once', 'Once'),
  ('once_per_day', 'Once per day'),
  ('unlimited', 'Unlimited'),
];

IconData _iconForType(String type) =>
    kEntitlementTypes.where((t) => t.$1 == type).firstOrNull?.$3 ??
    Icons.meeting_room_outlined;

String _labelForType(String type) =>
    kEntitlementTypes.where((t) => t.$1 == type).firstOrNull?.$2 ?? type;

String _labelForLimit(String limit) =>
    kRedemptionLimits.where((l) => l.$1 == limit).firstOrNull?.$2 ?? limit;

/// Organizer entitlements management (web parity: /events/[id]/entitlements).
/// Define what attendees can redeem — entry, meals, sessions, merch,
/// transport and more — and which ticket types carry each one. Writes go
/// straight to `entitlements` / `ticket_type_entitlements` under
/// `can_manage_event()` RLS, same pattern as the rest of the organizer app.
/// (The existing entitlement_scanner_screen.dart only *redeems* these —
/// this is the missing create/edit/delete counterpart.)
class EntitlementsScreen extends StatefulWidget {
  final String eventId;
  final String eventName;

  const EntitlementsScreen({
    super.key,
    required this.eventId,
    required this.eventName,
  });

  @override
  State<EntitlementsScreen> createState() => _EntitlementsScreenState();
}

class _Entitlement {
  final String id;
  String name;
  String type;
  int? quantity;
  DateTime? validFrom;
  DateTime? validUntil;
  String redemptionLimit;
  List<String> ticketTypeIds;

  _Entitlement({
    required this.id,
    required this.name,
    required this.type,
    required this.quantity,
    required this.validFrom,
    required this.validUntil,
    required this.redemptionLimit,
    required this.ticketTypeIds,
  });
}

class _TicketType {
  final String id;
  final String name;
  _TicketType({required this.id, required this.name});
}

class _EntitlementsScreenState extends State<EntitlementsScreen> {
  final _org = const OrganizerApi();
  bool _loading = true;
  String? _error;
  StatusReason _errorReason = StatusReason.generic;
  List<_Entitlement> _entitlements = [];
  List<_TicketType> _ticketTypes = [];

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
      final rows = await _org.loadEntitlements(widget.eventId);
      final ttRows = await _org.loadTicketTypesLite(widget.eventId);
      final ids = rows.map((e) => asString(e['id'])).toList();
      final links = await _org.loadEntitlementTicketTypeLinks(ids);

      if (!mounted) return;
      setState(() {
        _ticketTypes = ttRows
            .map((t) => _TicketType(id: asString(t['id']), name: asString(t['name'], 'Ticket')))
            .toList();
        _entitlements = rows
            .map((e) => _Entitlement(
                  id: asString(e['id']),
                  name: asString(e['name'], 'Entitlement'),
                  type: asString(e['type'], 'entry'),
                  quantity: e['quantity'] == null ? null : asInt(e['quantity']),
                  validFrom: asDate(e['valid_from']),
                  validUntil: asDate(e['valid_until']),
                  redemptionLimit: asString(e['redemption_limit'], 'unlimited'),
                  ticketTypeIds: links[asString(e['id'])] ?? [],
                ))
            .toList();
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      final msg = describeError(e, context: 'these entitlements');
      setState(() {
        _error = msg;
        _errorReason = msg.toLowerCase().contains("couldn't reach the server")
            ? StatusReason.network
            : StatusReason.generic;
        _loading = false;
      });
    }
  }

  Future<void> _addEntitlement() async {
    HapticFeedback.selectionClick();
    final saved = await showMSheet<bool>(
      context,
      _EntitlementEditSheet(
        eventId: widget.eventId,
        entitlement: null,
        ticketTypes: _ticketTypes,
        org: _org,
      ),
    );
    if (saved == true) await _load();
  }

  Future<void> _editEntitlement(_Entitlement ent) async {
    final saved = await showMSheet<bool>(
      context,
      _EntitlementEditSheet(
        eventId: widget.eventId,
        entitlement: ent,
        ticketTypes: _ticketTypes,
        org: _org,
      ),
    );
    if (saved == true) await _load();
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: const MAppBar(title: 'Entitlements', hairline: true),
      body: _body(),
      bottomBar: (!_loading && _error == null)
          ? StickyCta(children: [
              Expanded(
                child: MButton('Add entitlement',
                    icon: Icons.add, onTap: _addEntitlement),
              ),
            ])
          : null,
    );
  }

  Widget _body() {
    if (_loading) return const LoadingState();
    if (_error != null) {
      return ErrorStateView(
          message: _error!, onRetry: _load, reason: _errorReason);
    }

    return RefreshIndicator(
      color: AppColors.forest,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(
            AppSpace.lg, AppSpace.base, AppSpace.lg, AppSpace.xxxl),
        children: [
          Text(
            'Define what attendees can redeem for ${widget.eventName} — each '
            'scans on its own, with its own validity window and redemption '
            'limit. Attach them to ticket types so the right people hold '
            'the right things.',
            style: AppText.bodySm,
          ),
          const SizedBox(height: AppSpace.xl),
          if (_entitlements.isEmpty)
            const Padding(
              padding: EdgeInsets.only(top: 40),
              child: EmptyState(
                icon: Icons.confirmation_number_outlined,
                title: 'No entitlements yet',
                message: 'Add one to give attendees something to redeem beyond entry.',
              ),
            )
          else
            for (final ent in _entitlements) ...[
              _entCard(ent),
              const SizedBox(height: 10),
            ],
        ],
      ),
    );
  }

  Widget _entCard(_Entitlement ent) {
    final ticketNames = ent.ticketTypeIds
        .map((id) => _ticketTypes.where((t) => t.id == id).firstOrNull?.name)
        .whereType<String>()
        .toList();
    return GestureDetector(
      onTap: () => _editEntitlement(ent),
      child: Container(
        padding: const EdgeInsets.all(AppSpace.base),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.card),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: AppColors.forestSoft,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(_iconForType(ent.type), size: 19, color: AppColors.forest),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(ent.name, style: AppText.bodyStrong),
                  const SizedBox(height: 2),
                  Text(
                    '${_labelForType(ent.type)} · ${_labelForLimit(ent.redemptionLimit)}'
                    '${ent.quantity != null ? ' · ${ent.quantity} available' : ''}',
                    style: AppText.bodySm.copyWith(color: AppColors.inkMuted),
                  ),
                  if (ticketNames.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: ticketNames.map((n) => Tag(n, kind: TagKind.gold)).toList(),
                    ),
                  ],
                ],
              ),
            ),
            const Icon(Icons.chevron_right, size: 18, color: AppColors.inkMuted),
          ],
        ),
      ),
    );
  }
}

/// Create/edit sheet for one entitlement.
class _EntitlementEditSheet extends StatefulWidget {
  final String eventId;
  final _Entitlement? entitlement; // null = create
  final List<_TicketType> ticketTypes;
  final OrganizerApi org;
  const _EntitlementEditSheet({
    required this.eventId,
    required this.entitlement,
    required this.ticketTypes,
    required this.org,
  });

  @override
  State<_EntitlementEditSheet> createState() => _EntitlementEditSheetState();
}

class _EntitlementEditSheetState extends State<_EntitlementEditSheet> {
  late final _nameCtrl = TextEditingController(text: widget.entitlement?.name ?? '');
  late final _quantityCtrl =
      TextEditingController(text: widget.entitlement?.quantity?.toString() ?? '');
  late String _type = widget.entitlement?.type ?? kEntitlementTypes.first.$1;
  late String _limit = widget.entitlement?.redemptionLimit ?? 'unlimited';
  DateTime? _validFrom;
  DateTime? _validUntil;
  final Set<String> _selectedTicketTypes = {};
  bool _busy = false;
  String? _error;

  bool get _isEdit => widget.entitlement != null;

  @override
  void initState() {
    super.initState();
    _validFrom = widget.entitlement?.validFrom;
    _validUntil = widget.entitlement?.validUntil;
    _selectedTicketTypes.addAll(widget.entitlement?.ticketTypeIds ?? []);
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _quantityCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate(bool isFrom) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: (isFrom ? _validFrom : _validUntil) ?? DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
    );
    if (picked == null) return;
    setState(() => isFrom ? _validFrom = picked : _validUntil = picked);
  }

  Future<void> _save() async {
    final name = _nameCtrl.text.trim();
    if (name.isEmpty) {
      setState(() => _error = 'Name is required.');
      return;
    }
    if (name.length > 120) {
      setState(() => _error = 'Name must be under 120 characters.');
      return;
    }
    int? quantity;
    final rawQty = _quantityCtrl.text.trim();
    if (rawQty.isNotEmpty) {
      final parsed = int.tryParse(rawQty);
      if (parsed == null || parsed < 1) {
        setState(() => _error = 'Quantity must be a whole number of 1 or more.');
        return;
      }
      quantity = parsed;
    }
    if (_validFrom != null && _validUntil != null && !_validFrom!.isBefore(_validUntil!)) {
      setState(() => _error = 'The valid-from date must be before valid-until.');
      return;
    }

    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      if (_isEdit) {
        await widget.org.updateEntitlement(
          widget.entitlement!.id,
          name: name,
          type: _type,
          quantity: quantity,
          validFrom: _validFrom,
          validUntil: _validUntil,
          redemptionLimit: _limit,
          ticketTypeIds: _selectedTicketTypes.toList(),
        );
      } else {
        await widget.org.createEntitlement(
          widget.eventId,
          name: name,
          type: _type,
          quantity: quantity,
          validFrom: _validFrom,
          validUntil: _validUntil,
          redemptionLimit: _limit,
          ticketTypeIds: _selectedTicketTypes.toList(),
        );
      }
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) {
        setState(() {
          _busy = false;
          _error = describeError(e, context: 'this entitlement');
        });
      }
    }
  }

  Future<void> _delete() async {
    final ent = widget.entitlement;
    if (ent == null) return;
    setState(() => _busy = true);
    try {
      await widget.org.deleteEntitlement(ent.id);
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) {
        setState(() {
          _busy = false;
          _error = describeError(e, context: 'this entitlement');
        });
      }
    }
  }

  String _fmtDate(DateTime d) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${months[d.month - 1]} ${d.day}, ${d.year}';
  }

  Widget _dateField(String label, DateTime? value, bool isFrom) {
    return Expanded(
      child: GestureDetector(
        onTap: () => _pickDate(isFrom),
        child: Container(
          height: 46,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: AppColors.canvas,
            borderRadius: BorderRadius.circular(AppRadius.btn),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  value != null ? _fmtDate(value) : label,
                  style: AppText.bodySm.copyWith(
                      color: value != null ? AppColors.ink : AppColors.inkMuted),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (value != null)
                GestureDetector(
                  onTap: () => setState(() => isFrom ? _validFrom = null : _validUntil = null),
                  child: const Icon(Icons.close, size: 14, color: AppColors.inkMuted),
                ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(_isEdit ? 'Edit entitlement' : 'New entitlement', style: AppText.h3),
          const SizedBox(height: 16),
          MInput(label: 'Name', hint: 'e.g. Lunch, VIP lounge', controller: _nameCtrl),
          const SizedBox(height: 16),
          Text('Type', style: AppText.bodyStrong.copyWith(fontSize: 13)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: kEntitlementTypes.map((t) {
              return MChip(t.$2,
                  icon: t.$3,
                  selected: _type == t.$1,
                  onTap: () => setState(() => _type = t.$1));
            }).toList(),
          ),
          const SizedBox(height: 16),
          Text('Redemption limit', style: AppText.bodyStrong.copyWith(fontSize: 13)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: kRedemptionLimits.map((l) {
              return MChip(l.$2,
                  selected: _limit == l.$1,
                  onTap: () => setState(() => _limit = l.$1));
            }).toList(),
          ),
          const SizedBox(height: 16),
          MInput(
            label: 'Quantity (optional)',
            hint: 'Leave empty for unlimited stock',
            controller: _quantityCtrl,
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 16),
          Text('Valid window (optional)', style: AppText.bodyStrong.copyWith(fontSize: 13)),
          const SizedBox(height: 8),
          Row(
            children: [
              _dateField('From', _validFrom, true),
              const SizedBox(width: 8),
              _dateField('Until', _validUntil, false),
            ],
          ),
          if (widget.ticketTypes.isNotEmpty) ...[
            const SizedBox(height: 16),
            Text('Ticket types that carry this', style: AppText.bodyStrong.copyWith(fontSize: 13)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: widget.ticketTypes.map((t) {
                final selected = _selectedTicketTypes.contains(t.id);
                return MChip(t.name,
                    selected: selected,
                    onTap: () => setState(() {
                          if (selected) {
                            _selectedTicketTypes.remove(t.id);
                          } else {
                            _selectedTicketTypes.add(t.id);
                          }
                        }));
              }).toList(),
            ),
          ],
          if (_error != null) ...[
            const SizedBox(height: 12),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.error_outline, color: AppColors.danger, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(_error!, style: AppText.bodySm.copyWith(color: AppColors.danger)),
                ),
              ],
            ),
          ],
          const SizedBox(height: 18),
          MButton('Save', loading: _busy, onTap: _busy ? null : _save),
          if (_isEdit) ...[
            const SizedBox(height: 4),
            Center(
              child: TextButton(
                onPressed: _busy ? null : _delete,
                style: TextButton.styleFrom(
                    foregroundColor: AppColors.danger, minimumSize: const Size(0, 48)),
                child: const Text('Delete entitlement',
                    style: TextStyle(fontWeight: FontWeight.w600)),
              ),
            ),
          ],
          MButton('Cancel',
              kind: MBtnKind.text, onTap: _busy ? null : () => Navigator.of(context).pop(false)),
        ],
      ),
    );
  }
}

extension<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
