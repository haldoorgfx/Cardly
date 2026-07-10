// C02 · presentational pieces for cash reconciliation. No state, no RPC calls —
// just the drawer screen's widgets, kept out of cash_shift_screen.dart so each
// file stays short. Money renders in Inter (AppText.num*), never monospace.
// See MOBILE_DESIGN_LAW §1, §5.

import 'package:flutter/material.dart';

import '../../ui/tokens.dart';

String shiftMoney(double v, String ccy) => '$ccy ${v.toStringAsFixed(2)}';

/// One collected cash transaction (name, ticket · time, amount).
class ShiftTxnRow extends StatelessWidget {
  final String name;
  final String ticket;
  final String timeLabel;
  final double amount;
  final String currency;
  const ShiftTxnRow({
    super.key,
    required this.name,
    required this.ticket,
    required this.timeLabel,
    required this.amount,
    required this.currency,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        color: AppColors.ink,
                        fontSize: 14.5,
                        fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text('$ticket · $timeLabel',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        color: AppColors.inkMuted, fontSize: 12.5)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(shiftMoney(amount, currency), style: AppText.numMd),
        ],
      ),
    );
  }
}

/// A single expected/counted/variance key-value line.
class ShiftKV extends StatelessWidget {
  final String k;
  final String v;
  final bool strong;
  final Color? color;
  const ShiftKV(this.k, this.v, {super.key, this.strong = false, this.color});

  @override
  Widget build(BuildContext context) {
    final ks = strong
        ? AppText.h3.copyWith(fontSize: 15, color: color ?? AppColors.ink)
        : AppText.bodySm;
    final vs = strong
        ? AppText.numMd.copyWith(fontSize: 18, color: color ?? AppColors.ink)
        : AppText.numSm;
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [Text(k, style: ks), Text(v, style: vs)],
    );
  }
}

/// Expected vs counted vs variance. Over and under stated neutrally, no scolding.
class VarianceCard extends StatelessWidget {
  final double expected;
  final double counted;
  final String currency;
  const VarianceCard({
    super.key,
    required this.expected,
    required this.counted,
    required this.currency,
  });

  @override
  Widget build(BuildContext context) {
    final variance = counted - expected;
    final label =
        variance == 0 ? 'Balanced' : (variance > 0 ? 'Over' : 'Short');
    final color = variance == 0 ? AppColors.success : AppColors.inkSoft;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          ShiftKV('Expected', shiftMoney(expected, currency)),
          const SizedBox(height: 8),
          ShiftKV('Counted', shiftMoney(counted, currency)),
          const SizedBox(height: 10),
          const Divider(color: AppColors.border, height: 1),
          const SizedBox(height: 10),
          ShiftKV(label,
              '${variance > 0 ? "+" : ""}${shiftMoney(variance, currency)}',
              strong: true, color: color),
        ],
      ),
    );
  }
}

/// Collected total + sale count.
class ShiftTotalCard extends StatelessWidget {
  final double collected;
  final int count;
  final String currency;
  const ShiftTotalCard({
    super.key,
    required this.collected,
    required this.count,
    required this.currency,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.border),
        boxShadow: AppShadow.soft,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Collected', style: AppText.seclab),
              const SizedBox(height: 4),
              Text('$count ${count == 1 ? "sale" : "sales"}',
                  style: AppText.bodySm.copyWith(color: AppColors.inkMuted)),
            ],
          ),
          Text(shiftMoney(collected, currency),
              style: AppText.numLg.copyWith(fontSize: 32)),
        ],
      ),
    );
  }
}
