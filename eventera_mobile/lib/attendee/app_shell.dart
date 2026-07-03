import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

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

  final _pages = const [
    DiscoverScreen(),
    MyTicketsScreen(),
    MyCardsScreen(),
    AttendeeAccountTab(),
  ];

  @override
  void initState() {
    super.initState();
    _index = widget.initialIndex;
    mainTab.value = _index;
    mainTab.addListener(_onTabRequested);
  }

  void _onTabRequested() {
    if (mounted && mainTab.value != _index) {
      setState(() => _index = mainTab.value);
    }
  }

  @override
  void dispose() {
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
    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: IndexedStack(index: _index, children: _pages),
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
