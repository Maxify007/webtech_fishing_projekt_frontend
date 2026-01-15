import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { nextTick } from "vue";

import LeaderboardView from "../../src/views/LeaderboardView.vue";

// Use hoisted mocks so vi.mock factories can access them safely
const hoisted = vi.hoisted(() => ({
  backMock: vi.fn(),
  getLeaderboardMock: vi.fn(),
}));

vi.mock("vue-router", () => ({
  useRouter: () => ({ back: hoisted.backMock }),
}));

// IMPORTANT: LeaderboardView calls getLeaderboard() from "@/services/api"
vi.mock("@/services/api", () => ({
  getLeaderboard: (...args: any[]) => hoisted.getLeaderboardMock(...args),
}));

const stubs = {
  PixelButton: {
    props: ["size", "disabled"],
    template: `<button :disabled="disabled"><slot /></button>`,
  },
  PixelFrame: {
    props: ["scale", "variant"],
    template: `<div class="pixel-frame" :data-variant="variant"><slot /></div>`,
  },
};

function mountView() {
  return mount(LeaderboardView, {
    global: { stubs },
  });
}

beforeEach(() => {
  hoisted.backMock.mockReset();
  hoisted.getLeaderboardMock.mockReset();
  hoisted.getLeaderboardMock.mockResolvedValue([]);
});

describe("LeaderboardView", () => {
  it("calls router.back() when clicking ⬅ Back", async () => {
    const wrapper = mountView();
    await flushPromises();

    const backBtn = wrapper.findAll("button").find((b) => b.text().includes("⬅ Back"));
    expect(backBtn).toBeTruthy();

    await backBtn!.trigger("click");
    expect(hoisted.backMock).toHaveBeenCalledTimes(1);
  });

  it("shows Loading... while getLeaderboard is pending", async () => {
    let resolveLeaderboard!: (value: any) => void;

    hoisted.getLeaderboardMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLeaderboard = resolve;
        })
    );

    const wrapper = mountView();
    await nextTick();

    expect(wrapper.text()).toContain("Loading...");

    resolveLeaderboard([]);
    await flushPromises();

    expect(wrapper.text()).not.toContain("Loading...");
  });

  it("renders an error message when getLeaderboard throws", async () => {
    hoisted.getLeaderboardMock.mockRejectedValue(new Error("boom"));

    const wrapper = mountView();
    await flushPromises();

    const err = wrapper.find("p.error");
    expect(err.exists()).toBe(true);

    // your TS sets this exact message
    expect(err.text()).toBe("Leaderboard konnte nicht geladen werden.");
  });

  it("renders leaderboard entries with rank, name, and fish amount", async () => {
    hoisted.getLeaderboardMock.mockResolvedValue([
      { fisherId: 1, name: "Nina", totalFishAmount: 1234 },
      { fisherId: 2, name: "Robert", totalFishAmount: 50 },
      { fisherId: 3, name: "Priya", totalFishAmount: 99999 },
    ]);

    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.find("section.grid").exists()).toBe(true);

    const ranks = wrapper.findAll(".rank").map((r) => r.text());
    expect(ranks[0]).toBe("#1");
    expect(ranks[1]).toBe("#2");
    expect(ranks[2]).toBe("#3");

    const names = wrapper.findAll(".name").map((n) => n.text());
    expect(names).toContain("Nina");
    expect(names).toContain("Robert");
    expect(names).toContain("Priya");

    const stats = wrapper.findAll(".stat").map((s) => s.text());
    expect(stats[0]).toMatch(/1234|1\D234/); // locale-tolerant
    expect(stats[0]).toContain("Fish");
    expect(stats[1]).toContain("50");
    expect(stats[1]).toContain("Fish");
    expect(stats[2]).toMatch(/99999|99\D999/);
    expect(stats[2]).toContain("Fish");
  });

  it("renders at most 10 entries (top10)", async () => {
    hoisted.getLeaderboardMock.mockResolvedValue(
      Array.from({ length: 20 }, (_, i) => ({
        fisherId: i + 1,
        name: `Fisher${i + 1}`,
        totalFishAmount: 1000 - i,
      }))
    );

    const wrapper = mountView();
    await flushPromises();

    const frames = wrapper.findAll(".pixel-frame");
    expect(frames.length).toBe(10);
    expect(wrapper.text()).toContain("#10");
    expect(wrapper.text()).not.toContain("#11");
  });
});
