const STORAGE_KEY = "cozy-life-quest-v1";
const STORAGE_BACKUP_KEY = "cozy-life-quest-v1-backup";
const STORAGE_HISTORY_KEY = "cozy-life-quest-v1-history";
const SUPABASE_CONFIG_KEY = "cozy-life-quest-supabase-config";
const DEVICE_ID_KEY = "cozy-life-quest-device-id";
const LEGACY_STORAGE_KEYS = ["cozy-life-quest"];
const SHARE_FILENAME_PREFIX = "cozy-life-quest";
const SNAPSHOT_LIMIT = 30;
const CLOUD_STATE_TABLE = "cozy_life_states";
const SUPABASE_LIBRARY_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
const APP_CLOUD_CONFIG = {
  url: window.COZY_LIFE_CLOUD_CONFIG?.url || "",
  anonKey: window.COZY_LIFE_CLOUD_CONFIG?.anonKey || ""
};
const FIXED_DAILY_TASK_IDS = ["breakfast", "lunch", "dinner", "outfit", "study4h"];

const DEFAULT_TASKS = [
  { id: "breakfast", name: "早餐", coins: 4, note: "认真吃一顿早餐" },
  { id: "lunch", name: "午餐", coins: 4, note: "好好吃饭" },
  { id: "dinner", name: "晚餐", coins: 4, note: "给今天收个尾" },
  { id: "outfit", name: "穿搭", coins: 4, note: "写一句今天的穿搭" },
  { id: "shower", name: "洗澡", coins: 4, note: "让自己清爽一点" },
  { id: "hair", name: "洗头", coins: 4, note: "头发护理完成" },
  { id: "makeup", name: "化妆", coins: 4, note: "认真打理自己" },
  { id: "snack", name: "零食", coins: 4, note: "吃到喜欢的小东西" },
  { id: "study4h", name: "学习 4h", coins: 20, note: "沉浸学习四小时" },
  { id: "workout", name: "健身", coins: 6, note: "动一动，身体会开心" },
  { id: "laundry", name: "洗衣服", coins: 4, note: "把衣服和生活一起整理好" }
];

const SOCIAL_PEOPLE = ["朋友", "家人", "同事", "恋爱", "陌生人", "其他"];
const SOCIAL_TYPES = ["见面", "吃饭", "聊天", "通话", "出游"];
const SOCIAL_FEELINGS = ["开心", "平静", "被治愈", "疲惫", "尴尬", "普通"];
const DAILY_EXPENSE_CATEGORIES = ["超市/网购/洗衣服", "社交聚餐", "短途旅行"];
const TRAVEL_EXPENSE_CATEGORIES = ["吃饭", "交通", "住宿", "纪念品", "门票"];
const DEFAULT_REWARDS = [];
const LEGACY_SYSTEM_REWARD_IDS = new Set(["r1", "r2"]);
const TASK_DETAIL_CONFIG = {
  breakfast: { label: "今天早餐吃了什么", placeholder: "比如：豆浆 + 面包 + 水煮蛋", type: "textarea", required: true },
  lunch: { label: "今天午餐吃了什么", placeholder: "比如：牛肉饭 + 青菜", type: "textarea", required: true },
  dinner: { label: "今天晚餐吃了什么", placeholder: "比如：番茄牛腩面", type: "textarea", required: true },
  outfit: { label: "今天穿了什么", placeholder: "比如：针织衫 + 牛仔裤", type: "input", required: true },
  workout: { label: "今天练了什么", placeholder: "比如：腿 + 臀 45 分钟", type: "textarea", required: true }
};
const SEASONS = {
  spring: { label: "Spring", caption: "春天是柔粉色的，像一页刚翻开的手帐。" },
  summer: { label: "Summer", caption: "夏天是温柔的绿色，像风和树叶一起慢下来。" },
  autumn: { label: "Autumn", caption: "秋天是金黄色的，把日常也照得暖一点。" },
  winter: { label: "Winter", caption: "冬天是浅蓝色的，安静又轻轻发亮。" }
};

let currentDate = todayISO();
let activeScreen = "today";
let activeBookTab = "daily";
let activeExpenseStatsRange = "month";
let activeSocialView = "list";
let activeSocialRange = "month";
let deferredInstallPrompt = null;
let persistenceStatus = "checking";
let storageMode = "loading";
let recoveryNotice = "";
let supabaseClient = null;
let authSession = null;
let cloudSyncStatus = "未配置云同步";
let cloudSyncMessage = "";
let cloudSyncTimer = null;
let cloudSyncInFlight = false;
let cloudBootstrapped = false;
let supabaseInitPromise = null;
let cloudConfig = loadCloudConfig();
let appCloudConfigured = Boolean(APP_CLOUD_CONFIG.url && APP_CLOUD_CONFIG.anonKey);
let authOtpPending = false;
const deviceId = getOrCreateDeviceId();

const state = loadState();

const refs = {
  screens: [...document.querySelectorAll("[data-screen]")],
  navBtns: [...document.querySelectorAll(".nav-btn")],
  seasonLabel: $("#season-label"),
  seasonCaption: $("#season-caption"),
  openSettings: $("#open-settings"),
  settingsDialog: $("#settings-dialog"),
  topStats: $("#top-stats"),
  currentDate: $("#current-date"),
  prevDay: $("#prev-day"),
  nextDay: $("#next-day"),
  openTaskPicker: $("#open-task-picker"),
  taskDialog: $("#task-dialog"),
  taskTemplateList: $("#task-template-list"),
  todayTaskList: $("#today-task-list"),
  fullBonus: $("#full-bonus"),
  socialPerson: $("#social-person"),
  socialType: $("#social-type"),
  socialFeeling: $("#social-feeling"),
  socialForm: $("#social-form"),
  socialNote: $("#social-note"),
  socialLog: $("#social-log"),
  ideaForm: $("#idea-form"),
  ideaTitle: $("#idea-title"),
  ideaBucket: $("#idea-bucket"),
  dailyIdeas: $("#daily-ideas"),
  travelIdeas: $("#travel-ideas"),
  bookIdeas: $("#book-ideas"),
  movieIdeas: $("#movie-ideas"),
  ritualForm: $("#ritual-form"),
  ritualTime: $("#ritual-time"),
  ritualJournal: $("#ritual-journal"),
  ritualSummary: $("#ritual-summary"),
  expenseForm: $("#expense-form"),
  expenseAmount: $("#expense-amount"),
  expenseCategory: $("#expense-category"),
  expenseBook: $("#expense-book"),
  expenseTripField: $("#expense-trip-field"),
  expenseTrip: $("#expense-trip"),
  expenseNote: $("#expense-note"),
  expensePanel: $("#expense-panel"),
  bookTabs: [...document.querySelectorAll("[data-book-tab]")],
  socialViewBtns: [...document.querySelectorAll("[data-social-view]")],
  socialRangeBtns: [...document.querySelectorAll("[data-social-range]")],
  socialStats: $("#social-stats"),
  socialRangeTabs: $("#social-range-tabs"),
  tripForm: $("#trip-form"),
  tripName: $("#trip-name"),
  tripCompany: $("#trip-company"),
  tripStart: $("#trip-start"),
  tripEnd: $("#trip-end"),
  tripList: $("#trip-list"),
  xpBreakdown: $("#xp-breakdown"),
  installStatus: $("#install-status"),
  installApp: $("#install-app"),
  requestPersistence: $("#request-persistence"),
  restoreBackup: $("#restore-backup"),
  exportData: $("#export-data"),
  importData: $("#import-data"),
  importFile: $("#import-file"),
  rewardForm: $("#reward-form"),
  rewardName: $("#reward-name"),
  rewardCost: $("#reward-cost"),
  rewardList: $("#reward-list"),
  redeemLog: $("#redeem-log")
};

boot();

function boot() {
  enhanceLayout();
  ensureDay(currentDate);
  fillSelect(refs.socialPerson, SOCIAL_PEOPLE);
  fillSelect(refs.socialType, SOCIAL_TYPES);
  fillSelect(refs.socialFeeling, SOCIAL_FEELINGS);
  fillSelect(refs.expenseCategory, DAILY_EXPENSE_CATEGORIES);
  bindEvents();
  switchScreen(activeScreen);
  render();
  hydrateFromIndexedDb();
  refreshPersistenceStatus();
  renderAuthPanel();
  renderCloudSettings();
  initCloudSync().catch(() => {});
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then((registration) => {
      registration.update().catch(() => {});
    }).catch(() => {});
  }
}

function enhanceLayout() {
  enhanceAuthPanel();
  enhanceCloudSettings();
  enhanceExtraTaskComposer();
  enhanceIdeaSections();
  enhanceRitualScreen();
  enhanceRewardCard();
  enhanceSettingsActions();
}

function enhanceExtraTaskComposer() {
  const todayPanel = document.querySelector('[data-screen="today"]');
  const taskCard = todayPanel?.querySelector(".card");
  if (!taskCard || refs.extraTaskForm) return;
  const form = document.createElement("form");
  form.className = "quick-form";
  form.id = "extra-task-form";
  form.innerHTML = `
    <label class="field field-full">
      <span>每日额外任务名称</span>
      <input id="extra-task-name" type="text" maxlength="28" placeholder="例如：背单词 40 分钟">
    </label>
    <label class="field">
      <span>金币</span>
      <input id="extra-task-coins" type="number" min="1" step="1" inputmode="numeric" placeholder="8">
    </label>
    <button class="secondary-btn" type="submit">添加到今天</button>
  `;
  const anchor = taskCard.querySelector("#today-task-list");
  taskCard.insertBefore(form, anchor);
  refs.extraTaskForm = $("#extra-task-form");
  refs.extraTaskName = $("#extra-task-name");
  refs.extraTaskCoins = $("#extra-task-coins");
}

function enhanceAuthPanel() {
  if (refs.authPanel) return;
  const panel = document.createElement("section");
  panel.className = "auth-panel";
  panel.innerHTML = `
    <div class="auth-shell">
      <article class="card auth-card" id="auth-card">
        <p class="eyebrow">Cloud Login</p>
        <h2 class="auth-title">Login to Your Seasonal Journal</h2>
        <p class="muted" id="auth-caption">Sign in and your journal will sync to your private cloud record.</p>
        <form class="quick-form" id="auth-form">
          <label class="field field-full">
            <span>Email</span>
            <input id="auth-email" type="email" placeholder="you@example.com" autocomplete="email">
          </label>
          <button class="primary-btn" id="auth-send-link" type="submit">Send Code</button>
        </form>
        <div class="quick-form auth-code-form">
          <label class="field field-full" id="auth-code-wrap" hidden>
            <span>Email Code</span>
            <input id="auth-code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="8" placeholder="Enter 8-digit code">
          </label>
          <button class="secondary-btn" id="auth-verify-code" type="button" hidden>Verify and Enter</button>
        </div>
        <div class="install-status" id="auth-status"></div>
      </article>
    </div>
  `;
  document.body.append(panel);
  refs.authPanel = panel;
  refs.authCard = $("#auth-card");
  refs.authCaption = $("#auth-caption");
  refs.authForm = $("#auth-form");
  refs.authEmail = $("#auth-email");
  refs.authSendLink = $("#auth-send-link");
  refs.authCodeWrap = $("#auth-code-wrap");
  refs.authCode = $("#auth-code");
  refs.authVerifyCode = $("#auth-verify-code");
  refs.authStatus = $("#auth-status");
}

function enhanceCloudSettings() {
  const settingsBody = refs.settingsDialog?.querySelector(".picker-body");
  if (!settingsBody || refs.cloudPanel) return;
  const panel = document.createElement("section");
  panel.className = "cloud-panel";
  panel.innerHTML = `
    <div class="card-head">
      <div>
        <h3>云端同步</h3>
        <p class="muted">登录后会把你的整份生活记录同步到 Supabase，每个账号一份。</p>
      </div>
    </div>
    <div class="install-status" id="cloud-sync-status"></div>
    <form class="quick-form" id="cloud-config-form">
      <label class="field field-full">
        <span>Supabase Project URL</span>
        <input id="cloud-url" type="url" placeholder="https://xxxx.supabase.co">
      </label>
      <label class="field field-full">
        <span>Supabase Anon Key</span>
        <textarea id="cloud-anon-key" rows="3" placeholder="粘贴 public anon key"></textarea>
      </label>
      <label class="field field-full">
        <span>登录邮箱</span>
        <input id="cloud-email" type="email" placeholder="you@example.com">
      </label>
      <button class="secondary-btn" id="cloud-save-config" type="submit">保存云端配置</button>
      <button class="secondary-btn" id="cloud-send-link" type="button">Send Code</button>
      <button class="secondary-btn" id="cloud-sync-now" type="button">立即同步云端</button>
      <button class="secondary-btn" id="cloud-sign-out" type="button">退出云端账号</button>
    </form>
  `;
  settingsBody.insertBefore(panel, refs.installStatus);
  refs.cloudPanel = panel;
  refs.cloudStatus = $("#cloud-sync-status");
  refs.cloudConfigForm = $("#cloud-config-form");
  refs.cloudUrl = $("#cloud-url");
  refs.cloudAnonKey = $("#cloud-anon-key");
  refs.cloudEmail = $("#cloud-email");
  refs.cloudSaveConfig = $("#cloud-save-config");
  refs.cloudSendLink = $("#cloud-send-link");
  refs.cloudSyncNow = $("#cloud-sync-now");
  refs.cloudSignOut = $("#cloud-sign-out");
}

