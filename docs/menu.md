# Menu and Menubar

How `src/menu.ts` works. Shared mechanisms (roving boundary, RTL
key mirror, positioning, resize and scroll) live in `docs/dom.md`;
the wrapper-side menubar tab stop lives in `docs/wrappers.md`.

## State

**Array-as-nullable-stack.** `menuStack[0]` is "is any menu
open?", `menuStack[1]` is "is a submenu open?", `menuStack.pop()`
closes the topmost. No `.length` check, no parallel `openMenu:
HTMLElement | null` variable, no wrapper type. One array doubles
as flag, stack, and cursor.

**`menu(trigger, mode: Focus)` is the one open/close primitive.**
`Focus.Trigger` closes and focuses the trigger, `Focus.First` /
`Focus.Last` open and rove in (or, on an already-open menu, only
rove in), `Focus.None` opens or closes without moving focus into
the surface. `menuOpen` is the pointer and root-button primitive:
close everything if the trigger is the stack root, do nothing if
it is already elsewhere in the stack, otherwise open it (`menu`
first trims). `menuCloseAll` pops the stack down to `keep`
entries, none by default.

## Pointer

**Pointer session.** A menu gesture is a pointer session, not a
click. `pointerdown` on a trigger calls `menuOpen` (a root trigger
toggles; an already-open submenu trigger is a no-op);
`pointerdown` outside dismisses; `pointerup` on a plain menuitem
activates. Non-primary buttons (`button !== 0`) are ignored. The
trailing `click` is left alone: other components dispatch on
their own ID prefixes, so a click that started on `mct:menu:`
does not toggle a disclosure, and a real press on a disclosure
has its own `pointerdown`, which already closed the menu.
Playwright's `.click()` still works: it fires `pointerdown`. A
menu opening outside a popover closes it in the same event (see
`docs/popover.md`).

**Walks break on `mct:menu:` before activation.** The `click`
walk stops at `mct:menu:` (and `mcc:menu:`) before it tests for
a menuitem. The `pointerup` walk stops at `mcc:menu:` and skips
activation when the item itself is `mct:menu:`. A submenu
trigger that is also a link never activates as an item.

**Hover focuses and paints.** `pointermove` focuses the enabled
item under the pointer (React Aria / Base UI) so Arrow keys
continue from there; `data-highlighted` follows that item through
`menuHighlight`. Only an enabled item is painted. Leaving the
menu, or hovering a disabled item, label, or separator, leaves
`data-highlighted` on the last item so keyboard still has a
visible current item. Hovering a submenu trigger opens its
submenu with `Focus.None`; hovering any other item closes an open
submenu; hovering a sibling menubar trigger switches the open
menu. Hover can leave focus inside the popover; see "Focus
ownership".

**Safety triangle in JS.** When a submenu is open, `pointermove`
records the last cursor point inside the topmost open submenu
trigger (the apex, `safeX` / `safeY`). Later moves skip hover
activation while the cursor is inside the triangle from that apex
to the submenu's near vertical edge (`safeX` clamped to that
rect's left and right as the base) and still moving toward the
submenu. A failed test (left the path, or arrived in the submenu
where `t > 1`) clears the apex; hover the trigger again to
re-arm. Triangle travel skips open, close, and highlight, so
items under the path cannot steal focus. No overlay, no CSS
vars, no timers.

