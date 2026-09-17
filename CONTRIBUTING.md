# Contributing to Banablur

Thanks for helping improve Banablur. Keep changes focused, tested, and free of secrets.

## Development workflow

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Run the test suite:

   ```powershell
   node test-logic.js
   ```

   Or via npm:

   ```powershell
   npm test
   ```

3. Build installable artifacts:

   ```powershell
   powershell -File build.ps1
   ```

   This produces versioned `agego-deblur-<version>.zip`, `.xpi`, and an extracted folder in the parent directory.

## Pull requests

- Run `npm test` before opening a PR.
- Do **not** commit signing credentials, API keys, JWT tokens, AMO issuer/secret values, or personal machine paths.
- Do **not** add build artifacts (`.zip`, `.xpi`, extracted folders) or `node_modules/` to the repository.
- Prefer small, reviewable diffs with a clear description of the site or behavior affected.

## Optional tests

```powershell
npm run test:chaturbate
```

Requires Playwright; used for Chaturbate-specific integration checks.

## Questions

Open an issue describing the target site, browser, and steps to reproduce. Include DOM or console details when possible — avoid attaching credentials or private URLs with auth tokens.
