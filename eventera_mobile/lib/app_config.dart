/// App-level config (non-secret).
///
/// The render API base URL — where the existing Next.js `/api/render` endpoint
/// is deployed. This is the live web app's domain. Change it if your production
/// domain differs.
///
/// The live production backend is the Vercel `cardly` project, whose only
/// production domain is `https://karta.cre8so.com` (verified in Vercel →
/// cardly → Domains). `eventera.app` is NOT attached to that project, so the
/// app must call karta.cre8so.com. If you later attach eventera.app to the
/// cardly project in Vercel, switch this back.
class AppConfig {
  static const String renderBaseUrl = 'https://karta.cre8so.com';

  static Uri get renderEndpoint => Uri.parse('$renderBaseUrl/api/render');
}
