import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CourseWarningBanner } from "main/components/Courses/CourseWarningBanner";
import { useBackend, useBackendMutation } from "main/utils/useBackend";
import { vi } from "vitest";

vi.mock("main/utils/useBackend", () => ({
  useBackend: vi.fn(),
  useBackendMutation: vi.fn(),
}));

describe("CourseWarningBanner tests", () => {
  const mutateMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    useBackendMutation.mockReturnValue({
      mutate: mutateMock,
    });
  });

  test("does not show warnings when useBackend returns no data yet", () => {
    useBackend.mockReturnValue({ data: undefined });

    render(<CourseWarningBanner courseId={1} />);

    expect(
      screen.queryByText(/This GitHub Organization is less than 30 days old/i),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText(/default base permission set to/i),
    ).not.toBeInTheDocument();
  });

  test("calls useBackend with correct parameters", () => {
    useBackend.mockReturnValue({
      data: {
        showOrganizationAgeWarning: false,
        showDefaultBasePermissionWarning: false,
      },
    });

    render(<CourseWarningBanner courseId={1} />);

    expect(useBackend).toHaveBeenCalledWith(
      ["/api/courses/warnings/1"],
      {
        method: "GET",
        url: "/api/courses/warnings/1",
      },
      undefined,
      true,
      {
        placeholderData: {},
        staleTime: "static",
      },
    );
  });

  test("calls useBackendMutation with correct parameters", () => {
    useBackend.mockReturnValue({
      data: {
        showOrganizationAgeWarning: false,
        showDefaultBasePermissionWarning: false,
      },
    });

    render(<CourseWarningBanner courseId={1} />);

    expect(useBackendMutation).toHaveBeenCalledWith(expect.any(Function), {}, [
      "/api/courses/warnings/1",
    ]);

    const objectToAxiosParams = useBackendMutation.mock.calls[0][0];

    expect(objectToAxiosParams()).toEqual({
      method: "POST",
      url: "/api/course/warnings/hideBasePermissionWarning/1",
    });
  });

  test("does not show organization age warning when showOrganizationAgeWarning is false", () => {
    useBackend.mockReturnValue({
      data: {
        showOrganizationAgeWarning: false,
        showDefaultBasePermissionWarning: false,
      },
    });

    render(<CourseWarningBanner courseId={1} />);

    expect(
      screen.queryByText(/This GitHub Organization is less than 30 days old/i),
    ).not.toBeInTheDocument();
  });

  test("shows organization age warning when showOrganizationAgeWarning is true", () => {
    useBackend.mockReturnValue({
      data: {
        showOrganizationAgeWarning: true,
        showDefaultBasePermissionWarning: false,
      },
    });

    render(<CourseWarningBanner courseId={1} />);

    expect(
      screen.getByText(/This GitHub Organization is less than 30 days old/i),
    ).toBeInTheDocument();
  });

  test("does not show default base permission warning when showDefaultBasePermissionWarning is false", () => {
    useBackend.mockReturnValue({
      data: {
        showOrganizationAgeWarning: false,
        showDefaultBasePermissionWarning: false,
        defaultBasePermission: "read",
      },
    });

    render(<CourseWarningBanner courseId={1} />);

    expect(
      screen.queryByText(/default base permission set to/i),
    ).not.toBeInTheDocument();
  });

  test("shows default base permission warning when showDefaultBasePermissionWarning is true", () => {
    useBackend.mockReturnValue({
      data: {
        showOrganizationAgeWarning: false,
        showDefaultBasePermissionWarning: true,
        defaultBasePermission: "read",
      },
    });

    render(<CourseWarningBanner courseId={1} />);

    expect(
      screen.getByText(/default base permission set to/i),
    ).toBeInTheDocument();

    expect(screen.getByText(/read/i)).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /hide/i })).toBeInTheDocument();
  });

  test("hide button calls hideBasePermissionWarning mutation and hides warning", async () => {
    const user = userEvent.setup();

    useBackend.mockReturnValue({
      data: {
        showOrganizationAgeWarning: false,
        showDefaultBasePermissionWarning: true,
        defaultBasePermission: "read",
      },
    });

    render(<CourseWarningBanner courseId={1} />);

    expect(
      screen.getByText(/default base permission set to/i),
    ).toBeInTheDocument();

    const hideButton = screen.getByRole("button", { name: /hide/i });
    await user.click(hideButton);

    expect(mutateMock).toHaveBeenCalledTimes(1);

    expect(
      screen.queryByText(/default base permission set to/i),
    ).not.toBeInTheDocument();
  });
});