function enhanceIdeaSections() {
  const ideaGrid = refs.dailyIdeas?.closest(".idea-grid");
  if (!ideaGrid || ideaGrid.dataset.enhanced === "true") return;
  const sections = [
    { key: "daily", title: "日常灵感", node: refs.dailyIdeas, open: true },
    { key: "travel", title: "旅行灵感", node: refs.travelIdeas },
    { key: "book", title: "想看的书", node: refs.bookIdeas },
    { key: "movie", title: "想看的电影", node: refs.movieIdeas }
  ];
  const wrapper = document.createElement("div");
  wrapper.className = "idea-sections";
  sections.forEach((section) => {
    const details = document.createElement("details");
    details.className = "idea-section";
    details.open = Boolean(section.open);
    const summary = document.createElement("summary");
    const title = document.createElement("span");
    title.textContent = section.title;
    const count = document.createElement("strong");
    count.id = `${section.key}-ideas-count`;
    count.textContent = "0";
    summary.append(title, count);
    details.append(summary, section.node);
    wrapper.append(details);
    refs[`${section.key}IdeasCount`] = count;
  });
  ideaGrid.replaceWith(wrapper);
}

function enhanceRitualScreen() {
  const ritualPanel = document.querySelector('[data-screen="ritual"]');
  if (!ritualPanel || $("#wake-form")) return;
  const firstCard = ritualPanel.querySelector(".card");
  if (!firstCard) return;
  if (!firstCard.querySelector(".card-head")) {
    const head = document.createElement("div");
    head.className = "card-head";
    head.innerHTML = `
      <div>
        <h3>睡前仪式</h3>
        <p class="muted">完成时间和睡前日记记录下来，完成可获得 +20 金币。</p>
      </div>
    `;
    firstCard.prepend(head);
  }
  const wakeCard = document.createElement("article");
  wakeCard.className = "card";
  wakeCard.innerHTML = `
    <div class="card-head">
      <div>
        <h3>起床仪式</h3>
        <p class="muted">记录起床时间和昨晚睡得怎么样，完成可获得 +20 金币。</p>
      </div>
    </div>
    <form class="quick-form" id="wake-form">
      <label class="field">
        <span>起床时间</span>
        <input id="wake-time" type="time">
      </label>
      <label class="field field-full">
        <span>起床小记</span>
        <textarea id="wake-journal" rows="5" placeholder="比如：昨晚睡得安稳吗，起床时精神怎么样，今天想怎么开始。"></textarea>
      </label>
      <button class="primary-btn" type="submit">完成起床仪式</button>
    </form>
    <div class="focus-summary" id="wake-summary"></div>
  `;
  ritualPanel.insertBefore(wakeCard, firstCard);
  refs.wakeForm = $("#wake-form");
  refs.wakeTime = $("#wake-time");
  refs.wakeJournal = $("#wake-journal");
  refs.wakeSummary = $("#wake-summary");
  attachRitualFold(firstCard, "睡前仪式", "ritual-fold", "ritual-form", "ritual-summary");
  attachRitualFold(wakeCard, "起床仪式", "wake-fold", "wake-form", "wake-summary");
  const sectionHead = ritualPanel.querySelector(".section-head");
  if (sectionHead) {
    const title = sectionHead.querySelector("h2");
    const kicker = sectionHead.querySelector(".section-kicker");
    const note = sectionHead.querySelector(".section-note");
    if (kicker) kicker.textContent = "Ritual";
    if (title) title.textContent = "起居仪式";
    if (note) note.textContent = "晚上记录结束，早上记录醒来和昨晚睡得怎么样。两张卡片会分别保存。";
  }
  const navBtn = document.querySelector('.nav-btn[data-target="ritual"]');
  if (navBtn) navBtn.textContent = "起居";
}

function attachRitualFold(card, title, foldId, formId, summaryId) {
  if (!card || card.querySelector(`#${foldId}`)) return;
  const form = card.querySelector(`#${formId}`);
  const summary = card.querySelector(`#${summaryId}`);
  if (!form || !summary) return;
  const fold = document.createElement("details");
  fold.className = "ritual-fold";
  fold.id = foldId;
  const foldSummary = document.createElement("summary");
  foldSummary.className = "ritual-fold-summary";
  foldSummary.innerHTML = `
    <span>${title}</span>
    <strong id="${foldId}-state">未完成 ○</strong>
  `;
  fold.append(foldSummary);
  fold.append(form);
  fold.append(summary);
  card.append(fold);
  if (formId === "ritual-form") {
    refs.ritualFold = fold;
    refs.ritualFoldState = $(`#${foldId}-state`);
  } else {
    refs.wakeFold = fold;
    refs.wakeFoldState = $(`#${foldId}-state`);
  }
}

function enhanceRewardCard() {
  const rewardHead = refs.rewardForm?.closest(".card")?.querySelector(".card-head");
  if (!rewardHead || refs.rewardCoinTotal) return;
  const total = document.createElement("div");
  total.className = "coin-total";
  total.id = "reward-coin-total";
  total.innerHTML = coinMarkup(0);
  rewardHead.append(total);
  refs.rewardCoinTotal = total;
}

function enhanceSettingsActions() {
  const actions = refs.installStatus?.nextElementSibling;
  if (!actions || refs.saveNow) return;
  const saveNow = createSettingsButton("save-now", "立即保存", "primary-btn");
  const exportToday = createSettingsButton("export-today", "导出今日记录", "secondary-btn");
  const shareBackup = createSettingsButton("share-backup", "分享备份", "secondary-btn");
  actions.insertBefore(saveNow, refs.requestPersistence);
  actions.insertBefore(exportToday, refs.importData);
  actions.insertBefore(shareBackup, refs.importData);
  refs.saveNow = saveNow;
  refs.exportToday = exportToday;
  refs.shareBackup = shareBackup;
}

function createSettingsButton(id, text, className) {
  const button = document.createElement("button");
  button.type = "button";
  button.id = id;
  button.className = className;
  button.textContent = text;
  return button;
}

function bindEvents() {
  refs.navBtns.forEach((btn) => btn.addEventListener("click", () => switchScreen(btn.dataset.target)));
  refs.prevDay.addEventListener("click", () => shiftDate(-1));
  refs.nextDay.addEventListener("click", () => shiftDate(1));
  refs.currentDate.addEventListener("change", (event) => {
    currentDate = event.target.value || todayISO();
    ensureDay(currentDate);
    render();
  });
  refs.openSettings.addEventListener("click", () => {
    if (typeof refs.settingsDialog.showModal === "function") refs.settingsDialog.showModal();
    else refs.settingsDialog.setAttribute("open", "open");
  });

  refs.openTaskPicker.addEventListener("click", () => {
    if (typeof refs.taskDialog.showModal === "function") refs.taskDialog.showModal();
    else refs.taskDialog.setAttribute("open", "open");
  });
  refs.taskTemplateList.addEventListener("change", onToggleTemplate);
  refs.todayTaskList.addEventListener("change", onToggleTask);
  refs.extraTaskForm?.addEventListener("submit", onSubmitExtraTask);

  refs.socialForm.addEventListener("submit", onSubmitSocial);
  refs.socialLog.addEventListener("click", onRemoveEntry);
  refs.socialViewBtns.forEach((btn) => btn.addEventListener("click", () => {
    activeSocialView = btn.dataset.socialView;
    renderSocial();
  }));
  refs.socialRangeBtns.forEach((btn) => btn.addEventListener("click", () => {
    activeSocialRange = btn.dataset.socialRange;
    renderSocial();
  }));
  refs.ideaForm.addEventListener("submit", onSubmitIdea);
  refs.dailyIdeas.addEventListener("change", onToggleIdea);
  refs.travelIdeas.addEventListener("change", onToggleIdea);
  refs.bookIdeas.addEventListener("change", onToggleIdea);
  refs.movieIdeas.addEventListener("change", onToggleIdea);
  refs.dailyIdeas.addEventListener("click", onRemoveEntry);
  refs.travelIdeas.addEventListener("click", onRemoveEntry);
  refs.bookIdeas.addEventListener("click", onRemoveEntry);
  refs.movieIdeas.addEventListener("click", onRemoveEntry);
  refs.ritualForm.addEventListener("submit", onSubmitRitual);
  refs.wakeForm?.addEventListener("submit", onSubmitWake);

  refs.expenseBook.addEventListener("change", renderExpenseTripSelect);
  refs.expenseForm.addEventListener("submit", onSubmitExpense);
  refs.expensePanel.addEventListener("click", onExpensePanelClick);
  refs.expensePanel.addEventListener("click", onRemoveEntry);
  refs.bookTabs.forEach((btn) => btn.addEventListener("click", () => {
    activeBookTab = btn.dataset.bookTab;
    renderExpenses();
  }));

  refs.tripForm.addEventListener("submit", onSubmitTrip);
  refs.tripList.addEventListener("click", onTripClick);
  refs.tripList.addEventListener("change", onTripToggleTask);
  refs.tripList.addEventListener("submit", onTripSubmit);

  refs.installApp.addEventListener("click", onInstallApp);
  refs.saveNow?.addEventListener("click", onSaveNow);
  refs.requestPersistence.addEventListener("click", onRequestPersistence);
  refs.restoreBackup.addEventListener("click", onRestoreBackup);
  refs.exportData.addEventListener("click", onExportData);
  refs.exportToday?.addEventListener("click", onExportToday);
  refs.shareBackup?.addEventListener("click", onShareBackup);
  refs.importData.addEventListener("click", () => refs.importFile.click());
  refs.importFile.addEventListener("change", onImportData);
  refs.authForm?.addEventListener("submit", onAuthSendLinkFromPanel);
  refs.authVerifyCode?.addEventListener("click", onVerifyAuthCode);
  refs.cloudConfigForm?.addEventListener("submit", onSaveCloudConfig);
  refs.cloudSendLink?.addEventListener("click", onSendCloudMagicLink);
  refs.cloudSyncNow?.addEventListener("click", onCloudSyncNow);
  refs.cloudSignOut?.addEventListener("click", onCloudSignOut);
  window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  window.addEventListener("appinstalled", onAppInstalled);

  refs.rewardForm.addEventListener("submit", onSubmitReward);
  refs.rewardList.addEventListener("click", onRewardClick);
  refs.todayTaskList.addEventListener("input", onTaskDetailInput);
}

function render() {
  ensureDay(currentDate);
  refs.currentDate.value = currentDate;
  applySeasonTheme();
  renderStats();
  renderTaskTemplates();
  renderTodayTasks();
  renderSocial();
  renderIdeas();
  renderRitual();
  renderExpenseTripSelect();
  renderExpenses();
  renderTrips();
  renderInstallStatus();
  renderRewardPanel();
  renderRewards();
  updateNav();
}

function renderStats() {
  const totals = computeTotals();
  const today = computeTodayScore(currentDate);
  const roomLevel = getLevel(totals.roomPoints);
  const streak = computeRitualStreak();
  const cards = [
    { value: coinMarkup(totals.availableCoins), label: "当前金币" },
    { value: coinMarkup(today.coins, true), label: "今日收获" },
    { value: `Lv.${roomLevel.level}`, label: `生活等级 · 进度 ${roomLevel.progress}%` },
    { value: `${streak} 天`, label: "睡前仪式连击" }
  ];
  refs.topStats.innerHTML = cards.map((card) => `
    <article class="stat-card">
      <strong>${card.value}</strong>
      <span>${card.label}</span>
    </article>
  `).join("");
}

function renderTaskTemplates() {
  const day = ensureDay(currentDate);
  refs.taskTemplateList.innerHTML = state.taskTemplates.map((task) => `
    <label class="template-item">
      <input
        type="checkbox"
        data-template-id="${task.id}"
        ${day.enabledTaskIds.includes(task.id) ? "checked" : ""}
        ${FIXED_DAILY_TASK_IDS.includes(task.id) ? "disabled" : ""}
      >
      <span>${escapeHtml(task.name)}<br><small>${FIXED_DAILY_TASK_IDS.includes(task.id) ? "固定每日任务 · " : ""}+${task.coins} 金币</small></span>
    </label>
  `).join("");
}

function renderTodayTasks() {
  const day = ensureDay(currentDate);
  const enabledTasks = getEnabledTasksForDay(day);
  refs.todayTaskList.innerHTML = enabledTasks.map((task) => day.completedTaskIds.includes(task.id)
    ? renderCompletedTask(task, day)
    : renderPendingTask(task, day)
  ).join("");
  const bonus = getFullBonus(day);
  if (!enabledTasks.length) {
    refs.fullBonus.textContent = "先启用几项今天想做的任务吧。";
  } else if (bonus.earned) {
    refs.fullBonus.textContent = `今天启用了 ${day.enabledTaskIds.length} 项任务，并且已经全部完成，额外奖励 +${bonus.coins} 金币。`;
  } else if (day.enabledTaskIds.length < 3) {
    refs.fullBonus.textContent = "启用至少 3 项任务后，才会出现今日全完成奖励。";
  } else {
    refs.fullBonus.textContent = `已完成 ${day.completedTaskIds.length}/${day.enabledTaskIds.length} 项。全部完成可额外获得 +${bonus.coins} 金币。`;
  }
}

