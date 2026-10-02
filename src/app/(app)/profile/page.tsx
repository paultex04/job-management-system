import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { THEMES } from "@/lib/utils";
import { changePassword, updateProfile, updateTheme } from "@/actions";
import PageHeader from "@/components/page-header";
import PageTransition from "@/components/page-transition";
import Flash from "@/components/flash";
import Avatar from "@/components/avatar";
import { first } from "@/lib/search";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SubmitButton from "@/components/submit-button";

export default async function ProfilePage({
  searchParams,
}: PageProps<"/profile">) {
  const sessionUser = await requireUser();
  const sp = await searchParams;
  const error = first(sp.error);
  const saved = first(sp.saved);

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) return null;

  return (
    <PageTransition>
      <div className="max-w-3xl">
        <PageHeader
          title="Your Profile"
          description="Manage your personal details, picture and appearance."
        />

        <Flash error={error} saved={saved} />

        <div className="flex flex-col gap-6">
          {/* --- Personal details --- */}
          <Card>
            <CardHeader>
              <CardTitle asChild>
                <h2>Personal Details</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action={updateProfile}>
                <FieldGroup>
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={user.avatar}
                      name={user.name}
                      size="size-16"
                      textSize="text-xl"
                    />
                    <Field className="min-w-0 flex-1">
                      <FieldLabel htmlFor="avatar">
                        Profile picture
                      </FieldLabel>
                      <Input
                        id="avatar"
                        name="avatar"
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-muted"
                      />
                      <FieldDescription>
                        PNG, JPEG, WebP or GIF · max 20&nbsp;MB · automatically
                        resized and optimized for the web.
                      </FieldDescription>
                    </Field>
                  </div>

                  {user.avatar && (
                    <div className="flex items-center gap-2 text-sm">
                      <Checkbox id="removeAvatar" name="removeAvatar" />
                      <Label htmlFor="removeAvatar">
                        Remove current picture
                      </Label>
                    </div>
                  )}

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="name">Full name *</FieldLabel>
                      <Input
                        id="name"
                        name="name"
                        required
                        autoComplete="name"
                        defaultValue={user.name}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="email">Email *</FieldLabel>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        spellCheck={false}
                        defaultValue={user.email}
                      />
                    </Field>
                  </div>

                  <div className="flex items-center gap-3">
                    <SubmitButton>Save Details</SubmitButton>
                    <span className="text-xs capitalize text-muted-foreground">
                      Role: {user.role}
                    </span>
                  </div>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          {/* --- Appearance --- */}
          <Card>
            <CardHeader>
              <CardTitle asChild>
                <h2>Appearance</h2>
              </CardTitle>
              <CardDescription>
                Pick a color theme. It is saved to your account and follows you
                to any device.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {THEMES.map((theme) => {
                  const active = user.theme === theme.id;
                  return (
                    <form key={theme.id} action={updateTheme}>
                      <input type="hidden" name="theme" value={theme.id} />
                      <button
                        type="submit"
                        className="swatch w-full text-left"
                        data-active={active}
                        aria-pressed={active}
                        title={`Apply ${theme.name} theme`}
                      >
                        <span
                          className="swatch-color"
                          style={{ background: theme.accent }}
                        />
                        <span className="mt-1 block px-1 pb-0.5 text-xs font-medium text-foreground">
                          {theme.name}
                          {active && (
                            <span className="text-muted-foreground"> ✓</span>
                          )}
                        </span>
                      </button>
                    </form>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* --- Password --- */}
          <Card>
            <CardHeader>
              <CardTitle asChild>
                <h2>Change password</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action={changePassword}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="currentPassword">
                      Current password
                    </FieldLabel>
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      autoComplete="current-password"
                      required
                    />
                  </Field>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="newPassword">
                        New password
                      </FieldLabel>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        autoComplete="new-password"
                        minLength={8}
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="confirmPassword">
                        Confirm new password
                      </FieldLabel>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        minLength={8}
                        required
                      />
                    </Field>
                  </div>
                  <SubmitButton>Update Password</SubmitButton>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
