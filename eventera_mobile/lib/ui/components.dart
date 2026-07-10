import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';

import 'tokens.dart';

/// Eventera reusable UI components — port of mobile.css primitives.

// ─────────────────────────────────────────── Scaffold + app bar

class MScaffold extends StatelessWidget {
  final Widget body;
  final PreferredSizeWidget? appBar;
  final Widget? bottomBar; // sticky CTA or tab bar (outside scroll)
  final Color background;
  const MScaffold({
    super.key,
    required this.body,
    this.appBar,
    this.bottomBar,
    this.background = AppColors.canvas,
  });

  @override
  Widget build(BuildContext context) {
    // The app bar is placed inside the body Column (not the Scaffold appBar
    // slot) so it can own its own status-bar inset and never clip its title.
    return Scaffold(
      backgroundColor: background,
      body: Column(
        children: [
          if (appBar != null) appBar!,
          Expanded(
            child: SafeArea(
              top: appBar == null,
              bottom: bottomBar == null,
              child: bottomBar == null
                  ? body
                  : Column(children: [Expanded(child: body), bottomBar!]),
            ),
          ),
        ],
      ),
    );
  }
}

class MAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String? title;
  final bool showBack;
  final List<Widget> actions;
  final Widget? leading;
  final Color background;
  final bool hairline;
  const MAppBar({
    super.key,
    this.title,
    this.showBack = true,
    this.actions = const [],
    this.leading,
    this.background = AppColors.canvas,
    this.hairline = false,
  });

  @override
  Size get preferredSize => const Size.fromHeight(52);

  @override
  Widget build(BuildContext context) {
    final topInset = MediaQuery.of(context).padding.top;
    return Container(
      decoration: BoxDecoration(
        color: background,
        border: hairline
            ? const Border(bottom: BorderSide(color: AppColors.border))
            : null,
      ),
      padding: EdgeInsets.only(top: topInset, left: 8, right: 8),
      child: SizedBox(
        height: 52,
        child: Row(
          children: [
            if (leading != null)
              leading!
            else if (showBack)
              _CircleIcon(
                icon: Icons.arrow_back,
                color: AppColors.ink,
                onTap: () => Navigator.of(context).maybePop(),
              )
            else
              const SizedBox(width: 8),
            const SizedBox(width: 4),
            if (title != null)
              Expanded(
                child: Text(title!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.title),
              )
            else
              const Spacer(),
            ...actions,
          ],
        ),
      ),
    );
  }
}

class _CircleIcon extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;
  final double size;
  const _CircleIcon(
      {required this.icon, required this.color, this.onTap, this.size = 22});
  @override
  Widget build(BuildContext context) {
    return InkResponse(
      onTap: onTap,
      radius: 24,
      child: SizedBox(
          width: 38, height: 38, child: Icon(icon, color: color, size: size)),
    );
  }
}

/// App-bar action icon button.
class AppBarAction extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  final Color color;
  const AppBarAction(this.icon, {super.key, this.onTap, this.color = AppColors.inkSoft});
  @override
  Widget build(BuildContext context) =>
      _CircleIcon(icon: icon, color: color, onTap: onTap, size: 21);
}

// ─────────────────────────────────────────── Buttons

enum MBtnKind { forest, gold, sec, text }

class MButton extends StatefulWidget {
  final String label;
  final MBtnKind kind;
  final IconData? icon;
  final VoidCallback? onTap;
  final bool loading;
  final bool small;
  final bool fullWidth;
  const MButton(
    this.label, {
    super.key,
    this.kind = MBtnKind.forest,
    this.icon,
    this.onTap,
    this.loading = false,
    this.small = false,
    this.fullWidth = true,
  });

  @override
  State<MButton> createState() => _MButtonState();
}

