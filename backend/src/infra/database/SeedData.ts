import { AreaOfExpertiseInput } from '../../modules/areas-of-expertise/application/repositories/AreaOfExpertiseRepository';
import { ResumeInput } from '../../modules/resumes/application/repositories/ResumeRepository';
// Fictitious development fixtures. Stable names and emails make seeding repeatable.
export const seedAreas: AreaOfExpertiseInput[] = [
    {
        "name": "Tecnologia da Informação",
        "description": "Desenvolvimento de software, suporte e infraestrutura."
    },
    {
        "name": "Administração",
        "description": "Gestão administrativa e organização de processos."
    },
    {
        "name": "Recursos Humanos",
        "description": "Recrutamento, desenvolvimento e gestão de pessoas."
    },
    {
        "name": "Finanças",
        "description": "Planejamento financeiro e análise de investimentos."
    },
    {
        "name": "Contabilidade",
        "description": "Registros contábeis e acompanhamento fiscal."
    },
    {
        "name": "Marketing",
        "description": "Planejamento de campanhas e pesquisa de mercado."
    },
    {
        "name": "Vendas",
        "description": "Negociação comercial e relacionamento com clientes."
    },
    {
        "name": "Atendimento ao Cliente",
        "description": "Suporte e atendimento aos consumidores."
    },
    {
        "name": "Logística",
        "description": "Gestão de estoques, transporte e distribuição."
    },
    {
        "name": "Engenharia Civil",
        "description": "Planejamento e execução de obras civis."
    },
    {
        "name": "Engenharia de Produção",
        "description": "Otimização de processos e operações industriais."
    },
    {
        "name": "Engenharia Elétrica",
        "description": "Projetos e manutenção de sistemas elétricos."
    },
    {
        "name": "Engenharia Mecânica",
        "description": "Projetos mecânicos e manutenção industrial."
    },
    {
        "name": "Arquitetura e Urbanismo",
        "description": "Projetos arquitetônicos e planejamento urbano."
    },
    {
        "name": "Design",
        "description": "Design gráfico, de produtos e de interfaces."
    },
    {
        "name": "Comunicação e Jornalismo",
        "description": "Produção de conteúdo e comunicação institucional."
    },
    {
        "name": "Direito",
        "description": "Análise jurídica e acompanhamento de processos."
    },
    {
        "name": "Educação",
        "description": "Ensino, formação e apoio pedagógico."
    },
    {
        "name": "Saúde e Enfermagem",
        "description": "Assistência à saúde e cuidados de enfermagem."
    },
    {
        "name": "Psicologia",
        "description": "Estudo do comportamento e promoção da saúde mental."
    },
    {
        "name": "Farmácia",
        "description": "Assistência farmacêutica e controle de medicamentos."
    },
    {
        "name": "Nutrição",
        "description": "Planejamento alimentar e educação nutricional."
    },
    {
        "name": "Meio Ambiente",
        "description": "Gestão ambiental e desenvolvimento sustentável."
    },
    {
        "name": "Segurança do Trabalho",
        "description": "Prevenção de acidentes e gestão de riscos ocupacionais."
    },
    {
        "name": "Hotelaria e Turismo",
        "description": "Hospedagem, eventos e planejamento de viagens."
    },
    {
        "name": "Gastronomia",
        "description": "Produção de alimentos e gestão de serviços gastronômicos."
    },
    {
        "name": "Agronegócio",
        "description": "Produção agropecuária e gestão rural."
    },
    {
        "name": "Pesquisa e Desenvolvimento",
        "description": "Pesquisa aplicada e desenvolvimento de soluções."
    },
    {
        "name": "Artes e Cultura",
        "description": "Produção artística e gestão de projetos culturais."
    },
    {
        "name": "Serviços Gerais",
        "description": "Apoio operacional e conservação de ambientes."
    }
];
const firstNames = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João', 'Karina', 'Lucas', 'Mariana', 'Nicolas', 'Olívia', 'Paulo', 'Rafaela', 'Samuel', 'Tatiana', 'Vinícius'];
const lastNames = ['Almeida', 'Barbosa', 'Carvalho'];
export const seedCandidates: ResumeInput[] = Array.from({ length: 60 }, (_, index) => ({
    fullName: `${firstNames[index % firstNames.length]} ${lastNames[Math.floor(index / firstNames.length)]}`,
    email: `candidato.seed.${String(index + 1).padStart(3, '0')}@example.com`,
    phone: String(11900000000 + index + 1),
    interestArea: seedAreas[index % seedAreas.length].name,
    professionalSummary: 'Cadastro fictício gerado pela seed para desenvolvimento e demonstração.',
}));
