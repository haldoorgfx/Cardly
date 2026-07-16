import 'package:flutter/material.dart';

import '../../net.dart';
import '../../ui/tokens.dart';
import '../../ui/components.dart';
import '../engage/_shared.dart';
import 'thread_screen.dart';

/// Attendee directory + AI matches + connection requests for an event.
///
/// Verified against the web app (components/networking/PeopleDiscoveryClient.tsx):
///  - GET /api/events/[id]/people?reg=<registration_id> returns confirmed /
///    checked_in `registrations` with { id, attendee_name, attendee_email,
///    ticket_type_id, custom_fields, eventera_card_url, ticket_types(name),
///    connection_status }.
///  - POST /api/events/[id]/connections { requester_id, recipient_id } creates
///    an `attendee_connections` row (status 'pending').
///  - GET /api/events/[id]/connections/requests?reg=<registration_id> returns
///    { incoming: [{connection_id, person_id, name, created_at}], sent: [...] }.
///  - PATCH /api/events/[id]/connections { connection_id, action: 'accept'|
///    'decline', registration_id } responds to an incoming request.
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

enum _Filter { all, connected, requests, suggested }

class _PeopleScreenState extends State<PeopleScreen> {
  bool _loading = true;
  String? _error;
  List<_Person> _people = [];
  List<_Match> _matches = [];
  String? _rid;

  final _searchCtrl = TextEditingController();
  String _query = '';
  _Filter _filter = _Filter.all;

  List<_ConnRequest> _incoming = [];
  List<_ConnRequest> _sent = [];
  bool _loadingRequests = false;
  bool _requestsLoaded = false;
  String? _respondingTo;

  bool get _canNetwork => _rid != null && _rid!.isNotEmpty;

