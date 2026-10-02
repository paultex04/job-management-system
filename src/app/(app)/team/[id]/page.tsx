import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import PageHeader from "@/components/page-header";
import PageTransition from "@/components/page-transition";
import Flash from "@/components/flash";
import DeleteButton from "@/components/delete-button";
import Avatar from "@/components/avatar";
import { deleteUser, updateTeamMember } from "@/actions";
import { first } from "@/lib/search";
import SubmitButton from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default async function TeamMemberPage({
  params,
  searchParams,
}: PageProps<"/team/[id]">) {
  const admin = await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const error = first(sp.error);
  const saved = first(sp.saved);

  const member = await prisma.user.findUnique({ where: { id } });
  if (!member) notFound();

  return (
    <PageTransition>
      <div className="max-w-2xl">
        <PageHeader
          title="Edit Team Member"
          description="Update details, role or reset the password."
        >
          <Button asChild variant="outline">
            <Link href="/team" transitionTypes={["nav-back"]}>
              Back to Team
            </Link>
          </Button>
          {member.id !== admin.id && (
            <DeleteButton
              action={deleteUser.bind(null, member.id)}
              confirmText={`Remove ${member.name} from the team?`}
              label="Remove"
            />
          )}
        </PageHeader>

        <Flash error={error} saved={saved} />

        <Card>
          <CardContent>
            <div className="mb-6 flex items-center gap-4">
              <Avatar
                src={member.avatar}
                name={member.name}
                size="size-14"
                textSize="text-lg"
              />
              <div>
                <div className="font-medium text-foreground">{member.name}</div>
                <div className="text-sm text-muted-foreground">
                  {member.email}
                </div>
              </div>
            </div>

            <form action={updateTeamMember.bind(null, member.id)}>
              <FieldGroup>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="name">Full name *</FieldLabel>
                    <Input
                      id="name"
                      name="name"
                      required
                      defaultValue={member.name}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="email">Email *</FieldLabel>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="off"
                      spellCheck={false}
                      defaultValue={member.email}
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="role">Role</FieldLabel>
                  <Select name="role" defaultValue={member.role}>
                    <SelectTrigger id="role" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="staff">
                          Staff — day-to-day access
                        </SelectItem>
                        <SelectItem value="manager">
                          Manager — broader access
                        </SelectItem>
                        <SelectItem value="admin">
                          Admin — full access, manages the team
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {member.id === admin.id && (
                    <FieldDescription className="text-warning">
                      You cannot change your own role.
                    </FieldDescription>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="newPassword">
                    New password{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    placeholder="Leave blank to keep the current password…"
                  />
                </Field>

                <div className="flex items-center gap-3">
                  <SubmitButton>Save Changes</SubmitButton>
                  <Button asChild variant="outline">
                    <Link href="/team" transitionTypes={["nav-back"]}>
                      Cancel
                    </Link>
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
