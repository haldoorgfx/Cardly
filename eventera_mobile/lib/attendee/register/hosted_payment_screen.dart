import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';

import '../../app_config.dart';
import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';

/// Hosted checkout for card payments (Stripe pay page or Flutterwave link).
/// Opens the payment URL in the browser, then waits here, polling the
/// registration's payment status until the webhook / confirm page flips it
/// to paid. Pops `true` when payment succeeds.
///
/// Polling budget: `/api/registrations/status` is public-tier (30/min) so we
/// poll it every 5s; `/api/payments/confirm-intent` is strict-tier (10/min)
/// so the active Stripe-side check only fires every 4th tick + on manual tap.
class HostedPaymentScreen extends StatefulWidget {
  final String payUrl;
  final String qrToken;

  /// Stripe PaymentIntent id — set for card payments, null for Flutterwave.
  /// Lets us verify directly against Stripe instead of waiting on webhooks.
  final String? paymentIntentId;
  final double amount;
  final String currency;
  final String ticketName;
  final String eventName;

  const HostedPaymentScreen({
    super.key,
    required this.payUrl,
    required this.qrToken,
    this.paymentIntentId,
    required this.amount,
    required this.currency,
    required this.ticketName,
    required this.eventName,
  });

  @override
  State<HostedPaymentScreen> createState() => _HostedPaymentScreenState();
}

class _HostedPaymentScreenState extends State<HostedPaymentScreen> {
  Timer? _timer;
  int _ticks = 0;
  bool _checking = false;
  bool _launchFailed = false;
  bool _copied = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 5), (_) => _tick());
    // Open the browser as soon as the screen has settled.
    WidgetsBinding.instance.addPostFrameCallback((_) => _openBrowser());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String get _amountLabel {
    final a = widget.amount;
    final s =
        a == a.roundToDouble() ? a.toStringAsFixed(0) : a.toStringAsFixed(2);
    return '${widget.currency} $s';
  }

  Future<void> _openBrowser() async {
    var ok = false;
    try {
      ok = await launchUrl(
        Uri.parse(widget.payUrl),
        mode: LaunchMode.externalApplication,
      );
    } catch (_) {
      ok = false;
    }
    if (!mounted) return;
    if (!ok) setState(() => _launchFailed = true);
  }

  Future<void> _copyLink() async {
    await Clipboard.setData(ClipboardData(text: widget.payUrl));
    if (!mounted) return;
    setState(() => _copied = true);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _copied = false);
    });
  }

  void _tick() {
    _ticks++;
    // Every 4th tick (~20s) also verify against Stripe; cheap poll otherwise.
    _check(active: widget.paymentIntentId != null && _ticks % 4 == 0);
  }

  Future<void> _check({bool active = false, bool manual = false}) async {
    if (_checking) return;
    _checking = true;
    if (manual && mounted) setState(() => _error = null);

    try {
      var paid = await _statusSaysPaid();
      if (!paid && (active || manual) && widget.paymentIntentId != null) {
        paid = await _stripeSaysPaid();
      }
      if (!mounted) return;
      if (paid) {
        _timer?.cancel();
        Navigator.of(context).pop(true);
        return;
      }
      if (manual) {
        setState(() => _error =
            'Payment not received yet. If you just paid, give it a few '
            'seconds and check again.');
      }
    } catch (_) {
      if (manual && mounted) {
        setState(() => _error =
            'Could not check the payment status. Check your connection and '
            'try again.');
      }
    } finally {
      _checking = false;
    }
  }

  Future<bool> _statusSaysPaid() async {
    final res = await http
        .get(Uri.parse(
            '${AppConfig.renderBaseUrl}/api/registrations/status?token=${Uri.encodeQueryComponent(widget.qrToken)}'))
        .timeout(const Duration(seconds: 15));
    if (res.statusCode != 200) return false;
    final map = jsonDecode(res.body);
    if (map is! Map) return false;
    return asString(map['payment_status']) == 'paid' ||
        asString(map['status']) == 'confirmed';
  }

  Future<bool> _stripeSaysPaid() async {
    final res = await http
        .post(
          Uri.parse('${AppConfig.renderBaseUrl}/api/payments/confirm-intent'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'payment_intent_id': widget.paymentIntentId,
            'qr_code_token': widget.qrToken,
          }),
        )
        .timeout(const Duration(seconds: 20));
    if (res.statusCode != 200) return false;
    final map = jsonDecode(res.body);
    if (map is! Map) return false;
    return asString(map['status']) == 'succeeded';
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: const MAppBar(title: 'Complete payment', hairline: true),
      bottomBar: StickyCta(
        children: [
          Expanded(
            child: MButton(
              'I\'ve completed payment',
              kind: MBtnKind.forest,
              loading: _checking,
              onTap: _checking ? null : () => _check(manual: true),
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(
            AppSpace.lg, AppSpace.base, AppSpace.lg, AppSpace.base),
        children: [
          // Amount summary card (same treatment as the WaafiPay screen).
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.forestSoft,
              borderRadius: BorderRadius.circular(AppRadius.card),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(widget.ticketName,
                          style: AppText.bodyStrong
                              .copyWith(color: AppColors.forestDark)),
                      const SizedBox(height: 2),
                      Text(widget.eventName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style:
                              AppText.bodySm.copyWith(color: AppColors.forest)),
                    ],
                  ),
                ),
                Text(_amountLabel,
                    style: AppText.numMd.copyWith(
                        color: AppColors.forest,
                        fontWeight: FontWeight.w600,
                        fontSize: 18)),
              ],
            ),
          ),
          const SizedBox(height: 22),

          // Waiting state.
          Row(
            children: [
              const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                    strokeWidth: 2.2, color: AppColors.forest),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text('Waiting for your payment…',
                    style: AppText.bodyStrong),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(13),
            decoration: BoxDecoration(
              color: const Color(0xFFFBFAF6),
              borderRadius: BorderRadius.circular(AppRadius.input),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.open_in_browser,
                    size: 18, color: AppColors.forest),
                const SizedBox(width: 9),
                Expanded(
                  child: Text(
                    _launchFailed
                        ? 'We couldn\'t open your browser automatically. Use '
                            'the buttons below to open or copy the secure '
                            'payment page.'
                        : 'Your secure payment page opened in the browser. '
                            'Finish paying there, then come back — your '
                            'ticket confirms here automatically.',
                    style: AppText.bodySm
                        .copyWith(color: AppColors.inkSoft, height: 1.45),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          MButton(
            'Open payment page',
            kind: MBtnKind.sec,
            onTap: _openBrowser,
          ),
          const SizedBox(height: 10),
          MButton(
            _copied ? 'Link copied' : 'Copy payment link',
            kind: MBtnKind.sec,
            onTap: _copyLink,
          ),

          if (_error != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.danger.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(10),
                border:
                    Border.all(color: AppColors.danger.withValues(alpha: 0.3)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.error_outline,
                      color: AppColors.danger, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(_error!,
                        style:
                            AppText.bodySm.copyWith(color: AppColors.danger)),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
