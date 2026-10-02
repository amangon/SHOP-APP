export const BUSINESS = {
  firmName: 'Shri Vijay Kaushal Ji Jeweller and Sons',
  branches: [
    {
      id: 'swarna-abhushan',
      name: 'Swarna Abhushan',
      address: 'Raja Mohalla, Near Sammay Mata Mandir, Vinod Talkies, Gonda',
      phone: '8318275167',
      whatsapp: '918318275167',
      contactPerson: 'Shubham',
      timing: '10:00 AM – 9:00 PM',
      closed: 'Wednesday Closed',
    },
    {
      id: 'wazirganj',
      name: 'Wazirganj Branch',
      address: 'Wazirganj Market, Near Police Station, Gonda–Ayodhya Road',
      phone: '9807779942',
      whatsapp: '919807779942',
      contactPerson: 'Ankit',
      timing: '10:00 AM – 9:00 PM',
      closed: 'Open 7 Days a Week',
    },
  ],
  primaryWhatsapp: '918318275167',
  primaryPhone: '+91 8318275167',
  contactEmail: 'info@shrivijaykaushaljijeweller.com',
  defaultCurrency: 'INR',
  defaultCity: 'Lucknow',
} as const;

export type BusinessBranch = typeof BUSINESS.branches[number];
