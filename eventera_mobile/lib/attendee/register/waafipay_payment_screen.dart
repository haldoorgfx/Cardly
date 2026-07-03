import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;

import '../../app_config.dart';
import '../../net.dart';
import '../../ui/components.dart';
import '../../ui/tokens.dart';

/// Collects the buyer's mobile-money number and charges it through WaafiPay
/// (EVC Plus / WAAFI / ZAAD / SAHAL). The charge is synchronous — the payer
/// approves a prompt on their phone and the API returns paid/failed right away.
///
/// Mirrors the web WaafiPayStep: after a `pending` registration is created,
/// POST `/api/payments/waafipay` `{ registration_id, phone_number }`. Secrets
/// live on the server; the app only sends the phone number.
///
/// Pops `true` when payment succeeds, so the caller can continue to the ticket.
class WaafiPayPaymentScreen extends StatefulWidget {
  final String registrationId;
  final double amount;
  final String currency;
  final String ticketName;
  final String eventName;

  const WaafiPayPaymentScreen({
    super.key,
    required this.registrationId,
    required this.amount,
    required this.currency,
    required this.ticketName,
    required this.eventName,
  });

  @override
  State<WaafiPayPaymentScreen> createState() => _WaafiPayPaymentScreenState();
}

class _Country {
  final String flag;
  final String name;
  final String dial; // digits only, no +
  const _Country(this.flag, this.name, this.dial);
}

const _countries = <_Country>[
  _Country('🇩🇯', 'Djibouti', '253'),
  _Country('🇸🇴', 'Somalia', '252'),
  _Country('🇪🇹', 'Ethiopia', '251'),
];

class _WaafiPayPaymentScreenState extends State<WaafiPayPaymentScreen> {
  final _phoneCtrl = TextEditingController();
  _Country _country = _countries.first;

  bool _paying = false;
  String? _error;

  @override
  void dispose() {
    _phoneCtrl.dispose();
    super.dispose();
  }

  String get _amountLabel {
    final a = widget.amount;
    final s = a == a.roundToDouble() ? a.toStringAsFixed(0) : a.toStringAsFixed(2);
    return '${widget.currency} $s';
  }

  /// Full international number, digits only, no '+' and no leading zeros —
  /// exactly what WaafiPay expects (e.g. 25377111111).
  String get _fullNumber {
    var local = _phoneCtrl.text.replaceAll(RegExp(r'\D'), '');
    local = local.replaceFirst(RegExp(r'^0+'), '');
    return '${_country.dial}$local';
  }

