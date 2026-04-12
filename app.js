const STORAGE_KEY = "cozy-life-quest-v1";

const DEFAULT_TASKS = [
  { id: "breakfast", name: "早餐", coins: 4, note: "认真吃一顿早餐" },
  { id: "lunch", name: "午餐", coins: 4, note: "好好吃饭" },
  { id: "dinner", name: "晚餐", coins: 4, note: "给今天收个尾" },
  { id: "outfit", name: "穿搭", coins: 4, note: "写一句今天的穿搭" },
  { id: "shower", name: "洗澡", coins: 4, note: "让自己清爽一点" },
  { id: "hair", name: "洗头", coins: 4, note: "头发护理完成" },
  { id: "makeup", name: "化妆", coins: 4, note: "认真打理自己" },
  { id: "snack", name: "零食", coins: 4, note: "吃到喜欢的小东西" },
  { id: "workout", name: "健身", coins: 6, note: "动一动，身体会开心" },
  { id: "laundry", name: "洗衣服", coins: 4, note: "把衣服和生活一起整理好" }
];

const SOCIAL_PEOPLE = ["朋友", "家人", "同事", "恋爱", "陌生人", "其他"];
const SOCIAL_TYPES = ["见面", "吃饭", "聊天", "通话", "出游"];
const SOCIAL_FEELINGS = ["开心", "平静", "被治愈", "疲惫", "尴尬", "普通"];
const EXPENSE_CATEGORIES = ["超市/网购", "社交聚餐", "交通/日常旅行", "特殊物品", "长途旅行"];
const DEFAULT_REWARDS = [
  { id: "r1", name: "一杯奶茶", cost: 30 },
  { id: "r2", name: "一部电影", cost: 120 }
];
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
  ensureDay(currentDate);
  fillSelect(refs.socialPerson, SOCIAL_PEOPLE);
  fillSelect(refs.socialType, SOCIAL_TYPES);
  fillSelect(refs.socialFeeling, SOCIAL_FEELINGS);
  fillSelect(refs.expenseCategory, EXPENSE_CATEGORIES);
  bindEvents();
  switchScreen(activeScreen);
  render();
  hydrateFromIndexedDb();
  refreshPersistenceStatus();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
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
  refs.requestPersistence.addEventListener("click", onRequestPersistence);
  refs.exportData.addEventListener("click", onExportData);
  refs.importData.addEventListener("click", () => refs.importFile.click());
  refs.importFile.addEventListener("change", onImportData);
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
    { value: `${totals.availableCoins}`, label: "当前金币" },
    { value: `+${today.coins}`, label: "今日收获" },
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
      <input type="checkbox" data-template-id="${task.id}" ${day.enabledTaskIds.includes(task.id) ? "checked" : ""}>
      <span>${escapeHtml(task.name)}<br><small>+${task.coins} 金币</small></span>
    </label>
  `).join("");
}

function renderTodayTasks() {
  const day = ensureDay(currentDate);
  const enabledTasks = state.taskTemplates.filter((task) => day.enabledTaskIds.includes(task.id));
  refs.todayTaskList.innerHTML = enabledTasks.map((task) => `
    <article class="task-item">
      <div class="task-topline">
        <label class="task-main">
          <strong>${escapeHtml(task.name)}</strong>
          <span class="muted">${escapeHtml(task.note)}</span>
          <div class="task-tags"><span class="tag">+${task.coins} 金币</span></div>
        </label>
        <div class="task-meta">
          <input class="task-check" type="checkbox" data-task-id="${task.id}" ${day.completedTaskIds.includes(task.id) ? "checked" : ""}>
        </div>
      </div>
      ${renderTaskDetailField(task, day)}
    </article>
  `).join("");
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

function renderTaskDetailField(task, day) {
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
  refs.dailyIdeas.innerHTML = state.ideas.filter((item) => item.bucket === "daily").map(renderIdeaItem).join("");
  refs.travelIdeas.innerHTML = state.ideas.filter((item) => item.bucket === "travel").map(renderIdeaItem).join("");
  refs.bookIdeas.innerHTML = state.ideas.filter((item) => item.bucket === "book").map(renderIdeaItem).join("");
  refs.movieIdeas.innerHTML = state.ideas.filter((item) => item.bucket === "movie").map(renderIdeaItem).join("");
}

function renderIdeaItem(item) {
  const done = item.doneDates.includes(currentDate);
  return `
    <article class="idea-item">
      <label>
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
      <span>睡前仪式奖励 +20 金币</span>
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
  refs.expenseTripField.style.display = refs.expenseBook.value === "travel" ? "grid" : "none";
  if (!state.trips.length) {
    refs.expenseTrip.innerHTML = '<option value="">先创建旅行</option>';
    return;
  }
  refs.expenseTrip.innerHTML = state.trips.map((trip) => `
    <option value="${trip.id}">${escapeHtml(trip.name)}</option>
  `).join("");
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
      <button class="tiny-btn danger-btn" type="button" data-remove-expense="${item.id}">删除</button>
    </article>
  `).join("");
}

function renderExpenseStats() {
  const all = state.expenses;
  const weekList = filterEntriesByRange(all, "week", currentDate);
  const monthList = filterEntriesByRange(all, "month", currentDate);
  const yearList = filterEntriesByRange(all, "year", currentDate);
  const currentRangeList = filterEntriesByRange(all, activeExpenseStatsRange, currentDate);
  const categoryMap = currentRangeList.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {});

  refs.expensePanel.innerHTML = `
    <div class="focus-summary">
      <div class="summary-card"><strong>${formatCurrency(sumAmount(weekList))}</strong><span>本周</span></div>
      <div class="summary-card"><strong>${formatCurrency(sumAmount(monthList))}</strong><span>本月</span></div>
      <div class="summary-card"><strong>${formatCurrency(sumAmount(yearList))}</strong><span>今年</span></div>
    </div>
    <div class="tabs-inline compact-tabs">
      <button class="chip-btn ${activeExpenseStatsRange === "week" ? "active" : ""}" type="button" data-expense-range="week">看本周分类</button>
      <button class="chip-btn ${activeExpenseStatsRange === "month" ? "active" : ""}" type="button" data-expense-range="month">看本月分类</button>
      <button class="chip-btn ${activeExpenseStatsRange === "year" ? "active" : ""}" type="button" data-expense-range="year">看今年分类</button>
    </div>
    <div class="entry-list">
      ${Object.entries(categoryMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => `
        <article class="entry-item">
          <div class="entry-main">
            <strong>${escapeHtml(name)}</strong>
            <span class="muted">${rangeLabel(activeExpenseStatsRange)}分类统计</span>
          </div>
          <div class="cost">${formatCurrency(value)}</div>
        </article>
      `).join("")}
    </div>
  `;
}

function renderTrips() {
  refs.tripList.innerHTML = state.trips.slice().reverse().map((trip) => {
    const expenses = state.expenses.filter((item) => item.tripId === trip.id);
    return `
      <article class="trip-item">
        <div class="trip-card-inner">
          <div class="trip-main">
            <strong>${escapeHtml(trip.name)}</strong>
            <div class="trip-meta">
              ${trip.company ? `<span class="tag">和 ${escapeHtml(trip.company)} 一起</span>` : ""}
              <span class="tag">${trip.start || "未填开始"}</span>
              <span class="tag">${trip.end || "未填结束"}</span>
              <span class="tag">${trip.tasks.filter((item) => item.done).length}/${trip.tasks.length} 项任务</span>
              <span class="tag">${formatCurrency(sumAmount(expenses))}</span>
            </div>
          </div>
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
        ["睡前仪式", totals.ritualPoints, "完成时间 + 文字日记后可获得 20 XP。"],
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
  const button = event.target.closest("[data-expense-range]");
  if (!button) return;
  activeExpenseStatsRange = button.dataset.expenseRange;
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
      : "正在初始化本地数据层";

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
  `;

  refs.installApp.textContent = isInstalled ? "已安装" : deferredInstallPrompt ? "安装到桌面" : "查看安装方式";
  refs.installApp.disabled = isInstalled;
}

function renderRewards() {
  const totals = computeTotals();
  refs.rewardList.innerHTML = state.rewards.map((reward) => `
    <article class="reward-item">
      <div class="reward-main">
        <strong>${escapeHtml(reward.name)}</strong>
        <span class="muted">${reward.cost} 金币</span>
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
  if (input.checked) {
    if (!day.enabledTaskIds.includes(taskId)) day.enabledTaskIds.push(taskId);
  } else {
    day.enabledTaskIds = day.enabledTaskIds.filter((id) => id !== taskId);
    day.completedTaskIds = day.completedTaskIds.filter((id) => id !== taskId);
  }
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
  if (input.checked) {
    if (!idea.doneDates.includes(currentDate)) idea.doneDates.push(currentDate);
  } else {
    idea.doneDates = idea.doneDates.filter((date) => date !== currentDate);
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

function onSubmitExpense(event) {
  event.preventDefault();
  const amount = Number(refs.expenseAmount.value);
  if (!amount || amount <= 0) return;
  const book = refs.expenseBook.value;
  const tripId = book === "travel" ? refs.expenseTrip.value : "";
  if (book === "travel" && !tripId) return;
  state.expenses.push({
    id: uid(),
    amount,
    category: refs.expenseCategory.value,
    book,
    note: refs.expenseNote.value.trim(),
    tripId,
    date: currentDate,
    createdAt: Date.now()
  });
  refs.expenseForm.reset();
  fillSelect(refs.expenseCategory, EXPENSE_CATEGORIES);
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
  state.rewards.push({ id: uid(), name, cost });
  refs.rewardForm.reset();
  saveState();
  render();
}

function onRewardClick(event) {
  const redeem = event.target.closest("[data-redeem]");
  if (redeem) {
    const reward = state.rewards.find((item) => item.id === redeem.dataset.redeem);
    if (!reward || computeTotals().availableCoins < reward.cost) return;
    state.redemptions.push({ id: uid(), name: reward.name, cost: reward.cost, date: currentDate });
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
      taskDetails: {},
      socials: [],
      ritual: {
        time: "",
        journal: "",
        completed: false
      }
    };
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
  const taskCoins = day.completedTaskIds
    .map((id) => state.taskTemplates.find((task) => task.id === id))
    .filter(Boolean)
    .reduce((sum, task) => sum + task.coins, 0);
  const fullBonus = getFullBonus(day).earned ? getFullBonus(day).coins : 0;
  const expenseCoins = state.expenses.filter((item) => item.date === date).length * 4;
  const socialCoins = day.socials.length * 3;
  const ideaCoins = state.ideas.filter((item) => item.doneDates.includes(date)).length * 3;
  const tripCoins = state.trips.flatMap((trip) => trip.tasks).filter((task) => task.completedDate === date).length * 5;
  const ritualCoins = day.ritual.completed ? 20 : 0;
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
    const taskCoins = day.completedTaskIds
      .map((id) => state.taskTemplates.find((task) => task.id === id))
      .filter(Boolean)
      .reduce((sum, task) => sum + task.coins, 0);
    const fullBonus = getFullBonus(day).earned ? getFullBonus(day).coins : 0;
    totals.totalCoins += taskCoins + fullBonus + day.socials.length * 3 + (day.ritual.completed ? 20 : 0);
    totals.lifePoints += day.completedTaskIds.length * 5 + fullBonus;
    totals.socialPoints += day.socials.length * 6;
    totals.ritualPoints += day.ritual.completed ? 20 : 0;
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

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      storageMode = "local";
      return seedState();
    }
    storageMode = "local";
    return normalizeState(JSON.parse(raw));
  } catch {
    return seedState();
  }
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

