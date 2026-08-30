import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseFile } from "./import-engine";

const pdfMocks = vi.hoisted(() => ({
  getDocument: vi.fn(),
}));

vi.mock("pdfjs-dist", () => ({
  getDocument: pdfMocks.getDocument,
}));

vi.mock("pdfjs-dist/build/pdf.worker.min.mjs", () => ({}));

describe("PDF import security boundary", () => {
  beforeEach(() => {
    pdfMocks.getDocument.mockReset();
    pdfMocks.getDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: async () => ({
          getTextContent: async () => ({ items: [] }),
        }),
      }),
    });
  });

  it("keeps XFA form rendering disabled on the text-only PDF import path", async () => {
    const file = {
      name: "untrusted.pdf",
      type: "application/pdf",
      arrayBuffer: async () => new Uint8Array([0x25, 0x50, 0x44, 0x46]).buffer,
    } as File;

    await parseFile(file);

    expect(pdfMocks.getDocument).toHaveBeenCalledTimes(1);
    expect(pdfMocks.getDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        enableXfa: false,
      }),
    );
  });
});
