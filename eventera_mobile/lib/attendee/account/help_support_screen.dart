import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../app_config.dart';
import '../../ui/components.dart';
import '../../ui/menu.dart';
import '../../ui/tokens.dart';

/// Help & Support — a real, self-contained screen (replaces the old
/// "coming soon" toast). Shows a short in-app FAQ plus two contact actions:
/// email support and the web Help Center. Everything fails SAFE — if a link
/// can't be opened we show a quiet toast instead of crashing.
class HelpSupportScreen extends StatelessWidget {
  const HelpSupportScreen({super.key});

  // Canonical support address (matches the web app).
  static const String _supportEmail = 'hello@cre8so.com';

  // A handful of common questions, kept short and answerable in-app so the
  // screen is useful offline / without opening a browser.
  static const List<(String, String)> _faqs = [
    (
      'Where are my tickets and cards?',
      'Open the Account tab. "My tickets" holds every event you have '
          'registered for, and "My cards" holds the Eventera Cards generated '
          'for you. Sign in with the same email you registered with so they '
          'sync to this device.',
    ),
    (
      "I registered but don't see my ticket",
      'Tickets are tied to the email you registered with. Make sure you are '
          'signed in with that exact email, then pull down to refresh. If it '
          'still does not appear, email us and we will find it.',
    ),
    (
      'How do I make my Eventera Card?',
      'Open the event, tap "Make your card", add your photo and details, then '
          'save it. Your card also appears under "My cards" in your Account.',
    ),
    (
      "Why is an event page not opening?",
      'Some events are still being set up by their organizer and are not '
          'public yet. They will open here as soon as the organizer publishes '
          'the event page.',
    ),
    (
      'How do I manage an event I organize?',
      'Organizing, speaker and sponsor tools live on the web dashboard. Open '
          'Eventera in your browser and sign in with the same account.',
    ),
  ];

  Future<void> _emailSupport(BuildContext context) async {
    final uri = Uri(
      scheme: 'mailto',
      path: _supportEmail,
      query: 'subject=${Uri.encodeComponent('Eventera app support')}',
    );
    await _open(context, uri, 'Could not open your email app.');
  }

  Future<void> _openHelpCenter(BuildContext context) async {
    // Domain comes from AppConfig (the live web app) — never hardcoded here.
    final uri = Uri.parse('${AppConfig.renderBaseUrl}/help');
    await _open(context, uri, 'Could not open the Help Center.');
  }

  Future<void> _open(
      BuildContext context, Uri uri, String failMessage) async {
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
        return;
      }
    } catch (_) {
      // fall through to the toast
    }
    if (context.mounted) showToast(context, failMessage);
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: const MAppBar(title: 'Help & support'),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 36),
        children: [
          const GroupLabel('Contact us'),
          MenuGroup(children: [
            MenuRow(
              icon: Icons.mail_outline,
              tone: ITone.forest,
              title: 'Email support',
              subtitle: _supportEmail,
              onTap: () => _emailSupport(context),
            ),
            MenuRow(
              icon: Icons.help_center_outlined,
              tone: ITone.gold,
              title: 'Help Center',
              subtitle: 'Guides and answers on the web',
              onTap: () => _openHelpCenter(context),
            ),
          ]),
          const SizedBox(height: 26),
          const GroupLabel('Frequently asked'),
          for (var i = 0; i < _faqs.length; i++) ...[
            _FaqTile(question: _faqs[i].$1, answer: _faqs[i].$2),
            if (i != _faqs.length - 1) const SizedBox(height: 10),
          ],
          const SizedBox(height: 28),
          Center(
            child: Text('Eventera · v1.0.0',
                style: AppText.caption.copyWith(color: AppColors.inkMuted)),
          ),
        ],
      ),
    );
  }
}

/// A single expandable FAQ card — tap to reveal the answer. Uses only theme
/// tokens so it matches the rest of the account area.
class _FaqTile extends StatefulWidget {
  final String question;
  final String answer;
  const _FaqTile({required this.question, required this.answer});

  @override
  State<_FaqTile> createState() => _FaqTileState();
}

class _FaqTileState extends State<_FaqTile> {
  bool _open = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.border),
        boxShadow: AppShadow.soft,
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => setState(() => _open = !_open),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(widget.question,
                        style: AppText.h3.copyWith(fontSize: 14.5)),
                  ),
                  const SizedBox(width: 10),
                  Icon(
                    _open ? Icons.remove : Icons.add,
                    size: 18,
                    color: AppColors.inkMuted,
                  ),
                ],
              ),
              if (_open) ...[
                const SizedBox(height: 8),
                Text(widget.answer,
                    style:
                        AppText.bodySm.copyWith(color: AppColors.inkSoft)),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
