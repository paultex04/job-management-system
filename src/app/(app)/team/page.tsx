import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { first } from "@/lib/search";
import { parseTableState } from "@/components/data-table/state";
import PageHeader from "@/components/page-header";
import PageTransition from "@/components/page-transition";
import Flash from "@/components/flash";
import SubmitButton from "@/components/submit-button";
import TeamTable from "./team-table";
import { createTeamMember } from "@/actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default async function TeamPage({
  searchParams,
}: PageProps<"/team">) {
  const currentUser = await requireUser();
  const isAdmin = currentUser.role === "admin";
  const sp = await searchParams;
  const error = first(sp.error);
  const saved = first(sp.saved);
  const msg = first(sp.msg);

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <PageTransition>
      <div className="flex flex-col lg:h-[calc(100svh-6rem)] lg:min-h-0 lg:overflow-hidden">
        <div className="shrink-0">
          <PageHeader
            title="Team"
            description={
              isAdmin
                ? "Manage who can access this workspace."
                : "Everyone with access to this workspace."
            }
          />

          <Flash error={error} saved={saved} msg={msg} />
        </div>

        <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-3">
          <div className="flex min-h-0 min-w-0 flex-col lg:col-span-2">
            <TeamTable
              data={users.map((member) => ({
                id: member.id,
                name: member.name,
                email: member.email,
                role: member.role,
                avatar: member.avatar,
                createdAt: member.createdAt,
              }))}
              initial={parseTableState(sp)}
              isAdmin={isAdmin}
              currentUserId={currentUser.id}
            />
          </div>

          <div className="min-h-0 min-w-0 overflow-auto">
            {isAdmin ? (
              <Card>
                <CardHeader>
                  <CardTitle asChild>
                    <h2>Invite a Teammate</h2>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form action={createTeamMember}>
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="name">Full name *</FieldLabel>
                        <Input
                          id="name"
                          name="name"
                          required
                          autoComplete="off"
                          placeholder="Jane Doe…"
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
                          placeholder="jane@company.com…"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="password">
                          Temporary password *
                        </FieldLabel>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          required
                          minLength={8}
                          autoComplete="new-password"
                          placeholder={"At least 8\u00A0characters…"}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="role">Role</FieldLabel>
                        <Select name="role" defaultValue="staff">
                          <SelectTrigger id="role" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="staff">Staff</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </Field>
                      <SubmitButton className="w-full">Add Member</SubmitButton>
                    </FieldGroup>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle asChild>
                    <h2>Need to Change Something?</h2>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Only workspace admins can invite teammates, edit their details
                    or change roles.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}