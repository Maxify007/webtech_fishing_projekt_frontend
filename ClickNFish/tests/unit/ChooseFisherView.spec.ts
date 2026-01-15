import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { nextTick } from "vue";

import ChooseFisherView from "../../src/views/ChooseFisherView.vue";

type Fisher = { fisherId: number; name: string; fishAmount: number };

let pushMock: ReturnType<typeof vi.fn>;
let storeMock: {
  fishers: Fisher[];
  loading: boolean;
  error: string | null;
  loadFishers: ReturnType<typeof vi.fn>;
  createFisher: ReturnType<typeof vi.fn>;
  deleteFisher: ReturnType<typeof vi.fn>;
};

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/stores/fisherStore", () => ({
  useFisherStore: () => storeMock,
}));

const stubs = {
  PixelButton: {
    props: ["size", "disabled"],
    template: `<button :disabled="disabled"><slot /></button>`,
  },
  PixelFrame: {
    props: ["scale"],
    template: `<div class="pixel-frame"><slot /></div>`,
  },
  Board: {
    props: ["title", "scale"],
    template: `<div class="board">{{ title }}</div>`,
  },
};

function mountView() {
  return mount(ChooseFisherView, {
    global: { stubs },
  });
}

beforeEach(() => {
  pushMock = vi.fn();

  storeMock = {
    fishers: [],
    loading: false,
    error: null,
    loadFishers: vi.fn(),
    createFisher: vi.fn().mockResolvedValue(undefined),
    deleteFisher: vi.fn().mockResolvedValue(undefined),
  };

  vi.clearAllMocks();
});

describe("ChooseFisherView", () => {
  it("calls store.loadFishers() on mount", () => {
    mountView();
    expect(storeMock.loadFishers).toHaveBeenCalledTimes(1);
  });

  it("renders fishers (name + fish amount)", () => {
    storeMock.fishers = [
      { fisherId: 1, name: "Nina", fishAmount: 10 },
      { fisherId: 2, name: "Robert", fishAmount: 5 },
    ];

    const wrapper = mountView();

    const names = wrapper.findAll(".name").map((n) => n.text());
    const fishTexts = wrapper.findAll(".fish").map((f) => f.text());

    expect(names).toContain("Nina");
    expect(names).toContain("Robert");
    expect(fishTexts).toContain("Fish: 10");
    expect(fishTexts).toContain("Fish: 5");
  });

  it("clicking ▶ Play routes to /game/:fisherId", async () => {
    storeMock.fishers = [{ fisherId: 7, name: "Priya", fishAmount: 99 }];

    const wrapper = mountView();

    const playBtn = wrapper.findAll("button").find((b) => b.text().includes("▶ Play"));
    expect(playBtn).toBeTruthy();

    await playBtn!.trigger("click");
    expect(pushMock).toHaveBeenCalledWith("/game/7");
  });

  it("clicking 🗑 Delete calls store.deleteFisher(fisherId)", async () => {
    storeMock.fishers = [{ fisherId: 3, name: "DeleteMe", fishAmount: 1 }];

    const wrapper = mountView();

    const deleteBtn = wrapper.findAll("button").find((b) => b.text().includes("🗑 Delete"));
    expect(deleteBtn).toBeTruthy();

    await deleteBtn!.trigger("click");
    expect(storeMock.deleteFisher).toHaveBeenCalledTimes(1);
    expect(storeMock.deleteFisher).toHaveBeenCalledWith(3);
  });

  it("shows Create Fisher slot if fishers < 4, hides it at 4", () => {
    storeMock.fishers = [
      { fisherId: 1, name: "A", fishAmount: 0 },
      { fisherId: 2, name: "B", fishAmount: 0 },
      { fisherId: 3, name: "C", fishAmount: 0 },
    ];
    let wrapper = mountView();
    expect(wrapper.text()).toContain("Create Fisher");

    storeMock.fishers = [
      { fisherId: 1, name: "A", fishAmount: 0 },
      { fisherId: 2, name: "B", fishAmount: 0 },
      { fisherId: 3, name: "C", fishAmount: 0 },
      { fisherId: 4, name: "D", fishAmount: 0 },
    ];
    wrapper = mountView();
    expect(wrapper.text()).not.toContain("Create Fisher");
  });

  it("Create button disabled when name is empty/whitespace, enabled for <=10 chars", async () => {
    storeMock.fishers = []; // ensure create slot exists
    const wrapper = mountView();
    await nextTick();

    const input = wrapper.find("input.input");
    expect(input.exists()).toBe(true);

    const createBtn = wrapper.findAll("button").find((b) => b.text().includes("Create"))!;
    expect(createBtn).toBeTruthy();

    // empty -> disabled
    expect(createBtn.attributes("disabled")).toBeDefined();

    // whitespace -> disabled
    await input.setValue("   ");
    await nextTick();
    expect(createBtn.attributes("disabled")).toBeDefined();

    // 10 chars -> enabled
    await input.setValue("1234567890");
    await nextTick();
    expect(createBtn.attributes("disabled")).toBeUndefined();
  });

  it("Create button is disabled when trimmed name length > 10", async () => {
    storeMock.fishers = [];
    const wrapper = mountView();
    await nextTick();

    const input = wrapper.find("input.input");
    expect(input.exists()).toBe(true);

    const createBtn = wrapper.findAll("button").find((b) => b.text().includes("Create"))!;
    expect(createBtn).toBeTruthy();

    // 11 chars -> disabled by :disabled condition
    await input.setValue("12345678901");
    await nextTick();
    expect(createBtn.attributes("disabled")).toBeDefined();
  });

  it("createFisher calls store.createFisher with trimmed name and clears input (<=10 chars)", async () => {
    storeMock.fishers = [];
    const wrapper = mountView();
    await nextTick();

    const input = wrapper.find("input.input");
    expect(input.exists()).toBe(true);

    await input.setValue("  Alice  "); // <= 10 after trim

    const createBtn = wrapper.findAll("button").find((b) => b.text().includes("Create"))!;
    expect(createBtn.attributes("disabled")).toBeUndefined();

    await createBtn.trigger("click");
    await flushPromises();

    expect(storeMock.createFisher).toHaveBeenCalledTimes(1);
    expect(storeMock.createFisher).toHaveBeenCalledWith("Alice");
    expect((input.element as HTMLInputElement).value).toBe("");
  });


  it("while creating, input is disabled and button shows 'Creating...'", async () => {
    storeMock.fishers = [];

    let resolveCreate!: () => void;
    storeMock.createFisher = vi.fn(
      () => new Promise<void>((resolve) => (resolveCreate = resolve))
    );

    const wrapper = mountView();
    await nextTick();

    const input = wrapper.find("input.input");
    expect(input.exists()).toBe(true);

    await input.setValue("Bob");

    const createBtn = wrapper.findAll("button").find((b) => b.text().includes("Create"))!;
    await createBtn.trigger("click");
    await nextTick();

    expect(input.attributes("disabled")).toBeDefined();
    expect(wrapper.text()).toContain("Creating...");

    resolveCreate();
    await flushPromises();

    expect(input.attributes("disabled")).toBeUndefined();
    expect(wrapper.text()).toContain("Create");
  });
});
