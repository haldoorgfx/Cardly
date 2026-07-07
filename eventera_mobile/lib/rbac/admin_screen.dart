import 'package:flutter/material.dart';

import '../ui/components.dart';

/// "Admin" — shown only when `platform_role in ('admin','super_admin')`.
///
/// The mobile app has no platform-admin surface yet; the admin tools
/// (user/event moderation, platform stats) live on the web at `app/admin/*`.
/// This is an honest placeholder that explains where to manage — not a dead
/// stub — so the row still means something when it appears.
class AdminScreen extends StatelessWidget {
  const AdminScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const MScaffold(
      appBar: MAppBar(title: 'Admin'),
      body: EmptyState(
        icon: Icons.shield_outlined,
        title: 'Admin tools are on the web',
        message:
            'Platform moderation, users and settings live on the Eventera web '
            'dashboard. Open it in your browser to manage the platform.',
      ),
    );
  }
}
