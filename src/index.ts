/**
 * @file Core runtime for monochrome UI components.
 *
 * ## Architecture
 *
 * The core is framework-agnostic and operates entirely through global
 * event delegation. It reads and writes ARIA attributes to determine
 * state. There are no internal state objects mirroring the DOM. This
 * keeps the library small and lets frameworks (React, Vue) render
 * plain DOM with the right ARIA setup and get full behaviour for free.
 *
 * The non-negotiables (DOM-as-state, event delegation only, zero
 * timers, ID-prefix dispatch) live in `AGENTS.md` § North stars
 * and § Why the core looks weird.
 *
 * ## File layout
 *
 * 1. Enums: focus modes and ID prefixes
 * 2. Module state: mutable variables shared between handlers
 * 3. Types: roving-tabindex helper signatures
 * 4. Utilities: type guards, DOM lookups, positioning
 * 5. Roving engine: generic next/previous navigator factory + per-
 *    component focus rules
 * 6. Component primitives: `collapsible`, `accordion`, `tabs`, `menu`,
 *    `popover`, `tooltip` and their helpers
 * 7. Event listeners: `click`, `pointermove`, `keydown`, `scroll`,
 *    `resize`, `focusin`, `focusout`
 *
 * ## Comment convention
 *
 * TSDoc (`/​** ... *​/`) for declared symbols (functions, types, enums,
 * module state). Inline `//` for implementation notes at non-obvious
 * decision points.
 *
 * The build step (`build.ts`) strips every comment before invoking
 * `Bun.build`, working around a Bun minifier bug where comment
 * placement influences the size of the minified output. Write
 * comments freely; they never reach `dist/`.
 */

/** Where focus should land when a menu opens. */
enum Focus {
	/** Keep focus on the trigger (default for mouse opens). */
	Trigger,
	/** Move focus to the first menuitem (default for keyboard opens). */
	First,
	/** Move focus to the last menuitem (ArrowUp on a closed trigger). */
	Last,
	/** Do not move focus (used for submenu hover-opens). */
	None,
}

/**
 * ID prefix conventions. Every interactive element is identified by
 * the prefix of its `id`. The global event listeners route events by
 * matching these prefixes. No classes, data attributes, or per-
 * component registries.
 *
 * - `mct:`: trigger elements (almost always `<button>`)
 * - `mcc:`: content elements (panels, popovers)
 * - `mcr:`: root containers (component boundaries)
 *
 * Each prefix is the **shortest string that uniquely identifies its
 * component** among the current set. Tabs and Tooltip both start with
 * `t`, so they extend to `mct:ta` and `mct:to`. A new `t*` component
 * (say `template`) could live at `mct:te` with no other changes. If a
 * third component collides on two letters, all three grow to the
 * shortest length that disambiguates (still the minimum, just longer).
 */
enum Prefix {
	Trigger = "mct:",
	TriggerAccordion = "mct:a",
	TriggerCollapsible = "mct:c",
	TriggerDialog = "mct:dialog-o",
	TriggerDialogClose = "mct:dialog-c",
	TriggerMenu = "mct:m",
	TriggerPopover = "mct:p",
	TriggerTabs = "mct:ta",
	TriggerTooltip = "mct:to",
	Content = "mcc:",
	ContentDialog = "mcc:d",
	ContentMenu = "mcc:m",
	ContentPopover = "mcc:p",
	ContentTooltip = "mcc:to",
	RootAccordion = "mcr:a",
}

