const BRANDKIT_ROLE_STORAGE_KEY = "brandkit-active-role";
const BRANDKIT_ROLE_DEFINITIONS = {
  admin: {
    label: "管理员",
    description: "Guide、Make、Audit 与 MCP",
    allowed: new Set(["guide", "make", "audit", "mcp"]),
  },
  partner: {
    label: "伙伴",
    description: "Guide、Make 与 MCP",
    allowed: new Set(["guide", "make", "mcp"]),
  },
  everyone: {
    label: "所有人",
    description: "Guide 与 MCP",
    allowed: new Set(["guide", "mcp"]),
  },
};

const getBrandKitArea = (urlLike = window.location.href) => {
  const url = new URL(urlLike, window.location.href);
  const file = url.pathname.split("/").pop()?.toLowerCase() || "index.html";
  if (file === "review.html") return "audit";
  if (file === "mcp.html") return "mcp";
  if (file.startsWith("make")) return "make";
  return "guide";
};

const readBrandKitRole = () => {
  try {
    const savedRole = window.localStorage.getItem(BRANDKIT_ROLE_STORAGE_KEY);
    if (savedRole && BRANDKIT_ROLE_DEFINITIONS[savedRole]) return savedRole;
  } catch {
    // localStorage unavailable: keep the full administrator view for this session.
  }
  return "admin";
};

const writeBrandKitRole = (role) => {
  try {
    window.localStorage.setItem(BRANDKIT_ROLE_STORAGE_KEY, role);
  } catch {
    // The role still applies to the current page even when storage is unavailable.
  }
};

const activeBrandKitRole = readBrandKitRole();
const activeRoleDefinition = BRANDKIT_ROLE_DEFINITIONS[activeBrandKitRole];
const canAccessBrandKitArea = (area, role = activeBrandKitRole) =>
  BRANDKIT_ROLE_DEFINITIONS[role]?.allowed.has(area) ?? false;

document.documentElement.dataset.userRole = activeBrandKitRole;

if (!canAccessBrandKitArea(getBrandKitArea())) {
  document.documentElement.classList.add("role-redirecting");
  window.location.replace(new URL("guide-basic.html", window.location.href).href);
}

document.querySelectorAll("a[href]").forEach((link) => {
  const area = getBrandKitArea(link.getAttribute("href"));
  if (canAccessBrandKitArea(area)) return;

  link.hidden = true;
  link.setAttribute("aria-hidden", "true");
  link.tabIndex = -1;
  const routedListItem = link.closest(".rule-list li");
  if (routedListItem) routedListItem.hidden = true;
});

if (!canAccessBrandKitArea("audit")) {
  document.querySelectorAll(".ui-help").forEach((note) => {
    if (note.textContent.includes("Audit")) note.hidden = true;
  });
}

const roleSwitcher = document.querySelector(".side-foot");

if (roleSwitcher) {
  roleSwitcher.classList.add("role-switcher");
  roleSwitcher.textContent = "";

  const roleTrigger = document.createElement("button");
  roleTrigger.className = "role-switcher-trigger";
  roleTrigger.type = "button";
  roleTrigger.setAttribute("aria-haspopup", "menu");
  roleTrigger.setAttribute("aria-expanded", "false");
  roleTrigger.setAttribute("aria-label", `当前用户：${activeRoleDefinition.label}。切换用户`);
  roleTrigger.innerHTML = `
    <span class="role-avatar role-avatar-${activeBrandKitRole}" aria-hidden="true"></span>
    <span class="role-user-name">用户_84520…</span>
    <span class="role-current-label">${activeRoleDefinition.label}</span>
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M5.5 9.5L8 7l2.5 2.5"/></svg>
  `;

  const roleMenu = document.createElement("div");
  roleMenu.className = "role-menu";
  roleMenu.hidden = true;
  roleMenu.setAttribute("role", "menu");
  roleMenu.setAttribute("aria-label", "切换用户");
  roleMenu.innerHTML = `
    <div class="role-menu-title">切换用户</div>
    <div class="role-menu-options">
      ${Object.entries(BRANDKIT_ROLE_DEFINITIONS).map(([role, definition]) => `
        <button class="role-option${role === activeBrandKitRole ? " is-current" : ""}" type="button" role="menuitemradio" aria-checked="${role === activeBrandKitRole}" data-switch-role="${role}">
          <span class="role-option-avatar role-avatar-${role}" aria-hidden="true"></span>
          <span class="role-option-copy"><b>${definition.label}</b><span>${definition.description}</span></span>
          <svg class="role-option-check" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M3.5 8.25L6.5 11l6-6"/></svg>
        </button>
      `).join("")}
    </div>
  `;

  roleSwitcher.append(roleTrigger, roleMenu);
  let roleMenuCloseTimer = 0;

  const openRoleMenu = () => {
    window.clearTimeout(roleMenuCloseTimer);
    roleMenu.hidden = false;
    roleTrigger.setAttribute("aria-expanded", "true");
    window.requestAnimationFrame(() => roleMenu.classList.add("is-open"));
  };

  const closeRoleMenu = ({ restoreFocus = false } = {}) => {
    roleMenu.classList.remove("is-open");
    roleTrigger.setAttribute("aria-expanded", "false");
    roleMenuCloseTimer = window.setTimeout(() => {
      if (!roleMenu.classList.contains("is-open")) roleMenu.hidden = true;
    }, 170);
    if (restoreFocus) roleTrigger.focus();
  };

  roleTrigger.addEventListener("click", () => {
    if (roleMenu.hidden) openRoleMenu();
    else closeRoleMenu();
  });

  roleMenu.addEventListener("click", (event) => {
    const target = event.target instanceof Element
      ? event.target.closest("[data-switch-role]")
      : null;
    if (!target) return;
    const nextRole = target.dataset.switchRole;
    if (!BRANDKIT_ROLE_DEFINITIONS[nextRole] || nextRole === activeBrandKitRole) {
      closeRoleMenu({ restoreFocus: true });
      return;
    }

    writeBrandKitRole(nextRole);
    const currentArea = getBrandKitArea();
    if (canAccessBrandKitArea(currentArea, nextRole)) window.location.reload();
    else window.location.replace(new URL("guide-basic.html", window.location.href).href);
  });

  document.addEventListener("click", (event) => {
    if (!roleMenu.hidden && !roleSwitcher.contains(event.target)) closeRoleMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !roleMenu.hidden) closeRoleMenu({ restoreFocus: true });
  });
}