function saveState() {
  state.meta = state.meta || {};
  state.meta.lastSavedAt = Date.now();
  state.meta.version = 2;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  saveStateToIndexedDb(state);
}

function normalizeState(parsed) {
  const mergedIdeas = [...(parsed.ideas || [])];
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
    rewards: parsed.rewards?.length ? parsed.rewards : DEFAULT_REWARDS,
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
    const fromDb = await loadStateFromIndexedDb();
    if (!fromDb) {
      saveStateToIndexedDb(state);
      storageMode = "local";
      renderInstallStatus();
      return;
    }
    const incoming = normalizeState(fromDb);
    if ((incoming.meta?.lastSavedAt || 0) > (state.meta?.lastSavedAt || 0)) {
      replaceState(incoming);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      saveStateToIndexedDb(state);
    }
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
    taskDetails: day?.taskDetails || {},
    socials: day?.socials || [],
    ritual: {
      time: day?.ritual?.time || "",
      journal: day?.ritual?.journal || "",
      completed: Boolean(day?.ritual?.completed)
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

async function loadStateFromIndexedDb() {
  const db = await openAppDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("app", "readonly");
    const store = tx.objectStore("app");
    const request = store.get("state");
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

async function saveStateToIndexedDb(payload) {
  try {
    const db = await openAppDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction("app", "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore("app").put(JSON.parse(JSON.stringify(payload)), "state");
    });
    storageMode = "indexeddb";
    renderInstallStatus();
  } catch {
    storageMode = "local";
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

function onExportData() {
  const payload = JSON.stringify(state, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `cozy-life-quest-backup-${currentDate}.json`;
  link.click();
  URL.revokeObjectURL(url);
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
