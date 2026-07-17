import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';
import '../../organize/organizer_api.dart';

/// Organizer catering + accessibility (web parity: /events/[id]/catering
/// and /events/[id]/catering/accessibility). Both are read-only aggregate
/// views backed by the same RPCs web uses (catering_counts,
/// accessibility_summary) — SECURITY DEFINER functions that authorise on
/// auth.uid() internally, so calling them from the authenticated client
/// here is identical to web's session-client call.
class CateringScreen extends StatefulWidget {
  final String eventId;
  final String eventName;

  const CateringScreen({
    super.key,
    required this.eventId,
    required this.eventName,
  });

  @override
  State<CateringScreen> createState() => _CateringScreenState();
}

class _Meal {
  final String entitlementId;
  final String entitlementName;
  final int totalRedeemed;
  final List<(String, int)> dietary;
  _Meal({
    required this.entitlementId,
    required this.entitlementName,
    required this.totalRedeemed,
    required this.dietary,
  });
}

class _AccessAttendee {
  final String registrationId;
  final String? name;
  final String? email;
  final String? phone;
  final List<String> accessibility;
  final String? note;
  _AccessAttendee({
    required this.registrationId,
    required this.name,
    required this.email,
    required this.phone,
    required this.accessibility,
    required this.note,
  });

  String get asCopyText {
    final lines = <String>[name ?? 'Attendee'];
    if (accessibility.isNotEmpty) lines.add('Needs: ${accessibility.join(', ')}');
    if (note != null && note!.trim().isNotEmpty) lines.add('Note: ${note!.trim()}');
    if (email != null) lines.add('Email: $email');
    if (phone != null) lines.add('Phone: $phone');
    return lines.join('\n');
  }
}

class _CateringScreenState extends State<CateringScreen> {
  final _org = const OrganizerApi();
  int _seg = 0; // 0 = Meals, 1 = Accessibility

  bool _loadingMeals = true;
  String? _mealsError;
  StatusReason _mealsErrorReason = StatusReason.generic;
  List<_Meal> _meals = [];

  bool _loadingAccess = true;
  String? _accessError;
  StatusReason _accessErrorReason = StatusReason.generic;
  int _totalWithNeeds = 0;
  List<(String, int)> _byTag = [];
  List<_AccessAttendee> _attendees = [];

  String? _copiedId;

  @override
  void initState() {
    super.initState();
    _loadMeals();
    _loadAccessibility();
  }

  bool _isAuthError(Object e) =>
      e is PostgrestException && e.code == 'P0001' && e.message.contains('NOT_AUTHORISED');

  Future<void> _loadMeals() async {
    setState(() {
      _loadingMeals = true;
      _mealsError = null;
    });
    try {
      final data = await _org.loadCateringCounts(widget.eventId);
      final rows = asMapList(data['meals']);
      if (!mounted) return;
      setState(() {
        _meals = rows
            .map((m) => _Meal(
                  entitlementId: asString(m['entitlement_id']),
                  entitlementName: asString(m['entitlement_name'], 'Meal'),
                  totalRedeemed: asInt(m['total_redeemed']),
                  dietary: asMapList(m['dietary'])
                      .map((d) => (asString(d['tag']), asInt(d['count'])))
                      .toList(),
                ))
            .toList();
        _loadingMeals = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        if (_isAuthError(e)) {
          _mealsErrorReason = StatusReason.permission;
          _mealsError = 'Only the event owner or its staff can see catering counts.';
        } else {
          _mealsErrorReason = StatusReason.generic;
          _mealsError = describeError(e, context: 'catering counts');
        }
        _loadingMeals = false;
      });
    }
  }

  Future<void> _loadAccessibility() async {
    setState(() {
      _loadingAccess = true;
      _accessError = null;
    });
    try {
      final data = await _org.loadAccessibilitySummary(widget.eventId);
      if (!mounted) return;
      setState(() {
        _totalWithNeeds = asInt(data['total_with_needs']);
        _byTag = asMapList(data['by_tag'])
            .map((t) => (asString(t['tag']), asInt(t['count'])))
            .toList();
        _attendees = asMapList(data['attendees'])
            .map((a) => _AccessAttendee(
                  registrationId: asString(a['registration_id']),
                  name: a['name'] == null ? null : asString(a['name']),
                  email: a['email'] == null ? null : asString(a['email']),
                  phone: a['phone'] == null ? null : asString(a['phone']),
                  accessibility: (a['accessibility'] as List?)
                          ?.map((x) => x.toString())
                          .toList() ??
                      [],
                  note: a['note'] == null ? null : asString(a['note']),
                ))
            .toList();
        _loadingAccess = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        if (_isAuthError(e)) {
          _accessErrorReason = StatusReason.permission;
          _accessError = 'Only the event owner or its staff can see accessibility needs.';
        } else {
          _accessErrorReason = StatusReason.generic;
          _accessError = describeError(e, context: 'this accessibility summary');
        }
        _loadingAccess = false;
      });
    }
  }

