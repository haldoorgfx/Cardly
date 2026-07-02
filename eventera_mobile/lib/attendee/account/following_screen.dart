import 'package:flutter/material.dart';

import '../../net.dart';
import '../../theme.dart';

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
    if (isSignedIn) _load();
    else _loading = false;
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
      setState(() {
        _items = asMapList(rows).map(_Follow.fromRow).toList();
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
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Unfollowed ${f.name}')));
    } catch (_) {
      if (!mounted) return;
      setState(() => _items.insert(index.clamp(0, _items.length), f));
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not unfollow')),
      );
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
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not update notifications')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Brand.cream,
      appBar: AppBar(
        backgroundColor: Brand.cream,
        foregroundColor: Brand.forest,
        elevation: 0,
        title: const Text('Following', style: TextStyle(color: Brand.forest)),
      ),
      body: !isSignedIn
          ? _SignInPrompt(
              message: 'Sign in to see the organizers you follow.',
              onSignInTap: widget.onSignInTap)
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
    if (_items.isEmpty) {
      return ListView(
        children: const [
          SizedBox(height: 120),
          _EmptyState(
            icon: Icons.person_search_outlined,
            message: 'You\'re not following any organizers yet.',
          ),
        ],
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 40),
      itemCount: _items.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, i) => _tile(_items[i]),
    );
  }

  Widget _tile(_Follow f) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Brand.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Brand.border),
      ),
      child: Row(
        children: [
          _Avatar(url: f.avatarUrl, name: f.name, size: 48),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(f.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: Brand.ink)),
                const SizedBox(height: 4),
                GestureDetector(
                  onTap: () => _toggleNotify(f),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                          f.notify
                              ? Icons.notifications_active_outlined
                              : Icons.notifications_off_outlined,
                          size: 15,
                          color: f.notify ? Brand.forest : Brand.muted),
                      const SizedBox(width: 5),
                      Text(
                        f.notify ? 'New events on' : 'New events off',
                        style: TextStyle(
                            fontSize: 12,
                            color: f.notify ? Brand.forest : Brand.muted),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          OutlinedButton(
            style: OutlinedButton.styleFrom(
              foregroundColor: Brand.inkSoft,
              side: const BorderSide(color: Brand.border),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(999)),
            ),
            onPressed: () => _unfollow(f),
            child: const Text('Following', style: TextStyle(fontSize: 13)),
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
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.lock_outline, color: Brand.forest, size: 44),
            const SizedBox(height: 14),
            const Text('Sign in required',
                style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Brand.ink)),
            const SizedBox(height: 8),
            Text(message,
                textAlign: TextAlign.center,
                style:
                    const TextStyle(fontSize: 14, height: 1.5, color: Brand.inkSoft)),
            if (onSignInTap != null) ...[
              const SizedBox(height: 20),
              FilledButton(onPressed: onSignInTap, child: const Text('Sign in')),
            ],
          ],
        ),
      ),
    );
  }
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
  }
}
