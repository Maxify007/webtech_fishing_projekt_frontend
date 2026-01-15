import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { nextTick } from "vue";

import GameView from "../../src/views/GameView.vue";

// --------------------
// Mocks & Test Setup
// --------------------

type UpgradeType =
  | "CLICK_FLAT"
  | "CLICK_LUCK_RATE"
  | "CLICK_LUCK_MULTIPLIER"
  | "CLICK_MASTERY_MULTIPLIER"
  | "PASSIVE_FISH_RATE"
  | "PASSIVE_FISH_AMOUNT";

type Fisher = {
  fisherId: number;
  name: string;
  fishAmount: number;
  fishProgress?: number;
  upgradeLevels?: Partial<Record<UpgradeType, number>>;
  passiveFishSpeedMultiplier?: number | null;
  lastPassiveTickMillis?: number | null;
};

let pushMock: ReturnType<typeof vi.fn>;

let storeMock: {
  activeFisher: Fisher | null;
  error: string | null;
  loadFisher: ReturnType<typeof vi.fn>;
  click: ReturnType<typeof vi.fn>;
  buyUpgrade: ReturnType<typeof vi.fn>;
  passiveTick: ReturnType<typeof vi.fn>;
};

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: pushMock }),
}));

// If your store path differs, change it here.
vi.mock("@/stores/fisherStore", () => ({
  useFisherStore: () => storeMock,
}));

const stubs = {
  PixelButton: {
    props: ["size", "disabled"],
    template: `<button :disabled="disabled"><slot /></button>`,
  },
  PixelBar: {
    props: ["value", "width", "height", "fillAlpha", "fillRgb", "inset"],
    template: `<div class="pixelbar" :data-value="value"></div>`,
  },
};

function mountView(props: { fisherId: number } = { fisherId: 1 }) {
  return mount(GameView, {
    props,
    global: { stubs },
  });
}

beforeEach(() => {
  pushMock = vi.fn();

  storeMock = {
    activeFisher: null,
    error: null,
    loadFisher: vi.fn().mockResolvedValue(undefined),
    click: vi.fn(),
    buyUpgrade: vi.fn().mockResolvedValue(undefined),
    passiveTick: vi.fn().mockResolvedValue(undefined),
  };

  vi.clearAllMocks();
});

afterEach(() => {
  // If a test enabled fake timers, always restore.
  vi.useRealTimers();
});

