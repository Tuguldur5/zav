import { LegalPage } from "./LegalPage";
import { privacySections } from "@/content/legal";
import { TERMS_UPDATED_AT } from "@/lib/consent";
import { getSupportPhone } from "@/lib/settings";

export async function PrivacyScreen() {
  const phone = await getSupportPhone();
  return (
    <LegalPage
      title="Нууцлалын бодлого"
      lead="Бид ямар мэдээлэл цуглуулж, хэн юуг хардаг, хэзээ устгадаг тухай."
      updatedAt={TERMS_UPDATED_AT}
      sections={privacySections}
      supportPhone={phone}
    />
  );
}