const primaryNavIcons = {
  Guide: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><path d="M4 5.5A2.5 2.5 0 016.5 3H19v18H6.5A2.5 2.5 0 014 18.5z"/></svg>',
  Make: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><path d="M12 3l2.2 6.3L21 12l-6.8 2.7L12 21l-2.2-6.3L3 12l6.8-2.7z"/></svg>',
  Audit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" aria-hidden="true" focusable="false"><path d="M4 12l5 5L20 6"/></svg>',
};

const primaryNavs = [...document.querySelectorAll(".lv1")];

primaryNavs.forEach((nav) => {
  const links = [...nav.children].filter((element) => element.matches("a:not([hidden])"));
  if (!links.length) return;

  links.forEach((link) => {
    const label = link.textContent.trim();
    if (!link.querySelector("svg") && primaryNavIcons[label]) {
      link.insertAdjacentHTML("afterbegin", primaryNavIcons[label]);
    }

    const icon = link.querySelector("svg");
    if (icon) {
      icon.setAttribute("aria-hidden", "true");
      icon.setAttribute("focusable", "false");
    }
  });

  const indicator = document.createElement("span");
  indicator.className = "lv1-indicator";
  indicator.setAttribute("aria-hidden", "true");
  nav.prepend(indicator);
  nav.classList.add("has-indicator");

  const pageActiveLink = links.find((link) => link.classList.contains("on")) ?? null;
  let activeLink = pageActiveLink;
  let baseWidths = [];
  let readyFrame = 0;
  let resizeTimer = 0;

  const setState = (target) => {
    const navStyle = window.getComputedStyle(nav);
    const gap = Number.parseFloat(navStyle.columnGap || navStyle.gap) || 0;
    const paddingLeft = Number.parseFloat(navStyle.paddingLeft) || 0;
    const targetIndex = links.indexOf(target);

    links.forEach((link, index) => {
      const selected = link === target;
      link.classList.toggle("on", selected);
      link.style.width = `${baseWidths[index] + (selected ? 20 : 0)}px`;
    });

    activeLink = target;

    if (targetIndex < 0) {
      nav.classList.add("no-selection");
      nav.style.setProperty("--indicator-width", "0px");
      return;
    }

    const indicatorLeft = baseWidths
      .slice(0, targetIndex)
      .reduce((total, width) => total + width + gap, paddingLeft);

    nav.classList.remove("no-selection");
    nav.style.setProperty("--indicator-left", `${indicatorLeft}px`);
    nav.style.setProperty("--indicator-width", `${baseWidths[targetIndex] + 20}px`);
  };

  const measure = (target = activeLink) => {
    window.cancelAnimationFrame(readyFrame);
    nav.classList.remove("is-ready");
    nav.classList.add("is-measuring");

    links.forEach((link) => {
      link.classList.remove("on");
      link.style.width = "auto";
    });

    baseWidths = links.map((link) =>
      Math.round(link.getBoundingClientRect().width * 1000) / 1000
    );

    setState(target);
    nav.classList.remove("is-measuring");
    readyFrame = window.requestAnimationFrame(() => {
      readyFrame = window.requestAnimationFrame(() => nav.classList.add("is-ready"));
    });
  };

  measure(pageActiveLink);

  nav.addEventListener("click", (event) => {
    const target = event.target;
    const link = target instanceof Element ? target.closest("a") : null;

    if (
      !link ||
      !nav.contains(link) ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      link.target === "_blank" ||
      link.hasAttribute("download")
    ) {
      return;
    }

    if (nav.classList.contains("is-navigating")) {
      event.preventDefault();
      return;
    }

    const destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin || link === activeLink) return;

    event.preventDefault();
    nav.classList.add("is-navigating");
    setState(link);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => window.location.assign(destination.href), reduceMotion ? 0 : 230);
  });

  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (!nav.classList.contains("is-navigating")) measure(activeLink);
    }, 120);
  });

  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    nav.classList.remove("is-navigating");
    measure(pageActiveLink);
  });

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      if (!nav.classList.contains("is-navigating")) measure(activeLink);
    });
  }
});

const copyButton = document.querySelector("[data-copy-config]");
const configBlock = document.querySelector(".code-block code");
const taskForm = document.querySelector("[data-task-form]");

if (copyButton && configBlock) {
  copyButton.addEventListener("click", async () => {
    const originalLabel = copyButton.textContent;

    try {
      await navigator.clipboard.writeText(configBlock.textContent.trim());
      copyButton.textContent = "已复制";
    } catch {
      copyButton.textContent = "请手动复制";
    }

    window.setTimeout(() => {
      copyButton.textContent = originalLabel;
    }, 1800);
  });
}

if (taskForm) {
  const materialInputs = [...taskForm.querySelectorAll('input[name="material"]')];
  const dependentSelects = [...taskForm.querySelectorAll("select")].filter((select) =>
    select.querySelector("option[data-material]")
  );

  const syncMaterialOptions = () => {
    const material = materialInputs.find((input) => input.checked)?.value ?? "poster";

    dependentSelects.forEach((select) => {
      const options = [...select.querySelectorAll("option[data-material]")];

      options.forEach((option) => {
        const matches = option.dataset.material === material;
        option.hidden = !matches;
        option.disabled = !matches;
      });

      const firstMatch = options.find((option) => option.dataset.material === material);
      if (firstMatch) select.value = firstMatch.value;
    });

    const gridTitle = document.querySelector("[data-rule-grid-title]");
    const gridDescription = document.querySelector("[data-rule-grid-description]");
    if (gridTitle && gridDescription) {
      gridTitle.textContent = material === "long-image" ? "Long Image Grid" : "Poster Grid";
      gridDescription.textContent = material === "long-image"
        ? "开场、内容模块与收束区"
        : "文字区、主体区与安全区";
    }
  };

  materialInputs.forEach((input) => input.addEventListener("change", syncMaterialOptions));
  const initialParams = new URLSearchParams(window.location.search);
  const requestedMaterial = initialParams.get("material");
  const requestedInput = materialInputs.find((input) => input.value === requestedMaterial);
  if (requestedInput) requestedInput.checked = true;
  syncMaterialOptions();

  const requestedTemplate = initialParams.get("template");
  const templateSelect = taskForm.querySelector("#template");
  const requestedOption = [...templateSelect.options].find(
    (option) => !option.disabled && option.value === requestedTemplate
  );
  if (requestedOption) templateSelect.value = requestedOption.value;

  const requestedSize = initialParams.get("size");
  const sizeSelect = taskForm.querySelector("#size");
  const requestedSizeOption = [...sizeSelect.options].find(
    (option) => !option.disabled && option.value === requestedSize
  );
  if (requestedSizeOption) sizeSelect.value = requestedSizeOption.value;

  const requestedTheme = initialParams.get("theme");
  const themeSelect = taskForm.querySelector("#theme");
  if ([...themeSelect.options].some((option) => option.value === requestedTheme)) {
    themeSelect.value = requestedTheme;
  }
}

