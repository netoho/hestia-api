import { SoftDeleteInterface } from 'mongoose-delete';

const indexFields: Array<keyof SoftDeleteInterface> = [
  'deleted',
];

export const pluginConfig = {
  deletedAt: true,
  overrideMethods: true,
  indexFields,
};
