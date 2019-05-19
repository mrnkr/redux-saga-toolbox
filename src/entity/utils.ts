import { IdSelector } from './models';

export function selectIdValue<T>(entity: T, selectId: IdSelector<T>) {
  const key = selectId(entity);

  if (key === undefined) {
    throw Error(
      `The entity passed to the \`selectId\` implementation returned undefined.\n
      You should probably provide your own \`selectId\` implementation.\n
      The entity that was passed:\n
      ${entity}\n
      The \`selectId\` implementation:
      ${selectId.toString()}`,
    );
  }

  return key;
}
