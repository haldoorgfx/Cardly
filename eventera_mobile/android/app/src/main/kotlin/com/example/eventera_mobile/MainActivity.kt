package com.example.eventera_mobile

import io.flutter.embedding.android.FlutterFragmentActivity

// local_auth requires a FragmentActivity host — with the plain FlutterActivity,
// authenticate() throws `no_fragment_activity` and biometric unlock silently
// fails. FlutterFragmentActivity is a drop-in replacement.
class MainActivity : FlutterFragmentActivity()