describe("GameView", () => {
  it("shows 'Loading Fisher...' while loadFisher is pending, then calls loadFisher(fisherId)", async () => {
    // Make loadFisher pending so loading state is visible deterministically
    let resolveLoad!: () => void;
    storeMock.loadFisher = vi.fn(
      () => new Promise<void>((resolve) => (resolveLoad = resolve))
    );

    const wrapper = mountView({ fisherId: 42 });

    await nextTick();
    expect(wrapper.text()).toContain("Loading Fisher...");

    resolveLoad();
    await flushPromises();

    expect(storeMock.loadFisher).toHaveBeenCalledTimes(1);
    expect(storeMock.loadFisher).toHaveBeenCalledWith(42);
  });

  it("shows 'Failed to load Fisher.' when loading finished and fisher is null", async () => {
    const wrapper = mountView({ fisherId: 1 });

    await flushPromises();
    expect(wrapper.text()).toContain("Failed to load Fisher.");
  });

  it("renders fisher name and fish amount when fisher exists", async () => {
    storeMock.activeFisher = {
      fisherId: 1,
      name: "Nina",
      fishAmount: 12,
      fishProgress: 3,
    };

    const wrapper = mountView({ fisherId: 1 });
    await flushPromises();

    expect(wrapper.find("h1.title").text()).toBe("Nina");
    expect(wrapper.text()).toContain("Fish:");
    expect(wrapper.text()).toContain("12");
  });

  it("clicking 🎣 Fish! calls store.click()", async () => {
    storeMock.activeFisher = {
      fisherId: 1,
      name: "Nina",
      fishAmount: 12,
      fishProgress: 0,
    };

    const wrapper = mountView({ fisherId: 1 });
    await flushPromises();

    const fishBtn = wrapper.findAll("button").find((b) => b.text().includes("🎣 Fish!"));
    expect(fishBtn).toBeTruthy();

    await fishBtn!.trigger("click");
    expect(storeMock.click).toHaveBeenCalledTimes(1);
  });

  it("navigation buttons route correctly (Back, Leaderboard, Stats)", async () => {
    storeMock.activeFisher = {
      fisherId: 77,
      name: "Priya",
      fishAmount: 1,
      fishProgress: 0,
    };

    const wrapper = mountView({ fisherId: 77 });
    await flushPromises();

    const buttons = wrapper.findAll("button");

    const backBtn = buttons.find((b) => b.text().includes("⬅ Back"));
    const lbBtn = buttons.find((b) => b.text().includes("🏆 Leaderboard"));
    const statsBtn = buttons.find((b) => b.text().includes("Stats"));

    expect(backBtn).toBeTruthy();
    expect(lbBtn).toBeTruthy();
    expect(statsBtn).toBeTruthy();

    await backBtn!.trigger("click");
    expect(pushMock).toHaveBeenCalledWith("/");

    await lbBtn!.trigger("click");
    expect(pushMock).toHaveBeenCalledWith("/leaderboard");

    await statsBtn!.trigger("click");
    expect(pushMock).toHaveBeenCalledWith("/stats/77");
  });

  it("manual progress text + progressPercent are correct (fishProgress/10)", async () => {
    storeMock.activeFisher = {
      fisherId: 1,
      name: "Nina",
      fishAmount: 0,
      fishProgress: 5,
    };

    const wrapper = mountView({ fisherId: 1 });
    await flushPromises();

    // Text: "Progress: X/10"
    expect(wrapper.text()).toContain("Progress: 5/10");

    // First PixelBar is manual progress bar in template
    const bars = wrapper.findAll(".pixelbar");
    expect(bars.length).toBeGreaterThanOrEqual(2);

    // 5/10 => 50
    expect(Number(bars[0].attributes("data-value"))).toBe(50);
  });

  it("renders 6 upgrade buttons and disables them if fishAmount < cost", async () => {
    // costOf at level 1 => Math.round(1.15^1 * 10) = Math.round(11.5) = 12
    storeMock.activeFisher = {
      fisherId: 1,
      name: "Nina",
      fishAmount: 0, // should be < cost => disabled
      fishProgress: 0,
      upgradeLevels: {}, // all default level 1
    };

    const wrapper = mountView({ fisherId: 1 });
    await flushPromises();

    expect(wrapper.text()).toContain("Upgrades");

    // We can identify upgrade buttons by "Fish" text in their labels "(Lv ...) ... Fish"
    const upgradeBtns = wrapper
      .findAll("button")
      .filter((b) => b.text().includes("Fish") && b.text().includes("(Lv"));

    expect(upgradeBtns.length).toBe(6);
    for (const b of upgradeBtns) {
      expect(b.attributes("disabled")).toBeDefined();
    }
  });

  it("clicking an enabled upgrade calls store.buyUpgrade(type)", async () => {
    // Set fishAmount high so all upgrades are enabled
    storeMock.activeFisher = {
      fisherId: 1,
      name: "Nina",
      fishAmount: 999,
      fishProgress: 0,
      upgradeLevels: {},
    };

    const wrapper = mountView({ fisherId: 1 });
    await flushPromises();

    const upgradeBtns = wrapper
      .findAll("button")
      .filter((b) => b.text().includes("Fish") && b.text().includes("(Lv"));

    expect(upgradeBtns.length).toBe(6);

    await upgradeBtns[0].trigger("click");
    expect(storeMock.buyUpgrade).toHaveBeenCalledTimes(1);

    // We don’t hardcode which type is first here (keeps test stable),
    // but we DO ensure it’s called with a valid upgrade type string.
    const arg = storeMock.buyUpgrade.mock.calls[0][0] as string;
    expect(
      [
        "CLICK_FLAT",
        "CLICK_LUCK_RATE",
        "CLICK_LUCK_MULTIPLIER",
        "CLICK_MASTERY_MULTIPLIER",
        "PASSIVE_FISH_RATE",
        "PASSIVE_FISH_AMOUNT",
      ].includes(arg)
    ).toBe(true);
  });

  it("auto-fish countdown shows '–' when passive data missing, otherwise shows seconds", async () => {
    // Missing passive data => dash
    storeMock.activeFisher = {
      fisherId: 1,
      name: "Nina",
      fishAmount: 0,
      fishProgress: 0,
      passiveFishSpeedMultiplier: null,
      lastPassiveTickMillis: null,
    };

    const wrapper = mountView({ fisherId: 1 });
    await flushPromises();

    // "Next auto fish in: –" part
    expect(wrapper.text()).toContain("Next auto fish in:");
    expect(wrapper.text()).toContain("–");

    // With passive data => should show something like "Xs"
    // We use fake timers + fixed system time so output is deterministic
    vi.useFakeTimers();
    vi.setSystemTime(10_000);

    storeMock.activeFisher = {
      fisherId: 1,
      name: "Nina",
      fishAmount: 0,
      fishProgress: 0,
      passiveFishSpeedMultiplier: 5_000, // 5s
      lastPassiveTickMillis: 8_000, // last tick at t=8s, now t=10s => remaining ~3s
    };

    const wrapper2 = mountView({ fisherId: 1 });
    await flushPromises();

    // Advance one interval tick (timer runs every 1s)
    await vi.advanceTimersByTimeAsync(1_000);
    await nextTick();

    // It should show seconds like "3s" or "4s" depending on rounding;
    // We just assert it has "...s" and not dash.
    expect(wrapper2.text()).toContain("Next auto fish in:");
    expect(wrapper2.text()).toMatch(/Next auto fish in:\s*\d+s/);
  });

  it("calls store.passiveTick() when enough time elapsed for a passive tick", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(10_000);

    // elapsed >= tickDuration => should passiveTick on interval
    storeMock.activeFisher = {
      fisherId: 1,
      name: "Nina",
      fishAmount: 0,
      fishProgress: 0,
      passiveFishSpeedMultiplier: 2_000, // 2s per tick
      lastPassiveTickMillis: 7_000, // elapsed 3s at t=10s => should tick
    };

    const wrapper = mountView({ fisherId: 1 });
    await flushPromises();

    // Let the internal setInterval run at least once
    await vi.advanceTimersByTimeAsync(1_000);
    await nextTick();

    expect(storeMock.passiveTick).toHaveBeenCalledTimes(1);

    // Avoid wrapper cleanup issues with timers
    wrapper.unmount();
  });

  it("shows store.error at the bottom when present", async () => {
    storeMock.activeFisher = {
      fisherId: 1,
      name: "Nina",
      fishAmount: 0,
      fishProgress: 0,
    };
    storeMock.error = "Something went wrong";

    const wrapper = mountView({ fisherId: 1 });
    await flushPromises();

    const err = wrapper.find("p.error");
    expect(err.exists()).toBe(true);
    expect(err.text()).toBe("Something went wrong");
  });
});
