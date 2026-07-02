import 'package:flutter/material.dart';

import '../screens/my_cards_screen.dart';
import '../ui/tokens.dart';
import 'account/attendee_account_tab.dart';
import 'discovery/discover_screen.dart';
import 'tickets/my_tickets_screen.dart';

/// App-level navigation: 4 bottom tabs (Discover · Tickets · Cards · Account).
class MainShell extends StatefulWidget {
  final int initialIndex;
  const MainShell({super.key, this.initialIndex = 0});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  late int _index = widget.initialIndex;

  final _pages = const [
    DiscoverScreen(),
    MyTicketsScreen(),
    MyCardsScreen(),
    AttendeeAccountTab(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: IndexedStack(index: _index, children: _pages),
      bottomNavigationBar: _TabBar(
        index: _index,
        onTap: (i) => setState(() => _index = i),
      ),
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
