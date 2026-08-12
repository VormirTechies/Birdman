# Legacy Supabase admin identity APIs

These files preserve the former Supabase Auth implementations. They live outside
`src/app`, so Next.js does not expose them as HTTP routes. Active admin identity
flows use Firebase Authentication and the Firestore `adminUsers` allowlist.
