import 'package:flutter/material.dart';

import '../../net.dart';
import '../../ui/tokens.dart';
import '../../ui/menu.dart';
import '../../ui/components.dart';
import '../organizer/organizer_profile_screen.dart';

/// Organizers the signed-in attendee follows.
///
/// Reads `organizer_follows` (own-row RLS: auth.uid() = follower_id) joined to
/// the organizer's `profiles`. Verified against migration 010_attendee_accounts
/// and app/api/account/follows/route.ts:
///   organizer_follows(id, follower_id, organizer_id, notify_new_events, created_at)
///   profiles(id, full_name, avatar_url, email)
/// Unfollow deletes the row.
class FollowingScreen extends StatefulWidget {
  final VoidCallback? onSignInTap;
  const FollowingScreen({super.key, this.onSignInTap});

  @override
  State<FollowingScreen> createState() => _FollowingScreenState();
}

class _FollowingScreenState extends State<FollowingScreen> {
  bool _loading = true;
  String? _error;
  List<_Follow> _items = [];
  List<_Suggestion> _suggestions = [];
  final Set<String> _followingSuggestion = {};

  @override
  void initState() {
    super.initState();
    if (isSignedIn) {
      _load();
    } else {
      _loading = false;
    }
  }

  Future<void> _load() async {
    if (!isSignedIn) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final rows = await supa
          .from('organizer_follows')
          .select(
              'id, organizer_id, notify_new_events, created_at, profiles!organizer_follows_organizer_id_fkey(id, full_name, avatar_url, email)')
          .eq('follower_id', currentUserId as Object)
          .order('created_at', ascending: false);
      if (!mounted) return;
      setState(() {
        _items = asMapList(rows).map(_Follow.fromRow).toList();
        _loading = false;
      });
      // Suggestions are best-effort — never block or crash the screen.
      _loadSuggestions();
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
        _error = 'Something went wrong loading who you follow.';
      });
    }
  }

  /// Best-effort discovery of organizers to suggest. An organizer is the
  /// `events.user_id` behind a public `event_pages` row (verified against
  /// organizer_profile_screen: `event_pages ... events!inner(user_id, slug)`,
  /// filtered by is_public = true). We collect distinct user_ids, exclude
  /// anyone already followed and the current user, then load their profiles.
  /// Any failure here silently yields no suggestions.
  Future<void> _loadSuggestions() async {
    if (!isSignedIn) return;
    final excluded = <String>{
      if (currentUserId != null) currentUserId as String,
      ..._items.map((f) => f.organizerId),
    };
    try {
      final rows = await supa
          .from('event_pages')
          .select('events!inner(user_id)')
          .eq('is_public', true)
          .order('created_at', ascending: false)
          .limit(120);
      if (!mounted) return;

      // Distinct organizer user ids, honouring exclusions, capped at 6.
      final ids = <String>[];
      final seen = <String>{};
      for (final r in asMapList(rows)) {
        final ev = r['events'];
        final m = (ev is Map) ? Map<String, dynamic>.from(ev) : null;
        final uid = m == null ? '' : asString(m['user_id']).trim();
        if (uid.isEmpty || excluded.contains(uid)) continue;
        if (!seen.add(uid)) continue;
        ids.add(uid);
        if (ids.length >= 6) break;
      }
      if (ids.isEmpty) {
        if (mounted) setState(() => _suggestions = []);
        return;
      }

      final profRows = await supa
          .from('profiles')
          .select('id, full_name, avatar_url, email')
          .inFilter('id', ids);
      if (!mounted) return;

      final byId = <String, _Suggestion>{};
      for (final r in asMapList(profRows)) {
        final s = _Suggestion.fromProfile(r);
        if (s != null) byId[s.organizerId] = s;
      }
      // Preserve the recency ordering from `ids`.
      final out = [for (final id in ids) if (byId[id] != null) byId[id]!];
      setState(() => _suggestions = out);
    } catch (_) {
      if (!mounted) return;
      setState(() => _suggestions = []);
    }
  }

  Future<void> _followSuggestion(_Suggestion s) async {
    if (!isSignedIn || _followingSuggestion.contains(s.organizerId)) return;
    setState(() {
      _followingSuggestion.add(s.organizerId);
      _suggestions.removeWhere((x) => x.organizerId == s.organizerId);
    });
    try {
      await supa.from('organizer_follows').insert({
        'follower_id': currentUserId,
        'organizer_id': s.organizerId,
        'notify_new_events': true,
      });
      if (!mounted) return;
      showToast(context, 'Following ${s.name}');
      _followingSuggestion.remove(s.organizerId);
      await _load();
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _followingSuggestion.remove(s.organizerId);
        _suggestions.insert(0, s);
      });
      showToast(context, 'Could not follow ${s.name}');
    }
  }

  Future<void> _unfollow(_Follow f) async {
    final index = _items.indexOf(f);
    setState(() => _items.remove(f));
    try {
      await supa.from('organizer_follows').delete().eq('id', f.id);
      if (!mounted) return;
      showToast(context, 'Unfollowed ${f.name}');
    } catch (_) {
      if (!mounted) return;
      setState(() => _items.insert(index.clamp(0, _items.length), f));
      showToast(context, 'Could not unfollow');
    }
  }

  Future<void> _toggleNotify(_Follow f) async {
    final next = !f.notify;
    setState(() => f.notify = next);
    try {
      await supa
          .from('organizer_follows')
          .update({'notify_new_events': next}).eq('id', f.id);
    } catch (_) {
      if (!mounted) return;
      setState(() => f.notify = !next);
      showToast(context, 'Could not update notifications');
    }
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: const MAppBar(title: 'Following', hairline: true),
      body: !isSignedIn
          ? _SignInPrompt(
              message: 'Sign in to see the organizers you follow.',
              onSignInTap: widget.onSignInTap)
          : _loading
              ? const LoadingState()
              : _error != null
                  ? ErrorStateView(message: _error!, onRetry: _load)
                  : RefreshIndicator(
                      color: AppColors.forest,
                      onRefresh: _load,
                      child: _buildList(),
                    ),
    );
  }

  Widget _buildList() {
    final hasFollows = _items.isNotEmpty;
    final hasSuggestions = _suggestions.isNotEmpty;

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding:
          const EdgeInsets.fromLTRB(AppSpace.lg, AppSpace.md, AppSpace.lg, 40),
      children: [
        const GroupLabel('Following'),
        if (hasFollows)
          _card(children: [
            for (var i = 0; i < _items.length; i++) ...[
              if (i > 0)
                const Divider(
                    height: 1, thickness: 1, color: AppColors.border),
              _followRow(_items[i]),
            ],
          ])
        else
          Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(AppRadius.card),
              border: Border.all(color: AppColors.border),
            ),
            padding: const EdgeInsets.symmetric(
                horizontal: AppSpace.lg, vertical: 28),
            child: Row(
              children: [
                Icon(Icons.person_search_outlined,
                    color: AppColors.inkMuted, size: 24),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Not following anyone',
                          style: AppText.body
                              .copyWith(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 2),
                      Text('Follow an organizer to get new-event alerts.',
                          style:
                              AppText.bodySm.copyWith(color: AppColors.inkSoft)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        if (hasSuggestions) ...[
          const SizedBox(height: AppSpace.lg),
          const GroupLabel('Suggested organizers'),
          _card(children: [
            for (var i = 0; i < _suggestions.length; i++) ...[
              if (i > 0)
                const Divider(
                    height: 1, thickness: 1, color: AppColors.border),
              _suggestionRow(_suggestions[i], filled: i == 0),
            ],
          ]),
        ],
      ],
    );
  }

  Widget _card({required List<Widget> children}) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(children: children),
    );
  }

  void _openProfile(_Follow f) {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => OrganizerProfileScreen(
          organizerId: f.organizerId, initialName: f.name),
    ));
  }

  Widget _followRow(_Follow f) {
    return InkWell(
      onTap: () => _openProfile(f),
      child: Padding(
        padding: const EdgeInsets.symmetric(
            horizontal: AppSpace.md, vertical: 12),
        child: Row(
          children: [
            Avatar(name: f.name, imageUrl: f.avatarUrl, size: 48),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(f.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.body.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 2),
                  Text(
                    f.notify ? 'New-event alerts on' : 'New-event alerts off',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.bodySm.copyWith(color: AppColors.inkSoft),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            MToggle(value: f.notify, onChanged: (_) => _toggleNotify(f)),
            const SizedBox(width: 10),
            _pill(
              label: 'Following',
              filled: false,
              onTap: () => _unfollow(f),
            ),
          ],
        ),
      ),
    );
  }

  Widget _suggestionRow(_Suggestion s, {required bool filled}) {
    return Padding(
      padding:
          const EdgeInsets.symmetric(horizontal: AppSpace.md, vertical: 12),
      child: Row(
        children: [
          Avatar(name: s.name, imageUrl: s.avatarUrl, size: 48),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(s.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.body.copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text('Organizer',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.bodySm.copyWith(color: AppColors.inkSoft)),
              ],
            ),
          ),
          const SizedBox(width: 10),
          _pill(
            label: 'Follow',
            filled: filled,
            onTap: () => _followSuggestion(s),
          ),
        ],
      ),
    );
  }

  Widget _pill({
    required String label,
    required bool filled,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 34,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: filled ? AppColors.forest : AppColors.forestSoft,
          borderRadius: BorderRadius.circular(999),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: AppText.bodySm.copyWith(
            color: filled ? AppColors.surface : AppColors.forest,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}

// ─── model ──────────────────────────────────────────────────────────────────

class _Follow {
  final String id; // organizer_follows row id
  final String organizerId;
  final String name;
  final String? avatarUrl;
  bool notify;

  _Follow({
    required this.id,
    required this.organizerId,
    required this.name,
    required this.avatarUrl,
    required this.notify,
  });

  factory _Follow.fromRow(Map<String, dynamic> r) {
    final p = r['profiles'];
    final prof = (p is Map) ? Map<String, dynamic>.from(p) : <String, dynamic>{};
    var name = asString(prof['full_name']).trim();
    if (name.isEmpty) name = asString(prof['email']).trim();
    if (name.isEmpty) name = 'Organizer';
    return _Follow(
      id: asString(r['id']),
      organizerId: asString(r['organizer_id']),
      name: name,
      avatarUrl: prof['avatar_url'] == null
          ? null
          : asString(prof['avatar_url']),
      notify: asBool(r['notify_new_events']),
    );
  }
}

class _Suggestion {
  final String organizerId;
  final String name;
  final String? avatarUrl;

  _Suggestion({
    required this.organizerId,
    required this.name,
    required this.avatarUrl,
  });

  /// Builds a suggestion from a `profiles` row. Returns null if it has no id.
  static _Suggestion? fromProfile(Map<String, dynamic> r) {
    final organizerId = asString(r['id']).trim();
    if (organizerId.isEmpty) return null;
    var name = asString(r['full_name']).trim();
    if (name.isEmpty) name = asString(r['email']).trim();
    if (name.isEmpty) name = 'Organizer';
    return _Suggestion(
      organizerId: organizerId,
      name: name,
      avatarUrl: r['avatar_url'] == null ? null : asString(r['avatar_url']),
    );
  }
}

// ─── local widgets ──────────────────────────────────────────────────────────

class _SignInPrompt extends StatelessWidget {
  final String message;
  final VoidCallback? onSignInTap;
  const _SignInPrompt({required this.message, this.onSignInTap});
  @override
  Widget build(BuildContext context) {
    return EmptyState(
      icon: Icons.lock_outline,
      title: 'Sign in required',
      message: message,
      ctaLabel: onSignInTap != null ? 'Sign in' : null,
      onCta: onSignInTap,
    );
  }
}