const agentForm = document.querySelector("[data-agent-form]");

if (agentForm) {
  const entry = document.querySelector("[data-agent-entry]");
  const flow = document.querySelector("[data-agent-flow]");
  const canvas = document.querySelector("[data-agent-canvas]");
  const input = agentForm.querySelector("[data-agent-input]");
  const submitButton = agentForm.querySelector('[type="submit"]');
  const requestCopy = document.querySelector("[data-agent-request-copy]");
  const stages = [...document.querySelectorAll("[data-agent-stage]")];
  const steps = [...document.querySelectorAll(".agent-step")];
  const checks = [...document.querySelectorAll(".agent-check")];
  const checkCount = document.querySelector("[data-agent-check-count]");
  const output = document.querySelector("[data-agent-output]");
  const outputVisual = output?.querySelector("[data-pixel-reveal]");
  const outputImage = output?.querySelector("[data-agent-output-image]");
  const outputCanvas = output?.querySelector("[data-agent-output-canvas]");
  const outputLink = output?.querySelector("[data-agent-result-link]");
  const requestCard = document.querySelector("[data-agent-request-card]");
  const reset = document.querySelector("[data-agent-reset]");
  const typeTarget = document.querySelector("[data-agent-type]");
  const sweepLabels = [...document.querySelectorAll("[data-ascii-sweep]")];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const timers = [];
  const sweepAnimations = new Map();
  const typePhrases = ["早上好，说下你的需求", "也可以直接贴云文档"];
  const graphemeSegmenter = typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter("zh-CN", { granularity: "grapheme" })
    : null;
  let typeTimer = 0;
  let typePhraseIndex = 0;
  let typeCharacterIndex = 0;
  let typeDeleting = false;
  let demoRunId = 0;
  let isDemoRunning = false;
  let morphGhost = null;
  let morphAnimations = [];
  let pixelRevealFrame = 0;
  let pixelRevealToken = 0;

  const syncSubmitButton = () => {
    const isEmpty = !input.value.trim();
    submitButton.disabled = isEmpty;
    submitButton.classList.toggle("disabled", isEmpty);
  };

  const clearDemoTimers = () => {
    while (timers.length) window.clearTimeout(timers.pop());
  };

  const schedule = (callback, delay) => {
    if (reduceMotion) callback();
    else timers.push(window.setTimeout(callback, delay));
  };

  const nextPaint = () => new Promise((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
  });

  const clearMorph = () => {
    morphAnimations.forEach((animation) => animation.cancel());
    morphAnimations = [];
    morphGhost?.remove();
    morphGhost = null;
    flow?.classList.remove("is-preparing", "is-morphing");
  };

  const morphComposerToRequest = async (requestText) => {
    if (!entry || !flow || !requestCard) return;

    const directSwap = reduceMotion || window.matchMedia("(max-width: 700px)").matches ||
      typeof agentForm.animate !== "function";
    if (directSwap) {
      entry.hidden = true;
      flow.hidden = false;
      flow.classList.add("is-visible");
      return;
    }

    const sourceRect = agentForm.getBoundingClientRect();
    const ghost = agentForm.cloneNode(true);
    ghost.classList.add("agent-morph-ghost");
    ghost.removeAttribute("data-agent-form");
    ghost.setAttribute("aria-hidden", "true");
    ghost.inert = true;
    ghost.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
    ghost.querySelectorAll("[name]").forEach((element) => element.removeAttribute("name"));
    ghost.querySelectorAll("[required]").forEach((element) => element.removeAttribute("required"));
    ghost.querySelectorAll("button,textarea").forEach((element) => {
      element.tabIndex = -1;
    });
    const ghostInput = ghost.querySelector("textarea");
    if (ghostInput) ghostInput.value = requestText;

    const summary = document.createElement("div");
    summary.className = "agent-morph-summary";
    const summaryCopy = document.createElement("p");
    summaryCopy.textContent = requestText;
    const summaryMeta = document.createElement("span");
    summaryMeta.textContent = "需求已读取";
    summary.append(summaryCopy, summaryMeta);
    ghost.append(summary);

    Object.assign(ghost.style, {
      left: `${sourceRect.left}px`,
      top: `${sourceRect.top}px`,
      width: `${sourceRect.width}px`,
      height: `${sourceRect.height}px`,
      boxSizing: "border-box"
    });
    document.body.append(ghost);
    morphGhost = ghost;

    entry.hidden = true;
    flow.hidden = false;
    flow.classList.add("is-visible", "is-preparing", "is-morphing");
    await nextPaint();

    if (morphGhost !== ghost) return;
    const targetRect = requestCard.getBoundingClientRect();
    if (!targetRect.width || !targetRect.height) {
      clearMorph();
      flow.classList.add("is-visible");
      return;
    }

    const targetStyle = window.getComputedStyle(requestCard);
    flow.classList.remove("is-preparing");

    const duration = 780;
    const geometry = ghost.animate([
      {
        left: `${sourceRect.left}px`,
        top: `${sourceRect.top}px`,
        width: `${sourceRect.width}px`,
        height: `${sourceRect.height}px`,
        borderRadius: "16px",
        backgroundColor: "#f5f5f5",
        boxShadow: "0 3px 9px rgba(24,24,24,.06)"
      },
      {
        left: `${targetRect.left}px`,
        top: `${targetRect.top}px`,
        width: `${targetRect.width}px`,
        height: `${targetRect.height}px`,
        borderRadius: targetStyle.borderRadius,
        backgroundColor: targetStyle.backgroundColor,
        boxShadow: targetStyle.boxShadow
      }
    ], {
      duration,
      easing: "cubic-bezier(.22,1,.36,1)",
      fill: "forwards"
    });

    const oldContent = [
      ghost.querySelector(".messageInputChatInput"),
      ghost.querySelector(".inputBarContainer-sSF0Pb")
    ].filter(Boolean);
    const contentAnimations = oldContent.map((element) => element.animate([
      { opacity: 1, transform: "translateY(0)" },
      { opacity: 1, transform: "translateY(0)", offset: .28 },
      { opacity: 0, transform: "translateY(-4px)", offset: .58 },
      { opacity: 0, transform: "translateY(-4px)" }
    ], { duration, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" }));
    const summaryAnimation = summary.animate([
      { opacity: 0, transform: "translateY(5px)" },
      { opacity: 0, transform: "translateY(5px)", offset: .5 },
      { opacity: 1, transform: "translateY(0)", offset: .82 },
      { opacity: 1, transform: "translateY(0)" }
    ], { duration, easing: "cubic-bezier(.22,1,.36,1)", fill: "forwards" });

    morphAnimations = [geometry, summaryAnimation, ...contentAnimations];
    const revealTimer = window.setTimeout(() => {
      flow.classList.remove("is-morphing");
    }, duration - 130);
    timers.push(revealTimer);

    try {
      await geometry.finished;
    } catch {
      return;
    }
    if (morphGhost !== ghost) return;
    flow.classList.remove("is-morphing");
    morphAnimations = [];
    ghost.remove();
    morphGhost = null;
  };

  const segmentText = (text) => graphemeSegmenter
    ? [...graphemeSegmenter.segment(text)].map(({ segment }) => segment)
    : Array.from(text);

  const renderTypeTitle = () => {
    if (!typeTarget) return;
    typeTarget.textContent = segmentText(typePhrases[typePhraseIndex])
      .slice(0, typeCharacterIndex)
      .join("");
  };

  const stopTypewriter = () => {
    window.clearTimeout(typeTimer);
    typeTimer = 0;
  };

  const nextTypingDelay = () => Math.random() * (120 - 10) + 10;

  const tickTypewriter = () => {
    if (!typeTarget || reduceMotion) return;
    const phrase = segmentText(typePhrases[typePhraseIndex]);

    if (typeDeleting) {
      typeCharacterIndex = Math.max(0, typeCharacterIndex - 1);
      renderTypeTitle();
      if (typeCharacterIndex === 0) {
        typePhraseIndex = (typePhraseIndex + 1) % typePhrases.length;
        typeDeleting = false;
        typeTimer = window.setTimeout(tickTypewriter, nextTypingDelay());
      } else {
        typeTimer = window.setTimeout(tickTypewriter, 10);
      }
      return;
    }

    typeCharacterIndex = Math.min(phrase.length, typeCharacterIndex + 1);
    renderTypeTitle();
    if (typeCharacterIndex === phrase.length) {
      typeDeleting = true;
      typeTimer = window.setTimeout(tickTypewriter, 1500);
    } else {
      typeTimer = window.setTimeout(tickTypewriter, nextTypingDelay());
    }
  };

  const startTypewriter = () => {
    stopTypewriter();
    if (!typeTarget) return;
    typePhraseIndex = 0;
    typeCharacterIndex = reduceMotion ? segmentText(typePhrases[0]).length : 0;
    typeDeleting = false;
    renderTypeTitle();
    if (!reduceMotion) typeTimer = window.setTimeout(tickTypewriter, nextTypingDelay());
  };

  const ASCII_CAPTURE_DELAY_MS = 40;
  const ASCII_SWEEP_DURATION_MS = 700;
  const ASCII_SWEEP_DURATION_S = ASCII_SWEEP_DURATION_MS / 1000;
  const ASCII_FADE_OUT_MS = 460;
  const ROW_SPIN_MS = 220;
  const ROW_GAP_MS = 60;
  const ROW_CYCLE_MS = ROW_SPIN_MS + ASCII_CAPTURE_DELAY_MS +
    ASCII_SWEEP_DURATION_MS + ASCII_FADE_OUT_MS + ROW_GAP_MS;

  const restoreAsciiLabel = (label) => {
    const finalText = label.dataset.asciiText || label.textContent;
    label.classList.remove("is-sweeping", "is-dissolving");
    label.textContent = finalText;
  };

  const stopAsciiSweep = (label, restore = true) => {
    const animation = sweepAnimations.get(label);
    if (animation?.frame) window.cancelAnimationFrame(animation.frame);
    if (animation?.startTimer) window.clearTimeout(animation.startTimer);
    if (animation?.finishTimer) window.clearTimeout(animation.finishTimer);
    if (animation?.timeout) window.clearTimeout(animation.timeout);
    animation?.instance?.destroy?.();
    sweepAnimations.delete(label);
    if (restore) restoreAsciiLabel(label);
  };

  const clearAsciiSweeps = () => {
    sweepLabels.forEach((label) => stopAsciiSweep(label));
  };

  const measureAsciiText = (label) => {
    const labelRect = label.getBoundingClientRect();
    const style = window.getComputedStyle(label);
    const range = document.createRange();
    range.selectNodeContents(label);
    const textRect = range.getBoundingClientRect();
    range.detach?.();
    const width = Math.max(1, Math.min(labelRect.width, textRect.width || labelRect.width));
    const lineHeight = Number.parseFloat(style.lineHeight) || textRect.height || labelRect.height || 16;
    return { width: Math.ceil(width + 1), height: Math.ceil(lineHeight) };
  };

  const resolveOpaqueBackground = (row) => {
    const background = window.getComputedStyle(row).backgroundColor;
    if (background && background !== "transparent" && background !== "rgba(0, 0, 0, 0)") {
      return background;
    }
    return "#ffffff";
  };

  const playCanvasAsciiSweep = (row, label, finalText, onComplete) => {
    const api = window.CanvasUIAsciiSweep;
    if (!api?.createAsciiSweep) return false;

    const { width, height } = measureAsciiText(label);
    const labelColor = window.getComputedStyle(label).color || "#4b4d54";
    const background = resolveOpaqueBackground(row);
    const nativeCanvas = api.supportsHtmlInCanvas?.() ?? false;
    const root = document.createElement("span");
    root.className = "agent-ascii-sweep";
    root.style.width = `${width}px`;
    root.style.height = `${height}px`;
    root.style.backgroundColor = background;

    const sources = [document.createElement("canvas"), document.createElement("canvas")];
    const panels = [document.createElement("span"), document.createElement("span")];
    const outputCanvas = document.createElement("canvas");
    sources.forEach((source) => {
      source.className = `agent-ascii-source${nativeCanvas ? "" : " is-fallback"}`;
      source.setAttribute("layoutsubtree", "true");
    });
    panels.forEach((panel, index) => {
      panel.className = "agent-ascii-panel";
      panel.textContent = finalText;
      panel.style.color = index === 0 ? labelColor : "#18181b";
      panel.style.backgroundColor = background;
    });
    outputCanvas.className = "agent-ascii-output";
    outputCanvas.setAttribute("aria-hidden", "true");

    if (nativeCanvas) {
      sources.forEach((source, index) => source.append(panels[index]));
      root.append(...sources, outputCanvas);
    } else {
      root.append(...sources, ...panels, outputCanvas);
    }
    label.replaceChildren(root);
    label.classList.add("is-sweeping");

    const state = {
      instance: null,
      startTimer: 0,
      finishTimer: 0,
    };
    const finish = () => {
      if (sweepAnimations.get(label) !== state) return;
      stopAsciiSweep(label);
      onComplete?.();
    };

    const instance = api.createAsciiSweep({
      slots: [
        { source: sources[0], content: panels[0] },
        { source: sources[1], content: panels[1] },
      ],
      output: outputCanvas,
    }, {
      angle: 0,
      duration: ASCII_SWEEP_DURATION_S,
      band: 0.28,
      softness: 0.45,
      turbulence: 0.5,
      trail: 0.75,
      scale: 1,
      spacing: 1,
      charset: "ascii",
      color: "#18181b",
      tint: 1,
      glow: 0.75,
      aberration: 0,
      flicker: 0.28,
      density: 0.9,
      displace: 2,
      contrast: 1.15,
      threshold: 0.08,
      fade: 0.78,
      blend: "over",
      background,
      onSweepEnd: () => {
        state.finishTimer = window.setTimeout(finish, ASCII_FADE_OUT_MS);
      },
    });

    if (!instance) {
      label.textContent = finalText;
      label.classList.remove("is-sweeping");
      return false;
    }

    state.instance = instance;
    sweepAnimations.set(label, state);
    state.startTimer = window.setTimeout(() => {
      if (sweepAnimations.get(label) !== state) return;
      instance.capture();
      instance.sweep(1);
    }, ASCII_CAPTURE_DELAY_MS);
    return true;
  };

  const playDomAsciiSweep = (label, finalText, onComplete) => {
    const characters = segmentText(finalText);
    const fragment = document.createDocumentFragment();
    characters.forEach((character) => {
      const glyph = document.createElement("span");
      glyph.className = "agent-sweep-glyph";
      glyph.dataset.original = character;
      glyph.textContent = character;
      fragment.append(glyph);
    });
    label.replaceChildren(fragment);

    const glyphs = [...label.querySelectorAll(".agent-sweep-glyph")];
    const widths = glyphs.map((glyph) => glyph.getBoundingClientRect().width);
    glyphs.forEach((glyph, index) => {
      const minimum = glyph.dataset.original === " "
        ? (Number.parseFloat(window.getComputedStyle(glyph).fontSize) || 12) * 0.25
        : 1;
      glyph.style.inlineSize = `${Math.max(widths[index], minimum)}px`;
    });

    label.classList.add("is-sweeping");
    const charset = "01/\\|[]{}<>+=*#@";
    const band = 0.28;
    const turbulence = 0.5;
    const startedAt = performance.now();
    const state = { frame: 0, timeout: 0 };
    sweepAnimations.set(label, state);

    const finish = () => {
      if (sweepAnimations.get(label) !== state) return;
      stopAsciiSweep(label);
      onComplete?.();
    };

    const draw = (now) => {
      const linear = Math.min(1, (now - startedAt) / ASCII_SWEEP_DURATION_MS);
      const progress = 1 - Math.pow(1 - linear, 3);
      const head = progress * (1 + band * 1.75 + turbulence * band);
      const tick = Math.floor((now - startedAt) / 66);

      glyphs.forEach((glyph, index) => {
        const original = glyph.dataset.original;
        if (/\s/u.test(original)) return;
        const x = (index + 0.5) / Math.max(glyphs.length, 1);
        const seed = Math.sin((index + 1) * 12.9898 + tick * 78.233) * 43758.5453;
        const noise = seed - Math.floor(seed);
        const axis = x + (noise - 0.5) * turbulence * band * 0.18;
        const behind = head - axis;
        const inBand = behind > 0 && behind < band * 1.75;
        if (inBand && noise < 0.9) {
          glyph.textContent = charset[Math.floor(noise * charset.length) % charset.length];
          glyph.style.color = "#18181b";
          glyph.style.opacity = `${0.62 + noise * 0.38}`;
          glyph.style.textShadow = `0 0 ${2 + noise * 4}px rgba(24,24,27,.28)`;
          glyph.style.transform = `translateX(${((noise - 0.5) * 2).toFixed(2)}px)`;
        } else {
          glyph.textContent = original;
          glyph.style.color = behind >= band * 0.62 ? "#18181b" : "#8f9096";
          glyph.style.opacity = "1";
          glyph.style.textShadow = "";
          glyph.style.transform = "";
        }
      });

      if (linear < 1) {
        state.frame = window.requestAnimationFrame(draw);
        return;
      }
      label.classList.add("is-dissolving");
      glyphs.forEach((glyph) => {
        glyph.textContent = glyph.dataset.original;
        glyph.style.color = "#18181b";
        glyph.style.opacity = "1";
        glyph.style.textShadow = "";
        glyph.style.transform = "";
      });
      state.timeout = window.setTimeout(finish, 220);
    };
    state.frame = window.requestAnimationFrame(draw);
  };

  const playAsciiSweep = (row, onComplete) => {
    const label = row?.querySelector?.("[data-ascii-sweep]");
    if (!label) {
      onComplete?.();
      return;
    }
    const finalText = label.dataset.asciiText || label.textContent.trim();
    label.dataset.asciiText = finalText;
    stopAsciiSweep(label);
    if (reduceMotion) {
      label.textContent = finalText;
      onComplete?.();
      return;
    }
    if (!playCanvasAsciiSweep(row, label, finalText, onComplete)) {
      playDomAsciiSweep(label, finalText, onComplete);
    }
  };

  const settleRow = (row, doneClass, onComplete) => {
    if (!row || row.classList.contains(doneClass) || row.classList.contains("is-settling")) return;
    row.classList.add("is-settling");
    playAsciiSweep(row, () => {
      if (!row.classList.contains("is-settling")) return;
      row.classList.remove("is-current", "is-settling");
      row.classList.add(doneClass);
      onComplete?.();
    });
  };

  const forceRowComplete = (row, doneClass) => {
    const label = row?.querySelector?.("[data-ascii-sweep]");
    if (label) stopAsciiSweep(label);
    row?.classList.remove("is-current", "is-settling");
    row?.classList.add(doneClass);
  };

  const markStepDone = (step, onComplete) => settleRow(step, "is-done", onComplete);
  const markCheckPassed = (check, onComplete) => settleRow(check, "is-passed", onComplete);

  const resetPixelOutput = () => {
    pixelRevealToken += 1;
    if (pixelRevealFrame) window.cancelAnimationFrame(pixelRevealFrame);
    pixelRevealFrame = 0;
    output?.classList.remove("is-pixelating", "is-ready");
    if (outputCanvas) {
      outputCanvas.style.visibility = "";
      const context = outputCanvas.getContext("2d");
      if (context) {
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
      }
    }
  };

  const revealPixelOutput = async () => {
    if (!output || !outputVisual || !outputImage || !outputCanvas ||
      output.classList.contains("is-pixelating") || output.classList.contains("is-ready")) return;

    const token = ++pixelRevealToken;
    output.classList.add("is-pixelating");
    outputCanvas.style.visibility = "visible";

    try {
      if (typeof outputImage.decode === "function") await outputImage.decode();
    } catch {
      if (!outputImage.complete) {
        await new Promise((resolve) => {
          outputImage.addEventListener("load", resolve, { once: true });
          outputImage.addEventListener("error", resolve, { once: true });
        });
      }
    }
    if (token !== pixelRevealToken) return;

    if (reduceMotion) {
      output.classList.remove("is-pixelating");
      output.classList.add("is-ready");
      outputCanvas.style.visibility = "hidden";
      return;
    }

    const rect = outputVisual.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const gap = 8;
    const columns = Math.ceil(width / gap);
    const rows = Math.ceil(height / gap);
    const context = outputCanvas.getContext("2d");
    if (!context) {
      output.classList.remove("is-pixelating");
      output.classList.add("is-ready");
      return;
    }

    outputCanvas.width = Math.ceil(width * dpr);
    outputCanvas.height = Math.ceil(height * dpr);
    outputCanvas.style.width = `${width}px`;
    outputCanvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.imageSmoothingEnabled = false;

    const mosaic = document.createElement("canvas");
    mosaic.width = columns;
    mosaic.height = rows;
    const mosaicContext = mosaic.getContext("2d");
    const coverScale = Math.max(
      width / Math.max(outputImage.naturalWidth, 1),
      height / Math.max(outputImage.naturalHeight, 1)
    );
    const sourceWidth = width / coverScale;
    const sourceHeight = height / coverScale;
    const sourceX = (outputImage.naturalWidth - sourceWidth) / 2;
    const sourceY = (outputImage.naturalHeight - sourceHeight) / 2;
    mosaicContext.drawImage(
      outputImage,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      columns,
      rows
    );

    const maxDistance = Math.hypot(width / 2, height / 2);
    const cells = [];
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const x = column * gap;
        const y = row * gap;
        const cellWidth = Math.min(gap, width - x);
        const cellHeight = Math.min(gap, height - y);
        const distance = Math.hypot(
          x + cellWidth / 2 - width / 2,
          y + cellHeight / 2 - height / 2
        );
        cells.push({
          column,
          row,
          x,
          y,
          width: cellWidth,
          height: cellHeight,
          delay: 420 + (distance / Math.max(maxDistance, 1)) * 920 + Math.random() * 90,
          duration: 480 + Math.random() * 240
        });
      }
    }

    const startedAt = performance.now();
    const drawFrame = (now) => {
      if (token !== pixelRevealToken) return;
      const elapsed = now - startedAt;
      let complete = true;
      context.clearRect(0, 0, width, height);

      cells.forEach((cell) => {
        const progress = Math.max(0, Math.min(1, (elapsed - cell.delay) / cell.duration));
        if (progress < 1) complete = false;
        if (progress <= 0) return;
        const eased = 1 - Math.pow(1 - progress, 3);
        const drawWidth = cell.width * eased;
        const drawHeight = cell.height * eased;
        context.drawImage(
          mosaic,
          cell.column,
          cell.row,
          1,
          1,
          cell.x + (cell.width - drawWidth) / 2,
          cell.y + (cell.height - drawHeight) / 2,
          drawWidth,
          drawHeight
        );
      });

      if (!complete) {
        pixelRevealFrame = window.requestAnimationFrame(drawFrame);
        return;
      }

      pixelRevealFrame = 0;
      output.classList.add("is-ready");
      const hideCanvasTimer = window.setTimeout(() => {
        if (token !== pixelRevealToken) return;
        output.classList.remove("is-pixelating");
        outputCanvas.style.visibility = "hidden";
      }, 760);
      timers.push(hideCanvasTimer);
    };

    pixelRevealFrame = window.requestAnimationFrame(drawFrame);
  };

  const resetDemoState = () => {
    demoRunId += 1;
    isDemoRunning = false;
    clearDemoTimers();
    clearMorph();
    clearAsciiSweeps();
    resetPixelOutput();
    canvas.classList.remove("is-running", "is-complete");
    flow.classList.remove("is-visible", "is-complete");
    flow.setAttribute("aria-busy", "false");
    stages.forEach((stage, index) => stage.classList.toggle("is-active", index === 0));
    steps.forEach((step) => step.classList.remove("is-current", "is-settling", "is-done"));
    checks.forEach((check) => check.classList.remove("is-current", "is-settling", "is-passed"));
    if (checkCount) checkCount.textContent = `0 / ${checks.length}`;
  };

  const completeDemo = () => {
    stages.forEach((stage) => stage.classList.add("is-active"));
    steps.forEach((step) => forceRowComplete(step, "is-done"));
    checks.forEach((check) => forceRowComplete(check, "is-passed"));
    if (checkCount) checkCount.textContent = `${checks.length} / ${checks.length}`;
    revealPixelOutput();
    canvas.classList.remove("is-running");
    canvas.classList.add("is-complete");
    flow.classList.add("is-complete");
    flow.setAttribute("aria-busy", "false");
  };

  const runDemo = async (requestText) => {
    if (isDemoRunning) return;
    resetDemoState();
    isDemoRunning = true;
    const runId = demoRunId;
    stopTypewriter();
    requestCopy.textContent = requestText;
    input.blur();
    submitButton.disabled = true;
    submitButton.classList.add("disabled");

    await morphComposerToRequest(requestText);
    if (runId !== demoRunId) return;

    flow.setAttribute("aria-busy", "true");
    flow.classList.add("is-visible");
    canvas.classList.add("is-running");

    if (reduceMotion) {
      completeDemo();
      return;
    }

    schedule(() => stages[1]?.classList.add("is-active"), 180);
    let cursor = 300;
    steps.forEach((step) => {
      schedule(() => step.classList.add("is-current"), cursor);
      schedule(() => markStepDone(step), cursor + ROW_SPIN_MS);
      cursor += ROW_CYCLE_MS;
    });

    schedule(() => stages[2]?.classList.add("is-active"), cursor);
    cursor += 180;
    checks.forEach((check, index) => {
      schedule(() => check.classList.add("is-current"), cursor);
      schedule(() => markCheckPassed(check, () => {
        if (checkCount) checkCount.textContent = `${index + 1} / ${checks.length}`;
      }), cursor + ROW_SPIN_MS);
      cursor += ROW_CYCLE_MS;
    });

    schedule(completeDemo, cursor + 80);
  };

  const params = new URLSearchParams(window.location.search);
  const requestedTemplate = params.get("template");
  if (outputLink) outputLink.href = `make-result.html${window.location.search}`;
  if (requestedTemplate && !input.value) {
    const materialLabel = params.get("material") === "long-image" ? "营销长图" : "活动海报";
    const details = [params.get("size"), params.get("theme")].filter(Boolean).join("，");
    input.value = `请使用「${requestedTemplate}」模板生成${materialLabel}${details ? `，${details}` : ""}。`;
  }
  syncSubmitButton();
  startTypewriter();

  agentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const requestText = input.value.trim() || "请制作一张城市美食节活动海报。";
    runDemo(requestText);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      agentForm.requestSubmit();
    }
  });

  input.addEventListener("input", syncSubmitButton);

  reset?.addEventListener("click", () => {
    resetDemoState();
    flow.hidden = true;
    entry.hidden = false;
    entry.classList.remove("is-leaving");
    startTypewriter();
    syncSubmitButton();
    input.focus();
  });
}

