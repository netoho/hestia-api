const parseJsonOrNull = (json: string): Record<string, any> | null => {
  try {
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
};

export default parseJsonOrNull;
