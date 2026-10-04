import mongoose from 'mongoose';

// Hooks globais: fecha a conexão com o MongoDB uma única vez, após todas as suítes.
export const mochaHooks = {
  async afterAll() {
    await mongoose.connection.close();
  },
};