const resultTitle = document.querySelector("[data-result-title]");

if (resultTitle) {
  const params = new URLSearchParams(window.location.search);
  const isLongImage = params.get("material") === "long-image";
  const selectedSize = params.get("size");
  const selectedTemplate = params.get("template");
  const selectedTheme = params.get("theme") ?? "标准活力";
  const baseName = selectedTemplate?.split(" · ")[0] ?? (isLongImage ? "商圈必逛榜" : "城市美食节");
  const templateVariant = selectedTemplate?.split(" · ")[1];
  const outputLabel = templateVariant === "主视觉"
    ? "主海报"
    : templateVariant ?? (isLongImage ? "营销长图" : "主海报");
  const taskTitle = `${baseName}${outputLabel}`;

  resultTitle.textContent = taskTitle;
  document.title = `BrandKit · ${taskTitle}`;
  document.querySelector("[data-result-side-title]").textContent = taskTitle;
  document.querySelector("[data-result-preview]").setAttribute("aria-label", `${taskTitle}参考板`);
  document.querySelector("[data-result-audit]").href =
    `review.html?task=${isLongImage ? "long-image" : "poster"}&name=${encodeURIComponent(baseName)}&label=${encodeURIComponent(outputLabel)}`;
  document.querySelector("[data-result-edit]").href = `make-new.html${window.location.search}`;
  document.querySelector("[data-result-theme]").textContent = selectedTheme;
  document.querySelector("[data-result-theme-description]").textContent = `${selectedTheme}组合`;

  if (selectedSize) document.querySelector("[data-result-size]").textContent = selectedSize;
  if (selectedTemplate) {
    document.querySelector("[data-result-description]").textContent =
      `已套用“${selectedTemplate}”模板，并完成基础品牌检查。`;
  }

  if (isLongImage) {
    document.querySelector("[data-result-type]").textContent = "营销长图";
    document.querySelector("[data-result-layout-check]").textContent = "标题与主体位于长图模块安全区内";
    document.querySelector("[data-result-grid-description]").textContent = "营销长图模块区域";

    const image = document.querySelector("[data-result-image]");
    image.src = "assets/brand-02.png";
    image.alt = `${taskTitle}参考板`;

    const download = document.querySelector("[data-result-download]");
    download.href = "assets/brand-02.png";
  }
}

