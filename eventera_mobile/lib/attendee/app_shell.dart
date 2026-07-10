import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../net.dart';
import '../screens/my_cards_screen.dart';
import '../ui/tokens.dart';
import 'account/attendee_account_tab.dart';
import 'discovery/discover_screen.dart';
import 'tickets/my_tickets_screen.dart';

/// Lets any screen jump the bottom tabs (e.g. the Discover header avatar →
/// Account). 0 Discover · 1 Tickets · 2 Cards · 3 Account.
final ValueNotifier<int> mainTab = ValueNotifier<int>(0);

/// App-level navigation: 4 bottom tabs (Discover · Tickets · Cards · Account).
class MainShell extends StatefulWidget {
  final int initialIndex;
  const MainShell({super.key, this.initialIndex = 0});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;

  // Bumped whenever the signed-in user changes (sign-in / sign-out). The
  // auth-gated tabs are keyed on this so they rebuild immediately instead of
  // staying stuck on a stale "you're not signed in" state until a manual
  // refresh. Discover (tab 0) works signed-out, so it keeps its state.
  int _authVersion = 0;
  String? _uid;
  StreamSubscription<AuthState>? _authSub;

  @override
  void initState() {
    super.initState();
    _index = widget.initialIndex;
    _uid = currentUserId;
    mainTab.value = _index;
    mainTab.addListener(_onTabRequested);
    _authSub = supa.auth.onAuthStateChange.listen((data) {
      final newUid = data.session?.user.id;
      if (newUid != _uid && mounted) {
        setState(() {
          _uid = newUid;
          _authVersion++;
        });
      }
    });
  }

  void _onTabRequested() {
    if (mounted && mainTab.value != _index) {
      setState(() => _index = mainTab.value);
    }
  }

  @override
  void dispose() {
    _authSub?.cancel();
    mainTab.removeListener(_onTabRequested);
    super.dispose();
  }

  void _select(int i) {
    if (i != _index) HapticFeedback.selectionClick();
    mainTab.value = i;
    setState(() => _index = i);
  }

  @override
  Widget build(BuildContext context) {
    // The three auth-gated tabs re-key on auth changes so they refresh the
    // moment the user signs in or out — no manual pull-to-refresh needed.
    final pages = [
      const DiscoverScreen(),
      MyTicketsScreen(key: ValueKey('tickets-$_authVersion')),
      MyCardsScreen(key: ValueKey('cards-$_authVersion')),
      AttendeeAccountTab(key: ValueKey('account-$_authVersion')),
    ];
    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: IndexedStack(index: _index, children: pages),
      bottomNavigationBar: _TabBar(index: _index, onTap: _select),
    );
  }
}

class _TabBar extends StatelessWidget {
  final int index;
  final ValueChanged<int> onTap;
  const _TabBar({required this.index, required this.onTap});

  static const _items = [
    (Icons.explore_outlined, Icons.explore, 'Discover'),
    (Icons.confirmation_number_outlined, Icons.confirmation_number, 'Tickets'),
    (Icons.style_outlined, Icons.style, 'Cards'),
    (Icons.person_outline, Icons.person, 'Account'),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.border)),
        boxShadow: AppShadow.tabbar,
      ),
      padding: const EdgeInsets.fromLTRB(8, 8, 8, 8),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 56,
          child: Row(
            children: [
              for (int i = 0; i < _items.length; i++)
                Expanded(
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () => onTap(i),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          i == index ? _items[i].$2 : _items[i].$1,
                          size: 24,
                          color: i == index
                              ? AppColors.forest
                              : AppColors.inkMuted,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _items[i].$3,
                          style: AppText.caption.copyWith(
                            fontSize: 10.5,
                            fontWeight:
                                i == index ? FontWeight.w600 : FontWeight.w500,
                            color: i == index
                                ? AppColors.forest
                                : AppColors.inkMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
