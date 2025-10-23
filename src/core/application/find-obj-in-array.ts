export default <T>(list: T[], key: string, search: string): T =>
  <T>list.find((json: any) => json[key] === search);
