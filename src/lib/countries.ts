
export type Country = {
  code: string;
  name: string;
  dial_code: string;
};

export const countries: Country[] = [
  { "code": "IN", "name": "India", "dial_code": "+91" },
  { "code": "US", "name": "United States", "dial_code": "+1" },
  { "code": "GB", "name": "United Kingdom", "dial_code": "+44" },
  { "code": "CA", "name": "Canada", "dial_code": "+1" },
  { "code": "AU", "name": "Australia", "dial_code": "+61" },
  { "code": "DE", "name": "Germany", "dial_code": "+49" },
  { "code": "FR", "name": "France", "dial_code": "+33" },
  { "code": "JP", "name": "Japan", "dial_code": "+81" },
  { "code": "BR", "name": "Brazil", "dial_code": "+55" },
  { "code": "CN", "name": "China", "dial_code": "+86" },
];