class _MButtonState extends State<MButton> {
  bool _down = false;
  @override
  Widget build(BuildContext context) {
    final disabled = widget.onTap == null || widget.loading;
    Color bg;
    Color fg;
    Border? border;
    List<BoxShadow>? shadow;
    switch (widget.kind) {
      case MBtnKind.forest:
        bg = AppColors.forest;
        fg = Colors.white;
        shadow = const [
          BoxShadow(
              color: Color(0x801F4D3A), blurRadius: 20, offset: Offset(0, 8))
        ];
        break;
      case MBtnKind.gold:
        bg = AppColors.gold;
        fg = AppColors.ink;
        shadow = const [
          BoxShadow(
              color: Color(0x99C9A45E), blurRadius: 20, offset: Offset(0, 8))
        ];
        break;
      case MBtnKind.sec:
        bg = AppColors.surface;
        fg = AppColors.ink;
        border = Border.all(color: AppColors.border);
        shadow = AppShadow.soft;
        break;
      case MBtnKind.text:
        bg = Colors.transparent;
        fg = AppColors.forest;
        break;
    }
    final child = widget.loading
        ? SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(
                strokeWidth: 2.4,
                color: widget.kind == MBtnKind.forest ? Colors.white : AppColors.forest),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (widget.icon != null) ...[
                Icon(widget.icon, size: 19, color: fg),
                const SizedBox(width: 9),
              ],
              Text(widget.label, style: AppText.btn.copyWith(color: fg)),
            ],
          );

    final btn = AnimatedScale(
      scale: _down ? 0.98 : 1.0,
      duration: const Duration(milliseconds: 90),
      child: Container(
        height: widget.kind == MBtnKind.text ? null : (widget.small ? 48 : 56),
        width: widget.fullWidth ? double.infinity : null,
        alignment: Alignment.center,
        padding: widget.kind == MBtnKind.text
            ? const EdgeInsets.symmetric(vertical: 8, horizontal: 4)
            : (widget.fullWidth ? null : const EdgeInsets.symmetric(horizontal: 20)),
        decoration: BoxDecoration(
          color: disabled && widget.kind != MBtnKind.text
              ? bg.withValues(alpha: 0.55)
              : bg,
          borderRadius: BorderRadius.circular(AppRadius.btn),
          border: border,
          boxShadow: disabled ? null : shadow,
        ),
        child: child,
      ),
    );

    return GestureDetector(
      onTapDown: disabled
          ? null
          : (_) {
              HapticFeedback.lightImpact();
              setState(() => _down = true);
            },
      onTapUp: disabled ? null : (_) => setState(() => _down = false),
      onTapCancel: disabled ? null : () => setState(() => _down = false),
      onTap: disabled ? null : widget.onTap,
      child: btn,
    );
  }
}

// ─────────────────────────────────────────── Card

class MCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets padding;
  final VoidCallback? onTap;
  final Color? color;
  const MCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.onTap,
    this.color,
  });
  @override
  Widget build(BuildContext context) {
    final card = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: color ?? AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.border),
        boxShadow: AppShadow.soft,
      ),
      child: child,
    );
    if (onTap == null) return card;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.card),
      child: card,
    );
  }
}

// ─────────────────────────────────────────── Chips + tags

class MChip extends StatelessWidget {
  final String label;
  final bool selected;
  final bool soft;
  final IconData? icon;
  final VoidCallback? onTap;
  const MChip(this.label,
      {super.key, this.selected = false, this.soft = false, this.icon, this.onTap});
  @override
  Widget build(BuildContext context) {
    Color bg = AppColors.surface, fg = AppColors.inkSoft;
    Color? bc = AppColors.border;
    if (selected) {
      bg = AppColors.forest;
      fg = Colors.white;
      bc = AppColors.forest;
    } else if (soft) {
      bg = AppColors.forestSoft;
      fg = AppColors.forest;
      bc = null;
    }
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 34,
        padding: const EdgeInsets.symmetric(horizontal: 15),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(999),
          border: bc != null ? Border.all(color: bc) : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[Icon(icon, size: 14, color: fg), const SizedBox(width: 6)],
            Text(label,
                style: AppText.bodySm.copyWith(
                    color: fg, fontWeight: FontWeight.w500, height: 1.0)),
          ],
        ),
      ),
    );
  }
}

enum TagKind { forest, gold, success, warning, danger, info }

