enum Focus {
  Trigger,
  First,
  Last,
  None,
}

enum Prefix {
  Content = "mcc:",
  ContentDialog = "mcc:dialog:",
  ContentMenu = "mcc:menu:",
  ContentPopover = "mcc:popover:",
  ContentTooltip = "mcc:tooltip:",
  RootAccordion = "mcr:accordion:",
  Trigger = "mct:",
  TriggerAccordion = "mct:accordion:",
  TriggerCollapsible = "mct:collapsible:",
  TriggerDialogClose = "mct:dialog-close:",
  TriggerDialogOpen = "mct:dialog-open:",
  TriggerMenu = "mct:menu:",
  TriggerPopover = "mct:popover:",
  TriggerTabs = "mct:tabs:",
  TriggerTooltip = "mct:tooltip:",
}

if (typeof document !== "undefined") {
  let radioHeadDone = false;
  let radioTailChain: HTMLElement[] = [];
  let shouldMatchLetter: string | null = null;
  let shouldPreventDefault = false;
  let shouldResetRadio: HTMLElement | null = null;
  let shouldSuppressClick = false;

  let pointerTarget: EventTarget | null = null;
  let rovingBoundary: Element | null = null;

  let dialogContent: HTMLDialogElement | null = null;
  let dialogTrigger: HTMLElement | null = null;

  const menuStack: HTMLElement[] = [];

  let safeContent: HTMLElement | null = null;
  let safeX: number | null = null;
  let safeY = 0;

  let popoverShown: HTMLElement | null = null;

  let tooltipFocused: HTMLElement | null = null;
  let tooltipHovered: HTMLElement | null = null;
  let tooltipShown: HTMLElement | null = null;
  let tooltipSuppressed: HTMLElement | null = null;

  type RovingNavigator = (origin: Element | null | undefined) => HTMLElement | null;
  type RovingFocusCallback = (
    node: Element | null | undefined,
    fallback: RovingNavigator,
  ) => HTMLElement | null;
  type Roving = (focus: RovingFocusCallback) => [RovingNavigator, RovingNavigator];

  const isDialog = (el: unknown): el is HTMLDialogElement => el instanceof HTMLDialogElement;
  const isElement = (el: unknown): el is HTMLElement => el instanceof HTMLElement;
  const isMenuItem = (el: unknown): el is HTMLElement =>
    isElement(el) && el.role?.startsWith("menuitem") === true && el.ariaDisabled !== "true";
  const isTrigger = (el: unknown, prefix: string): el is HTMLButtonElement =>
    el instanceof HTMLButtonElement && el.id.startsWith(prefix);

  const findAncestor = (el: HTMLElement | null, prefix: string): HTMLElement | null => {
    while (el) {
      if (el.id.startsWith(prefix)) return el;
      el = el.parentElement;
    }
    return null;
  };

  const getLinked = (el: HTMLElement, attr: string) => {
    const id = el.getAttribute(attr);
    return id ? document.getElementById(id) : null;
  };

  const getTarget = (event: Event): HTMLElement | null =>
    isElement(event.target)
      ? event.target
      : event.target instanceof Element
        ? event.target.parentElement
        : null;

  const position = (trigger: HTMLElement, content: HTMLElement) => {
    const rect = trigger.getBoundingClientRect();
    content.style.setProperty("--top", `${rect.top}px`);
    content.style.setProperty("--right", `${rect.right}px`);
    content.style.setProperty("--bottom", `${rect.bottom}px`);
    content.style.setProperty("--left", `${rect.left}px`);
    content.style.setProperty("--width", `${content.offsetWidth}px`);
    content.style.setProperty("--height", `${content.offsetHeight}px`);
  };

  const roving: Roving = (focus) => {
    const next: RovingNavigator = (origin) =>
      origin
        ? focus(origin.nextElementSibling || origin.parentElement?.firstElementChild, next)
        : null;
    const previous: RovingNavigator = (origin) =>
      origin
        ? focus(origin.previousElementSibling || origin.parentElement?.lastElementChild, previous)
        : null;
    return [next, previous];
  };

  const accordionRoving: RovingFocusCallback = (node, fallback) => {
    if (isElement(node)) {
      if (rovingBoundary === node) return null;
      if (!rovingBoundary) rovingBoundary = node;
      const trigger = node.firstElementChild?.firstElementChild;
      if (isTrigger(trigger, Prefix.TriggerAccordion) && trigger.ariaDisabled !== "true") {
        shouldPreventDefault = true;
        trigger.focus();
        return trigger;
      }
    }
    return fallback(node);
  };
  const [accordionNext, accordionPrevious] = roving(accordionRoving);

  const menuRoving: RovingFocusCallback = (node, fallback) => {
    if (isElement(node)) {
      if (rovingBoundary === node) {
        rovingBoundary = null;
        return null;
      }
      if (!rovingBoundary) rovingBoundary = node;
      const menuitem = node.firstElementChild;
      if (shouldResetRadio) {
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
        return menuitem;
      }
      return fallback(node);
    }
    return null;
  };
  const [menuNext, menuPrevious] = roving(menuRoving);

  const tabsRoving: RovingFocusCallback = (node, fallback) => {
    if (isElement(node)) {
      if (rovingBoundary === node) return null;
      if (!rovingBoundary) rovingBoundary = node;
      if (isTrigger(node, Prefix.TriggerTabs) && node.ariaDisabled !== "true") {
        shouldPreventDefault = true;
        node.focus();
        return node;
      }
    }
    return fallback(node);
  };
  const [tabsNext, tabsPrevious] = roving(tabsRoving);

  const accordion = (trigger: HTMLElement) => {
    if (trigger.ariaDisabled === "true") return;
    if (trigger.ariaExpanded === "true") {
      collapsible(trigger);
    } else {
      const root = findAncestor(trigger, Prefix.RootAccordion);
      if (!root || root.getAttribute("data-mode") !== "single") {
        collapsible(trigger);
      } else {
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

  const collapsible = (trigger: HTMLElement) => {
    const content = getLinked(trigger, "aria-controls");
    if (content) {
      const willOpen = trigger.ariaExpanded !== "true";
      trigger.ariaExpanded = willOpen ? "true" : "false";
      content.ariaHidden = willOpen ? "false" : "true";
      content.hidden = !willOpen;
    }
  };

  const dialogClose = () => {
    if (!dialogContent?.open || !dialogTrigger) return;
    const content = dialogContent;
    const trigger = dialogTrigger;
    dialogContent = null;
    dialogTrigger = null;
    content.close();
    trigger.focus();
  };

  const dialogOpen = (trigger: HTMLElement) => {
    const content = getLinked(trigger, "aria-controls");
    if (!dialogContent?.open && isDialog(content)) {
      dialogContent = content;
      dialogTrigger = trigger;
      content.showModal();
    }
  };

  const menu = (trigger: HTMLElement | undefined, mode = Focus.Trigger) => {
    if (trigger?.id.startsWith(Prefix.TriggerMenu)) {
      const content = getLinked(trigger, "aria-controls");
      if (content) {
        if (trigger.ariaExpanded === "true") {
          if (mode !== Focus.None) trigger.focus();
          content.hidePopover();
          trigger.ariaExpanded = "false";
          content.ariaHidden = "true";
        } else if (trigger.ariaDisabled !== "true") {
          menuStack.push(trigger);
          content.showPopover();
          trigger.ariaExpanded = "true";
          content.ariaHidden = "false";
          position(trigger, content);
          safeContent = content;
          safeX = null;
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

  const menuActivate = (el: HTMLElement) => {
    if (el.role === "menuitemcheckbox") {
      el.ariaChecked = el.ariaChecked === "true" ? "false" : "true";
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
    if (popoverShown) popover(popoverShown, false);
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

  const popover = (trigger: HTMLElement, show: boolean) => {
    if ((trigger.ariaExpanded === "true") === show) return;
    const content = getLinked(trigger, "aria-controls");
    if (content) {
      if (show) {
        if (popoverShown && popoverShown !== trigger) popover(popoverShown, false);
        content.showPopover();
        trigger.ariaExpanded = "true";
        content.ariaHidden = "false";
        position(trigger, content);
        popoverShown = trigger;
      } else {
        content.hidePopover();
        trigger.ariaExpanded = "false";
        content.ariaHidden = "true";
        if (popoverShown === trigger) popoverShown = null;
      }
    }
  };

  const tabs = (trigger: HTMLElement) => {
    if (trigger.ariaDisabled !== "true" && trigger.ariaSelected !== "true") {
      let tab = trigger.parentElement?.firstElementChild;
      while (tab) {
        if (isElement(tab) && (tab === trigger || tab.ariaSelected === "true")) {
          const content = getLinked(tab, "aria-controls");
          if (content) {
            const willSelect = tab.ariaSelected !== "true";
            tab.ariaSelected = willSelect ? "true" : "false";
            tab.tabIndex = willSelect ? 0 : -1;
            content.ariaHidden = willSelect ? "false" : "true";
            if (content.hasAttribute("tabindex")) content.tabIndex = willSelect ? 0 : -1;
            content.hidden = !willSelect;
          }
        }
        tab = tab.nextElementSibling;
      }
    }
  };

  const tooltip = (trigger: HTMLElement, show: boolean) => {
    const content = getLinked(trigger, "aria-describedby");
    if (content) {
      if (show) {
        content.showPopover();
        position(trigger, content);
      } else {
        content.hidePopover();
      }
    }
  };

  const tooltipReset = () => {
    tooltipFocused = null;
    tooltipHovered = null;
    tooltipSync();
  };

  const tooltipSuppress = () => {
    if (tooltipShown) {
      tooltipSuppressed = tooltipShown;
      tooltipSync();
    }
  };

  const tooltipSync = () => {
    if (
      tooltipSuppressed &&
      tooltipSuppressed !== tooltipHovered &&
      tooltipSuppressed !== tooltipFocused
    ) {
      tooltipSuppressed = null;
    }
    const active = tooltipHovered || tooltipFocused;
    const next = active && active !== tooltipSuppressed ? active : null;
    if (next !== tooltipShown) {
      if (tooltipShown) tooltip(tooltipShown, false);
      if (next) tooltip(next, true);
      tooltipShown = next;
    }
  };

  addEventListener("pointerdown", (event: PointerEvent) => {
    shouldSuppressClick = false;
    if (event.button !== 0) return;
    let el = getTarget(event);
    if (!el) return;
    while (el) {
      const id = el.id;
      if (id.startsWith(Prefix.TriggerMenu)) {
        shouldSuppressClick = true;
        menuOpen(el, Focus.None);
        return;
      }
      if (id.startsWith(Prefix.ContentMenu) && menuStack[0]) {
        shouldSuppressClick = true;
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
        menuActivate(el);
        return;
      }
      if (el.id.startsWith(Prefix.ContentMenu)) return;
      el = el.parentElement;
    }
  });

  addEventListener("click", (event: MouseEvent) => {
    if (shouldSuppressClick) {
      shouldSuppressClick = false;
      return;
    }
    shouldPreventDefault = false;
    rovingBoundary = null;
    const start = getTarget(event);
    if (start) {
      let el: HTMLElement | null = start;
      while (el) {
        const id = el.id;
        if (id.startsWith(Prefix.Trigger)) {
          if (id.startsWith(Prefix.TriggerMenu)) break;
          if (id.startsWith(Prefix.TriggerAccordion)) accordion(el);
          else if (id.startsWith(Prefix.TriggerCollapsible)) collapsible(el);
          else if (id.startsWith(Prefix.TriggerDialogClose)) dialogClose();
          else if (id.startsWith(Prefix.TriggerDialogOpen) && el.ariaDisabled !== "true") {
            if (popoverShown) popover(popoverShown, false);
            tooltipSuppress();
            dialogOpen(el);
          } else if (id.startsWith(Prefix.TriggerPopover) && el.ariaDisabled !== "true") {
            const isOpen = el.ariaExpanded === "true";
            popover(el, !isOpen);
            if (isOpen) {
              el.focus();
            } else {
              getLinked(el, "aria-controls")?.focus();
            }
          } else if (id.startsWith(Prefix.TriggerTabs)) {
            tabs(el);
          } else if (id.startsWith(Prefix.TriggerTooltip)) {
            tooltipSuppress();
          }
          break;
        } else if (
          id.startsWith(Prefix.ContentDialog) ||
          id.startsWith(Prefix.ContentMenu) ||
          id.startsWith(Prefix.ContentPopover) ||
          id.startsWith(Prefix.ContentTooltip)
        ) {
          break;
        }
        el = el.parentElement;
      }
      if (!el && popoverShown) popover(popoverShown, false);
    }
    if (shouldPreventDefault) event.preventDefault();
  });

  addEventListener("pointermove", (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    if (event.target === pointerTarget && !menuStack[0]) return;
    pointerTarget = event.target;
    if (isElement(event.target) && !findAncestor(event.target, Prefix.ContentTooltip)) {
      const nextHover = findAncestor(event.target, Prefix.TriggerTooltip);
      if (nextHover !== tooltipHovered) {
        tooltipHovered = nextHover;
        tooltipSync();
      }
    }
    if (menuStack[0]) {
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
          const safeRect = safeContent?.getBoundingClientRect();
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
      if (!safe && isElement(event.target)) {
        const triggerPath: HTMLButtonElement[] = [];
        let el: HTMLElement | null = event.target;
        let inContent = false;
        let foundItem = false;
        while (el) {
          if (
            el.role?.startsWith("menuitem") ||
            el.role === "separator" ||
            el.role === "presentation"
          ) {
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
    }
  });

  addEventListener("keydown", (event: KeyboardEvent) => {
    shouldPreventDefault = false;
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
          if (vertical) tabsNext(target);
          break;
        case "ArrowUp":
          if (vertical) tabsPrevious(target);
          break;
        case "ArrowRight":
          if (!vertical) tabsNext(target);
          break;
        case "ArrowLeft":
          if (!vertical) tabsPrevious(target);
          break;
        case "Home":
          tabsRoving(target.parentElement?.firstElementChild, tabsNext);
          break;
        case "End":
          tabsRoving(target.parentElement?.lastElementChild, tabsPrevious);
          break;
      }
    } else {
      if (isTrigger(target, Prefix.TriggerMenu)) {
        const isRootTrigger = findAncestor(target, Prefix.ContentMenu) === null;
        switch (event.key) {
          case "Enter":
          case " ":
            menuOpen(target, Focus.First);
            shouldPreventDefault = true;
            break;
          case "ArrowDown":
            if (isRootTrigger) menuRoveIn(target, Focus.First);
            break;
          case "ArrowUp":
            if (isRootTrigger) menuRoveIn(target, Focus.Last);
            break;
          case "ArrowRight":
            if (!isRootTrigger) menuRoveIn(target, Focus.First);
            break;
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
        switch (event.key) {
          case "Enter":
          case " ":
            if (!isTrigger(target, Prefix.TriggerMenu)) {
              menuActivate(target);
              shouldPreventDefault = event.key === " " || target.tagName !== "A";
            }
            break;
          case "Tab":
            if (menuStack[0]) menuStack[0].focus();
            menuCloseAll();
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
            if (/^[a-z]$/i.test(event.key)) {
              shouldMatchLetter = event.key.toLowerCase();
              menuNext(parent);
            }
            break;
        }
      }
    }
    if (event.key === "Escape") {
      if (tooltipShown) {
        tooltipSuppress();
        shouldPreventDefault = true;
      } else if (menuStack[0]) {
        menu(menuStack.pop(), Focus.Trigger);
        shouldPreventDefault = true;
      } else if (popoverShown) {
        const trigger = popoverShown;
        popover(trigger, false);
        trigger.focus();
        shouldPreventDefault = true;
      } else if (dialogContent) {
        dialogClose();
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
      if (
        popoverShown &&
        !(isElement(event.target) && findAncestor(event.target, Prefix.ContentPopover))
      ) {
        popover(popoverShown, false);
      }
      if (tooltipShown) tooltipReset();
      pointerTarget = null;
    },
    true,
  );

  addEventListener("resize", () => {
    if (menuStack[0]) menuCloseAll();
    if (popoverShown) popover(popoverShown, false);
    if (tooltipShown) tooltipReset();
    pointerTarget = null;
  });

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

  addEventListener("focusout", (event: FocusEvent) => {
    if (
      popoverShown &&
      isElement(event.relatedTarget) &&
      popoverShown !== event.relatedTarget &&
      !getLinked(popoverShown, "aria-controls")?.contains(event.relatedTarget)
    ) {
      popover(popoverShown, false);
    }
    if (tooltipFocused && event.target === tooltipFocused && !event.relatedTarget) {
      tooltipFocused = null;
      tooltipSync();
    }
  });
}
