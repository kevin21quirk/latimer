import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Seeds the location hierarchy: United Kingdom > Northamptonshire > Burton
// Latimer. Idempotent (upserts by slug) so it is safe to re-run.
async function main() {
  const uk = await prisma.location.upsert({
    where: { slug: 'united-kingdom' },
    update: {},
    create: { slug: 'united-kingdom', name: 'United Kingdom', type: 'COUNTRY' },
  });

  const county = await prisma.location.upsert({
    where: { slug: 'northamptonshire' },
    update: {},
    create: {
      slug: 'northamptonshire',
      name: 'Northamptonshire',
      type: 'COUNTY',
      parentId: uk.id,
    },
  });

  // Representative coordinates from postcodes.io (Burton Latimer).
  const town = await prisma.location.upsert({
    where: { slug: 'burton-latimer' },
    update: {},
    create: {
      slug: 'burton-latimer',
      name: 'Burton Latimer',
      type: 'TOWN',
      parentId: county.id,
      postcode: 'NN15',
      lat: 52.3637,
      lng: -0.6793,
    },
  });

  console.log('Seeded locations:', uk.name, '>', county.name, '>', town.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
