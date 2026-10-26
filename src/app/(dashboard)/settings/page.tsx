import { PageHeader } from "@/components/ui";
import { SettingsForm } from "@/components/settings/settings-form";
import { getSignatureDataUrl } from "@/lib/secure";
import { getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [settings, signature] = await Promise.all([getSettings(), getSignatureDataUrl()]);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Business details, invoice numbering, brand logo and the co-founder signature."
      />
      <SettingsForm settings={settings} signaturePreview={signature} />
    </div>
  );
}
