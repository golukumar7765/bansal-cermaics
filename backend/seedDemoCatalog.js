require('dotenv').config();

const mongoose = require('mongoose');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Currency = require('./models/Currency');
const SiteContent = require('./models/SiteContent');

const categories = [
  { name: 'Alumina Labware', slug: 'demo-alumina-labware', storeType: 'B2B', description: 'High-temperature alumina laboratory ware.', sortOrder: 1 },
  { name: 'Alumina Crucibles & Labware', slug: 'demo-alumina-crucibles-labware', storeType: 'B2B', description: 'High-purity alumina crucibles, lids, discs and laboratory components.', sortOrder: 2 },
  { name: 'Quartz Labware', slug: 'demo-quartz-labware', storeType: 'B2B', description: 'Quartz vessels and tubes for laboratory use.', sortOrder: 2 },
  { name: 'Agate Grinding', slug: 'demo-agate-grinding', storeType: 'B2B', description: 'Agate mortars and pestles for sample preparation.', sortOrder: 3 },
  { name: 'Ceramic Drinkware', slug: 'demo-ceramic-drinkware', storeType: 'B2C', description: 'Everyday ceramic mugs and drinkware.', sortOrder: 1 },
  { name: 'Home Decor', slug: 'demo-home-decor', storeType: 'B2C', description: 'Hand-finished ceramic decor for home spaces.', sortOrder: 2 },
  { name: 'Kitchen Collection', slug: 'demo-kitchen-collection', storeType: 'B2C', description: 'Functional ceramic kitchen essentials.', sortOrder: 3 }
];

const productRows = [
  ['DEMO-B2B-ALU-001', 'High Alumina Crucible, 50 ml', 'Alumina Labware', 'B2B', 1250, 60, 2],
  ['DEMO-B2B-ALU-002', 'High Alumina Crucible, 100 ml', 'Alumina Labware', 'B2B', 1650, 45, 2],
  ['DEMO-B2B-QTZ-001', 'Quartz Evaporating Dish, 75 ml', 'Quartz Labware', 'B2B', 980, 35, 1],
  ['DEMO-B2B-AGA-001', 'Agate Mortar & Pestle, 80 mm', 'Agate Grinding', 'B2B', 3200, 18, 1],
  ['DEMO-B2C-MUG-001', 'Classic Ceramic Coffee Mug', 'Ceramic Drinkware', 'B2C', 349, 80, 1],
  ['DEMO-B2C-MUG-002', 'Hand-finished Tea Cup Set', 'Ceramic Drinkware', 'B2C', 799, 40, 1],
  ['DEMO-B2C-DEC-001', 'Minimal Ceramic Vase', 'Home Decor', 'B2C', 1199, 25, 1],
  ['DEMO-B2C-KIT-001', 'Stoneware Serving Bowl', 'Kitchen Collection', 'B2C', 899, 35, 1]
];

const aluminaDiscVariants = [10, 15, 20, 25, 28, 32, 38, 48, 58, 75, 90, 100, 115, 125, 150]
  .flatMap((diameter, index) => [
    { name: `${diameter} mm / AC995 (99.5%)`, sku: `DEMO-ALD-${diameter}-995`, price: 200 + index * 140, stock: 24, attributes: { Diameter: `${diameter} mm`, 'Grade (Purity Level)': 'AC995 (99.5%)' }, isActive: true },
    { name: `${diameter} mm / AC998 (99.8%)`, sku: `DEMO-ALD-${diameter}-998`, price: 260 + index * 300, stock: 18, attributes: { Diameter: `${diameter} mm`, 'Grade (Purity Level)': 'AC998 (99.8%)' }, isActive: true }
  ]);

