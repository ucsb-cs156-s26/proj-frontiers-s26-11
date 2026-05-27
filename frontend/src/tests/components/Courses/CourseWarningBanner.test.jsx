import AxiosMockAdapter from "axios-mock-adapter";
import axios from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CourseWarningBanner } from "main/components/Courses/CourseWarningBanner";

describe("CourseWarningBanner tests", () => {
  let axiosMock;
  let queryClient;

  beforeEach(() => {
    axiosMock = new AxiosMockAdapter(axios);
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  afterEach(() => {
    axiosMock.restore();
  });

  const renderComponent = (courseId = 1) => {
    render(
      <QueryClientProvider client={queryClient}>
        <CourseWarningBanner courseId={courseId} />
      </QueryClientProvider>,
    );
  };

  test("does not show organization age warning when showOrganizationAgeWarning is false", async () => {
    axiosMock.onGet("/api/courses/warnings/1").reply(200, {
      showOrganizationAgeWarning: false,
      showDefaultBasePermissionWarning: false,
      defaultBasePermission: null,
    });

    renderComponent();

    await waitFor(() => {
      expect(
        screen.queryByText(
          /This GitHub Organization is less than 30 days old/i,
        ),
      ).not.toBeInTheDocument();
    });
  });

  test("shows organization age warning when showOrganizationAgeWarning is true", async () => {
    axiosMock.onGet("/api/courses/warnings/1").reply(200, {
      showOrganizationAgeWarning: true,
      showDefaultBasePermissionWarning: false,
      defaultBasePermission: null,
    });

    renderComponent();

    expect(
      await screen.findByText(
        /This GitHub Organization is less than 30 days old/i,
      ),
    ).toBeInTheDocument();
  });

  test("does not show default base permission warning when showDefaultBasePermissionWarning is false", async () => {
    axiosMock.onGet("/api/courses/warnings/1").reply(200, {
      showOrganizationAgeWarning: false,
      showDefaultBasePermissionWarning: false,
      defaultBasePermission: "read",
    });

    renderComponent();

    await waitFor(() => {
      expect(
        screen.queryByText(/default base permission set to/i),
      ).not.toBeInTheDocument();
    });
  });

  test("shows default base permission warning when showDefaultBasePermissionWarning is true", async () => {
    axiosMock.onGet("/api/courses/warnings/1").reply(200, {
      showOrganizationAgeWarning: false,
      showDefaultBasePermissionWarning: true,
      defaultBasePermission: "read",
    });

    renderComponent();

    expect(
      await screen.findByText(/default base permission set to/i),
    ).toBeInTheDocument();

    expect(screen.getByText(/read/i)).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /hide/i }),
    ).toBeInTheDocument();
  });

  test("hide button calls hideBasePermissionWarning endpoint and hides warning", async () => {
    const user = userEvent.setup();

    axiosMock.onGet("/api/courses/warnings/1").replyOnce(200, {
      showOrganizationAgeWarning: false,
      showDefaultBasePermissionWarning: true,
      defaultBasePermission: "read",
    });

    axiosMock
      .onPost("/api/course/warnings/hideBasePermissionWarning/1")
      .reply(200, {
        hideBasePermissionWarning: true,
      });

    axiosMock.onGet("/api/courses/warnings/1").reply(200, {
      showOrganizationAgeWarning: false,
      showDefaultBasePermissionWarning: false,
      defaultBasePermission: "read",
    });

    renderComponent();

    expect(
      await screen.findByText(/default base permission set to/i),
    ).toBeInTheDocument();

    const hideButton = screen.getByRole("button", { name: /hide/i });
    await user.click(hideButton);

    await waitFor(() => {
      expect(axiosMock.history.post.length).toBe(1);
    });

    expect(axiosMock.history.post[0].url).toBe(
      "/api/course/warnings/hideBasePermissionWarning/1",
    );

    await waitFor(() => {
      expect(
        screen.queryByText(/default base permission set to/i),
      ).not.toBeInTheDocument();
    });
  });
});