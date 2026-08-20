/**
 * @file Menu and Menubar. Registers its own listeners. A pointer
 * session arms a capture-phase `click` that marks the event via
 * `suppressedClicks` so other components skip it; user listeners
 * still fire. `keydown` disarms it. Menu does not name Popover
 * or Collapsible.
 */
import {
  findAncestor,
  getLinked,
  getTarget,
  hasDocument,
  isElement,
  isTrigger,
  position,
  type RovingFocusCallback,
  roving,
  spatialKey,
  suppressedClicks,
} from "./dom.js";

/** Where to put focus after `menu` opens or closes. */
enum Focus {
  Trigger,
  First,
  Last,
  None,
}

/** ID prefixes this file dispatches on. */
enum Prefix {
  Content = "mcc:",
  ContentMenu = "mcc:menu:",
  TriggerMenu = "mct:menu:",
}

if (hasDocument) {
  let radioHeadDone = false;
  let radioTailChain: HTMLElement[] = [];
  let shouldMatchLetter: string | null = null;
  let shouldPreventDefault = false;
  let shouldResetRadio: HTMLElement | null = null;

  let rovingBoundary: Element | null = null;

  const menuStack: HTMLElement[] = [];
  let menuHighlighted: HTMLElement | null = null;

  let safeX: number | null = null;
  let safeY = 0;

  const isMenuItem = (el: unknown): el is HTMLElement =>
    isElement(el) && el.role?.startsWith("menuitem") === true && el.ariaDisabled !== "true";

  const menuHighlight = (item: HTMLElement | null) => {
    if (menuHighlighted !== item) {
      menuHighlighted?.removeAttribute("data-highlighted");
      menuHighlighted = item;
      item?.setAttribute("data-highlighted", "");
    }
    item?.focus({ preventScroll: true });
  };

  const menuRoving: RovingFocusCallback = (node, fallback) => {
    if (isElement(node)) {
      if (rovingBoundary === node) {
        rovingBoundary = null;
        return null;
      }
      if (!rovingBoundary) rovingBoundary = node;
      const menuitem = node.firstElementChild;
      if (shouldResetRadio) {
        if (node === node.parentElement?.firstElementChild) {
          radioHeadDone = true;
          radioTailChain = [];
        }
        if (isElement(menuitem)) {
          if (menuitem === shouldResetRadio) {
            for (const item of radioTailChain) item.ariaChecked = "false";
            return menuitem;
          }
          if (menuitem.role === "menuitemradio") {
            if (!radioHeadDone) {
              menuitem.ariaChecked = "false";
            } else {
              radioTailChain.push(menuitem);
            }
            return fallback(node);
          }
        }
        radioHeadDone = true;
        radioTailChain = [];
        return fallback(node);
      }
      if (
        isMenuItem(menuitem) &&
        (!shouldMatchLetter ||
          menuitem.textContent?.trim().toLowerCase().startsWith(shouldMatchLetter))
      ) {
        shouldPreventDefault = true;
        menuitem.focus();
        menuHighlight(menuitem);
        return menuitem;
      }
      return fallback(node);
    }
    return null;
  };
  const [menuNext, menuPrevious] = roving(menuRoving);

  /** Open or close the menu linked from this trigger. */
  const menu = (trigger: HTMLElement | undefined, mode = Focus.Trigger) => {
    if (trigger?.id.startsWith(Prefix.TriggerMenu)) {
      const content = getLinked(trigger, "aria-controls");
      if (content) {
        if (trigger.ariaExpanded === "true") {
          if (mode === Focus.Trigger && trigger.role?.startsWith("menuitem")) {
            menuHighlight(trigger);
          } else {
            if (mode !== Focus.None || content.contains(document.activeElement)) {
              trigger.focus();
            }
            if (content.contains(menuHighlighted)) menuHighlight(null);
          }
          content.hidePopover();
          trigger.ariaExpanded = "false";
          content.ariaHidden = "true";
        } else if (trigger.ariaDisabled !== "true") {
          menuTrim(trigger);
          menuStack.push(trigger);
          content.showPopover();
          trigger.ariaExpanded = "true";
          content.ariaHidden = "false";
          position(trigger, content);
          safeX = null;
          if (mode === Focus.Trigger) {
            trigger.focus();
          } else if (mode === Focus.First) {
            menuRoving(content.firstElementChild, menuNext);
          } else if (mode === Focus.Last) {
            menuRoving(content.lastElementChild, menuPrevious);
          } else {
            menuHighlighted?.focus({ preventScroll: true });
          }
        }
      }
    }
  };

  const menuActivate = (el: HTMLElement) => {
    if (el.role === "menuitemcheckbox") {
      el.ariaChecked = `${el.ariaChecked !== "true"}`;
    } else if (el.role === "menuitemradio") {
      shouldResetRadio = el;
      radioHeadDone = false;
      radioTailChain = [];
      menuNext(el.parentElement);
      shouldResetRadio = null;
      el.ariaChecked = "true";
    } else {
      menuCloseAll();
    }
  };

  const menubarStep = (trigger: HTMLElement | null) => {
    if (trigger) {
      const wasOpen = !!menuStack[0];
      menuCloseAll();
      if (wasOpen && isTrigger(trigger, Prefix.TriggerMenu)) menu(trigger, Focus.None);
    }
  };

  const menuCloseAll = (keep = 0) => {
    while (menuStack[keep]) menu(menuStack.pop(), Focus.None);
  };

  const menuOpen = (trigger: HTMLElement, mode: Focus) => {
    const inPopover = findAncestor(trigger.parentElement, Prefix.ContentMenu);
    if (inPopover) {
      if (!menuStack.includes(trigger)) menu(trigger, mode);
    } else if (menuStack[0]) {
      const reopen = trigger !== menuStack[0];
      menuCloseAll();
      if (reopen) menu(trigger, mode);
    } else {
      menu(trigger, mode);
    }
  };

  const menuRoveIn = (trigger: HTMLElement, mode: Focus) => {
    if (trigger.ariaExpanded !== "true") {
      menu(trigger, mode);
    } else {
      const content = getLinked(trigger, "aria-controls");
      if (content) {
        if (mode === Focus.First) {
          menuRoving(content.firstElementChild, menuNext);
        } else {
          menuRoving(content.lastElementChild, menuPrevious);
        }
      }
    }
  };

  const menuTrim = (el: HTMLElement) => {
    while (menuStack[0] && !getLinked(menuStack.at(-1) || el, "aria-controls")?.contains(el))
      menu(menuStack.pop(), Focus.None);
  };

  // Capture-phase one-shot: mark the trailing click so other
  // components skip it. The event is not stopped, so user
  // listeners still fire. Disarmed on pointerdown and keydown
  // so an abandoned gesture then Enter still works.
  const menuSuppressClick = (event: Event) => {
    suppressedClicks.add(event);
    removeEventListener("click", menuSuppressClick, true);
  };

  addEventListener("pointerdown", (event: PointerEvent) => {
    removeEventListener("click", menuSuppressClick, true);
    if (event.button !== 0) return;
    let el = getTarget(event);
    if (!el) return;
    while (el) {
      const id = el.id;
      if (id.startsWith(Prefix.TriggerMenu)) {
        addEventListener("click", menuSuppressClick, true);
        menuOpen(el, Focus.None);
        return;
      }
      if (id.startsWith(Prefix.ContentMenu) && menuStack[0]) {
        addEventListener("click", menuSuppressClick, true);
        return;
      }
      el = el.parentElement;
    }
    if (menuStack[0]) menuCloseAll();
  });

  addEventListener("pointerup", (event: PointerEvent) => {
    rovingBoundary = null;
    if (event.button !== 0 || !menuStack[0]) return;
    let el = getTarget(event);
    while (el) {
      if (isMenuItem(el) && !isTrigger(el, Prefix.TriggerMenu)) {
        if (el.tagName === "A") el.click();
        menuActivate(el);
        return;
      }
      if (el.id.startsWith(Prefix.ContentMenu)) return;
      el = el.parentElement;
    }
  });

  addEventListener("click", (event: MouseEvent) => {
    if (suppressedClicks.has(event)) return;
    const start = getTarget(event);
    if (start) {
      let el: HTMLElement | null = start;
      while (el) {
        const id = el.id;
        if (id.startsWith(Prefix.TriggerMenu)) break;
        else if (isMenuItem(el) && el.tagName === "A") {
          menuActivate(el);
          break;
        } else if (id.startsWith(Prefix.ContentMenu)) {
          break;
        }
        el = el.parentElement;
      }
    }
  });

  addEventListener("pointermove", (event: PointerEvent) => {
    if (event.pointerType === "touch" || !menuStack[0]) return;
    let safe = false;
    const subTrigger = menuStack[1] && menuStack.at(-1);
    if (subTrigger) {
      const rect = subTrigger.getBoundingClientRect();
      if (
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      ) {
        safeX = event.clientX;
        safeY = event.clientY;
      } else if (safeX !== null) {
        const safeRect = getLinked(subTrigger, "aria-controls")?.getBoundingClientRect();
        if (safeRect) {
          const dx =
            (safeX < safeRect.left
              ? safeRect.left
              : safeX > safeRect.right
                ? safeRect.right
                : safeX) - safeX;
          const t = dx && (event.clientX - safeX) / dx;
          safe =
            t > 0 &&
            t <= 1 &&
            (event.clientY - (safeY + t * (safeRect.top - safeY))) *
              (event.clientY - (safeY + t * (safeRect.bottom - safeY))) <=
              0 &&
            (safeRect.left - rect.right) * event.movementX >= 0;
        }
        if (!safe) safeX = null;
      }
    }
    if (!safe) {
      const triggerPath: HTMLButtonElement[] = [];
      let inContent = false;
      let foundItem = false;
      let el = getTarget(event);
      while (el) {
        if (
          el.role?.startsWith("menuitem") ||
          el.role === "separator" ||
          el.role === "presentation"
        ) {
          if (!foundItem && isMenuItem(el)) menuHighlight(el);
          foundItem = true;
        }
        if (!foundItem && el.id.startsWith(Prefix.Content)) {
          inContent = true;
          break;
        }
        if (isTrigger(el, Prefix.TriggerMenu)) {
          triggerPath.unshift(el);
        } else if (el.id.startsWith(Prefix.ContentMenu)) {
          const trigger = getLinked(el, "aria-labelledby");
          if (isTrigger(trigger, Prefix.TriggerMenu)) {
            triggerPath.unshift(trigger);
          }
        }
        el = el.parentElement;
      }
      if (!inContent && triggerPath[0]) {
        let i = 0;
        while (menuStack[i] && menuStack[i] === triggerPath[i]) i++;
        if (
          i === 0 &&
          (triggerPath[0].role !== "menuitem" ||
            triggerPath[0].parentElement?.parentElement !==
              menuStack[0].parentElement?.parentElement)
        )
          return;
        menuCloseAll(i);
        menu(triggerPath[i], Focus.None);
      }
    }
  });

  addEventListener("keydown", (event: KeyboardEvent) => {
    shouldMatchLetter = null;
    shouldPreventDefault = false;
    removeEventListener("click", menuSuppressClick, true);
    rovingBoundary = null;
    const key = spatialKey(event.key);
    let target = event.target;
    if (
      menuStack[0] &&
      isElement(target) &&
      !isTrigger(target, Prefix.TriggerMenu) &&
      !target.role?.startsWith("menuitem") &&
      findAncestor(target, Prefix.ContentMenu)
    ) {
      target = menuHighlighted || menuStack.at(-1) || target;
    }
    if (isTrigger(target, Prefix.TriggerMenu)) {
      const isRootTrigger = findAncestor(target, Prefix.ContentMenu) === null;
      const isOpenMenuButton =
        isRootTrigger && target.ariaExpanded === "true" && target.role === "button";
      switch (key) {
        case "Enter":
        case " ":
          if (isRootTrigger && target.role === "button") {
            menuOpen(target, Focus.First);
          } else {
            menuRoveIn(target, Focus.First);
          }
          shouldPreventDefault = true;
          break;
        case "ArrowDown":
          if (isRootTrigger) {
            menuRoveIn(target, Focus.First);
            shouldPreventDefault = true;
          }
          break;
        case "ArrowUp":
          if (isRootTrigger) {
            menuRoveIn(target, Focus.Last);
            shouldPreventDefault = true;
          }
          break;
        case "ArrowRight":
          if (!isRootTrigger) menuRoveIn(target, Focus.First);
          break;
        case "Home":
          if (isOpenMenuButton) {
            menuRoveIn(target, Focus.First);
            shouldPreventDefault = true;
          }
          break;
        case "End":
          if (isOpenMenuButton) {
            menuRoveIn(target, Focus.Last);
            shouldPreventDefault = true;
          }
          break;
        default:
          if (isOpenMenuButton && /^[a-z]$/i.test(key)) {
            shouldMatchLetter = key.toLowerCase();
            menuRoveIn(target, Focus.First);
          }
      }
    }
    if (
      !shouldPreventDefault &&
      isElement(target) &&
      target.role?.startsWith("menuitem") &&
      target.parentElement
    ) {
      const parent = target.parentElement;
      const menubarRoot = menuStack[0]?.parentElement || parent;
      const inPopover = findAncestor(target.parentElement, Prefix.ContentMenu);
      switch (key) {
        case "Enter":
        case " ":
          if (!isTrigger(target, Prefix.TriggerMenu)) {
            shouldPreventDefault = key === " " || target.tagName !== "A";
            if (target.ariaDisabled !== "true" && shouldPreventDefault) {
              menuActivate(target);
            }
          }
          break;
        case "ArrowDown":
          if (inPopover) menuNext(parent);
          break;
        case "ArrowUp":
          if (inPopover) menuPrevious(parent);
          break;
        case "ArrowRight":
          menubarStep(menuNext(menubarRoot));
          break;
        case "ArrowLeft":
          if (menuStack[1]) {
            menu(menuStack.pop(), Focus.Trigger);
          } else {
            menubarStep(menuPrevious(menubarRoot));
          }
          break;
        case "Home":
          menuRoving(parent.parentElement?.firstElementChild, menuNext);
          break;
        case "End":
          menuRoving(parent.parentElement?.lastElementChild, menuPrevious);
          break;
        default:
          if (/^[a-z]$/i.test(key)) {
            shouldMatchLetter = key.toLowerCase();
            menuNext(parent);
          }
          break;
      }
    }
    const active = document.activeElement;
    if (isElement(active) && active !== menuStack.at(-1)) menuTrim(active);
    if (key === "Tab" && menuStack[0]) {
      menuStack[0].focus();
      menuCloseAll();
    }
    if (key === "Escape") {
      if (menuStack[0]) {
        menu(menuStack.pop(), Focus.Trigger);
        shouldPreventDefault = true;
      }
    }
    if (shouldPreventDefault) event.preventDefault();
  });

  addEventListener(
    "scroll",
    (event) => {
      if (
        menuStack[0] &&
        !(isElement(event.target) && findAncestor(event.target, Prefix.ContentMenu))
      ) {
        menuCloseAll();
      }
    },
    true,
  );

  addEventListener("resize", () => {
    if (menuStack[0]) menuCloseAll();
  });
}
