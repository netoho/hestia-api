import path from 'path';

import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import { getMetadataArgsStorage } from 'routing-controllers';
import { routingControllersToSpec } from 'routing-controllers-openapi';

// eslint-disable-next-line @typescript-eslint/no-var-requires
// const { defaultMetadataStorage } = require('class-transformer/cjs/storage');

export default () => {
  const controllers = path.join(__dirname, '../../*/infrastructure/controllers/*.controller.{js,ts}');

  const schemas = validationMetadatasToSchemas({
    refPointerPrefix: '#/components/schemas/',
  });

  const storage = getMetadataArgsStorage();
  const spec = routingControllersToSpec(
    storage,
    { controllers: [controllers] },
    {
      info: {
        version: '1.0.0',
        title: 'Finance API',
        description: '',
      },
      components: {
        schemas: schemas as {
          [schema: string]: any;
        },
        securitySchemes: {
          Auth: {
            type: 'apiKey',
            in: 'header',
            name: 'Authorization',
          },
        },
      },
      security: [
        {
          Auth: [],
        },
      ],
    },
  );

  return spec;
};