  Future<void> _pay() async {
    final local = _phoneCtrl.text.replaceAll(RegExp(r'\D'), '');
    if (local.length < 6) {
      setState(() => _error = 'Enter your mobile money number.');
      return;
    }
    FocusScope.of(context).unfocus();
    setState(() {
      _paying = true;
      _error = null;
    });

    try {
      // Call the endpoint directly so we can read the body on both the
      // 200 (paid) and 402 (declined) responses — apiPost would throw on 402
      // and drop WaafiPay's human-readable detail.
      final token = supa.auth.currentSession?.accessToken;
      final res = await http
          .post(
            Uri.parse('${AppConfig.renderBaseUrl}/api/payments/waafipay'),
            headers: {
              'Content-Type': 'application/json',
              if (token != null) 'Authorization': 'Bearer $token',
            },
            body: jsonEncode({
              'registration_id': widget.registrationId,
              'phone_number': _fullNumber,
            }),
          )
          .timeout(const Duration(seconds: 90));

      Map<String, dynamic> map = {};
      try {
        final decoded = jsonDecode(res.body);
        if (decoded is Map) map = Map<String, dynamic>.from(decoded);
      } catch (_) {}

      final status = asString(map['status']);
      if (!mounted) return;

      if (status == 'paid' || status == 'already_paid') {
        Navigator.of(context).pop(true);
        return;
      }

      // Any non-paid outcome: surface the friendliest message we have.
      final detail = asString(map['detail']).trim();
      final err = asString(map['error']).trim();
      setState(() {
        _paying = false;
        _error = detail.isNotEmpty
            ? detail
            : (err.isNotEmpty
                ? err
                : 'Payment was not completed. Please try again.');
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _paying = false;
        _error =
            'Could not reach the payment service. Check your connection and try again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar: const MAppBar(title: 'Pay with mobile money', hairline: true),
      bottomBar: StickyCta(
        children: [
          Expanded(
            child: MButton(
              _paying ? 'Waiting for approval…' : 'Pay $_amountLabel',
              kind: MBtnKind.forest,
              loading: _paying,
              onTap: _paying ? null : _pay,
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(
            AppSpace.lg, AppSpace.base, AppSpace.lg, AppSpace.base),
        children: [
          // Amount summary card.
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.forestSoft,
              borderRadius: BorderRadius.circular(AppRadius.card),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(widget.ticketName,
                        style: AppText.bodyStrong
                            .copyWith(color: AppColors.forestDark)),
                    const SizedBox(height: 2),
                    Text(widget.eventName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.bodySm
                            .copyWith(color: AppColors.forest)),
                  ],
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

          Text('Your mobile money number', style: AppText.label),
          const SizedBox(height: 8),
          Row(
            children: [
              _countryPicker(),
              const SizedBox(width: 10),
              Expanded(
                child: TextField(
                  controller: _phoneCtrl,
                  enabled: !_paying,
                  keyboardType: TextInputType.phone,
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'[0-9 ]')),
                  ],
                  style: AppText.numMd.copyWith(color: AppColors.ink),
                  decoration: InputDecoration(
                    hintText: '77 11 11 11',
                    hintStyle:
                        AppText.numMd.copyWith(color: AppColors.inkMuted),
                    filled: true,
                    fillColor: AppColors.surface,
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 15, vertical: 15),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(AppRadius.input),
                      borderSide: const BorderSide(color: AppColors.border),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(AppRadius.input),
                      borderSide:
                          const BorderSide(color: AppColors.forest, width: 1.5),
                    ),
                  ),
                ),
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
                const Icon(Icons.smartphone_outlined,
                    size: 18, color: AppColors.forest),
                const SizedBox(width: 9),
                Expanded(
                  child: Text(
                    _paying
                        ? 'Check your phone and approve the payment — enter your '
                            'mobile money PIN when prompted. Keep this screen open.'
                        : 'When you tap pay, you\'ll get a prompt on your phone. '
                            'Approve it with your mobile money PIN to confirm.',
                    style: AppText.bodySm.copyWith(
                        color: AppColors.inkSoft, height: 1.45),
                  ),
                ),
              ],
            ),
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

  Widget _countryPicker() {
    return GestureDetector(
      onTap: _paying ? null : _pickCountry,
      child: Container(
        height: 50,
        padding: const EdgeInsets.symmetric(horizontal: 13),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.input),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Text(_country.flag, style: const TextStyle(fontSize: 18)),
            const SizedBox(width: 6),
            Text('+${_country.dial}',
                style: AppText.numMd.copyWith(color: AppColors.ink)),
            const Icon(Icons.keyboard_arrow_down,
                size: 18, color: AppColors.inkMuted),
          ],
        ),
      ),
    );
  }

  void _pickCountry() {
    showMSheet(
      context,
      Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: _countries
            .map((c) => ListTile(
                  leading:
                      Text(c.flag, style: const TextStyle(fontSize: 22)),
                  title: Text(c.name, style: AppText.bodyStrong),
                  trailing: Text('+${c.dial}',
                      style: AppText.numSm.copyWith(color: AppColors.inkMuted)),
                  onTap: () {
                    Navigator.pop(context);
                    setState(() => _country = c);
                  },
                ))
            .toList(),
      ),
    );
  }
}
