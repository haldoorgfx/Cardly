// SPO06 · Lead detail — full contact, rating, note, capture stamp.
// Fetches the full `sponsor_leads` row (name, company, role, email, rating,
// note, captured_at) by id via SponsorApi and offers email / copy actions.

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../ui/tokens.dart';
import '../../ui/components.dart';
import 'sponsor_api.dart';

class LeadDetailScreen extends StatefulWidget {
  final String leadId;
  final String boothName;
  const LeadDetailScreen({
    super.key,
    required this.leadId,
    required this.boothName,
  });

  @override
  State<LeadDetailScreen> createState() => _LeadDetailScreenState();
}

class _LeadDetailScreenState extends State<LeadDetailScreen> {
  late Future<Map<String, dynamic>?> _future;

  @override
  void initState() {
    super.initState();
    _future = SponsorApi.fetchLead(widget.leadId);
  }

  void _reload() =>
      setState(() => _future = SponsorApi.fetchLead(widget.leadId));

  Color _rc(String rating) => rating == 'hot'
      ? AppColors.danger
      : rating == 'warm'
          ? AppColors.warning
          : AppColors.forest;

  Future<void> _openEmail(String email) async {
    final ok =
        await launchUrl(Uri(scheme: 'mailto', path: email));
    if (!ok && mounted) showToast(context, "Couldn't open your mail app.");
  }

  Future<void> _copy(String label, String value) async {
    await Clipboard.setData(ClipboardData(text: value));
    if (mounted) showToast(context, '$label copied.');
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: MAppBar(title: 'Lead'),
      body: FutureBuilder<Map<String, dynamic>?>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const LoadingState();
          }
          if (snap.hasError) {
            return ErrorStateView(
              message: "We couldn't load this lead. Try again.",
              onRetry: _reload,
            );
          }
          final m = snap.data;
          if (m == null) {
            return const EmptyState(
              icon: Icons.person_off_outlined,
              title: 'Lead not found',
              message: 'This lead may have been removed.',
            );
          }
          final name = (m['attendee_name'] ?? 'Lead').toString();
          final email = (m['attendee_email'] ?? '').toString();
          final company = (m['company'] ?? '').toString();
          final role = (m['role'] ?? '').toString();
          final rating = (m['rating'] ?? '').toString();
          final note = (m['note'] ?? '').toString();
          final at = m['captured_at'] != null
              ? DateTime.tryParse(m['captured_at'].toString())
              : (m['created_at'] != null
                  ? DateTime.tryParse(m['created_at'].toString())
                  : null);
          // `consent` is only present once migration 077 is live (see
          // SponsorApi._withConsentFallback) — treat its absence as "unknown",
          // never as "consent given". Only an explicit `true` may claim consent.
          final consent = m['consent'] == true;
          final subtitle = [
            if (role.isNotEmpty) role,
            if (company.isNotEmpty) company,
          ].join(' · ');

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name,
                            style: const TextStyle(
                                color: AppColors.ink,
                                fontSize: 22,
                                fontWeight: FontWeight.w700)),
                        if (subtitle.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(subtitle,
                              style: const TextStyle(
                                  color: AppColors.inkSoft, fontSize: 13.5)),
                        ],
                      ],
                    ),
                  ),
                  if (rating.isNotEmpty)
                    Container(
                      margin: const EdgeInsets.only(left: 10),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                          color: _rc(rating).withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(999)),
                      child: Text(rating,
                          style: TextStyle(
                              color: _rc(rating),
                              fontSize: 12,
                              fontWeight: FontWeight.w700)),
                    ),
                ],
              ),
              const SizedBox(height: 20),
              if (email.isNotEmpty)
                _ActionRow(
                  icon: Icons.mail_outline,
                  value: email,
                  onTap: () => _openEmail(email),
                  onLongPress: () => _copy('Email', email),
                  trailingIcon: Icons.copy_outlined,
                  onTrailing: () => _copy('Email', email),
                ),
              if (note.isNotEmpty) ...[
                const SizedBox(height: 12),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                      color: AppColors.creamSoft,
                      borderRadius: BorderRadius.circular(12)),
                  child: Text(note,
                      style: const TextStyle(
                          color: AppColors.inkSoft, fontSize: 14, height: 1.5)),
                ),
              ],
              const SizedBox(height: 20),
              Row(children: [
                Icon(
                    consent
                        ? Icons.verified_user_outlined
                        : Icons.warning_amber_outlined,
                    size: 16,
                    color: consent ? AppColors.success : AppColors.warning),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    consent
                        ? 'Consent recorded at capture — attendee agreed to be contacted by ${widget.boothName}.'
                        : 'No consent on file for this lead — confirm with the attendee before reaching out.',
                    style: const TextStyle(
                        color: AppColors.inkSoft, fontSize: 12.5, height: 1.4),
                  ),
                ),
              ]),
              const SizedBox(height: 12),
              Text(
                'Captured at ${widget.boothName}${at != null ? ' · ${_stamp(at)}' : ''}',
                style: const TextStyle(color: AppColors.inkMuted, fontSize: 12.5),
              ),
              const SizedBox(height: 16),
              if (email.isNotEmpty)
                MButton('Email lead',
                    icon: Icons.mail_outline, onTap: () => _openEmail(email)),
            ],
          );
        },
      ),
    );
  }

  static String _stamp(DateTime at) {
    final l = at.toLocal();
    return '${l.month}/${l.day} ${l.hour}:${l.minute.toString().padLeft(2, '0')}';
  }
}

class _ActionRow extends StatelessWidget {
  final IconData icon;
  final String value;
  final VoidCallback onTap;
  final VoidCallback? onLongPress;
  final IconData trailingIcon;
  final VoidCallback onTrailing;
  const _ActionRow({
    required this.icon,
    required this.value,
    required this.onTap,
    required this.trailingIcon,
    required this.onTrailing,
    this.onLongPress,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      onLongPress: onLongPress,
      borderRadius: BorderRadius.circular(10),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Row(children: [
          Icon(icon, size: 18, color: AppColors.forest),
          const SizedBox(width: 12),
          Expanded(
            child: Text(value,
                style: const TextStyle(color: AppColors.ink, fontSize: 14.5)),
          ),
          IconButton(
            onPressed: onTrailing,
            icon: Icon(trailingIcon, size: 18, color: AppColors.inkMuted),
            constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
            splashRadius: 22,
          ),
        ]),
      ),
    );
  }
}
