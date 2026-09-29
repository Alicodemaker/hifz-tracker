# Backups go through the phone's share sheet, not a Google Drive integration

The builder wants backups in Google Drive. Version 1 creates a backup file and hands it to the phone's share sheet, where the user picks "Save to Drive"; restoring means picking that file. A direct Drive integration would need Google sign-in, a Google Cloud project and live API calls, which break the "no runtime API calls, no accounts" rules in AGENTS.md. Revisit only if manual backups turn out to be too easy to forget.
