const db = require('../models');

async function seedData() {
  try {
    // יצירת יזם
    const entrepreneur = await db.Entrepreneur.create({ name: 'Test Entrepreneur' });

    // יצירת אתר
    const site = await db.Site.create({ 
      name: 'Test Site', 
      entrepreneurId: entrepreneur.id 
    });

    // יצירת סוג ביקורת
    await db.InspectionType.create({ 
      name: 'Test Inspection Type', 
      siteId: site.id,
      formStructure: JSON.stringify({ field1: 'text', field2: 'checkbox' })
    });

    console.log('Test data seeded successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    process.exit();
  }
}

seedData();