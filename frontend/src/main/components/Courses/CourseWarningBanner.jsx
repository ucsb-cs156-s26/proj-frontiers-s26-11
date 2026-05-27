import { useState } from "react";
import { Alert, Button } from "react-bootstrap";
import { useBackend, useBackendMutation } from "main/utils/useBackend";

export function CourseWarningBanner({ courseId }) {
  const [
    hideDefaultBasePermissionWarning,
    setHideDefaultBasePermissionWarning,
  ] = useState(false);

  const { data: warnings } = useBackend(
    [`/api/courses/warnings/${courseId}`],
    {
      method: "GET",
      url: `/api/courses/warnings/${courseId}`,
    },
    undefined,
    true,
    {
      placeholderData: {
        showOrganizationAgeWarning: false,
        showDefaultBasePermissionWarning: false,
        defaultBasePermission: null,
      },
      staleTime: "static",
    },
  );

  const objectToAxiosParams = () => ({
    method: "POST",
    url: `/api/course/warnings/hideBasePermissionWarning/${courseId}`,
  });

  const hideDefaultBasePermissionWarningMutation = useBackendMutation(
    objectToAxiosParams,
    {},
    [`/api/courses/warnings/${courseId}`],
  );

  const handleHideDefaultBasePermissionWarning = () => {
    setHideDefaultBasePermissionWarning(true);
    hideDefaultBasePermissionWarningMutation.mutate();
  };

  return (
    <>
      {warnings?.showOrganizationAgeWarning && (
        <Alert variant="warning">
          Warning: This GitHub Organization is less than 30 days old. You will
          experience difficulties enrolling more than 50 students in a day.
        </Alert>
      )}

      {warnings?.showDefaultBasePermissionWarning &&
        !hideDefaultBasePermissionWarning && (
          <Alert variant="warning">
            Warning: This GitHub Organization has default base permission set to{" "}
            {warnings.defaultBasePermission}. Members of the organization may be
            able to see private repositories.
            <Button
              variant="outline-dark"
              size="sm"
              className="ms-2"
              onClick={handleHideDefaultBasePermissionWarning}
            >
              Hide
            </Button>
          </Alert>
        )}
    </>
  );
}