class Tag extends StatelessWidget {
  final String label;
  final TagKind kind;
  final bool dot;
  const Tag(this.label, {super.key, this.kind = TagKind.forest, this.dot = false});
  @override
  Widget build(BuildContext context) {
    late Color bg, fg;
    switch (kind) {
      case TagKind.forest:
        bg = AppColors.forestSoft;
        fg = AppColors.forest;
        break;
      case TagKind.gold:
        bg = AppColors.goldSoft;
        fg = AppColors.goldHover;
        break;
      case TagKind.success:
        bg = AppColors.success.withValues(alpha: 0.12);
        fg = AppColors.success;
        break;
      case TagKind.warning:
        bg = AppColors.warning.withValues(alpha: 0.13);
        fg = AppColors.warning;
        break;
      case TagKind.danger:
        bg = AppColors.danger.withValues(alpha: 0.12);
        fg = AppColors.danger;
        break;
      case TagKind.info:
        bg = AppColors.info.withValues(alpha: 0.12);
        fg = AppColors.info;
        break;
    }
    return Container(
      height: 24,
      padding: const EdgeInsets.symmetric(horizontal: 10),
      decoration:
          BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
      alignment: Alignment.center,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (dot) ...[
            Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(color: fg, shape: BoxShape.circle)),
            const SizedBox(width: 5),
          ],
          Text(label,
              style: GoogleFontsHack.tag(fg)),
        ],
      ),
    );
  }
}

// tiny helper so Tag text matches CSS (Inter 11.5/600)
class GoogleFontsHack {
  static TextStyle tag(Color c) => AppText.caption
      .copyWith(color: c, fontWeight: FontWeight.w600, fontSize: 11.5, letterSpacing: 0.1);
}

// ─────────────────────────────────────────── Input

class MInput extends StatefulWidget {
  final String? label;
  final String? hint;
  final TextEditingController? controller;
  final IconData? icon;
  final bool obscure;
  final TextInputType? keyboardType;
  final String? errorText;
  final int minLines;
  final int maxLines;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final TextInputAction? action;
  const MInput({
    super.key,
    this.label,
    this.hint,
    this.controller,
    this.icon,
    this.obscure = false,
    this.keyboardType,
    this.errorText,
    this.minLines = 1,
    this.maxLines = 1,
    this.onChanged,
    this.onSubmitted,
    this.action,
  });
  @override
  State<MInput> createState() => _MInputState();
}

class _MInputState extends State<MInput> {
  final _focus = FocusNode();
  @override
  void initState() {
    super.initState();
    _focus.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _focus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final hasError = widget.errorText != null;
    final focused = _focus.hasFocus;
    final multiline = widget.maxLines > 1;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.label != null) ...[
          Text(widget.label!, style: AppText.label),
          const SizedBox(height: 7),
        ],
        Container(
          padding: EdgeInsets.symmetric(
              horizontal: 15, vertical: multiline ? 13 : 0),
          constraints: BoxConstraints(minHeight: multiline ? 96 : 50),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppRadius.input),
            border: Border.all(
                color: hasError
                    ? AppColors.danger
                    : focused
                        ? AppColors.forest
                        : AppColors.border,
                width: focused && !hasError ? 1.5 : 1),
            boxShadow: focused && !hasError ? AppShadow.ring : null,
          ),
          child: Row(
            crossAxisAlignment:
                multiline ? CrossAxisAlignment.start : CrossAxisAlignment.center,
            children: [
              if (widget.icon != null) ...[
                Icon(widget.icon, size: 18, color: AppColors.inkMuted),
                const SizedBox(width: 10),
              ],
              Expanded(
                child: TextField(
                  controller: widget.controller,
                  focusNode: _focus,
                  obscureText: widget.obscure,
                  keyboardType: widget.keyboardType,
                  minLines: widget.minLines,
                  maxLines: widget.maxLines,
                  onChanged: widget.onChanged,
                  onSubmitted: widget.onSubmitted,
                  textInputAction: widget.action,
                  style: AppText.body.copyWith(color: AppColors.ink, height: 1.3),
                  decoration: InputDecoration(
                    isDense: true,
                    border: InputBorder.none,
                    hintText: widget.hint,
                    hintStyle:
                        AppText.body.copyWith(color: AppColors.inkMuted),
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
              ),
            ],
          ),
        ),
        if (hasError) ...[
          const SizedBox(height: 6),
          Text(widget.errorText!,
              style: AppText.caption.copyWith(color: AppColors.danger, fontSize: 12)),
        ],
      ],
    );
  }
}

