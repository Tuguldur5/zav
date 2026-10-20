export type JobSlot = "full" | "am" | "pm";

export type WizardData = {
  skillId: string;
  skillName: string;
  jobDate: string;
  jobSlot: JobSlot;
  districtId: string;
  addressNote: string;
  workersNeeded: number;
  payMode: "negotiate" | "amount";
  payOffer: string;
  description: string;
};

export const emptyWizard: WizardData = {
  skillId: "",
  skillName: "",
  jobDate: "",
  jobSlot: "full",
  districtId: "",
  addressNote: "",
  workersNeeded: 1,
  payMode: "negotiate",
  payOffer: "",
  description: "",
};
