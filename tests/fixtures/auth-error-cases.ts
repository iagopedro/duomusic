import validationError from './auth-validation-error.json';

export const validationMessage = 'Confira os dados informados e tente novamente.';
export const unexpectedMessage = 'Não foi possível entrar ou criar a conta. Tente novamente.';

interface AuthErrorCase {
  name: string;
  status: number;
  body: object | string | null;
  message: string;
}

export const authErrorCases: AuthErrorCase[] = [
  {
    name: 'FastAPI 422 real',
    status: 422,
    body: validationError,
    message: 'Email: Digite um email válido',
  },
  {
    name: 'credentials',
    status: 401,
    body: { detail: 'Incorrect email or password' },
    message: 'Email ou senha incorretos',
  },
  {
    name: 'duplicate email',
    status: 409,
    body: { detail: 'Email already registered' },
    message: 'Este email já está cadastrado',
  },
  { name: 'forbidden', status: 403, body: {}, message: 'Acesso não permitido para esta conta.' },
  {
    name: 'rate limit',
    status: 429,
    body: {},
    message: 'Muitas tentativas. Aguarde um pouco e tente novamente.',
  },
  {
    name: 'server error',
    status: 500,
    body: { detail: 'internal-private-detail' },
    message: 'O serviço está indisponível no momento. Tente novamente em instantes.',
  },
  {
    name: 'unavailable',
    status: 503,
    body: '<html>Gateway error</html>',
    message: 'O serviço está indisponível no momento. Tente novamente em instantes.',
  },
  {
    name: 'network',
    status: 0,
    body: null,
    message: 'Não foi possível conectar. Verifique sua conexão e tente novamente.',
  },
  {
    name: 'string detail',
    status: 400,
    body: { detail: '  Confira sua conta.  ' },
    message: 'Confira sua conta.',
  },
  {
    name: '422 string detail',
    status: 422,
    body: { detail: 'Confira sua conta.' },
    message: 'Confira sua conta.',
  },
  ...[
    { name: 'object detail', detail: { msg: 'private-detail' } },
    { name: 'empty list', detail: [] },
    { name: 'null detail', detail: null },
    { name: 'empty string', detail: ' ' },
    { name: 'number detail', detail: 42 },
    { name: 'boolean detail', detail: true },
    { name: 'malformed items', detail: [null, 'private-detail', { loc: 'email' }] },
    { name: 'unknown field', detail: [{ loc: ['body', 'unknown'], msg: 'private-detail' }] },
  ].map(({ name, detail }) => ({
    name,
    status: 422,
    body: { detail },
    message: validationMessage,
  })),
  { name: 'missing detail', status: 422, body: {}, message: validationMessage },
  { name: 'null body', status: 400, body: null, message: unexpectedMessage },
  {
    name: 'object on other status',
    status: 400,
    body: { detail: { msg: 'private-detail' } },
    message: unexpectedMessage,
  },
  {
    name: 'multiple fields and duplicate validation errors',
    status: 422,
    body: {
      detail: [
        { loc: ['body', 'email'], type: 'value_error', input: 'private-detail' },
        { loc: ['body', 'email'], type: 'value_error' },
        {
          loc: ['body', 'password'],
          type: 'string_too_short',
          input: 'private-detail',
          ctx: { value: 'private-detail' },
          msg: 'private-detail',
        },
        { loc: ['body', 'displayName'], type: 'string_too_long' },
      ],
    },
    message:
      'Email: Digite um email válido\nSenha: Mínimo de 8 caracteres\nNome de exibição: Máximo de 50 caracteres',
  },
  {
    name: 'required email',
    status: 422,
    body: { detail: [{ loc: ['body', 'email'], type: 'missing' }] },
    message: 'Email: Este campo é obrigatório',
  },
  {
    name: 'long password',
    status: 422,
    body: { detail: [{ loc: ['body', 'password'], type: 'string_too_long' }] },
    message: 'Senha: Máximo de 128 caracteres',
  },
  {
    name: 'unknown validation type',
    status: 422,
    body: { detail: [{ loc: ['body', 'password'], type: 'new_type', msg: 'private-detail' }] },
    message: 'Senha: Confira este campo.',
  },
];