function getEnabledTasksForDay(day) {
  const taskMap = new Map();
  state.taskTemplates.forEach((task) => taskMap.set(task.id, task));
  (day.extraTasks || []).forEach((task) => taskMap.set(task.id, task));
  return (day.enabledTaskIds || [])
    .map((id) => taskMap.get(id))
    .filter(Boolean);
}

function renderPendingTask(task, day) {
  return `
    <article class="task-item">
      <div class="task-topline">
        <label class="task-main">
          <strong>${escapeHtml(task.name)}</strong>
          <span class="muted">${escapeHtml(task.note)}</span>
          <div class="task-tags"><span class="tag">${coinMarkup(task.coins, true)}</span></div>
        </label>
        <div class="task-meta">
          <input class="task-check" type="checkbox" data-task-id="${task.id}">
        </div>
      </div>
      ${renderTaskDetailField(task, day)}
    </article>
  `;
}

function renderCompletedTask(task, day) {
  const detailText = day.taskDetails?.[task.id] ? `
    <div class="summary-card">
      <strong>记录内容</strong>
      <span>${escapeHtml(day.taskDetails[task.id])}</span>
    </div>
  ` : `
    <div class="summary-card">
      <strong>无额外内容</strong>
      <span>这项任务没有填写补充细节。</span>
    </div>
  `;
  return `
    <details class="task-item task-fold">
      <summary class="task-fold-summary">
        <strong>${escapeHtml(task.name)}</strong>
        <span class="task-done-icon" aria-hidden="true">✓</span>
      </summary>
      <div class="task-fold-body">
        <div class="summary-card">
          <strong>${escapeHtml(task.note)}</strong>
          <span>奖励 ${coinMarkup(task.coins, true)}</span>
        </div>
        ${detailText}
        <label class="task-reset-row">
          <input class="task-check" type="checkbox" data-task-id="${task.id}" checked>
          <span>取消完成</span>
        </label>
      </div>
    </details>
  `;
}

function renderTaskDetailField(task, day) {
  if (day.completedTaskIds.includes(task.id)) {
    return "";
  }
  const config = TASK_DETAIL_CONFIG[task.id];
  if (!config) {
    return "";
  }
  const value = day.taskDetails?.[task.id] || "";
  if (config.type === "input") {
    return `
      <label class="task-detail">
        <span>${config.label}</span>
        <input type="text" maxlength="60" data-task-detail="${task.id}" placeholder="${config.placeholder}" value="${escapeHtml(value)}">
      </label>
    `;
  }
  return `
    <label class="task-detail">
      <span>${config.label}</span>
      <textarea rows="3" maxlength="120" data-task-detail="${task.id}" placeholder="${config.placeholder}">${escapeHtml(value)}</textarea>
    </label>
  `;
}

function renderSocial() {
  const day = ensureDay(currentDate);
  const socials = collectSocialEntries();
  refs.socialViewBtns.forEach((btn) => btn.classList.toggle("active", btn.dataset.socialView === activeSocialView));
  refs.socialRangeBtns.forEach((btn) => btn.classList.toggle("active", btn.dataset.socialRange === activeSocialRange));
  refs.socialLog.style.display = activeSocialView === "list" ? "grid" : "none";
  refs.socialStats.style.display = activeSocialView === "stats" ? "grid" : "none";
  refs.socialRangeTabs.style.display = activeSocialView === "stats" ? "grid" : "none";
  refs.socialLog.innerHTML = day.socials.slice().reverse().map((item) => `
    <article class="pill-item">
      <div class="pill-row">
        <span class="pill">${escapeHtml(item.person)}</span>
        <span class="pill">${escapeHtml(item.type)}</span>
        <span class="pill">${escapeHtml(item.feeling)}</span>
        <button class="tiny-btn danger-btn" type="button" data-remove-social="${item.id}">删除</button>
      </div>
      ${item.note ? `<div class="muted">${escapeHtml(item.note)}</div>` : ""}
    </article>
  `).join("");
  refs.socialStats.innerHTML = renderSocialStats(filterEntriesByRange(socials, activeSocialRange, currentDate));
}

function renderIdeas() {
  const buckets = {
    daily: state.ideas.filter((item) => item.bucket === "daily"),
    travel: state.ideas.filter((item) => item.bucket === "travel"),
    book: state.ideas.filter((item) => item.bucket === "book"),
    movie: state.ideas.filter((item) => item.bucket === "movie")
  };
  renderIdeaBucket(refs.dailyIdeas, buckets.daily, refs.dailyIdeasCount);
  renderIdeaBucket(refs.travelIdeas, buckets.travel, refs.travelIdeasCount);
  renderIdeaBucket(refs.bookIdeas, buckets.book, refs.bookIdeasCount);
  renderIdeaBucket(refs.movieIdeas, buckets.movie, refs.movieIdeasCount);
}

function renderIdeaBucket(container, items, counterRef) {
  const pending = items.filter((item) => !item.doneDates?.length);
  const done = items.filter((item) => item.doneDates?.length);
  if (counterRef) counterRef.textContent = `${done.length}/${items.length}`;
  if (!container) return;
  if (!items.length) {
    container.innerHTML = '<div class="idea-empty muted">还没有内容，先加一条。</div>';
    return;
  }
  container.innerHTML = `
    <div class="idea-visible-list">
      ${pending.map((item) => renderIdeaItem(item, false)).join("")}
    </div>
    ${done.length ? `
      <details class="idea-done-fold">
        <summary>已完成 ${done.length} 项</summary>
        <div class="idea-list">
          ${done.map((item) => renderIdeaItem(item, true)).join("")}
        </div>
      </details>
    ` : ""}
  `;
}

function renderIdeaItem(item, done) {
  return `
    <article class="idea-item">
      <label class="${done ? "idea-item-done" : ""}">
        <input class="idea-check" type="checkbox" data-idea-id="${item.id}" ${done ? "checked" : ""}>
        <span>${escapeHtml(item.title)}</span>
      </label>
      <button class="tiny-btn danger-btn" type="button" data-remove-idea="${item.id}">删掉</button>
    </article>
  `;
}

function renderRitual() {
  const day = ensureDay(currentDate);
  refs.ritualTime.value = day.ritual.time || "";
  refs.ritualJournal.value = day.ritual.journal || "";
  refs.ritualSummary.innerHTML = `
    <div class="summary-card">
      <strong>${day.ritual.completed ? "已完成" : "还没完成"}</strong>
      <span>睡前仪式奖励 ${coinMarkup(20, true)}</span>
    </div>
    <div class="summary-card">
      <strong>${day.ritual.time || "--:--"}</strong>
      <span>今晚的结束时间</span>
    </div>
    <div class="summary-card">
      <strong>${day.ritual.journal ? `${day.ritual.journal.length} 字` : "还没写"}</strong>
      <span>今天的睡前日记</span>
    </div>
  `;
  if (!refs.wakeSummary) return;
  refs.wakeTime.value = day.wake?.time || "";
  refs.wakeJournal.value = day.wake?.journal || "";
  refs.wakeSummary.innerHTML = `
    <div class="summary-card">
      <strong>${day.wake?.completed ? "已完成" : "还没完成"}</strong>
      <span>起床仪式奖励 ${coinMarkup(20, true)}</span>
    </div>
    <div class="summary-card">
      <strong>${day.wake?.time || "--:--"}</strong>
      <span>今天的起床时间</span>
    </div>
    <div class="summary-card">
      <strong>${day.wake?.journal ? `${day.wake.journal.length} 字` : "还没写"}</strong>
      <span>今天的起床小记</span>
    </div>
  `;
  if (refs.ritualFoldState) {
    refs.ritualFoldState.textContent = day.ritual.completed ? "已完成 ✓" : "未完成 ○";
  }
  if (refs.ritualFold) {
    refs.ritualFold.open = !day.ritual.completed;
  }
  if (refs.wakeFoldState) {
    refs.wakeFoldState.textContent = day.wake?.completed ? "已完成 ✓" : "未完成 ○";
  }
  if (refs.wakeFold) {
    refs.wakeFold.open = !day.wake?.completed;
  }
}

function renderSocialStats(items) {
  if (!items.length) {
    return '<div class="summary-card"><strong>还没有社交记录</strong><span>切到本周 / 本月 / 今年后，这里会显示次数和标签统计。</span></div>';
  }
  const byFeeling = countBy(items, "feeling");
  const byType = countBy(items, "type");
  return `
    <div class="focus-summary">
      <div class="summary-card"><strong>${items.length} 次</strong><span>${rangeLabel(activeSocialRange)}社交记录</span></div>
      <div class="summary-card"><strong>${topCountLabel(byFeeling)}</strong><span>最常见感受</span></div>
      <div class="summary-card"><strong>${topCountLabel(byType)}</strong><span>最常见形式</span></div>
    </div>
    <div class="entry-list">
      ${Object.entries(byFeeling).sort((a, b) => b[1] - a[1]).map(([name, count]) => `
        <article class="entry-item">
          <div class="entry-main">
            <strong>${escapeHtml(name)}</strong>
            <span class="muted">感受标签</span>
          </div>
          <div class="cost">${count} 次</div>
        </article>
      `).join("")}
    </div>
  `;
}

function renderExpenseTripSelect() {
  renderExpenseCategorySelect();
  refs.expenseTripField.style.display = refs.expenseBook.value === "travel" ? "grid" : "none";
  if (!state.trips.length) {
    refs.expenseTrip.innerHTML = '<option value="">先创建旅行</option>';
    return;
  }
  refs.expenseTrip.innerHTML = state.trips.map((trip) => `
    <option value="${trip.id}">${escapeHtml(trip.name)}</option>
  `).join("");
}

function renderExpenseCategorySelect() {
  const categories = getExpenseCategories(refs.expenseBook.value);
  const current = refs.expenseCategory.value;
  fillSelect(refs.expenseCategory, categories);
  if (categories.includes(current)) {
    refs.expenseCategory.value = current;
  }
}

function getExpenseCategories(book) {
  return book === "travel" ? TRAVEL_EXPENSE_CATEGORIES : DAILY_EXPENSE_CATEGORIES;
}

function renderExpenses() {
  refs.bookTabs.forEach((btn) => btn.classList.toggle("active", btn.dataset.bookTab === activeBookTab));
  if (activeBookTab === "stats") {
    renderExpenseStats();
    return;
  }
  const list = state.expenses
    .filter((item) => item.book === activeBookTab)
    .sort((a, b) => b.createdAt - a.createdAt);

  refs.expensePanel.innerHTML = list.map((item) => `
    <article class="entry-item">
      <div class="entry-main">
        <strong>${formatCurrency(item.amount)} · ${escapeHtml(item.category)}</strong>
        <span class="muted">${item.date}${item.tripId ? ` · ${escapeHtml(findTrip(item.tripId)?.name || "旅行")}` : ""}${item.note ? ` · ${escapeHtml(item.note)}` : ""}</span>
      </div>
      <div class="reward-row">
        <button class="tiny-btn" type="button" data-edit-expense="${item.id}">编辑</button>
        <button class="tiny-btn danger-btn" type="button" data-remove-expense="${item.id}">删除</button>
      </div>
    </article>
  `).join("");
}

function renderExpenseStats() {
  const daily = state.expenses.filter((item) => item.book === "daily");
  const weekList = filterEntriesByRange(daily, "week", currentDate);
  const monthList = filterEntriesByRange(daily, "month", currentDate);
  const yearList = filterEntriesByRange(daily, "year", currentDate);
  const tripTotals = state.trips.map((trip) => {
    const expenses = state.expenses.filter((item) => item.book === "travel" && item.tripId === trip.id);
    return {
      id: trip.id,
      name: trip.name,
      total: sumAmount(expenses),
      count: expenses.length
    };
  });

  refs.expensePanel.innerHTML = `
    <div class="summary-card">
      <strong>日常账单</strong>
      <span>仅统计日常账本（本周 / 本月 / 今年）</span>
    </div>
    <div class="focus-summary">
      <div class="summary-card"><strong>${formatCurrency(sumAmount(weekList))}</strong><span>本周</span></div>
      <div class="summary-card"><strong>${formatCurrency(sumAmount(monthList))}</strong><span>本月</span></div>
      <div class="summary-card"><strong>${formatCurrency(sumAmount(yearList))}</strong><span>今年</span></div>
    </div>
    <details class="idea-done-fold">
      <summary>查看日常账单明细</summary>
      <div class="entry-list">
        ${renderExpenseDetailGroup("本周", weekList)}
        ${renderExpenseDetailGroup("本月", monthList)}
        ${renderExpenseDetailGroup("今年", yearList)}
      </div>
    </details>
    <div class="summary-card">
      <strong>旅行账单总计</strong>
      <span>按旅行项目分开汇总，不和日常混在一起</span>
    </div>
    <div class="entry-list">
      ${tripTotals.length
        ? tripTotals.map((item) => `
          <details class="idea-done-fold">
            <summary>${escapeHtml(item.name)} · ${item.count} 笔 · ${formatCurrency(item.total)}</summary>
            <div class="entry-list">
              ${renderExpenseDetailList(state.expenses.filter((expense) => expense.book === "travel" && expense.tripId === item.id))}
            </div>
          </details>
        `).join("")
        : '<div class="summary-card"><strong>还没有旅行账单</strong><span>添加旅行账本记录后，这里会出现每个旅行项目总计。</span></div>'
      }
    </div>
  `;
}

