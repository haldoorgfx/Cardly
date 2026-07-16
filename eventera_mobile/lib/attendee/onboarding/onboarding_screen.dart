import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart' show FileOptions;

import '../../net.dart';
import '../../ui/tokens.dart';
import '../../ui/components.dart';
import '../../ui/menu.dart';

/// First-run onboarding wizard shown right after signup.
///
/// A short, skippable 6-step flow. Only the full name is required. On finish,
/// skip-all, or "I'll do this later" it marks `profiles.onboarding_completed`
/// = true (so it never nags again) and pops back to the app.
///
/// Writes to `profiles` (columns added in migration 048):
///   full_name, avatar_url, city, phone, job_title, organization, industry,
///   role_types text[], interests text[], goals text[], directory_visible bool,
///   open_to_connect bool, linkedin_url, x_url, dietary text[] (PRIVATE),
///   accessibility text[] (PRIVATE), onboarding_notes, onboarding_completed bool.
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  // -1 = intro, 0..5 = the six steps, 6 = "all set" summary.
  int _page = -1;
  bool _finishing = false;
  bool _uploadingAvatar = false;

  // ── Step 1 · basics ─────────────────────────────────────────────────────
  final _nameCtl = TextEditingController();
  final _cityCtl = TextEditingController();
  final _phoneCtl = TextEditingController();
  String? _avatarUrl;

  // ── Step 2 · work ───────────────────────────────────────────────────────
  final _jobCtl = TextEditingController();
  final _companyCtl = TextEditingController();
  String? _industry;
  final Set<String> _roles = {};

  // ── Step 3 · interests ──────────────────────────────────────────────────
  final Set<String> _interests = {};

  // ── Step 4 · goals ──────────────────────────────────────────────────────
  final Set<String> _goals = {};

  // ── Step 5 · networking ─────────────────────────────────────────────────
  bool _directoryVisible = true;
  bool _openToConnect = true;
  final _linkedinCtl = TextEditingController();
  final _xCtl = TextEditingController();

  // ── Step 6 · dietary & access (PRIVATE) ─────────────────────────────────
  final Set<String> _dietary = {};
  final Set<String> _accessibility = {};
  final _notesCtl = TextEditingController();

  static const _industries = <String>[
    'Fintech & payments',
    'AI & software',
    'Design & creative',
    'Healthcare',
    'Education',
    'Climate & energy',
    'Media & entertainment',
    'Retail & e-commerce',
    'Manufacturing & hardware',
    'Agritech',
    'Mobility & logistics',
    'Other',
  ];
  static const _roleOptions = <String>[
    'Founder', 'Operator', 'Investor', 'Engineer', 'Designer', 'Student',
  ];
  static const _interestOptions = <String>[
    'Fintech', 'Startups', 'AI & ML', 'Product design', 'Climate', 'Payments',
    'Web3', 'Marketing', 'Devtools', 'Healthcare', 'Creative & media',
    'Hardware', 'Education', 'Gaming', 'Mobility', 'Agritech',
  ];
  static const _dietaryOptions = <String>[
    'No preference', 'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-free',
    'Nut allergy',
  ];
  static const _accessibilityOptions = <String>[
    'Step-free access', 'Reserved seating', 'Sign language', 'Large print',
  ];

  @override
  void dispose() {
    _nameCtl.dispose();
    _cityCtl.dispose();
    _phoneCtl.dispose();
    _jobCtl.dispose();
    _companyCtl.dispose();
    _linkedinCtl.dispose();
    _xCtl.dispose();
    _notesCtl.dispose();
    super.dispose();
  }

  // ── Navigation ──────────────────────────────────────────────────────────

  void _next() {
    // Step 1 (basics) requires a name.
    if (_page == 0 && _nameCtl.text.trim().isEmpty) {
      showToast(context, 'Please add your name to continue.');
      return;
    }
    if (_page >= 5) {
      _finish();
      return;
    }
    setState(() => _page = _page + 1);
  }

  void _back() {
    if (_page <= -1) {
      Navigator.of(context).maybePop();
      return;
    }
    setState(() => _page = _page - 1);
  }

  /// Skip advances without requiring input. On the last step it finishes.
  void _skip() {
    if (_page >= 5) {
      _finish();
      return;
    }
    setState(() => _page = _page + 1);
  }

  // ── Persistence ─────────────────────────────────────────────────────────

  Map<String, dynamic> _collect() {
    String? t(TextEditingController c) =>
        c.text.trim().isEmpty ? null : c.text.trim();
    return {
      'full_name': _nameCtl.text.trim().isEmpty ? null : _nameCtl.text.trim(),
      'avatar_url': _avatarUrl,
      'city': t(_cityCtl),
      'phone': t(_phoneCtl),
      'job_title': t(_jobCtl),
      'organization': t(_companyCtl),
      'industry': _industry,
      'role_types': _roles.toList(),
      'interests': _interests.toList(),
      'goals': _goals.toList(),
      'directory_visible': _directoryVisible,
      'open_to_connect': _openToConnect,
      'linkedin_url': t(_linkedinCtl),
      'x_url': t(_xCtl),
      'dietary': _dietary.toList(),
      'accessibility': _accessibility.toList(),
      'onboarding_notes': t(_notesCtl),
    };
  }

  /// Persist and mark onboarding complete, then leave. Used by finish,
  /// skip-all, and "I'll do this later". [full] = true writes all fields;
  /// otherwise only the completion flag (so an immediate bail-out is cheap).
  Future<void> _complete({bool full = true}) async {
    if (_finishing) return;
    setState(() => _finishing = true);
    try {
      if (isSignedIn && currentUserId != null) {
        final patch = <String, dynamic>{'onboarding_completed': true};
        if (full) patch.addAll(_collect());
        await supa
            .from('profiles')
            .update(patch)
            .eq('id', currentUserId ?? '');
      }
    } catch (_) {
      // Never trap the user in onboarding on a network hiccup — let them out.
    }
    if (!mounted) return;
    setState(() => _finishing = false);
    Navigator.of(context).popUntil((r) => r.isFirst);
  }

  Future<void> _finish() async {
    // Show the "all set" summary first, then Finish saves everything.
    setState(() => _page = 6);
  }

  Future<void> _changeAvatar() async {
    if (_uploadingAvatar) return;
    if (!isSignedIn || currentUserId == null) {
      showToast(context, 'Sign in to add a photo.');
      return;
    }
    try {
      final picked = await ImagePicker().pickImage(
        source: ImageSource.gallery,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 85,
      );
      if (picked == null) return;
      final bytes = await picked.readAsBytes();
      if (!mounted) return;
      setState(() => _uploadingAvatar = true);

      final path = 'avatars/$currentUserId.jpg';
      await supa.storage.from('uploads').uploadBinary(
            path,
            bytes,
            fileOptions:
                const FileOptions(upsert: true, contentType: 'image/jpeg'),
          );
      final url = supa.storage.from('uploads').getPublicUrl(path);
      if (!mounted) return;
      setState(() {
        _avatarUrl = url;
        _uploadingAvatar = false;
      });
      showToast(context, 'Photo added');
    } catch (_) {
      if (!mounted) return;
      setState(() => _uploadingAvatar = false);
      showToast(context, 'Could not upload your photo');
    }
  }

  // ── Build ───────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    if (_page == -1) return _buildIntro();
    if (_page == 6) return _buildAllSet();

    final steps = <Widget>[
      _stepBasics(),
      _stepWork(),
      _stepInterests(),
      _stepGoals(),
      _stepNetworking(),
      _stepDietary(),
    ];
    final ctaLabel = _page == 5 ? 'Finish setup' : 'Continue';

    return MScaffold(
      background: AppColors.canvas,
      bottomBar: StickyCta(children: [
        Expanded(child: MButton(ctaLabel, onTap: _next)),
      ]),
      body: Column(
        children: [
          _obTop(),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(
                  AppSpace.lg, 12, AppSpace.lg, 16),
              child: steps[_page],
            ),
          ),
        ],
      ),
    );
  }

  /// Top scaffold: back arrow, "Step N of 6" (numSm, NOT mono), Skip, and a
  /// segmented progress bar.
  Widget _obTop() {
    final topInset = MediaQuery.of(context).padding.top;
    return Container(
      color: AppColors.canvas,
      padding: EdgeInsets.only(
          top: topInset + 6, left: AppSpace.lg, right: AppSpace.lg, bottom: 14),
      child: Column(
        children: [
          Row(
            children: [
              GestureDetector(
                onTap: _back,
                behavior: HitTestBehavior.opaque,
                child: const SizedBox(
                  width: 34,
                  height: 34,
                  child: Icon(Icons.arrow_back, size: 22, color: AppColors.ink),
                ),
              ),
              Expanded(
                child: Center(
                  child: Text('Step ${_page + 1} of 6', style: AppText.numSm),
                ),
              ),
              GestureDetector(
                onTap: _skip,
                behavior: HitTestBehavior.opaque,
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 6, vertical: 8),
                  child: Text('Skip',
                      style: AppText.label.copyWith(color: AppColors.inkMuted)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              for (int i = 0; i < 6; i++) ...[
                if (i > 0) const SizedBox(width: 6),
                Expanded(
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 220),
                    height: 5,
                    decoration: BoxDecoration(
                      color: i <= _page ? AppColors.forest : AppColors.border,
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _stepHeader(String title, String sub) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: AppText.h2),
        const SizedBox(height: 6),
        Text(sub,
            style: AppText.bodySm.copyWith(color: AppColors.inkMuted)),
      ],
    );
  }

  // ── Intro ───────────────────────────────────────────────────────────────

  Widget _buildIntro() {
    return MScaffold(
      background: AppColors.canvas,
      bottomBar: StickyCta(children: [
        Expanded(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              MButton('Get started',
                  loading: _finishing,
                  onTap: () => setState(() => _page = 0)),
              const SizedBox(height: 6),
              MButton('I\'ll do this later',
                  kind: MBtnKind.text,
                  onTap: _finishing ? null : () => _complete(full: false)),
            ],
          ),
        ),
      ]),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(AppSpace.lg, 24, AppSpace.lg, 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Align(
              alignment: Alignment.centerLeft,
              child: Tag('Takes about a minute', kind: TagKind.gold),
            ),
            const SizedBox(height: 18),
            Text('Let\'s make Eventera yours', style: AppText.h1),
            const SizedBox(height: 10),
            Text(
              'A few quick questions help us tailor what you see — and help '
              'organizers host you well.',
              style: AppText.body,
            ),
            const SizedBox(height: 26),
            _payoff(
              Icons.badge_outlined,
              ITone.forest,
              'A card that\'s really you',
              'Your name, role and photo power your attending card.',
            ),
            const SizedBox(height: 16),
            _payoff(
              Icons.groups_outlined,
              ITone.gold,
              'Meet the right people',
              'Interests and goals drive your networking matches.',
            ),
            const SizedBox(height: 16),
            _payoff(
              Icons.event_available_outlined,
              ITone.info,
              'A smoother event',
              'Dietary & access needs reach the organizer, privately.',
            ),
            const SizedBox(height: 26),
            _whyNote(
              'You\'re always in control. Everything here is optional except '
              'your name, and editable anytime in Profile.',
            ),
          ],
        ),
      ),
    );
  }

  Widget _payoff(IconData icon, ITone tone, String title, String body) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        IconTile(icon, tone: tone),
        const SizedBox(width: 13),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: AppText.h3.copyWith(fontSize: 15)),
              const SizedBox(height: 2),
              Text(body,
                  style: AppText.bodySm
                      .copyWith(fontSize: 13, color: AppColors.inkMuted)),
            ],
          ),
        ),
      ],
    );
  }

  // ── Step 1 · basics ─────────────────────────────────────────────────────

  Widget _stepBasics() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _stepHeader('The basics', 'This appears on your attending card.'),
        const SizedBox(height: 24),
        Center(
          child: Column(
            children: [
              GestureDetector(
                onTap: _uploadingAvatar ? null : _changeAvatar,
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Container(
                      width: 84,
                      height: 84,
                      decoration: BoxDecoration(
                        color: AppColors.forestSoft,
                        shape: BoxShape.circle,
                        border: Border.all(
                            color: AppColors.borderStrong, width: 1.5),
                      ),
                      clipBehavior: Clip.antiAlias,
                      alignment: Alignment.center,
                      child: (_avatarUrl != null && _avatarUrl!.isNotEmpty)
                          ? Image.network(_avatarUrl!,
                              width: 84,
                              height: 84,
                              fit: BoxFit.cover,
                              loadingBuilder: (ctx, child, progress) =>
                                  progress == null
                                      ? child
                                      : const Icon(Icons.person_outline,
                                          size: 34, color: AppColors.forest),
                              errorBuilder: (_, __, ___) => const Icon(
                                  Icons.person_outline,
                                  size: 34,
                                  color: AppColors.forest))
                          : const Icon(Icons.person_outline,
                              size: 34, color: AppColors.forest),
                    ),
                    if (_uploadingAvatar)
                      Positioned.fill(
                        child: Container(
                          decoration: const BoxDecoration(
                              color: Color(0x66000000),
                              shape: BoxShape.circle),
                          alignment: Alignment.center,
                          child: const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                                strokeWidth: 2.5, color: Colors.white),
                          ),
                        ),
                      ),
                    Positioned(
                      bottom: -2,
                      right: -2,
                      child: Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: AppColors.forest,
                          shape: BoxShape.circle,
                          border:
                              Border.all(color: AppColors.canvas, width: 2.5),
                        ),
                        alignment: Alignment.center,
                        child: const Icon(Icons.add,
                            size: 15, color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              Text('Add a photo',
                  style: AppText.bodySm.copyWith(
                      color: AppColors.forest,
                      fontWeight: FontWeight.w600)),
            ],
          ),
        ),
        const SizedBox(height: 24),
        MInput(
          label: 'Full name',
          hint: 'Your name',
          controller: _nameCtl,
          icon: Icons.person_outline,
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 16),
        MInput(
          label: 'City',
          hint: 'Where you\'re based',
          controller: _cityCtl,
          icon: Icons.place_outlined,
        ),
        const SizedBox(height: 16),
        MInput(
          label: 'Phone (for ticket updates)',
          hint: '+000 000 0000',
          controller: _phoneCtl,
          icon: Icons.phone_outlined,
          keyboardType: TextInputType.phone,
        ),
      ],
    );
  }

  // ── Step 2 · work ───────────────────────────────────────────────────────

  Widget _stepWork() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _stepHeader('What do you do?', 'Helps people know who they\'re meeting.'),
        const SizedBox(height: 22),
        MInput(
          label: 'Job title',
          hint: 'e.g. Founder & CEO',
          controller: _jobCtl,
          icon: Icons.work_outline,
        ),
        const SizedBox(height: 16),
        MInput(
          label: 'Company / organization',
          hint: 'Where you work',
          controller: _companyCtl,
          icon: Icons.apartment_outlined,
        ),
        const SizedBox(height: 16),
        Text('Industry', style: AppText.label),
        const SizedBox(height: 7),
        _SelectField(
          value: _industry,
          placeholder: 'Choose an industry',
          onTap: _pickIndustry,
        ),
        const SizedBox(height: 20),
        Text('I\'m here as a…', style: AppText.label),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final r in _roleOptions)
              MChip(
                r,
                selected: _roles.contains(r),
                onTap: () => setState(() =>
                    _roles.contains(r) ? _roles.remove(r) : _roles.add(r)),
              ),
          ],
        ),
      ],
    );
  }

  Future<void> _pickIndustry() async {
    await showMSheet<void>(
      context,
      Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Industry', style: AppText.h3),
          const SizedBox(height: 8),
          for (final ind in _industries)
            InkWell(
              onTap: () {
                setState(() => _industry = ind);
                Navigator.of(context).maybePop();
              },
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 14),
                child: Row(
                  children: [
                    Icon(
                        ind == _industry
                            ? Icons.radio_button_checked
                            : Icons.radio_button_off,
                        size: 20,
                        color: ind == _industry
                            ? AppColors.forest
                            : AppColors.inkMuted),
                    const SizedBox(width: 12),
                    Expanded(child: Text(ind, style: AppText.bodyStrong)),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  // ── Step 3 · interests ──────────────────────────────────────────────────

  Widget _stepInterests() {
    final count = _interests.length;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('What are you into?', style: AppText.h2),
        const SizedBox(height: 6),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Text(
                'Pick a few — we\'ll match sessions and people to them.',
                style: AppText.bodySm.copyWith(color: AppColors.inkMuted),
              ),
            ),
            const SizedBox(width: 8),
            Text('$count selected',
                style: AppText.bodySm.copyWith(
                    color: AppColors.forest, fontWeight: FontWeight.w600)),
          ],
        ),
        const SizedBox(height: 20),
        Wrap(
          spacing: 9,
          runSpacing: 9,
          children: [
            for (final t in _interestOptions)
              MChip(
                t,
                selected: _interests.contains(t),
                onTap: () => setState(() => _interests.contains(t)
                    ? _interests.remove(t)
                    : _interests.add(t)),
              ),
          ],
        ),
        const SizedBox(height: 24),
        _whyNote(
          'The more you pick, the sharper your session and networking '
          'suggestions get.',
        ),
      ],
    );
  }

  // ── Step 4 · goals ──────────────────────────────────────────────────────

  Widget _stepGoals() {
    const goals = <List<dynamic>>[
      [
        'Meet new people',
        'Grow my network',
        Icons.groups_outlined,
        ITone.forest
      ],
      [
        'Learn & get inspired',
        'Sessions and keynotes',
        Icons.auto_awesome_outlined,
        ITone.gold
      ],
      [
        'Find investors / raise',
        'Meet funds & angels',
        Icons.account_balance_outlined,
        ITone.info
      ],
      [
        'Hire or get hired',
        'Talent & opportunities',
        Icons.check_circle_outline,
        ITone.success
      ],
      [
        'Find customers / sell',
        'Grow my pipeline',
        Icons.forum_outlined,
        ITone.muted
      ],
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _stepHeader('What do you want out of events?',
            'We\'ll prioritize matches and sessions around this.'),
        const SizedBox(height: 20),
        for (final g in goals) ...[
          _GoalCard(
            title: g[0] as String,
            desc: g[1] as String,
            icon: g[2] as IconData,
            tone: g[3] as ITone,
            selected: _goals.contains(g[0] as String),
            onTap: () => setState(() {
              final k = g[0] as String;
              _goals.contains(k) ? _goals.remove(k) : _goals.add(k);
            }),
          ),
          const SizedBox(height: 10),
        ],
      ],
    );
  }

  // ── Step 5 · networking ─────────────────────────────────────────────────

  Widget _stepNetworking() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _stepHeader(
            'How you\'ll connect', 'Control how visible you are to attendees.'),
        const SizedBox(height: 20),
        MCard(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              _ToggleRow(
                title: 'Show me in the attendee directory',
                sub: 'Others can find and connect with you',
                value: _directoryVisible,
                onChanged: (v) => setState(() => _directoryVisible = v),
              ),
              const Divider(height: 1, thickness: 1, color: AppColors.border),
              _ToggleRow(
                title: 'Open to meeting people',
                sub: 'Adds an "open to connect" badge',
                value: _openToConnect,
                onChanged: (v) => setState(() => _openToConnect = v),
              ),
            ],
          ),
        ),
        const SizedBox(height: 22),
        Text('ADD YOUR LINKS (OPTIONAL)', style: AppText.seclab),
        const SizedBox(height: 12),
        MInput(
          hint: 'linkedin.com/in/you',
          controller: _linkedinCtl,
          icon: Icons.link,
          keyboardType: TextInputType.url,
        ),
        const SizedBox(height: 12),
        MInput(
          hint: '@handle (X / Twitter)',
          controller: _xCtl,
          icon: Icons.alternate_email,
        ),
      ],
    );
  }

  // ── Step 6 · dietary & access (PRIVATE) ─────────────────────────────────

  Widget _stepDietary() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _stepHeader('Anything we should know?',
            'Only shared with the organizer of events you attend.'),
        const SizedBox(height: 22),
        Text('DIETARY PREFERENCE', style: AppText.seclab),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final d in _dietaryOptions)
              MChip(
                d,
                selected: _dietary.contains(d),
                onTap: () => setState(() => _dietary.contains(d)
                    ? _dietary.remove(d)
                    : _dietary.add(d)),
              ),
          ],
        ),
        const SizedBox(height: 22),
        Text('ACCESSIBILITY NEEDS', style: AppText.seclab),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final a in _accessibilityOptions)
              MChip(
                a,
                selected: _accessibility.contains(a),
                onTap: () => setState(() => _accessibility.contains(a)
                    ? _accessibility.remove(a)
                    : _accessibility.add(a)),
              ),
          ],
        ),
        const SizedBox(height: 22),
        MInput(
          label: 'Anything else? (optional)',
          hint: 'Let the organizer know…',
          controller: _notesCtl,
          minLines: 3,
          maxLines: 4,
        ),
        const SizedBox(height: 16),
        _whyNote(
          'Kept private and organizer-only — never shown on your card or '
          'profile.',
        ),
      ],
    );
  }

  // ── All set / summary ───────────────────────────────────────────────────

  Widget _buildAllSet() {
    final name = _nameCtl.text.trim();
    final greeting = name.isEmpty ? 'You\'re all set.' : 'You\'re all set, $name.';
    return MScaffold(
      background: AppColors.forestDark,
      bottomBar: Container(
        color: AppColors.forestDark,
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
        child: SafeArea(
          top: false,
          child: MButton('Finish', kind: MBtnKind.gold,
              loading: _finishing, onTap: () => _complete(full: true)),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(22, 20, 22, 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const SizedBox(height: 12),
            Container(
              width: 76,
              height: 76,
              decoration: BoxDecoration(
                color: AppColors.success.withValues(alpha: 0.22),
                shape: BoxShape.circle,
                border: Border.all(
                    color: AppColors.gold.withValues(alpha: 0.4)),
              ),
              alignment: Alignment.center,
              child: Container(
                width: 52,
                height: 52,
                decoration: const BoxDecoration(
                    color: AppColors.gold, shape: BoxShape.circle),
                alignment: Alignment.center,
                child: const Icon(Icons.check,
                    size: 28, color: AppColors.forestDark),
              ),
            ),
            const SizedBox(height: 20),
            Text(greeting,
                textAlign: TextAlign.center,
                style: AppText.h2.copyWith(color: Colors.white)),
            const SizedBox(height: 8),
            Text('Here\'s what your profile now powers:',
                textAlign: TextAlign.center,
                style: AppText.bodySm
                    .copyWith(color: Colors.white.withValues(alpha: 0.72))),
            const SizedBox(height: 22),
            _summaryRow(
                Icons.badge_outlined, 'Your attending card is ready'),
            const SizedBox(height: 10),
            _summaryRow(
                Icons.groups_outlined, 'People who match your goals'),
            const SizedBox(height: 10),
            _summaryRow(Icons.view_agenda_outlined,
                'Sessions picked for your interests'),
          ],
        ),
      ),
    );
  }

  Widget _summaryRow(IconData icon, String label) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.07),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppColors.gold),
          const SizedBox(width: 12),
          Expanded(
            child: Text(label,
                style: AppText.bodySm.copyWith(
                    color: Colors.white.withValues(alpha: 0.9))),
          ),
        ],
      ),
    );
  }

  // ── Shared bits ─────────────────────────────────────────────────────────

  Widget _whyNote(String text) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.goldSoft,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.5)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.lock_outline, size: 18, color: AppColors.goldHover),
          const SizedBox(width: 10),
          Expanded(
            child: Text(text,
                style: AppText.bodySm.copyWith(
                    fontSize: 13, color: AppColors.inkSoft, height: 1.45)),
          ),
        ],
      ),
    );
  }
}