// The SSR guard: when `document` is undefined we do nothing at all, so
// the module can be imported in Node/SSR without side effects.
if (typeof document !== "undefined") {
	// Module state. Module-scoped (not passed as arguments) because the
	// roving-navigator callbacks and the event listeners communicate
	// indirectly through them. Keeping them at module scope avoids a
	// plumbing tax that would cost bytes without improving clarity.

	/**
	 * Set to `true` by a handler when the browser default action for
	 * the current event should be suppressed. Read (and cleared) at
	 * the tail of each event listener.
	 */
	let shouldPreventDefault: boolean | null = null;

	/**
	 * Active character for typeahead letter matching inside menus. Set
	 * when the user types a letter on an open menu; consumed by
	 * `menuRoving` when it looks for the next matching `menuitem`.
	 */
	let shouldMatchLetter: string | null = null;

	/**
	 * The radio menuitem currently being activated. While non-null,
	 * `menuRoving` switches into "radio sweep" mode: it walks forward
	 * from the activated item with wrap-around, clearing
	 * `aria-checked` on every same-group radio. Radios after the
	 * activated item in DOM order are cleared immediately; radios
	 * before it (reached by wrapping) are buffered into
	 * `radioTailChain` and flushed when the walk returns to the
	 * activated item. See `menuItemAction`.
	 */
	let shouldResetRadio: HTMLElement | null = null;

	/**
	 * Radio-sweep state: `true` once the walker has crossed its first
	 * group boundary. The "head" is the walk's first segment, from
	 * the activated item to that boundary (radios after the activated
	 * item in DOM order, cleared immediately). `null` means the sweep
	 * has not yet started.
	 */
	let radioHeadDone: boolean | null = null;

	/**
	 * Radio-sweep tail buffer: holds the current contiguous run of
	 * radios visited after the head is done. Each group boundary
	 * resets the buffer, so when the walk returns to the activated
	 * item the buffer contains exactly the radios in its group that
	 * precede it in DOM order. Flushed in one pass at that point.
	 */
	let radioTailChain: HTMLElement[] = [];

	/**
	 * Stack of currently open menu triggers, outermost first. A
	 * menubar or standalone trigger sits at index 0; submenus stack on
	 * top. `menuHideAll(keep)` pops back to the first `keep` entries.
	 */
	const menuPopovers: HTMLElement[] = [];

	/**
	 * Sentinel for full-revolution detection in `roving` navigators.
	 * Each roving rule records the first candidate it visits; if the
	 * walker returns to that element without finding a match, we
	 * bail. Prevents infinite loops on all-disabled lists or
	 * typeahead letters with no matching item.
	 */
	let rovingBoundary: Element | null = null;

	/** The Group element currently projecting a "safety triangle". */
	let safeGroup: HTMLElement | null = null;
	/** Rect of the submenu-trigger cell: the origin of the triangle. */
	let safeRect: DOMRect | null = null;
	/** The open submenu popover; its rect forms the triangle's base. */
	let safeContent: HTMLElement | null = null;
	/** Cached rect of `safeContent`, measured lazily on pointermove. */
	let safePopoverRect: DOMRect | null = null;

	/** Currently open standalone popover trigger, if any. */
	let popoverOpen: HTMLElement | null = null;

	/** The native `<dialog>` currently open via `showModal()`, if any. */
	let dialogContent: HTMLDialogElement | null = null;
	/** Trigger that opened the current dialog; focus returns here on close. */
	let dialogTrigger: HTMLElement | null = null;

	/** Tooltip trigger currently under the pointer. */
	let tooltipHovered: HTMLElement | null = null;
	/** Tooltip trigger currently holding DOM focus. */
	let tooltipFocused: HTMLElement | null = null;
	/** Tooltip trigger whose content is actually rendered. */
	let tooltipShown: HTMLElement | null = null;
	/**
	 * Tooltip trigger whose tooltip has been dismissed via click or
	 * Escape. Remains suppressed until pointer/focus moves to a
	 * different trigger.
	 */
	let tooltipSuppressed: HTMLElement | null = null;

	// Roving-tabindex types. The roving helpers are a tiny generic engine
	// for "focus next/previous sibling, wrapping at the ends". Each
	// component plugs a `RovingFocusCallback` that decides whether a
	// given candidate is a valid focus target; when it is, the callback
	// performs the focus.

	/** Navigator that, given the current element, focuses the next one. */
	type RovingNavigator = (
		origin: Element | null | undefined,
	) => HTMLElement | null;

	/**
	 * Per-component focus rule. Receives a candidate element and a
	 * `fallback` navigator to continue walking; returns the element
	 * that actually received focus, or `null` if the candidate was
	 * rejected and the caller should give up.
	 */
	type RovingFocusCallback = (
		node: Element | null | undefined,
		fallback: RovingNavigator,
	) => HTMLElement | null;

	/** Given a focus rule, produces a `[next, previous]` pair. */
	type Roving = (
		focus: RovingFocusCallback,
	) => [RovingNavigator, RovingNavigator];

	/** Narrow: element is an `HTMLElement` (not text/comment/SVG). */
	const isElement = (el: unknown): el is HTMLElement =>
		el instanceof HTMLElement;

	/**
	 * Narrow: element is a `<button>` and (optionally) its ID starts
	 * with a specific prefix. The prefix check gates behaviour by ID
	 * convention without touching classes or data attributes.
	 */
	const isTrigger = (el: unknown, prefix?: string): el is HTMLButtonElement =>
		el instanceof HTMLButtonElement && (!prefix || el.id.startsWith(prefix));

	/** Narrow: element is a native `<dialog>` (the Dialog content). */
	const isDialog = (el: unknown): el is HTMLDialogElement =>
		el instanceof HTMLDialogElement;

	/**
	 * Narrow: element is an **enabled** `menuitem*` (role `menuitem`,
	 * `menuitemcheckbox`, or `menuitemradio`). Disabled items are
	 * rejected so the roving navigator naturally skips them.
	 */
	const isMenuItem = (el: unknown): el is HTMLElement =>
		isElement(el) &&
		el.role?.startsWith("menuitem") === true &&
		el.ariaDisabled !== "true";

	/**
	 * Look up the content element referenced by an ARIA relationship
	 * attribute (`aria-controls` for most components, `aria-describedby`
	 * for Tooltip). Returns `null` when the attribute is missing or
	 * the ID is dangling.
	 */
	const getContent = (el: HTMLElement, attr: string) => {
		const id = el.getAttribute(attr);
		return id ? document.getElementById(id) : null;
	};

	/**
	 * Walk up the DOM to the nearest ancestor whose `id` begins with
	 * `prefix`. Used to answer questions like "is this event target
	 * inside a menu popover?" without per-component listeners or data
	 * attributes.
	 */
	const findAncestor = (
		el: HTMLElement | null,
		prefix: string,
	): HTMLElement | null => {
		while (el) {
			if (el.id.startsWith(prefix)) return el;
			el = el.parentElement;
		}
		return null;
	};

	/**
	 * Publish the trigger's bounding rect and the content's own size
	 * as CSS custom properties on the content element. Popovers (Menu,
	 * Popover, Tooltip) position themselves from these vars entirely
	 * in CSS; no JS layout math. Returns the rect so callers that
	 * also need it (Menu safety triangle) avoid a second measurement.
	 */
	const position = (trigger: HTMLElement, content: HTMLElement) => {
		const rect = trigger.getBoundingClientRect();
		content.style.setProperty("--top", `${rect.top}px`);
		content.style.setProperty("--right", `${rect.right}px`);
		content.style.setProperty("--bottom", `${rect.bottom}px`);
		content.style.setProperty("--left", `${rect.left}px`);
		content.style.setProperty("--pw", `${content.offsetWidth}px`);
		content.style.setProperty("--ph", `${content.offsetHeight}px`);
		return rect;
	};

	/**
	 * Generic circular navigator factory. Given a focus rule, produces
	 * a `next`/`previous` pair that walks siblings and wraps via
	 * `parentElement.firstElementChild` / `lastElementChild` at the
	 * ends. The rule decides which siblings are valid targets and
	 * whether to continue walking (by calling the `fallback` navigator
	 * it is passed).
	 */
	const roving: Roving = (focus) => {
		const next: RovingNavigator = (origin) =>
			origin
				? focus(
						origin.nextElementSibling ||
							origin.parentElement?.firstElementChild,
						next,
					)
				: null;
		const previous: RovingNavigator = (origin) =>
			origin
				? focus(
						origin.previousElementSibling ||
							origin.parentElement?.lastElementChild,
						previous,
					)
				: null;
		return [next, previous];
	};

	/**
	 * Roving rule for menus. Called with the `<li role="none">` wrapper;
	 * the candidate menuitem is its first child. The rule has three
	 * behaviour modes selected by module state:
	 *
	 * 1. **Radio sweep** (`shouldResetRadio !== null`). Clear
	 *    `aria-checked` on same-group radios, stopping only when the
	 *    activated item is reached. `radioHeadDone` / `radioTailChain`
	 *    track the wrap-around so separators correctly partition
	 *    groups.
	 * 2. **Typeahead** (`shouldMatchLetter !== null`). Focus the first
	 *    enabled menuitem whose text starts with the typed letter.
	 * 3. **Plain roving**. Focus the next enabled menuitem.
	 *
	 * `rovingBoundary` is set to the first candidate this rule
	 * rejects; if the walker returns to it without finding a match we
	 * bail, preventing an infinite loop when no candidate qualifies
	 * (all disabled, or typeahead with no match).
	 */
	const menuRoving: RovingFocusCallback = (element, fallback) => {
		if (isElement(element)) {
			const menuitem = element.firstElementChild;
			if (shouldResetRadio) {
				if (isElement(menuitem)) {
					// Reached the activated item: flush the buffered tail and
					// stop sweeping.
					if (menuitem === shouldResetRadio) {
						for (const item of radioTailChain) item.ariaChecked = "false";
						return menuitem;
					}
					if (menuitem.role === "menuitemradio") {
						if (!radioHeadDone) {
							// Still walking the head (pre-boundary): clear
							// immediately.
							menuitem.ariaChecked = "false";
						} else {
							// Post-wrap: buffer so we don't clear items past the
							// activated one if the group ends before we reach it.
							radioTailChain.push(menuitem);
						}
						return fallback(element);
					}
				}
				// Hit a separator or non-radio: group boundary.
				radioHeadDone = true;
				radioTailChain = [];
				return fallback(element);
			}
			if (
				isMenuItem(menuitem) &&
				(!shouldMatchLetter ||
					menuitem.textContent?.toLowerCase().startsWith(shouldMatchLetter))
			) {
				menuitem.focus();
				shouldPreventDefault = true;
				return menuitem;
			} else if (rovingBoundary !== element) {
				if (!rovingBoundary) rovingBoundary = element;
				return fallback(element);
			} else {
				// Full revolution without a match; give up.
				rovingBoundary = null;
			}
		}
		return null;
	};

	/**
	 * Roving rule for Accordion. The candidate is an Item; the actual
	 * trigger lives two levels deep (`Item > Header > Trigger`).
	 * Disabled triggers are skipped, but they still count as "visited"
	 * for wrap-around detection (`rovingBoundary`).
	 */
	const accordionRoving: RovingFocusCallback = (node, fallback) => {
		if (isElement(node)) {
			if (rovingBoundary === node) return null;
			if (!rovingBoundary) rovingBoundary = node;
			const trigger = node.firstElementChild?.firstElementChild;
			if (isTrigger(trigger, Prefix.TriggerAccordion)) {
				if (trigger.ariaDisabled === "true") return fallback(node);
				shouldPreventDefault = true;
				trigger.focus();
				return trigger;
			}
		}
		return fallback(node);
	};

	/**
	 * Roving rule for Tabs. Tab buttons are direct children of the
	 * List, so the candidate *is* the trigger. Disabled tabs are
	 * skipped but count toward wrap-around detection.
	 */
	const tabsRoving: RovingFocusCallback = (node, fallback) => {
		if (isTrigger(node, Prefix.TriggerTabs)) {
			if (rovingBoundary === node) return null;
			if (!rovingBoundary) rovingBoundary = node;
			if (node.ariaDisabled === "true") return fallback(node);
			shouldPreventDefault = true;
			node.focus();
			return node;
		} else {
			return fallback(node);
		}
	};

	const [menuNext, menuPrevious] = roving(menuRoving);
	const [accordionNext, accordionPrevious] = roving(accordionRoving);
	const [tabNext, tabPrevious] = roving(tabsRoving);

	/**
	 * Toggle a disclosure-style trigger/panel pair. Used directly by
	 * Collapsible and as a building block for Accordion.
	 */
	const collapsible = (trigger: HTMLElement) => {
		const content = getContent(trigger, "aria-controls");
		if (content) {
			const isOpen = trigger.ariaExpanded !== "true";
			trigger.ariaExpanded = isOpen ? "true" : "false";
			content.ariaHidden = isOpen ? "false" : "true";
			isOpen
				? content.removeAttribute("hidden")
				: content.setAttribute("hidden", "");
		}
	};

	/**
	 * Accordion toggle. Defers to {@link collapsible} for the open/close
	 * mechanics and adds Accordion-specific behaviour:
	 *
	 * - Disabled triggers are no-ops.
	 * - Closing an open item never needs to touch siblings.
	 * - In `data-mode="single"`, opening an item first closes any
	 *   other open item in the same root.
	 */
	const accordion = (trigger: HTMLElement) => {
		if (trigger.ariaDisabled === "true") return;
		if (trigger.ariaExpanded === "true") {
			collapsible(trigger);
		} else {
			const root = findAncestor(trigger, Prefix.RootAccordion);
			if (!root || root.getAttribute("data-mode") !== "single") {
				collapsible(trigger);
			} else {
				// Single mode: walk siblings once, toggling either the
				// trigger we're opening or any item that was already open.
				let item = root.firstElementChild;
				while (item) {
					const itemTrigger = item.firstElementChild?.firstElementChild;
					if (
						isElement(itemTrigger) &&
						(itemTrigger === trigger || itemTrigger.ariaExpanded === "true")
					) {
						collapsible(itemTrigger);
					}
					item = item.nextElementSibling;
				}
			}
		}
	};

	/**
	 * Tabs activation. Walks siblings once, toggling the clicked tab
	 * on and the previously selected tab off. Updates `aria-selected`,
	 * `tabindex`, `aria-hidden`, and the panel's `hidden` attribute.
	 * Panels with a `tabindex` attribute (focusable panels) get their
	 * index flipped between `0` and `-1` as well.
	 */
	const tabs = (trigger: HTMLElement) => {
		if (trigger.ariaDisabled !== "true" && trigger.ariaSelected !== "true") {
			let tab = trigger.parentElement?.firstElementChild;
			while (isElement(tab)) {
				if (tab === trigger || tab.ariaSelected === "true") {
					const content = getContent(tab, "aria-controls");
					if (content) {
						const isSelected = tab.ariaSelected !== "true";
						tab.ariaSelected = isSelected ? "true" : "false";
						tab.tabIndex = isSelected ? 0 : -1;
						content.ariaHidden = isSelected ? "false" : "true";
						if (content.hasAttribute("tabindex"))
							content.tabIndex = isSelected ? 0 : -1;
						isSelected
							? content.removeAttribute("hidden")
							: content.setAttribute("hidden", "");
					}
				}
				tab = tab.nextElementSibling;
			}
		}
	};

	/**
	 * Menu toggle. Opens or closes the popover attached to `trigger`
	 * and updates `menuPopovers` / safety-triangle state. The `mode`
	 * parameter controls where focus lands on open:
	 *
	 * - `Focus.Trigger`: stay on the trigger (mouse opens).
	 * - `Focus.First`: focus the first menuitem (keyboard opens).
	 * - `Focus.Last`: focus the last menuitem (ArrowUp on closed).
	 * - `Focus.None`: don't touch focus (submenu hover opens;
	 *   menubar chord-switching).
	 *
	 * When closing, `Focus.None` also suppresses the usual
	 * "return focus to trigger" behaviour.
	 */
	const menu = (trigger: HTMLElement | undefined, mode = Focus.Trigger) => {
		if (trigger?.id.startsWith(Prefix.TriggerMenu)) {
			const content = getContent(trigger, "aria-controls");
			if (content) {
				if (trigger.ariaExpanded === "true") {
					// Closing. Clear safety-triangle state (the submenu that
					// created it is going away).
					if (safeGroup) safeGroup.removeAttribute("data-safe");
					safeGroup = null;
					safeContent = null;
					safePopoverRect = null;
					if (mode !== Focus.None) trigger.focus();
					content.hidePopover();
					trigger.ariaExpanded = "false";
					content.ariaHidden = "true";
				} else {
					// Opening. Push onto the stack and publish position.
					menuPopovers.push(trigger);
					content.showPopover();
					trigger.ariaExpanded = "true";
					content.ariaHidden = "false";
					const rect = position(trigger, content);
					const group = trigger.parentElement;
					if (group) {
						// The Group element is the projection surface for the
						// safety triangle; its rect is measured lazily later.
						safeGroup = group;
						safeRect = rect;
						safeContent = content;
						safePopoverRect = null;
					}
					if (mode === Focus.Trigger) {
						trigger.focus();
					} else if (mode === Focus.First) {
						menuRoving(content.firstElementChild, menuNext);
					} else if (mode === Focus.Last) {
						menuRoving(content.lastElementChild, menuPrevious);
					}
				}
			}
		}
	};

	/**
	 * Close open menus from the top of the stack down, leaving the
	 * first `keep` entries untouched. Passing `0` (default) closes all.
	 */
	const menuHideAll = (keep = 0) => {
		while (menuPopovers[keep]) menu(menuPopovers.pop(), Focus.None);
	};

	/**
	 * Handle a click on a menuitem. For checkbox items, toggle
	 * `aria-checked`. For radio items, run the radio sweep via
	 * `menuNext` starting from the activated item's parent (which
	 * will visit adjacent siblings and clear their `aria-checked`),
	 * then mark this item checked. For plain items, close all menus.
	 *
	 * Radio groups are defined by DOM adjacency. Any separator or
	 * non-radio item breaks the group. See `menuRoving` for the sweep
	 * state machine.
	 */
	const menuItemAction = (el: HTMLElement) => {
		if (el.role === "menuitemcheckbox") {
			el.ariaChecked = el.ariaChecked === "true" ? "false" : "true";
		} else if (el.role === "menuitemradio") {
			shouldResetRadio = el;
			radioHeadDone = null;
			radioTailChain = [];
			menuNext(el.parentElement);
			shouldResetRadio = null;
			el.ariaChecked = "true";
		} else {
			menuHideAll();
		}
	};

	/**
	 * Popover show/hide. Opening closes any other open popover first
	 * (popovers are mutually exclusive). `popoverOpen` tracks the
	 * currently open trigger so it can be closed from other handlers
	 * (Escape, scroll, click outside, focusout).
	 */
	const popover = (trigger: HTMLElement, show: boolean) => {
		if ((trigger.ariaExpanded === "true") === show) return;
		const content = getContent(trigger, "aria-controls");
		if (content) {
			if (show) {
				if (popoverOpen && popoverOpen !== trigger) popover(popoverOpen, false);
				content.showPopover();
				trigger.ariaExpanded = "true";
				content.ariaHidden = "false";
				position(trigger, content);
				popoverOpen = trigger;
			} else {
				content.hidePopover();
				trigger.ariaExpanded = "false";
				content.ariaHidden = "true";
				if (popoverOpen === trigger) popoverOpen = null;
			}
		}
	};

	/**
	 * Tooltip show/hide. Thin wrapper around the Popover API that
	 * publishes position on show. Does **not** update
	 * `aria-expanded`. Tooltips are associated via `aria-describedby`
	 * and are always announced by screen readers regardless of
	 * visibility.
	 */
	const tooltip = (trigger: HTMLElement, show: boolean) => {
		const content = getContent(trigger, "aria-describedby");
		if (content) {
			if (show) {
				content.showPopover();
				position(trigger, content);
			} else {
				content.hidePopover();
			}
		}
	};

	/**
	 * Reconcile tooltip visibility with hover/focus state. Called
	 * after any change to `tooltipHovered`, `tooltipFocused`, or
	 * `tooltipSuppressed`. Chooses the active trigger (hover beats
	 * focus), clears stale suppression, and transitions the visible
	 * tooltip in one step.
	 */
	const tooltipSync = () => {
		// Suppression lapses once the user moves to a different trigger.
		if (
			tooltipSuppressed &&
			tooltipSuppressed !== tooltipHovered &&
			tooltipSuppressed !== tooltipFocused
		) {
			tooltipSuppressed = null;
		}
		const active = tooltipHovered ?? tooltipFocused;
		const next = active && active !== tooltipSuppressed ? active : null;
		if (next !== tooltipShown) {
			if (tooltipShown) tooltip(tooltipShown, false);
			if (next) tooltip(next, true);
			tooltipShown = next;
		}
	};

	/**
	 * Open the `<dialog>` referenced by `trigger`'s `aria-controls`,
	 * as a true modal via `showModal()`. No-op if another dialog is
	 * already open or the controlled element isn't a `<dialog>`.
	 *
	 * Initial focus is the user agent's responsibility: the HTML
	 * spec's "dialog focusing steps" pick autofocus, then first
	 * focusable, then the dialog itself. We do not second-guess.
	 *
	 * Labeling and description are entirely the wrapper's concern:
	 * the React/Vue `Content` components inspect their incoming
	 * props and only emit `aria-labelledby`/`aria-describedby` when
	 * the user hasn't supplied an alternative. Bare-HTML consumers
	 * are responsible for writing correct ARIA themselves.
	 *
	 * The triggering button is remembered so `dialogClose` returns
	 * focus to it.
	 *
	 * The guard checks `.open`, not just the reference: a dialog can
	 * close behind our back (a `form method="dialog"` submit, user
	 * code calling `close()`), and per the DOM-as-state rule the
	 * element, never the module variable, is the truth. Stale state
	 * is simply overwritten by the next open.
	 */
	const dialogOpenFor = (trigger: HTMLElement) => {
		if (dialogContent?.open) return;
		const content = getContent(trigger, "aria-controls");
		if (!isDialog(content)) return;
		dialogContent = content;
		dialogTrigger = trigger;
		content.showModal();
	};

	/**
	 * Close the open dialog and return focus to its trigger. State is
	 * cleared *before* `close()` so anything observing module state
	 * sees consistent values regardless of when the (queued) `close`
	 * event fires. The `.open` guard keeps a natively-closed dialog
	 * (see `dialogOpenFor`) from stealing focus back to a stale
	 * trigger.
	 */
	const dialogClose = () => {
		if (!dialogContent?.open || !dialogTrigger) return;
		const content = dialogContent;
		const trigger = dialogTrigger;
		dialogContent = null;
		dialogTrigger = null;
		content.close();
		trigger.focus();
	};

	/**
	 * Click dispatcher. Walks from the event target up the DOM looking
	 * for a recognised prefix, then dispatches to the right primitive.
	 *
	 * `event.detail === 0` distinguishes keyboard-activated clicks
	 * (browser synthesises a click on Enter/Space) from real mouse
	 * clicks. Menu triggers use this to decide whether to focus the
	 * first item on open (keyboard) or stay on the trigger (mouse).
	 *
	 * The walk terminates at the first prefix match or when it runs
	 * out of ancestors. A walk that reaches the root without matching
	 * means the user clicked outside any open component. Close
	 * everything open.
	 */
	addEventListener("click", (event: MouseEvent) => {
		shouldPreventDefault = null;
		const keyboard = event.detail === 0;

		// Event target may be a text node or SVGElement; normalise to
		// the nearest HTMLElement.
		const start: HTMLElement | null = isElement(event.target)
			? event.target
			: event.target instanceof Element
				? event.target.parentElement
				: null;

		if (start) {
			let target: HTMLElement | null = start;

			while (target) {
				const id = target.id;

				if (id.startsWith(Prefix.Trigger)) {
					if (id.startsWith(Prefix.TriggerMenu)) {
						// Clicking a menu trigger closes any open popover first.
						if (popoverOpen) popover(popoverOpen, false);
						const focusMode = keyboard ? Focus.First : Focus.None;
						const inPopover = findAncestor(
							target.parentElement,
							Prefix.ContentMenu,
						);
						if (inPopover) {
							// Submenu trigger inside an open menu. Hover has
							// usually already opened it; guard against double-open.
							if (!menuPopovers.includes(target)) menu(target, focusMode);
						} else {
							// Root trigger. If a different root is already open,
							// close it before opening this one. Clicking the same
							// root trigger again toggles it closed.
							if (menuPopovers[0]) {
								const openTarget = target !== menuPopovers[0];
								menuHideAll();
								if (openTarget) menu(target, focusMode);
							} else {
								menu(target, focusMode);
							}
						}
					} else {
						// Non-menu trigger: a menu being open is just a foreign
						// interaction, close it.
						if (menuPopovers[0]) menuHideAll();
						if (id.startsWith(Prefix.TriggerAccordion)) accordion(target);
						else if (id.startsWith(Prefix.TriggerCollapsible))
							collapsible(target);
						else if (id.startsWith(Prefix.TriggerTabs)) tabs(target);
						else if (id.startsWith(Prefix.TriggerDialogClose)) dialogClose();
						else if (
							id.startsWith(Prefix.TriggerDialog) &&
							target.ariaDisabled !== "true"
						) {
							// Modal opens on top: dismiss any transient overlays
							// so they don't hide behind the backdrop.
							if (popoverOpen) popover(popoverOpen, false);
							if (tooltipShown) {
								tooltipSuppressed = tooltipShown;
								tooltipSync();
							}
							dialogOpenFor(target);
						} else if (
							id.startsWith(Prefix.TriggerPopover) &&
							target.ariaDisabled !== "true"
						) {
							const isOpen = target.ariaExpanded === "true";
							popover(target, !isOpen);
							// On open: move focus into the panel. On close: return
							// focus to the trigger.
							isOpen
								? target.focus()
								: getContent(target, "aria-controls")?.focus();
						} else if (id.startsWith(Prefix.TriggerTooltip) && tooltipShown) {
							// Clicking a tooltip's trigger suppresses the tooltip
							// until the user moves away. Prevents the tooltip
							// from fighting the click's UI change.
							tooltipSuppressed = tooltipShown;
							tooltipSync();
						}
					}
					break;
				} else if (id.startsWith(Prefix.ContentMenu) && menuPopovers[0]) {
					// Click landed inside a menu popover. Walk from the real
					// event target up to this popover, looking for a menuitem.
					let el: HTMLElement | null = start;
					while (el && el !== target) {
						if (isMenuItem(el) && !isTrigger(el, Prefix.TriggerMenu)) {
							menuItemAction(el);
							break;
						}
						el = el.parentElement;
					}
					break;
				} else if (id.startsWith(Prefix.ContentPopover)) {
					// Click inside an open popover panel: leave it open.
					break;
				} else if (id.startsWith(Prefix.ContentTooltip)) {
					// Click inside tooltip content (e.g. during a
					// screen-reader interaction): ignore.
					break;
				} else if (id.startsWith(Prefix.ContentDialog)) {
					// Click inside dialog content: leave it open.
					break;
				}

				target = target.parentElement;
			}

			// The walk fell off the top of the tree; click was "outside"
			// every known component. Dismiss anything open.
			//
			// Dialog is intentionally absent: it's a true modal opened
			// via `showModal()`, so the rest of the page is `inert` and
			// background clicks can't fire here in the first place.
			// Backdrop clicks land on the `<dialog>` itself (matching
			// `Prefix.ContentDialog`) and break above without dismissing.
			if (!target) {
				if (menuPopovers[0]) menuHideAll();
				if (popoverOpen) popover(popoverOpen, false);
			}
		}

		if (shouldPreventDefault) event.preventDefault();
	});

	/**
	 * Pointer-move dispatcher. Two concerns:
	 *
	 * 1. **Tooltip hover state.** When the pointer enters a tooltip
	 *    trigger, show the tooltip; when it leaves, hide. The pointer
	 *    moving over tooltip *content* is ignored, so leaving the
	 *    trigger via the tooltip does not flicker-close.
	 * 2. **Menu safety triangle + submenu switching.** When a submenu
	 *    is open and the pointer is inside the submenu-trigger rect,
	 *    paint the triangle. When the pointer lands on a *different*
	 *    submenu trigger, switch menus.
	 *
	 * Touch is ignored outright; hover has no meaning there.
	 */
	addEventListener("pointermove", (event: PointerEvent) => {
		if (event.pointerType === "touch") return;
		if (
			isElement(event.target) &&
			!findAncestor(event.target, Prefix.ContentTooltip)
		) {
			const nextHover = findAncestor(event.target, Prefix.TriggerTooltip);
			if (nextHover !== tooltipHovered) {
				tooltipHovered = nextHover;
				tooltipSync();
			}
		}
		if (menuPopovers[0]) {
			if (menuPopovers[1] && safeGroup && safeRect && safeContent) {
				// Inside the trigger rect: publish rect + cursor as CSS vars
				// so the clip-path can paint a direction-agnostic triangle.
				if (
					event.clientX >= safeRect.left &&
					event.clientX <= safeRect.right &&
					event.clientY >= safeRect.top &&
					event.clientY <= safeRect.bottom
				) {
					// Measure lazily: the submenu is subject to
					// @starting-style transforms, and measuring at open time
					// would capture the pre-transform rect.
					safePopoverRect = safeContent.getBoundingClientRect();
					safeGroup.style.setProperty("--left", `${safePopoverRect.left}px`);
					safeGroup.style.setProperty("--right", `${safePopoverRect.right}px`);
					safeGroup.style.setProperty("--top", `${safePopoverRect.top}px`);
					safeGroup.style.setProperty(
						"--bottom",
						`${safePopoverRect.bottom}px`,
					);
					safeGroup.style.setProperty("--x", `${event.clientX}px`);
					safeGroup.style.setProperty("--y", `${event.clientY}px`);
					if (!safeGroup.hasAttribute("data-safe"))
						safeGroup.setAttribute("data-safe", "");
				} else if (
					safeGroup.hasAttribute("data-safe") &&
					safePopoverRect &&
					// Leaving the trigger rect. Keep the triangle only if the
					// cursor is still over the Group *and* moving toward the
					// submenu (sign of horizontal movement matches the side
					// the submenu sits on).
					(event.target !== safeGroup ||
						(safePopoverRect.left - safeRect.right) * event.movementX < 0)
				) {
					safeGroup.removeAttribute("data-safe");
				}
			}
			const el = event.target;

			if (isElement(el)) {
				// Walk up the ancestors of the pointer target, collecting
				// every menu trigger along the way. Triggers are found
				// either directly (hovering the button) or via the
				// `aria-labelledby` back-pointer on any popover we cross.
				// We'll compare this chain against `menuPopovers` to
				// decide whether to switch submenus.
				const popoverTriggers: HTMLButtonElement[] = [];
				let target: HTMLElement | null = el;
				let bail = false;
				let foundItem = false;

				while (target) {
					if (isMenuItem(target)) {
						foundItem = true;
					}
					// Pointer landed inside popover content without hitting a
					// menuitem first; it's over chrome, not an item. Don't
					// switch menus.
					if (!foundItem && target.id.startsWith(Prefix.Content)) {
						bail = true;
						break;
					}
					if (isTrigger(target, Prefix.TriggerMenu)) {
						popoverTriggers.unshift(target);
					} else if (target.id.startsWith(Prefix.ContentMenu)) {
						const trigger = getContent(target, "aria-labelledby");
						if (isTrigger(trigger, Prefix.TriggerMenu)) {
							popoverTriggers.unshift(trigger);
						}
					}
					target = target.parentElement;
				}

				if (!bail && popoverTriggers[0]) {
					// Find the first divergence between the open stack and
					// the hovered chain. Everything above it must close; the
					// submenu at the divergence point opens.
					let i = 0;
					while (menuPopovers[i] && menuPopovers[i] === popoverTriggers[i]) i++;
					if (
						i === 0 &&
						(popoverTriggers[0].role !== "menuitem" ||
							// Menubar edge case: hovering a sibling menubar-item
							// while a menu is open should switch menus, but only
							// when they share a menubar parent.
							popoverTriggers[0].parentElement?.parentElement !==
								menuPopovers[0].parentElement?.parentElement)
					)
						return;
					menuHideAll(i);
					menu(popoverTriggers[i], Focus.None);
				}
			}
		}
	});

	/**
	 * Keyboard dispatcher. Handles arrow-key navigation, typeahead,
	 * and Escape. Activation (Enter/Space) is **not** handled here.
	 * It flows through the `click` listener via the browser's
	 * synthetic click on Enter/Space.
	 *
	 * Three independent branches:
	 *
	 * 1. Accordion trigger: vertical roving.
	 * 2. Tabs trigger: horizontal or vertical roving per orientation.
	 * 3. Menu trigger or menuitem: complex multi-level handling.
	 *
	 * Finally, Escape is handled globally.
	 */
	addEventListener("keydown", (event: KeyboardEvent) => {
		shouldPreventDefault = null;
		shouldMatchLetter = null;
		rovingBoundary = null;

		const target = event.target;

		if (isTrigger(target, Prefix.TriggerAccordion)) {
			const item = target.parentElement?.parentElement;
			if (item) {
				switch (event.key) {
					case "ArrowDown":
						accordionNext(item);
						break;
					case "ArrowUp":
						accordionPrevious(item);
						break;
					case "Home": {
						const root = item.parentElement;
						if (root) accordionRoving(root.firstElementChild, accordionNext);
						break;
					}
					case "End": {
						const root = item.parentElement;
						if (root) accordionRoving(root.lastElementChild, accordionPrevious);
						break;
					}
				}
			}
		} else if (isTrigger(target, Prefix.TriggerTabs)) {
			const vertical = target.parentElement?.ariaOrientation === "vertical";
			switch (event.key) {
				case "ArrowDown":
					if (vertical) tabNext(target);
					break;
				case "ArrowUp":
					if (vertical) tabPrevious(target);
					break;
				case "ArrowRight":
					if (!vertical) tabNext(target);
					break;
				case "ArrowLeft":
					if (!vertical) tabPrevious(target);
					break;
				case "Home":
					tabsRoving(target.parentElement?.firstElementChild, tabNext);
					break;
				case "End":
					tabsRoving(target.parentElement?.lastElementChild, tabPrevious);
					break;
			}
		} else {
			// Menu keyboard handling. A menu trigger that isn't inside a
			// content popover is a "root" trigger (menubar item or
			// standalone). Arrow keys on root triggers open the menu; on
			// already-open menus they navigate items.
			if (isTrigger(target, Prefix.TriggerMenu)) {
				const isRootTrigger = findAncestor(target, Prefix.ContentMenu) === null;

				switch (event.key) {
					case "ArrowDown":
						if (isRootTrigger) {
							if (target.ariaExpanded !== "true") {
								menu(target, Focus.First);
							} else {
								const content = getContent(target, "aria-controls");
								if (content) menuRoving(content.firstElementChild, menuNext);
							}
						}
						break;
					case "ArrowUp":
						if (isRootTrigger) {
							if (target.ariaExpanded !== "true") {
								menu(target, Focus.Last);
							} else {
								const content = getContent(target, "aria-controls");
								if (content) menuRoving(content.lastElementChild, menuPrevious);
							}
						}
						break;
					case "ArrowRight":
						// ArrowRight on a submenu trigger opens that submenu.
						// ArrowRight on a root trigger is handled below (menubar
						// move).
						if (!isRootTrigger) menu(target, Focus.First);
						break;
				}
			}

			// Menuitem-level navigation. `shouldPreventDefault` is set by
			// the menu-trigger branch above when it did something;
			// honouring it here prevents double-handling.
			if (
				!shouldPreventDefault &&
				isElement(target) &&
				target.role?.startsWith("menuitem") &&
				target.parentElement
			) {
				const parent = target.parentElement;
				// Walk menubar moves at the root level, not the submenu we
				// happen to be inside.
				const menubarRoot = menuPopovers[0]?.parentElement || parent;

				const inPopover = findAncestor(
					target.parentElement,
					Prefix.ContentMenu,
				);

				switch (event.key) {
					case "Tab":
						// Tab away from the menubar closes it entirely, leaving
						// focus on the root trigger for the next Tab to handle.
						if (menuPopovers[0]) menuPopovers[0].focus();
						menuHideAll();
						break;
					case "ArrowDown":
						if (inPopover) menuNext(parent);
						break;
					case "ArrowUp":
						if (inPopover) menuPrevious(parent);
						break;
					case "ArrowRight": {
						const nextNode = menuNext(menubarRoot);
						if (nextNode) {
							// In menubar mode with a menu open: move focus to the
							// next menubar item AND keep a menu open there.
							const hadOpenMenu = menuPopovers[0];
							menuHideAll();
							if (hadOpenMenu && isTrigger(nextNode, Prefix.TriggerMenu)) {
								menu(nextNode, Focus.None);
							}
						}
						break;
					}
					case "ArrowLeft":
						// Inside a submenu: ArrowLeft closes this submenu and
						// returns focus to its trigger. At the root level: move
						// to the previous menubar item.
						if (menuPopovers[1]) {
							menu(menuPopovers.pop(), Focus.Trigger);
						} else {
							const nextNode = menuPrevious(menubarRoot);
							if (nextNode) {
								const hadOpenMenu = menuPopovers[0];
								menuHideAll();
								if (hadOpenMenu && isTrigger(nextNode, Prefix.TriggerMenu)) {
									menu(nextNode, Focus.None);
								}
							}
						}
						break;
					case "Home":
						menuRoving(parent.parentElement?.firstElementChild, menuNext);
						break;
					case "End":
						menuRoving(parent.parentElement?.lastElementChild, menuPrevious);
						break;
					default:
						if (/^[a-zA-Z]$/.test(event.key)) {
							// Typeahead: menuRoving reads `shouldMatchLetter`.
							shouldMatchLetter = event.key.toLowerCase();
							menuNext(parent);
						}
						break;
				}
			}
		}

		// Global Escape. Closes the topmost menu (returning focus to its
		// trigger), closes any open popover (returning focus to its
		// trigger), closes any open dialog, and suppresses the visible
		// tooltip.
		if (event.key === "Escape") {
			if (menuPopovers[0]) menu(menuPopovers.pop(), Focus.Trigger);
			if (popoverOpen) {
				const trigger = popoverOpen;
				popover(trigger, false);
				trigger.focus();
			}
			if (dialogContent) dialogClose();
			if (tooltipShown) {
				tooltipSuppressed = tooltipShown;
				tooltipSync();
			}
		}

		if (shouldPreventDefault) event.preventDefault();
	});

	/**
	 * Scroll handler: listens in the capture phase to catch scrolls
	 * on nested scroll containers. Closes any menu/popover/tooltip
	 * whose anchor has just been moved under its open rect (unless
	 * the scroll is *inside* the open content itself, which is fine).
	 */
	addEventListener(
		"scroll",
		(event) => {
			// Ancestor walk, matching the popover check below: a scroll
			// inside any descendant of the popover (a nested scrollable
			// region, not just the list itself) must not dismiss.
			if (
				menuPopovers[0] &&
				!(
					isElement(event.target) &&
					findAncestor(event.target, Prefix.ContentMenu)
				)
			) {
				menuHideAll();
			}
			if (
				popoverOpen &&
				!(
					isElement(event.target) &&
					findAncestor(event.target, Prefix.ContentPopover)
				)
			) {
				popover(popoverOpen, false);
			}
			if (tooltipShown) {
				tooltipHovered = null;
				tooltipFocused = null;
				tooltipSync();
			}
		},
		true,
	);

	/**
	 * Viewport resize: any position anchored to a trigger rect is
	 * potentially invalidated. Simpler to close everything than to
	 * reposition.
	 */
	addEventListener("resize", () => {
		if (menuPopovers[0]) menuHideAll();
		if (popoverOpen) popover(popoverOpen, false);
		if (tooltipShown) {
			tooltipHovered = null;
			tooltipFocused = null;
			tooltipSync();
		}
	});

	/**
	 * Focus enter: show a tooltip when focus moves onto its trigger
	 * (keyboard users get tooltips too). `focusin` bubbles, unlike
	 * `focus`, so one listener covers the whole document.
	 */
	addEventListener("focusin", (event: FocusEvent) => {
		const target = event.target;
		if (isTrigger(target, Prefix.TriggerTooltip)) {
			if (tooltipFocused !== target) {
				tooltipFocused = target;
				tooltipSync();
			}
		} else if (tooltipFocused) {
			tooltipFocused = null;
			tooltipSync();
		}
	});

	/**
	 * Focus exit: close the popover when focus leaves it entirely,
	 * and clear tooltip-focused state when focus leaves the page.
	 *
	 * `relatedTarget` is the element receiving focus next. Being
	 * inside the popover's content means the user Tab-ed into an
	 * interactive child; don't close in that case.
	 */
	addEventListener("focusout", (event: FocusEvent) => {
		if (
			popoverOpen &&
			isElement(event.relatedTarget) &&
			popoverOpen !== event.relatedTarget &&
			!getContent(popoverOpen, "aria-controls")?.contains(event.relatedTarget)
		) {
			popover(popoverOpen, false);
		}
		if (
			tooltipFocused &&
			event.target === tooltipFocused &&
			!event.relatedTarget
		) {
			tooltipFocused = null;
			tooltipSync();
		}
	});
}