function renderExpenseDetailGroup(title, items) {
  if (!items.length) {
    return `
      <article class="summary-card">
        <strong>${title}</strong>
        <span>没有记录</span>
      </article>
    `;
  }
  return `
    <article class="summary-card">
      <strong>${title}</strong>
      <span>${items.length} 笔 · ${formatCurrency(sumAmount(items))}</span>
    </article>
    ${renderExpenseDetailList(items)}
  `;
}

function renderExpenseDetailList(items) {
  if (!items.length) {
    return '<div class="summary-card"><strong>暂无明细</strong><span>这里会显示账单细节。</span></div>';
  }
  return items
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((item) => `
      <article class="entry-item">
        <div class="entry-main">
          <strong>${formatCurrency(item.amount)} · ${escapeHtml(item.category)}</strong>
          <span class="muted">${item.date}${item.note ? ` · ${escapeHtml(item.note)}` : ""}</span>
        </div>
      </article>
    `).join("");
}

function renderTrips() {
  refs.tripList.innerHTML = state.trips.slice().reverse().map((trip) => {
    const expenses = state.expenses.filter((item) => item.tripId === trip.id);
    const completedCount = trip.tasks.filter((item) => item.done).length;
    return `
      <article class="trip-item">
        <details class="trip-details">
          <summary class="trip-summary">
            <div class="trip-main">
              <strong>${escapeHtml(trip.name)}</strong>
              <div class="trip-meta">
                ${trip.company ? `<span class="tag">和 ${escapeHtml(trip.company)} 一起</span>` : ""}
                <span class="tag">${trip.start || "未填开始"}</span>
                <span class="tag">${trip.end || "未填结束"}</span>
                <span class="tag">${completedCount}/${trip.tasks.length} 项任务</span>
                <span class="tag">${formatCurrency(sumAmount(expenses))}</span>
              </div>
            </div>
            <span class="trip-toggle">展开</span>
          </summary>
          <div class="trip-card-inner">
            <section class="trip-section">
              <h4>旅行任务</h4>
              <div class="idea-list">
                ${trip.tasks.map((task) => `
                  <label class="idea-item">
                    <span>
                      <input class="idea-check" type="checkbox" data-trip-id="${trip.id}" data-trip-task-id="${task.id}" ${task.done ? "checked" : ""}>
                      ${escapeHtml(task.title)}
                    </span>
                    <button class="tiny-btn danger-btn" type="button" data-remove-trip-task="${trip.id}|${task.id}">删除</button>
                  </label>
                `).join("")}
              </div>
              <form class="quick-form" data-trip-task-form="${trip.id}">
                <label class="field field-full">
                  <span>新增任务</span>
                  <input name="tripTaskTitle" type="text" maxlength="30" placeholder="比如：收拾行李 / 去看夜景">
                </label>
                <button class="secondary-btn" type="submit">加入任务</button>
              </form>
              <button class="tiny-btn" type="button" data-import-ideas="${trip.id}">导入旅行灵感</button>
            </section>
            <section class="trip-section">
              <h4>旅行账单</h4>
              <div class="entry-list">
                ${expenses.slice(-3).reverse().map((item) => `
                  <article class="entry-item">
                    <div class="entry-main">
                      <strong>${formatCurrency(item.amount)} · ${escapeHtml(item.category)}</strong>
                      <span class="muted">${item.note ? escapeHtml(item.note) : item.date}</span>
                    </div>
                  </article>
                `).join("")}
              </div>
            </section>
            <button class="tiny-btn danger-btn" type="button" data-remove-trip="${trip.id}">删除旅行</button>
          </div>
        </details>
      </article>
    `;
  }).join("");
}

function renderRewardPanel() {
  const totals = computeTotals();
  const level = getLevel(totals.roomPoints);
  refs.xpBreakdown.innerHTML = `
    <div class="focus-summary">
      <div class="summary-card"><strong>Lv.${level.level}</strong><span>当前等级</span></div>
      <div class="summary-card"><strong>${totals.roomPoints} XP</strong><span>累计经验值</span></div>
      <div class="summary-card"><strong>${level.remaining} XP</strong><span>距离下一级</span></div>
    </div>
    <div class="summary-card">
      <strong>升级规则</strong>
      <span>升级会越来越难。当前等级需要 ${level.currentLevelRequirement} XP，你已经积累了 ${level.currentXp} XP。</span>
    </div>
    <div class="entry-list">
      ${[
        ["生活任务", totals.lifePoints, "完成任务、任务组合奖励和灵感完成会加到这里。"],
        ["起居仪式", totals.ritualPoints, "睡前和起床仪式都会累计到这里。"],
        ["记账", totals.moneyPoints, "每记一笔会增加经验值。"],
        ["社交", totals.socialPoints, "每条社交记录都会积累一点成长值。"],
        ["旅行", totals.travelPoints, "旅行任务和旅行账单都会累计经验值。"]
      ].map(([name, value, note]) => `
        <article class="entry-item">
          <div class="entry-main">
            <strong>${name}</strong>
            <span class="muted">${note}</span>
          </div>
          <div class="cost">${value} XP</div>
        </article>
      `).join("")}
    </div>
  `;
}

function applySeasonTheme() {
  const seasonKey = getSeasonKey(currentDate);
  const season = SEASONS[seasonKey];
  document.body.dataset.season = seasonKey;
  refs.seasonLabel.textContent = season.label;
  refs.seasonCaption.textContent = season.caption;
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.content = getComputedStyle(document.body).getPropertyValue("--accent").trim() || themeMeta.content;
  }
}

function onExpensePanelClick(event) {
  const editButton = event.target.closest("[data-edit-expense]");
  if (editButton) {
    onEditExpense(editButton.dataset.editExpense);
    return;
  }
  const button = event.target.closest("[data-expense-range]");
  if (!button) return;
  activeExpenseStatsRange = button.dataset.expenseRange;
  renderExpenses();
}

function onEditExpense(expenseId) {
  const expense = state.expenses.find((item) => item.id === expenseId);
  if (!expense) return;
  const amountInput = window.prompt("修改金额", String(expense.amount));
  if (amountInput === null) return;
  const nextAmount = Number(amountInput);
  if (!nextAmount || nextAmount <= 0) return;

  const categories = getExpenseCategories(expense.book);
  const categoryHint = categories.map((item, index) => `${index + 1}. ${item}`).join("\n");
  const categoryInput = window.prompt(`修改分类（输入编号或完整名称）\n${categoryHint}`, expense.category || "");
  if (categoryInput === null) return;
  const noteInput = window.prompt("修改备注（可留空）", expense.note || "");
  if (noteInput === null) return;

  const trimmedCategory = categoryInput.trim();
  const categoryIndex = Number(trimmedCategory);
  let nextCategory = expense.category;
  if (Number.isInteger(categoryIndex) && categoryIndex >= 1 && categoryIndex <= categories.length) {
    nextCategory = categories[categoryIndex - 1];
  } else if (categories.includes(trimmedCategory)) {
    nextCategory = trimmedCategory;
  }

  expense.amount = nextAmount;
  expense.category = nextCategory;
  expense.note = noteInput.trim();
  saveState();
  renderExpenses();
}

function collectSocialEntries() {
  return Object.entries(state.days).flatMap(([date, day]) =>
    (day.socials || []).map((item) => ({ ...item, date: item.date || date }))
  );
}

function filterEntriesByRange(items, range, anchorDate) {
  const anchor = parseDate(anchorDate);
  return items.filter((item) => isDateInRange(item.date, range, anchor));
}

function isDateInRange(dateString, range, anchorDate) {
  const target = parseDate(dateString);
  if (range === "year") {
    return target.getFullYear() === anchorDate.getFullYear();
  }
  if (range === "month") {
    return target.getFullYear() === anchorDate.getFullYear() && target.getMonth() === anchorDate.getMonth();
  }
  const start = new Date(anchorDate);
  const day = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return target >= start && target < end;
}

