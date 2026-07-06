// Sponsor tools entry — opened from the event hub when the user holds the sponsor
// role at this event. Resolves the user's sponsor booth, then shows the tool cards
// (lead scanner, my leads, booth team). DRAFT — verify via `flutter analyze`.

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../ui/tokens.dart';
import '../../ui/components.dart';
import '../role_widgets.dart';
import 'lead_scanner_screen.dart';
import 'my_leads_screen.dart';
import 'booth_team_screen.dart';
import '../exhibitor/booth_products_screen.dart';
import '../exhibitor/meeting_requests_screen.dart';
import '../exhibitor/directory_preview_screen.dart';

class SponsorToolsScreen extends StatefulWidget {
  final String eventId;
  final String eventName;
  const SponsorToolsScreen({super.key, required this.eventId, required this.eventName});

  @override
  State<SponsorToolsScreen> createState() => _SponsorToolsScreenState();
}

class _SponsorToolsScreenState extends State<SponsorToolsScreen> {
  late Future<Map<String, dynamic>?> _future;

  @override
  void initState() {
    super.initState();
    _future = _resolveBooth();
  }

  Future<Map<String, dynamic>?> _resolveBooth() async {
    final email =
        Supabase.instance.client.auth.currentUser?.email?.toLowerCase() ?? '';
    // Sponsors are publicly readable; find the one where this account is the contact.
    final rows = await Supabase.instance.client
        .from('sponsors')
        .select('id, company_name, tier, contact_email')
        .eq('event_id', widget.eventId);
    for (final r in (rows as List)) {
      final m = Map<String, dynamic>.from(r as Map);
      if ((m['contact_email'] ?? '').toString().toLowerCase() == email) return m;
    }
    // Fallback: first sponsor at the event (covers booth-team members).
    if ((rows).isNotEmpty) return Map<String, dynamic>.from(rows.first as Map);
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: MAppBar(title: 'Sponsor tools'),
      body: FutureBuilder<Map<String, dynamic>?>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: AppColors.forest));
          }
          final booth = snap.data;
          if (booth == null) {
            return const EmptyState(
              icon: Icons.business_outlined,
              title: 'Booth not found',
              message: 'Your sponsor booth for this event could not be loaded.',
            );
          }
          final sponsorId = (booth['id'] ?? '').toString();
          final name = (booth['company_name'] ?? 'Your booth').toString();
          final tier = (booth['tier'] ?? '').toString();
          return ListView(
            children: [
              RoleBar(
                icon: Icons.workspace_premium_outlined,
                eventName: widget.eventName,
                roleLine: tier.isNotEmpty ? 'Sponsor · $tier' : 'Sponsor',
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    ToolCard(
                      icon: Icons.qr_code_scanner,
                      title: 'Lead scanner',
                      summary: 'Scan attendee QRs to capture leads',
                      onTap: () => Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => LeadScannerScreen(sponsorId: sponsorId, boothName: name))),
                    ),
                    const SizedBox(height: 10),
                    ToolCard(
                      icon: Icons.contacts_outlined,
                      title: 'My leads',
                      summary: 'Everyone you\'ve captured, hot / warm / cold',
                      onTap: () => Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => MyLeadsScreen(sponsorId: sponsorId, boothName: name))),
                    ),
                    const SizedBox(height: 10),
                    ToolCard(
                      icon: Icons.group_outlined,
                      title: 'Booth team',
                      summary: 'Teammates + scan access',
                      onTap: () => Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => BoothTeamScreen(sponsorId: sponsorId))),
                    ),
                    const SizedBox(height: 10),
                    ToolCard(
                      icon: Icons.inventory_2_outlined,
                      title: 'Booth & products',
                      summary: 'Your booth info and product showcase',
                      onTap: () => Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => BoothProductsScreen(
                              sponsorId: sponsorId, eventId: widget.eventId,
                              eventName: widget.eventName, boothName: name))),
                    ),
                    const SizedBox(height: 10),
                    ToolCard(
                      icon: Icons.event_outlined,
                      title: 'Meetings',
                      summary: 'Attendee meeting requests',
                      onTap: () => Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => MeetingRequestsScreen(
                              sponsorId: sponsorId, eventName: widget.eventName))),
                    ),
                    const SizedBox(height: 10),
                    ToolCard(
                      icon: Icons.storefront_outlined,
                      title: 'Directory preview',
                      summary: 'How attendees see your booth',
                      onTap: () => Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => DirectoryPreviewScreen(
                              sponsorId: sponsorId, boothName: name))),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