const auditFeaturedTitle = document.querySelector("[data-audit-title]");
const auditScrollStage = document.querySelector("[data-audit-scroll]");

if (auditScrollStage) {
  const auditScrollShell = auditScrollStage.closest("[data-audit-scroll-shell]");
  let auditScrollFrame = 0;

  const syncAuditScrollFade = () => {
    window.cancelAnimationFrame(auditScrollFrame);
    auditScrollFrame = window.requestAnimationFrame(() => {
      const maxScrollLeft = Math.max(0, auditScrollStage.scrollWidth - auditScrollStage.clientWidth);
      const isAtEnd = maxScrollLeft <= 1 || auditScrollStage.scrollLeft >= maxScrollLeft - 2;
      auditScrollShell?.classList.toggle("is-at-end", isAtEnd);
    });
  };

  syncAuditScrollFade();
  auditScrollStage.addEventListener("scroll", syncAuditScrollFade, { passive: true });
  window.addEventListener("resize", syncAuditScrollFade);
}

if (auditFeaturedTitle) {
  const params = new URLSearchParams(window.location.search);
  const isLongImage = params.get("task") === "long-image";
  const baseName = params.get("name") ?? (isLongImage ? "商圈必逛榜" : "城市美食节");
  const outputLabel = params.get("label") ?? (isLongImage ? "营销长图" : "主海报");
  const taskTitle = `${baseName}${outputLabel}`;

  auditFeaturedTitle.textContent = taskTitle;

  if (isLongImage) {
    const image = document.querySelector("[data-audit-image]");
    if (image) {
      image.src = "assets/brand-02.png";
      image.alt = `${taskTitle}参考板`;
    }
  }
}

