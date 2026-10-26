"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleAlert, ImagePlus, Lock, Save, Trash2 } from "lucide-react";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { removeSignature as removeSignatureAction, updateSettings, uploadSignature } from "@/lib/actions";
import type { Settings } from "@/lib/types";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD"];

const MAX_BYTES = 1_500_000;

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file (PNG or JPG)."));
      return;
    }
    if (file.size > MAX_BYTES) {
      reject(new Error("Image is too large. Use a file under 1.5 MB."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(file);
  });
}

export function SettingsForm({
  settings,
  signaturePreview,
}: {
  settings: Settings;
  signaturePreview: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [signaturePending, startSignatureTransition] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [signatureSaved, setSignatureSaved] = useState("");

  const [companyName, setCompanyName] = useState(settings.companyName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [email, setEmail] = useState(settings.email);
  const [phone, setPhone] = useState(settings.phone);
  const [website, setWebsite] = useState(settings.website);
  const [address, setAddress] = useState(settings.address);
  const [gstin, setGstin] = useState(settings.gstin);
  const [currency, setCurrency] = useState(settings.currency);
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoicePrefix);
  const [nextNumber, setNextNumber] = useState(String(settings.nextNumber));
  const [signatoryName, setSignatoryName] = useState(settings.signatoryName);
  const [signatoryTitle, setSignatoryTitle] = useState(settings.signatoryTitle);
  const [footerNote, setFooterNote] = useState(settings.footerNote);
  const [signature, setSignature] = useState(signaturePreview);
  const [logo, setLogo] = useState(settings.logoUrl);

  const signatureInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  async function pickSignature(file: File | undefined) {
    if (!file) return;
    try {
      setError("");
      setSignatureSaved("");
      const previous = signature;
      const dataUrl = await readImage(file);
      setSignature(dataUrl);
      startSignatureTransition(async () => {
        const result = await uploadSignature(dataUrl);
        if (result.ok) {
          setSignatureSaved("Signature encrypted and saved on this device.");
          router.refresh();
        } else {
          setSignature(previous);
          setError(result.error);
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the signature.");
    }
  }

  function handleRemoveSignature() {
    setError("");
    setSignatureSaved("");
    startSignatureTransition(async () => {
      await removeSignatureAction();
      setSignature("");
      setSignatureSaved("Signature removed.");
      router.refresh();
    });
  }

  async function pickLogo(file: File | undefined) {
    if (!file) return;
    try {
      setError("");
      setLogo(await readImage(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the logo.");
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    if (!companyName.trim()) {
      setError("Company name is required.");
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await updateSettings({
        companyName,
        tagline,
        email,
        phone,
        website,
        address,
        gstin,
        currency,
        invoicePrefix,
        nextNumber: Number(nextNumber),
        signatoryName,
        signatoryTitle,
        footerNote,
        logoUrl: logo,
      });
      if (result.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        )}
        {saved && (
          <div className="flex items-start gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            Settings saved. New invoices will use these details.
          </div>
        )}

        <Card className="p-5 sm:p-6">
          <h2 className="font-display text-base font-bold text-ink-700">Business details</h2>
          <p className="text-xs text-slate-500">Shown in the invoice header and footer.</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Company name" htmlFor="companyName" required className="sm:col-span-2">
              <Input
                id="companyName"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
              />
            </Field>
            <Field label="Tagline" htmlFor="tagline" className="sm:col-span-2">
              <Input
                id="tagline"
                value={tagline}
                onChange={(event) => setTagline(event.target.value)}
                placeholder="A product by Setsuzoku"
              />
            </Field>
            <Field label="Email" htmlFor="companyEmail">
              <Input
                id="companyEmail"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Field label="Phone" htmlFor="companyPhone">
              <Input
                id="companyPhone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </Field>
            <Field label="Website" htmlFor="website">
              <Input
                id="website"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
              />
            </Field>
            <Field label="GSTIN / Tax ID" htmlFor="gstin" hint="Optional">
              <Input id="gstin" value={gstin} onChange={(event) => setGstin(event.target.value)} />
            </Field>
            <Field label="Address" htmlFor="address" className="sm:col-span-2">
              <Textarea
                id="address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                className="min-h-20"
              />
            </Field>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="font-display text-base font-bold text-ink-700">Invoice numbering</h2>
          <p className="text-xs text-slate-500">
            Numbers follow <span className="font-mono">PREFIX-YEAR-0000</span> and increment
            automatically.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Field label="Prefix" htmlFor="prefix">
              <Input
                id="prefix"
                value={invoicePrefix}
                onChange={(event) => setInvoicePrefix(event.target.value.toUpperCase())}
                className="font-mono uppercase"
                maxLength={12}
              />
            </Field>
            <Field label="Next number" htmlFor="nextNumber" hint="Next invoice to issue">
              <Input
                id="nextNumber"
                type="number"
                min="1"
                step="1"
                value={nextNumber}
                onChange={(event) => setNextNumber(event.target.value)}
              />
            </Field>
            <Field label="Currency" htmlFor="currency">
              <Select
                id="currency"
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
              >
                {CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Footer note" htmlFor="footerNote">
              <Textarea
                id="footerNote"
                value={footerNote}
                onChange={(event) => setFooterNote(event.target.value)}
                className="min-h-16"
              />
            </Field>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="font-display text-base font-bold text-ink-700">Signature</h2>
          <p className="text-xs text-slate-500">
            The co-founder signature is printed above the signature line on every invoice.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Signatory name" htmlFor="signatoryName">
              <Input
                id="signatoryName"
                value={signatoryName}
                onChange={(event) => setSignatoryName(event.target.value)}
                placeholder="e.g. Al Rihab"
              />
            </Field>
            <Field label="Signatory title" htmlFor="signatoryTitle">
              <Input
                id="signatoryTitle"
                value={signatoryTitle}
                onChange={(event) => setSignatoryTitle(event.target.value)}
                placeholder="Co-Founder"
              />
            </Field>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              ref={signatureInput}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(event) => {
                void pickSignature(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={signaturePending}
              onClick={() => signatureInput.current?.click()}
            >
              <ImagePlus className="size-4" />
              {signaturePending
                ? "Encrypting..."
                : signature
                  ? "Replace signature"
                  : "Upload signature"}
            </Button>
            {signature && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50"
                disabled={signaturePending}
                onClick={handleRemoveSignature}
              >
                <Trash2 className="size-4" />
                Remove
              </Button>
            )}
            <span className="text-[11px] text-slate-400">PNG with transparent background works best.</span>
          </div>

          <div className="mt-4 flex min-h-28 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4">
            {signature ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={signature}
                alt="Signature preview"
                className="max-h-24 w-auto object-contain"
              />
            ) : (
              <p className="text-xs text-slate-400">No signature uploaded yet</p>
            )}
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-[11px] leading-relaxed text-slate-500">
            <Lock className="mt-0.5 size-3.5 shrink-0 text-sz-teal" />
            <p>
              Signature is encrypted with AES-256-GCM before it touches disk. It is stored outside
              the public folder and only decrypted on the server to render invoices.
            </p>
          </div>

          {signatureSaved && (
            <p className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-brand-700">
              <CheckCircle2 className="size-3.5" />
              {signatureSaved}
            </p>
          )}
        </Card>
      </div>

      <div className="space-y-5 lg:sticky lg:top-24">
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-display text-base font-bold text-ink-700">Brand logo</h2>
            <p className="text-xs text-slate-500">Used on invoices and in the app.</p>
          </div>
          <div className="flex flex-col items-center gap-4 px-5 py-6">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt="Logo preview"
                className="size-24 rounded-2xl object-contain ring-1 ring-slate-200"
              />
            ) : (
              <div className="flex size-24 items-center justify-center rounded-2xl bg-brand-600 font-display text-3xl font-bold text-white">
                {companyName.slice(0, 1) || "E"}
              </div>
            )}
            <input
              ref={logoInput}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              className="hidden"
              onChange={(event) => {
                void pickLogo(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => logoInput.current?.click()}
              >
                <ImagePlus className="size-4" />
                Upload logo
              </Button>
              {logo !== "/logo.png" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setLogo("/logo.png")}
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-base font-bold text-ink-700">Invoice preview</h2>
          <p className="mt-0.5 text-xs text-slate-500">How your header will look</p>
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="size-9 rounded-lg object-contain" />
            ) : (
              <div className="flex size-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                {companyName.slice(0, 1) || "E"}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold text-ink-700">
                {companyName || "Company"}
              </p>
              <p className="truncate text-[11px] text-brand-700">{tagline || "Tagline"}</p>
            </div>
          </div>
          <div className="mt-3 space-y-1 text-[11px] text-slate-500">
            <p>Next invoice: <span className="font-mono text-ink-700">{invoicePrefix || "INV"}-{new Date().getFullYear()}-{String(Number(nextNumber) || 1).padStart(4, "0")}</span></p>
            <p>Currency: {currency}</p>
          </div>
          <Button type="submit" className="mt-4 w-full" disabled={pending}>
            <Save className="size-4" />
            {pending ? "Saving..." : "Save settings"}
          </Button>
        </Card>
      </div>
    </form>
  );
}