function rangeLabel(range) {
  return range === "week" ? "本周" : range === "month" ? "本月" : "今年";
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || "未分类";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function topCountLabel(map) {
  const [name, count] = Object.entries(map).sort((a, b) => b[1] - a[1])[0] || ["暂无", 0];
  return `${name} · ${count}`;
}

function renderInstallStatus() {
  const isInstalled = window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone;
  const installLabel = isInstalled ? "已作为网页应用打开" : deferredInstallPrompt ? "可以直接安装到桌面" : "暂时没有系统安装弹窗";
  const persistLabel = persistenceStatus === "granted"
    ? "浏览器已答应尽量持久保存站点数据"
    : persistenceStatus === "denied"
      ? "浏览器暂未授予持久保存"
      : persistenceStatus === "unsupported"
        ? "当前环境不支持持久化状态检测"
        : "正在检查本地持久化状态";
  const storageLabel = storageMode === "indexeddb"
    ? "当前主存储为 IndexedDB，并同步镜像到本地存储"
    : storageMode === "local"
      ? "当前使用本地存储，并同步尝试写入 IndexedDB"
      : storageMode === "recovered"
        ? "已从最近可用备份恢复，并重新写回本地存储"
      : "正在初始化本地数据层";
  const backupInfo = getLatestBackupInfo();
  const savedAt = state.meta?.lastSavedAt;

  refs.installStatus.innerHTML = `
    <div class="status-note">
      <strong>安装状态</strong>
      <span>${installLabel}</span>
    </div>
    <div class="status-note">
      <strong>数据保存状态</strong>
      <span>${persistLabel}</span>
    </div>
    <div class="status-note">
      <strong>当前存储方式</strong>
      <span>${storageLabel}</span>
    </div>
    <div class="status-note">
      <strong>最近本地备份</strong>
      <span>${backupInfo.label}</span>
    </div>
    <div class="status-note">
      <strong>最近保存时间</strong>
      <span>${savedAt ? formatDateTime(savedAt) : "还没有保存记录"}</span>
    </div>
    ${recoveryNotice ? `
      <div class="status-note">
        <strong>恢复提示</strong>
        <span>${recoveryNotice}</span>
      </div>
    ` : ""}
  `;

  refs.installApp.textContent = isInstalled ? "已安装" : deferredInstallPrompt ? "安装到桌面" : "查看安装方式";
  refs.installApp.disabled = isInstalled;
  refs.restoreBackup.disabled = !backupInfo.available;
}

function renderCloudSettings() {
  if (!refs.cloudStatus) return;
  refs.cloudUrl.value = cloudConfig.url || "";
  refs.cloudAnonKey.value = cloudConfig.anonKey || "";
  refs.cloudEmail.value = cloudConfig.email || "";
  refs.cloudStatus.innerHTML = `
    <div class="status-note">
      <strong>同步状态</strong>
      <span>${cloudSyncStatus}</span>
    </div>
    <div class="status-note">
      <strong>当前账号</strong>
      <span>${authSession?.user?.email || "还没有登录云端账号"}</span>
    </div>
    <div class="status-note">
      <strong>同步说明</strong>
      <span>${cloudSyncMessage || "先保存配置，再发送邮箱登录链接。登录成功后会把本地和云端记录合并。"}</span>
    </div>
  `;
  const configured = Boolean(cloudConfig.url && cloudConfig.anonKey);
  if (refs.cloudConfigForm) refs.cloudConfigForm.style.display = appCloudConfigured ? "none" : "grid";
  if (refs.cloudSendLink) refs.cloudSendLink.disabled = !configured;
  if (refs.cloudSyncNow) refs.cloudSyncNow.disabled = !configured || !authSession?.user;
  if (refs.cloudSignOut) refs.cloudSignOut.disabled = !authSession?.user;
  if (refs.cloudPanel) refs.cloudPanel.classList.toggle("cloud-panel-configured", appCloudConfigured);
}

function renderAuthPanel() {
  if (!refs.authPanel || !refs.authStatus) return;
  refs.authEmail.value = cloudConfig.email || "";
  const configured = Boolean(cloudConfig.url && cloudConfig.anonKey);
  const gated = appCloudConfigured && !authSession?.user;
  refs.authPanel.hidden = !gated;
  document.body.classList.toggle("auth-locked", gated);
  refs.authCaption.textContent = appCloudConfigured
    ? "Enter the email code to open your synced journal."
    : "One more step: add the Supabase app config to the site so normal users do not need to enter technical settings.";
  if (refs.authCodeWrap) refs.authCodeWrap.hidden = !authOtpPending;
  if (refs.authVerifyCode) refs.authVerifyCode.hidden = !authOtpPending;

  refs.authStatus.innerHTML = `
    <div class="status-note">
      <strong>登录状态</strong>
      <span>${authSession?.user?.email || "还没有登录"}</span>
    </div>
    <div class="status-note">
      <strong>同步状态</strong>
      <span>${cloudSyncStatus}</span>
    </div>
    <div class="status-note">
      <strong>说明</strong>
      <span>${cloudSyncMessage || "登录后会自动拉取云端数据并在保存时自动同步。"}</span>
    </div>
  `;

  if (refs.authSendLink) refs.authSendLink.disabled = !configured;
  if (refs.authVerifyCode) refs.authVerifyCode.disabled = !configured || !authOtpPending;
}

function renderRewards() {
  const totals = computeTotals();
  const visibleRewards = state.rewards.filter((reward) => !reward.hidden && !isLegacySystemReward(reward));
  if (refs.rewardCoinTotal) {
    refs.rewardCoinTotal.innerHTML = `
      <span class="coin-total-label">现有金币</span>
      <strong>${coinMarkup(totals.availableCoins)}</strong>
    `;
  }
  refs.rewardList.innerHTML = visibleRewards.map((reward) => `
    <article class="reward-item">
      <div class="reward-main">
        <strong>${escapeHtml(reward.name)}</strong>
        <span class="muted">${coinMarkup(reward.cost)}</span>
      </div>
      <div class="reward-row">
        <button class="tiny-btn" type="button" data-redeem="${reward.id}" ${totals.availableCoins < reward.cost ? "disabled" : ""}>兑换</button>
        <button class="tiny-btn danger-btn" type="button" data-remove-reward="${reward.id}">删除</button>
      </div>
    </article>
  `).join("");

  refs.redeemLog.innerHTML = state.redemptions.slice().reverse().map((item) => `
    <article class="entry-item">
      <div class="entry-main">
        <strong>${escapeHtml(item.name)}</strong>
        <span class="muted">${item.date}</span>
      </div>
      <div class="cost">-${item.cost}</div>
    </article>
  `).join("");
}

function onToggleTemplate(event) {
  const input = event.target.closest("[data-template-id]");
  if (!input) return;
  const day = ensureDay(currentDate);
  const taskId = input.dataset.templateId;
  if (FIXED_DAILY_TASK_IDS.includes(taskId)) {
    input.checked = true;
    refs.fullBonus.textContent = "Breakfast, lunch, dinner, and outfit stay selected every day.";
    return;
  }
  if (input.checked) {
    if (!day.enabledTaskIds.includes(taskId)) day.enabledTaskIds.push(taskId);
  } else {
    day.enabledTaskIds = day.enabledTaskIds.filter((id) => id !== taskId);
    day.completedTaskIds = day.completedTaskIds.filter((id) => id !== taskId);
  }
  saveState();
  render();
}

function onSubmitExtraTask(event) {
  event.preventDefault();
  const day = ensureDay(currentDate);
  const name = refs.extraTaskName?.value.trim();
  const coins = Number(refs.extraTaskCoins?.value);
  if (!name || !coins || coins < 1) return;
  const taskId = `extra-${uid()}`;
  day.extraTasks.push({
    id: taskId,
    name,
    coins,
    note: "每日额外任务"
  });
  if (!day.enabledTaskIds.includes(taskId)) {
    day.enabledTaskIds.push(taskId);
  }
  refs.extraTaskForm?.reset();
  saveState();
  render();
}

function onToggleTask(event) {
  const input = event.target.closest("[data-task-id]");
  if (!input) return;
  const day = ensureDay(currentDate);
  const taskId = input.dataset.taskId;
  if (input.checked && !isTaskReadyToComplete(day, taskId)) {
    input.checked = false;
    refs.fullBonus.textContent = getTaskDetailWarning(taskId);
    return;
  }
  if (input.checked) {
    if (!day.completedTaskIds.includes(taskId)) day.completedTaskIds.push(taskId);
  } else {
    day.completedTaskIds = day.completedTaskIds.filter((id) => id !== taskId);
  }
  saveState();
  render();
}

function onTaskDetailInput(event) {
  const field = event.target.closest("[data-task-detail]");
  if (!field) return;
  const day = ensureDay(currentDate);
  const taskId = field.dataset.taskDetail;
  day.taskDetails[taskId] = field.value.trimStart();
  if (!isTaskReadyToComplete(day, taskId)) {
    day.completedTaskIds = day.completedTaskIds.filter((id) => id !== taskId);
  }
  saveState();
}

function onSubmitSocial(event) {
  event.preventDefault();
  const day = ensureDay(currentDate);
  day.socials.push({
    id: uid(),
    person: refs.socialPerson.value,
    type: refs.socialType.value,
    feeling: refs.socialFeeling.value,
    note: refs.socialNote.value.trim(),
    date: currentDate
  });
  refs.socialForm.reset();
  fillSelect(refs.socialPerson, SOCIAL_PEOPLE);
  fillSelect(refs.socialType, SOCIAL_TYPES);
  fillSelect(refs.socialFeeling, SOCIAL_FEELINGS);
  saveState();
  render();
}

function onSubmitIdea(event) {
  event.preventDefault();
  const title = refs.ideaTitle.value.trim();
  if (!title) return;
  state.ideas.push({ id: uid(), title, bucket: refs.ideaBucket.value, doneDates: [] });
  refs.ideaForm.reset();
  saveState();
  render();
}

function onToggleIdea(event) {
  const input = event.target.closest("[data-idea-id]");
  if (!input) return;
  const idea = state.ideas.find((item) => item.id === input.dataset.ideaId);
  if (!idea) return;
  if (!Array.isArray(idea.doneDates)) idea.doneDates = [];
  if (input.checked) {
    if (!idea.doneDates.length) idea.doneDates = [currentDate];
  } else {
    idea.doneDates = [];
  }
  saveState();
  render();
}

function onSubmitRitual(event) {
  event.preventDefault();
  const day = ensureDay(currentDate);
  day.ritual.time = refs.ritualTime.value;
  day.ritual.journal = refs.ritualJournal.value.trim();
  day.ritual.completed = Boolean(day.ritual.time && day.ritual.journal);
  saveState();
  render();
}

function onSubmitWake(event) {
  event.preventDefault();
  const day = ensureDay(currentDate);
  day.wake.time = refs.wakeTime.value;
  day.wake.journal = refs.wakeJournal.value.trim();
  day.wake.completed = Boolean(day.wake.time && day.wake.journal);
  saveState();
  render();
}

function onSubmitExpense(event) {
  event.preventDefault();
  const amount = Number(refs.expenseAmount.value);
  if (!amount || amount <= 0) return;
  const book = refs.expenseBook.value;
  const tripId = book === "travel" ? refs.expenseTrip.value : "";
  if (book === "travel" && !tripId) return;
  const categories = getExpenseCategories(book);
  const category = categories.includes(refs.expenseCategory.value) ? refs.expenseCategory.value : (categories[0] || refs.expenseCategory.value);
  state.expenses.push({
    id: uid(),
    amount,
    category,
    book,
    note: refs.expenseNote.value.trim(),
    tripId,
    date: currentDate,
    createdAt: Date.now()
  });
  refs.expenseForm.reset();
  refs.expenseBook.value = "daily";
  renderExpenseTripSelect();
  saveState();
  render();
}

function onSubmitTrip(event) {
  event.preventDefault();
  const name = refs.tripName.value.trim();
  if (!name) return;
  state.trips.push({
    id: uid(),
    name,
    company: refs.tripCompany.value.trim(),
    start: refs.tripStart.value,
    end: refs.tripEnd.value,
    tasks: []
  });
  refs.tripForm.reset();
  saveState();
  render();
}

function onTripClick(event) {
  const importBtn = event.target.closest("[data-import-ideas]");
  if (importBtn) {
    const trip = findTrip(importBtn.dataset.importIdeas);
    if (!trip) return;
    state.ideas.filter((item) => item.bucket === "travel").forEach((idea) => {
      if (!trip.tasks.some((task) => task.title === idea.title)) {
        trip.tasks.push({ id: uid(), title: idea.title, done: false, completedDate: "" });
      }
    });
    saveState();
    render();
    return;
  }

  const removeTrip = event.target.closest("[data-remove-trip]");
  if (removeTrip) {
    state.trips = state.trips.filter((trip) => trip.id !== removeTrip.dataset.removeTrip);
    state.expenses = state.expenses.filter((item) => item.tripId !== removeTrip.dataset.removeTrip);
    saveState();
    render();
    return;
  }

  const removeTask = event.target.closest("[data-remove-trip-task]");
  if (removeTask) {
    const [tripId, taskId] = removeTask.dataset.removeTripTask.split("|");
    const trip = findTrip(tripId);
    if (!trip) return;
    trip.tasks = trip.tasks.filter((task) => task.id !== taskId);
    saveState();
    render();
  }
}

function onTripToggleTask(event) {
  const input = event.target.closest("[data-trip-task-id]");
  if (!input) return;
  const trip = findTrip(input.dataset.tripId);
  const task = trip?.tasks.find((item) => item.id === input.dataset.tripTaskId);
  if (!task) return;
  task.done = input.checked;
  task.completedDate = input.checked ? currentDate : "";
  saveState();
  render();
}

function onTripSubmit(event) {
  const form = event.target.closest("[data-trip-task-form]");
  if (!form) return;
  event.preventDefault();
  const trip = findTrip(form.dataset.tripTaskForm);
  if (!trip) return;
  const input = form.querySelector('input[name="tripTaskTitle"]');
  const title = input.value.trim();
  if (!title) return;
  trip.tasks.push({ id: uid(), title, done: false, completedDate: "" });
  saveState();
  render();
}

function onSubmitReward(event) {
  event.preventDefault();
  const name = refs.rewardName.value.trim();
  const cost = Number(refs.rewardCost.value);
  if (!name || !cost || cost < 1) return;
  state.rewards.push({ id: uid(), name, cost, hidden: false });
  refs.rewardForm.reset();
  saveState();
  render();
}

function onRewardClick(event) {
  const redeem = event.target.closest("[data-redeem]");
  if (redeem) {
    const reward = state.rewards.find((item) => item.id === redeem.dataset.redeem);
    if (!reward || computeTotals().availableCoins < reward.cost) return;
    reward.hidden = true;
    state.redemptions.push({
      id: uid(),
      rewardId: reward.id,
      name: reward.name,
      cost: reward.cost,
      date: currentDate
    });
    saveState();
    render();
    return;
  }
  const remove = event.target.closest("[data-remove-reward]");
  if (!remove) return;
  state.rewards = state.rewards.filter((item) => item.id !== remove.dataset.removeReward);
  saveState();
  render();
}

function onRemoveEntry(event) {
  const removeSocial = event.target.closest("[data-remove-social]");
  if (removeSocial) {
    ensureDay(currentDate).socials = ensureDay(currentDate).socials.filter((item) => item.id !== removeSocial.dataset.removeSocial);
    saveState();
    render();
    return;
  }
  const removeExpense = event.target.closest("[data-remove-expense]");
  if (removeExpense) {
    state.expenses = state.expenses.filter((item) => item.id !== removeExpense.dataset.removeExpense);
    saveState();
    render();
    return;
  }
  const removeIdea = event.target.closest("[data-remove-idea]");
  if (removeIdea) {
    state.ideas = state.ideas.filter((item) => item.id !== removeIdea.dataset.removeIdea);
    saveState();
    render();
  }
}

function switchScreen(screen) {
  activeScreen = screen;
  refs.screens.forEach((section) => section.classList.toggle("active", section.dataset.screen === screen));
  updateNav();
}

function updateNav() {
  refs.navBtns.forEach((btn) => btn.classList.toggle("active", btn.dataset.target === activeScreen));
}

function shiftDate(diff) {
  const date = parseDate(currentDate);
  date.setDate(date.getDate() + diff);
  currentDate = toISO(date);
  ensureDay(currentDate);
  render();
}

function ensureDay(date) {
  if (!state.days[date]) {
    state.days[date] = {
      enabledTaskIds: [],
      completedTaskIds: [],
      extraTasks: [],
      taskDetails: {},
      socials: [],
      ritual: {
        time: "",
        journal: "",
        completed: false
      },
      wake: {
        time: "",
        journal: "",
        completed: false
      }
    };
  }
  let changed = false;
  if (!Array.isArray(state.days[date].extraTasks)) {
    state.days[date].extraTasks = [];
  }
  if (!state.days[date].taskDetails) {
    state.days[date].taskDetails = {};
  }
  if (!state.days[date].ritual) {
    state.days[date].ritual = {
      time: "",
      journal: "",
      completed: false
    };
  }
  if (!state.days[date].wake) {
    state.days[date].wake = {
      time: "",
      journal: "",
      completed: false
    };
  }
  FIXED_DAILY_TASK_IDS.forEach((taskId) => {
    if (!state.days[date].enabledTaskIds.includes(taskId)) {
      state.days[date].enabledTaskIds.push(taskId);
      changed = true;
    }
  });
  if (changed) {
    state.days[date].enabledTaskIds = uniqueList(state.days[date].enabledTaskIds);
  }
  return state.days[date];
}

function getFullBonus(day) {
  const count = day.enabledTaskIds.length;
  const done = count > 0 && day.completedTaskIds.length === count;
  let coins = 0;
  if (count >= 7) coins = 16;
  else if (count >= 5) coins = 12;
  else if (count >= 3) coins = 8;
  return { earned: done && count >= 3, coins };
}

function computeTodayScore(date) {
  const day = ensureDay(date);
  const taskCoins = day.completedTaskIds.reduce((sum, id) => sum + getTaskCoinValue(day, id), 0);
  const fullBonus = getFullBonus(day).earned ? getFullBonus(day).coins : 0;
  const expenseCoins = state.expenses.filter((item) => item.date === date).length * 4;
  const socialCoins = day.socials.length * 3;
  const ideaCoins = state.ideas.filter((item) => item.doneDates.includes(date)).length * 3;
  const tripCoins = state.trips.flatMap((trip) => trip.tasks).filter((task) => task.completedDate === date).length * 5;
  const ritualCoins = (day.ritual.completed ? 20 : 0) + (day.wake?.completed ? 20 : 0);
  return { coins: taskCoins + fullBonus + expenseCoins + socialCoins + ideaCoins + tripCoins + ritualCoins };
}

function computeTotals() {
  const totals = {
    totalCoins: 0,
    availableCoins: 0,
    roomPoints: 0,
    lifePoints: 0,
    moneyPoints: 0,
    socialPoints: 0,
    travelPoints: 0,
    ritualPoints: 0,
    shelfPoints: 0
  };

  Object.values(state.days).forEach((day) => {
    const taskCoins = day.completedTaskIds.reduce((sum, id) => sum + getTaskCoinValue(day, id), 0);
    const fullBonus = getFullBonus(day).earned ? getFullBonus(day).coins : 0;
    totals.totalCoins += taskCoins + fullBonus + day.socials.length * 3 + (day.ritual.completed ? 20 : 0) + (day.wake?.completed ? 20 : 0);
    totals.lifePoints += day.completedTaskIds.length * 5 + fullBonus;
    totals.socialPoints += day.socials.length * 6;
    totals.ritualPoints += (day.ritual.completed ? 20 : 0) + (day.wake?.completed ? 20 : 0);
  });

  totals.totalCoins += state.expenses.length * 4;
  totals.totalCoins += state.ideas.flatMap((idea) => idea.doneDates).length * 3;
  state.trips.forEach((trip) => {
    trip.tasks.forEach((task) => {
      if (task.done) {
        totals.totalCoins += 5;
        totals.travelPoints += 8;
      }
    });
  });

  totals.moneyPoints = state.expenses.length * 6;
  totals.travelPoints += state.expenses.filter((item) => item.book === "travel").length * 4 + state.trips.length * 10;
  totals.lifePoints += state.ideas.filter((item) => item.bucket === "daily" && item.doneDates.length > 0).length * 3;
  totals.travelPoints += state.ideas.filter((item) => item.bucket === "travel" && item.doneDates.length > 0).length * 3;
  totals.shelfPoints = state.ideas.filter((item) => item.bucket === "book" || item.bucket === "movie").length * 2;
  totals.roomPoints = totals.lifePoints + totals.moneyPoints + totals.socialPoints + totals.travelPoints + totals.ritualPoints + totals.shelfPoints;

  const spent = state.redemptions.reduce((sum, item) => sum + item.cost, 0);
  totals.availableCoins = Math.max(totals.totalCoins - spent, 0);
  return totals;
}

function getTaskCoinValue(day, taskId) {
  const templateTask = state.taskTemplates.find((task) => task.id === taskId);
  if (templateTask) return Number(templateTask.coins || 0);
  const extraTask = (day.extraTasks || []).find((task) => task.id === taskId);
  return Number(extraTask?.coins || 0);
}

function computeRitualStreak() {
  let streak = 0;
  const cursor = parseDate(todayISO());
  while (true) {
    const day = state.days[toISO(cursor)];
    if (!day || !day.ritual?.completed) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function getLevel(points) {
  let level = 1;
  let spent = 0;
  let currentLevelRequirement = xpNeededForLevel(level);

  while (points >= spent + currentLevelRequirement) {
    spent += currentLevelRequirement;
    level += 1;
    currentLevelRequirement = xpNeededForLevel(level);
  }

  const currentXp = points - spent;
  const remaining = Math.max(currentLevelRequirement - currentXp, 0);
  const progress = Math.min(99, Math.round((currentXp / currentLevelRequirement) * 100));

  return {
    level,
    currentXp,
    currentLevelRequirement,
    remaining,
    progress
  };
}

function xpNeededForLevel(level) {
  return 100 + (level - 1) * 40;
}

function getSeasonKey(dateString) {
  const month = parseDate(dateString).getMonth() + 1;
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

function isTaskReadyToComplete(day, taskId) {
  const config = TASK_DETAIL_CONFIG[taskId];
  if (!config?.required) return true;
  return Boolean(day.taskDetails?.[taskId]?.trim());
}

function getTaskDetailWarning(taskId) {
  const config = TASK_DETAIL_CONFIG[taskId];
  return config ? `先补一下“${config.label}”，再打卡这项任务。` : "先把这项内容补完整再打卡。";
}

function activeStyle(active, color) {
  return active
    ? `background:${color};opacity:1;transform:translateY(-2px);`
    : "background:rgba(255,255,255,0.36);opacity:0.48;transform:none;";
}

function findTrip(id) {
  return state.trips.find((trip) => trip.id === id);
}

function isLegacySystemReward(reward) {
  return LEGACY_SYSTEM_REWARD_IDS.has(reward?.id);
}

function loadState() {
  try {
    const candidates = [
      readLocalSnapshot(STORAGE_KEY, "local-main"),
      readLocalSnapshot(STORAGE_BACKUP_KEY, "local-backup"),
      ...readLocalHistorySnapshots(STORAGE_HISTORY_KEY, "local-history"),
      ...LEGACY_STORAGE_KEYS.map((key) => readLocalSnapshot(key, `legacy:${key}`))
    ].filter(Boolean);
    if (!candidates.length) {
      storageMode = "local";
      return seedState();
    }
    const merged = mergeSnapshotCandidates(candidates);
    const selected = pickBestSnapshot(candidates);
    if (!selected) {
      storageMode = "local";
      return merged;
    }
    storageMode = candidates.length > 1 ? "recovered" : "local";
    if (storageMode === "recovered") {
      recoveryNotice = "启动时检测到多份本地记录，已经按时间顺序尽量合并恢复。";
    }
    return merged;
  } catch {
    return seedState();
  }
}

function loadCloudConfig() {
  try {
    const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
    const saved = raw ? JSON.parse(raw) : {};
    return normalizeCloudConfig(saved);
  } catch {
    return normalizeCloudConfig({});
  }
}

function saveCloudConfig(config) {
  cloudConfig = normalizeCloudConfig(config);
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify({
    url: cloudConfig.url,
    anonKey: cloudConfig.anonKey,
    email: cloudConfig.email
  }));
  appCloudConfigured = Boolean(APP_CLOUD_CONFIG.url && APP_CLOUD_CONFIG.anonKey);
}

function getOrCreateDeviceId() {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const created = uid();
    localStorage.setItem(DEVICE_ID_KEY, created);
    return created;
  } catch {
    return uid();
  }
}

function normalizeCloudConfig(input = {}) {
  return {
    url: APP_CLOUD_CONFIG.url || input.url || "",
    anonKey: APP_CLOUD_CONFIG.anonKey || input.anonKey || "",
    email: input.email || ""
  };
}

function seedState() {
  return {
    meta: {
      lastSavedAt: Date.now(),
      version: 2
    },
    taskTemplates: DEFAULT_TASKS,
    rewards: DEFAULT_REWARDS,
    redemptions: [],
    days: {},
    ideas: [],
    trips: [],
    expenses: [],
    media: []
  };
}

function emptyState() {
  return {
    meta: {
      lastSavedAt: 0,
      version: 2
    },
    taskTemplates: [],
    rewards: [],
    redemptions: [],
    days: {},
    ideas: [],
    trips: [],
    expenses: [],
    media: []
  };
}

function saveState() {
  state.meta = state.meta || {};
  state.meta.lastSavedAt = Date.now();
  state.meta.version = 2;
  persistSnapshot(state, false);
  queueCloudSync("local-save");
}

function normalizeState(parsed) {
  const mergedIdeas = [...(parsed.ideas || [])].map((idea) => ({
    ...idea,
    doneDates: Array.isArray(idea.doneDates) ? idea.doneDates : []
  }));
  (parsed.media || []).forEach((item) => {
    const bucket = item.type === "movie" ? "movie" : "book";
    if (!mergedIdeas.some((idea) => idea.title === item.title && idea.bucket === bucket)) {
      mergedIdeas.push({
        id: item.id || uid(),
        title: item.title,
        bucket,
        doneDates: item.done ? [todayISO()] : []
      });
    }
  });
  const normalized = {
    meta: {
      lastSavedAt: parsed?.meta?.lastSavedAt || Date.now(),
      version: parsed?.meta?.version || 2
    },
    taskTemplates: mergeTaskTemplates(parsed.taskTemplates),
    rewards: (parsed.rewards?.length ? parsed.rewards : DEFAULT_REWARDS).map((reward) => ({
      ...reward,
      hidden: Boolean(reward.hidden)
    })),
    redemptions: parsed.redemptions || [],
    days: parsed.days || {},
    ideas: mergedIdeas,
    trips: parsed.trips || [],
    expenses: parsed.expenses || [],
    media: parsed.media || []
  };
  Object.keys(normalized.days).forEach((date) => {
    normalized.days[date] = normalizeDay(normalized.days[date]);
  });
  return normalized;
}

async function hydrateFromIndexedDb() {
  try {
    const fromDb = await loadStateFromIndexedDb("state");
    const fromBackup = await loadStateFromIndexedDb("state-backup");
    const fromHistory = await loadStateFromIndexedDb("history");
    const candidates = [
      { source: storageMode === "recovered" ? "memory-recovered" : "memory", payload: state },
      fromDb ? { source: "indexeddb-main", payload: fromDb } : null,
      fromBackup ? { source: "indexeddb-backup", payload: fromBackup } : null,
      ...readHistorySnapshots(fromHistory, "indexeddb-history")
    ].filter(Boolean);
    if (!candidates.length) {
      persistSnapshot(state, false);
      storageMode = "local";
      renderInstallStatus();
      return;
    }
    const incoming = mergeSnapshotCandidates(candidates);
    replaceState(incoming);
    if (candidates.length > 1) {
      recoveryNotice = "已经把当前记录、备份和本地数据库中的快照合并到一起。";
    }
    persistSnapshot(state, false);
    storageMode = "indexeddb";
    render();
  } catch {
    storageMode = "local";
    renderInstallStatus();
  }
}

function replaceState(nextState) {
  for (const key of Object.keys(state)) {
    delete state[key];
  }
  Object.assign(state, normalizeState(nextState));
}

function normalizeDay(day) {
  return {
    enabledTaskIds: (day?.enabledTaskIds || []).map(remapTaskId).filter(Boolean),
    completedTaskIds: (day?.completedTaskIds || []).map(remapTaskId).filter(Boolean),
    extraTasks: (day?.extraTasks || []).map((task) => ({
      id: task.id || `extra-${uid()}`,
      name: task.name || "额外任务",
      coins: Number(task.coins || 0),
      note: task.note || "每日额外任务"
    })),
    taskDetails: day?.taskDetails || {},
    socials: day?.socials || [],
    ritual: {
      time: day?.ritual?.time || "",
      journal: day?.ritual?.journal || "",
      completed: Boolean(day?.ritual?.completed)
    },
    wake: {
      time: day?.wake?.time || "",
      journal: day?.wake?.journal || "",
      completed: Boolean(day?.wake?.completed)
    }
  };
}

function mergeTaskTemplates(savedTemplates) {
  const templates = Array.isArray(savedTemplates) && savedTemplates.length ? savedTemplates : DEFAULT_TASKS;
  const map = new Map(templates.map((task) => [remapTaskId(task.id), { ...task, id: remapTaskId(task.id) }]));
  DEFAULT_TASKS.forEach((task) => {
    map.set(task.id, { ...task, ...(map.get(task.id) || {}) });
  });
  map.delete("walk");
  return DEFAULT_TASKS.map((task) => map.get(task.id) || task);
}

function remapTaskId(taskId) {
  return taskId === "walk" ? "laundry" : taskId;
}

function openAppDb() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("indexedDB unsupported"));
      return;
    }
    const request = window.indexedDB.open("cozy-life-quest-db", 1);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("app")) {
        db.createObjectStore("app");
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function loadStateFromIndexedDb(key = "state") {
  const db = await openAppDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("app", "readonly");
    const store = tx.objectStore("app");
    const request = store.get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

async function saveStateToIndexedDb(payload, key = "state") {
  try {
    const db = await openAppDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction("app", "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore("app").put(JSON.parse(JSON.stringify(payload)), key);
    });
    storageMode = "indexeddb";
    renderInstallStatus();
  } catch {
    storageMode = "local";
  }
}

async function loadSupabaseLibrary() {
  if (window.supabase?.createClient) return window.supabase;
  if (supabaseInitPromise) return supabaseInitPromise;
  supabaseInitPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-supabase-lib="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.supabase), { once: true });
      existing.addEventListener("error", () => reject(new Error("Supabase 库加载失败")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = SUPABASE_LIBRARY_URL;
    script.async = true;
    script.dataset.supabaseLib = "true";
    script.onload = () => resolve(window.supabase);
    script.onerror = () => reject(new Error("Supabase 库加载失败"));
    document.head.append(script);
  });
  return supabaseInitPromise;
}

async function ensureSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  if (!cloudConfig.url || !cloudConfig.anonKey) {
    cloudSyncStatus = "请先填写 Supabase 配置";
    cloudSyncMessage = "需要 Project URL 和 anon key 才能连接。";
    renderCloudSettings();
    renderAuthPanel();
    return null;
  }
  const supabase = await loadSupabaseLibrary();
  supabaseClient = supabase.createClient(cloudConfig.url, cloudConfig.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
  supabaseClient.auth.onAuthStateChange((event, session) => {
    authSession = session;
    if (event === "SIGNED_OUT") {
      authOtpPending = false;
      cloudBootstrapped = false;
      cloudSyncStatus = "已退出云端账号";
      cloudSyncMessage = "本地数据没有丢，云端同步已暂停。";
      renderCloudSettings();
      renderAuthPanel();
      return;
    }
    if (session?.user) {
      authOtpPending = false;
      cloudSyncStatus = "已连接云端账号";
      cloudSyncMessage = `当前账号：${session.user.email || "已登录"}`;
      renderCloudSettings();
      renderAuthPanel();
      bootstrapCloudState(event).catch(() => {});
    } else {
      renderCloudSettings();
      renderAuthPanel();
    }
  });
  return supabaseClient;
}

async function initCloudSync() {
  if (!cloudConfig.url || !cloudConfig.anonKey) {
    cloudSyncStatus = "未配置云端同步";
    cloudSyncMessage = "把 Supabase Project URL 和 anon key 填进设置后，就能开始同步。";
    renderCloudSettings();
    renderAuthPanel();
    return;
  }
  try {
    cloudSyncStatus = "正在连接 Supabase";
    cloudSyncMessage = "连接成功后会检查有没有云端旧记录。";
    renderCloudSettings();
    renderAuthPanel();
    const client = await ensureSupabaseClient();
    if (!client) return;
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    authSession = data.session;
    if (authSession?.user) {
      authOtpPending = false;
      await bootstrapCloudState("init");
    } else {
      cloudSyncStatus = "已连接，等待登录";
      cloudSyncMessage = "可以直接发送验证码到你的邮箱。";
      renderCloudSettings();
      renderAuthPanel();
    }
  } catch (error) {
    cloudSyncStatus = "云端连接失败";
    cloudSyncMessage = error.message || "请检查 Supabase 配置。";
    renderCloudSettings();
    renderAuthPanel();
  }
}

async function bootstrapCloudState(reason = "manual") {
  if (!authSession?.user) {
    cloudSyncStatus = "还没有登录云端账号";
    cloudSyncMessage = "先发送邮箱登录链接并完成登录。";
    renderCloudSettings();
    renderAuthPanel();
    return;
  }
  try {
    const client = await ensureSupabaseClient();
    if (!client) return;
    cloudSyncStatus = "正在读取云端记录";
    cloudSyncMessage = "会把本地和云端数据做一次合并。";
    renderCloudSettings();
    renderAuthPanel();
    const { data, error } = await client
      .from(CLOUD_STATE_TABLE)
      .select("state, updated_at")
      .eq("user_id", authSession.user.id)
      .maybeSingle();
    if (error) throw error;

    if (data?.state) {
      const merged = mergeSnapshotCandidates([
        { source: "local-current", payload: state },
        { source: "cloud-state", payload: data.state }
      ]);
      replaceState(merged);
      persistSnapshot(state, false);
      render();
      cloudSyncStatus = "本地和云端已合并";
      cloudSyncMessage = "更新或换设备时，会优先把两边的记录合并。";
    } else if (scoreSnapshot(state) > 0) {
      await pushStateToCloud("bootstrap-empty-cloud");
      cloudSyncStatus = "已创建第一份云端记录";
      cloudSyncMessage = "当前本地数据已经上传到你的 Supabase。";
    } else {
      cloudSyncStatus = "云端已连接";
      cloudSyncMessage = "现在还没有记录，等你开始使用后会自动同步。";
    }
    cloudBootstrapped = true;
    renderCloudSettings();
    renderAuthPanel();
  } catch (error) {
    cloudSyncStatus = "读取云端记录失败";
    cloudSyncMessage = error.message || "请检查数据库表和权限策略。";
    renderCloudSettings();
    renderAuthPanel();
  }
}

function queueCloudSync(reason = "auto") {
  if (!authSession?.user || !cloudBootstrapped) return;
  if (cloudSyncTimer) clearTimeout(cloudSyncTimer);
  cloudSyncTimer = window.setTimeout(() => {
    pushStateToCloud(reason).catch(() => {});
  }, 1200);
}

async function pushStateToCloud(reason = "manual") {
  if (!authSession?.user || cloudSyncInFlight) return;
  try {
    const client = await ensureSupabaseClient();
    if (!client) return;
    cloudSyncInFlight = true;
    cloudSyncStatus = reason === "manual" ? "正在手动同步云端" : "正在上传到云端";
    cloudSyncMessage = "这一步会把当前整份状态写进你的 Supabase。";
    renderCloudSettings();
    renderAuthPanel();
    const payload = normalizeState(state);
    const { error } = await client.from(CLOUD_STATE_TABLE).upsert({
      user_id: authSession.user.id,
      state: payload,
      device_id: deviceId,
      client_updated_at: new Date(payload.meta?.lastSavedAt || Date.now()).toISOString()
    }, { onConflict: "user_id" });
    if (error) throw error;
    cloudSyncStatus = "云端同步完成";
    cloudSyncMessage = `最近同步设备：${deviceId.slice(0, 8)}。现在这份数据已经在云端有一份。`;
    renderCloudSettings();
    renderAuthPanel();
  } catch (error) {
    cloudSyncStatus = "上传云端失败";
    cloudSyncMessage = error.message || "请检查表结构和 RLS。";
    renderCloudSettings();
    renderAuthPanel();
  } finally {
    cloudSyncInFlight = false;
  }
}

function onBeforeInstallPrompt(event) {
  event.preventDefault();
  deferredInstallPrompt = event;
  renderInstallStatus();
}

function onAppInstalled() {
  deferredInstallPrompt = null;
  renderInstallStatus();
}

async function onInstallApp() {
  const isInstalled = window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone;
  if (isInstalled) {
    renderInstallStatus();
    return;
  }
  if (!deferredInstallPrompt) {
    refs.installStatus.innerHTML = `
      <div class="status-note">
        <strong>安装提示</strong>
        <span>通常需要先通过 localhost 或正式 HTTPS 地址打开，再在浏览器菜单里选择“添加到主屏幕”或“安装应用”。</span>
      </div>
    `;
    return;
  }
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice.catch(() => null);
  deferredInstallPrompt = null;
  renderInstallStatus();
}

async function refreshPersistenceStatus() {
  if (!navigator.storage?.persisted) {
    persistenceStatus = "unsupported";
    renderInstallStatus();
    return;
  }
  try {
    const persisted = await navigator.storage.persisted();
    persistenceStatus = persisted ? "granted" : "denied";
  } catch {
    persistenceStatus = "unsupported";
  }
  renderInstallStatus();
}

async function onRequestPersistence() {
  if (!navigator.storage?.persist) {
    persistenceStatus = "unsupported";
    renderInstallStatus();
    return;
  }
  try {
    const granted = await navigator.storage.persist();
    persistenceStatus = granted ? "granted" : "denied";
  } catch {
    persistenceStatus = "unsupported";
  }
  renderInstallStatus();
}

async function onSaveCloudConfig(event) {
  event.preventDefault();
  cloudConfig = {
    url: refs.cloudUrl.value.trim(),
    anonKey: refs.cloudAnonKey.value.trim(),
    email: refs.cloudEmail.value.trim()
  };
  saveCloudConfig(cloudConfig);
  supabaseClient = null;
  supabaseInitPromise = null;
  authSession = null;
  cloudBootstrapped = false;
  cloudSyncStatus = cloudConfig.url && cloudConfig.anonKey ? "云端配置已保存，准备连接" : "云端配置未完成";
  cloudSyncMessage = "配置保存在当前设备里。现在可以发送邮箱登录链接。";
  renderCloudSettings();
  renderAuthPanel();
  await initCloudSync().catch(() => {});
}

async function onSendCloudMagicLink() {
  const email = (refs.authEmail?.value || refs.cloudEmail?.value || cloudConfig.email || "").trim();
  if (!email) {
    cloudSyncStatus = "Enter your email";
    cloudSyncMessage = "We need your email address to send the login code.";
    renderCloudSettings();
    renderAuthPanel();
    return;
  }
  try {
    const client = await ensureSupabaseClient();
    if (!client) return;
    const redirectTo = getEmailRedirectTarget();
    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: redirectTo
      }
    });
    if (error) throw error;
    cloudConfig.email = email;
    saveCloudConfig(cloudConfig);
    authOtpPending = true;
    cloudSyncStatus = "Code sent";
    cloudSyncMessage = `Check ${email} for the verification code, then enter it here.`;
  } catch (error) {
    cloudSyncStatus = "Could not send code";
    cloudSyncMessage = error.message || "Check the Supabase email auth settings.";
  }
  renderCloudSettings();
  renderAuthPanel();
}