const templateCards = [...document.querySelectorAll("[data-template-card]")];

if (templateCards.length) {
  const search = document.querySelector("[data-template-search]");
  const filters = [...document.querySelectorAll("[data-template-filter]")];
  const categoryButtons = [...document.querySelectorAll("[data-template-category]")];
  const count = document.querySelector("[data-template-count]");
  const empty = document.querySelector("[data-template-empty]");

  const applyTemplateFilters = () => {
    const query = search?.value.trim().toLocaleLowerCase("zh-CN") ?? "";
    const activeCategory = categoryButtons.find((button) => button.classList.contains("on"))?.dataset.templateCategory ?? "all";
    let visibleCount = 0;

    templateCards.forEach((card) => {
      const searchableText = `${card.dataset.title ?? ""} ${card.textContent}`.toLocaleLowerCase("zh-CN");
      const matchesSearch = !query || searchableText.includes(query);
      const matchesFilters = filters.every((filter) =>
        filter.value === "all" || card.dataset[filter.dataset.templateFilter] === filter.value
      );
      const matchesCategory = activeCategory === "all" || card.dataset.category === activeCategory;
      const visible = matchesSearch && matchesFilters && matchesCategory;
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    if (count) count.textContent = `共 ${visibleCount} 套模板`;
    if (empty) empty.hidden = visibleCount !== 0;
  };

  search?.addEventListener("input", applyTemplateFilters);
  filters.forEach((filter) => filter.addEventListener("change", applyTemplateFilters));
  categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      categoryButtons.forEach((item) => {
        const selected = item === button;
        item.classList.toggle("on", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      applyTemplateFilters();
    });
  });
}

document.querySelectorAll("[data-motion-replay]").forEach((button) => {
  button.addEventListener("click", () => {
    const demo = button.closest("[data-motion-demo]");
    if (!demo) return;

    demo.classList.remove("is-playing");
    void demo.offsetWidth;
    demo.classList.add("is-playing");
  });
});

document.querySelectorAll("[data-moodboard]").forEach((moodboard) => {
  const buttons = [...moodboard.querySelectorAll("[data-mood-layout]")];

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const columns = button.dataset.moodLayout === "columns";
      moodboard.classList.toggle("is-columns", columns);

      buttons.forEach((item) => {
        const selected = item === button;
        item.classList.toggle("on", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
    });
  });
});

