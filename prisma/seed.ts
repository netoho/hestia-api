import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const packagesData = [
  {
    id: 'basic',
    name: 'Protección Libertad',
    price: 3800,
    percentage: null,  // Flat fee, no percentage
    minAmount: null,   // No minimum since it's a flat fee
    shortDescription: null,  // Not needed for flat fee
    description: 'Servicios esenciales de investigación para la fiabilidad en tu arrendamiento.',
    features: {
      'INVESTIGACIÓN': [
        'Estudio Socio - Económico',
        'Análisis de Buró de Crédito',
        'Investigación Judicial',
        'Análisis de Garantía'
      ],
      'CONTRATO DE ARRENDAMIENTO': [
        'Redacción y entrega de contrato',
        'Elaboración de documentos de garantía',
        'Asistencia a Firma Virtual'
      ]
    },
    ctaText: 'Comenzar',
    ctaLink: '/register?package=basic',
    highlight: false
  },
  {
    id: 'standard',
    name: 'Protección Esencial',
    price: 4100,
    percentage: 40,
    minAmount: 4100,
    shortDescription: null,
    description: 'Servicios esenciales de investigación para la fiabilidad en tu arrendamiento.',
    features: {
      'INVESTIGACIÓN': [
        'Estudio Socio - Económico',
        'Análisis de Buró de Crédito',
        'Investigación Judicial',
        'Análisis de Garantía'
      ],
      'CONTRATO DE ARRENDAMIENTO': [
        'Redacción y entrega de contrato',
        'Elaboración de documentos de garantía',
        'Asistencia a Firma Virtual'
      ],
      'GESTIÓN DE INCIDENCIAS': [
        'Mediación entre las partes',
        'Asesoría legal',
        'Representación Legal en Juicio Civil'
      ]
    },
    ctaText: 'Elegir Esencial',
    ctaLink: '/register?package=standard',
    highlight: false
  },
  {
    id: 'premium',
    name: 'Protección Premium',
    price: 5500,
    percentage: 50,
    minAmount: 5500,
    shortDescription: null,
    description: 'Servicios esenciales de investigación para la fiabilidad en tu arrendamiento.',
    features: {
      'INVESTIGACIÓN': [
        'Estudio Socio - Económico',
        'Análisis de Buró de Crédito',
        'Investigación Judicial',
        'Análisis de Garantía'
      ],
      'CONTRATO DE ARRENDAMIENTO': [
        'Redacción y entrega de contrato',
        'Elaboración de documentos de garantía',
        'Asistencia de abogado a Firma'
      ],
      'GESTIÓN DE INCIDENCIAS': [
        'Mediación entre las partes',
        'Asesoría legal',
        'Representación Legal en Juicio Civil',
        'Representación Legal en Juicio Mercantil',
        'Desocupación y entrega de inmueble',
        'Juicio de extinción de dominio'
      ]
    },
    ctaText: 'Optar por Premium',
    ctaLink: '/register?package=premium',
    highlight: false
  },
];

