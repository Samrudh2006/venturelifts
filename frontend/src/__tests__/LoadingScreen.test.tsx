import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LoadingScreen from "../components/LoadingScreen";

describe("LoadingScreen", () => {
  it("renders loading spinner and text", () => {
    render(<LoadingScreen />);
    expect(screen.getByText("Loading VentureLift...")).toBeInTheDocument();
  });
});
