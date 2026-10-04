import request from 'supertest';
import app from '../../src/app.js';

async function login(email, senha) {
  const resposta = await request(app).post('/api/auth/login').send({ email, senha });

  if (resposta.status !== 200) {
    throw new Error(`Falha no login de "${email}": ${resposta.status} ${JSON.stringify(resposta.body)}`);
  }

  return resposta.body;
}

export async function loginAdmin() {
  const { ADMIN_EMAIL, ADMIN_SENHA } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_SENHA) {
    throw new Error('Defina ADMIN_EMAIL e ADMIN_SENHA no arquivo .env (veja .env.example).');
  }

  const { token } = await login(ADMIN_EMAIL, ADMIN_SENHA);
  return token;
}

export async function loginAluno({ email, senha }) {
  const { token } = await login(email, senha);
  return token;
}