async function seed() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required. Add it to backend/.env first.');
  await mongoose.connect(process.env.MONGO_URI);

  // The customer storefront intentionally offers only these four currencies.
  const allowedCurrencies = [
    ['INR', 'Indian Rupee', '₹', 1, true],
    ['USD', 'US Dollar', '$', 0.012, false],
    ['EUR', 'Euro', '€', 0.011, false],
    ['GBP', 'British Pound', '£', 0.0095, false]
  ];
  await Currency.updateMany({ code: { $nin: allowedCurrencies.map(([code]) => code) } }, { $set: { isActive: false } });
  for (const [code, name, symbol, rateFromBase, isBase] of allowedCurrencies) {
    await Currency.updateOne({ code }, { $set: { name, symbol, rateFromBase, isBase, isActive: true, decimalPlaces: 2, rateSource: 'demo-seed' } }, { upsert: true });
  }

  const categoryMap = new Map();
  for (const category of categories) {
    const record = await Category.findOneAndUpdate(
      { slug: category.slug },
      { $setOnInsert: { ...category, isActive: true, parent: null, specificationFields: [] } },
      { new: true, upsert: true }
    );
    categoryMap.set(category.name, record);
  }

  for (const [sku, name, categoryName, storeType, price, stock, moq] of productRows) {
    const category = categoryMap.get(categoryName);
    await Product.updateOne(
      { sku },
      {
        $setOnInsert: {
          sku, name, storeType, price, stock, moq,
          baseCurrency: 'INR', categoryId: category._id, category: category.name,
          shortDescription: `Demo ${storeType === 'B2B' ? 'scientific' : 'lifestyle'} product ready for storefront testing.`,
          description: `This is a demonstration product for ${category.name}. Replace its content, imagery and price before launch.`,
          specifications: [{ name: 'Demo status', value: 'Ready for testing' }],
          isDirectPurchaseAllowed: true, published: true, featured: true, archived: false,
          seo: { title: name, slug: sku.toLowerCase() }
        }
      },
      { upsert: true }
    );
  }

  const aluminaCategory = categoryMap.get('Alumina Crucibles & Labware');
  await Product.updateOne(
    { sku: 'DEMO-B2B-ALUDISC-001' },
    {
      $setOnInsert: {
        sku: 'DEMO-B2B-ALUDISC-001',
        name: 'Alumina Disc – Lid for Alumina Crucible',
        storeType: 'B2B',
        categoryId: aluminaCategory._id,
        category: aluminaCategory.name,
        price: 200,
        stock: aluminaDiscVariants.reduce((sum, variant) => sum + variant.stock, 0),
        moq: 1,
        baseCurrency: 'INR',
        imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1000&q=80',
        images: [{ url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1000&q=80', alt: 'High purity alumina disc for crucible lid', isPrimary: true, sortOrder: 0 }],
        shortDescription: 'High purity alumina disc designed as a lid for high-temperature laboratory crucibles up to 1750°C.',
        description: 'High-purity alumina ceramic discs engineered for use as crucible lids in high-temperature laboratory and industrial applications. Select the required diameter and purity grade to view the corresponding price and availability.',
        variants: aluminaDiscVariants,
        specifications: [
          { name: 'Material', value: 'High Purity Alumina Ceramic' },
          { name: 'Al₂O₃ Purity', value: 'Up to 99.8%' },
          { name: 'Maximum Temperature', value: '1750', unit: '°C' },
          { name: 'Sintered Density', value: '> 3.9', unit: 'g/cm³' },
          { name: 'Theoretical Density', value: '3.96', unit: 'g/cm³' },
          { name: 'Grain Size', value: '2–4', unit: 'microns' },
          { name: 'Country of Origin', value: 'India' },
          { name: 'Dispatch Time', value: '3–5 business days for in-stock variants' }
        ],
        features: ['High-purity alumina ceramic', 'Maximum operating temperature up to 1750°C', 'Dense structure with excellent thermal and chemical resistance', 'Suitable for advanced laboratory and furnace applications', 'Available in 99.5% and 99.8% purity grades'],
        applications: ['Metallurgy testing laboratories', 'Materials science research', 'Chemical analysis', 'Battery material testing', 'High temperature furnaces'],
        documents: [
          { name: 'Demo 99.8% Technical Datasheet', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', type: 'PDF' },
          { name: 'Demo Product Brochure', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', type: 'PDF' }
        ],
        isDirectPurchaseAllowed: true,
        published: true,
        featured: true,
        archived: false,
        seo: { title: 'Alumina Disc Lid for Crucible | High Purity Alumina', description: 'Demo configurable alumina disc with dynamic diameter and grade pricing.', keywords: ['alumina disc', 'crucible lid', 'high purity alumina'], slug: 'demo-alumina-disc-lid' }
      }
    },
    { upsert: true }
  );

  await SiteContent.updateOne(
    { singletonId: 'CMS_CONTENT' },
    {
      $setOnInsert: {
        singletonId: 'CMS_CONTENT',
        homeSlideshow: [
          { title: 'Scientific labware for demanding work', subtitle: 'Explore high-temperature alumina, quartz and agate products.', imageUrl: '/offers/scientific-labware-offer.png', ctaLabel: 'Shop scientific', ctaUrl: '/scientific', isActive: true, sortOrder: 1 },
          { title: 'New lifestyle ceramic collection', subtitle: 'Functional everyday pieces made for homes and gifting.', imageUrl: '/offers/lifestyle-ceramics-offer.png', ctaLabel: 'Shop lifestyle', ctaUrl: '/lifestyle', isActive: true, sortOrder: 2 }
        ]
      }
    },
    { upsert: true }
  );

  // Add demo slides to an older/empty CMS document without touching admin-made offers.
  await SiteContent.updateOne(
    { singletonId: 'CMS_CONTENT', $or: [{ homeSlideshow: { $exists: false } }, { homeSlideshow: { $size: 0 } }] },
    { $set: { homeSlideshow: [
      { title: 'Scientific labware for demanding work', subtitle: 'Explore high-temperature alumina, quartz and agate products.', imageUrl: '/offers/scientific-labware-offer.png', ctaLabel: 'Shop scientific', ctaUrl: '/scientific', isActive: true, sortOrder: 1 },
      { title: 'New lifestyle ceramic collection', subtitle: 'Functional everyday pieces made for homes and gifting.', imageUrl: '/offers/lifestyle-ceramics-offer.png', ctaLabel: 'Shop lifestyle', ctaUrl: '/lifestyle', isActive: true, sortOrder: 2 }
    ] } }
  );

  // Upgrade only the demo slides created by this seed; never touch admin-made offers.
  await SiteContent.updateOne(
    { singletonId: 'CMS_CONTENT' },
    { $set: { 'homeSlideshow.$[scientific].imageUrl': '/offers/scientific-labware-offer.png', 'homeSlideshow.$[lifestyle].imageUrl': '/offers/lifestyle-ceramics-offer.png' } },
    {
      arrayFilters: [
        { 'scientific.title': 'Scientific labware for demanding work' },
        { 'lifestyle.title': 'New lifestyle ceramic collection' }
      ]
    }
  );

  console.log(`Demo catalog ready: ${categories.length} categories, ${productRows.length + 1} products and homepage slides. Existing records were not overwritten.`);
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error('Demo catalog seed failed:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
