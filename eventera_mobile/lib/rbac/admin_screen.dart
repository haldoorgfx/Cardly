import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../app_config.dart';
import '../ui/components.dart';

/// "Admin" — shown only when `platform_role in ('admin','super_admin')`.
///
/// The mobile app has no platform-admin surface yet; the admin tools
/// (user/event moderation, platform stats) live on the web at `app/admin/*`.
/// This is an honest placeholder that explains where to manage — not a dead
/// stub — so the row still means something when it appears.
class AdminScreen extends StatelessWidget {
  const AdminScreen({super.key});

  /// Opens the web admin dashboard in the browser. Domain comes from
  /// [AppConfig] — never hardcoded here. Fails safe with a toast.
  Future<void> _openWebAdmin(BuildContext context) async {
    final uri = Uri.parse('${AppConfig.renderBaseUrl}/admin');
    try {
      if (await launchUrl(uri, mode: LaunchMode.externalApplication)) return;
    } catch (_) {
      // fall through to the toast
    }
    if (context.mounted) {
      showToast(context, 'Could not open your browser.',
          type: ToastType.error);
    }
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: const MAppBar(title: 'Admin'),
      body: EmptyState(
        icon: Icons.shield_outlined,
        title: 'Admin tools are on the web',
        message:
            'Platform moderation, users and settings live on the Eventera web '
            'dashboard. Sign in there with this same account.',
        ctaLabel: 'Open web dashboard',
        onCta: () => _openWebAdmin(context),
      ),
    );
  }
}