document.querySelectorAll("[data-ip-library]").forEach((library) => {
  const button = library.querySelector("[data-ip-more]");
  if (!button) return;
  const extraCount = library.querySelectorAll(".ip-extra").length;

  button.addEventListener("click", () => {
    const expanded = library.classList.toggle("is-expanded");
    button.setAttribute("aria-expanded", String(expanded));
    button.textContent = expanded ? "收起" : `显示更多 · ${extraCount}`;
  });
});

const skillDialogTriggers = [...document.querySelectorAll("[data-skill-dialog]")];

if (skillDialogTriggers.length) {
  const backdrop = document.createElement("div");
  backdrop.className = "skill-dialog-backdrop";
  backdrop.hidden = true;
  backdrop.innerHTML = `
    <section class="skill-dialog" id="skill-constraint-dialog" role="dialog" aria-modal="true" aria-labelledby="skill-dialog-heading" tabindex="-1">
      <header class="skill-dialog-head">
        <span class="skill-file-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
            <path d="M7 4.5h7l3 3V20H7z"/>
            <path d="M14 4.5V8h3M9.5 12h5M9.5 15h5"/>
          </svg>
        </span>
        <div class="skill-dialog-title">
          <h2 id="skill-dialog-heading">SKILL.md</h2>
          <p data-skill-subtitle>BrandKit constraint documentation</p>
        </div>
        <button class="skill-dialog-close" type="button" aria-label="关闭约束 Skill">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18"/>
          </svg>
        </button>
      </header>
      <div class="skill-dialog-body" data-skill-body tabindex="0"></div>
    </section>`;
  document.body.append(backdrop);

  const dialog = backdrop.querySelector(".skill-dialog");
  const closeButton = backdrop.querySelector(".skill-dialog-close");
  const body = backdrop.querySelector("[data-skill-body]");
  const subtitle = backdrop.querySelector("[data-skill-subtitle]");
  let activeTrigger = null;
  let loadToken = 0;
  let closeTimer = 0;

  const escapeHtml = (value) =>
    value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

  const setInlineContent = (element, value) => {
    element.innerHTML = escapeHtml(value)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  };

  const renderMarkdown = (markdown) => {
    const root = document.createElement("article");
    root.className = "skill-markdown";
    const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
    let list = null;
    let listType = "";
    let inCode = false;
    let codeLines = [];

    const resetList = () => {
      list = null;
      listType = "";
    };

    const appendCode = () => {
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      code.textContent = codeLines.join("\n");
      pre.append(code);
      root.append(pre);
      codeLines = [];
    };

    lines.forEach((line) => {
      if (line.trim().startsWith("```")) {
        resetList();
        if (inCode) appendCode();
        inCode = !inCode;
        return;
      }

      if (inCode) {
        codeLines.push(line);
        return;
      }

      if (!line.trim()) {
        resetList();
        return;
      }

      const heading = line.match(/^(#{1,3})\s+(.+)$/);
      if (heading) {
        resetList();
        const level = Math.min(3, heading[1].length);
        const element = document.createElement(`h${level}`);
        setInlineContent(element, heading[2]);
        root.append(element);
        return;
      }

      const quote = line.match(/^>\s?(.*)$/);
      if (quote) {
        resetList();
        const blockquote = document.createElement("blockquote");
        const paragraph = document.createElement("p");
        setInlineContent(paragraph, quote[1]);
        blockquote.append(paragraph);
        root.append(blockquote);
        return;
      }

      const unordered = line.match(/^[-*]\s+(.+)$/);
      const ordered = line.match(/^\d+\.\s+(.+)$/);
      if (unordered || ordered) {
        const nextType = ordered ? "ol" : "ul";
        if (!list || listType !== nextType) {
          list = document.createElement(nextType);
          listType = nextType;
          root.append(list);
        }
        const item = document.createElement("li");
        setInlineContent(item, (ordered ?? unordered)[1]);
        list.append(item);
        return;
      }

      resetList();
      const paragraph = document.createElement("p");
      setInlineContent(paragraph, line);
      root.append(paragraph);
    });

    if (inCode && codeLines.length) appendCode();
    return root;
  };

  const closeDialog = () => {
    if (backdrop.hidden) return;
    loadToken += 1;
    backdrop.classList.remove("is-open");
    document.body.classList.remove("skill-dialog-open");
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      backdrop.hidden = true;
      activeTrigger?.focus();
      activeTrigger = null;
    }, 180);
  };

  const openDialog = async (trigger) => {
    const token = ++loadToken;
    activeTrigger = trigger;
    window.clearTimeout(closeTimer);
    const sectionName = trigger.closest(".ghead")?.querySelector("h2")?.textContent.trim() || "Guide";
    subtitle.textContent = `${sectionName} · BrandKit constraint documentation`;
    body.replaceChildren();
    const loading = document.createElement("div");
    loading.className = "skill-dialog-state";
    loading.innerHTML = '<span class="skill-dialog-spinner" aria-hidden="true"></span><span>正在读取约束文档</span>';
    body.append(loading);
    body.scrollTop = 0;
    backdrop.hidden = false;
    document.body.classList.add("skill-dialog-open");
    window.requestAnimationFrame(() => backdrop.classList.add("is-open"));
    dialog.focus({ preventScroll: true });

    try {
      const response = await fetch(trigger.href, { cache: "no-store" });
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      const markdown = await response.text();
      if (token !== loadToken) return;
      body.replaceChildren(renderMarkdown(markdown));
      body.scrollTop = 0;
    } catch {
      if (token !== loadToken) return;
      const error = document.createElement("div");
      error.className = "skill-dialog-state";
      error.textContent = "暂时无法读取约束文档。";
      body.replaceChildren(error);
    }
  };

  skillDialogTriggers.forEach((trigger) => {
    trigger.removeAttribute("download");
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.setAttribute("aria-controls", "skill-constraint-dialog");
    trigger.addEventListener("click", (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      openDialog(trigger);
    });
  });

  closeButton.addEventListener("click", closeDialog);
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) closeDialog();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !backdrop.hidden) closeDialog();
  });
}
