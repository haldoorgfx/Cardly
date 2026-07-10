import 'package:flutter/material.dart';

import '../../ui/components.dart';

/// PLACEHOLDER — the real entitlement scanner is built in parallel by another
/// agent and will overwrite this file. It exists only so the app compiles and
/// the Scan FAB has a valid destination. Do not build the scanner UI here.
class EntitlementScannerScreen extends StatelessWidget {
  final String eventId;
  final String eventName;
  const EntitlementScannerScreen({
    super.key,
    required this.eventId,
    required this.eventName,
  });

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: MAppBar(title: eventName),
      body: const EmptyState(
        icon: Icons.qr_code_scanner,
        title: 'Scanner loading',
        message: 'The entitlement scanner is being set up for this event.',
      ),
    );
  }
}
