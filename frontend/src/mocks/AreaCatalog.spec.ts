import { api } from "@/core/services/Api";
import { resetMockData } from "./MockApi";
beforeEach(() => {
  localStorage.clear();
  resetMockData();
});
it("lista categorias com nome e descrição", async () => {
  const rows = (await api.get("/areas-of-expertise")).data;
  expect(rows.length).toBeGreaterThan(0);
  expect(rows[0]).toMatchObject({
    name: expect.any(String),
    description: expect.any(String),
  });
});
it("valida, cria, consulta, edita e exclui uma área sem vínculos", async () => {
  await expect(
    api.post("/areas-of-expertise", { name: " ", description: " " }),
  ).rejects.toMatchObject({ response: { status: 422 } });
  const created = (
    await api.post("/areas-of-expertise", {
      name: "Educação",
      description: "Projetos educacionais",
    })
  ).data;
  expect((await api.get(`/areas-of-expertise/${created.id}`)).data.name).toBe(
    "Educação",
  );
  await api.put(`/areas-of-expertise/${created.id}`, {
    name: "Educação inclusiva",
    description: "Acessibilidade na educação",
  });
  expect(
    (await api.get(`/areas-of-expertise/${created.id}`)).data.description,
  ).toBe("Acessibilidade na educação");
  await api.delete(`/areas-of-expertise/${created.id}`);
  await expect(
    api.get(`/areas-of-expertise/${created.id}`),
  ).rejects.toMatchObject({ response: { status: 404 } });
});
it("bloqueia exclusão com candidatos e reflete renomeação em candidatos vinculados", async () => {
  const areas = (await api.get("/areas-of-expertise")).data;
  const design = areas.find(
    (area: { name: string }) => area.name === "Design de produto",
  );
  expect(design).toBeDefined();
  await expect(
    api.delete(`/areas-of-expertise/${design.id}`),
  ).rejects.toMatchObject({ response: { status: 409 } });
  await api.put(`/areas-of-expertise/${design.id}`, {
    name: "Design atualizado",
    description: design.description,
  });
  expect((await api.get("/resumes/ana-pereira")).data).toMatchObject({
    interestArea: "Design atualizado",
    areaOfExpertiseId: design.id,
  });
});
it("preserva Outros no candidato sem criar nem vincular automaticamente uma categoria", async () => {
  const before = (await api.get("/areas-of-expertise")).data;
  const created = (
    await api.post("/resumes", {
      fullName: "Texto livre",
      email: "livre@example.com",
      phone: "",
      professionalSummary: "",
      interestArea: "Área livre",
      areaOfExpertiseId: null,
    })
  ).data;
  expect(created).toMatchObject({
    interestArea: "Área livre",
    areaOfExpertiseId: null,
  });
  expect((await api.get("/areas-of-expertise")).data).toEqual(before);
});
