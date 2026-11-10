import { Modal } from "@mantine/core";
import { describe, expect, it } from "vitest";
import classes from "@/theme.module.css";
import { renderWithProviders } from "./render";

function expectClass(selector: string, className: string | undefined) {
  expect(className).toBeTruthy();
  expect(document.querySelector(selector)?.classList.contains(className!)).toBe(
    true,
  );
}

function expectEyeLevelClasses() {
  expectClass(".mantine-Modal-inner", classes.modalInner);
  expectClass(".mantine-Modal-content", classes.modalContent);
}

describe("theme", () => {
  it("places Modal at eye level", () => {
    renderWithProviders(
      <Modal opened onClose={() => {}} title="Title">
        Body
      </Modal>,
    );
    expectEyeLevelClasses();
  });

  it("places Modal.Root at eye level", () => {
    renderWithProviders(
      <Modal.Root opened onClose={() => {}}>
        <Modal.Overlay />
        <Modal.Content>Body</Modal.Content>
      </Modal.Root>,
    );
    expectEyeLevelClasses();
  });
});