// ─────────────────────────────────────────── Avatar + photo placeholder

class Avatar extends StatelessWidget {
  final String? name;
  final String? imageUrl;
  final double size;
  const Avatar({super.key, this.name, this.imageUrl, this.size = 40});
  @override
  Widget build(BuildContext context) {
    final hasName = name != null && name!.trim().isNotEmpty;
    return ClipOval(
      child: SizedBox(
        width: size,
        height: size,
        child: (imageUrl != null && imageUrl!.isNotEmpty)
            ? Image.network(imageUrl!,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => _fallback(hasName))
            : _fallback(hasName),
      ),
    );
  }

  // When there's no name and no image (e.g. signed-out), show a person glyph
  // rather than a bare "?" which reads like an error.
  Widget _fallback(bool hasName) => Container(
        color: AppColors.forest,
        alignment: Alignment.center,
        child: hasName
            ? Text(name!.trim()[0].toUpperCase(),
                style: AppText.h3
                    .copyWith(color: AppColors.gold, fontSize: size * 0.4))
            : Icon(Icons.person, color: AppColors.gold, size: size * 0.56),
      );
}

/// Photo placeholder: layered mesh driven by a hue (0–360). Used as a fallback
/// for event covers, speaker photos, etc. when no image is present/loads.
class PhotoPlaceholder extends StatelessWidget {
  final int hue;
  final Widget? child;
  const PhotoPlaceholder({super.key, this.hue = 150, this.child});
  @override
  Widget build(BuildContext context) {
    Color hsl(int h, double s, double l) =>
        HSLColor.fromAHSL(1, (h % 360).toDouble(), s, l).toColor();
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [hsl(hue, 0.35, 0.28), hsl(hue - 25, 0.30, 0.16)],
        ),
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: RadialGradient(
                center: const Alignment(-0.5, -0.6),
                radius: 1.1,
                colors: [hsl(hue, 0.45, 0.45).withValues(alpha: 0.85), Colors.transparent],
              ),
            ),
          ),
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: RadialGradient(
                center: const Alignment(0.7, 0.6),
                radius: 1.0,
                colors: [hsl(hue + 30, 0.5, 0.30).withValues(alpha: 0.9), Colors.transparent],
              ),
            ),
          ),
          if (child != null) Center(child: child),
        ],
      ),
    );
  }
}

/// Deterministic hue from any string (stable per event/person).
int hueFromString(String s) {
  var h = 0;
  for (final c in s.codeUnits) {
    h = (h * 31 + c) & 0x7fffffff;
  }
  return h % 360;
}

/// Bottom scrim for text over photos.
class ScrimBottom extends StatelessWidget {
  const ScrimBottom({super.key});
  @override
  Widget build(BuildContext context) => const DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.bottomCenter,
            end: Alignment.topCenter,
            colors: [Color(0xEB08120C), Color(0x8C08120C), Colors.transparent],
            stops: [0.0, 0.3, 0.7],
          ),
        ),
      );
}

// ─────────────────────────────────────────── Toggle / seg control / stars

