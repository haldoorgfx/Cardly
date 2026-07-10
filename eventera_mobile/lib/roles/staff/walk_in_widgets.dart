// C01 · presentational pieces for the cash walk-in flow. No state, no money
// logic — just the door screen's widgets, kept out of walk_in_screen.dart so
// each file stays short. Colours from AppColors only; money renders in Inter
// (AppText.num*) — never monospace. See MOBILE_DESIGN_LAW §1, §5.

import 'package:flutter/material.dart';

import '../../ui/components.dart';
import '../../ui/tokens.dart';

String money(double v, String ccy) => '$ccy ${v.toStringAsFixed(2)}';

/// A selectable door-ticket row showing the SERVER price.
class WalkInTicketTile extends StatelessWidget {
  final String name;
  final double price;
  final String currency;
  final bool selected;
  final VoidCallback onTap;
  const WalkInTicketTile({
    super.key,
    required this.name,
    required this.price,
    required this.currency,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppRadius.card),
            border: Border.all(
                color: selected ? AppColors.forest : AppColors.border,
                width: selected ? 2 : 1),
            boxShadow: selected ? AppShadow.ring : AppShadow.soft,
          ),
          child: Row(
            children: [
              _Radio(on: selected),
              const SizedBox(width: 13),
              Expanded(
                  child: Text(name, style: AppText.h3.copyWith(fontSize: 15))),
              const SizedBox(width: 8),
              Text(price <= 0 ? 'Free' : money(price, currency),
                  style: AppText.numMd.copyWith(color: AppColors.forest)),
            ],
          ),
        ),
      ),
    );
  }
}

class _Radio extends StatelessWidget {
  final bool on;
  const _Radio({required this.on});
  @override
  Widget build(BuildContext context) => Container(
        width: 20,
        height: 20,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(
              color: on ? AppColors.forest : AppColors.borderStrong, width: 1.5),
        ),
        child: on
            ? Center(
                child: Container(
                    width: 10,
                    height: 10,
                    decoration: const BoxDecoration(
                        color: AppColors.forest, shape: BoxShape.circle)))
            : null,
      );
}

/// Big, unmissable change figure — ink type, not a green block (§1).
class ChangeDueCard extends StatelessWidget {
  final String currency;
  final double? change; // null → not enough entered yet
  const ChangeDueCard({super.key, required this.currency, required this.change});

  @override
  Widget build(BuildContext context) {
    final has = change != null;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Change due', style: AppText.seclab),
              const SizedBox(height: 4),
              Text(currency,
                  style: AppText.bodySm.copyWith(color: AppColors.inkMuted)),
            ],
          ),
          Text(
            has ? change!.toStringAsFixed(2) : '—',
            style: AppText.numLg.copyWith(
                color: has ? AppColors.ink : AppColors.inkMuted, fontSize: 38),
          ),
        ],
      ),
    );
  }
}

class SaleErrorBox extends StatelessWidget {
  final String message;
  const SaleErrorBox(this.message, {super.key});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.danger.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.danger.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: AppColors.danger, size: 18),
          const SizedBox(width: 8),
          Expanded(
              child: Text(message,
                  style: AppText.bodySm.copyWith(color: AppColors.danger))),
        ],
      ),
    );
  }
}

/// The completed-sale screen: the issued Eventera Card (QR) + a plain receipt.
/// When check-in didn't finish it says so and offers a retry — money is never
/// hidden from the operator.
class WalkInSuccessView extends StatelessWidget {
  final String attendeeName;
  final String? ticketName;
  final String currency;
  final double price;
  final String methodLabel;
  final bool isCash;
  final double? received;
  final double change;
  final bool checkedIn;
  final bool checkinFailed;
  final bool retrying;
  final String qrToken;
  final String qrData;
  final VoidCallback onNewSale;
  final VoidCallback onRetryCheckin;

  const WalkInSuccessView({
    super.key,
    required this.attendeeName,
    required this.ticketName,
    required this.currency,
    required this.price,
    required this.methodLabel,
    required this.isCash,
    required this.received,
    required this.change,
    required this.checkedIn,
    required this.checkinFailed,
    required this.retrying,
    required this.qrToken,
    required this.qrData,
    required this.onNewSale,
    required this.onRetryCheckin,
  });

  @override
  Widget build(BuildContext context) {
    return MScaffold(
      appBar:
          const MAppBar(title: 'Sale complete', showBack: false, hairline: true),
      bottomBar: StickyCta(children: [
        Expanded(
          child: MButton('New sale',
              icon: Icons.add, kind: MBtnKind.forest, onTap: onNewSale),
        ),
      ]),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(
            AppSpace.lg, AppSpace.base, AppSpace.lg, AppSpace.base),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (checkinFailed) _checkinWarning(),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(AppRadius.card),
                border: Border.all(color: AppColors.border),
                boxShadow: AppShadow.soft,
              ),
              child: Column(
                children: [
                  if (qrToken.isNotEmpty) QrBlock(data: qrData, size: 190),
                  const SizedBox(height: 16),
                  Text(attendeeName,
                      style: AppText.h3, textAlign: TextAlign.center),
                  const SizedBox(height: 6),
                  if (ticketName != null)
                    Tag(ticketName!, kind: TagKind.forest),
                ],
              ),
            ),
            const SizedBox(height: 16),
            _row('Paid', money(price, currency)),
            const SizedBox(height: 10),
            _row('Method', methodLabel),
            if (isCash && received != null) ...[
              const SizedBox(height: 10),
              _row('Received', money(received!, currency)),
              const SizedBox(height: 10),
              _row('Change', money(change, currency)),
            ],
            const SizedBox(height: 10),
            _row('Checked in', checkedIn ? 'Yes' : 'Not yet'),
          ],
        ),
      ),
    );
  }

  Widget _row(String label, String value) => Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: AppText.bodySm),
          Text(value, style: AppText.numMd),
        ],
      );

  Widget _checkinWarning() {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.warning.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.warning.withValues(alpha: 0.35)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.info_outline, color: AppColors.warning, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Paid, but not checked in',
                    style: AppText.bodySm.copyWith(
                        color: AppColors.warning, fontWeight: FontWeight.w700)),
                const SizedBox(height: 2),
                Text('Payment was taken. Retry, or check them in from the list.',
                    style: AppText.bodySm),
                const SizedBox(height: 10),
                GestureDetector(
                  onTap: retrying ? null : onRetryCheckin,
                  child: Text(retrying ? 'Retrying…' : 'Retry check-in',
                      style: AppText.bodySm.copyWith(
                          color: AppColors.forest, fontWeight: FontWeight.w700)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
