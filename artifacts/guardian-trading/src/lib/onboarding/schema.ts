import { z } from "zod";

export const generalSchema = z.object({
  registrationType: z.string().min(1, "Please select a registration type"),
  product: z.string().min(1, "Please select a product"),
  howHeard: z.string().min(1, "Please select an option"),
});

export const personalSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  address: z.string().min(1, "Address is required"),
  aptSuite: z.string().optional(),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Enter a valid 5-digit ZIP code"),
  phoneNumber: z.string().min(10, "Enter a valid phone number"),
});

export const professionalSchema = z.object({
  employmentStatus: z.string().min(1, "Employment status is required"),
  employerName: z.string().optional(),
  occupation: z.string().optional(),
  employerAddress: z.string().optional(),
  employerCity: z.string().optional(),
  employerState: z.string().optional(),
  employerCountry: z.string().optional(),
  yearsEmployed: z.string().optional(),
  educationLevel: z.string().min(1, "Education level is required"),
});

export const idInformationSchema = z.object({
  countryOfCitizenship: z.string().min(1, "Country of citizenship is required"),
  taxIdType: z.string().min(1, "Tax ID type is required"),
  taxId: z.string().min(1, "Tax ID is required"),
  idType: z.string().min(1, "ID type is required"),
  idNumber: z.string().min(1, "ID number is required"),
  idState: z.string().optional(),
  idExpiration: z.string().min(1, "Expiration date is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
});

export const incomeSchema = z.object({
  annualIncome: z.string().min(1, "Annual income is required"),
  netWorth: z.string().min(1, "Net worth is required"),
  liquidNetWorth: z.string().min(1, "Liquid net worth is required"),
  taxBracket: z.string().min(1, "Tax bracket is required"),
});

export const riskToleranceSchema = z.object({
  investmentObjective: z.string().min(1, "Investment objective is required"),
  riskTolerance: z.string().min(1, "Risk tolerance is required"),
  timeHorizon: z.string().min(1, "Time horizon is required"),
  dividendReinvestment: z.string().optional(),
});

export const financialSituationSchema = z.object({
  annualExpenses: z.string().min(1, "Annual expenses is required"),
  specialExpenses: z.string().optional(),
  liquidity: z.string().min(1, "Liquidity preference is required"),
  federalTaxRate: z.string().optional(),
});

export const investmentExperienceSchema = z.object({
  investments: z.record(z.object({
    enabled: z.boolean(),
    years: z.string(),
    transactions: z.string(),
    knowledge: z.string(),
  })),
});

export const idProofUploadSchema = z.object({
  idType: z.string().min(1, "ID type is required"),
  frontUploaded: z.boolean().optional(),
  backUploaded: z.boolean().optional(),
});

export const fundingSchema = z.object({
  sourceOfFunds: z.array(z.string()).min(1, "Select at least one source of funds"),
  accountType: z.string().min(1, "Account type is required"),
  routingNumber: z.string().optional(),
  accountNumber: z.string().optional(),
  abaSwift: z.string().optional(),
  bankName: z.string().optional(),
});

export const disclosuresSchema = z.object({
  isDirector: z.string().optional(),
  isPoliticallyExposed: z.string().optional(),
  isFinraAffiliated: z.string().optional(),
  isInvestmentAdvisor: z.string().optional(),
});

export const signaturesSchema = z.object({
  consents: z.record(z.boolean()),
  tradingPlan: z.string().optional(),
  electronicDelivery: z.boolean(),
  signatureName: z.string().min(1, "Signature name is required"),
  hasSigned: z.boolean(),
});

export type GeneralFormData = z.infer<typeof generalSchema>;
export type PersonalFormData = z.infer<typeof personalSchema>;
export type ProfessionalFormData = z.infer<typeof professionalSchema>;
export type IdInformationFormData = z.infer<typeof idInformationSchema>;
export type IncomeFormData = z.infer<typeof incomeSchema>;
export type RiskToleranceFormData = z.infer<typeof riskToleranceSchema>;
export type FinancialSituationFormData = z.infer<typeof financialSituationSchema>;
export type InvestmentExperienceFormData = z.infer<typeof investmentExperienceSchema>;
export type IdProofUploadFormData = z.infer<typeof idProofUploadSchema>;
export type FundingFormData = z.infer<typeof fundingSchema>;
export type DisclosuresFormData = z.infer<typeof disclosuresSchema>;
export type SignaturesFormData = z.infer<typeof signaturesSchema>;
