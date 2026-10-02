import { PackageIcon } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { getBusiness, getCurrency } from "@/lib/business";
import { updateBusiness } from "@/actions";
import PageHeader from "@/components/page-header";
import PageTransition from "@/components/page-transition";
import Flash from "@/components/flash";
import { first } from "@/lib/search";
import SubmitButton from "@/components/submit-button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES, currencySymbol, formatCurrency } from "@/lib/utils";

export default async function SettingsPage({
  searchParams,
}: PageProps<"/settings">) {
  await requireAdmin();
  const sp = await searchParams;
  const error = first(sp.error);
  const saved = first(sp.saved);

  const [business, currency] = await Promise.all([getBusiness(), getCurrency()]);

  return (
    <PageTransition>
      <div className="max-w-2xl">
        <PageHeader
          title="Business Details"
          description="Shown in the sidebar header and used across the workspace. Only admins can edit this."
        />

        <Flash error={error} saved={saved} />

        <Card>
          <CardContent>
            <form action={updateBusiness}>
              <FieldGroup>
                <div className="flex items-center gap-4">
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                    {business?.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={business.logo}
                        alt="Business logo"
                        width={64}
                        height={64}
                        className="size-full object-cover"
                      />
                    ) : (
                      <PackageIcon aria-hidden />
                    )}
                  </div>
                  <Field className="min-w-0 flex-1">
                    <FieldLabel htmlFor="logo">Logo</FieldLabel>
                    <Input
                      id="logo"
                      name="logo"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-muted"
                    />
                    <FieldDescription>
                      Square images look best · PNG, JPEG, WebP or GIF · max
                      20&nbsp;MB · automatically resized and optimized for the
                      web.
                    </FieldDescription>
                  </Field>
                </div>

                {business?.logo && (
                  <div className="flex items-center gap-2 text-sm">
                    <Checkbox id="removeLogo" name="removeLogo" />
                    <Label htmlFor="removeLogo">
                      Remove logo (fall back to the default icon)
                    </Label>
                  </div>
                )}

                <Field>
                  <FieldLabel htmlFor="name">Business name *</FieldLabel>
                  <Input
                    id="name"
                    name="name"
                    required
                    autoComplete="off"
                    defaultValue={business?.name ?? "OpenERP"}
                    placeholder="Acme Industries Ltd…"
                  />
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="email">Contact email</FieldLabel>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="off"
                      spellCheck={false}
                      defaultValue={business?.email ?? ""}
                      placeholder="name@company.com…"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="phone">Phone</FieldLabel>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="off"
                      defaultValue={business?.phone ?? ""}
                      placeholder="+1 555 0100…"
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="currency">Currency</FieldLabel>
                  <Select name="currency" defaultValue={currency}>
                    <SelectTrigger id="currency" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {CURRENCIES.map((option) => (
                          <SelectItem key={option.code} value={option.code}>
                            {option.code} —{" "}
                            {/* ZAR's symbol is the code itself; don't repeat it */}
                            {currencySymbol(option.code) === option.code
                              ? option.name
                              : `${currencySymbol(option.code)} ${option.name}`}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Every price, order total and figure in the workspace is shown
                    in this currency — for example{" "}
                    <span className="font-medium text-foreground">
                      {formatCurrency(1234.5, currency)}
                    </span>
                    .
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="address">Address</FieldLabel>
                  <Input
                    id="address"
                    name="address"
                    autoComplete="off"
                    defaultValue={business?.address ?? ""}
                    placeholder="1200 Market St, San Francisco, USA…"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="website">Website</FieldLabel>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    autoComplete="off"
                    spellCheck={false}
                    defaultValue={business?.website ?? ""}
                    placeholder="https://acme.example…"
                  />
                </Field>

                <div className="flex items-center gap-3">
                  <SubmitButton>Save Business Details</SubmitButton>
                </div>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