  Future<void> _copyAttendee(_AccessAttendee a) async {
    await Clipboard.setData(ClipboardData(text: a.asCopyText));
    if (!mounted) return;
    setState(() => _copiedId = a.registrationId);
    Future.delayed(const Duration(milliseconds: 1800), () {
      if (mounted && _copiedId == a.registrationId) setState(() => _copiedId = null);
    });
  }

  Future<void> _launch(String scheme, String value) async {
    final uri = Uri.tryParse('$scheme:$value');
    if (uri == null) return;
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      // launchUrl failing usually means there's no app installed to handle
      // it (e.g. no mail client) — say so instead of doing nothing visibly.
      if (mounted) {
        showToast(
          context,
          scheme == 'mailto'
              ? "Couldn't open a mail app. Is one installed?"
              : "Couldn't open the phone dialer.",
          type: ToastType.error,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: const MAppBar(title: 'Catering', hairline: true),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(AppSpace.lg, 10, AppSpace.lg, 10),
            child: SegControl(
              segments: const ['Meals', 'Accessibility'],
              index: _seg,
              onChanged: (i) => setState(() => _seg = i),
            ),
          ),
          Expanded(child: _seg == 0 ? _mealsTab() : _accessTab()),
        ],
      ),
    );
  }

  Widget _mealsTab() {
    if (_loadingMeals) return const LoadingState();
    if (_mealsError != null) {
      return StatusState(
        kind: StatusKind.error,
        reason: _mealsErrorReason,
        title: _mealsErrorReason == StatusReason.permission
            ? 'You can\'t manage this event'
            : 'Couldn\'t load catering counts',
        message: _mealsError!,
        primaryLabel:
            _mealsErrorReason == StatusReason.permission ? null : 'Try again',
        onPrimary: _mealsErrorReason == StatusReason.permission ? null : _loadMeals,
      );
    }
    if (_meals.isEmpty) {
      return const EmptyState(
        icon: Icons.no_meals_outlined,
        title: 'No meal entitlements yet',
        message: 'Add a meal entitlement and attach it to your ticket types. '
            'Once meals are scanned at check-in, their counts and dietary '
            'breakdown appear here.',
      );
    }
    return RefreshIndicator(
      color: AppColors.forest,
      onRefresh: _loadMeals,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(
            AppSpace.lg, AppSpace.sm, AppSpace.lg, AppSpace.xxxl),
        children: [
          Text(
            'What to prepare, per meal. Counts come from meals actually '
            'redeemed at check-in, broken down by dietary needs attendees shared.',
            style: AppText.bodySm,
          ),
          const SizedBox(height: AppSpace.lg),
          for (final m in _meals) ...[
            _mealCard(m),
            const SizedBox(height: 10),
          ],
        ],
      ),
    );
  }

  Widget _mealCard(_Meal m) {
    return Container(
      padding: const EdgeInsets.all(AppSpace.base),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: AppColors.forestSoft,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.restaurant_outlined, size: 17, color: AppColors.forest),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(m.entitlementName, style: AppText.bodyStrong),
                    Text(
                      '${m.totalRedeemed} ${m.totalRedeemed == 1 ? 'serving' : 'servings'} redeemed',
                      style: AppText.bodySm.copyWith(color: AppColors.inkMuted),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (m.dietary.isEmpty) ...[
            const SizedBox(height: 10),
            Text('No dietary needs shared for this meal yet.',
                style: AppText.bodySm.copyWith(color: AppColors.inkMuted)),
          ] else ...[
            const SizedBox(height: 12),
            for (final (tag, count) in m.dietary) ...[
              Container(
                margin: const EdgeInsets.only(bottom: 6),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                decoration: BoxDecoration(
                  color: AppColors.canvas,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(tag, style: AppText.bodySm.copyWith(fontWeight: FontWeight.w600)),
                    Text('$count', style: AppText.bodyStrong),
                  ],
                ),
              ),
            ],
          ],
        ],
      ),
    );
  }

  Widget _accessTab() {
    if (_loadingAccess) return const LoadingState();
    if (_accessError != null) {
      return StatusState(
        kind: StatusKind.error,
        reason: _accessErrorReason,
        title: _accessErrorReason == StatusReason.permission
            ? 'You can\'t manage this event'
            : 'Couldn\'t load this summary',
        message: _accessError!,
        primaryLabel:
            _accessErrorReason == StatusReason.permission ? null : 'Try again',
        onPrimary:
            _accessErrorReason == StatusReason.permission ? null : _loadAccessibility,
      );
    }
    final hasNeeds = _totalWithNeeds > 0 || _attendees.isNotEmpty;
    if (!hasNeeds) {
      return const EmptyState(
        icon: Icons.volunteer_activism_outlined,
        title: 'No accessibility needs shared',
        message: 'No one has shared an accessibility need yet. When they do, '
            'it\'ll show here so you can prepare — with the total, a '
            'breakdown, and how to reach them.',
      );
    }
    return RefreshIndicator(
      color: AppColors.forest,
      onRefresh: _loadAccessibility,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(
            AppSpace.lg, AppSpace.sm, AppSpace.lg, AppSpace.xxxl),
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpace.base),
            decoration: BoxDecoration(
              color: AppColors.forestSoft,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.forest.withValues(alpha: 0.16)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.shield_outlined, size: 16, color: AppColors.forest),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Private to your organizing team. Share only with the '
                    'people preparing for the event, and only what they need to know.',
                    style: AppText.bodySm,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpace.lg),
          Container(
            padding: const EdgeInsets.all(AppSpace.base),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(AppRadius.card),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text('$_totalWithNeeds', style: AppText.h1.copyWith(fontSize: 26)),
                    const SizedBox(width: 8),
                    Text(
                      _totalWithNeeds == 1 ? 'attendee shared a need' : 'attendees shared a need',
                      style: AppText.bodySm.copyWith(color: AppColors.inkMuted),
                    ),
                  ],
                ),
                if (_byTag.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _byTag
                        .map((t) => Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              decoration: BoxDecoration(
                                color: AppColors.canvas,
                                borderRadius: BorderRadius.circular(999),
                                border: Border.all(color: AppColors.border),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(t.$1, style: AppText.bodySm),
                                  const SizedBox(width: 6),
                                  Text('${t.$2}', style: AppText.bodyStrong.copyWith(fontSize: 13)),
                                ],
                              ),
                            ))
                        .toList(),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: AppSpace.base),
          for (final a in _attendees) ...[
            _attendeeCard(a),
            const SizedBox(height: 10),
          ],
        ],
      ),
    );
  }

  Widget _attendeeCard(_AccessAttendee a) {
    final copied = _copiedId == a.registrationId;
    return Container(
      padding: const EdgeInsets.all(AppSpace.base),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(a.name ?? 'Attendee',
                    style: AppText.bodyStrong, overflow: TextOverflow.ellipsis),
              ),
              GestureDetector(
                onTap: () => _copyAttendee(a),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(copied ? Icons.check : Icons.copy,
                          size: 13, color: copied ? AppColors.success : AppColors.inkSoft),
                      const SizedBox(width: 5),
                      Text(copied ? 'Copied' : 'Copy details',
                          style: AppText.caption.copyWith(
                              color: copied ? AppColors.success : AppColors.inkSoft)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          if (a.accessibility.isNotEmpty) ...[
            const SizedBox(height: 10),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: a.accessibility
                  .map((tag) => Tag(tag, kind: TagKind.forest))
                  .toList(),
            ),
          ],
          if (a.note != null && a.note!.trim().isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.canvas,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.border),
              ),
              child: Text(a.note!.trim(), style: AppText.bodySm),
            ),
          ],
          if (a.email != null || a.phone != null) ...[
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (a.email != null)
                  _contactChip(Icons.mail_outline, a.email!, () => _launch('mailto', a.email!)),
                if (a.phone != null)
                  _contactChip(Icons.call_outlined, a.phone!, () => _launch('tel', a.phone!)),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _contactChip(IconData icon, String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 13, color: AppColors.forest),
            const SizedBox(width: 6),
            Text(label, style: AppText.bodySm),
          ],
        ),
      ),
    );
  }

}
