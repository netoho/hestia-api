import { capitalize } from 'lodash';

export function capitalizeName(name: string) {
  return name ? name.toString().split(' ').map(word => capitalize(word as string)).join(' ') : '';
}