  @override
  void initState() {
    super.initState();
    _rid = widget.registrationId;
    _searchCtrl.addListener(() {
      setState(() => _query = _searchCtrl.text);
    });
    if (_canNetwork) {
      _load();
    } else {
      _resolveRegThenLoad();
    }
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
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
      final results = await Future.wait([
        apiGet('/api/events/${widget.eventId}/people',
            query: {'reg': _rid}),
        _loadMatches(),
      ]);

      final peopleData = results[0];
      final people = asMapList(
          peopleData is Map ? peopleData['people'] : peopleData);

      if (!mounted) return;
      setState(() {
        _people = people.map(_Person.fromRow).toList();
        _matches = results[1] as List<_Match>;
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.message;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Something went wrong loading the directory.';
      });
    }
  }

  Future<List<_Match>> _loadMatches() async {
    try {
      final data = await apiGet('/api/events/${widget.eventId}/matches',
          query: {'registration_id': _rid});
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
        'requester_id': _rid,
        'recipient_id': p.id,
      });
      if (!mounted) return;
      setState(() {
        p.connectionStatus = 'pending';
        p.connecting = false;
        _requestsLoaded = false; // let the Requests tab re-fetch the new sent request
      });
      showToast(context, 'Connection request sent');
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => p.connecting = false);
      showToast(context, e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => p.connecting = false);
      showToast(context, 'Could not send request');
    }
  }

  /// Sends a real connection request for an AI-suggested match. Mirrors
  /// [_connect] but tracks state on the [_Match] so the suggested-for-you card's
  /// button reflects loading/pending like the directory rows do.
  Future<void> _connectMatch(_Match m) async {
    if (m.connecting || m.connectionStatus != null) return;
    setState(() => m.connecting = true);
    try {
      await apiPost('/api/events/${widget.eventId}/connections', {
        'requester_id': _rid,
        'recipient_id': m.id,
      });
      if (!mounted) return;
      setState(() {
        m.connectionStatus = 'pending';
        m.connecting = false;
        _requestsLoaded = false;
      });
      showToast(context, 'Connection request sent');
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => m.connecting = false);
      showToast(context, e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => m.connecting = false);
      showToast(context, 'Could not send request');
    }
  }

  Future<void> _loadRequests() async {
    if (!_canNetwork) return;
    setState(() => _loadingRequests = true);
    try {
      final data = await apiGet(
          '/api/events/${widget.eventId}/connections/requests',
          query: {'reg': _rid});
      final incoming =
          asMapList(data is Map ? data['incoming'] : null).map(_ConnRequest.fromRow).toList();
      final sent =
          asMapList(data is Map ? data['sent'] : null).map(_ConnRequest.fromRow).toList();
      if (!mounted) return;
      setState(() {
        _incoming = incoming;
        _sent = sent;
        _loadingRequests = false;
        _requestsLoaded = true;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _incoming = [];
        _sent = [];
        _loadingRequests = false;
        _requestsLoaded = true;
      });
    }
  }

  Future<void> _respond(_ConnRequest r, String action) async {
    if (!_canNetwork || _respondingTo != null) return;
    setState(() => _respondingTo = r.connectionId);
    try {
      await apiPatch('/api/events/${widget.eventId}/connections', {
        'connection_id': r.connectionId,
        'action': action,
        'registration_id': _rid,
      });
      if (!mounted) return;
      setState(() {
        _incoming.removeWhere((i) => i.connectionId == r.connectionId);
        _respondingTo = null;
        if (action == 'accept') {
          final match = _people.where((p) => p.id == r.personId);
          if (match.isNotEmpty) match.first.connectionStatus = 'accepted';
        }
      });
      showToast(context,
          action == 'accept' ? 'You\'re now connected' : 'Request declined');
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _respondingTo = null);
      showToast(context, e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _respondingTo = null);
      showToast(context, 'Could not update the request');
    }
  }

  void _selectFilter(_Filter f) {
    setState(() => _filter = f);
    if (f == _Filter.requests && !_requestsLoaded) _loadRequests();
  }

  void _openThread(String otherId, String otherName) {
    if (!_canNetwork) return;
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ThreadScreen(
          eventId: widget.eventId,
          registrationId: _rid!,
          otherRegId: otherId,
          otherName: otherName,
        ),
      ),
    );
  }

  void _showPersonSheet(_Person p) {
    showMSheet(
      context,
      Padding(
        padding: const EdgeInsets.fromLTRB(0, 4, 0, 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Avatar(name: p.name, imageUrl: p.avatarUrl, size: 52),
                const SizedBox(width: 13),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(p.name,
                          style: AppText.h3,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis),
                      if (p.subtitle.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(p.subtitle, style: AppText.bodySm),
                      ],
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            MButton(
              'Message',
              icon: Icons.chat_bubble_outline,
              onTap: () {
                Navigator.of(context).pop();
                _openThread(p.id, p.name);
              },
            ),
            const SizedBox(height: 10),
            if (p.connectionStatus == null)
              MButton(
                'Connect',
                kind: MBtnKind.sec,
                icon: Icons.person_add_alt,
                loading: p.connecting,
                onTap: () {
                  Navigator.of(context).pop();
                  _connect(p);
                },
              )
            else
              Center(child: _statusTag(p.connectionStatus!)),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: const MAppBar(title: 'People', showBack: false, hairline: true),
      body: !_canNetwork
          ? const _RegisterPrompt(
              title: 'Register to network',
              message:
                  'Register for this event to see who else is attending and start connecting.',
            )
          : _loading
              ? const LoadingState()
              : _error != null
                  ? ErrorStateView(message: _error!, onRetry: _load)
                  : RefreshIndicator(
                      color: AppColors.forest,
                      onRefresh: _filter == _Filter.requests ? _loadRequests : _load,
                      child: _buildBody(),
                    ),
    );
  }

  List<_Person> get _filteredPeople {
    return _people.where((p) {
      final matchesQuery =
          _query.isEmpty || p.name.toLowerCase().contains(_query.toLowerCase());
      final matchesFilter =
          _filter == _Filter.connected ? p.connectionStatus == 'accepted' : true;
      return matchesQuery && matchesFilter;
    }).toList();
  }

  Widget _buildBody() {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(AppSpace.lg, AppSpace.base, AppSpace.lg, 40),
      children: [
        MInput(
          controller: _searchCtrl,
          icon: Icons.search,
          hint: 'Search by name…',
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 34,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              MChip('All',
                  selected: _filter == _Filter.all,
                  onTap: () => _selectFilter(_Filter.all)),
              const SizedBox(width: 8),
              MChip('Connected',
                  selected: _filter == _Filter.connected,
                  onTap: () => _selectFilter(_Filter.connected)),
              const SizedBox(width: 8),
              MChip('Requests${_incoming.isNotEmpty ? ' · ${_incoming.length}' : ''}',
                  selected: _filter == _Filter.requests,
                  icon: Icons.inbox_outlined,
                  onTap: () => _selectFilter(_Filter.requests)),
              const SizedBox(width: 8),
              MChip('Suggested',
                  selected: _filter == _Filter.suggested,
                  icon: Icons.auto_awesome,
                  onTap: () => _selectFilter(_Filter.suggested)),
            ],
          ),
        ),
        const SizedBox(height: 18),
        if (_filter == _Filter.requests)
          _buildRequestsTab()
        else if (_filter == _Filter.suggested)
          _buildSuggestedTab()
        else
          _buildDirectoryTab(),
      ],
    );
  }

  Widget _buildDirectoryTab() {
    final people = _filteredPeople;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_filter == _Filter.all && _matches.isNotEmpty) ...[
          Row(
            children: [
              const Icon(Icons.auto_awesome, size: 15, color: AppColors.goldHover),
              const SizedBox(width: 7),
              Text('SUGGESTED FOR YOU',
                  style: AppText.seclab.copyWith(color: AppColors.goldHover)),
            ],
          ),
          const SizedBox(height: 12),
          ..._matches.map(_buildMatchCard),
          const SizedBox(height: 22),
        ],
        SectionLabel('All attendees · ${people.length}'),
        const SizedBox(height: 4),
        if (people.isEmpty)
          const Padding(
            padding: EdgeInsets.only(top: 60),
            child: EmptyState(
              icon: Icons.groups_outlined,
              title: 'No one here yet',
              message: 'No attendees match right now. Check back soon.',
            ),
          )
        else
          ...people.map(_buildPersonRow),
      ],
    );
  }

  Widget _buildSuggestedTab() {
    if (_matches.isEmpty) {
      return const Padding(
        padding: EdgeInsets.only(top: 60),
        child: EmptyState(
          icon: Icons.auto_awesome,
          title: 'No suggestions yet',
          message: 'Check back once more attendees have registered.',
        ),
      );
    }
    return Column(children: _matches.map(_buildMatchCard).toList());
  }

  Widget _buildRequestsTab() {
    if (_loadingRequests && !_requestsLoaded) {
      return const Padding(
        padding: EdgeInsets.only(top: 60),
        child: LoadingState(),
      );
    }
    if (_incoming.isEmpty && _sent.isEmpty) {
      return const Padding(
        padding: EdgeInsets.only(top: 60),
        child: EmptyState(
          icon: Icons.inbox_outlined,
          title: 'No pending requests',
          message: 'Requests you send or receive will appear here.',
        ),
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.inbox_outlined, size: 15, color: AppColors.inkMuted),
            const SizedBox(width: 7),
            Text('INCOMING · ${_incoming.length}',
                style: AppText.seclab.copyWith(color: AppColors.inkMuted)),
          ],
        ),
        const SizedBox(height: 10),
        if (_incoming.isEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Text('No incoming requests right now.',
                style: AppText.bodySm.copyWith(color: AppColors.inkMuted)),
          )
        else
          ..._incoming.map(_buildIncomingCard),
        const SizedBox(height: 22),
        Row(
          children: [
            const Icon(Icons.send_outlined, size: 15, color: AppColors.inkMuted),
            const SizedBox(width: 7),
            Text('SENT · ${_sent.length}',
                style: AppText.seclab.copyWith(color: AppColors.inkMuted)),
          ],
        ),
        const SizedBox(height: 10),
        if (_sent.isEmpty)
          Text('You haven\'t sent any requests yet.',
              style: AppText.bodySm.copyWith(color: AppColors.inkMuted))
        else
          ..._sent.map(_buildSentRow),
      ],
    );
  }

  Widget _buildIncomingCard(_ConnRequest r) {
    final busy = _respondingTo == r.connectionId;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.border),
        boxShadow: AppShadow.soft,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Avatar(name: r.name, size: 48),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(r.name, style: AppText.h3.copyWith(fontSize: 15)),
                    Text('Wants to connect', style: AppText.caption),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: MButton(
                  'Accept',
                  small: true,
                  icon: Icons.check,
                  loading: busy,
                  onTap: busy ? null : () => _respond(r, 'accept'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: MButton(
                  'Decline',
                  kind: MBtnKind.sec,
                  small: true,
                  icon: Icons.close,
                  onTap: busy ? null : () => _respond(r, 'decline'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSentRow(_ConnRequest r) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Avatar(name: r.name, size: 44),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(r.name,
                    style: AppText.h3.copyWith(fontSize: 15),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis),
                Text('Request sent', style: AppText.caption),
              ],
            ),
          ),
          _statusTag('pending'),
        ],
      ),
    );
  }

  Widget _buildMatchCard(_Match m) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.card),
          border: Border.all(color: AppColors.gold, width: 1.5),
          boxShadow: AppShadow.soft,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Avatar(name: m.name, size: 48),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(m.name,
                          style: AppText.h3.copyWith(fontSize: 15)),
                      if (m.subtitle.isNotEmpty) ...[
                        const SizedBox(height: 1),
                        Text(m.subtitle, style: AppText.caption),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Tag('${m.scorePct}% match', kind: TagKind.gold),
              ],
            ),
            if (m.reason.isNotEmpty) ...[
              const SizedBox(height: 11),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 9),
                decoration: BoxDecoration(
                  color: AppColors.goldSoft,
                  borderRadius: BorderRadius.circular(9),
                ),
                child: Text(m.reason,
                    style: AppText.bodySm
                        .copyWith(color: AppColors.inkSoft, height: 1.4)),
              ),
            ],
            const SizedBox(height: 11),
            if (m.connectionStatus != null)
              Align(
                alignment: Alignment.centerLeft,
                child: _statusTag(m.connectionStatus!),
              )
            else
              Row(
                children: [
                  Expanded(
                    child: MButton(
                      'Connect',
                      small: true,
                      icon: Icons.person_add_alt,
                      loading: m.connecting,
                      onTap: () => _connectMatch(m),
                    ),
                  ),
                  const SizedBox(width: 8),
                  MButton(
                    'Message',
                    kind: MBtnKind.sec,
                    small: true,
                    fullWidth: false,
                    icon: Icons.chat_bubble_outline,
                    onTap: () => _openThread(m.id, m.name),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildPersonRow(_Person p) {
    return ListRow(
      onTap: () => _showPersonSheet(p),
      leading: Avatar(name: p.name, imageUrl: p.avatarUrl, size: 48),
      title: Text(p.name),
      subtitle: p.subtitle.isEmpty ? null : Text(p.subtitle),
      trailing: _trailing(p),
    );
  }

  Widget _trailing(_Person p) {
    if (p.connectionStatus != null) {
      return _statusTag(p.connectionStatus!);
    }
    if (p.connecting) {
      return const SizedBox(
        width: 18,
        height: 18,
        child:
            CircularProgressIndicator(strokeWidth: 2, color: AppColors.forest),
      );
    }
    return MButton(
      'Connect',
      kind: MBtnKind.sec,
      small: true,
      fullWidth: false,
      onTap: () => _connect(p),
    );
  }

  Widget _statusTag(String status) {
    switch (status) {
      case 'accepted':
        return Container(
          height: 32,
          padding: const EdgeInsets.symmetric(horizontal: 13),
          decoration: BoxDecoration(
            color: AppColors.forestSoft,
            borderRadius: BorderRadius.circular(999),
          ),
          alignment: Alignment.center,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.check, size: 15, color: AppColors.forest),
              const SizedBox(width: 5),
              Text('Connected',
                  style: AppText.bodySm.copyWith(
                      color: AppColors.forest, fontWeight: FontWeight.w600)),
            ],
          ),
        );
      case 'declined':
        return const Tag('Declined', kind: TagKind.warning);
      default:
        return Container(
          height: 32,
          padding: const EdgeInsets.symmetric(horizontal: 15),
          decoration: BoxDecoration(
            color: AppColors.creamSoft,
            borderRadius: BorderRadius.circular(999),
          ),
          alignment: Alignment.center,
          child: Text('Pending',
              style: AppText.bodySm.copyWith(
                  color: AppColors.inkMuted, fontWeight: FontWeight.w600)),
        );
    }
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
  final String subtitle;
  final int scorePct;
  final String reason;
  String? connectionStatus;
  bool connecting = false;

  _Match({
    required this.id,
    required this.name,
    required this.subtitle,
    required this.scorePct,
    required this.reason,
  });

  factory _Match.fromRow(Map<String, dynamic> r) {
    final reg = r['registration'];
    final name = (reg is Map)
        ? asString(reg['attendee_name'], 'Attendee')
        : 'Attendee';
    String subtitle = '';
    if (reg is Map && reg['custom_fields'] is Map) {
      final cf = reg['custom_fields'] as Map;
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
    // Web app scores matches on a 0–100 scale (see lib/matchmaking/index.ts).
    final pct = asDouble(r['score']).round().clamp(0, 100);
    return _Match(
      id: asString(r['matched_registration_id']),
      name: name,
      subtitle: subtitle,
      scorePct: pct,
      reason: asString(r['reason']).trim(),
    );
  }
}

class _ConnRequest {
  final String connectionId;
  final String personId;
  final String name;

  _ConnRequest({
    required this.connectionId,
    required this.personId,
    required this.name,
  });

  factory _ConnRequest.fromRow(Map<String, dynamic> r) {
    return _ConnRequest(
      connectionId: asString(r['connection_id']),
      personId: asString(r['person_id']),
      name: asString(r['name'], 'Attendee'),
    );
  }
}

// ─── register gate ──────────────────────────────────────────────────────────

class _RegisterPrompt extends StatelessWidget {
  final String title;
  final String message;
  const _RegisterPrompt({required this.title, required this.message});
  @override
  Widget build(BuildContext context) {
    return EmptyState(
      icon: Icons.badge_outlined,
      title: title,
      message: message,
    );
  }
}
