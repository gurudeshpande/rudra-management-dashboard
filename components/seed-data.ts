// seed-data.ts
export const seedRawMaterials = [
  { name: "Small Jiretop", quantity: 100, unit: "pcs" },
  { name: "Kawdyachi Mala", quantity: 50, unit: "pcs" },
  { name: "Talwar", quantity: 200, unit: "pcs" },
  { name: "Jiretop", quantity: 75, unit: "pcs" },
];

export const seedProductStructures = [
  {
    productName: "Jiretop Sanch",
    rawMaterials: [
      { name: "Talwar", quantityRequired: 2 },
      { name: "Jiretop", quantityRequired: 1 },
      { name: "Kawdyachi Mala", quantityRequired: 1 },
    ],
  },
];
