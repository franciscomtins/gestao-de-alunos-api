import { readFileSync } from 'node:fs';
import request from 'supertest';
import { expect } from 'chai';
import app from '../src/app.js';
import { loginAdmin, loginAluno } from './helpers/auth.js';

const cenarios = JSON.parse(
  readFileSync(new URL('./data/entrega-trabalho.json', import.meta.url), 'utf8')
);

describe('Fluxo: admin cadastra aluno, aluno loga e registra a entrega de um trabalho', () => {
  let tokenAdmin;

  before(async () => {
    tokenAdmin = await loginAdmin();
  });

  cenarios.forEach(({ cenario, aluno, disciplinaId, trabalho }) => {
    describe(cenario, () => {
      let alunoId;
      let trabalhoId;

      after(async () => {
        if (trabalhoId) {
          await request(app)
            .delete(`/api/admin/trabalhos/${trabalhoId}`)
            .set('Authorization', `Bearer ${tokenAdmin}`);
        }
        if (alunoId) {
          await request(app)
            .delete(`/api/admin/alunos/${alunoId}`)
            .set('Authorization', `Bearer ${tokenAdmin}`);
        }
      });

      it('admin cadastra o aluno e recebe 201 sem expor a senha', async () => {
        const resposta = await request(app)
          .post('/api/admin/alunos')
          .set('Authorization', `Bearer ${tokenAdmin}`)
          .send(aluno);

        expect(resposta.status).to.equal(201);
        expect(resposta.body).to.include({
          nome: aluno.nome,
          email: aluno.email,
          matricula: aluno.matricula,
          role: 'aluno',
        });
        expect(resposta.body).to.have.property('id');
        expect(resposta.body).to.not.have.property('senha');

        alunoId = resposta.body.id;
      });

      it('admin matricula o aluno na disciplina e recebe 201', async () => {
        const resposta = await request(app)
          .post(`/api/admin/disciplinas/${disciplinaId}/matriculas`)
          .set('Authorization', `Bearer ${tokenAdmin}`)
          .send({ alunoId });

        expect(resposta.status).to.equal(201);
        expect(resposta.body).to.include({ alunoId, disciplinaId });
      });

      it('aluno loga com as credenciais cadastradas e registra a entrega do trabalho', async () => {
        const tokenAluno = await loginAluno(aluno);

        const resposta = await request(app)
          .post(`/api/alunos/${alunoId}/trabalhos`)
          .set('Authorization', `Bearer ${tokenAluno}`)
          .send({ disciplinaId, ...trabalho });

        expect(resposta.status).to.equal(201);
        expect(resposta.body).to.include({
          alunoId,
          disciplinaId,
          titulo: trabalho.titulo,
          descricao: trabalho.descricao,
          status: 'entregue',
        });
        expect(resposta.body).to.have.property('id');

        trabalhoId = resposta.body.id;
      });
    });
  });
});
