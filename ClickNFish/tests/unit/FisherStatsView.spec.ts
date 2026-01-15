import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { nextTick } from "vue";

import FisherStatsView from "../../src/views/FisherStatsView.vue";

type Fisher = {
  fisherId: number;
  name: string;
  totalFishAmount: number;
  fishAmount: number;
  baseFishPull: number;
  luckRate?: number | null;
  luckMultiplier: number;
  masteryMultiplier: number;
  passiveFishSpeedMultiplier: number;
  passiveFishPerPull?: number | null;
};

let pushMock: ReturnType<typeof vi.fn>;
let backMock: ReturnType<typeof vi.fn>;
let routeMock: { params: { fisherId: string | number } };

let storeMock: {
  activeFisher: Fisher | null;
  error: string | null;
  loadFisher: ReturnType<typeof vi.fn>;
};

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: pushMock, back: backMock }),
  useRoute: () => routeMock,
}));

vi.mock("@/stores/fisherStore", () => ({
  useFisherStore: () => storeMock,
}));

const stubs = {
  PixelButton: {
    props: ["size", "disabled"],
    template: `<button :disabled="disabled"><slot /></button>`,
  },
};

function mountView() {
  return mount(FisherStatsView, {
    global: { stubs },
  });
}

beforeEach(() => {
  pushMock = vi.fn();
  backMock = vi.fn();
  routeMock = { params: { fisherId: "1" } };

  storeMock = {
    activeFisher: null,
    error: null,
    loadFisher: vi.fn().mockResolvedValue(undefined),
  };

  vi.clearAllMocks();
});

describe("FisherStatsView", () => {
  it("shows loading while loadFisher is pending, then calls loadFisher(fisherId)", async () => {
    routeMock.params.fisherId = "42";

    // Make loadFisher pending so loading state is visible deterministically
    let resolveLoad!: () => void;
    storeMock.loadFisher = vi.fn(
      () => new Promise<void>((resolve) => (resolveLoad = resolve))
    );

    const wrapper = mountView();

    // Allow onMounted() to start
    await nextTick();

    // NOW loading text should be present
    expect(wrapper.text()).toContain("Loading stats…");

    // Finish loading
    resolveLoad();
    await flushPromises();

    expect(storeMock.loadFisher).toHaveBeenCalledTimes(1);
    expect(storeMock.loadFisher).toHaveBeenCalledWith(42);
  });

  it("shows 'Failed to load Fisher.' when loading finished and fisher is null", async () => {
    const wrapper = mountView();

    await flushPromises(); // wait for onMounted async to finish

    expect(storeMock.loadFisher).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain("Failed to load Fisher.");
  });

  it("renders fisher name and all stats when fisher exists", async () => {
    routeMock.params.fisherId = 7;

    storeMock.activeFisher = {
      fisherId: 7,
      name: "Nina",
      totalFishAmount: 123,
      fishAmount: 5,
      baseFishPull: 2,
      luckRate: 10,
      luckMultiplier: 1.5,
      masteryMultiplier: 2,
      passiveFishSpeedMultiplier: 450,
      passiveFishPerPull: 3,
    };

    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.find("h1.title").text()).toBe("Nina — Stats");

    const text = wrapper.text();
    expect(text).toContain("Total Fish:");
    expect(text).toContain("123");
    expect(text).toContain("Fish (current):");
    expect(text).toContain("5");
    expect(text).toContain("Base Pull:");
    expect(text).toContain("2");
    expect(text).toContain("Luck Rate:");
    expect(text).toContain("10%");
    expect(text).toContain("Luck Multiplier:");
    expect(text).toContain("x1.50");
    expect(text).toContain("Mastery Multiplier:");
    expect(text).toContain("x2.00");
    expect(text).toContain("Passive Delay:");
    expect(text).toContain("450 ms");
    expect(text).toContain("Passive Fish/Tick:");
    expect(text).toContain("3");
  });

  it("falls back to 0 for optional values (luckRate/passiveFishPerPull) and fmt() fallback", async () => {
    storeMock.activeFisher = {
      fisherId: 1,
      name: "Rob",
      totalFishAmount: 0,
      fishAmount: 0,
      baseFishPull: 1,
      luckRate: null,
      luckMultiplier: Number.NaN,
      masteryMultiplier: Infinity,
      passiveFishSpeedMultiplier: 1000,
      passiveFishPerPull: null,
    };

    const wrapper = mountView();
    await flushPromises();

    const text = wrapper.text();

    expect(text).toContain("Luck Rate:");
    expect(text).toContain("0%");

    expect(text).toContain("Luck Multiplier:");
    expect(text).toContain("x0.00");

    expect(text).toContain("Mastery Multiplier:");
    expect(text).toContain("x0.00");

    expect(text).toContain("Passive Delay:");
    expect(text).toContain("1000 ms");

    expect(text).toContain("Passive Fish/Tick:");
    expect(text).toContain("0");
  });

  it("shows store.error when fisher exists", async () => {
    storeMock.activeFisher = {
      fisherId: 1,
      name: "Priya",
      totalFishAmount: 1,
      fishAmount: 1,
      baseFishPull: 1,
      luckRate: 0,
      luckMultiplier: 1,
      masteryMultiplier: 1,
      passiveFishSpeedMultiplier: 100,
      passiveFishPerPull: 1,
    };
    storeMock.error = "Backend says nope";

    const wrapper = mountView();
    await flushPromises();

    const err = wrapper.find("p.error");
    expect(err.exists()).toBe(true);
    expect(err.text()).toBe("Backend says nope");
  });

  it("Back button calls router.back() and Home button routes to '/'", async () => {
    storeMock.activeFisher = {
      fisherId: 1,
      name: "A",
      totalFishAmount: 0,
      fishAmount: 0,
      baseFishPull: 0,
      luckRate: 0,
      luckMultiplier: 1,
      masteryMultiplier: 1,
      passiveFishSpeedMultiplier: 0,
      passiveFishPerPull: 0,
    };

    const wrapper = mountView();
    await flushPromises();

    const buttons = wrapper.findAll("button");
    const backBtn = buttons.find((b) => b.text().includes("⬅ Back"));
    const homeBtn = buttons.find((b) => b.text().includes("🏠 Home"));

    expect(backBtn).toBeTruthy();
    expect(homeBtn).toBeTruthy();

    await backBtn!.trigger("click");
    expect(backMock).toHaveBeenCalledTimes(1);

    await homeBtn!.trigger("click");
    expect(pushMock).toHaveBeenCalledWith("/");
  });
});
