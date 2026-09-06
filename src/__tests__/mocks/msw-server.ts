import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const defaultResendHandlers = [
  http.post('https://api.resend.com/emails', () =>
    HttpResponse.json({
      id: 'email_test_default',
      from: 'no-reply@travisgautier.com',
    }),
  ),
];

export const server = setupServer(...defaultResendHandlers);
