export interface IBrokerPublicProfile {
  id: number;
  firstName: string;
  lastName: string;
  secondLastName?: string;
  telephone: string;
  secondTelephone?: string | null;
  avatar: string;
  video?: string | null;
  about: string;
  experience: string;
  education: string;
  email: string;
}

interface IParentUser {
  fullName: string;
  telephone: string;
  secondTelephone?: string | null;
  email: string;
  mailboxEmail: string;
}

interface ILegalSupportTeam {
  fullName: string;
  email: string;
  phone: string;
}

export interface IBroker {
  id: number;
  fullName: string;
  telephone: string;
  secondTelephone?: string | null;
  avatar: string;
  video?: string | null;
  about: string;
  experience: string;
  education: string;
  email: string;
  mailboxEmail: string;
  parentUser: IParentUser;
  legalSupportTeam: ILegalSupportTeam[];
}

export interface IUser {
  id: number;
  fullName: string;
  email: string;
}

export interface IRfc {
  fullName?: string
  rfc: string
  taxRegime: string
  taxStatus: string
  companyName?: string
  postalCode: string
}
