import { customAlphabet } from 'nanoid';
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
export const customNanoid = customAlphabet(alphabet, 16);

/*
 * Prefixed id's such as bl_1jEserS are easier to read
 * and they make the client side linkage possible.
 * Using client side ids you can save round trips to the database
 * by inserting all elements at once.
 * In production, the id's length should be such according to the concurrency
 * of the table
*/
export const createPrefixedId = (prefix: string): string => `${prefix}_${customNanoid()}`;
