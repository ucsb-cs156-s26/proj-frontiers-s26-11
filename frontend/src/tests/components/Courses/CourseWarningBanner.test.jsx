import AxiosMockAdapter from "axios-mock-adapter";
import axios from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { CourseWarningBanner } from "main/components/Courses/CourseWarningBanner";
import * as useBackend from "main/utils/useBackend";
import { vi } from "vitest";

const axiosMock = new AxiosMockAdapter(axios);

describe("CourseWarningBanner tests", () => {
  let queryClient;

  beforeEach(() => {
    axiosMock.reset();
    axiosMock.resetHistory();
    queryClient = new QueryClient();
  });

  test("renders warning banner on warning return", async () => {
    vi.spyOn(useBackend, "useBackend");

    axiosMock
      .onGet("/api/courses/warnings/1")
      .reply(200, { showOrganizationAgeWarning: true });

    axiosMock
      .onGet("/api/github/graphql/defaultbasepermission?courseId=1")
      .reply(200, "None");

    render(
      <QueryClientProvider client={queryClient}>
        <CourseWarningBanner courseId={1} orgName="test-org" />
      </QueryClientProvider>,
    );

    await screen.findByText(/This GitHub Organization/i);

    expect(useBackend.useBackend).toHaveBeenCalledWith(
      [`/api/courses/warnings/1`],
      {
        method: "GET",
        url: `/api/courses/warnings/1`,
      },
      undefined,
      true,
      {
        placeholderData: {
          showOrganizationAgeWarning: false,
        },
        staleTime: "static",
      },
    );

    expect(useBackend.useBackend).toHaveBeenCalledWith(
      [`/api/github/graphql/defaultbasepermission?courseId=1`],
      {
        method: "GET",
        url: `/api/github/graphql/defaultbasepermission?courseId=1`,
      },
      undefined,
      true,
      {
        placeholderData: "None",
        staleTime: "static",
      },
    );
  });

  test("Does not render banner on false", async () => {
    vi.spyOn(useBackend, "useBackend");

    axiosMock.onGet("/api/courses/warnings/1").reply(200, {
      showOrganizationAgeWarning: false,
    });

    axiosMock
      .onGet("/api/github/graphql/defaultbasepermission?courseId=1")
      .reply(200, "None");

    render(
      <QueryClientProvider client={queryClient}>
        <CourseWarningBanner courseId={1} orgName="test-org" />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(useBackend.useBackend).toBeCalled();
    });

    expect(
      screen.queryByText(/This GitHub Organization/i),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText(/Default Base Permission is not/i),
    ).not.toBeInTheDocument();
  });

  test("No misbehavior on empty return", async () => {
    vi.spyOn(useBackend, "useBackend");

    axiosMock.onGet("/api/courses/warnings/1").reply(200, {});

    axiosMock
      .onGet("/api/github/graphql/defaultbasepermission?courseId=1")
      .reply(200, "None");

    render(
      <QueryClientProvider client={queryClient}>
        <CourseWarningBanner courseId={1} orgName="test-org" />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(useBackend.useBackend).toBeCalled();
    });

    expect(
      screen.queryByText(/This GitHub Organization/i),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText(/Default Base Permission is not/i),
    ).not.toBeInTheDocument();
  });

  test("renders default base permissions warning when default base permission is not None", async () => {
    vi.spyOn(useBackend, "useBackend");

    axiosMock.onGet("/api/courses/warnings/1").reply(200, {
      showOrganizationAgeWarning: false,
    });

    axiosMock
      .onGet("/api/github/graphql/defaultbasepermission?courseId=1")
      .reply(200, "Read");

    render(
      <QueryClientProvider client={queryClient}>
        <CourseWarningBanner courseId={1} orgName="test-org" />
      </QueryClientProvider>,
    );

    const alert = await screen.findByRole("alert");

    expect(alert).toHaveTextContent(
      "Warning: the organization setting for Default Base Permission is not the recommended value of None. This means that students in the organization may be able to access other students' private repos. You can change that setting here.",
    );

    const link = screen.getByRole("link", {
      name: /You can change that setting here/i,
    });

    expect(link).toHaveAttribute(
      "href",
      "https://github.com/organizations/test-org/settings/member_privileges",
    );
  });
});
