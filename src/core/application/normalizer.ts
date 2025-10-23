export const normalizer = (doc: any, ret: any) => {
  delete ret.__v;
  if (ret._id) {
    ret._id = ret._id.toString();
  }
  return ret;
};