async function onAuthSendLinkFromPanel(event) {
  event.preventDefault();
  cloudConfig = normalizeCloudConfig({
    ...cloudConfig,
    email: refs.authEmail?.value.trim()
  });
  saveCloudConfig(cloudConfig);
  renderCloudSettings();
  renderAuthPanel();
  await onSendCloudMagicLink();
}

async function onVerifyAuthCode() {
  const email = (refs.authEmail?.value || cloudConfig.email || "").trim();
  const code = refs.authCode?.value.trim();
  if (!email || !code) {
    cloudSyncStatus = "Enter the code";
    cloudSyncMessage = "Send the code first, then enter the 8 digits from the email.";
    renderCloudSettings();
    renderAuthPanel();
    return;
  }
  try {
    const client = await ensureSupabaseClient();
    if (!client) return;
    const { data, error } = await client.auth.verifyOtp({
      email,
      token: code,
      type: "email"
    });
    if (error) throw error;
    authSession = data.session;
    authOtpPending = false;
    if (refs.authCode) refs.authCode.value = "";
    cloudSyncStatus = "Login successful";
    cloudSyncMessage = "Loading and merging your cloud record.";
    renderCloudSettings();
    renderAuthPanel();
    await bootstrapCloudState("otp-login");
  } catch (error) {
    cloudSyncStatus = "Code verification failed";
    cloudSyncMessage = error.message || "Please check whether the code is still valid.";
    renderCloudSettings();
    renderAuthPanel();
  }
}

