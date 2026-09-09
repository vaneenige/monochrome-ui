# Principles

What makes monochrome monochrome. The north stars are the
contract; the shape choices below them explain why the core
looks the way it does. Read this before touching `src/`.

## North stars (non-negotiables)

These aren't preferences. Break any of them and it isn't monochrome
any more:

1. **DOM is the source of truth.** Every decision reads
   `aria-expanded`, `aria-selected`, `aria-checked`,
   `aria-disabled`. There is no internal state object mirroring the
   DOM anywhere in the library.
2. **Event delegation only.** Listeners go on `window`. Zero
   per-element listeners. Each component registers only the
   events it handles. Combined, the set is still the nine:
   `pointerdown`, `pointerup`, `click`, `pointermove`, `keydown`,
   `scroll`, `resize`, `focusin`, `focusout`.
3. **Zero timers.** No `setTimeout`, `requestAnimationFrame`,
   `queueMicrotask`, debounce, or throttle. Every action is
   synchronous within its event.
4. **Zero runtime dependencies.** Shared helpers (`src/dom.ts`)
   import nothing. Components import only those helpers. The
   wrappers import only their framework (as peer deps) plus one
   side-effect import of their own core file, so a single wrapper
   import ships both markup and behavior.
5. **Baseline 2024 browsers.** We rely on the Popover API. No
   polyfills shipped.
6. **One file per component.** Shared helpers live in
   `src/dom.ts`. Each component is `src/{name}.ts` and registers
   its own window listeners. `src/index.ts` only imports every
   component so `import "monochrome"` still lights up the page.
   Components do not import each other.

## Why the core looks weird (and should stay weird)

Five architectural choices that explain the _shape_ of the core.
Each looks odd at a glance and each has a specific reason. Don't
"fix" them.

**DOM-as-state.** Reading ARIA attrs on every event looks wasteful
compared to caching in a JS object. It isn't: the cache would drift
the moment a user, a framework, or devtools mutates the DOM, and
tracking who owns what becomes a maintenance tax. With DOM-as-state
there is exactly one truth and we never have to reconcile.

**Global delegated listeners.** Per-instance listeners scale with
component count and require teardown on unmount. Window listeners
are constant cost per component (not per instance), require zero
teardown, and automatically cover dynamically-inserted DOM without
re-wiring. Each file registers its own; the combined entry does
not own a dispatcher.

**ID prefix dispatch.** We route events to handlers by checking the
prefix of `target.id` (`mct:`, `mcc:`, `mcr:`). No classes, no data
attributes, no registration table. Enum values spell out the full
component name with a trailing colon (`mct:accordion:`,
`mct:dialog-open:`), exactly as the ids appear in the DOM.

**File-scope `let` for state.** No classes, no `this`, no closures
passed down. Handlers share state through `let` and `const`
declared at file scope inside the `hasDocument` guard (`menuStack`,
`popoverShown`, `tooltipShown`, …). This is why
each component is one file: the state is part of that file's
mental model, and no other component reads it.

**`should*` driver flags for cross-handler communication.** The
conventional move is to thread a mutable parameter (or return a
result object) through every function the event visits, so each
layer can report "I want preventDefault", "I matched a letter",
"I'm doing a radio sweep" back up. The core skips all of that:
flags like `shouldPreventDefault`, `shouldMatchLetter`, and
`shouldResetRadio` live at file scope. A deep callback sets one
during event processing; the owner of that event reads it before
the cycle ends. Some flags clear at listener entry; others are
set and cleared inside one helper. Every flag dies with the
event, so there's no reentrancy to reason about. No parameter
plumbing, no return-value threading, no wrapper objects. Saves
real bytes on every function signature it removes, and it
makes the "where does this side effect come from?" question one
grep away.