**Signed movement for triangle direction.** "Is the cursor moving
toward the submenu?" is `(submenuLeft - triggerRight) *
event.movementX >= 0`. Submenu to the right: `left - right` is
positive, so the product stays non-negative while `movementX >=
0` (moving right). Submenu to the left: inverted, same
expression. One signed multiplication covers both sides without a
branch. The submenu popover is resolved live from the topmost
trigger's `aria-controls` while testing the triangle, and its
rect is measured then, not at open time: stale state cannot
survive a close, and `@starting-style` transforms leave the rect
wrong until the animation settles anyway.

## Keyboard

**One `keydown` switch.** Trigger and item keys share one `switch
(key)` after the RTL mirror. Each case branches on whether the
target is a trigger, a root trigger, or in a popover. The popover
and menubar walks run only for a menu trigger or menuitem target;
any other keystroke on the page costs two checks and a switch.
`shouldPreventDefault` is set by the cases and applied once at the
tail.

**Retarget from the surface or `body`.** `showPopover` can leave
focus on the content node, and a click on a label or separator
inside the menu blurs the item to `body`. When a menu is open and
`keydown` fires from a `mcc:menu:` surface or from `body`, the
target is retargeted to the painted item or the stack top and
focused, so the switch always sees a live element. Opening a root
menu clears a `data-highlighted` left on a menubar trigger by an
earlier Escape or bar roving, unless it is the trigger being
opened, so that retarget never picks an item from a closed
session.

**Enter and Space live in `keydown`.** Menu handles Enter and
Space in `keydown` with `preventDefault` so Space does not
scroll. Accordion, Tabs, and the other triggers rely on the
browser's synthesized `click`; Menu cannot, because `pointerdown`
already owns the pointer path. A root menu button goes through
`menuOpen` (toggle closed if already the stack root). A submenu
trigger and a menubar item call `menu` with `Focus.First`, so an
already-open menu moves focus to its first item instead of
closing.

**Keyboard `click()` after activate.** A non-href item goes
through `menuActivate`, then `keydown` calls `click()` on it so
keyboard activation produces the same click a pointer session
does: user `onclick` handlers fire, and a menuitem that is also
another component's trigger (a `mct:dialog-open:` item) works
without Menu naming that component. Menu's `click` walk only
activates href items, so that `click()` does not run
`menuActivate` twice. Checkbox and radio items leave the menu
open.

**Href items.** Enter on an href menuitem is the exception: no
`preventDefault`, so the synthesized `click` navigates and the
`click` listener closes the menu. Enter on an `aria-disabled` href
does `preventDefault`, so the browser does not navigate. Pointer
clicks on a disabled `<a>` still navigate natively; that is the
consumer's `href` to remove. `pointerup` on an href calls
`click()` on it instead of activating, so a sticky drag navigates
(the browser does not synthesize `click` across elements) and the
`click` listener closes the menu once; a same-element press fires
a real click too, and hash navigation is idempotent. Before the
menu hides, focus moves off the link (see "Focus ownership").

**Arrows, Home, End, Tab.** Root ArrowDown / ArrowUp open and
focus the first / last item. ArrowRight on a submenu trigger opens
or roves in and does not fall through to a menubar step, so an
empty submenu cannot move the bar. Home, End, and typeahead on an
already-open root trigger (click-open, or the retarget when
nothing is painted) rove the open menu; they do not open a closed
one, and on menubar items they stay on the bar. Tab and Shift+Tab
close every open menu whenever `menuStack[0]`, including from a
pointer-opened standalone trigger (`role="button"`), and do not
`preventDefault`. Root ArrowDown / ArrowUp and every arrow key on
a menuitem `preventDefault`, so empty and all-disabled menus do
not scroll and horizontal arrows on a standalone item do not
scroll the page sideways.

**Single-letter typeahead, on purpose.** A printable key (any
single character except Space, in any script) moves focus to
the next enabled item whose text starts with that character;
pressing it again cycles. `shouldMatchLetter` carries the letter
into the roving walk for that keydown only.

**No prefix buffer.** Multi-character typeahead needs a window
("keys within 500 ms belong together"), and inside that window
the same two keystrokes mean different things depending on how
fast they were typed. Even without a `setTimeout` (Blink and
WebKit implement `<select>` typeahead by comparing event
timestamps) the behaviour is hidden state driven by wall-clock
pace, and this core has none of that: every outcome is a
function of the DOM and the event. APG asks for exactly the
single-character behaviour for menus and marks even that
optional; the multi-character form belongs to the listbox
pattern. Menus are short, and repeat-to-cycle covers shared
first letters.

**Radio sweep reuses the navigation walker.** Activating a
`menuitemradio` must clear `aria-checked` on every adjacent radio
up to the group boundary. Instead of writing a dedicated sweep,
`menuActivate` sets three flags (`shouldResetRadio`,
`radioHeadDone`, `radioTailChain`) and calls the same `menuNext`
used for ArrowDown. `menuRoving` notices the non-null driver
state and switches into sweep mode: clear radios in the "head"
half, buffer them past the wrap, flush the tail once the
activated item is reached. One engine, three behaviours (plain
roving, typeahead, radio sweep), selected by which flag is
non-null.

## Focus and nesting

**Focus ownership.** `Focus.None` open focuses the trigger, so a
hover-opened submenu never leaves focus on the surface. A
`Focus.None` close focuses the trigger first when the active
element is inside the content, with `preventScroll` so a document
scroll that dismissed the menu is not undone, and `hidePopover`
never drops a focused node that lives in the menu.
`menuHighlight` focuses even when the painted item did not
change, so a later move on the same trigger repairs stolen focus.

**Painting on close.** Close only clears `data-highlighted` when
the painted item lives in that menu's content, so the next parent
item keeps its highlight. A `Focus.Trigger` close (ArrowLeft /
Escape) paints the menuitem trigger, so leaving a submenu is not
an empty slot. `Focus.None` does not, so a sibling hover is not
overwritten.

**Sibling submenu replace.** Opening a menu closes every stack
entry whose content does not contain the new trigger (`menuTrim`).
Pointer hover already did this via `triggerPath`; keyboard `menu`
shares that walk, so hover-open A then ArrowRight on sibling B
cannot leave both open. Menu `keydown` then trims the same way
against `document.activeElement`, except when focus is still the
open trigger. Hover-open a submenu then ArrowDown through the
parent therefore closes it; ArrowRight still enters.

**Menubar by role.** `menubarItem` walks up to the element whose
parent is `role="menubar"`: the bar-level wrapper that ArrowRight
/ ArrowLeft rove. Hover-switch compares the menubars of the two
wrappers instead of assuming trigger, wrapper, menubar depth. In
`keydown` the walk starts from the open root trigger when a menu
is open, so a menubar popover rendered outside the bar still
steps; it falls back to the focused item. A standalone menu has
no menubar ancestor, so ArrowRight / ArrowLeft on its items are
inert without walking unrelated siblings.
