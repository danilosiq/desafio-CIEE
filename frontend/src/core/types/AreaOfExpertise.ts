export type AreaInput = { name: string; description: string };
export type AreaOfExpertise = AreaInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};