class MToggle extends StatelessWidget {
  final bool value;
  final ValueChanged<bool>? onChanged;
  const MToggle({super.key, required this.value, this.onChanged});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onChanged == null ? null : () => onChanged!(!value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        width: 44,
        height: 26,
        decoration: BoxDecoration(
          color: value ? AppColors.forest : AppColors.borderStrong,
          borderRadius: BorderRadius.circular(999),
        ),
        child: AnimatedAlign(
          duration: const Duration(milliseconds: 180),
          alignment: value ? Alignment.centerRight : Alignment.centerLeft,
          child: Padding(
            padding: const EdgeInsets.all(3),
            child: Container(
              width: 20,
              height: 20,
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(color: Color(0x33000000), blurRadius: 3, offset: Offset(0, 1))
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class SegControl extends StatelessWidget {
  final List<String> segments;
  final int index;
  final ValueChanged<int> onChanged;
  const SegControl(
      {super.key,
      required this.segments,
      required this.index,
      required this.onChanged});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: AppColors.creamSoft,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          for (int i = 0; i < segments.length; i++)
            Expanded(
              child: GestureDetector(
                onTap: () => onChanged(i),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    color: i == index ? AppColors.surface : Colors.transparent,
                    borderRadius: BorderRadius.circular(8),
                    boxShadow: i == index ? AppShadow.soft : null,
                  ),
                  alignment: Alignment.center,
                  child: Text(segments[i],
                      style: AppText.bodySm.copyWith(
                          fontWeight: FontWeight.w600,
                          color: i == index ? AppColors.forest : AppColors.inkMuted)),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class StarRating extends StatelessWidget {
  final int value; // 0..5
  final ValueChanged<int>? onChanged;
  final double size;
  const StarRating({super.key, required this.value, this.onChanged, this.size = 34});
  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (int i = 1; i <= 5; i++)
          GestureDetector(
            onTap: onChanged == null ? null : () => onChanged!(i),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Icon(
                i <= value ? Icons.star_rounded : Icons.star_outline_rounded,
                size: size,
                color: i <= value ? AppColors.gold : AppColors.borderStrong,
              ),
            ),
          ),
      ],
    );
  }
}

// ─────────────────────────────────────────── Skeleton

class Skeleton extends StatefulWidget {
  final double width;
  final double height;
  final double radius;
  const Skeleton(
      {super.key, this.width = double.infinity, this.height = 16, this.radius = 8});
  @override
  State<Skeleton> createState() => _SkeletonState();
}

class _SkeletonState extends State<Skeleton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
      vsync: this, duration: const Duration(milliseconds: 1400))
    ..repeat();
  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _c,
      builder: (_, __) {
        final dx = (_c.value * 2 - 1) * 200;
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.radius),
            gradient: LinearGradient(
              begin: Alignment(-1 + dx / 200, 0),
              end: Alignment(1 + dx / 200, 0),
              colors: const [Color(0xFFECE7DB), Color(0xFFF4F0E7), Color(0xFFECE7DB)],
            ),
          ),
        );
      },
    );
  }
}

// ─────────────────────────────────────────── Section label + list row

class SectionLabel extends StatelessWidget {
  final String text;
  const SectionLabel(this.text, {super.key});
  @override
  Widget build(BuildContext context) =>
      Text(text.toUpperCase(), style: AppText.seclab);
}

class ListRow extends StatelessWidget {
  final Widget leading;
  final Widget title;
  final Widget? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;
  final bool chevron;
  const ListRow({
    super.key,
    required this.leading,
    required this.title,
    this.subtitle,
    this.trailing,
    this.onTap,
    this.chevron = false,
  });
  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 14),
        child: Row(
          children: [
            leading,
            const SizedBox(width: 13),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  DefaultTextStyle(
                      style: AppText.h3.copyWith(fontSize: 15.5), child: title),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    DefaultTextStyle(style: AppText.bodySm, child: subtitle!),
                  ],
                ],
              ),
            ),
            if (trailing != null) trailing!,
            if (chevron)
              const Icon(Icons.chevron_right,
                  size: 18, color: AppColors.inkMuted),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────── Sticky CTA + seg nav

class StickyCta extends StatelessWidget {
  final List<Widget> children;
  const StickyCta({super.key, required this.children});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.border)),
        boxShadow: AppShadow.tabbar,
      ),
      child: SafeArea(top: false, child: Row(children: children)),
    );
  }
}

class SegNav extends StatelessWidget {
  final List<String> items;
  final int index;
  final ValueChanged<int> onChanged;
  const SegNav(
      {super.key,
      required this.items,
      required this.index,
      required this.onChanged});
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 46,
      decoration: const BoxDecoration(
        color: AppColors.canvas,
        border: Border(bottom: BorderSide(color: AppColors.border)),
      ),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        itemCount: items.length,
        itemBuilder: (_, i) {
          final on = i == index;
          return GestureDetector(
            onTap: () => onChanged(i),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                border: Border(
                    bottom: BorderSide(
                        color: on ? AppColors.forest : Colors.transparent,
                        width: 2)),
              ),
              alignment: Alignment.center,
              child: Text(items[i],
                  style: AppText.subhead.copyWith(
                      fontSize: 14,
                      fontWeight: on ? FontWeight.w600 : FontWeight.w500,
                      color: on ? AppColors.forest : AppColors.inkMuted)),
            ),
          );
        },
      ),
    );
  }
}