async function onCloudSyncNow() {
  await bootstrapCloudState("manual");
  renderAuthPanel();
}

async function onCloudSignOut() {
  try {
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }
  } catch {}
  authSession = null;
  authOtpPending = false;
  cloudBootstrapped = false;
  cloudSyncStatus = "已退出云端账号";
  cloudSyncMessage = "本地数据还在，云端同步会先暂停。";
  renderCloudSettings();
  renderAuthPanel();
}

function onSaveNow() {
  syncCurrentDrafts();
  saveState();
  recoveryNotice = "已经手动保存当前记录，并同步刷新本地备份。";
  renderInstallStatus();
}

function getEmailRedirectTarget() {
  const url = new URL(window.location.href);
  const clean = `${url.origin}${url.pathname}`;
  return clean.endsWith("/") ? clean : `${clean}/`;
}

function onRestoreBackup() {
  const candidates = [
    readLocalSnapshot(STORAGE_BACKUP_KEY, "local-backup"),
    ...readLocalHistorySnapshots(STORAGE_HISTORY_KEY, "local-history"),
    ...LEGACY_STORAGE_KEYS.map((key) => readLocalSnapshot(key, `legacy:${key}`))
  ].filter(Boolean);
  if (!candidates.length) {
    recoveryNotice = "没有找到可恢复的本地备份。";
    renderInstallStatus();
    return;
  }
  replaceState(mergeSnapshotCandidates(candidates));
  persistSnapshot(state, false);
  recoveryNotice = "已经从历史快照中恢复并合并可用记录。";
  render();
}

function onExportData() {
  syncCurrentDrafts();
  saveState();
  downloadBlob(makeJsonBlob(state), `${SHARE_FILENAME_PREFIX}-backup-${currentDate}.json`);
}

function onExportToday() {
  syncCurrentDrafts();
  saveState();
  const payload = buildTodayExport(currentDate);
  downloadBlob(makeJsonBlob(payload), `${SHARE_FILENAME_PREFIX}-day-${currentDate}.json`);
}

async function onShareBackup() {
  syncCurrentDrafts();
  saveState();
  const file = makeJsonFile(state, `${SHARE_FILENAME_PREFIX}-backup-${currentDate}.json`);
  if (!canShareFiles()) {
    onExportData();
    return;
  }
  try {
    await navigator.share({
      title: "四季生活手帐备份",
      text: "把这份备份存到文件、OneDrive 或其他地方。",
      files: [file]
    });
    recoveryNotice = "已经打开系统分享面板，你可以存到文件或 OneDrive。";
  } catch {
    recoveryNotice = "这次没有成功分享备份，已经保留在本地，可改用导出备份。";
  }
  renderInstallStatus();
}

async function onImportData(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = normalizeState(JSON.parse(text));
    replaceState(parsed);
    saveState();
    render();
  } catch {
    refs.installStatus.innerHTML = `
      <div class="status-note">
        <strong>导入失败</strong>
        <span>这个备份文件无法识别，请确认它是本应用导出的 JSON 文件。</span>
      </div>
    `;
  } finally {
    refs.importFile.value = "";
  }
}

function fillSelect(element, options) {
  element.innerHTML = options.map((item) => `<option value="${item}">${item}</option>`).join("");
}

function sumAmount(list) {
  return list.reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

function todayISO() {
  return toISO(new Date());
}

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 2
  }).format(amount || 0);
}

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function $(selector) {
  return document.querySelector(selector);
}

