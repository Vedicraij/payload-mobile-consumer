import {CMS_REQUEST_TIMEOUT_MS, CMS_URL} from './config';

export type FormSubmissionEntry = {
  field: string;
  value: boolean | string;
};

export const submitFormSubmission = async (
  form: string,
  submissionData: FormSubmissionEntry[],
) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CMS_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${CMS_URL}/api/form-submissions`, {
      body: JSON.stringify({form, submissionData}),
      headers: {'Content-Type': 'application/json'},
      method: 'POST',
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Form submission failed (${response.status}).`);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Form submission timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};