// ─── local widgets ──────────────────────────────────────────────────────────

/// Tappable field that mimics a select — shows the chosen value or a
/// placeholder, with a chevron. Opens a sheet on tap.
class _SelectField extends StatelessWidget {
  final String? value;
  final String placeholder;
  final VoidCallback onTap;
  const _SelectField({
    required this.value,
    required this.placeholder,
    required this.onTap,
  });
  @override
  Widget build(BuildContext context) {
    final has = value != null && value!.isNotEmpty;
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        height: 50,
        padding: const EdgeInsets.symmetric(horizontal: 15),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.input),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                has ? value! : placeholder,
                style: AppText.body.copyWith(
                    color: has ? AppColors.ink : AppColors.inkMuted,
                    height: 1.3),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const Icon(Icons.keyboard_arrow_down,
                size: 20, color: AppColors.inkMuted),
          ],
        ),
      ),
    );
  }
}

/// Selectable goal card with icon tile, title/desc, and a checkbox.
class _GoalCard extends StatelessWidget {
  final String title;
  final String desc;
  final IconData icon;
  final ITone tone;
  final bool selected;
  final VoidCallback onTap;
  const _GoalCard({
    required this.title,
    required this.desc,
    required this.icon,
    required this.tone,
    required this.selected,
    required this.onTap,
  });
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected ? AppColors.forestSoft : AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.card),
          border: Border.all(
              color: selected ? AppColors.forest : AppColors.border,
              width: selected ? 1.5 : 1),
        ),
        child: Row(
          children: [
            IconTile(icon, tone: tone),
            const SizedBox(width: 13),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: AppText.h3.copyWith(fontSize: 15)),
                  const SizedBox(height: 2),
                  Text(desc,
                      style: AppText.bodySm.copyWith(
                          fontSize: 13, color: AppColors.inkMuted)),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                color: selected ? AppColors.forest : Colors.transparent,
                borderRadius: BorderRadius.circular(7),
                border: Border.all(
                    color: selected
                        ? AppColors.forest
                        : AppColors.borderStrong,
                    width: 1.5),
              ),
              alignment: Alignment.center,
              child: selected
                  ? const Icon(Icons.check, size: 15, color: Colors.white)
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}

/// A labelled row with a toggle, used inside the networking card.
class _ToggleRow extends StatelessWidget {
  final String title;
  final String sub;
  final bool value;
  final ValueChanged<bool> onChanged;
  const _ToggleRow({
    required this.title,
    required this.sub,
    required this.value,
    required this.onChanged,
  });
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(title, style: AppText.h3.copyWith(fontSize: 15)),
                const SizedBox(height: 2),
                Text(sub,
                    style: AppText.caption.copyWith(
                        fontSize: 12,
                        letterSpacing: 0,
                        color: AppColors.inkMuted)),
              ],
            ),
          ),
          const SizedBox(width: 12),
          MToggle(value: value, onChanged: onChanged),
        ],
      ),
    );
  }
}
