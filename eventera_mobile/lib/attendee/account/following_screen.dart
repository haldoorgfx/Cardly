import 'package:flutter/material.dart';

import '../../net.dart';
import '../../ui/tokens.dart';
import '../../ui/components.dart';

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
    if (_items.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: const [
          SizedBox(height: 100),
          EmptyState(
            icon: Icons.person_search_outlined,
            title: 'Not following anyone',
            message: 'You\'re not following any organizers yet.',
          ),
        ],
      );
    }
    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(AppSpace.lg, AppSpace.xs, AppSpace.lg, 40),
      itemCount: _items.length,
      separatorBuilder: (_, __) =>
          const Divider(height: 1, thickness: 1, color: AppColors.border),
      itemBuilder: (context, i) => _tile(_items[i]),
    );
  }

  Widget _tile(_Follow f) {
    return ListRow(
      leading: Avatar(name: f.name, imageUrl: f.avatarUrl, size: 48),
      title: Text(f.name, maxLines: 1, overflow: TextOverflow.ellipsis),
      subtitle: Text(f.notify ? 'New-event alerts on' : 'New-event alerts off'),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          MToggle(value: f.notify, onChanged: (_) => _toggleNotify(f)),
          const SizedBox(width: 12),
          GestureDetector(
            onTap: () => _unfollow(f),
            child: Container(
              height: 34,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              decoration: BoxDecoration(
                color: AppColors.forestSoft,
                borderRadius: BorderRadius.circular(999),
              ),
              alignment: Alignment.center,
              child: Text('Following',
                  style: AppText.bodySm.copyWith(
                      color: AppColors.forest, fontWeight: FontWeight.w600)),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── model ──────────────────────────────────────────────────────────────────

class _Follow {
  final String id; // organizer_follows row id
  final String name;
  final String? avatarUrl;
  bool notify;

  _Follow({
    required this.id,
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
      name: name,
      avatarUrl: prof['avatar_url'] == null
          ? null
          : asString(prof['avatar_url']),
      notify: asBool(r['notify_new_events']),
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
