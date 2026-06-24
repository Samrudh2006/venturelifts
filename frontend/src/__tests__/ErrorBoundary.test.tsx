import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import ErrorBoundary from "../components/ErrorBoundary";

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <BrowserRouter>
        <ErrorBoundary>
          <div>Child content</div>
        </ErrorBoundary>
      </BrowserRouter>
    );
    expect(screen.getByText("Child content")).toBeInTheDocument();
  });
});
