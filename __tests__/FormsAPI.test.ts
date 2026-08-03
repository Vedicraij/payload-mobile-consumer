import {submitFormSubmission} from '../src/api/forms';

const fetchMock = jest.fn();

beforeAll(() => {
  globalThis.fetch = fetchMock;
});

beforeEach(() => fetchMock.mockReset());

test('submits the Payload form contract', async () => {
  fetchMock.mockResolvedValue({ok: true, status: 201});

  await submitFormSubmission('contact', [
    {field: 'email', value: 'guest@example.com'},
    {field: 'terms', value: true},
  ]);

  expect(fetchMock).toHaveBeenCalledWith(
    'https://payload-cms-poc-seven.vercel.app/api/form-submissions',
    expect.objectContaining({
      body: JSON.stringify({
        form: 'contact',
        submissionData: [
          {field: 'email', value: 'guest@example.com'},
          {field: 'terms', value: true},
        ],
      }),
      headers: {'Content-Type': 'application/json'},
      method: 'POST',
    }),
  );
});

test('surfaces unsuccessful form responses', async () => {
  fetchMock.mockResolvedValue({ok: false, status: 422});

  await expect(submitFormSubmission('contact', [])).rejects.toThrow('Form submission failed (422).');
});