// ─────────────────────────────────────────── QR, toast, sheet, states

class QrBlock extends StatelessWidget {
  final String data;
  final double size;
  const QrBlock({super.key, required this.data, this.size = 200});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: QrImageView(
        data: data,
        size: size,
        backgroundColor: Colors.white,
        eyeStyle:
            const QrEyeStyle(eyeShape: QrEyeShape.square, color: AppColors.ink),
        dataModuleStyle: const QrDataModuleStyle(
            dataModuleShape: QrDataModuleShape.square, color: AppColors.ink),
      ),
    );
  }
}

void showToast(BuildContext context, String message,
    {String? actionLabel, VoidCallback? onAction}) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
    backgroundColor: AppColors.forestDark,
    behavior: SnackBarBehavior.floating,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    content: Row(children: [
      const Icon(Icons.check_circle_outline, color: AppColors.gold, size: 18),
      const SizedBox(width: 10),
      Expanded(
          child: Text(message,
              style: AppText.bodySm.copyWith(color: Colors.white))),
    ]),
    action: actionLabel != null
        ? SnackBarAction(
            label: actionLabel, textColor: AppColors.gold, onPressed: onAction ?? () {})
        : null,
  ));
}

Future<T?> showMSheet<T>(BuildContext context, Widget child) {
  return showModalBottomSheet<T>(
    context: context,
    backgroundColor: AppColors.surface,
    isScrollControlled: true,
    useSafeArea: true,
    shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.sheet))),
    builder: (ctx) {
      final media = MediaQuery.of(ctx);
      final keyboard = media.viewInsets.bottom; // keyboard height
      final safeBottom = media.padding.bottom; // gesture/nav bar
      return Padding(
        padding: EdgeInsets.only(bottom: keyboard),
        child: ConstrainedBox(
          constraints: BoxConstraints(maxHeight: media.size.height * 0.9),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 38,
                height: 5,
                margin: const EdgeInsets.only(top: 8, bottom: 8),
                decoration: BoxDecoration(
                    color: AppColors.borderStrong,
                    borderRadius: BorderRadius.circular(3)),
              ),
              Flexible(
                child: SingleChildScrollView(
                  padding: EdgeInsets.fromLTRB(AppSpace.lg, AppSpace.sm,
                      AppSpace.lg, safeBottom + AppSpace.lg),
                  child: child,
                ),
              ),
            ],
          ),
        ),
      );
    },
  );
}

/// Reusable states.
class LoadingState extends StatelessWidget {
  const LoadingState({super.key});
  @override
  Widget build(BuildContext context) => const Center(
        child: SizedBox(
            width: 26,
            height: 26,
            child: CircularProgressIndicator(strokeWidth: 2.5, color: AppColors.gold)),
      );
}

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? message;
  final String? ctaLabel;
  final VoidCallback? onCta;
  const EmptyState(
      {super.key,
      required this.icon,
      required this.title,
      this.message,
      this.ctaLabel,
      this.onCta});
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                  color: AppColors.forest.withValues(alpha: 0.08),
                  shape: BoxShape.circle),
              child: Icon(icon, color: AppColors.forest, size: 30),
            ),
            const SizedBox(height: 16),
            Text(title, style: AppText.h3),
            if (message != null) ...[
              const SizedBox(height: 6),
              Text(message!,
                  textAlign: TextAlign.center, style: AppText.bodySm),
            ],
            if (ctaLabel != null) ...[
              const SizedBox(height: 18),
              MButton(ctaLabel!, fullWidth: false, onTap: onCta),
            ],
          ],
        ),
      ),
    );
  }
}

class ErrorStateView extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;
  const ErrorStateView({super.key, required this.message, this.onRetry});
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, color: AppColors.danger, size: 40),
            const SizedBox(height: 14),
            Text(message,
                textAlign: TextAlign.center,
                style: AppText.body.copyWith(color: AppColors.inkSoft)),
            if (onRetry != null) ...[
              const SizedBox(height: 18),
              MButton('Try again', fullWidth: false, onTap: onRetry),
            ],
          ],
        ),
      ),
    );
  }
}