function readLocalSnapshot(key, source) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return { source, payload: JSON.parse(raw) };
  } catch {
    return null;
  }
}

function readLocalHistorySnapshots(key, sourcePrefix) {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    return readHistorySnapshots(JSON.parse(raw), sourcePrefix);
  } catch {
    return [];
  }
}

function readHistorySnapshots(rawHistory, sourcePrefix) {
  if (!Array.isArray(rawHistory)) return [];
  return rawHistory
    .map((entry, index) => {
      const payload = entry?.payload || entry;
      return payload ? { source: `${sourcePrefix}-${index}`, payload } : null;
    })
    .filter(Boolean);
}

function scoreSnapshot(snapshot) {
  if (!snapshot) return -1;
  const days = Object.values(snapshot.days || {}).reduce((sum, day) => {
    const enabled = day?.enabledTaskIds?.length || 0;
    const completed = day?.completedTaskIds?.length || 0;
    const socials = day?.socials?.length || 0;
    const ritual = (day?.ritual?.completed ? 1 : 0) + (day?.wake?.completed ? 1 : 0);
    const details = Object.keys(day?.taskDetails || {}).length;
    return sum + enabled + completed + socials + ritual + details;
  }, 0);
  const trips = (snapshot.trips || []).reduce((sum, trip) => sum + 1 + (trip.tasks?.length || 0), 0);
  return days
    + (snapshot.ideas?.length || 0)
    + (snapshot.expenses?.length || 0)
    + (snapshot.redemptions?.length || 0)
    + trips
    + ((snapshot.rewards?.length || 0) > DEFAULT_REWARDS.length ? 1 : 0);
}

function pickBestSnapshot(candidates) {
  return (candidates || [])
    .filter(Boolean)
    .map((candidate) => ({
      ...candidate,
      score: scoreSnapshot(candidate.payload),
      savedAt: candidate.payload?.meta?.lastSavedAt || 0,
      meaningful: scoreSnapshot(candidate.payload) > 0
    }))
    .sort((a, b) => {
      if (a.meaningful !== b.meaningful) return Number(b.meaningful) - Number(a.meaningful);
      if (a.savedAt !== b.savedAt) return b.savedAt - a.savedAt;
      if (a.score !== b.score) return b.score - a.score;
      return b.savedAt - a.savedAt;
    })[0] || null;
}

function mergeSnapshotCandidates(candidates) {
  const normalized = (candidates || [])
    .filter(Boolean)
    .map((candidate) => normalizeState(candidate.payload || candidate))
    .sort((a, b) => (a.meta?.lastSavedAt || 0) - (b.meta?.lastSavedAt || 0));

  return normalized.reduce((merged, incoming) => mergeStates(merged, incoming), emptyState());
}

function mergeStates(base, incoming) {
  const merged = normalizeState(base);
  const next = normalizeState(incoming);
  return normalizeState({
    meta: {
      lastSavedAt: Math.max(merged.meta?.lastSavedAt || 0, next.meta?.lastSavedAt || 0),
      version: Math.max(merged.meta?.version || 0, next.meta?.version || 0, 2)
    },
    taskTemplates: mergeTaskTemplates([...(merged.taskTemplates || []), ...(next.taskTemplates || [])]),
    rewards: mergeUniqueEntries([...(merged.rewards || []), ...(next.rewards || [])], (item) => `${item.name}|${item.cost}`),
    redemptions: mergeUniqueEntries([...(merged.redemptions || []), ...(next.redemptions || [])], (item) => item.id || `${item.date}|${item.name}|${item.cost}`),
    days: mergeDayMaps(merged.days || {}, next.days || {}),
    ideas: mergeIdeas(merged.ideas || [], next.ideas || []),
    trips: mergeTrips(merged.trips || [], next.trips || []),
    expenses: mergeUniqueEntries([...(merged.expenses || []), ...(next.expenses || [])], (item) => item.id || `${item.date}|${item.amount}|${item.category}|${item.note || ""}|${item.tripId || ""}`),
    media: mergeUniqueEntries([...(merged.media || []), ...(next.media || [])], (item) => item.id || `${item.type || ""}|${item.title || ""}`)
  });
}

function mergeDayMaps(baseDays, nextDays) {
  const result = {};
  const keys = new Set([...Object.keys(baseDays || {}), ...Object.keys(nextDays || {})]);
  keys.forEach((date) => {
    result[date] = mergeDayRecords(baseDays[date], nextDays[date]);
  });
  return result;
}

function mergeDayRecords(baseDay, nextDay) {
  const base = normalizeDay(baseDay || {});
  const incoming = normalizeDay(nextDay || {});
  return {
    enabledTaskIds: uniqueList([...base.enabledTaskIds, ...incoming.enabledTaskIds]),
    completedTaskIds: uniqueList([...base.completedTaskIds, ...incoming.completedTaskIds]),
    extraTasks: mergeUniqueEntries([...(base.extraTasks || []), ...(incoming.extraTasks || [])], (item) => item.id || `${item.name}|${item.coins}`),
    taskDetails: mergeTaskDetails(base.taskDetails, incoming.taskDetails),
    socials: mergeUniqueEntries([...(base.socials || []), ...(incoming.socials || [])], (item) => item.id || `${item.date || ""}|${item.person}|${item.type}|${item.feeling}|${item.note || ""}`),
    ritual: mergeRitualEntry(base.ritual, incoming.ritual),
    wake: mergeRitualEntry(base.wake, incoming.wake)
  };
}

function mergeTaskDetails(baseDetails = {}, nextDetails = {}) {
  const merged = { ...baseDetails };
  Object.entries(nextDetails).forEach(([key, value]) => {
    if (value) merged[key] = value;
  });
  return merged;
}

function mergeRitualEntry(baseEntry = {}, nextEntry = {}) {
  const baseScore = ritualEntryScore(baseEntry);
  const nextScore = ritualEntryScore(nextEntry);
  return nextScore >= baseScore
    ? {
        time: nextEntry.time || baseEntry.time || "",
        journal: nextEntry.journal || baseEntry.journal || "",
        completed: Boolean(nextEntry.completed || (nextEntry.time && nextEntry.journal) || baseEntry.completed)
      }
    : {
        time: baseEntry.time || nextEntry.time || "",
        journal: baseEntry.journal || nextEntry.journal || "",
        completed: Boolean(baseEntry.completed || (baseEntry.time && baseEntry.journal) || nextEntry.completed)
      };
}

function ritualEntryScore(entry = {}) {
  return (entry.completed ? 4 : 0) + (entry.time ? 1 : 0) + ((entry.journal || "").length ? 2 : 0);
}

function mergeIdeas(baseIdeas, nextIdeas) {
  const map = new Map();
  [...baseIdeas, ...nextIdeas].forEach((idea) => {
    const key = `${idea.bucket}|${idea.title}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        ...idea,
        doneDates: uniqueList([...(idea.doneDates || [])])
      });
      return;
    }
    map.set(key, {
      ...existing,
      ...idea,
      id: existing.id || idea.id,
      doneDates: uniqueList([...(existing.doneDates || []), ...(idea.doneDates || [])])
    });
  });
  return [...map.values()];
}

function mergeTrips(baseTrips, nextTrips) {
  const map = new Map();
  [...baseTrips, ...nextTrips].forEach((trip) => {
    const key = trip.id || `${trip.name}|${trip.start || ""}|${trip.end || ""}|${trip.company || ""}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        ...trip,
        tasks: mergeTripTasks([], trip.tasks || [])
      });
      return;
    }
    map.set(key, {
      ...existing,
      ...trip,
      id: existing.id || trip.id,
      name: trip.name || existing.name,
      company: trip.company || existing.company,
      start: trip.start || existing.start,
      end: trip.end || existing.end,
      tasks: mergeTripTasks(existing.tasks || [], trip.tasks || [])
    });
  });
  return [...map.values()];
}

function mergeTripTasks(baseTasks, nextTasks) {
  const map = new Map();
  [...baseTasks, ...nextTasks].forEach((task) => {
    const key = task.id || task.title;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...task });
      return;
    }
    map.set(key, {
      ...existing,
      ...task,
      id: existing.id || task.id,
      title: task.title || existing.title,
      done: Boolean(existing.done || task.done),
      completedDate: task.completedDate || existing.completedDate || ""
    });
  });
  return [...map.values()];
}

function mergeUniqueEntries(items, keyFn) {
  const map = new Map();
  (items || []).forEach((item) => {
    if (!item) return;
    map.set(keyFn(item), item);
  });
  return [...map.values()];
}

function uniqueList(items) {
  return [...new Set((items || []).filter(Boolean))];
}

function getLatestBackupInfo() {
  const selected = pickBestSnapshot([
    readLocalSnapshot(STORAGE_BACKUP_KEY, "local-backup"),
    ...readLocalHistorySnapshots(STORAGE_HISTORY_KEY, "local-history"),
    ...LEGACY_STORAGE_KEYS.map((key) => readLocalSnapshot(key, `legacy:${key}`))
  ]);
  if (!selected || scoreSnapshot(selected.payload) <= 0) {
    return { available: false, label: "还没有检测到可恢复的本地备份" };
  }
  const savedAt = selected.payload?.meta?.lastSavedAt;
  return {
    available: true,
    label: savedAt
      ? `最近一次可恢复快照：${formatDateTime(savedAt)}`
      : "检测到可恢复备份，但没有保存时间"
  };
}

function persistSnapshot(snapshot, touchMeta = false) {
  const payload = normalizeState(snapshot);
  if (touchMeta) {
    payload.meta = payload.meta || {};
    payload.meta.lastSavedAt = Date.now();
    payload.meta.version = 2;
  }
  const serialized = JSON.stringify(payload);
  const previousMain = readLocalSnapshot(STORAGE_KEY, "local-main")?.payload || null;
  localStorage.setItem(STORAGE_KEY, serialized);
  const backupCandidate = pickBestSnapshot([
    previousMain ? { source: "previous-main", payload: previousMain } : null,
    readLocalSnapshot(STORAGE_BACKUP_KEY, "local-backup"),
    { source: "current", payload }
  ]);
  if (backupCandidate) {
    localStorage.setItem(STORAGE_BACKUP_KEY, JSON.stringify(normalizeState(backupCandidate.payload)));
  }
  writeLocalHistorySnapshot(payload);
  saveStateToIndexedDb(payload, "state");
  saveStateToIndexedDb(backupCandidate?.payload || payload, "state-backup");
  saveStateToIndexedDb(buildSnapshotHistoryPayload(payload), "history");
}

function writeLocalHistorySnapshot(payload) {
  try {
    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(buildSnapshotHistoryPayload(payload)));
  } catch {}
}

function buildSnapshotHistoryPayload(payload) {
  const current = normalizeState(payload);
  const history = readLocalHistorySnapshots(STORAGE_HISTORY_KEY, "local-history")
    .map((item) => normalizeState(item.payload));
  const snapshots = [...history, current];
  const deduped = [];
  snapshots.forEach((item) => {
    const previous = deduped[deduped.length - 1];
    if (previous && previous.meta?.lastSavedAt === item.meta?.lastSavedAt && scoreSnapshot(previous) === scoreSnapshot(item)) {
      deduped[deduped.length - 1] = item;
    } else {
      deduped.push(item);
    }
  });
  return deduped.slice(-SNAPSHOT_LIMIT).map((item) => ({
    savedAt: item.meta?.lastSavedAt || Date.now(),
    payload: item
  }));
}

function buildTodayExport(date) {
  const day = ensureDay(date);
  return {
    exportedAt: Date.now(),
    date,
    day,
    socials: day.socials || [],
    expenses: state.expenses.filter((item) => item.date === date),
    completedIdeas: state.ideas.filter((item) => item.doneDates.includes(date)),
    completedTripTasks: state.trips.flatMap((trip) =>
      trip.tasks.filter((task) => task.completedDate === date).map((task) => ({
        tripId: trip.id,
        tripName: trip.name,
        task
      }))
    ),
    totals: computeTodayScore(date)
  };
}

function makeJsonBlob(payload) {
  return new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
}

function makeJsonFile(payload, filename) {
  return new File([JSON.stringify(payload, null, 2)], filename, { type: "application/json" });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function canShareFiles() {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function" || typeof window.File !== "function") {
    return false;
  }
  if (typeof navigator.canShare !== "function") {
    return true;
  }
  const testFile = new File(["{}"], "test.json", { type: "application/json" });
  return navigator.canShare({ files: [testFile] });
}

function syncCurrentDrafts() {
  const day = ensureDay(currentDate);
  if (refs.ritualTime && refs.ritualJournal) {
    day.ritual.time = refs.ritualTime.value || day.ritual.time;
    day.ritual.journal = refs.ritualJournal.value.trim() || day.ritual.journal;
    day.ritual.completed = Boolean(day.ritual.time && day.ritual.journal);
  }
  if (refs.wakeTime && refs.wakeJournal) {
    day.wake.time = refs.wakeTime.value || day.wake.time;
    day.wake.journal = refs.wakeJournal.value.trim() || day.wake.journal;
    day.wake.completed = Boolean(day.wake.time && day.wake.journal);
  }
}

function formatDateTime(timestamp) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

function coinMarkup(amount, signed = false) {
  const prefix = signed && amount > 0 ? "+" : "";
  return `${prefix}${amount}<span class="coin-inline" aria-hidden="true">¥</span>`;
}