async function main() {
  console.log('Start seeding...');

  // Seed Admin User with hashed password
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminEmail = 'admin@hestiaplp.com.mx';
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Super Admin',
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  });
  console.log(`Created/found admin user: ${adminUser.name} with email ${adminUser.email}`);

  // Seed additional test users
  const testUsers = [
    {
      email: 'broker@hestiaplp.com.mx',
      name: 'John Broker',
      password: hashedPassword,
      role: UserRole.BROKER
    },
    {
      email: 'staff@hestiaplp.com.mx',
      name: 'Alice Staff',
      password: hashedPassword,
      role: UserRole.STAFF
    },
    {
      email: 'broker2@hestiaplp.com.mx',
      name: 'Bob Broker',
      password: hashedPassword,
      role: UserRole.BROKER
    }
  ];

  const createdUsers = [adminUser];
  for (const user of testUsers) {
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user
    });
    createdUsers.push(created);
    console.log(`Created/found user: ${created.name} with role ${created.role}`);
  }

  // Seed Packages
  console.log('Seeding packages...');
  for (const pkg of packagesData) {
    await prisma.package.upsert({
      where: { id: pkg.id },
      update: {
        name: pkg.name,
        price: pkg.price,
        description: pkg.description,
        features: JSON.stringify(pkg.features), // Store features as a JSON string
        ctaText: pkg.ctaText,
        ctaLink: pkg.ctaLink,
        highlight: pkg.highlight,
        percentage: pkg.percentage,
        minAmount: pkg.minAmount,
        shortDescription: pkg.shortDescription,
      },
      create: {
        id: pkg.id,
        name: pkg.name,
        price: pkg.price,
        description: pkg.description,
        features: JSON.stringify(pkg.features), // Store features as a JSON string
        ctaText: pkg.ctaText,
        ctaLink: pkg.ctaLink,
        highlight: pkg.highlight,
        percentage: pkg.percentage,
        minAmount: pkg.minAmount,
        shortDescription: pkg.shortDescription,
      },
    });
    console.log(`Created/updated package: ${pkg.name}`);
  }

  // Seed sample policies with the new schema
  const [adminUserData, brokerUser, staffUser, broker2User] = createdUsers;

  console.log('Seeding sample policies...');

  // Delete existing sample policies first to avoid conflicts
  await prisma.policy.deleteMany({
    where: {
      policyNumber: {
        in: ['POL-2024-SAMPLE-001', 'POL-2024-ACTIVE-001']
      }
    }
  });

  // Create a sample policy with actors
  const samplePolicy = await prisma.policy.create({
    data: {
      policyNumber: 'POL-2024-SAMPLE-001',
      propertyAddress: 'Av. Reforma 123, Col. Centro, Ciudad de México',
      propertyType: 'APARTMENT',
      rentAmount: 15000,
      totalPrice: 6000,
      guarantorType: 'JOINT_OBLIGOR',
      createdById: brokerUser.id,
      status: 'DRAFT',
      // Create primary landlord with enhanced fields
      landlords: {
        create: {
          isPrimary: true,  // Primary landlord
          isCompany: false,
          fullName: 'Juan Pérez García',
          email: 'juan.perez@example.com',
          phone: '5512345678',
          workPhone: '5598765432',
          personalEmail: 'juanperez.personal@gmail.com',
          rfc: 'PEGJ850101ABC',
          curp: 'PEGJ850101HDFRRN08',
          address: 'Av. Insurgentes 456, CDMX',
          bankName: 'BBVA',
          accountNumber: '0123456789',
          clabe: '012180001234567890',
          occupation: 'Empresario',
          employerName: 'Inmobiliaria Pérez SA de CV',
          requiresCFDI: true,
        }
      },
      // Create tenant with enhanced fields
      tenant: {
        create: {
          tenantType: 'INDIVIDUAL',
          fullName: 'María López Hernández',
          nationality: 'MEXICAN',
          curp: 'LOHM900515MDFRPR03',
          rfc: 'LOHM900515ABC',
          email: 'maria.lopez@example.com',
          phone: '5587654321',
          workPhone: '5511223344',
          currentAddress: 'Calle Palmas 789, Col. Lomas, CDMX',
          employmentStatus: 'employed',
          occupation: 'Gerente de Marketing',
          employerName: 'Tech Solutions México',
          employerAddress: 'Torre Mayor, Piso 15, CDMX',
          position: 'Gerente Senior',
          monthlyIncome: 45000,
          incomeSource: 'salary',
          paymentMethod: 'monthly',
          requiresCFDI: false,
        }
      },
    },
    include: {
      landlords: true,
      tenant: true,
    }
  });
  console.log(`Created sample policy: ${samplePolicy.policyNumber}`);

  // Create PropertyDetails for the sample policy
  await prisma.propertyDetails.create({
    data: {
      policyId: samplePolicy.id,
      isFurnished: false,
      parkingSpaces: 2,
      hasElectricity: true,
      hasWater: true,
      hasGas: true,
      hasInternet: true,
      petsAllowed: false,
    }
  });

  // Update Policy with financial details
  await prisma.policy.update({
    where: { id: samplePolicy.id },
    data: {
      hasIVA: true,
      issuesTaxReceipts: true,
      securityDeposit: 1,
      maintenanceFee: 2000,
      maintenanceIncludedInRent: false,
    }
  });
  console.log(`Created property details for policy: ${samplePolicy.policyNumber}`);

  // Create a joint obligor for the policy if it doesn't exist
  const existingJointObligor = await prisma.jointObligor.findFirst({
    where: {
      policyId: samplePolicy.id,
      email: 'carlos.rodriguez@example.com'
    }
  });

  const jointObligor = existingJointObligor || await prisma.jointObligor.create({
    data: {
      policyId: samplePolicy.id,
      isCompany: false,
      fullName: 'Carlos Rodríguez Martínez',
      email: 'carlos.rodriguez@example.com',
      phone: '5511223344',
      workPhone: '5599887766',
      nationality: 'MEXICAN',
      curp: 'ROMC850101HDFXXX00',
      rfc: 'ROMC850101XYZ',
      address: 'Calle Palmas 789, CDMX',
      employmentStatus: 'employed',
      occupation: 'Ingeniero',
      employerName: 'Tech Solutions SA de CV',
      employerAddress: 'Av. Universidad 1000, CDMX',
      position: 'Gerente',
      monthlyIncome: 45000,
      incomeSource: 'salary',
      guaranteeMethod: 'income',
      hasPropertyGuarantee: false,
      maritalStatus: 'single',
    }
  });
  console.log(`Created joint obligor: ${jointObligor.fullName}`);

  // Seed SystemConfig
  console.log('Seeding system configuration...');
  await prisma.systemConfig.upsert({
    where: { id: 'system-config-1' },
    update: { investigationFee: 200 },
    create: {
      id: 'system-config-1',
      investigationFee: 200,
      defaultTokenExpiry: 7,
    }
  });
  console.log('Created/updated system configuration');

  // Create another sample policy with company landlord and co-owner
  console.log('Creating additional sample policies...');
  const activePolicy = await prisma.policy.create({
    data: {
      policyNumber: 'POL-2024-ACTIVE-001',
      propertyAddress: 'Polanco 789, Ciudad de México',
      propertyType: 'HOUSE',
      rentAmount: 35000,
      totalPrice: 14000,
      guarantorType: 'AVAL',
      createdById: brokerUser.id,
      status: 'ACTIVE',
      submittedAt: new Date('2024-01-15'),
      approvedAt: new Date('2024-01-20'),
      activatedAt: new Date('2024-02-01'),
      packageId: 'premium',
      // Create primary company landlord and co-owner
      landlords: {
        createMany: {
          data: [
            {
              isPrimary: true,  // Primary company landlord
              isCompany: true,
              companyName: 'Inmobiliaria Polanco SA de CV',
              companyRfc: 'IPO990101ABC',
              legalRepName: 'Roberto Sánchez Villa',
              legalRepPosition: 'Director General',
              legalRepRfc: 'SAVR780202XYZ',
              legalRepPhone: '5511112222',
              legalRepEmail: 'roberto@inmopolanco.com',
              email: 'contacto@inmopolanco.com',
              phone: '5599887766',
              address: 'Bosques de las Lomas, CDMX',
              bankName: 'Santander',
              accountNumber: '9876543210',
              clabe: '014180987654321098',
              requiresCFDI: true,
              informationComplete: true,
              completedAt: new Date('2024-01-10'),
              verificationStatus: 'APPROVED',
            },
            {
              isPrimary: false,  // Co-owner (spouse)
              isCompany: false,
              fullName: 'Patricia Sánchez Villa',
              email: 'patricia.sanchez@example.com',
              phone: '5522334455',
              rfc: 'SAVP800315XYZ',
              curp: 'SAVP800315MDFSXX08',
              address: 'Bosques de las Lomas, CDMX',
              informationComplete: true,
              completedAt: new Date('2024-01-12'),
              verificationStatus: 'APPROVED',
            }
          ]
        }
      },
      // Create tenant company
      tenant: {
        create: {
          tenantType: 'COMPANY',
          companyName: 'Consultores Digitales SA de CV',
          companyRfc: 'CDI200315XYZ',
          legalRepName: 'Ana Martínez Torres',
          legalRepPosition: 'Representante Legal',
          legalRepRfc: 'MATA900515ABC',
          legalRepPhone: '5533445566',
          email: 'facturacion@consultoresdigitales.com',
          phone: '5544332211',
          companyAddress: 'Torre Reforma 500, CDMX',
          paymentMethod: 'biannual',
          requiresCFDI: true,
        }
      },
    },
    include: {
      landlords: true,
      tenant: true,
    }
  });
  console.log(`Created active policy: ${activePolicy.policyNumber} with ${activePolicy.landlords.length} landlord(s)`);

  // Create PropertyDetails for the active policy
  await prisma.propertyDetails.create({
    data: {
      policyId: activePolicy.id,
      isFurnished: true,
      parkingSpaces: 3,
      hasElectricity: true,
      hasWater: true,
      hasGas: true,
      hasCableTV: true,
      hasInternet: true,
      petsAllowed: true,
      hasInventory: true,
      hasRules: true,
    }
  });

  // Update Policy with financial details
  await prisma.policy.update({
    where: { id: activePolicy.id },
    data: {
      hasIVA: true,
      issuesTaxReceipts: true,
      securityDeposit: 2,
      maintenanceFee: 3500,
      maintenanceIncludedInRent: false,
      paymentMethod: 'bank_transfer',
    }
  });
  console.log(`Created property details for policy: ${activePolicy.policyNumber}`);

  // Create an aval for the active policy if it doesn't exist
  const existingAval = await prisma.aval.findFirst({
    where: {
      policyId: activePolicy.id,
      email: 'pedro.gonzalez@example.com'
    }
  });

  const aval = existingAval || await prisma.aval.create({
    data: {
      policyId: activePolicy.id,
      isCompany: false,
      fullName: 'Pedro González López',
      email: 'pedro.gonzalez@example.com',
      phone: '5566778899',
      workPhone: '5577889900',
      nationality: 'MEXICAN',
      curp: 'GOLP900303HDFXXX00',
      rfc: 'GOLP900303ABC',
      address: 'Santa Fe, CDMX',
      employmentStatus: 'self-employed',
      occupation: 'Empresario',
      employerName: 'Inmobiliaria González',
      position: 'Director General',
      monthlyIncome: 150000,
      incomeSource: 'business',
      // Property guarantee details
      propertyAddress: 'Lomas de Chapultepec 123, CDMX',
      propertyValue: 8000000,
      propertyDeedNumber: 'DEED-2020-4567',
      propertyRegistry: 'Registro Público CDMX',
      propertyTaxAccount: 'PRED-123456',
      propertyUnderLegalProceeding: false,
      guaranteeMethod: 'property',
      hasPropertyGuarantee: true,
      // Marriage info
      maritalStatus: 'married_separate',
      spouseName: 'Laura Martínez Ruiz',
      spouseRfc: 'MARL850515XYZ',
      spouseCurp: 'MARL850515MDFRRT09',
    }
  });
  console.log(`Created aval: ${aval.fullName}`);

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
