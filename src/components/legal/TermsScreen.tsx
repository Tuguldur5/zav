import { LegalPage } from "./LegalPage";
import { termsSections } from "@/content/legal";
import { TERMS_UPDATED_AT } from "@/lib/consent";
import { getSupportPhone } from "@/lib/settings";

export async function TermsScreen() {
  const phone = await getSupportPhone();
  return (
    <LegalPage
      title="Үйлчилгээний нөхцөл"
      lead="“Зав байна” платформыг ашиглахад хамаарах нөхцөл."
      updatedAt={TERMS_UPDATED_AT}
      sections={termsSections}
      supportPhone={phone}
    />
  );
}
