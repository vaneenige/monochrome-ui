---
name: release
description: Review commits since the last tag, decide a semver bump, then run the full local release (gate, version, publish, commit, tag, push). Asks before choosing the bump and again before publishing.
---

1. Confirm it is safe to release: `git fetch`, then check the working tree is clean (`git status --porcelain` is empty), you are on `main` (`git branch --show-current`), and you are not behind origin (`git rev-list --count HEAD..@{u}` is 0). If any check fails, stop and say why — the release must not fold unrelated or unpushed changes into its commit and tag.
2. Get the last tag and everything since it: `TAG=$(git describe --tags --abbrev=0 2>/dev/null) && echo "$TAG" && git log "$TAG"..HEAD --oneline && git diff "$TAG"..HEAD --stat`. If there are no tags, or there are no commits since the last tag, say so and stop.
3. Read the commits and diff and sort them into features, fixes, breaking changes (removed/renamed exports, changed behavior), and other (refactor/docs/chore/test/ci).
4. Pick a bump by semver. If the current version is >= 1.0.0: major for breaking changes, minor for features, patch for anything else. If it is < 1.0.0: minor for breaking changes, patch for anything else.
5. Show the last tag, the commit count, the categorized changes, and the recommended bump as `<current> -> <new>`, then ask: "Proceed with the <recommended> bump, or pick another (patch/minor/major)?" Wait for the answer before doing anything else.
6. Run the full gate and stop on any failure: `bun run build` (also lints), then `bun run typecheck` (needs the `dist/` the build just produced), then `bun run test`.
7. Bump without tagging: set `package.json` `version` to the next patch/minor/major, then read the new version from package.json.
8. Show what will ship: the package name, the new version, and the output of `bun pm pack --dry-run`. Then ask: "Publish this version, or skip?" Wait for the answer; do nothing further unless they say publish.
9. Check `NPM_TOKEN` is set (if not, stop and tell them to add it to `~/.zshenv`), then commit and tag locally first, since these are reversible: `git add -A && git commit -m "v<version>" && git tag "v<version>"`.
10. Publish (the point of no return; a version can never be re-published): `bun publish --access public --ignore-scripts --provenance`. If it fails, stop and undo the still-local commit and tag (`git reset --hard HEAD~1 && git tag -d v<version>`); nothing has been pushed.
11. Push last, which is safe to retry if it fails: `git push && git push --tags`.
12. Print `Published <package>@<version>` and its npm URL.
